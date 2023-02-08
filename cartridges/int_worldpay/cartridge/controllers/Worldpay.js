'use strict';
/**
 * Controller that creates an order from the current basket. It's a pure processing controller and does
 * no page rendering. The controller is used by checkout and is called upon the triggered place order action.
 * It contains the actual logic to authorize the payment and create the order. The controller communicates the result
 * of the order creation process and uses a status object PlaceOrderError to set proper error states.
 * The calling controller is must handle the results of the order creation and evaluate any errors returned by it.
 *
 * @module controllers/Worldpay
 */
var Site = require('dw/system/Site');
var siteController = Site.getCurrent().getCustomPreferenceValue('siteController');
var siteCore = Site.getCurrent().getCustomPreferenceValue('siteCore');
var app = require(siteController + '/cartridge/scripts/app');
var guard = require(siteController + '/cartridge/scripts/guard');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var worldpayHelper = require('~/cartridge/scripts/worldpayHelper');
var PaymentMgr = require('dw/order/PaymentMgr');
var Countries = require(siteCore + '/cartridge/scripts/util/Countries');
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
var utils = require('*/cartridge/scripts/common/utils');
var serviceFacade = require('*/cartridge/scripts/service/serviceFacade');
var StringUtils = require('dw/util/StringUtils');
var Resource = require('dw/web/Resource');
var ArrayList = require('dw/util/ArrayList');
var sessionObject = session;
var requestObject = request;
var customerObject = customer;
/**
 * Verifies a credit card against a valid card number and expiration date and possibly invalidates invalid form fields.
 * If the verification was successful a credit card payment instrument is created.
 * @param {Object} args - Arguments
 * @return {Object} returns a result object
 */
function handle(args) {
    var result = worldpayHelper.handle(args);
    return result;
}

/**
 * Authorize call for worldpay processor
 * @param {Object} args - Arguments
 * @return {Object} returns a result object
 */
function authorize(args) {
    var result = worldpayHelper.authorize(args);
    return result;
}

/**
 * APM lookup for worldpay processor
 */
function apmLookupService() {
    var BasketMgr = require('dw/order/BasketMgr');
    var paymentAmount = BasketMgr.getCurrentBasket().totalGrossPrice.value;
    if (requestObject.httpParameterMap.billingCountry.value && paymentAmount > 0) {
        var paymentMethods = PaymentMgr.getApplicablePaymentMethods(customerObject, requestObject.httpParameterMap.billingCountry.value.toUpperCase(), paymentAmount);
        var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
        var worldpayPreferences = new WorldpayPreferences();
        var preferences = worldpayPreferences.worldpayPreferencesInit();

        var applicablePMResult = require('*/cartridge/scripts/order/worldpayPayment').applicablePaymentMethods(paymentMethods, request.httpParameterMap.billingCountry.value, preferences);
        var applicableAPMs = applicablePMResult.applicableAPMs;
        app.getView({
            APMList: applicableAPMs
        }).render('apmlookupoptions');
    }
}

/**
 * Handles the failed order implementation
 * @param {Object} order - Order Object
 * @param {string} errorMessage - errorMessage
 * @return {JSON} returns an JSON object
 */
function failImpl(order, errorMessage) {
    var orderstatus;
    Transaction.wrap(function () {
        orderstatus = OrderMgr.failOrder(order, true);
    });
    if (orderstatus && !orderstatus.isError()) {
        app.getController('COBilling').Start({// eslint-disable-line
            errorMessage: errorMessage
        });
        return {
            error: false
        };
    }
    return {
        error: true,
        errorMessage: errorMessage
    };
}

/**
 * Handles the failed order
 * @return {JSON} returns an JSON object
 */
function failOrder() {
    var order;
    if (sessionObject.privacy.order_id) {
        order = OrderMgr.getOrder(sessionObject.privacy.order_id);
    }
    if (order) {
        if (failImpl(order, '').error) {
            return app.getController('COSummary').Start();// eslint-disable-line
        }
    } else {
        app.getController('Cart').Show();// eslint-disable-line
    }
    return { success: false };
}

/**
 * Handle 3D response for worldpay processor
 * @param {Object} args - Arguments
 * @return {JSON} returns an JSON object
 */
