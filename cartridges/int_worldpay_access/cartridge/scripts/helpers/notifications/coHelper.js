'use strict';

const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const NOTIFICATION_CO_TYPE = 'accessOrderNotifyUpdate';
const Logger = require('dw/system/Logger').getLogger('awp');

/**
 *
 * Fetches all accessOrderNotifyUpdate custom objects for processing.
 * Logs and returns null if none found.
 * @returns {dw.util.SeekableIterator|null} Iterator of custom objects or null if none found.
 */
function getAll() {
    const searchResultIterator =
        CustomObjectMgr.getAllCustomObjects(NOTIFICATION_CO_TYPE);
    if (!searchResultIterator || !searchResultIterator.hasNext()) {
        return null;
    }
    return searchResultIterator;
}

/**
 *  Removes the custom object if the associated order is not found.
 * @param {*} customObject - The custom object to remove.
 * @param {*} transactionReference - The transaction reference for logging.
 * @param {boolean | null} error - The error object for logging.
 * @returns {void}
 */
const removeNotifyCustomObject = function (
    customObject,
    transactionReference,
    error
) {
    const Transaction = require('dw/system/Transaction');

    if (!customObject) {
        return;
    }
    try {
        Transaction.wrap(() => {
            CustomObjectMgr.remove(customObject);
        });

        if (error) {
            Logger.warn(
                `Order not found for transactionReference: ${transactionReference}. Removing custom object with ID: ${customObject.custom.ID}`
            );
        }
    } catch (e) {
        Logger.error(
            `Failed to remove accessOrderNotifyUpdate custom object with ID: ${customObject.ID}`
        );
    }
};

/**
 * Creates or updates an accessOrderNotifyUpdate custom object.
 * @param {string} orderNo - The order number.
 * @param {string} payload - The payload received from Worldpay-Notify webhook.
 * @returns {dw.object.CustomObject} The created or updated custom object.
 */
function upsert(orderNo, payload) {
    const Transaction = require('dw/system/Transaction');

    return Transaction.wrap(function () {
        var co = CustomObjectMgr.getCustomObject(NOTIFICATION_CO_TYPE, orderNo);
        if (!co) {
            co = CustomObjectMgr.createCustomObject(
                NOTIFICATION_CO_TYPE,
                orderNo
            );
        }
        co.custom.orderNo = orderNo;
        co.custom.payload = payload;
        return co;
    });
}

/**
 * Retrieves an accessOrderNotifyUpdate custom object by orderNo.
 * @param {string} orderNo - The order number.
 * @returns {dw.object.CustomObject|null} The custom object or null if not found.
 */
function get(orderNo) {
    return CustomObjectMgr.getCustomObject(NOTIFICATION_CO_TYPE, orderNo);
}

/**
 * Reads the body of a custom object.
 * @param {Object} notifyCustomObject - The custom object to read.
 * @returns {Object|null} The parsed payload or null if not found.
 */
function readCustomObjectBody(notifyCustomObject) {
    // guard clause
    if (
        !notifyCustomObject ||
        !notifyCustomObject.custom ||
        !notifyCustomObject.custom.payload
    ) {
        Logger.error(
            `Invalid accessOrderNotifyUpdate custom object provided. ${notifyCustomObject.ID}`
        );
        return null;
    }

    const payload = notifyCustomObject.custom.payload;
    let parsedPayload;
    try {
        parsedPayload = JSON.parse(payload);
    } catch (e) {
        Logger.error(
            `Failed to parse payload for accessOrderNotifyUpdate CO with ID: ${notifyCustomObject.ID}`
        );
        return null;
    }
    return parsedPayload;
}

module.exports = {
    getAll,
    removeNotifyCustomObject,
    upsert,
    get,
    readCustomObjectBody
};
