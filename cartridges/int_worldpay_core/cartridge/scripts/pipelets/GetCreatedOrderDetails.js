/**
* Demandware Script File
* This Sript identifies the Orders which have to be Expired based upon
* the Days mentioned at Payment Method level.
*
* @<paramUsageType> <paramName> : <paramDataType> [<paramComment>]
*
* where
*   <paramUsageType> can be either 'input' or 'output'
*   <paramName> can be any valid parameter name
*   <paramDataType> identifies the type of the parameter
*   <paramComment> is an optional comment
*
* For example:
*
* @input order : dw.order.Order The order.
* @output toDelete : Boolean
*
*/

/**
 * This Script identifies the Orders which have to be Expired based upon
 * the Days mentioned at Payment Method level.
 * @param {dw.order.Order} CreatedOrder - Current users's order
 * @return {Object} returns an error object
 */
function getCreatedOrderDetails(CreatedOrder) {
    var Calendar = require('dw/util/Calendar');
    var Site = require('dw/system/Site');
    var Logger = require('dw/system/Logger');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var order = CreatedOrder;
    var paymentInstrs = order.getPaymentInstruments();

  // get all credit card payment instruments
    var iter = paymentInstrs.iterator();
    var existingPI = null;
    var creationDate = order.getCreationDate();
    var calDate = new Calendar(creationDate);
    var day;
    var toDelete = false;

    calDate.setTimeZone('GMT');
    var cal = Site.getCalendar();
    try {
    // extract the expiry days
        while (iter.hasNext()) {
            existingPI = iter.next();
            var paymentMethod = existingPI.getPaymentMethod();
            var method = PaymentMgr.getPaymentMethod(paymentMethod);
            day = method.custom.expiryDay;
        }

        calDate.add(Calendar.DATE, (day == null) ? 0 : day);

        if (calDate.before(cal)) {
            toDelete = true;
        }
        return { success: true, toDelete: toDelete };
    } catch (ex) {
        Logger.getLogger('worldpay').error('Exception when fecthing created order details : ' + ex.message);
        return { success: false, toDelete: toDelete };
    }
}

/** Exported functions **/
module.exports = {
    getCreatedOrderDetails: getCreatedOrderDetails
};
