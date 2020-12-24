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

server.post('PlaceOrder', server.middleware.https, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var Utils = require('*/cartridge/scripts/common/Utils');
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

    var paymentPrice = Utils.calculateNonGiftCertificateAmountFromBasket(currentBasket);
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
    var billingAddress = instrumentDetailsJson.details.billingAddress;
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
        Transaction.wrap(function () { OrderMgr.failOrder(orderObj, true); });
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show', 'placeerror', handlePaymentResult.CCAuthorizeRequestResult.errorMessage).toString()
        });

        if (!empty(session.privacy.currentOrderNo)) {
            delete session.privacy.currentOrderNo;
        }
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
        redirectUrl: URLUtils.url('Order-Confirm', 'ID', orderObj.orderNo, 'token', orderObj.orderToken).toString()
    });
    return next();
});

server.post('HandleAuthenticationResponse', server.middleware.https, function (req, res, next) {
    var Utils = require('*/cartridge/scripts/common/Utils');
    var URLUtils = require('dw/web/URLUtils');
    var OrderManager = require('dw/order/OrderMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var Order = require('dw/order/Order');
    var error = null;
    var orderObj;

  // md - merchant supplied data contains the OrderNo
    var md = req.form.MD ? req.form.MD : null;
    var orderNo = md;

    if (!orderNo) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse :  Order no. not present in parameters');
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', Utils.worldpayErrorMessage()));
        return next();
    }


    try {
        orderObj = OrderManager.getOrder(orderNo);
    } catch (ex) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse :  Invalid Order ');
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', Utils.worldpayErrorMessage()));
        return next();
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
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : Worldpay preferences are not properly set.');
        error = Utils.worldpayErrorMessage();
        Utils.failImpl(orderObj, error.errorMessage);
        return { error: true, success: false, errorMessage: error.errorMessage, orderNo: orderObj.orderNo, orderToken: orderObj.orderToken };
    }

    var paRes = req.form.PaRes;
  // Checks if paRes is exist in error codes (Issuer Response fro 3D check)
    var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
    if (paRes === null || paRes === WorldpayConstants.UNKNOWN_ENTITY || paRes === WorldpayConstants.CANCELLEDBYSHOPPER
  || paRes === WorldpayConstants.THREEDERROR || paRes === WorldpayConstants.THREEDSINVALIDERROR || paRes === WorldpayConstants.NOT_IDENTIFIED_NOID) {
        var errorMessage = Utils.getErrorMessage(paRes);
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : issuerResponse Error Message : ' + errorMessage);
        var failRes = Utils.failImpl(orderObj, errorMessage);
        if (failRes.error) {
            res.redirect(URLUtils.url('Cart-Show', 'placeerror', failRes.errorMessage));
            return next();
        }
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
    var SecondAuthorizeRequestResult = require('*/cartridge/scripts/service/ServiceFacade').secondAuthorizeRequestService(orderObj,
        req,
        paymentIntrument,
        preferences,
        paRes,
        md,
        echoData,
        cardNumber,
        encryptedData,
        cvn);

    if (SecondAuthorizeRequestResult.error) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : ErrorCode : ' + SecondAuthorizeRequestResult.errorCode +
            ' : Error Message : ' + SecondAuthorizeRequestResult.errorMessage);
        Utils.failImpl(orderObj, SecondAuthorizeRequestResult.errorMessage);
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', SecondAuthorizeRequestResult.errorMessage));
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
        error = Utils.worldpayErrorMessage();
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', error.errorMessage));
        return next();
    }

    var customerObj = orderObj.customer.authenticated ? orderObj.customer : null;
    var TokenProcessUtils = require('*/cartridge/scripts/common/TokenProcessUtils');
    var resultCheckAuthorization = TokenProcessUtils.checkAuthorization(SecondAuthorizeRequestResult.response, paymentIntrument, customerObj);
    if (resultCheckAuthorization.error) {
        if (Utils.failImpl(orderObj, resultCheckAuthorization.errorMessage).error) {
            res.redirect(URLUtils.url('Cart-Show', 'placeerror', resultCheckAuthorization.errorMessage));
            return next();
        }
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
        orderObj.custom.WorldpayLastEvent = WorldpayConstants.AUTHORIZED;
    });

    if (!empty(session.privacy.currentOrderNo)) {
        delete session.privacy.currentOrderNo;
    }
    COHelpers.sendConfirmationEmail(orderObj, req.locale.id);
    res.redirect(URLUtils.url('Order-Confirm', 'ID', orderObj.orderNo, 'token', orderObj.orderToken).toString());
    return next();
});

