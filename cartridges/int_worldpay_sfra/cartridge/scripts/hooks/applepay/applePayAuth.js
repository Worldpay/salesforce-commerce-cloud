/* eslint-disable consistent-return */
'use strict';

var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var applePayHelpers = require('*/cartridge/scripts/checkout/applePayHelpers');

exports.authorizeOrderPayment = function (order, responseData) {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var libCreateRequest = require('*/cartridge/scripts/lib/libCreateRequest');
    var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');
    var utils = require('*/cartridge/scripts/common/utils');
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var Site = require('dw/system/Site');
    var skipStateCodeValidation = Site.getCurrent().getCustomPreferenceValue('skipStateCodeAddressValidation');
    var paymentMethodID = 'DW_APPLE_PAY';
    // Fetch the APM Name from the Payment isntrument.
    var paymentIntrument = order.getPaymentInstrument();
    var apmName = paymentIntrument.getPaymentMethod();
    // Fetch the APM Type from the Payment Method i.e. if the Payment Methoid is of DIRECT or REDIRECT type.
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd, order);

    // validate the billing address
    var error = new Status(Status.ERROR);
    var success = new Status(Status.OK);
    var isBillingAddressError;
    if (skipStateCodeValidation) {
        isBillingAddressError = applePayHelpers.validateBillingFields(responseData);
    } else {
        isBillingAddressError = applePayHelpers.validateUSBillingFields(responseData);
    }
    if (isBillingAddressError.error) {
        error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_BILLING_ADDRESS);
        return error;
    }
    applePayHelpers.setAddress(responseData.payment.billingContact, 'billing');
    applePayHelpers.setAddress(responseData.payment.shippingContact, 'shipping');

    // Attach Payment Processor
    var paymentMethod = require('dw/order/PaymentMgr').getPaymentMethod(paymentMethodID);
    if (!empty(order.getPaymentInstruments())) {
        Transaction.wrap(function () {
            var paymentInstrument = null;
            paymentInstrument = order.getPaymentInstruments()[0];
            paymentInstrument.paymentTransaction.paymentProcessor = paymentMethod.getPaymentProcessor();
        });
    } else {
        return error;
    }

    var result = null;
    if (responseData && responseData.payment) {
        var requestObject = libCreateRequest.createApplePayAuthRequest(order, responseData);
        result = utils.serviceCall(requestObject, null, preferences, null);
    }
    var hasError = applePayHelpers.handleAuthResponse(result, order.orderNo);
    if (result && result.ok && !hasError) {
        return success;
    }
    return new ApplePayHookResult(error, null);
};

exports.shippingContactSelected = function (basket, event) {
    var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');
    var error = new Status(Status.ERROR);
    var Site = require('dw/system/Site');
    var skipStateCodeValidation = Site.getCurrent().getCustomPreferenceValue('skipStateCodeAddressValidation');
    // validates the shipping address some mac devices allow address without country code
    var hasShippingAddressError;
    if (skipStateCodeValidation) {
        hasShippingAddressError = applePayHelpers.validateShippingFields(event.shippingContact);
    } else {
        hasShippingAddressError = applePayHelpers.validateUSShippingFields(event.shippingContact);
    }
    if (hasShippingAddressError.error) {
        error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_SHIPPING_ADDRESS);
        return new ApplePayHookResult(error, null);
    }
    return new ApplePayHookResult(new Status(Status.OK), null);
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
