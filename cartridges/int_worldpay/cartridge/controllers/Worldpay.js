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
var WorldpayHelper = require('~/cartridge/scripts/WorldpayHelper');
var PaymentMgr = require('dw/order/PaymentMgr');
var Countries = require(siteCore + '/cartridge/scripts/util/Countries');
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
var Utils = require('*/cartridge/scripts/common/Utils');
var ServiceFacade = require('*/cartridge/scripts/service/ServiceFacade');
var StringUtils = require('dw/util/StringUtils');
var Resource = require('dw/web/Resource');
var ArrayList = require('dw/util/ArrayList');
var session = session;// eslint-disable-line
var request = request;// eslint-disable-line
var customer = customer;// eslint-disable-line
/**
 * Verifies a credit card against a valid card number and expiration date and possibly invalidates invalid form fields.
 * If the verification was successful a credit card payment instrument is created.
 * @param {Object} args - Arguments
 * @return {Object} returns a result object
 */
function handle(args) {
    var result = WorldpayHelper.handle(args);
    return result;
}

/**
 * Authorize call for worldpay processor
 * @param {Object} args - Arguments
 * @return {Object} returns a result object
 */
function authorize(args) {
    var result = WorldpayHelper.authorize(args);
    return result;
}

/**
 * APM lookup for worldpay processor
 */
