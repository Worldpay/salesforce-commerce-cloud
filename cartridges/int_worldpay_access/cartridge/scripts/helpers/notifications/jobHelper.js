'use strict';

const Transaction = require('dw/system/Transaction');
const PaymentMgr = require('dw/order/PaymentMgr');
const Logger = require('dw/system/Logger').getLogger('awp');

/**
 * Checks if any payment instrument in the order uses Worldpay.
 * @param {dw.order.Order | null} orderObj - Current user's Order
 * @return {boolean} True if Worldpay is used, false otherwise.
 */
function checkWorldpayOrder(orderObj) {
    const { WORLDPAY_ORDER_STATUS } = require('*/cartridge/scripts/common/constants/index');

    if (!orderObj) return false;

    var paymentInstruments = orderObj.getPaymentInstruments();
    if (!paymentInstruments) return false;

    var paymentInstrumentsArray = paymentInstruments.toArray();
    if (!paymentInstrumentsArray.length) return false;

    return paymentInstrumentsArray.some(function (orderPaymentInstrument) {
        var paymentMethod = PaymentMgr.getPaymentMethod(
            orderPaymentInstrument.getPaymentMethod()
        );
        if (!paymentMethod || !paymentMethod.paymentProcessor) return false;

        Logger.debug(
            orderObj.orderNo +
                ' order token requested : ' +
                (orderPaymentInstrument.custom &&
                    orderPaymentInstrument.custom.wpTokenRequested)
        );
        return paymentMethod.paymentProcessor.ID.equalsIgnoreCase(
            WORLDPAY_ORDER_STATUS.WORLDPAY
        );
    });
}

/**
 * Filters and returns only valid notification custom objects (with payload and order).
 * Removes invalid custom objects as needed.
 * @returns {Array} Array of valid custom objects
 */
function getValidNotificationCustomObjects() {
    const {
        readCustomObjectBody
    } = require('*/cartridge/scripts/helpers/notifications/coHelper');
    const {
        JobResult
    } = require('*/cartridge/scripts/helpers/notifications/mailerHelper');

    const {
        getAll: getAllNotificationCO,
        removeNotifyCustomObject
    } = require('*/cartridge/scripts/helpers/notifications/coHelper');

    const searchResultIterator = getAllNotificationCO();
    if (!searchResultIterator) {
        return [];
    }

    let validCustomObjects = [];
    let OrderMgr = require('dw/order/OrderMgr');
    const jobResult = JobResult.getInstance();
    jobResult.totalCount = searchResultIterator.count;
    while (searchResultIterator.hasNext()) {
        let customObject = searchResultIterator.next();
        let payload = readCustomObjectBody(customObject);
        let transactionReference =
            payload && payload.eventDetails
                ? payload.eventDetails.transactionReference
                : null;
        if (!payload) {
            Logger.warn(
                `Invalid payload for accessOrderNotifyUpdate custom object with ID: ${customObject.custom.ID}`
            );
            JobResult.addError(
                `Invalid payload for custom object ID: ${customObject.custom.ID}`,
                transactionReference,
                null
            );
            removeNotifyCustomObject(customObject, transactionReference, true);
            continue; // eslint-disable-line
        }
        let order = OrderMgr.getOrder(transactionReference);
        if (!order) {
            Logger.warn(
                `Order not found for transactionReference: ${transactionReference}. Removing custom object with ID: ${customObject.custom.ID}`
            );

            JobResult.addError(
                `Missing order for custom object ID: ${customObject.custom.ID}`,
                null,
                payload
            );
            removeNotifyCustomObject(customObject, transactionReference, true);
            continue; // eslint-disable-line
        }
        validCustomObjects.push({ customObject, payload, order });
    }
    return validCustomObjects;
}

/**
 * Handles order amount updates for both refunds and settlements.
 * @param {string} orderNo - The order number.
 * @param {string} amount - The amount to update.
 * @param {'refund' | 'settle'} type - The type of update: 'refund' or 'settle'.
 */
function handleOrderAmountUpdate(orderNo, amount, type) {
    const OrderMgr = require('dw/order/OrderMgr');
    const order = OrderMgr.getOrder(orderNo);
    if (!order) {
        return;
    }

    let currentAmount;
    let attributeName;
    
    if (type === 'refund') {
        currentAmount = Number(order.custom.partialRefundedAmount) || 0;
        attributeName = 'partialRefundedAmount';
    } else if (type === 'settle') {
        currentAmount = Number(order.custom.partialSettledAmount) || 0;
        attributeName = 'partialSettledAmount';
    } else {
        Logger.error('Invalid type provided to handleOrderAmountUpdate: ' + type);
        return;
    }
    
    const updatedAmount = currentAmount + parseFloat(amount);
    Transaction.wrap(function () {
        order.custom[attributeName] = updatedAmount;
    });
}

/**
 * Updates the order with the notification details.
 * @param {dw.order.Order} order - The CC order object to update.
 * @param {Object} notifyOrderBody - The notification body.
 * @returns {boolean} True if update is successful, false otherwise.
 */
