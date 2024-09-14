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
    let error3D1 = Resource.msg('worldpay.redirect.error1', 'worldpayerror', null);
    let error3D2 = Resource.msg('worldpay.redirect.error2', 'worldpayerror', null);
    let message3D = Resource.msg('worldpay.3dsecure.message', 'worldpay', null);
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
 * This controller is responsible for MyAccount 3DS flow
 */
server.post('WorldpaySave3DCard', server.middleware.https, function (req, res, next) {
    var IssuerURL = req.querystring.IssuerURL;
    var PaRequest = req.querystring.PaRequest;
    var TermURL = req.querystring.TermURL;
    var MD = req.querystring.MD;
    var Resource = require('dw/web/Resource');
    var orderObj = {
        orderNo: MD
    };
    let errorMsg3D1 = Resource.msg('worldpay.redirect.error1', 'worldpayerror', null);
    let errorMsg3D2 = Resource.msg('worldpay.redirect.error2', 'worldpayerror', null);
    let errorMsg3D = Resource.msg('worldpay.3dsecure.message', 'worldpay', null);
    res.render('/worldpayissuerredirect', {
        ContinueURL: IssuerURL,
        IssuerURL: IssuerURL,
        PaRequest: PaRequest,
        TermURL: TermURL,
        Order: orderObj,
        error3D1: errorMsg3D1,
        error3D2: errorMsg3D2,
        message3D: errorMsg3D
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
    var pi = req.querystring.pi;
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
        ReturnUrl: req.form.isSaveCardAction ? URLUtils.https('Worldpay-HandleSaveCard3ds', 'paymentInstrument', pi).toString() : URLUtils.https('Worldpay-Handle3ds').toString(),
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

// Main entry point for APMLookupService on billing page
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
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var URLUtils = require('dw/web/URLUtils');
    var OrderManager = require('dw/order/OrderMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var Order = require('dw/order/Order');
    var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');
    var enableErrorMailService = Site.getCurrent().getCustomPreferenceValue('enableErrorMailService');
    let error = null;
    let orderObj;

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
    var preferences = WorldpayPreferences.worldPayPreferencesInit(paymentMthd, orderObj);

    if (preferences.missingPreferences()) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : Worldpay preferences are not properly set.');
        error = utils.worldpayErrorMessage();
        if (enableErrorMailService) {
            utils.sendErrorNotification(orderNo, worldpayConstants.AUTHENTICATION_FAILED, paymentMthd);
        }
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
    if (paRes === null || paRes === worldpayConstants.UNKNOWN_ENTITY || paRes === worldpayConstants.CANCELLEDBYSHOPPER
        || paRes === worldpayConstants.THREEDERROR || paRes === worldpayConstants.THREEDSINVALIDERROR || paRes === worldpayConstants.NOT_IDENTIFIED_NOID) {
        var errorMessage = utils.getErrorMessage(paRes);
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : issuerResponse Error Message : ' + errorMessage);
        var failRes = utils.failImpl(orderObj, errorMessage);
        if (enableErrorMailService) {
            utils.sendErrorNotification(orderNo, worldpayConstants.AUTHENTICATION_FAILED, paymentMthd);
        }
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
    var cardOrderObj = {
        cvn: cvn,
        cardNumber: cardNumber,
        md: md,
        paRes: paRes
    };
    var SecondAuthorizeRequestResult = require('*/cartridge/scripts/service/serviceFacade').secondAuthorizeRequestService(orderObj,
        req,
        paymentIntrument,
        preferences,
        echoData,
        encryptedData,
        cardOrderObj
        );

    if (SecondAuthorizeRequestResult.error && orderObj.custom.isInstantPurchaseOrder) {
        delete session.privacy.isInstantPurchaseBasket;
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : isInstantPurchaseBasket deleted.');
        if (enableErrorMailService) {
            utils.sendErrorNotification(orderNo, worldpayConstants.AUTHENTICATION_FAILED, paymentMthd);
        }
        utils.failImpl(orderObj, SecondAuthorizeRequestResult.errorMessage);
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', SecondAuthorizeRequestResult.errorMessage));
        return next();
    }

    if (SecondAuthorizeRequestResult.error) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : ErrorCode : ' +
            SecondAuthorizeRequestResult.errorCode + ' : Error Message : ' + SecondAuthorizeRequestResult.errorMessage);
        if (enableErrorMailService) {
            utils.sendErrorNotification(orderNo, worldpayConstants.AUTHENTICATION_FAILED, paymentMthd);
        }
        utils.failImpl(orderObj, SecondAuthorizeRequestResult.errorMessage);
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : failing on order');
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', SecondAuthorizeRequestResult.errorMessage));
        return next();
    }

    // success handling
    if (orderObj === null) {
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }
    if (orderObj.getStatus().value === Order.ORDER_STATUS_FAILED) {
        Transaction.wrap(function () {
            orderObj.custom.worldpayMACMissingVal = true;
        });
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : worldpayMACMissingVal sets');
        error = utils.worldpayErrorMessage();
        if (enableErrorMailService) {
            utils.sendErrorNotification(orderNo, worldpayConstants.WORLDPAY_MAC_MISSING_VAL, paymentMthd);
        }
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', error.errorMessage));
        return next();
    }

    var customerObj = orderObj.customer.authenticated ? orderObj.customer : null;
    var tokenProcessUtils = require('*/cartridge/scripts/common/tokenProcessUtils');
    var resultCheckAuthorization = tokenProcessUtils.checkAuthorization(SecondAuthorizeRequestResult.response, paymentIntrument, customerObj);
    if (resultCheckAuthorization.error) {
        if (utils.failImpl(orderObj, resultCheckAuthorization.errorMessage).error) {
            Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : failing on order');
            res.redirect(URLUtils.url('Cart-Show', 'placeerror', resultCheckAuthorization.errorMessage));
            return next();
        }
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', resultCheckAuthorization.errorMessage));
        return next();
    }

    // Places the order
    let placedOrderResult = COHelpers.placeOrder(orderObj);
    if (placedOrderResult.error) {
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', Resource.msg('error.technical', 'checkout', null)));
        return next();
    }
    Transaction.wrap(function () {
        orderObj.custom.WorldpayLastEvent = worldpayConstants.AUTHORIZED;
    });

    if (!empty(session.privacy.currentOrderNo)) {
        delete session.privacy.currentOrderNo;
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : deleting current order number');
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

function processSecondAuthorizeRequest(SecondAuthorizeRequestResult , enableErrorMailService ,res) {
    var utils = require('*/cartridge/scripts/common/utils');
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var URLUtils = require('dw/web/URLUtils');
    Logger.getLogger('worldpay').error('Worldpay.js HandleSaveCardResponse : ErrorCode : ' +
            SecondAuthorizeRequestResult.errorCode + ' : Error Message : ' + SecondAuthorizeRequestResult.errorMessage);
        if ((SecondAuthorizeRequestResult.errorCode).toString() === "5") {
            if (enableErrorMailService) {
                utils.sendErrorNotification(md, worldpayConstants.NOMINAL_VALUE_CARD_FAILERROR, paymentMthd);
            }
            res.redirect(URLUtils.url('PaymentInstruments-AddPayment', 'cardfail', 'cardfailerror'));
        }
        else if ((SecondAuthorizeRequestResult.errorCode).toString() === "7") {
            if (enableErrorMailService) {
                utils.sendErrorNotification(md, worldpayConstants.NOMINAL_VALUE_PAYMENT_ERROR, paymentMthd);
            }
            res.redirect(URLUtils.url('PaymentInstruments-AddPayment', 'cardfail', 'paymentERROR'));
        }
}

/**
 * This controller is responsible for Handling SaveCard authentication response
 */
server.post('HandleSaveCardResponse', server.middleware.https, function (req, res, next) {
    var utils = require('*/cartridge/scripts/common/utils');
    var serviceFacade = require('*/cartridge/scripts/service/serviceFacade');
    var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    var Site = require('dw/system/Site');
    var worldpayPayment = require('*/cartridge/scripts/order/worldpayPayment');
    var enableErrorMailService = Site.getCurrent().getCustomPreferenceValue('enableErrorMailService');
    var URLUtils = require('dw/web/URLUtils');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var error = null;
    //md - merchant supplied data contains the OrderNo
    var md = req.form.MD;
    var errorMessage;

    var pi = request.httpParameterMap.paymentInstrument.value;
    var paymentIntrument = JSON.parse(pi);

    // Fetch the APM Name from the Payment instrument.
    var apmName = PaymentInstrument.METHOD_CREDIT_CARD;

    // Fetch the APM Type from the Payment Method i.e. if the Payment Methoid is of DIRECT or REDIRECT type.
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    WorldpayPreferences = new WorldpayPreferences();
    var preferences = WorldpayPreferences.worldPayPreferencesInit(paymentMthd);

    if (preferences.missingPreferences()) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleSaveCard3ds : Worldpay preferences are not properly set.');
        error = utils.worldpayErrorMessage();
        return {
            error: true,
            success: false,
            errorMessage: error.errorMessage,
            orderNo: md,
        };
    }

    var paRes = req.form.PaRes;
    // Checks if paRes is exist in error codes (Issuer Response for 3D check)
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    if (paRes === null || paRes === worldpayConstants.UNKNOWN_ENTITY || paRes === worldpayConstants.CANCELLEDBYSHOPPER
       || paRes === worldpayConstants.THREEDERROR || paRes === worldpayConstants.THREEDSINVALIDERROR || paRes === worldpayConstants.NOT_IDENTIFIED_NOID) {
        errorMessage = utils.getErrorMessage(paRes);
        Logger.getLogger('worldpay').error('Worldpay.js HandleSaveCardResponse : issuerResponse Error Message : ' + errorMessage);
        if (enableErrorMailService) {
            utils.sendErrorNotification(md, worldpayConstants.AUTHENTICATION_FAILED, paymentMthd);
        }
        res.redirect(URLUtils.url('PaymentInstruments-AddPayment', 'cardfail', 'cardfailerror'));
        return next();
    }

    var SecondAuthorizeRequestResult = serviceFacade.secondAuthenticate3DRequestService(paRes, md, preferences, paymentIntrument);
    var creditcardtype = paymentIntrument.creditCardType;
    var isNominalAuthCard = createRequestHelper.isNominalAuthCard(creditcardtype);
    var nominalCardAmount = Site.current.getCustomPreferenceValue('nominalValue');
    if (SecondAuthorizeRequestResult.error) {
        processSecondAuthorizeRequest(SecondAuthorizeRequestResult , enableErrorMailService ,res);
        return next();
    }
    var result = worldpayPayment.nominalValueCancelrequest(creditcardtype, nominalCardAmount, isNominalAuthCard, md)
    if (result && result.error) {
        res.redirect(URLUtils.url('PaymentInstruments-AddPayment', 'cardfail', 'iavreversalERROR'));
        return next();
    }
    var enableTokenizationPref = Site.getCurrent().getCustomPreferenceValue('WorldpayEnableTokenization');
    if (Site.getCurrent().getCustomPreferenceValue('enableStoredCredentials')) {
        enableTokenizationPref = true;
    }
    var resultCheckAuthorization = worldpayPayment.getTokenProcessUtils(enableTokenizationPref, SecondAuthorizeRequestResult.response, paymentIntrument, Site);
    if (resultCheckAuthorization && resultCheckAuthorization.error) {
        if (enableErrorMailService) {
            utils.sendErrorNotification(md, worldpayConstants.AUTHORIZATION_FAILED, paymentMthd);
        }
        res.redirect(URLUtils.url('PaymentInstruments-AddPayment', 'cardfail', 'cardfailerror'));
        return next();
    }
    res.redirect(URLUtils.url('PaymentInstruments-List'));
    return next();
});

function checkingPreferences(preferences ,orderObj){
    var utils = require('*/cartridge/scripts/common/utils');
    var error = null;
    if (preferences.missingPreferences()) {
        Logger.getLogger('worldpay').error('Worldpay.js Handle3ds : Worldpay preferences are not properly set.');
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
    return null;
}

function getSecondAuthorizeRequestResult(SecondAuthorizeRequestResult ,enableErrorMailService ,orderObj ,apmName,res) {
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var utils = require('*/cartridge/scripts/common/utils');

    Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : ErrorCode : ' +
    SecondAuthorizeRequestResult.errorCode + ' : Error Message : ' + SecondAuthorizeRequestResult.errorMessage);
    if (enableErrorMailService) {
       utils.sendErrorNotification(orderObj.orderNo, worldpayConstants.AUTHENTICATION_FAILED, apmName);
    }
       utils.failImpl(orderObj, SecondAuthorizeRequestResult.errorMessage);
       res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', SecondAuthorizeRequestResult.errorMessage));
}

function handlingError(enableErrorMailService,orderObj,apmName,res) {
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var URLUtils = require('dw/web/URLUtils');
    var utils = require('*/cartridge/scripts/common/utils');

    var error = null;
    if (enableErrorMailService) {
        utils.sendErrorNotification(orderObj.orderNo, worldpayConstants.WORLDPAY_MAC_MISSING_VAL, apmName);
    }
    Transaction.wrap(function () {
        orderObj.custom.worldpayMACMissingVal = true;
    });
    error = utils.worldpayErrorMessage();
    res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', error.errorMessage));
}

function  getResultCheckAuthorization(enableErrorMailService,orderObj,paymentMthd,res,resultCheckAuthorization) {
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var URLUtils = require('dw/web/URLUtils');
    var utils = require('*/cartridge/scripts/common/utils');
    if (enableErrorMailService) {
        utils.sendErrorNotification(orderObj.orderNo, worldpayConstants.AUTHORIZATION_FAILED, paymentMthd);
    }
    res.redirect(URLUtils.url('Cart-Show', 'placeerror', resultCheckAuthorization.errorMessage));
}
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
    var Site = require('dw/system/Site');
    var enableErrorMailService = Site.getCurrent().getCustomPreferenceValue('enableErrorMailService');
    var orderObj;
    if (!orderNo) {
        Logger.getLogger('worldpay').error('Worldpay.js Handle3ds :  Order no. not present in parameters');
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', utils.worldpayErrorMessage()));
        return next();
    }
    try {
        orderObj = OrderManager.getOrder(orderNo);
    } catch (ex) {
        Logger.getLogger('worldpay').error('Worldpay.js Handle3ds :  Invalid Order ');
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
    var preferences = WorldpayPreferences.worldPayPreferencesInit(paymentMthd, orderObj);

    checkingPreferences(preferences , orderObj)
    let SecondAuthorizeRequestResult = require('*/cartridge/scripts/service/serviceFacade').secondAuthorizeRequestService2(orderNo,
        paymentIntrument, req, preferences);

    if (SecondAuthorizeRequestResult.error && orderObj.custom.isInstantPurchaseOrder) {
        delete session.privacy.isInstantPurchaseBasket;
        utils.failImpl(orderObj, SecondAuthorizeRequestResult.errorMessage);
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', SecondAuthorizeRequestResult.errorMessage));
        return next();
    }
    if (SecondAuthorizeRequestResult.error) {
        getSecondAuthorizeRequestResult(SecondAuthorizeRequestResult ,enableErrorMailService ,orderObj ,apmName,res)
        return next();
    }
    // success handling
    if (orderObj == null) {
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }
    if (orderObj.getStatus().value === Order.ORDER_STATUS_FAILED) {
        handlingError(enableErrorMailService,orderObj,apmName,res)
        return next();
    }

    var customerObj = orderObj.customer.authenticated ? orderObj.customer : null;
    var tokenProcessUtils = require('*/cartridge/scripts/common/tokenProcessUtils');
    var resultCheckAuthorization = tokenProcessUtils.checkAuthorization(SecondAuthorizeRequestResult.serviceresponse, paymentIntrument, customerObj);
    if (resultCheckAuthorization.error) {
        if (utils.failImpl(orderObj, resultCheckAuthorization.errorMessage).error) {
            getResultCheckAuthorization(enableErrorMailService,orderObj,paymentMthd,res,resultCheckAuthorization)
            return next();
        }
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', resultCheckAuthorization.errorMessage));
        return next();
    }

    // Places the order
    let ord = orderObj
    var placedOrderResult = COHelpers.placeOrder(ord);
    if (placedOrderResult.error) {
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', Resource.msg('error.technical', 'checkout', null)));
        return next();
    }
    Transaction.wrap(function () {
        ord.custom.WorldpayLastEvent = worldpayConstants.AUTHORIZED;
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
 * function HandleSaveCard3ds is responsible for Handling 3ds flow for MyAccount
 */
server.post('HandleSaveCard3ds', server.middleware.https, function (req, res, next) {
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    var serviceFacade = require('*/cartridge/scripts/service/serviceFacade');
    var Site = require('dw/system/Site');
    var worldpayPayment = require('*/cartridge/scripts/order/worldpayPayment');
    var utils = require('*/cartridge/scripts/common/utils');
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var myMD = request.httpParameterMap;
    var orderNo = myMD.MD.rawValue;
    var URLUtils = require('dw/web/URLUtils');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var error = null;
    var orderObj = OrderMgr.getOrder(orderNo);
    var pi = myMD.paymentInstrument.value;
    var paymentIntrument = JSON.parse(pi);

    // Fetch the APM Name from the Payment instrument.
    var apmName = PaymentInstrument.METHOD_CREDIT_CARD;

    // Fetch the APM Type from the Payment Method i.e. if the Payment Methoid is of DIRECT or REDIRECT type.
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    WorldpayPreferences = new WorldpayPreferences();
    var preferences = WorldpayPreferences.worldPayPreferencesInit(paymentMthd, orderObj);

    if (preferences.missingPreferences()) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleSaveCard3ds : Worldpay preferences are not properly set.');
        error = utils.worldpayErrorMessage();
        return {
            error: true,
            success: false,
            errorMessage: error.errorMessage,
            orderNo: orderObj.orderNo,
        };
    }
    var SecondAuthorizeRequestResult = serviceFacade.secondAuthorizeRequestService2(orderNo, paymentIntrument, req, preferences);
    var creditcardtype = paymentIntrument.creditCardType;
    var isNominalAuthCard = createRequestHelper.isNominalAuthCard(creditcardtype);
    var nominalCardAmount = Site.current.getCustomPreferenceValue('nominalValue');
    if (SecondAuthorizeRequestResult.error) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleSaveCard3ds : ErrorCode : ' +
            SecondAuthorizeRequestResult.errorCode + ' : Error Message : ' + SecondAuthorizeRequestResult.errorMessage);
        res.redirect(URLUtils.url('PaymentInstruments-AddPayment', 'cardfail', 'cardfailerror'));
        return next();
    }
    var result = worldpayPayment.nominalValueCancelrequest(creditcardtype, nominalCardAmount, isNominalAuthCard, orderNo)
    if (result && result.error) {
        res.redirect(URLUtils.url('PaymentInstruments-AddPayment', 'cardfail', 'iavreversalERROR'));
        return next();
    }
    var enableTokenizationPref = Site.getCurrent().getCustomPreferenceValue('WorldpayEnableTokenization');
    if (Site.getCurrent().getCustomPreferenceValue('enableStoredCredentials')) {
        enableTokenizationPref = true;
    }
    var resultCheckAuthorization = worldpayPayment.getTokenProcessUtils(enableTokenizationPref, SecondAuthorizeRequestResult.serviceresponse, paymentIntrument, Site);
    if (resultCheckAuthorization && resultCheckAuthorization.error) {
        if (enableErrorMailService) {
            utils.sendErrorNotification(orderNo, worldpayConstants.AUTHORIZATION_FAILED, paymentMthd);
        }
        res.redirect(URLUtils.url('PaymentInstruments-AddPayment', 'cardfail', 'cardfailerror'));
        return next();
    }
    res.redirect(URLUtils.url('PaymentInstruments-List'));
    return next();
});

/**
 * Notification for worldpay processor
 */
server.post('Notify', server.middleware.https, function (req, res, next) {
    var Site = require('dw/system/Site');
    var isValidateIPAddress = Boolean(Site.getCurrent().getCustomPreferenceValue('ValidateIPAddress'));
    var utils = require('*/cartridge/scripts/common/utils');
    var remoteIpAddress = req.httpHeaders.get('x-forwarded-for');
    if (!remoteIpAddress) {
        res.render('/http_500');
            return next();
    }
    if (isValidateIPAddress) {
        var validateIPStatus = utils.validateIP(remoteIpAddress);
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
 * @returns - errorCode
 */
function getErrorCodes(allupdates, worldpayConstants) {
    var errorCode = worldpayConstants.NOTIFYERRORCODE119;
    if (allupdates.equalsIgnoreCase("true")) {
        errorCode = worldpayConstants.NOTIFYERRORCODE118;
    }
    return errorCode;
}

function renderNotificationUpdates(res, allupdates) {
    var utils = require('*/cartridge/scripts/common/utils');
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var errorCode;
    var errorJson;
    var ojson;
    var statusHist = orderObj.custom.transactionStatus;
    var statusList = new dw.util.ArrayList(statusHist);
    if (!statusList || statusList.length <= 0) {
        errorCode = getErrorCodes(allupdates, worldpayConstants);
        errorJson = utils.getErrorJson(errorCode);
        res.render('/errorjson', {
            errorJson: errorJson
            }
        );
    } else if (allupdates.equalsIgnoreCase("true")) {
        ojson = utils.setStatusList(statusList);
        res.render('/allstatusjson',
            {ojson: ojson}
        );
    } else {
        var object = {};
        var latestStatus = statusList.get(0);
        object.latestStatus = [];
        object.latestStatus.push({"Status":latestStatus});
        // serialize to json string
        ojson = JSON.stringify(object);
        res.render('/lateststatusjson',
            {ojson: ojson}
        );
    }
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
    var errorJson;
    if (orderNo) {
        try {
            var OrderMgr = require('dw/order/OrderMgr');
            orderObj = OrderMgr.getOrder(orderNo);
        } catch (ex) {
            errorCode = worldpayConstants.NOTIFYERRORCODE120;
            errorJson = utils.getErrorJson(errorCode);
            res.render('/errorjson', {
                errorJson: errorJson
                }
            );
            return next();
        }
        if (orderObj) {
            try {
                renderNotificationUpdates(res, allupdates);
            } catch (ex) {
                errorCode = worldpayConstants.NOTIFYERRORCODE115;
                errorJson = utils.getErrorJson(errorCode);
                Logger.getLogger("worldpay").error("Order Notification : Get All Status Update Notifications recieved : " + errorCode + " : " + errorMessage + " : " + ex);
                res.render('/errorjson', {
                    errorJson: errorJson
                    }
                );
            }
            return next();
        }
    }
    errorCode = worldpayConstants.NOTIFYERRORCODE120;
    errorJson = utils.getErrorJson(errorCode);
    res.render('/errorjson', {
        errorJson: errorJson
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
