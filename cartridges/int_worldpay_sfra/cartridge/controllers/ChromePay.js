/* eslint-disable require-jsdoc */
'use strict';

var server = require('server');
var Transaction = require('dw/system/Transaction');
var BasketMgr = require('dw/order/BasketMgr');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var ChromeHelpers = require('*/cartridge/scripts/checkout/chromePayHelpers');
var Resource = require('dw/web/Resource');
var OrderMgr = require('dw/order/OrderMgr');
var Logger = require('dw/system/Logger');

server.get('Start', function (req, res, next) {
    var CartModel = require('*/cartridge/models/cart');
    var ChromePaymentModel = require('*/cartridge/models/chromepayment');
    var currentBasket = BasketMgr.getCurrentBasket();
    if (currentBasket) {
        var cartModel = new CartModel(currentBasket);
        if (cartModel) {
            var chromePaymentModel = new ChromePaymentModel(cartModel, req);
            res.json({
                success: true,
                chromePayment: chromePaymentModel
            });
            next();
        }
    } else {
        res.json({
            success: false
        });
        next();
    }
});
function handleCCAuthorizeReqResultError(res, handlePaymentResult, orderObj) {
    var URLUtils = require('dw/web/URLUtils');
    Transaction.wrap(function () {
        OrderMgr.failOrder(orderObj, true);
    });
    res.json({
        error: true,
        redirectUrl: URLUtils.url('Cart-Show', 'placeerror', handlePaymentResult.CCAuthorizeRequestResult.errorMessage).toString(),
        errorMessage: handlePaymentResult.CCAuthorizeRequestResult.errorMessage
    });

    if (!empty(session.privacy.currentOrderNo)) {
        delete session.privacy.currentOrderNo;
    }
}
server.post('PlaceOrder', server.middleware.https, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var utils = require('*/cartridge/scripts/common/utils');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();
    var params = request.httpParameterMap;
    var instrumentDetails = params.instrumentString;
    var instrumentDetailsJson = JSON.parse(instrumentDetails);
    var encryptedData = params.encryptedData;
    var cardTypeString = params.cardTypeString;
    var cardType = JSON.parse(cardTypeString).type;
    var cvc = instrumentDetailsJson.details.cardSecurityCode;
    var cardHolderName = instrumentDetailsJson.details.cardholderName;
    var cardNumber = instrumentDetailsJson.details.cardNumber;
    var expiryMonth = instrumentDetailsJson.details.expiryMonth;
    var expiryYear = instrumentDetailsJson.details.expiryYear;
    var dataSessionId = params.dataSessionId.value;
    Transaction.wrap(function () {
        currentBasket.custom.dataSessionID = dataSessionId;
    });

    var paymentPrice = utils.calculateNonGiftCertificateAmountFromBasket(currentBasket);
    var PaymentDetails = {
        cvc: cvc,
        cardHolderName: cardHolderName,
        cardNumber: cardNumber,
        expiryMonth: expiryMonth,
        expiryYear: expiryYear,
        paymentPrice: paymentPrice,
        cardType: cardType
    };
    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }
    var validatedProducts = validationHelpers.validateProducts(currentBasket);
    if (validatedProducts.error) {
        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }
    var validationBasketStatus = hooksHelper('app.validate.basket', 'validateBasket', currentBasket, false, require('*/cartridge/scripts/hooks/validateBasket').validateBasket);
    if (validationBasketStatus.error) {
        res.json({
            error: true,
            errorMessage: validationBasketStatus.message
        });
        return next();
    }
    var billingAddress = instrumentDetailsJson.shippingAddress;
    var shippingAddress = instrumentDetailsJson.shippingAddress;
    var billingForm = COHelpers.prepareBillingForm(currentBasket);
    billingForm.creditCardFields.cardNumber.value = cardNumber;
    billingForm.creditCardFields.securityCode.value = cvc;
    billingForm.creditCardFields.encryptedData.value = encryptedData;
    // validate payment
    ChromeHelpers.createpaymentInstrument(currentBasket, PaymentDetails);
    ChromeHelpers.setShippingAddressOnBasket(currentBasket, shippingAddress);
    ChromeHelpers.setBillingAddressOnBasket(currentBasket, billingAddress);
    var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket, require('*/cartridge/scripts/hooks/validateOrder').validateOrder);
    if (validationOrderStatus.error) {
        res.json({
            error: true,
            errorMessage: validationOrderStatus.message
        });
        return next();
    }
    Transaction.wrap(function () {
        currentBasket.setCustomerEmail(instrumentDetailsJson.payerEmail);
    });

    // Re-validates existing payment instruments
    var validPayment = COHelpers.validatePayment(req, currentBasket);
    if (validPayment.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
        });
        return next();
    }
    // Calculate the basket
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });
    // Re-calculate the payments.
    var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
    if (calculatedPaymentTransactionTotal.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }
    var orderObj = COHelpers.createOrder(currentBasket);

    session.privacy.currentOrderNo = orderObj.orderNo;
    if (!orderObj) {
        res.json({
            error: true
        });

        return next();
    }
    var handlePaymentResult = ChromeHelpers.ccAuthorizeRequestServiceChromePay(orderObj, cardNumber, encryptedData, cvc);
    if (handlePaymentResult.CCAuthorizeRequestResult.error) {
        handleCCAuthorizeReqResultError(res, handlePaymentResult, orderObj);
        return next();
    }
    if (handlePaymentResult.CCAuthorizeRequestResult.is3D) {
        req.session.privacyCache.set('echoData', handlePaymentResult.echoData);
        var termUrlNew = URLUtils.https('ChromePay-HandleAuthenticationResponse').toString();
        res.json({
            error: false,
            orderID: orderObj.orderNo,
            orderToken: orderObj.orderToken,
            continueUrl: URLUtils.url('Worldpay-Worldpay3D', 'IssuerURL',
                handlePaymentResult.CCAuthorizeRequestResult.redirectUrl,
                'PaRequest',
                handlePaymentResult.CCAuthorizeRequestResult.paRequest,
                'TermURL',
                termUrlNew,
                'MD',
                orderObj.orderNo).toString()
        });
        return next();
    } else if (handlePaymentResult.CCAuthorizeRequestResult.threeDSVersion) {
        res.json({
            error: false,
            orderID: orderObj.orderNo,
            orderToken: orderObj.orderToken,
            continueUrl: URLUtils.url('ChromePay-Worldpay3DS2', 'acsURL',
                handlePaymentResult.CCAuthorizeRequestResult.acsURL,
                'payload',
                handlePaymentResult.CCAuthorizeRequestResult.payload,
                'threeDSVersion',
                handlePaymentResult.CCAuthorizeRequestResult.threeDSVersion,
                'transactionId3DS',
                handlePaymentResult.CCAuthorizeRequestResult.transactionId3DS).toString()
        });

        return next();
    } else if (handlePaymentResult.CCAuthorizeRequestResult.authorized) {
        var placeOrderResult = COHelpers.placeOrder(orderObj);
        if (placeOrderResult.error) {
            res.redirect(URLUtils.url('Cart-Show', 'placeerror', Resource.msg('error.technical', 'checkout', null)));
            return next();
        }
    }

    if (!empty(session.privacy.currentOrderNo)) {
        delete session.privacy.currentOrderNo;
    }
    COHelpers.sendConfirmationEmail(orderObj, req.locale.id);
        // Reset usingMultiShip after successful Order placement
    res.json({
        error: false,
        orderID: orderObj.orderNo,
        orderToken: orderObj.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString()
    });
    return next();
});