function handleAuthenticationResponse() {
    var params = requestObject.getHttpParameters();
    var error = null;
    var orderObj;
    // md - merchant supplied data contains the OrderNo
    var md = (params.containsKey('MD')) ? params.get('MD')[0] : null;
    var orderNo = md;

    if (!orderNo) {
        Logger.getLogger('worldpay').error(
                'Worldpay.ds HandleAuthenticationResponse :  Order no. not present in parameters');
        error = utils.worldpayErrorMessage();
        failOrder();
        return {
            error: true,
            success: false,
            errorMessage: error.errorMessage
        };
    }

    try {
        orderObj = OrderMgr.getOrder(orderNo);
    } catch (ex) {
        Logger.getLogger('worldpay').error('Worldpay.ds HandleAuthenticationResponse :  Invalid Order ');
        error = utils.worldpayErrorMessage();
        failOrder();
        return {
            error: true,
            success: false,
            errorMessage: error.errorMessage
        };
    }

    // Fetch the APM Name from the Payment isntrument.
    var paymentIntrument = utils.getPaymentInstrument(orderObj);
    var apmName = paymentIntrument.getPaymentMethod();
    // Fetch the APM Type from the Payment Method i.e. if the Payment Methoid is of DIRECT or REDIRECT type.
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    WorldpayPreferences = new WorldpayPreferences();
    var preferences = WorldpayPreferences.worldPayPreferencesInit(paymentMthd);

    if (preferences.missingPreferences()) {
        Logger.getLogger('worldpay').error(
                'Worldpay.ds HandleAuthenticationResponse : Worldpay preferences are not properly set.');
        error = utils.worldpayErrorMessage();
        failImpl(orderObj, error.errorMessage);
        return {
            error: true,
            success: false,
            errorMessage: error.errorMessage,
            orderNo: orderObj.orderNo,
            orderToken: orderObj.orderToken
        };
    }

    var paRes = (params.containsKey('PaRes')) ? params.get('PaRes')[0] : null;

    // Checks if paRes is exist in error codes (Issuer Response fro 3D check)
    if (!paRes || paRes.equals(worldpayConstants.UNKNOWN_ENTITY) || paRes.equals(worldpayConstants.CANCELLEDBYSHOPPER)
            || paRes.equals(worldpayConstants.THREEDERROR) || paRes.equals(worldpayConstants.THREEDSINVALIDERROR)
            || paRes.equals(worldpayConstants.NOT_IDENTIFIED_NOID)) {
        var errorMessage = utils.getErrorMessage(paRes);
        Logger.getLogger('worldpay').error(
                'Worldpay.js HandleAuthenticationResponse : issuerResponse Error Message : ' + errorMessage);
        failImpl(orderObj, errorMessage);
        return {
            error: true,
            success: false,
            errorMessage: errorMessage,
            issuerResponse: errorMessage,
            orderNo: orderObj.orderNo,
            orderToken: orderObj.orderToken
        };
    }
    // Capturing Issuer Response
    var cardNumber = sessionObject.forms.billing.paymentMethods.creditCard.number.value;
    var encryptedData = sessionObject.forms.billing.paymentMethods.creditCard.encryptedData.value;
    var cvn = sessionObject.forms.billing.paymentMethods.creditCard.cvn.value;
    var echoData = sessionObject.privacy.echoData;
    var cardOrderObj = {
        cvn: cvn,
        cardNumber: cardNumber,
        md: md,
        paRes: paRes
    };
    var SecondAuthorizeRequestResult = serviceFacade.secondAuthorizeRequestService(orderObj, requestObject, paymentIntrument, preferences, echoData, encryptedData, cardOrderObj);

    if (SecondAuthorizeRequestResult.error) {
        Logger.getLogger('worldpay').error(
                'Worldpay.js HandleAuthenticationResponse : ErrorCode : ' + SecondAuthorizeRequestResult.errorCode
                        + ' : Error Message : ' + SecondAuthorizeRequestResult.errorMessage);
        failImpl(orderObj, SecondAuthorizeRequestResult.errorMessage);
        return {
            error: true,
            success: false,
            errorCode: SecondAuthorizeRequestResult.errorCode,
            errorMessage: SecondAuthorizeRequestResult.errorMessage,
            orderNo: orderObj.orderNo,
            orderToken: orderObj.orderToken
        };
    }

    // success handling
    if (sessionObject.privacy.order_id) {
        orderObj = OrderMgr.getOrder(sessionObject.privacy.order_id);
    }

    if (!orderObj) {
        app.getController('Cart').Show();// eslint-disable-line
        return { error: true, success: false };
    }
    if (orderObj.getStatus().value === Order.ORDER_STATUS_FAILED) {
        Transaction.wrap(function () {
            orderObj.custom.worldpayMACMissingVal = true;
        });
        error = utils.worldpayErrorMessage();
        app.getController('COBilling').Start({// eslint-disable-line
            errorMessage: error.errorMessage
        });
        return {
            error: true,
            success: false,
            errorMessage: error.errorMessage
        };
    }
    var customerObj = orderObj.customer.authenticated ? orderObj.customer : null;
    var tokenProcessutils = require('*/cartridge/scripts/common/tokenProcessutils');
    var resultCheckAuthorization = tokenProcessutils.checkAuthorization(SecondAuthorizeRequestResult.response, paymentIntrument, customerObj);
    if (resultCheckAuthorization.error) {
        failImpl(orderObj, resultCheckAuthorization.errorMessage);
        return {
            error: true,
            success: false,
            errorMessage: resultCheckAuthorization.lastEvent
        };
    }
    if (app.getController('COPlaceOrder').SubmitImpl(orderObj).error) {// eslint-disable-line
        app.getController('COSummary').Start();// eslint-disable-line
        return { error: true, success: false };
    }
    app.getController('COSummary').ShowConfirmation(orderObj);// eslint-disable-line
    return { error: false, success: true };
}

