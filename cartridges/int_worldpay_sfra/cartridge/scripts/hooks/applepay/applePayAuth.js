/* eslint-disable consistent-return */
'use strict';

var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var ApplePayHelpers = require('*/cartridge/scripts/checkout/applePayHelpers');

exports.authorizeOrderPayment = function (order, responseData) {
    var LibCreateRequest = require('*/cartridge/scripts/lib/LibCreateRequest');
    var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');
    var Utils = require('*/cartridge/scripts/common/Utils');
    var WorldpayPreferences = require('*/cartridge/scripts/object/WorldpayPreferences');

    var paymentMethodID = 'DW_APPLE_PAY';
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit();

    // validate the billing address
    var error = new Status(Status.ERROR);
    var success = new Status(Status.OK);
    var isBillingAddressError = ApplePayHelpers.validateBillingFields(responseData);
    if (isBillingAddressError.error) {
        error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_BILLING_ADDRESS);
        return error;
    }
    ApplePayHelpers.setAddress(responseData.payment.billingContact, 'billing');
    ApplePayHelpers.setAddress(responseData.payment.shippingContact, 'shipping');

    // Attach Payment Processor
    var paymentMethod = require('dw/order/PaymentMgr').getPaymentMethod(paymentMethodID);
    Transaction.wrap(function () {
        var paymentInstrument = null;

        if (!empty(order.getPaymentInstruments())) {
            paymentInstrument = order.getPaymentInstruments()[0];
            paymentInstrument.paymentTransaction.paymentProcessor = paymentMethod.getPaymentProcessor();
        } else {
            return error;
        }
        paymentInstrument.paymentTransaction.paymentProcessor = paymentMethod.getPaymentProcessor();
    });

    var result = null;
    if (responseData && responseData.payment) {
        var requestObject = LibCreateRequest.createApplePayAuthRequest(order, responseData);
        result = Utils.serviceCall(requestObject, null, preferences, null);
    }
    var hasError = ApplePayHelpers.handleAuthResponse(result);
    if (result && result.ok && !hasError) {
        return success;
    }
};

exports.shippingContactSelected = function (basket, event) {
    var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');
    var error = new Status(Status.ERROR);
    // validates the shipping address some mac devices allow address without country code
    var hasShippingAddressError = ApplePayHelpers.validateShippingFields(event.shippingContact);
    if (hasShippingAddressError.error) {
        error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_SHIPPING_ADDRESS);
        return new ApplePayHookResult(error, null);
    }
};

exports.placeOrder = function (order) {
    var URLUtils = require('dw/web/URLUtils');
    var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');
    // order placement will happen in the redirected controller
    var url = URLUtils.url('COPlaceOrder-SubmitOrder', 'order_id', order.orderNo, 'order_token', order.getOrderToken());
    return new ApplePayHookResult(new Status(Status.OK), url);
};

/* We implement this hook to avoid redirecting to cart in case the payment sheet is cancelled.
     After clicking on Cancel Shopper would stay on the same page */
exports.cancel = function () {
    var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');
    return new ApplePayHookResult(new Status(Status.OK), null);
};