function apmLookupService() {
    var BasketMgr = require('dw/order/BasketMgr');
    var paymentAmount = BasketMgr.getCurrentBasket().totalGrossPrice.value;
    if (request.httpParameterMap.billingCountry.value && paymentAmount > 0) {
        var paymentMethods = PaymentMgr.getApplicablePaymentMethods(customer, request.httpParameterMap.billingCountry.value.toUpperCase(), paymentAmount);
        var WorldpayPreferences = require('*/cartridge/scripts/object/WorldpayPreferences');
        var worldPayPreferences = new WorldpayPreferences();
        var preferences = worldPayPreferences.worldPayPreferencesInit();

        var applicablePMResult = require('*/cartridge/scripts/order/WorldpayPayment').applicablePaymentMethods(paymentMethods, request.httpParameterMap.billingCountry.value, preferences);
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
        if (order instanceof Order) {
            orderstatus = OrderMgr.failOrder(order, true);
        } else {
            orderstatus = OrderMgr.failOrder(order, true);
        }
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
    if (session.privacy.order_id) {
        order = OrderMgr.getOrder(session.privacy.order_id);
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
    var params = request.getHttpParameters();
    var error = null;
    var orderObj;
    // md - merchant supplied data contains the OrderNo
    var md = (params.containsKey('MD')) ? params.get('MD')[0] : null;
    var orderNo = md;

    if (!orderNo) {
        Logger.getLogger('worldpay').error(
                'Worldpay.ds HandleAuthenticationResponse :  Order no. not present in parameters');
        error = Utils.worldpayErrorMessage();
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
        error = Utils.worldpayErrorMessage();
        failOrder(orderObj, error.errorMessage);
        return {
            error: true,
            success: false,
            errorMessage: error.errorMessage
        };
    }

    // Fetch the APM Name from the Payment isntrument.
    var paymentIntrument = Utils.getPaymentInstrument(orderObj);
    var apmName = paymentIntrument.getPaymentMethod();
    // Fetch the APM Type from the Payment Method i.e. if the Payment Methoid is of DIRECT or REDIRECT type.
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    var WorldpayPreferences = require('*/cartridge/scripts/object/WorldpayPreferences');
    WorldpayPreferences = new WorldpayPreferences();
    var preferences = WorldpayPreferences.worldPayPreferencesInit(paymentMthd);

    if (preferences.missingPreferences()) {
        Logger.getLogger('worldpay').error(
                'Worldpay.ds HandleAuthenticationResponse : Worldpay preferences are not properly set.');
        error = Utils.worldpayErrorMessage();
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
    if (!paRes || paRes.equals(WorldpayConstants.UNKNOWN_ENTITY) || paRes.equals(WorldpayConstants.CANCELLEDBYSHOPPER)
            || paRes.equals(WorldpayConstants.THREEDERROR) || paRes.equals(WorldpayConstants.THREEDSINVALIDERROR)
            || paRes.equals(WorldpayConstants.NOT_IDENTIFIED_NOID)) {
        var errorMessage = Utils.getErrorMessage(paRes);
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
    var cardNumber = session.forms.billing.paymentMethods.creditCard.number.value;
    var encryptedData = session.forms.billing.paymentMethods.creditCard.encryptedData.value;
    var cvn = session.forms.billing.paymentMethods.creditCard.cvn.value;
    var echoData = session.privacy.echoData;
    var SecondAuthorizeRequestResult = ServiceFacade.secondAuthorizeRequestService(orderObj, request, paymentIntrument, preferences, paRes, md, echoData,
                    cardNumber, encryptedData, cvn);

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
    if (session.privacy.order_id) {
        orderObj = OrderMgr.getOrder(session.privacy.order_id);
    }

    if (!orderObj) {
        app.getController('Cart').Show();// eslint-disable-line
        return { error: true, success: false };
    }
    if (orderObj.getStatus().value === Order.ORDER_STATUS_FAILED) {
        Transaction.wrap(function () {
            if (orderObj) {
                orderObj.custom.worldpayMACMissingVal = true;
            } else {
                orderObj.custom.worldpayMACMissingVal = true;
            }
        });
        error = Utils.worldpayErrorMessage();
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
    var TokenProcessUtils = require('*/cartridge/scripts/common/TokenProcessUtils');
    var resultCheckAuthorization = TokenProcessUtils.checkAuthorization(SecondAuthorizeRequestResult.response, paymentIntrument, customerObj);
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
        var validateIPStatus = Utils.validateIP();
        if (validateIPStatus.error) {
            return {
                error: true,
                success: false
            };
        }
    }
    var xmlString;
    xmlString = request.httpParameterMap.requestBodyAsString;
    if (!xmlString) {
        Logger.getLogger('worldpay').error('Worldpay-Notify : Add Custom Object : xmlString IS NULL');
        return {
            error: true
        };
    }
    if (Utils.addNotifyCustomObject(xmlString).error) {
        Transaction.wrap(function () {
            return {
                error: true
            };
        });
    }
    // ISML.renderTemplate('notifyResponsejson');
    app.getView().render('notifyResponsejson');
    return {
        error: false
    };
}

/**
* Service to get Notification updates (latest update and all updates) based on parameter "allupdates"
*/
function getNotificationUpdates() {
    var params = request.getHttpParameters();
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
            ErrorMessage = Utils.getErrorMessage(ErrorCode);
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
                        ErrorCode = WorldpayConstants.NOTIFYERRORCODE118;
                    } else {
                        ErrorCode = WorldpayConstants.NOTIFYERRORCODE119;
                    }
                    ErrorMessage = Utils.getErrorMessage(ErrorCode);
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
                var errorCode = WorldpayConstants.NOTIFYERRORCODE115;
                var errorMessage = Utils.getErrorMessage(errorCode);
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
    ErrorMessage = Utils.getErrorMessage(ErrorCode);
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
    if (!selectedPayment.equals(WorldpayConstants.KLARNA) && !selectedPayment.equals(WorldpayConstants.IDEAL) && !selectedPayment.equals(WorldpayConstants.PAYPAL) && !selectedPayment.equals(WorldpayConstants.WORLDPAY) && !selectedPayment.equals(WorldpayConstants.CHINAUNIONPAY)) {
        if (paymentStatus
                && (paymentStatus.equals(WorldpayConstants.CANCELLEDSTATUS) || paymentStatus.equals(WorldpayConstants.REFUSED))) {
            if (Utils.verifyMac(orderInfo.mac,
                    orderInfo.orderKey, orderInfo.orderAmount, orderInfo.orderCurrency, orderInfo.orderStatus).error) {
                app.getController('Cart').Show();// eslint-disable-line
                return {
                    success: false
                };
            }
            if (paymentStatus && paymentStatus.equals(WorldpayConstants.CANCELLEDSTATUS)) {
                Transaction.wrap(function () {
                    order.custom.transactionStatus = new ArrayList('POST_AUTH_CANCELLED');// eslint-disable-line
                    return {
                        success: false
                    };
                });
            }
        }
    }
    error = Utils.worldpayErrorMessage();
    if (selectedPayment.equals(WorldpayConstants.KONBINI)) {
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
    if (selectedPayment.equals(WorldpayConstants.KONBINI)) {
        Transaction.wrap(function () { OrderMgr.cancelOrder(order); });
        app.getController('Cart').Show();// eslint-disable-line
        return {
            success: false
        };
    }
    var PendingStatus = request.httpParameterMap.status.value;
    if (!PendingStatus || PendingStatus.equals(WorldpayConstants.OPEN)) {
        if (order.status.value === Order.ORDER_STATUS_FAILED) {
            error = Utils.worldpayErrorMessage();
            app.getController('COBilling').Start({// eslint-disable-line
                errorMessage: error.errorMessage
            });
            return {
                success: false
            };
        }
        // Send order confirmation and clear used forms within the checkout process.
        Utils.sendEmailNotification(order);
        // Clears all forms used in the checkout process.
        WorldpayHelper.worldPayClearFormElement();
        app.getController('COSummary').ShowConfirmation(order);// eslint-disable-line
        return {
            success: false
        };
    }
    error = Utils.worldpayErrorMessage();
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
    if (!selectedPayment.equals(WorldpayConstants.KLARNA) && !selectedPayment.equals(WorldpayConstants.IDEAL)
            && !selectedPayment.equals(WorldpayConstants.PAYPAL)
            && !selectedPayment.equals(WorldpayConstants.WORLDPAY)
            && !selectedPayment.equals(WorldpayConstants.CHINAUNIONPAY)) {
        var macstatus = Utils.verifyMac(orderInfo.mac, orderInfo.orderKey, orderInfo.orderAmount,
                orderInfo.orderCurrency, orderInfo.orderStatus);
        if (macstatus.error) {
            Transaction.wrap(function () {
                order.custom.worldpayMACMissingVal = true;// eslint-disable-line
            });
            error = Utils.worldpayErrorMessage();
            failImpl(order, error.errorMessage);
            Logger.getLogger('worldpay').error(' mac issue ');
            return {
                error: true,
                success: false,
                errorMessage: error.errorMessage
            };
        }
    }
    session.privacy.order_id = '';
    if (order.status.value === Order.ORDER_STATUS_FAILED) {
        Transaction.wrap(function () {
            order.custom.worldpayMACMissingVal = true;// eslint-disable-line
        });
        error = Utils.worldpayErrorMessage();
        app.getController('COBilling').Start({// eslint-disable-line
            errorMessage: error.errorMessage
        });
        return {
            success: false
        };
    }
    var klarnasnippet;
    if (selectedPayment.equals(WorldpayConstants.KLARNA)) {
        // Service Request - for Klarna Confirmation Inquiry
        var paymentMthd = PaymentMgr.getPaymentMethod(WorldpayConstants.KLARNA);
        var WorldpayPreferences = require('*/cartridge/scripts/object/WorldpayPreferences');
        WorldpayPreferences = new WorldpayPreferences();
        var preferences = WorldpayPreferences.worldPayPreferencesInit(paymentMthd);
        var confirmationRequestKlarnaResult = ServiceFacade.confirmationRequestKlarnaService(order.orderNo, preferences, preferences.merchantCode);
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
    var paymentStatus = request.httpParameterMap.paymentStatus.value;
    var orderInfo = Utils.getWorldpayOrderInfo(paymentStatus);
    var selectedPayment = session.forms.billing.paymentMethods.selectedPaymentMethodID.value.toString();
    if (paymentStatus && paymentStatus.equals(WorldpayConstants.AUTHORIZED)) {
        return authStatusOrderPlacement(selectedPayment, orderInfo, order);
    } else if (paymentStatus && paymentStatus.equals(WorldpayConstants.PENDING)) {
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
    cart = app.getModel('Cart').get();// eslint-disable-line
    var applicableCreditCards = app.getController('COBilling').InitCreditCardList(cart).ApplicableCreditCards;// eslint-disable-line
    var paymentAmount = cart.getNonGiftCertificateAmount();
    var countryCode;
    countryCode = cart.object.billingAddress && cart.object.billingAddress.countryCode.value ? cart.object.billingAddress.countryCode.value : Countries.getCurrent({
        CurrentRequest: {
            locale: request.locale
        }
    }).countryCode;

    app.getView({
        ApplicableCreditCards: applicableCreditCards,
        ApplicablePaymentCards: PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD).getApplicablePaymentCards(customer, countryCode, paymentAmount.value),
        Basket: cart.object,
        selectedPaymentID: request.httpParameterMap.selectedPaymentMethodId.value
    }).render('worldpaypaymentmethods');
}

/**
 * Validates the order id and token upon match it will proceed for capture service initiation
 */
function testCaptureService() {
    var params = request.getHttpParameters();
    var orderId = (params.containsKey('order_id')) ? params.get('order_id')[0] : null;
    var orderToken = (params.containsKey('order_token')) ? params.get('order_token')[0] : null;
    var order = OrderMgr.getOrder(orderId);
    if (order && orderId.equals(order.orderNo) && orderToken.equals(order.orderToken)) {
        var CaptureServiceRequestResult = ServiceFacade.createCaptureService(
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
