/**
 * This script initiates the order CleanUp job
 */
function orderCleanUp() {
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var SystemObjectMgr = require('dw/object/SystemObjectMgr');
    var Transaction = require('dw/system/Transaction');
  // SearchSystemObject
    var type = 'Order';
    var queryString = 'status={' + 0 + '}';

    var ordersReturnedByQueryIterator = SystemObjectMgr.querySystemObjects(type, queryString, null, Order.ORDER_STATUS_CREATED);

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