function updateOrderWithNotification(order, notifyOrderBody) {
    const Order = require('dw/order/Order');
    const OrderMgr = require('dw/order/OrderMgr');
    const checkoutHelper = require('*/cartridge/scripts/helpers/checkoutHelper');
    const {
        WORLDPAY_ORDER_STATUS
    } = require('*/cartridge/scripts/common/constants/index');
    const {
        updateNotificationOrderStatus
    } = require('*/cartridge/scripts/order/updateNotificationOrderStatus');

    const orderStatusCode = order.status.value;
    const notifyOrderType = notifyOrderBody.eventDetails.type;
    let statusAfterUpdate;

    Logger.debug(
        'Update Order Status : ' +
            notifyOrderType +
            ' for Order Number : ' +
            order.orderNo +
            ' Current status: ' +
            order.status
    );

    if (WORLDPAY_ORDER_STATUS.AUTHORIZED.equalsIgnoreCase(notifyOrderType)) {
        if (orderStatusCode === Order.ORDER_STATUS_FAILED) {
            OrderMgr.undoFailOrder(order);
        }

        if (orderStatusCode === Order.ORDER_STATUS_CANCELLED) {
            Transaction.begin();
            OrderMgr.undoCancelOrder(order);
            order.setExportStatus(Order.EXPORT_STATUS_READY);
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
            Transaction.commit();

            const { success: cancelledOrderUpdateStatus } =
                updateNotificationOrderStatus(order, notifyOrderBody);
            return cancelledOrderUpdateStatus;
        }

        if (
            ![
                Order.ORDER_STATUS_OPEN.valueOf(),
                Order.ORDER_STATUS_COMPLETED.valueOf(),
                Order.ORDER_STATUS_NEW.valueOf()
            ].includes(orderStatusCode)
        ) {
            statusAfterUpdate = checkoutHelper.placeOrder(order);
            if (statusAfterUpdate.error) {
                return false;
            }
        }
    }
    if (WORLDPAY_ORDER_STATUS.REFUSED.equalsIgnoreCase(notifyOrderType)) {
        if (
            ![
                Order.ORDER_STATUS_CANCELLED.valueOf(),
                Order.ORDER_STATUS_FAILED.valueOf()
            ].includes(orderStatusCode)
        ) {
            Transaction.begin();
            statusAfterUpdate = OrderMgr.failOrder(order, true);
            if (statusAfterUpdate.isError()) {
                return false;
            }
            Transaction.commit();
        }
    }

    if (
        WORLDPAY_ORDER_STATUS.CANCELLEDSTATUS.equalsIgnoreCase(notifyOrderType)
    ) {
        Transaction.begin();
        if (
            [
                Order.ORDER_STATUS_CANCELLED.valueOf(),
                Order.ORDER_STATUS_NEW.valueOf(),
                Order.ORDER_STATUS_OPEN.valueOf()
            ].includes(orderStatusCode)
        ) {
            statusAfterUpdate = OrderMgr.cancelOrder(order);
            if (statusAfterUpdate.isError()) {
                return false;
            }
        }

        if (orderStatusCode === Order.ORDER_STATUS_CREATED.valueOf()) {
            statusAfterUpdate = OrderMgr.failOrder(order, false);
            if (statusAfterUpdate.isError()) {
                return false;
            }
        }

        order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
        order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
        Transaction.commit();
    }

    if (WORLDPAY_ORDER_STATUS.EXPIRED.equalsIgnoreCase(notifyOrderType)) {
        Transaction.begin();
        statusAfterUpdate = OrderMgr.failOrder(order, true);
        if (statusAfterUpdate.isError()) {
            return false;
        }
        Transaction.commit();
    }

    if (WORLDPAY_ORDER_STATUS.SETTLED.equalsIgnoreCase(notifyOrderType) || WORLDPAY_ORDER_STATUS.SENT_FOR_SETTLE.equalsIgnoreCase(notifyOrderType)) {
        if (orderStatusCode === Order.ORDER_STATUS_CREATED) {
            statusAfterUpdate = checkoutHelper.placeOrder(order);
            if (statusAfterUpdate.error) {
                return false;
            }
        }

        handleOrderAmountUpdate(order.orderNo, notifyOrderBody.eventDetails.amount.value, 'settle');

        Transaction.begin();
        order.setStatus(Order.ORDER_STATUS_COMPLETED);
        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
        // eslint-disable-next-line no-param-reassign
        order.custom.partialPending = false;
        Transaction.commit();
    }

    if (
        WORLDPAY_ORDER_STATUS.SENT_FOR_REFUND.equalsIgnoreCase(notifyOrderType)
    ) {
        const refundAmount = notifyOrderBody.eventDetails.amount.value;
        handleOrderAmountUpdate(order.orderNo, refundAmount, 'refund');
        if (order.custom.partialPending) {
            Transaction.wrap(function () {
                // eslint-disable-next-line no-param-reassign
                order.custom.partialPending = false;
            });
        }
    }

    const { success } = updateNotificationOrderStatus(order, notifyOrderBody);
    return success;
}

module.exports = {
    checkWorldpayOrder,
    updateOrderWithNotification,
    getValidNotificationCustomObjects,
    handleOrderAmountUpdate,
};