function secondAuthReqResult(SecondAuthorizeRequestResult, order, utils, err, res) {
    var URLUtils = require('dw/web/URLUtils');
    var Order = require('dw/order/Order');
    var orderObj = order;
    var error = err;
    if (SecondAuthorizeRequestResult.error) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : ErrorCode : ' + SecondAuthorizeRequestResult.errorCode +
            ' : Error Message : ' + SecondAuthorizeRequestResult.errorMessage);
        utils.failImpl(orderObj, SecondAuthorizeRequestResult.errorMessage);
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', SecondAuthorizeRequestResult.errorMessage));
        return true;
    }

  // success handling
    if (orderObj == null) {
        res.redirect(URLUtils.url('Cart-Show'));
        return true;
    }
    if (orderObj.getStatus().value === Order.ORDER_STATUS_FAILED) {
        Transaction.wrap(function () {
            orderObj.custom.worldpayMACMissingVal = true;
        });
        error = utils.worldpayErrorMessage();
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', error.errorMessage));
        return true;
    }
    return false;
}
server.post('HandleAuthenticationResponse', server.middleware.https, function (req, res, next) {
    var utils = require('*/cartridge/scripts/common/utils');
    var URLUtils = require('dw/web/URLUtils');
    var OrderManager = require('dw/order/OrderMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var error = null;
    var orderObj;

  // md - merchant supplied data contains the OrderNo
    let md = req.form.MD ? req.form.MD : null;
    let orderNumber = md;

    if (!orderNumber) {
        Logger.getLogger('worldpay').error('ChromePay.js HandleAuthenticationResponse :  Order number not present in parameters');
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', utils.worldpayErrorMessage()));
        return next();
    }
    try {
        orderObj = OrderManager.getOrder(orderNumber);
    } catch (ex) {
        Logger.getLogger('worldpay').error('ChromePay.js HandleAuthenticationResponse :  Invalid Order ');
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', utils.worldpayErrorMessage()));
        return next();
    }

    // Fetch the APM Name from the Payment isntrument.
    let paymentIntrument = utils.getPaymentInstrument(orderObj);
    let apmName = paymentIntrument.getPaymentMethod();
  // Fetch the APM Type from the Payment Method i.e. if the Payment Methoid is of DIRECT or REDIRECT type.
    let paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    let WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    WorldpayPreferences = new WorldpayPreferences();
    let preferences = WorldpayPreferences.worldPayPreferencesInit(paymentMthd, orderObj);

    if (preferences.missingPreferences()) {
        Logger.getLogger('worldpay').error('ChromePay.js HandleAuthenticationResponse : Worldpay preferences are not properly set.');
        error = utils.worldpayErrorMessage();
        utils.failImpl(orderObj, error.errorMessage);
        return { error: true, success: false, errorMessage: error.errorMessage, orderNo: orderObj.orderNo, orderToken: orderObj.orderToken };
    }

    var paRes = req.form.PaRes;
  // Checks if paRes is exist in error codes (Issuer Response fro 3D check)
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    if (paRes === null || paRes === worldpayConstants.UNKNOWN_ENTITY || paRes === worldpayConstants.CANCELLEDBYSHOPPER
  || paRes === worldpayConstants.THREEDERROR || paRes === worldpayConstants.THREEDSINVALIDERROR || paRes === worldpayConstants.NOT_IDENTIFIED_NOID) {
        var errorMessage = utils.getErrorMessage(paRes);
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : issuerResponse Error Message : ' + errorMessage);
        utils.failImpl(orderObj, errorMessage);
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', errorMessage));
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
    var result = secondAuthReqResult(SecondAuthorizeRequestResult, orderObj, utils, error, res);
    if (result) {
        return next();
    }
    var customerObj = orderObj.customer.authenticated ? orderObj.customer : null;
    var tokenProcessUtils = require('*/cartridge/scripts/common/tokenProcessUtils');
    var resultCheckAuthorization = tokenProcessUtils.checkAuthorization(SecondAuthorizeRequestResult.response, paymentIntrument, customerObj);

    if (resultCheckAuthorization.error) {
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', resultCheckAuthorization.errorMessage));
        return next();
    }

    // Places the order
    var placeOrderResult = COHelpers.placeOrder(orderObj);
    if (placeOrderResult.error) {
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', Resource.msg('error.technical', 'checkout', null)));
        return next();
    }
    Transaction.wrap(function () {
        orderObj.custom.WorldpayLastEvent = worldpayConstants.AUTHORIZED;
    });

    if (!empty(session.privacy.currentOrderNo)) {
        delete session.privacy.currentOrderNo;
    }
    COHelpers.sendConfirmationEmail(orderObj, req.locale.id);
    res.render('/checkout/orderConfirmForm', {
        error: false,
        orderID: orderObj.orderNo,
        orderToken: orderObj.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString()
    });
    return next();
});

server.get('Ddc', server.middleware.https, function (req, res, next) {
    var serviceFacade = require('*/cartridge/scripts/service/serviceFacade');

    var bin = request.httpParameterMap.bin.value;

    var JWT = request.httpParameterMap.JWT.value;
    var serviceCall = serviceFacade.getDDCResponse(bin, JWT);
    res.json({
        error: false,
        responseObject: serviceCall.responseObject
    });
    return next();
});

server.post('Worldpay3DS2', server.middleware.https, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var acsURL = req.querystring.acsURL;
    var payload = req.querystring.payload;
    var transactionId3DS = req.querystring.transactionId3DS;
    var MD = req.form.orderID;
    var error3D1 = Resource.msg('worldpay.redirect.error1', 'worldpayerror', null);
    var error3D2 = Resource.msg('worldpay.redirect.error2', 'worldpayerror', null);
    var message3D = Resource.msg('worldpay.3dsecure.message', 'worldpay', null);
    var WorldpayHelper = require('*/cartridge/scripts/common/threeDFlexHelper');
    var intJwtResult = WorldpayHelper.initJwtcreation();
    var JWTdata = {
        jti: intJwtResult.jti,
        iat: intJwtResult.iat,
        iss: intJwtResult.iss,
        OrgUnitId: intJwtResult.OrgUnitId,
        ReturnUrl: URLUtils.https('ChromePay-Handle3ds').toString(),
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
server.post('Handle3ds', server.middleware.https, function (req, res, next) {
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var utils = require('*/cartridge/scripts/common/utils');
    var myMD = request.httpParameterMap;
    var orderNumber = myMD.MD.rawValue;
    var URLUtils = require('dw/web/URLUtils');
    var OrderManager = require('dw/order/OrderMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var error = null;
    var orderObj;
    if (!orderNumber) {
        Logger.getLogger('worldpay').error('ChromePay.js Handle3ds :  Order no. not present in parameters');
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', utils.worldpayErrorMessage()));
        return next();
    }

    try {
        orderObj = OrderManager.getOrder(orderNumber);
    } catch (ex) {
        Logger.getLogger('worldpay').error('ChromePay.js Handle3ds :  Invalid Order ');
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', utils.worldpayErrorMessage()));
        return next();
    }
    // Fetch the APM Name from the Payment isntrument.
    var paymentIntrument = utils.getPaymentInstrument(orderObj);
    var apmName = paymentIntrument.getPaymentMethod();
  // Fetch the APM Type from the Payment Method i.e. if the Payment Methoid is of DIRECT or REDIRECT type.
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    WorldpayPreferences = new WorldpayPreferences();
    var preferences = WorldpayPreferences.worldPayPreferencesInit(paymentMthd, orderObj);

    if (preferences.missingPreferences()) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : Worldpay preferences are not properly set.');
        error = utils.worldpayErrorMessage();
        utils.failImpl(orderObj, error.errorMessage);
        return { error: true, success: false, errorMessage: error.errorMessage, orderNumber: orderObj.orderNo, orderToken: orderObj.orderToken };
    }
 // Capturing Issuer Response
    var SecondAuthorizeRequestResult = require('*/cartridge/scripts/service/serviceFacade').secondAuthorizeRequestService2(orderNumber,
        paymentIntrument, req, preferences);
    var result = secondAuthReqResult(SecondAuthorizeRequestResult, orderObj, utils, error, res);
    if (result) {
        return next();
    }
    var customerObj = orderObj.customer.authenticated ? orderObj.customer : null;
    var tokenProcessUtils = require('*/cartridge/scripts/common/tokenProcessUtils');
    var resultCheckAuthorization = tokenProcessUtils.checkAuthorization(SecondAuthorizeRequestResult.serviceresponse, paymentIntrument, customerObj);
    if (resultCheckAuthorization.error) {
        if (utils.failImpl(orderObj, resultCheckAuthorization.errorMessage).error) {
            Logger.getLogger('worldpay').error('ChromePay.js Handle3ds : failing on order ');
            res.redirect(URLUtils.url('Cart-Show', 'placeerror', resultCheckAuthorization.errorMessage));
            return next();
        }
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', resultCheckAuthorization.errorMessage));
        return next();
    }

    // Places the order
    let placeOrderResult = COHelpers.placeOrder(orderObj);
    if (placeOrderResult.error) {
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', Resource.msg('error.technical', 'checkout', null)));
        return next();
    }
    // sets worldPay lastevent
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

server.get('GetPaymentManifest', server.middleware.https, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    res.setHttpHeader('Link', '<' + URLUtils.https('ChromePay-PaymentManifest').toString() + '>; rel="payment-method-manifest"');
    res.json({
        success: true
    });
    return next();
});

server.get('PaymentManifest', server.middleware.https, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    res.json({
        default_applications: [URLUtils.https('ChromePay-Manifest').toString()]
    });
    return next();
});

server.get('Manifest', server.middleware.https, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var response = {
        name: 'Pay with Worldpay',
        short_name: 'Worldpay',
        description: 'Worldpay Payments',
        icons: [
            {
                src: URLUtils.staticURL('/images/worldpay-logo_ChromePay.png').toString(),
                sizes: '48x48',
                type: 'image/png'
            }
        ],
        serviceworker: {
            src: URLUtils.httpsStatic('/js/serviceWorker.js').toString(),
            scope: URLUtils.httpsStatic('/js/').toString(),
            use_cache: false
        }
    };
    res.json(response);
    return next();
});

module.exports = server.exports();
