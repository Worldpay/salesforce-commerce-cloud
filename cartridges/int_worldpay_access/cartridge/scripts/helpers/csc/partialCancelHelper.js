'use strict';

const Logger = require('dw/system/Logger').getLogger('awp', 'partialCancel');
const Transaction = require('dw/system/Transaction');
const HookMgr = require('dw/system/HookMgr');
const Site = require('dw/system/Site');

const useOMS = Site.current.getCustomPreferenceValue('UseOMS') === true;

/**
 * Builds the details required for a partial cancel operation, including selected product line items and total amount.
 *
 * @param {dw.order.Order} order - The order object.
 * @param {dw.web.HttpParameterMap} params - The HTTP parameter map containing user selections.
 * @param {string} currency - The currency code.
 * @returns {Object} An object containing success status, amount in minor units, cancel details, and currency.
 */
function buildPartialCancelDetails(order, params, currency) {
    var plis = order.getProductLineItems().toArray();

    var amountMinor = 0;
    var hasPositiveQty = false;
    var cancelDetails = [];

    plis.forEach(function (pli) {
        var uuid = pli.UUID;
        var paramName = 'cancelQty_' + uuid;
        var qtyParam = params.get(paramName);

        if (!qtyParam || !qtyParam.stringValue) {
            return;
        }

        var qtyToCancel = parseInt(qtyParam.stringValue, 10);
        if (Number.isNaN(qtyToCancel) || qtyToCancel <= 0) {
            return;
        }

        var originalQty = pli.quantity && pli.quantity.value;
        if (typeof originalQty === 'number' && qtyToCancel > originalQty) {
            Logger.warn(
                'Requested cancel qty {0} > original qty {1} for pli {2} on order {3}',
                qtyToCancel, originalQty, uuid, order.orderNo
            );
            qtyToCancel = originalQty;
        }

        var money = pli.getAdjustedGrossPrice() || pli.getGrossPrice();
        if (!money) {
            return;
        }

        var lineTotalMinor = Math.round(money.value * 100); // ex: 72.00 -> 7200
        var perUnitMinor = Math.round(lineTotalMinor / originalQty);

        amountMinor += perUnitMinor * qtyToCancel;
        hasPositiveQty = true;

        cancelDetails.push({
            pliUUID: uuid,
            productID: pli.productID,
            qtyToCancel: qtyToCancel
        });
    });

    if (!hasPositiveQty || amountMinor <= 0) {
        return {
            success: false,
            message: 'No positive quantities selected for partial cancel'
        };
    }

    Logger.debug(
        'Calculated partial cancel amount for order {0}: {1} {2} (minor units)',
        order.orderNo, amountMinor, currency
    );

    return {
        success: true,
        amountMinor: amountMinor,
        cancelDetails: cancelDetails,
        currency: currency
    };
}

/**
 * Applies a partial cancel to the order when OMS is not used, updating product line items, inventory, and payment instruments.
 *
 * @param {dw.order.Order} order - The order object.
 * @param {Array} cancelDetails - Array of objects containing pliUUID, productID, and qtyToCancel.
 * @param {number} amountMinor - The amount to cancel in minor units.
 * @param {Object} partialCancelResponse - The response object from the partial cancel operation.
 */
function applyPartialCancelNoOMS(order, cancelDetails, amountMinor, partialCancelResponse) {
    Transaction.wrap(function () {
        cancelDetails.forEach(function (detail) {
            let plis = order.getProductLineItems().toArray();
            let pli = plis.find(function (line) {
                return line.UUID === detail.pliUUID;
            });

            if (!pli) {
                return;
            }

            let originalQty = pli.quantity && pli.quantity.value;
            let qtyToCancel = detail.qtyToCancel;

            if (originalQty <= qtyToCancel) {
                order.removeProductLineItem(pli);
            } else {
                pli.setQuantityValue(originalQty - qtyToCancel);
            }
        });

        let pis = order.getPaymentInstruments().toArray();
        if (pis.length > 0) {
            let pi = pis[0];
            let prev = pi.custom.awpPartialCanceledAmountMinor || 0;
            pi.custom.awpPartialCanceledAmountMinor = prev + amountMinor;
            pi.custom.awpLastAction = 'partialCancel';
            pi.custom.awpPartialCancelResponse = JSON.stringify(partialCancelResponse);
        }

        if (HookMgr.hasHook('dw.order.calculate')) {
            HookMgr.callHook('dw.order.calculate', 'calculate', order);
        }
    });
}

/**
 * Marks a partial cancel on the order when OMS is used, updating payment instruments and order custom attributes.
 *
 * @param {dw.order.Order} order - The order object.
 * @param {Array} cancelDetails - Array of objects containing pliUUID, productID, and qtyToCancel.
 * @param {number} amountMinor - The amount to cancel in minor units.
 * @param {Object} partialCancelResponse - The response object from the partial cancel operation.
 */
function markPartialCancelOMS(order, cancelDetails, amountMinor, partialCancelResponse) {
    Transaction.wrap(function () {
        let pis = order.getPaymentInstruments().toArray();
        if (pis.length > 0) {
            let pi = pis[0];
            let prev = pi.custom.awpPartialCanceledAmountMinor || 0;
            pi.custom.awpPartialCanceledAmountMinor = prev + amountMinor;
            pi.custom.awpLastAction = 'partialCancel';
            pi.custom.awpPartialCancelResponse = JSON.stringify(partialCancelResponse);
        }

        let custom = order.custom;
        custom.awpPartialCancelRequested = true;
        custom.awpPartialCancelAmountMinor = (custom.wpPartialCancelAmountMinor || 0) + amountMinor;
    });
}

/**
 * Handles the partial cancel process for an order, including building cancel details, invoking the cancel function, and updating order/payment data.
 *
 * @param {dw.order.Order} order - The order object.
 * @param {dw.web.HttpParameterMap} params - The HTTP parameter map containing user selections.
 * @param {string} partialCancelHrefUrlPath - The URL path for the partial cancel operation.
 * @param {string} currency - The currency code.
 * @param {Function} partialCancelFn - The function to execute the partial cancel operation.
 * @returns {Object} An object containing success status and message.
 */
function handlePartialCancel(order, params, partialCancelHrefUrlPath, currency, partialCancelFn) {
    let detailsResult = buildPartialCancelDetails(order, params, currency);
    if (!detailsResult.success) {
        return {
            success: false,
            message: detailsResult.message
        };
    }

    let amountMinor = detailsResult.amountMinor;
    let cancelDetails = detailsResult.cancelDetails;

    let reference = 'partial-cancel-' + order.orderNo + '-' + new Date().getTime();
    let partialCancelResult = partialCancelFn(
        partialCancelHrefUrlPath,
        amountMinor,
        currency,
        reference
    );

    if (partialCancelResult.error) {
        Logger.error('Partial cancel failed for order {0}: {1}', order.orderNo, partialCancelResult.errorMessage);
        return {
            success: false,
            message: 'Failed to partially cancel the payment'
        };
    }

    if (useOMS) {
        markPartialCancelOMS(order, cancelDetails, amountMinor, partialCancelResult.response);
    } else {
        applyPartialCancelNoOMS(order, cancelDetails, amountMinor, partialCancelResult.response);
    }

    return {
        success: true,
        message: 'Partial cancel executed successfully'
    };
}

module.exports = {
    handlePartialCancel: handlePartialCancel
};
