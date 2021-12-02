'use strict';
var server = require('server');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');
var WorldpayHelper = require('*/cartridge/scripts/common/threeDFlexHelper');
var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');

/**
 * This controller is responsible for 3DS flow
 */
server.post('Worldpay3D', server.middleware.https, function (req, res, next) {
    var IssuerURL = req.querystring.IssuerURL;
    var PaRequest = req.querystring.PaRequest;
    var TermURL = req.querystring.TermURL;
    var MD = req.form.orderID;
    var Resource = require('dw/web/Resource');
    var orderObj = OrderMgr.getOrder(MD);
    var error3D1 = Resource.msg('worldpay.redirect.error1', 'worldpayerror', null);
    var error3D2 = Resource.msg('worldpay.redirect.error2', 'worldpayerror', null);
    var message3D = Resource.msg('worldpay.3dsecure.message', 'worldpay', null);
    res.render('/worldpayissuerredirect', {
        ContinueURL: IssuerURL,
        IssuerURL: IssuerURL,
        PaRequest: PaRequest,
        TermURL: TermURL,
        Order: orderObj,
        error3D1: error3D1,
        error3D2: error3D2,
        message3D: message3D
    });
    next();
});

/**
 * This controller is responsible for 3DS2 flow
 */
server.post('Worldpay3DS2', server.middleware.https, function (req, res, next) {
    var acsURL = req.querystring.acsURL;
    var payload = req.querystring.payload;
    var transactionId3DS = req.querystring.transactionId3DS;
    var MD = req.form.orderID;
    var Resource = require('dw/web/Resource');
    var error3D1 = Resource.msg('worldpay.redirect.error1', 'worldpayerror', null);
    var error3D2 = Resource.msg('worldpay.redirect.error2', 'worldpayerror', null);
    var message3D = Resource.msg('worldpay.3dsecure.message', 'worldpay', null);
    var intJwtResult = WorldpayHelper.initJwtcreation();
    var JWTdata = {
        jti: intJwtResult.jti,
        iat: intJwtResult.iat,
        iss: intJwtResult.iss,
        OrgUnitId: intJwtResult.OrgUnitId,
        ReturnUrl: URLUtils.https('Worldpay-Handle3ds').toString(),
        Payload: {
            ACSUrl: acsURL.toString(),
            Payload: payload.toString(),
            TransactionId: transactionId3DS.toString()
        },
        ObjectifyPayload: true
    };
    var JWT = WorldpayHelper.createJwt(JWTdata, intJwtResult.jwtMacKey);
    res.render('/worldpayissuerredirect2', {
        JWT: JWT,
        MD: MD,
        error3D1: error3D1,
        error3D2: error3D2,
        message3D: message3D
    });
    next();
});

/**
 * Handle redirection for redirect credit card response or APM where Mac is compared for Authorized and Refused
 */

//	Main entry point for APMLookupService on billing page
server.get('APMLookupService', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Locale = require('dw/util/Locale');
    var PaymentModel = require('*/cartridge/models/payment');
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }
    var currentCustomer = req.currentCustomer.raw;
    var currentLocale = Locale.getLocale(req.locale.id);
    var lookupCountry = req.querystring.lookupCountry;
    var shippingCountry = req.querystring.shippingCountry;
    var currentCountry = lookupCountry || currentLocale.country;
    if (shippingCountry && currentBasket.billingAddress && currentBasket.billingAddress.countryCode.value) {
        currentCountry = currentBasket.billingAddress.countryCode.value;
    } else if (shippingCountry) {
        currentCountry = shippingCountry;
    }
    // Loop through all shipments and make sure all are valid
    var isValid;
    var allValid = true;
    for (var i = 0, ii = currentBasket.shipments.length; i < ii; i++) {
        isValid = req.session.privacyCache.get(currentBasket.shipments[i].UUID);
        if (isValid !== 'valid') {
            allValid = false;
            break;
        }
    }

    if (currentBasket.billingAddress) {
        Transaction.wrap(function () { /* eslint-disable */
            currentBasket.billingAddress.setCountryCode(currentCountry);
        });
    }
    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
    var OrderModel = require('*/cartridge/models/order');
    var orderModel = new OrderModel(
        currentBasket,
        {
            customer: currentCustomer,
            usingMultiShipping: usingMultiShipping,
            shippable: allValid,
            countryCode: currentLocale.country,
            containerView: 'basket'
        }
    );
    var paymentModel = new PaymentModel(currentBasket, currentCustomer, currentCountry);
    orderModel.billing.payment = paymentModel;
    if (!orderModel.billing.billingAddress.address) {
        var AddressModel = require('*/cartridge/models/address');
        orderModel.billing.billingAddress = new AddressModel(currentBasket.defaultShipment.shippingAddress);
    }

    // Get rid of this from top-level ... should be part of OrderModel???
    var currentYear = new Date().getFullYear();
    var creditCardExpirationYears = [];

    for (var j = 0; j < 20; j++) {
        creditCardExpirationYears.push(currentYear + j);
    }

    var AccountModel = require('*/cartridge/models/account');
    var accountModel = new AccountModel(req.currentCustomer);
    res.render('/checkout/billing/paymentOptions', {
        order: orderModel,
        customer: accountModel,
        expirationYears: creditCardExpirationYears,
        forms: {
            billingForm: server.forms.getForm('billing')
        }
    });
    return next();
});

