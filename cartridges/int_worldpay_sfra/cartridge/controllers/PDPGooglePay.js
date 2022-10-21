'use strict';

var server = require('server');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var Logger = require('dw/system/Logger');
var gPayHelper = require('*/cartridge/scripts/checkout/gPayHelpers');

/**
 * PDPGooglePay-GetCurrentBasket : The PDPGooglePay-GetCurrentBasket endpoint will return the all totals
 * and current basket
 * @name PDPGooglePay-GetCurrentBasket
 * @function
 * @memberof Checkout
 * @param {middleware} - server.middleware.https
 * @param {renders} - isml
 */
server.get('GetCurrentBasket', server.middleware.https, function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.json({
            error: true
        });
        return next();
    }
    Transaction.wrap(function () {
        gPayHelper.removeBonusDiscountLineItems(currentBasket);
        currentBasket.updateTotals();
    });
    res.json({
        shippingTotal: currentBasket.getShippingTotalPrice().value.toString(),
        taxTotal: currentBasket.getTotalTax().value.toString(),
        grossTotal: currentBasket.getTotalGrossPrice().value.toString()
    });
    return next();
});

/**
 * PDPGooglePay-PrepareBasket : The PDPGooglePay-PrepareBasket endpoint will delete everything
 * that is present in current basket
 * @name PDPGooglePay-PrepareBasket
 * @function
 * @memberof Checkout
 * @param {middleware} - server.middleware.https
 * @param {renders} - isml
 */
server.get('PrepareBasket', server.middleware.https, function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.json({
            error: true
        });
        return next();
    }
    try {
        Transaction.wrap(function () {
            currentBasket.removeAllPaymentInstruments();
            gPayHelper.removeBonusDiscountLineItems(currentBasket);
            gPayHelper.removeCouponLineItem(currentBasket);
            gPayHelper.removeGiftCertificateLineItem(currentBasket);
            gPayHelper.removePriceAdjustment(currentBasket);
            gPayHelper.removeAllProductLineItems(currentBasket);
            currentBasket.updateTotals();
        });
        res.json({
            error: false
        });
    } catch (err) {
        Logger.getLogger('worldpay').error(err.message);
        res.json({
            error: true
        });
    }
    return next();
});

/**
 * PDPGooglePay-SelectShippingDetails : The PDPGooglePay-SelectShippingDetails endpoint
 * takes both shipping method and shipping address and recalculates the basket
 * @name PDPGooglePay-SelectShippingDetails
 * @function
 * @param {middleware} - server.middleware.https
 */
server.post('SelectShippingDetails', function (req, res, next) {
    var shippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    try {
        var shippingMethodID;
        var form = req.form;
        if (form.shippingMethodId) {
            shippingMethodID = form.shippingMethodId.toString();
        }
        var currentBasket = BasketMgr.getCurrentBasket();
        var shipment = currentBasket.defaultShipment;
        var address = {
            fullName: form.shippingAddressFullName,
            address1: form.shippingAddressAddress1,
            address2: form.shippingAddressAddress2,
            city: form.shippingAddressCity,
            postalCode: form.shippingAddressPostalCode,
            stateCode: form.shippingAddressStateCode,
            countryCode: form.shippingAddressCountryCode,
            phone: form.shippingAddressPhone
        };
        Transaction.wrap(function () {
            gPayHelper.setShippingAddressToBasket(currentBasket, address);
            if (shipment && shippingMethodID) {
                shippingHelper.selectShippingMethod(shipment, shippingMethodID);
            }
            basketCalculationHelpers.calculateTotals(currentBasket);
        });
        res.json({
            error: false
        });
    } catch (err) {
        Logger.getLogger('worldpay').error(err.message);
        res.json({
            error: true,
            errorMessage: Resource.msg('error.cannot.set.shipping.address', 'cart', null)
        });
    }
    next();
});

/**
 * PDPGooglePay-SelectBillingAddress : The PDPGooglePay-SelectBillingAddress endpoint will set the
 * billing address in the basket.
 * @name PDPGooglePay-SelectBillingAddress
 * @function
 * @param {middleware} - server.middleware.https
 */
server.post('SelectBillingAddress', server.middleware.https, function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var form = req.form;
    var address = {
        fullName: form.billingAddressFullName,
        address1: form.billingAddressAddress1,
        address2: form.billingAddressAddress2,
        city: form.billingAddressCity,
        postalCode: form.billingAddressPostalCode,
        stateCode: form.billingAddressStateCode,
        countryCode: form.billingAddressCountryCode,
        phone: form.billingAddressPhone,
        email: form.email
    };
    gPayHelper.beginCheckout(req, address);
    try {
        Transaction.wrap(function () {
            gPayHelper.setBillingAddressToBasket(currentBasket, address);
        });
        Transaction.wrap(function () {
            if (req.currentCustomer && req.currentCustomer.profile && req.currentCustomer.profile.email) {
                currentBasket.setCustomerEmail(req.currentCustomer.profile.email);
            } else {
                currentBasket.setCustomerEmail(address.email);
            }
        });
        res.json({
            error: false
        });
    } catch (e) {
        Logger.getLogger('worldpay').error(e.message);
        res.json({
            error: true,
            errorMessage: Resource.msg('error.cannot.set.billing.address', 'cart', null)
        });
    }
    return next();
});

/**
 * PDPGooglePay-SubmitOrder : The PDPGooglePay-SubmitOrder endpoint will put the customer
 * basket to the order creation process.
 * @name PDPGooglePay-SubmitOrder
 * @function
 * @memberof Checkout
 * @param {middleware} - server.middleware.https
 */
server.post('SubmitOrder', server.middleware.https, function (req, res, next) {
    var checkoutHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var paymentMgr = require('dw/order/PaymentMgr');
    var hookMgr = require('dw/system/HookMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var result;
    if (!currentBasket) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.cart.expired', 'cart', null)
        });
        return;
    }
    currentBasket.updateTotals();
    var validatedProducts = validationHelpers.validateProducts(currentBasket);
    if (validatedProducts.error) {
        res.json({
            error: true
        });
        return;
    }
    // check to make sure there is a payment processor
    var paymentMethodID = worldpayConstants.GOOGLEPAY;
    var processor = paymentMgr.getPaymentMethod(paymentMethodID).getPaymentProcessor();
    if (!processor) {
        throw new Error(Resource.msg(
            'error.payment.processor.missing',
            'checkout',
            null
        ));
    }
    try {
        Transaction.wrap(function () {
            // Recalculate the basket
            basketCalculationHelpers.calculateTotals(currentBasket);
        });
        var paymentData = gPayHelper.fillPaymentFormFromBasket(currentBasket, paymentMethodID);
        if (hookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
            result = hookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(),
                'Handle',
                currentBasket,
                paymentData.paymentInformation,
                paymentMethodID,
                req
            );
        } else {
            result = hookMgr.callHook('app.payment.processor.default', 'Handle');
        }
        if (result.error) {
            delete paymentData.paymentInformation;
            res.json({
                error: true
            });
            return;
        }
        // Re-calculate the payments.
        var calculatedPaymentTransaction = checkoutHelpers.calculatePaymentTransaction(currentBasket);
        if (calculatedPaymentTransaction.error) {
            res.json({
                error: true
            });
            return;
        }
        // If no error caught, mark it as success.
        res.json({
            error: false
        });
    } catch (e) {
        Logger.getLogger('worldpay').error(e.message);
        res.json({
            error: true
        });
    }
    next();
});

module.exports = server.exports();
