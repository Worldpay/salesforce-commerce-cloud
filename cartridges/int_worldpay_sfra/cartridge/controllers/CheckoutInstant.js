'use strict';

var server = require('server');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var InstantCOHelper = require('*/cartridge/scripts/checkout/instantCheckoutHelpers');

/**
 * CheckoutInstant-Start : The CheckoutInstant-Start endpoint will render the model
 * data required to bring up the quick checkout modal
 * @name CheckoutInstant-Start
 * @function
 * @memberof Checkout
 * @param {middleware} - server.middleware.https
 * @param {renders} - isml
 */
server.get('Start', server.middleware.https, function (req, res, next) {
    var Template = require('dw/util/Template');
    var HashMap = require('dw/util/HashMap');
    var URLUtils = require('dw/web/URLUtils');
    var CartModel = require('*/cartridge/models/cart');
    var AccountModel = require('*/cartridge/models/account');
    var ResourceBundle = require('*/cartridge/models/resources');
    var currentBasket = BasketMgr.getCurrentBasket();
    var basketModel = new CartModel(currentBasket);

    if (basketModel && basketModel.canMakeInstantPurchase) {
        var accountModel = new AccountModel(req.currentCustomer);
        var Resources = new ResourceBundle();
        var checkoutBeginData = InstantCOHelper.beginCheckout(req);
        var paymentInstruments = customer.profile.wallet.paymentInstruments;
        var template = new Template('cart/instantCheckout/instantCheckoutModal');
        var context = new HashMap();
        var object = {
            account: accountModel,
            orderModel: checkoutBeginData,
            paymentInstruments: paymentInstruments,
            Resources: Resources
        };

        Object.keys(object).forEach(function (key) {
            context.put(key, object[key]);
        });

        Object.keys(checkoutBeginData).forEach(function (key) {
            context.put(key, checkoutBeginData[key]);
        });

        var modalContent = template.render(context).text;
        res.json({
            instantCheckoutContent: modalContent,
            checkoutBeginData: checkoutBeginData
        });
        return next();
    }
    res.json({
        error: true,
        redirectUrl: URLUtils.url('Cart-Show').toString()
    });
    return next();
});

/**
 * This controller takes both shipping method and shipping address and recalculates the basket
 */
server.post('SelectShippingDetails', function (req, res, next) {
    var Locale = require('dw/util/Locale');
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var AccountModel = require('*/cartridge/models/account');
    var OrderModel = require('*/cartridge/models/order');
    var addressID = req.form.seletedShippingAddreesID;
    var shippingMethodID = req.form.methodID;
    var address = InstantCOHelper.getAddressByID(addressID);
    var currentBasket = BasketMgr.getCurrentBasket();
    var shipment = currentBasket.defaultShipment;

    try {
        Transaction.wrap(function () {
            InstantCOHelper.setShippingAddressToBasket(currentBasket, address);
            if (shipment && shippingMethodID) {
                ShippingHelper.selectShippingMethod(shipment, shippingMethodID);
            }
            basketCalculationHelpers.calculateTotals(currentBasket);
        });
    } catch (err) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.cannot.set.shipping.address', 'cart', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    var currentLocale = Locale.getLocale(req.locale.id);
    var basketModel = new OrderModel(
        currentBasket,
        { usingMultiShipping: false, countryCode: currentLocale.country, containerView: 'basket' }
    );
    res.json({
        customer: new AccountModel(req.currentCustomer),
        order: basketModel
    });

    next();
});

/**
 * CheckoutInstant-SelectBillingAddress : The CheckoutInstant-SelectBillingAddress endpoint will set the
 * billing address in the basket.
 * @name CheckoutInstant-SelectBillingAddress
 * @function
 * @memberof Checkout
 * @param {middleware} - server.middleware.https
 * @param {renders} - isml
 */