/**
 * This controller is responsible for Handling authentication response
 */
server.post('HandleAuthenticationResponse', server.middleware.https, function (req, res, next) {
    var utils = require('*/cartridge/scripts/common/utils');
    var URLUtils = require('dw/web/URLUtils');
    var OrderManager = require('dw/order/OrderMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var Order = require('dw/order/Order');
    var Resource = require('dw/web/Resource');
    var error = null;
    var orderObj;

    //md - merchant supplied data contains the OrderNo
    var md = req.form.MD ? req.form.MD : null;
    var orderNo = md;

    if (!orderNo) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse :  Order no. not present in parameters');
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', utils.worldpayErrorMessage()));
        return next();
    }

    try {
        orderObj = OrderManager.getOrder(orderNo);
    } catch (ex) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse :  Invalid Order ');
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', utils.worldpayErrorMessage()));
        return next();
    }

    // Fetch the APM Name from the Payment isntrument.
    var paymentIntrument = utils.getPaymentInstrument(orderObj);
    var apmName = paymentIntrument.getPaymentMethod();
    // Fetch the APM Type from the Payment Method i.e. if the Payment Methoid is of DIRECT or REDIRECT type.
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    WorldpayPreferences = new WorldpayPreferences();
    var preferences = WorldpayPreferences.worldPayPreferencesInit(paymentMthd);

    if (preferences.missingPreferences()) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : Worldpay preferences are not properly set.');
        error = utils.worldpayErrorMessage();
        utils.failImpl(orderObj, error.errorMessage);
        return {
            error: true,
            success: false,
            errorMessage: error.errorMessage,
            orderNo: orderObj.orderNo,
            orderToken: orderObj.orderToken
        };
    }

    var paRes = req.form.PaRes;
    // Checks if paRes is exist in error codes (Issuer Response for 3D check)
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    if (paRes === null || paRes === worldpayConstants.UNKNOWN_ENTITY || paRes === worldpayConstants.CANCELLEDBYSHOPPER
        || paRes === worldpayConstants.THREEDERROR || paRes === worldpayConstants.THREEDSINVALIDERROR || paRes === worldpayConstants.NOT_IDENTIFIED_NOID) {
        var errorMessage = utils.getErrorMessage(paRes);
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : issuerResponse Error Message : ' + errorMessage);
        var failRes = utils.failImpl(orderObj, errorMessage);
        if (failRes.error) {
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', failRes.errorMessage));
            return next();
        }
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', errorMessage));
        return next();
    }
    // Capturing Issuer Response
    var paymentforms = server.forms.getForm('billing').creditCardFields;
    var echoData = req.session.privacyCache.get('echoData');
    req.session.privacyCache.set('echoData', null);
    var cardNumber = paymentforms.cardNumber ? paymentforms.cardNumber.value : '';
    var encryptedData = paymentforms.encryptedData ? paymentforms.encryptedData.value : '';
    var cvn = paymentforms.securityCode ? paymentforms.securityCode.value : '';
    var SecondAuthorizeRequestResult = require('*/cartridge/scripts/service/serviceFacade').secondAuthorizeRequestService(orderObj,
        req,
        paymentIntrument,
        preferences,
        paRes,
        md,
        echoData,
        cardNumber,
        encryptedData,
        cvn);

    if (SecondAuthorizeRequestResult.error && orderObj.custom.isInstantPurchaseOrder) {
        delete session.privacy.isInstantPurchaseBasket;
        utils.failImpl(orderObj, SecondAuthorizeRequestResult.errorMessage);
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', SecondAuthorizeRequestResult.errorMessage));
        return next();
    }

    if (SecondAuthorizeRequestResult.error) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : ErrorCode : ' +
            SecondAuthorizeRequestResult.errorCode + ' : Error Message : ' + SecondAuthorizeRequestResult.errorMessage);
        utils.failImpl(orderObj, SecondAuthorizeRequestResult.errorMessage);
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', SecondAuthorizeRequestResult.errorMessage));
        return next();
    }

    // success handling
    if (orderObj == null) {
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }
    if (orderObj.getStatus().value === Order.ORDER_STATUS_FAILED) {
        Transaction.wrap(function () {
            orderObj.custom.worldpayMACMissingVal = true;
        });
        error = utils.worldpayErrorMessage();
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', error.errorMessage));
        return next();
    }

    var customerObj = orderObj.customer.authenticated ? orderObj.customer : null;
    var tokenProcessUtils = require('*/cartridge/scripts/common/tokenProcessUtils');
    var resultCheckAuthorization = tokenProcessUtils.checkAuthorization(SecondAuthorizeRequestResult.response, paymentIntrument, customerObj);
    if (resultCheckAuthorization.error) {
        if (utils.failImpl(orderObj, resultCheckAuthorization.errorMessage).error) {
            res.redirect(URLUtils.url('Cart-Show', 'placeerror', resultCheckAuthorization.errorMessage));
            return next();
        }
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', resultCheckAuthorization.errorMessage));
        return next();
    }

    // Places the order
    var placeOrderResult = COHelpers.placeOrder(orderObj);
    if (placeOrderResult.error) {
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', Resource.msg('error.technical', 'checkout', null)));
        return next();
    }
    Transaction.wrap(function () {
        orderObj.custom.WorldpayLastEvent = worldpayConstants.AUTHORIZED;
    });

    if (!empty(session.privacy.currentOrderNo)) {

        delete session.privacy.currentOrderNo;
    }
    COHelpers.sendConfirmationEmail(orderObj, req.locale.id);

    // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set('usingMultiShipping', false);
    res.render('/checkout/orderConfirmForm', {
        error: false,
        orderID: orderObj.orderNo,
        orderToken: orderObj.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString()
    });
    return next();
});

