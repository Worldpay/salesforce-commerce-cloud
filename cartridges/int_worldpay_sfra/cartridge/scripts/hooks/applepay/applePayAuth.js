/* eslint-disable consistent-return */
'use strict';

var Status = require('dw/system/Status');
var server = require('server');
var Transaction = require('dw/system/Transaction');

/**
 *
 * @param {Object} authResponse - authorization response
 * @returns {boolean} - status
 */
function handleAuthResponse(authResponse) {
    var Utils = require('*/cartridge/scripts/common/Utils');
    var error = false;

    if (!authResponse) {
        return true;
    }
    var result = authResponse.object;
    var parsedResponse = Utils.parseResponse(result);
    if (parsedResponse.isError()) {
        return true;
    }
    if ('status' in authResponse && authResponse.getStatus().equals('SERVICE_UNAVAILABLE')) {
        return true;
    }
    return error;
}

/**
 *
 * @param {Address} responseAddress - Address from applepay response
 * @param {string} addressType - form name
 */
function setAddress(responseAddress, addressType) {
    var form = server.forms.getForm(addressType);
    var addressObject = {
        firstName: responseAddress.givenName,
        lastName: responseAddress.lastName,
        address1: responseAddress.addressLines[0],
        address2: responseAddress.addressLines[1] ? responseAddress.addressLines[1] : '',
        city: responseAddress.locality,
        stateCode: responseAddress.administrativeArea,
        postalCode: responseAddress.postalCode,
        country: responseAddress.countryCode,
        phone: responseAddress.phoneNumber
    };
    form.copyFrom(addressObject);
}


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
    if (responseData.payment && (!responseData.payment.billingContact.countryCode ||
        !responseData.payment.billingContact.administrativeArea ||
        !responseData.payment.billingContact.postalCode ||
        !responseData.payment.billingContact.locality)) {
        error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_BILLING_ADDRESS);
        return error;
    }

    setAddress(responseData.payment.billingContact, 'billing');
    setAddress(responseData.payment.shippingContact, 'shipping');

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

    var hasError = handleAuthResponse(result);

    if (result && result.ok && !hasError) {
        return success;
    }
};

exports.shippingContactSelected = function (basket, event) {
    var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');
    var error = new Status(Status.ERROR);
    // validates the shipping address some mac devices allow address without country code
    if (!event.shippingContact.countryCode ||
        !event.shippingContact.administrativeArea ||
        !event.shippingContact.postalCode ||
        !event.shippingContact.locality) {
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
