'use strict';

/**
 * @param {dw.order.Order} order object
 * @returns {{error: boolean}} order status error
 */
function placeOrder(order) {
    const Transaction = require('dw/system/Transaction');
    const OrderMgr = require('dw/order/OrderMgr');
    const Order = require('dw/order/Order');

    Transaction.begin();
    const placeOrderStatus = OrderMgr.placeOrder(order);
    if (placeOrderStatus.isError()) {
        OrderMgr.failOrder(order, true);
        return { error: true };
    }
    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
    Transaction.commit();

    return { error: false };
}

module.exports = { placeOrder };
