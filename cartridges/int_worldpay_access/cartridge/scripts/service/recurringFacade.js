'use strict';

const utils = require('*/cartridge/scripts/common/utils');
const Logger = require('dw/system/Logger').getLogger('awp');

/**
 * 
 * Call to payments api for recurring
 * @param {dw.order.Order} order - The order to authorize
 * @param {Object} billingData - Billing data for the payment
 * @returns {Object} - Returns service result
 */
function authorizeRecurringPayment(order, billingData) {
    try {
        const payload = require('*/cartridge/scripts/common/buildRecurringPayload').build(order, billingData);
        const result = utils.serviceCallPayments(payload);

        if (!result || result.error) {
            Logger.error('authorizeRecurringPayment: Invalid or error response');
            return { error: true };
        }

        return result;
    } catch (e) {
        Logger.error('authorizeRecurringPayment Exception: ' + e.toString());
        return { error: true };
    }
}

module.exports = {
    authorizeRecurringPayment: authorizeRecurringPayment
};