/**
 * This controller is responsible for Handling 3ds flow
 */
server.post('Handle3ds', server.middleware.https, function (req, res, next) {
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var utils = require('*/cartridge/scripts/common/utils');
    var myMD = request.httpParameterMap;
    var orderNo = myMD.MD.rawValue;
    var URLUtils = require('dw/web/URLUtils');
    var OrderManager = require('dw/order/OrderMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var Order = require('dw/order/Order');
    var Resource = require('dw/web/Resource');
    var error = null;
    var orderObj;
    if (!orderNo) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse :  Order no. not present in parameters');
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', utils.worldpayErrorMessage()));
        return next();
    }
    try {
        orderObj = OrderManager.getOrder(orderNo);
    } catch (ex) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse :  Invalid Order ');
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', utils.worldpayErrorMessage()));
        return next();
    }
    // Fetch the APM Name from the Payment isntrument.
    //var paymentIntrument = Utils.getPaymentInstrument(orderObj);
    var paymentIntrument = orderObj.paymentInstrument;
    var apmName = orderObj.paymentInstrument.paymentMethod;
    // Fetch the APM Type from the Payment Method i.e. if the Payment Methoid is of DIRECT or REDIRECT type.
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    WorldpayPreferences = new WorldpayPreferences();
    var preferences = WorldpayPreferences.worldPayPreferencesInit(paymentMthd);

    if (preferences.missingPreferences()) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : Worldpay preferences are not properly set.');
        error = utils.worldpayErrorMessage();
        utils.failImpl(orderObj, error.errorMessage);
        return {
            error: true,
            success: false,
            errorMessage: error.errorMessage,
            orderNo: orderObj.orderNo,
            orderToken: orderObj.orderToken
        };
    }
    // Capturing Issuer Response

    var SecondAuthorizeRequestResult = require('*/cartridge/scripts/service/serviceFacade').secondAuthorizeRequestService2(orderNo,
        paymentIntrument, req, preferences);

    if (SecondAuthorizeRequestResult.error && orderObj.custom.isInstantPurchaseOrder) {
        delete session.privacy.isInstantPurchaseBasket;
        utils.failImpl(orderObj, SecondAuthorizeRequestResult.errorMessage);
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', SecondAuthorizeRequestResult.errorMessage));
        return next();
    }

    if (SecondAuthorizeRequestResult.error) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : ErrorCode : ' +
            SecondAuthorizeRequestResult.errorCode + ' : Error Message : ' + SecondAuthorizeRequestResult.errorMessage);
        utils.failImpl(orderObj, SecondAuthorizeRequestResult.errorMessage);
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', SecondAuthorizeRequestResult.errorMessage));
        return next();
    }

    // success handling
    if (orderObj == null) {
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }
    if (orderObj.getStatus().value === Order.ORDER_STATUS_FAILED) {
        Transaction.wrap(function () {
            orderObj.custom.worldpayMACMissingVal = true;
        });
        error = utils.worldpayErrorMessage();
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', error.errorMessage));
        return next();
    }

    var customerObj = orderObj.customer.authenticated ? orderObj.customer : null;
    var tokenProcessUtils = require('*/cartridge/scripts/common/tokenProcessUtils');
    var resultCheckAuthorization = tokenProcessUtils.checkAuthorization(SecondAuthorizeRequestResult.serviceresponse, paymentIntrument, customerObj);
    if (resultCheckAuthorization.error) {
        if (utils.failImpl(orderObj, resultCheckAuthorization.errorMessage).error) {
            res.redirect(URLUtils.url('Cart-Show', 'placeerror', resultCheckAuthorization.errorMessage));
            return next();
        }
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', resultCheckAuthorization.errorMessage));
        return next();
    }

    // Places the order
    var placeOrderResult = COHelpers.placeOrder(orderObj);
    if (placeOrderResult.error) {
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', Resource.msg('error.technical', 'checkout', null)));
        return next();
    }
    Transaction.wrap(function () {
        orderObj.custom.WorldpayLastEvent = worldpayConstants.AUTHORIZED;
    });

    if (!empty(session.privacy.currentOrderNo)) {

        delete session.privacy.currentOrderNo;
    }
    COHelpers.sendConfirmationEmail(orderObj, req.locale.id);
    // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set('usingMultiShipping', false);
    res.render('/checkout/orderConfirmForm', {
        error: false,
        orderID: orderObj.orderNo,
        orderToken: orderObj.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString()
    });
    return next();
});