server.post('SelectBillingAddress', server.middleware.https, function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var billingAddress = currentBasket.billingAddress;
    var addressID = req.form.seletedBillingAddreesID;
    var address = InstantCOHelper.getAddressByID(addressID);

    try {
        Transaction.wrap(function () {
            InstantCOHelper.setBillingAddressToBasket(currentBasket, address);
            // only Registered shopper comes here
            billingAddress.setPhone(req.currentCustomer.profile.phone);
            currentBasket.setCustomerEmail(req.currentCustomer.profile.email);
        });
        res.json({
            error: false
        });
        return next();
    } catch (e) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.cannot.set.billing.address', 'cart', null)
        });
        return next();
    }
});

/**
 * This function returns the result object
 * @param {Object} currentBasket - current currentBasket Object
 * @param {Object} paymentFormData - current paymentData Object
 * @param {Object} paymentMethodID - current paymentMethodID Object
 * @param {Object} req - dw Request object
 * @param {Object} res - dw Response object
 */
function handlingPaymentsObj(currentBasket, paymentFormData, paymentMethodID, req, res) {
    var HookMgr = require('dw/system/HookMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    var result;
    var paymentData = paymentFormData;
    var processor = PaymentMgr.getPaymentMethod(paymentMethodID).getPaymentProcessor();
    if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
        result = HookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(),
            'Handle',
            currentBasket,
            paymentData.paymentInformation,
            paymentMethodID,
            req
        );
    } else {
        result = HookMgr.callHook('app.payment.processor.default', 'Handle');
    }
    if (result.error) {
        delete paymentData.paymentInformation;
        res.json({
            error: true,
            errorMessage: Resource.msg('error.cannot.select.shipping.method', 'cart', null)
        });
        return;
    }

    // Re-calculate the payments.
    var calculatedPaymentTransaction = COHelpers.calculatePaymentTransaction(
        currentBasket
    );

    if (calculatedPaymentTransaction.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.cannot.select.shipping.method', 'cart', null)
        });
        return;
    }
}

/**
 * This function is for Setting the  Shipping/Billing/ Address and Recalculate the basket.
 * @param {Object} shipment - current shipment Object
 * @param {Object} shippingMethodID - current shippingMethodID Object
 * @param {Object} currentBasket -  currentBasket Object
 * @param {Object} req - dw Request object
 */
function addingDetails(shipment, shippingMethodID, currentBasket, req) {
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');


    var billingAddress = currentBasket.billingAddress;
    var shippingAddressID = req.form.shippingAddressID;
    var billingAddressID = req.form.billingAddressID;
    var selectedShippingAddress = InstantCOHelper.getAddressByID(shippingAddressID);
    var selectedBillingAddress = InstantCOHelper.getAddressByID(billingAddressID);

    Transaction.wrap(function () {
        // Setting Shipping Address
        InstantCOHelper.setShippingAddressToBasket(currentBasket, selectedShippingAddress);
        if (shipment) {
            ShippingHelper.selectShippingMethod(shipment, shippingMethodID);
        }

        // Setting Billing Address
        InstantCOHelper.setBillingAddressToBasket(currentBasket, selectedBillingAddress);
        // only Registered shopper comes here
        billingAddress.setPhone(req.currentCustomer.profile.phone);
        currentBasket.setCustomerEmail(req.currentCustomer.profile.email);

        // Recalculate the basket
        basketCalculationHelpers.calculateTotals(currentBasket);
    });
}
/**
 * This method handling the shipping,payments and error.
 * @param {Object} shipment - shipment Object
 * @param {Object} currentBasket - currentBasket Object
 * @param {Object} req - req Object
 * @param {Object} res - res Object
 * @param {Object} paymentInstrument - paymentInstrument Object
 * @param {Object} paymentMethodID - paymentMethodID Object
 */
