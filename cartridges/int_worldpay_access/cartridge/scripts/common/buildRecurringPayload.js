'use strict';

const Site = require('dw/system/Site');

/**
 * Builds the Recurring payload for Worldpay payment processing
 * @param {dw.order.Order} order - The order object
 * @param {Object} billingData - The billing data object containing tokenHref
 * @returns {Object} The Recurring payload object
 */
function build(order, billingData) {
    const utils = require('*/cartridge/scripts/common/utils');
    return {
        transactionReference: utils.buildTransactionReference(order.orderNo, {
            prefix: 'recurring',
            suffix: new Date().getTime()
        }),
        merchant: {
            entity: Site.getCurrent().getCustomPreferenceValue('MerchantEntity')
        },
        instruction: {
            method: "card",
            paymentInstrument: {
                type: "token",
                href: billingData.tokenHref
            },
            fraud: {
                type: "fraudSight"
            },
            customerAgreement: {
                type: "subscription",
                storedCardUsage: "subsequent"
            },
            customer: {
                email: order.customerEmail
            },
            narrative: {
                line1: Site.getCurrent().getCustomPreferenceValue('Narrative')
            },
            value: {
                currency: order.getCurrencyCode(),
                amount: Math.round(order.totalGrossPrice.value * 100)
            }
        }
    };
}

module.exports = {
    build: build
};