server.get('Ddc', server.middleware.https, function (req, res, next) {
    var ServiceFacade = require('*/cartridge/scripts/service/ServiceFacade');

    var bin = request.httpParameterMap.bin.value;

    var JWT = request.httpParameterMap.JWT.value;
    var serviceCall = ServiceFacade.getDDCResponse(bin, JWT);
    res.json({
        error: false,
        responseObject: serviceCall.responseObject
    });
    return next();
});


server.get('Worldpay3DS2', server.middleware.https, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var acsURL = req.querystring.acsURL;
    var payload = req.querystring.payload;
    var transactionId3DS = req.querystring.transactionId3DS;
    var MD = req.querystring.ID;
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
    var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
    var Utils = require('*/cartridge/scripts/common/Utils');

    var myMD = request.httpParameterMap;
    var orderNo = myMD.MD.rawValue;
    var URLUtils = require('dw/web/URLUtils');
    var OrderManager = require('dw/order/OrderMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var Order = require('dw/order/Order');
    var error = null;
    var orderObj;
    if (!orderNo) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse :  Order no. not present in parameters');
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', Utils.worldpayErrorMessage()));
        return next();
    }


    try {
        orderObj = OrderManager.getOrder(orderNo);
    } catch (ex) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse :  Invalid Order ');
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', Utils.worldpayErrorMessage()));
        return next();
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
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : Worldpay preferences are not properly set.');
        error = Utils.worldpayErrorMessage();
        Utils.failImpl(orderObj, error.errorMessage);
        return { error: true, success: false, errorMessage: error.errorMessage, orderNo: orderObj.orderNo, orderToken: orderObj.orderToken };
    }
 // Capturing Issuer Response
    var SecondAuthorizeRequestResult = require('*/cartridge/scripts/service/ServiceFacade').secondAuthorizeRequestService2(orderNo,
        paymentIntrument, req, preferences);

    if (SecondAuthorizeRequestResult.error) {
        Logger.getLogger('worldpay').error('Worldpay.js HandleAuthenticationResponse : ErrorCode : ' + SecondAuthorizeRequestResult.errorCode +
            ' : Error Message : ' + SecondAuthorizeRequestResult.errorMessage);
        Utils.failImpl(orderObj, SecondAuthorizeRequestResult.errorMessage);
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', SecondAuthorizeRequestResult.errorMessage));
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
        error = Utils.worldpayErrorMessage();
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', error.errorMessage));
        return next();
    }

    var customerObj = orderObj.customer.authenticated ? orderObj.customer : null;
    var TokenProcessUtils = require('*/cartridge/scripts/common/TokenProcessUtils');
    var resultCheckAuthorization = TokenProcessUtils.checkAuthorization(SecondAuthorizeRequestResult.serviceresponse, paymentIntrument, customerObj);
    if (resultCheckAuthorization.error) {
        if (Utils.failImpl(orderObj, resultCheckAuthorization.errorMessage).error) {
            res.redirect(URLUtils.url('Cart-Show', 'placeerror', resultCheckAuthorization.errorMessage));
            return next();
        }
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
        orderObj.custom.WorldpayLastEvent = WorldpayConstants.AUTHORIZED;
    });

    if (!empty(session.privacy.currentOrderNo)) {
        delete session.privacy.currentOrderNo;
    }
    COHelpers.sendConfirmationEmail(orderObj, req.locale.id);
      // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set('usingMultiShipping', false);
    res.redirect(URLUtils.url('Order-Confirm', 'ID', orderObj.orderNo, 'token', orderObj.orderToken).toString());

    return next();
});

module.exports = server.exports();
