'use strict';

/**
 * This script updates updates the notfification details in the Order
 * Object by calling orderHelper method
 * @param {dw.order.Order} apiOrder - Current users's Order
 * @param {Object} notifyPayload - Response
 * @return {{success: boolean}} Returns if the update was successful
 */
function updateNotificationOrderStatus(apiOrder, notifyPayload) {
    const Transaction = require('dw/system/Transaction');
    const eventDetails = notifyPayload.eventDetails;
    if (!apiOrder || !eventDetails) {
        return {
            success: false
        };
    }

    const customFields = {
        latestClassification: eventDetails.classification,
        latestDownstreamReference: eventDetails.downstreamReference,
        latestTransactionReference: eventDetails.transactionReference,
        latestType: eventDetails.type,
        latestDate: eventDetails.date,
        latestAmountValue: eventDetails.amount ? eventDetails.amount.value : undefined
    };
    
    Transaction.wrap(function () {
        Object.keys(customFields).forEach(function (key) {
            if (customFields[key] !== undefined) {
                // eslint-disable-next-line no-param-reassign
                apiOrder.custom[key] = customFields[key];
            }
        });
    });

    return {
        success: true
    };
}

module.exports = {
    updateNotificationOrderStatus: updateNotificationOrderStatus
};