/**
 * Notification for worldpay processor
 * @return {JSON} returns an JSON object
 */
function notify() {
    var isValidateIPAddress = Boolean(Site.getCurrent().getCustomPreferenceValue('ValidateIPAddress'));
    if (isValidateIPAddress) {
        var validateIPStatus = utils.validateIP();
        if (validateIPStatus.error) {
            return {
                error: true,
                success: false
            };
        }
    }
    var xmlString;
    xmlString = requestObject.httpParameterMap.requestBodyAsString;
    if (!xmlString) {
        Logger.getLogger('worldpay').error('Worldpay-Notify : Add Custom Object : xmlString IS NULL');
        return {
            error: true
        };
    }
    if (utils.addNotifyCustomObject(xmlString).error) {
        Transaction.wrap(function () {
            return {
                error: true
            };
        });
    }
    app.getView().render('notifyResponsejson');
    return {
        error: false
    };
}

/**
* Service to get Notification updates (latest update and all updates) based on parameter "allupdates"
*/
function getNotificationUpdates() {
    var params = requestObject.getHttpParameters();
    var orderNo = (params.containsKey('orderNo')) ? params.get('orderNo')[0] : null;
    var allupdates = (params.containsKey('allupdates')) ? params.get('allupdates')[0] : '';
    var ErrorCode;
    var ErrorMessage;
    var orderObj;
    if (orderNo) {
        try {
            orderObj = OrderMgr.getOrder(orderNo);
        } catch (ex) {
            ErrorCode = Resource.msg('notify.error.code120', 'worldpayerror', null);
            ErrorMessage = utils.getErrorMessage(ErrorCode);
            app.getView({
                ErrorCode: ErrorCode,
                ErrorMessage: ErrorMessage
            }).render('errorjson');
            return;
        }
        if (orderObj) {
            try {
                var statusHist = orderObj.custom.transactionStatus;
                var statusList = new ArrayList(statusHist);
                if (!statusList || statusList.length <= 0) {
                    if (allupdates.equalsIgnoreCase('true')) {
                        ErrorCode = worldpayConstants.NOTIFYERRORCODE118;
                    } else {
                        ErrorCode = worldpayConstants.NOTIFYERRORCODE119;
                    }
                    ErrorMessage = utils.getErrorMessage(ErrorCode);
                    app.getView({
                        ErrorCode: ErrorCode,
                        ErrorMessage: ErrorMessage
                    }).render('errorjson');
                } else if (allupdates.equalsIgnoreCase('true')) {
                    app.getView({
                        statusList: statusList
                    }).render('allstatusjson');
                } else {
                    app.getView({
                        status: statusList.get(0)
                    }).render('lateststatusjson');
                }
            } catch (ex) {
                var errorCode = worldpayConstants.NOTIFYERRORCODE115;
                var errorMessage = utils.getErrorMessage(errorCode);
                Logger.getLogger('worldpay').error('Order Notification : Get All Status Update Notifications recieved : ' + errorCode + ' : ' + errorMessage + ' : ' + ex);
                app.getView({
                    ErrorCode: errorCode,
                    ErrorMessage: errorMessage
                }).render('errorjson');
            }
            return;
        }
    }
    ErrorCode = Resource.msg('notify.error.code120', 'worldpayerror', null);
    ErrorMessage = utils.getErrorMessage(ErrorCode);
    app.getView({
        ErrorCode: ErrorCode,
        ErrorMessage: ErrorMessage
    }).render('errorjson');
    return;
}

