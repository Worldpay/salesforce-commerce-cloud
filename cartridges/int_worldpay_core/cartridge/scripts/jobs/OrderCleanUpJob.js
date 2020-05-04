/**
 * This script initiates the order CleanUp job
 */
function orderCleanUp() {
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var Transaction = require('dw/system/Transaction');
  // SearchSystemObject
    var queryString = 'creationDate <= {0} AND status={1}';
    var thresholdTime = new Date();
    thresholdTime.setHours(thresholdTime.getHours() - 2);
    var ordersReturnedByQueryIterator = OrderMgr.queryOrders(queryString, 'creationDate desc', thresholdTime, Order.ORDER_STATUS_CREATED);
  // Expression
    if (ordersReturnedByQueryIterator.getCount() > 0) {
        // Object Iterator
        Transaction.wrap(function () {
            while (ordersReturnedByQueryIterator.hasNext()) {
                var orderReturnedByQuery = ordersReturnedByQueryIterator.next();

                // GetCreatedOrderDetails
                var getCreatedOrderDetailsResult = require('*/cartridge/scripts/pipelets/GetCreatedOrderDetails').getCreatedOrderDetails(orderReturnedByQuery);
                if (getCreatedOrderDetailsResult.success) {
                    // Expression
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

/** Exported functions **/
module.exports = {
    orderCleanUp: orderCleanUp
};
