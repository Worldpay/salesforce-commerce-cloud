/**
* Demandware Script File
* This script updates the isMACInvalid flag to true in case of order failed
*  @input Order : dw.order.Order The order.
*  @input MACFlag : Boolean
*
*/
/**
* This script updates the isMACInvalid flag to true in case of order failed
 * @param {dw.order.Order} Order - Current users's Order
 * @param {boolean} MACFlag - flag value
 * @return {Object} returns an error object
 */
function updateTransactionStatus(Order, MACFlag) {
    var Transaction = require('dw/system/Transaction');
    try {
        Transaction.wrap(function () {
            var order = Order;
            order.custom.worldpayMACMissingVal = MACFlag;
        });
    } catch (Exception) {
        return { success: false };
    }
    return { success: true };
}

/** Exported functions **/
module.exports = {
    updateTransactionStatus: updateTransactionStatus
};