/**
 * This function take the user to billing page.
 * @param {Object} selectedPayment - selected payment method in an order
 * @param {Object} paymentStatus - payment status arrived in request
 * @param {Object} orderInfo - redirect request Object
 * @param {Object} order - Order Object
 * @return {JSON} returns an JSON object
 */
function failureStatusOrderPlacement(selectedPayment, paymentStatus, orderInfo, order) {
    var error;
    if (!selectedPayment.equals(worldpayConstants.KLARNA) && !selectedPayment.equals(worldpayConstants.IDEAL) && !selectedPayment.equals(worldpayConstants.PAYPAL) && !selectedPayment.equals(worldpayConstants.WORLDPAY) && !selectedPayment.equals(worldpayConstants.CHINAUNIONPAY)) {
        if (paymentStatus
                && (paymentStatus.equals(worldpayConstants.CANCELLEDSTATUS) || paymentStatus.equals(worldpayConstants.REFUSED))) {
            if (utils.verifyMac(orderInfo.mac,
                    orderInfo.orderKey, orderInfo.orderAmount, orderInfo.orderCurrency, orderInfo.orderStatus).error) {
                app.getController('Cart').Show();// eslint-disable-line
                return {
                    success: false
                };
            }
            if (paymentStatus && paymentStatus.equals(worldpayConstants.CANCELLEDSTATUS)) {
                Transaction.wrap(function () {
                    order.custom.transactionStatus = new ArrayList('POST_AUTH_CANCELLED');// eslint-disable-line
                    return {
                        success: false
                    };
                });
            }
        }
    }
    error = utils.worldpayErrorMessage();
    if (selectedPayment.equals(worldpayConstants.KONBINI)) {
        Transaction.wrap(function () { OrderMgr.cancelOrder(order); });
        app.getController('Cart').Show();// eslint-disable-line
    } else {
        Transaction.wrap(function () { OrderMgr.failOrder(order); });
        app.getController('COBilling').Start({// eslint-disable-line
            errorMessage: error.errorMessage
        });
    }
    return {
        success: false
    };
}

/**
 * This function place the order in pending state and fails rest of the case.
 * @param {Object} selectedPayment - selected payment method in an order
 * @param {Object} order - Order Object
 * @return {JSON} returns an JSON object
 */
function pendingStatusOrderPlacement(selectedPayment, order) {
    var error;
    if (selectedPayment.equals(worldpayConstants.KONBINI)) {
        Transaction.wrap(function () { OrderMgr.cancelOrder(order); });
        app.getController('Cart').Show();// eslint-disable-line
        return {
            success: false
        };
    }
    var PendingStatus = requestObject.httpParameterMap.status.value;
    if (!PendingStatus || PendingStatus.equals(worldpayConstants.OPEN)) {
        if (order.status.value === Order.ORDER_STATUS_FAILED) {
            error = utils.worldpayErrorMessage();
            app.getController('COBilling').Start({// eslint-disable-line
                errorMessage: error.errorMessage
            });
            return {
                success: false
            };
        }
        // Send order confirmation and clear used forms within the checkout process.
        utils.sendEmailNotification(order);
        // Clears all forms used in the checkout process.
        worldpayHelper.worldPayClearFormElement();
        app.getController('COSummary').ShowConfirmation(order);// eslint-disable-line
        return {
            success: false
        };
    }
    error = utils.worldpayErrorMessage();
    failImpl(order, error.errorMessage);
    return {
        error: true,
        success: false,
        errorMessage: error.errorMessage
    };
}

/**
 * This function places order of authorise state.
 * @param {Object} selectedPayment - selected payment method in an order
 * @param {Object} orderInfo - redirect request Object
 * @param {Object} order - Order Object
 * @return {JSON} returns an JSON object
 */