/**
 * Notification for worldpay processor
 */
server.post('Notify', server.middleware.https, function (req, res, next) {
    var Site = require('dw/system/Site');
    var isValidateIPAddress = Boolean(Site.getCurrent().getCustomPreferenceValue('ValidateIPAddress'));
    var utils = require('*/cartridge/scripts/common/utils');
    if (isValidateIPAddress) {
        var validateIPStatus = utils.validateIP(req.connection.remoteAddress);
        if (validateIPStatus.error) {
            res.render('/http_500');
            return next();
        }
    }
    var xmlString = req.body;
    Logger.getLogger('worldpay').debug('Worldpay-Notify : Add Custom Object : xmlString IS ' + xmlString);
    if (xmlString == null) {
        Logger.getLogger('worldpay').error('Worldpay-Notify : Add Custom Object : xmlString IS NULL');
        res.render('/http_500');
        return next();
    }
    if (utils.addNotifyCustomObject(xmlString).error) {
        res.render('/http_500');
        return next();
    }
    res.render('/notifyResponsejson', {error: false});
    return next();
});

/**
 * This method returns Error codes
 * @param {*} allupdates - all updates
 * @param {*} worldpayConstants - worldpay constants to fetch error values
 * @returns 
 */
function getErrorCodes(allupdates, worldpayConstants) {
    var errorCode = worldpayConstants.NOTIFYERRORCODE119;
    if (allupdates.equalsIgnoreCase("true")) {
        errorCode = worldpayConstants.NOTIFYERRORCODE118;
    }
    return errorCode;
}

/**
 * Service to get Notification updates (latest update and all updates) based on parameter "allupdates"
 */
