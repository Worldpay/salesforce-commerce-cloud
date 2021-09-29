/**
 * This script initiates the order CleanUp job which fetch orders
 * and fails an unplaced order
 */
function orderCleanUp() {
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var Transaction = require('dw/system/Transaction');
    var queryString = 'creationDate <= {0} AND status={1}';
    var thresholdTime = new Date();
    thresholdTime.setHours(thresholdTime.getHours() - 2);
    var ordersReturnedByQueryIterator = OrderMgr.queryOrders(queryString, 'creationDate desc', thresholdTime, Order.ORDER_STATUS_CREATED);
    if (ordersReturnedByQueryIterator.getCount() > 0) {
        Transaction.wrap(function () {
            while (ordersReturnedByQueryIterator.hasNext()) {
                var orderReturnedByQuery = ordersReturnedByQueryIterator.next();
                var getCreatedOrderDetailsResult = require('*/cartridge/scripts/pipelets/getCreatedOrderDetails').getCreatedOrderDetails(orderReturnedByQuery);
                if (getCreatedOrderDetailsResult.success) {
                    if (getCreatedOrderDetailsResult.toDelete) {
                        OrderMgr.failOrder(orderReturnedByQuery, true);
                    }
                } else {
                    throw new Error();
                }
            }
        });
    }
}

module.exports = {
    orderCleanUp: orderCleanUp
};