function authStatusOrderPlacement(selectedPayment, orderInfo, order) {
    var error;
    if (!selectedPayment.equals(worldpayConstants.KLARNA) && !selectedPayment.equals(worldpayConstants.IDEAL)
            && !selectedPayment.equals(worldpayConstants.PAYPAL)
            && !selectedPayment.equals(worldpayConstants.WORLDPAY)
            && !selectedPayment.equals(worldpayConstants.CHINAUNIONPAY)) {
        var macstatus = utils.verifyMac(orderInfo.mac, orderInfo.orderKey, orderInfo.orderAmount,
                orderInfo.orderCurrency, orderInfo.orderStatus);
        if (macstatus.error) {
            Transaction.wrap(function () {
                order.custom.worldpayMACMissingVal = true;// eslint-disable-line
            });
            error = utils.worldpayErrorMessage();
            failImpl(order, error.errorMessage);
            Logger.getLogger('worldpay').error(' mac issue ');
            return {
                error: true,
                success: false,
                errorMessage: error.errorMessage
            };
        }
    }
    sessionObject.privacy.order_id = '';
    if (order.status.value === Order.ORDER_STATUS_FAILED) {
        Transaction.wrap(function () {
            order.custom.worldpayMACMissingVal = true;// eslint-disable-line
        });
        error = utils.worldpayErrorMessage();
        app.getController('COBilling').Start({// eslint-disable-line
            errorMessage: error.errorMessage
        });
        return {
            success: false
        };
    }
    var klarnasnippet;
    if (selectedPayment.equals(worldpayConstants.KLARNA)) {
        // Service Request - for Klarna Confirmation Inquiry
        var paymentMthd = PaymentMgr.getPaymentMethod(worldpayConstants.KLARNA);
        var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
        WorldpayPreferences = new WorldpayPreferences();
        var preferences = WorldpayPreferences.worldPayPreferencesInit(paymentMthd);
        var confirmationRequestKlarnaResult = serviceFacade.confirmationRequestKlarnaService(order.orderNo, preferences, preferences.merchantCode);
        if (confirmationRequestKlarnaResult.error) {
            Logger.getLogger('worldpay').error(
                    'COPlaceOrder.js HandleAuthenticationResponse : ErrorCode : '
                            + confirmationRequestKlarnaResult.errorCode + ' : Error Message : '
                            + confirmationRequestKlarnaResult.errorMessage);
            failImpl(order, confirmationRequestKlarnaResult.errorMessage);
            app.getController('COBilling').Start({// eslint-disable-line
                errorMessage: confirmationRequestKlarnaResult.errorMessage
            });
            return {
                success: false
            };
        }
        klarnasnippet = confirmationRequestKlarnaResult.response.reference.toString();
        klarnasnippet = StringUtils.decodeString(StringUtils.decodeBase64(klarnasnippet), StringUtils.ENCODE_TYPE_HTML);
        klarnasnippet = klarnasnippet.replace(new RegExp('/window.location.href/g'), 'window.top.location.href');
    }
    return {
        success: true,
        klarnasnippet: klarnasnippet
    };
}

/**
 * Handle redirection for redirect credit card response or APM where Mac is compared for Authorized and Refused
 * @param {Object} order - Order Object
 * @return {JSON} returns an JSON object
 */
function handleRedirection(order) {
    if (!order) {
        app.getController('Cart').Show();// eslint-disable-line
        return {
            success: false
        };
    }
    var paymentStatus = requestObject.httpParameterMap.paymentStatus.value;
    var orderInfo = utils.getWorldpayOrderInfo(paymentStatus);
    var selectedPayment = sessionObject.forms.billing.paymentMethods.selectedPaymentMethodID.value.toString();
    if (paymentStatus && paymentStatus.equals(worldpayConstants.AUTHORIZED)) {
        return authStatusOrderPlacement(selectedPayment, orderInfo, order);
    } else if (paymentStatus && paymentStatus.equals(worldpayConstants.PENDING)) {
        return pendingStatusOrderPlacement(selectedPayment, order);
    }
        // else block
    return failureStatusOrderPlacement(selectedPayment, paymentStatus, orderInfo, order);
}

/**
 * Load payment methods
 */
