'use strict';

const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');

/**
 * Helper function to map accessReqType parameter to action type string
 * @param {number | null} accessReqTypeParam - The accessReqType parameter from the request
 * @returns {'refund' | 'settle' | 'partialSettle' | 'partialRefund' | null} The corresponding action type string or null if not found
 */
function getAccessRequestTypeFromRequestId(accessReqTypeParam) {
    if (!accessReqTypeParam) {
        return null;
    }
    switch (accessReqTypeParam) {
        case 1:
            return 'settle';
        case 2:
            return 'refund';
        case 3:
            return 'partialSettle';
        case 4:
            return 'partialRefund';
        default:
            return null;
    }
}

/**
 * Helper function to get the form template path based on action type
 * @param {'refund' | 'settle' | 'partialSettle' | 'partialRefund'} actionType - The action type
 * @returns {string} The form template path
 */
function getFormTemplate(actionType) {
    switch (actionType) {
        case 'settle':
            return '/csc/forms/settle';
        case 'refund':
            return '/csc/forms/refund';
        case 'partialSettle':
            return '/csc/forms/partialSettle';
        case 'partialRefund':
            return '/csc/forms/partialRefund';
        default:
            return '/csc/error';
    }
}

/**
 * Helper function to extract the href value from cardPayments based on action type
 * @param {Object} paymentDetailsResult - The payment details result object
 * @param {'refund' | 'settle' | 'partialSettle' | 'partialRefund'} actionType - The action type
 * @returns {*} The href value from _links['payments:actionType'] or _links['cardPayments:actionType'], or null if not found
 */
function getCardPaymentsHref(paymentDetailsResult, actionType) {
    if (!paymentDetailsResult || !paymentDetailsResult._links) {
        return null;
    }

    // Try 'payments:' prefix first
    const paymentsLinkKey = 'payments:' + actionType;
    if (
        paymentDetailsResult._links[paymentsLinkKey] &&
        paymentDetailsResult._links[paymentsLinkKey].href !== undefined
    ) {
        return paymentDetailsResult._links[paymentsLinkKey].href;
    }

    // Try 'cardPayments:' prefix as fallback
    const cardPaymentsLinkKey = 'cardPayments:' + actionType;
    if (
        paymentDetailsResult._links[cardPaymentsLinkKey] &&
        paymentDetailsResult._links[cardPaymentsLinkKey].href !== undefined
    ) {
        return paymentDetailsResult._links[cardPaymentsLinkKey].href;
    }
    
    return null;
}

/**
 * Converts an amount string to minor units (e.g., dollars to cents)
 * @param {string} amountStr - The amount as a string
 * @param {number} exponent - The exponent to use for conversion
 * @returns {number|null} The amount in minor units or null if invalid
 */
function toMinorUnits(amountStr, exponent) {
    const n = Number(amountStr);
    if (!Number.isFinite(n)) return null;
    // eslint-disable-next-line prefer-exponentiation-operator
    return Math.round(n * Math.pow(10, exponent));
}

/**
 * Checks if the partial amount to settle is valid
 * @param {string | null } orderId - The ID of the order
 * @param {number | null} partialAmount - The amount to partially settle
 * @param {'refund' | 'settle'} actionType - The type of action being performed
 * @returns {boolean} - True if the partial amount is valid, false otherwise
 */
function checkPartialAmountValue(orderId, partialAmount, actionType) {
    if (!orderId) {
        return false;
    }

    const order = OrderMgr.getOrder(orderId);
    if (!order || !partialAmount) {
        return false;
    }

    const exponent = 2;
    const totalAmount = toMinorUnits(String(order.totalGrossPrice.value), exponent) || 0;

    const settledAlready = Number(order.custom.pendingPartialSettledAmount) || 0;
    const refundedAlready = Number(order.custom.pendingPartialRefundedAmount) || 0;

    if (settledAlready < 0 || refundedAlready < 0 || settledAlready > totalAmount || refundedAlready > settledAlready) {
        return false;
    }

    if (actionType === 'settle') {
        return partialAmount > 0 && partialAmount <= (totalAmount - settledAlready);
    }

    if (actionType === 'refund') {
        return partialAmount > 0 && partialAmount <= (settledAlready - refundedAlready);
    }

    return false;
}


/**
 * Updates the pending partial amount for an order by adding to existing amount
 * @param {string} orderId - The ID of the order
 * @param {number} amountToAdd - The amount to add to existing pending amount
 * @param {'settle' | 'refund'} actionType - The type of action being performed
 * @returns {boolean} - True if the update was successful, false otherwise
 */
function updatePendingPartialAmount(orderId, amountToAdd, actionType) {
    if (!orderId || !actionType) {
        return false;
    }
    
    const order = OrderMgr.getOrder(orderId);
    if (!order) {
        return false;
    }
    
    const attributeName = actionType === 'settle' 
        ? 'pendingPartialSettledAmount' 
        : 'pendingPartialRefundedAmount';
    
    try {
        Transaction.wrap(function () {
            order.custom.partialPending = true;

            const currentPendingAmount = Number(order.custom[attributeName]) || 0;
            order.custom[attributeName] = currentPendingAmount + (amountToAdd || 0);
        });
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Resets the pending partial amount for an order to zero
 * @param {string} orderId - The ID of the order
 * @param {'settle' | 'refund'} actionType - The type of action being performed
 * @returns {boolean} - True if the reset was successful, false otherwise
 */
function resetPendingPartialAmount(orderId, actionType) {
    if (!orderId || !actionType) {
        return false;
    }
    
    const order = OrderMgr.getOrder(orderId);
    if (!order) {
        return false;
    }
    
    const attributeName = actionType === 'settle' 
        ? 'pendingPartialSettledAmount' 
        : 'pendingPartialRefundedAmount';
    
    try {
        Transaction.wrap(function () {
            order.custom[attributeName] = 0;
        });
        return true;
    } catch (e) {
        return false;
    }
}

module.exports = {
    getAccessRequestTypeFromRequestId: getAccessRequestTypeFromRequestId,
    getFormTemplate: getFormTemplate,
    getCardPaymentsHref: getCardPaymentsHref,
    toMinorUnits: toMinorUnits,
    checkPartialAmountValue: checkPartialAmountValue,
    updatePendingPartialAmount: updatePendingPartialAmount,
    resetPendingPartialAmount: resetPendingPartialAmount
};
