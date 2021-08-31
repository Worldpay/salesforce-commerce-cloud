'use strict';

var base = module.superModule;

/**
 * validates the billing address
 * @returns {{error: boolean}} - result of billing validation
 */
function validateBillingFields() {
    /* skipping the validation for the billing fields
    in case where country does not have state codes */
    return {
        error: false
    };
}


/**
 * Validates the shipping address fields
 * @param {Object} shippingAddress - shipping address object
 * @returns {{error: boolean}} - validation result
 */
function validateShippingFields() {
    /* skipping the validation for the billing fields
    in case where country does not have state codes */
    return {
        error: false
    };
}

base.validateShippingFields = validateShippingFields;
base.validateBillingFields = validateBillingFields;
module.exports = base;