function loadPaymentMethods() {
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var cart;
    cart = app.getModel('Cart').get();
    var applicableCreditCards = app.getController('COBilling').InitCreditCardList(cart).ApplicableCreditCards;// eslint-disable-line
    var paymentAmount = cart.getNonGiftCertificateAmount();
    var countryCode;
    countryCode = cart.object.billingAddress && cart.object.billingAddress.countryCode.value ? cart.object.billingAddress.countryCode.value : Countries.getCurrent({
        CurrentRequest: {
            locale: requestObject.locale
        }
    }).countryCode;

    app.getView({
        ApplicableCreditCards: applicableCreditCards,
        ApplicablePaymentCards: PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD).getApplicablePaymentCards(customerObject, countryCode, paymentAmount.value),
        Basket: cart.object,
        selectedPaymentID: requestObject.httpParameterMap.selectedPaymentMethodId.value
    }).render('worldpaypaymentmethods');
}

/**
 * Validates the order id and token upon match it will proceed for capture service initiation
 */
function testCaptureService() {
    var params = requestObject.getHttpParameters();
    var orderId = (params.containsKey('order_id')) ? params.get('order_id')[0] : null;
    var orderToken = (params.containsKey('order_token')) ? params.get('order_token')[0] : null;
    var order = OrderMgr.getOrder(orderId);
    if (order && orderId && orderToken && orderId.equals(order.orderNo) && orderToken.equals(order.orderToken)) {
        var CaptureServiceRequestResult = serviceFacade.createCaptureService(
                orderId);
        if (CaptureServiceRequestResult.error) {
            app.getView({
                serviceResponse: {
                    errorCode: CaptureServiceRequestResult.errorCode,
                    errorMessage: CaptureServiceRequestResult.errorMessage
                }
            }).render('/service/capture_service');
        } else {
            app.getView({
                serviceResponse: CaptureServiceRequestResult.response
            }).render('/service/capture_service');
        }
    } else {
        app.getView({
            serviceResponse: {
                errorCode: Resource.msg('worldpay.error.codeCAPTURE', 'worldpayerror', null),
                errorMessage: Resource.msg('worldpay.error.codeCAPTURE', 'worldpayerror', null)
            }
        }).render('/service/capture_service');
    }
}
/**
 * function to initiate Device data collection
 */
function Ddc() {
    var threeDFlexHelper = require('*/cartridge/scripts/common/threeDFlexHelper');
    var intJwtResult = threeDFlexHelper.initJwtcreation();
    var cardNumber = requestObject.httpParameterMap.cardNum.value;
    var Bin = cardNumber.slice(0, 6);
    var JWTdata = {
        jti: intJwtResult.jti,
        iat: intJwtResult.iat,
        iss: intJwtResult.iss,
        OrgUnitId: intJwtResult.OrgUnitId
    };
    var JWT = threeDFlexHelper.createJwt(JWTdata, intJwtResult.jwtMacKey);
    app.getView({
        Bin: Bin,
        JWT: JWT
    }).render('ddcIframe');
    return;
}

/**
 * Captures Session Id as a result of device data collection. This would be used as a part of first request for 3ds2
 */
function Sess() {
    var BasketMgr = require('dw/order/BasketMgr');
    var sessionID = requestObject.httpParameterMap.dataSessionId;
    var basket = BasketMgr.getCurrentBasket();
    Transaction.wrap(function () {
        basket.custom.dataSessionID = sessionID;
    });
}

/**
 * Handle 3DS Flex response for worldpay processor
 * @return {JSON} returns an JSON object
 */
