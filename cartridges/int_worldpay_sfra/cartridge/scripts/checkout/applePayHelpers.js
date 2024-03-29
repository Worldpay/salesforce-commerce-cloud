'use strict';

/**
 * Validates the US billing address fields
 * @param {Object} billingAddress - billing address object
 * @returns {{error: boolean}} - validation result
 */
function validateUSBillingFields(billingAddress) {
    if (billingAddress.payment && (!billingAddress.payment.billingContact.countryCode ||
        !billingAddress.payment.billingContact.administrativeArea ||
        !billingAddress.payment.billingContact.postalCode ||
        !billingAddress.payment.billingContact.locality)) {
        return {
            error: true
        };
    }
    return {
        error: false
    };
}

/**
 * Validates the US shipping address fields
 * @param {Object} shippingAddress - shipping address object
 * @returns {{error: boolean}} - validation result
 */
function validateUSShippingFields(shippingAddress) {
    if (!shippingAddress.countryCode ||
        !shippingAddress.administrativeArea ||
        !shippingAddress.postalCode ||
        !shippingAddress.locality) {
        return {
            error: true
        };
    }
    return {
        error: false
    };
}

/**
 * Validates the billing address fields
 * @param {Object} billingAddress - billing address object
 * @returns {{error: boolean}} - validation result
 */
function validateBillingFields(billingAddress) {
    if (billingAddress.payment && (!billingAddress.payment.billingContact.countryCode ||
        !billingAddress.payment.billingContact.postalCode ||
        !billingAddress.payment.billingContact.locality)) {
        return {
            error: true
        };
    }
    return {
        error: false
    };
}

/**
 * Validates the shipping address fields
 * @param {Object} shippingAddress - shipping address object
 * @returns {{error: boolean}} - validation result
 */
function validateShippingFields(shippingAddress) {
    if (!shippingAddress.countryCode ||
        !shippingAddress.postalCode ||
        !shippingAddress.locality) {
        return {
            error: true
        };
    }
    return {
        error: false
    };
}


/**
 * @param {Object} authResponse - authorization response
 * @param {string} orderNo - The current order's number
 * @returns {boolean} - status
 */
function handleAuthResponse(authResponse, orderNo) {
    var utils = require('*/cartridge/scripts/common/utils');
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var Site = require('dw/system/Site');
    var enableErrorMailService = Site.getCurrent().getCustomPreferenceValue('enableErrorMailService');
    var error = false;

    if (!authResponse) {
        if (enableErrorMailService) {
            utils.sendErrorNotification(orderNo, worldpayConstants.AUTHORIZATION_FAILED, worldpayConstants.APPLEPAY);
        }
        return true;
    }
    var result = authResponse.object;
    var parsedResponse = utils.parseResponse(result);
    if (parsedResponse.isError()) {
        if (enableErrorMailService) {
            utils.sendErrorNotification(orderNo, worldpayConstants.AUTHORIZATION_FAILED, worldpayConstants.APPLEPAY);
        }
        return true;
    }
    if ('status' in authResponse && authResponse.getStatus().equals('SERVICE_UNAVAILABLE')) {
        if (enableErrorMailService) {
            utils.sendErrorNotification(orderNo, worldpayConstants.AUTHORIZATION_FAILED, worldpayConstants.APPLEPAY);
        }
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
    var server = require('server');
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

module.exports = {
    validateUSBillingFields: validateUSBillingFields,
    validateUSShippingFields: validateUSShippingFields,
    validateBillingFields: validateBillingFields,
    validateShippingFields: validateShippingFields,
    handleAuthResponse: handleAuthResponse,
    setAddress: setAddress
};
