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
    var utils = require('*/cartridge/scripts/common/utils');
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    try {
        Transaction.wrap(function () {
            var order = Order;
            order.custom.worldpayMACMissingVal = MACFlag;
            var statusList = utils.updateTransactionStatus(order, worldpayConstants.CANCEL_OR_REFUND);
            order.custom.transactionStatus = statusList;
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