function processPaymentObj(shipment, currentBasket, req, res, paymentInstrument, paymentMethodID) {
    var shippingAddressID = req.form.shippingAddressID;
    var billingAddressID = req.form.billingAddressID;
    var shippingMethodID = req.form.shippingMethodID;
    var savedPaymentID = req.form.savedPaymentID;
    var cvv = req.form.cvv;
    if (shippingAddressID && billingAddressID && shippingMethodID && savedPaymentID) {
        try {
            addingDetails(shipment, shippingMethodID, currentBasket, req);
            var paymentData = InstantCOHelper.fillPaymentFormFromBasket(currentBasket, paymentInstrument, cvv);
            handlingPaymentsObj(currentBasket, paymentData, paymentMethodID, req, res);
            // If no error caught, mark it as success.
            res.json({
                error: false
            });
        } catch (e) {
            res.json({
                error: true,
                errorMessage: Resource.msg('error.cannot.select.shipping.method', 'cart', null)
            });
        }
    } else {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.cannot.select.shipping.method', 'cart', null)
        });
    }
}
/**
 * CheckoutInstant-SubmitOrder : The CheckoutInstant-SubmitOrder endpoint will put the customer
 * basket to the order creation process.
 * @name CheckoutInstant-SubmitOrder
 * @function
 * @memberof Checkout
 * @param {middleware} - server.middleware.https
 * @param {renders} - isml
 */
server.post('SubmitOrder', server.middleware.https, function (req, res, next) {
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var array = require('*/cartridge/scripts/util/array');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var Site = require('dw/system/Site');
    var currentBasket = BasketMgr.getCurrentBasket();
    var shipment = currentBasket.defaultShipment;
    var savedPaymentID = req.form.savedPaymentID;
    var cvv = req.form.cvv;
    var isCVVDisabled = Site.getCurrent().getCustomPreferenceValue('WorldpayDisableCVV');

    if (!isCVVDisabled && !cvv) {
        res.json({
            error: true,
            missingCVV: true,
            cvvErrorMessage: Resource.msg('error.quick.checkout.missing.cvv', 'cart', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }
    if (!isCVVDisabled && !InstantCOHelper.isValidCVV(cvv)) {
        res.json({
            error: true,
            invalidCVV: true,
            cvvErrorMessage: Resource.msg('error.quick.checkout.invalid.cvv', 'cart', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    if (!currentBasket) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.cannot.select.shipping.method', 'cart', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    var validatedProducts = validationHelpers.validateProducts(currentBasket);
    if (validatedProducts.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.cannot.select.shipping.method', 'cart', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    // if there is no selected payment option and balance is greater than zero
    if (!savedPaymentID && currentBasket.totalGrossPrice.value > 0) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.no.selected.payment.method', 'payment', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    // Get the paymentInstrument from UUID
    var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
    var paymentInstrument = array.find(paymentInstruments, function (item) {
        return savedPaymentID === item.UUID;
    });

    if (!paymentInstrument) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.no.selected.payment.method', 'cart', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    if (!isCVVDisabled && !InstantCOHelper.isValidCVVLength(paymentInstrument.creditCardType, cvv)) {
        res.json({
            error: true,
            invalidCVV: true,
            cvvErrorMessage: 'Invalid CVV'
        });
        this.emit('route:Complete', req, res);
        return;
    }

    // Validate payment instrument
    var creditCardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
    var paymentCard = PaymentMgr.getPaymentCard(paymentInstrument.creditCardType);
    var applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
        req.currentCustomer.raw,
        req.geolocation.countryCode,
        null
    );

    if (!applicablePaymentCards.contains(paymentCard)) {
        // Invalid Payment Instrument
        res.json({
            error: true,
            errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    session.privacy.isInstantPurchaseBasket = true;

    // check to make sure there is a payment processor
    var paymentMethodID = paymentInstrument.raw.paymentMethod;
    if (!PaymentMgr.getPaymentMethod(paymentMethodID).paymentProcessor) {
        throw new Error(Resource.msg(
            'error.payment.processor.missing',
            'checkout',
            null
        ));
    }
    processPaymentObj(shipment, currentBasket, req, res, paymentInstrument, paymentMethodID);
    next();
});

module.exports = server.exports();