function Handle3ds() {
    var params = requestObject.getHttpParameters();
    var error = null;
    var orderObj;
    // md - merchant supplied data contains the OrderNo
    var md = (params.containsKey('MD')) ? params.get('MD')[0] : null;
    var orderNo = md;
    if (!orderNo) {
        Logger.getLogger('worldpay').error(
            'Worldpay.ds HandleAuthenticationResponse :  Order no. not present in parameters');
        error = utils.worldpayErrorMessage();
        failOrder(orderObj, error.errorMessage);
        return {
            error: true,
            success: false,
            errorMessage: error.errorMessage
        };
    }
    try {
        orderObj = OrderMgr.getOrder(orderNo);
    } catch (ex) {
        Logger.getLogger('worldpay').error('Worldpay.ds HandleAuthenticationResponse :  Invalid Order ');
        error = utils.worldpayErrorMessage();
        failOrder(orderObj, error.errorMessage);
        return {
            error: true,
            success: false,
            errorMessage: error.errorMessage
        };
    }
    // Fetch the APM Name from the Payment isntrument.
    var paymentIntrument = utils.getPaymentInstrument(orderObj);
    var apmName = paymentIntrument.getPaymentMethod();
    // Fetch the APM Type from the Payment Method i.e. if the Payment Methoid is of DIRECT or REDIRECT type.
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    WorldpayPreferences = new WorldpayPreferences();
    var preferences = WorldpayPreferences.worldPayPreferencesInit(paymentMthd);
    if (preferences.missingPreferences()) {
        Logger.getLogger('worldpay').error(
            'Worldpay.ds HandleAuthenticationResponse : Worldpay preferences are not properly set.');
        error = utils.worldpayErrorMessage();
        failImpl(orderObj, error.errorMessage);
        return {
            error: true,
            success: false,
            errorMessage: error.errorMessage,
            orderNo: orderObj.orderNo,
            orderToken: orderObj.orderToken
        };
    }
    var SecondAuthorizeRequestResult = require('*/cartridge/scripts/service/serviceFacade').secondAuthorizeRequestService2(orderNo, paymentIntrument, null, preferences);
    if (SecondAuthorizeRequestResult.error) {
        Logger.getLogger('worldpay').error(
            'Worldpay.js HandleAuthenticationResponse : ErrorCode : ' + SecondAuthorizeRequestResult.errorCode +
            ' : Error Message : ' + SecondAuthorizeRequestResult.errorMessage);
        failImpl(orderObj, SecondAuthorizeRequestResult.errorMessage);
        return {
            error: true,
            success: false,
            errorCode: SecondAuthorizeRequestResult.errorCode,
            errorMessage: SecondAuthorizeRequestResult.errorMessage,
            orderNo: orderObj.orderNo,
            orderToken: orderObj.orderToken
        };
    }
    // success handling
    if (sessionObject.privacy.order_id) {
        orderObj = OrderMgr.getOrder(sessionObject.privacy.order_id);
    }
    if (!orderObj) {
        app.getController('Cart').Show(); // eslint-disable-line
        return {
            error: true,
            success: false
        };
    }
    if (orderObj.getStatus().value === Order.ORDER_STATUS_FAILED) {
        Transaction.wrap(function () {
            if (orderObj) {
                orderObj.custom.worldpayMACMissingVal = true;
            } else {
                orderObj.custom.worldpayMACMissingVal = true;
            }
        });
        error = utils.worldpayErrorMessage();
        app.getController('COBilling').Start({ // eslint-disable-line
            errorMessage: error.errorMessage
        });
        return {
            error: true,
            success: false,
            errorMessage: error.errorMessage
        };
    }
    var customerObj = orderObj.customer.authenticated ? orderObj.customer : null;
    var tokenProcessutils = require('*/cartridge/scripts/common/tokenProcessutils');
    var resultCheckAuthorization = tokenProcessutils.checkAuthorization(SecondAuthorizeRequestResult.serviceresponse, paymentIntrument, customerObj);
    if (resultCheckAuthorization.error) {
        failImpl(orderObj, resultCheckAuthorization.errorMessage);
        return {
            error: true,
            success: false,
            errorMessage: resultCheckAuthorization.lastEvent
        };
    }
    if (app.getController('COPlaceOrder').SubmitImpl(orderObj).error) { // eslint-disable-line
        app.getController('COSummary').Start(); // eslint-disable-line
        return {
            error: true,
            success: false
        };
    }
    app.getController('COSummary').ShowConfirmation(orderObj); // eslint-disable-line
    return {
        error: false,
        success: true
    };
}

/*
 * Module exports
 */

/*
 * Local methods
 */
exports.Handle = handle;
exports.Authorize = authorize;
exports.HandleRedirection = handleRedirection;
exports.Notify = guard.ensure(['https', 'post'], notify);
exports.GetNotificationUpdates = guard.ensure(['https'], getNotificationUpdates);
exports.LoadPaymentMethods = guard.ensure(['https', 'post'], loadPaymentMethods);
exports.HandleAuthenticationResponse = guard.ensure(['https', 'post'], handleAuthenticationResponse);
exports.APMLookupService = guard.ensure(['https', 'post'], apmLookupService);
exports.TestCaptureService = guard.ensure(['https', 'get'], testCaptureService);
exports.Ddc = guard.ensure(['https', 'get'], Ddc);
exports.Sess = guard.ensure(['https', 'post'], Sess);
exports.Handle3ds = guard.ensure(['https', 'post'], Handle3ds);
