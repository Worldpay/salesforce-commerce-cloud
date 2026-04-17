'use strict';

const Transaction = require('dw/system/Transaction');

/**
 * Get value for next billing date
 * @param {string} timeAfterStr - Recurring period
 * @returns {Date} - Next billing date
 */
function getNextBillingDate(timeAfterStr) {
    // all values are used as demo and can be updated in BM
    const subDateMapping = {
        'month': 1,
        'quarterly': 3,
        'yearly': 12
    }

    const date = new Date();
    date.setMonth(date.getMonth() + subDateMapping[timeAfterStr]);
    return date;
}

/**
 * Update next billing date
 * @param {dw.order.Order} order - The order object
 */
function updateOrderNextBillingDate(order) {
    if (!order) {
        return;
    }

    const plis = order.getAllProductLineItems();
    const subPliOption = plis.toArray().find(function (pli) {
        return pli.optionProductLineItem && pli.optionID === 'subscriptionRecurring';
    })

    if (!subPliOption) {
        return;
    }

    const timeAfterStr = subPliOption.optionValueID;

    if (!timeAfterStr) {
        return;
    }
    // eslint-disable-next-line no-param-reassign
    order.custom.nextRecurringBillingDate = getNextBillingDate(timeAfterStr);
}

/**
 * Set recurring status
 * @param {dw.order.Order} order - Current order
 * @param {boolean} enable - Recurring status: true or false
 * @returns {void}
 */
function handleReccuringActiveStatus(order, enable) {
    if (!order) {
        return;
    }

    // eslint-disable-next-line no-param-reassign
    order.custom.isReccuringActive = enable;
}

/**
 * Set next biiling date and status
 * @param {dw.order.Order} order - Current order
 * @returns {void}
 */
function setRecurringData(order) {
    if (!order || !order.custom.isRecurring) {
        return;
    }

    const recurringHelper = require('*/cartridge/scripts/helpers/recurring/recurring');

    Transaction.wrap(function() {
        recurringHelper.handleReccuringActiveStatus(order, true);
        recurringHelper.updateOrderNextBillingDate(order)
    });
}

module.exports = {
    updateOrderNextBillingDate: updateOrderNextBillingDate,
    handleReccuringActiveStatus: handleReccuringActiveStatus,
    setRecurringData: setRecurringData
};