server.get('GetNotificationUpdates', server.middleware.https, function (req, res, next) {
    var utils = require('*/cartridge/scripts/common/utils');
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var params = request.getHttpParameters();
    var orderNo = (params.containsKey("orderNo")) ? params.get("orderNo")[0] : null;
    var allupdates = (params.containsKey("allupdates")) ? params.get("allupdates")[0] : "";
    var errorCode;
    var errorMessage;
    var orderObj;
    if (orderNo) {
        try {
            var OrderMgr = require('dw/order/OrderMgr');
            orderObj = OrderMgr.getOrder(orderNo);
        } catch (ex) {
            errorCode = worldpayConstants.NOTIFYERRORCODE120;
            errorMessage = utils.getErrorMessage(errorCode);
            res.render('/errorjson', {
                    ErrorCode: errorCode,
                    ErrorMessage: errorMessage
                }
            );
            return next();
        }
        if (orderObj) {
            try {
                var statusHist = orderObj.custom.transactionStatus;
                var statusList = new dw.util.ArrayList(statusHist);
                if (!statusList || statusList.length <= 0) {
                    errorCode = getErrorCodes(allupdates, worldpayConstants);
                    errorMessage = utils.getErrorMessage(errorCode);
                    res.render('/errorjson', {
                            ErrorCode: errorCode,
                            ErrorMessage: errorMessage
                        }
                    );
                } else if (allupdates.equalsIgnoreCase("true")) {
                    res.render('/allstatusjson',
                        {statusList: statusList}
                    );
                } else {
                    res.render('/lateststatusjson',
                        {status: statusList.get(0)}
                    );
                }
            } catch (ex) {
                errorCode = worldpayConstants.NOTIFYERRORCODE115;
                errorMessage = utils.getErrorMessage(errorCode);
                Logger.getLogger("worldpay").error("Order Notification : Get All Status Update Notifications recieved : " + errorCode + " : " + errorMessage + " : " + ex);
                res.render('/errorjson', {
                        ErrorCode: errorCode,
                        ErrorMessage: errorMessage
                    }
                );
            }
            return next();
        }
    }
    errorCode = worldpayConstants.NOTIFYERRORCODE120;
    errorMessage = utils.getErrorMessage(errorCode);
    res.render('/errorjson', {
            ErrorCode: errorCode,
            ErrorMessage: errorMessage
        }
    );
    return next();
});

/**
 * Service to Validates the order id and token upon match it will proceed for capture service initiation for SFRA
 */
server.get('CaptureService', server.middleware.https, function (req, res, next) {
    var params = request.getHttpParameters();
    var order_id = (params.containsKey("order_id")) ? params.get("order_id")[0] : null;
    var order_token = (params.containsKey("order_token")) ? params.get("order_token")[0] : null;
    var Resource = require('dw/web/Resource');
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(order_id);
    if (order && order_id && order_token && order_id.equals(order.orderNo) && order_token.equals(order.orderToken)) {
        var CaptureServiceRequestResult = require('*/cartridge/scripts/service/serviceFacade').createCaptureService(order_id);
        if (CaptureServiceRequestResult.error) {
            res.render('/service/capture_service', {
                serviceResponse: {
                    errorCode: CaptureServiceRequestResult.errorCode,
                    errorMessage: CaptureServiceRequestResult.errorMessage
                }
            })
        } else {
            res.render('/service/capture_service', {serviceResponse: CaptureServiceRequestResult.response});
        }
    } else {
        res.render('/service/capture_service', {
            serviceResponse: {
                errorCode: Resource.msg('worldpay.error.codeCAPTURE', 'worldpayerror', null),
                errorMessage: Resource.msg('worldpay.error.codeCAPTURE', 'worldpayerror', null)
            }
        });
    }
    return next();
});

/**
 * This controller is responsible for Handling device data collection
 */
server.get('Ddc', server.middleware.https, function (req, res, next) {
    var Bin;
    var intJwtResult = WorldpayHelper.initJwtcreation();
    if (req.querystring.instrument) {
        Bin = req.querystring.instrument.slice(0, 6);
    } else {
        Bin = "";
    }
    var JWTdata = {
        "jti": intJwtResult.jti,
        "iat": intJwtResult.iat,
        "iss": intJwtResult.iss,
        "OrgUnitId": intJwtResult.OrgUnitId
    };
    var JWT = WorldpayHelper.createJwt(JWTdata, intJwtResult.jwtMacKey);
    res.render('/ddcIframe', {Bin: Bin, JWT: JWT});
    return next();
});

/**
 * This controller is responsible for setting session id
 */
server.post('Sess', server.middleware.https, function (req, res, next) {
    var sessionID = request.httpParameterMap.dataSessionId;
    var basket = dw.order.BasketMgr.getCurrentBasket();
    if (basket) {
        Transaction.wrap(function () {
            basket.custom.dataSessionID = sessionID;
        });
    }
});

module.exports = server.exports();