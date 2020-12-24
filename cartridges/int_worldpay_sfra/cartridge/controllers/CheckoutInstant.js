'use strict';

var server = require('server');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var InstantCOHelper = require('*/cartridge/scripts/checkout/instantCheckoutHelpers');

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

server.post('SubmitOrder', server.middleware.https, function (req, res, next) {
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var array = require('*/cartridge/scripts/util/array');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var HookMgr = require('dw/system/HookMgr');
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var Site = require('dw/system/Site');

    var currentBasket = BasketMgr.getCurrentBasket();
    var shipment = currentBasket.defaultShipment;
    var billingAddress = currentBasket.billingAddress;

    var shippingAddressID = req.form.shippingAddressID;
    var billingAddressID = req.form.billingAddressID;
    var shippingMethodID = req.form.shippingMethodID;
    var savedPaymentID = req.form.savedPaymentID;
    var cvv = req.form.cvv;

    var selectedShippingAddress = InstantCOHelper.getAddressByID(shippingAddressID);
    var selectedBillingAddress = InstantCOHelper.getAddressByID(billingAddressID);
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

    if (shippingAddressID && billingAddressID && shippingMethodID && savedPaymentID) {
        try {
            Transaction.wrap(function () {
                // Setting Shipping Address
                InstantCOHelper.setShippingAddressToBasket(currentBasket, selectedShippingAddress);
                if (shipment && shippingMethodID) {
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

            var processor = PaymentMgr.getPaymentMethod(paymentMethodID).getPaymentProcessor();
            var paymentData = InstantCOHelper.fillPaymentFormFromBasket(currentBasket, paymentInstrument, cvv);
            var result;

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
    next();
});


module.exports = server.exports();
