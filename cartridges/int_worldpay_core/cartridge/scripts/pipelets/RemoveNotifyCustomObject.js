/**
* Demandware Script File
* This script deletes the custom object based on customObjectID
*
*   @input customObjectID :  String
*/

/**
 * This script deletes the custom object based on customObjectID
 * @param {string} customObjectID - Custom object ID
 * @return {Object} returns an object
 */
function removeNotifyCustomObject(customObjectID) {
    var Logger = require('dw/system/Logger');
    var customObj = customObjectID;
    var notifyCO;
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    try {
        if (customObj == null) {
            return { success: false };
        }
      // Get Custom Object based on passed custom object id.
        notifyCO = CustomObjectMgr.getCustomObject('OrderNotifyUpdates', customObj);
        if (notifyCO !== null && notifyCO !== '') {
            CustomObjectMgr.remove(notifyCO);
        }
    } catch (e) {
        var errorCode = require('*/cartridge/scripts/common/WorldpayConstants').NOTIFYERRORCODE114;
        var errorMessage = require('*/cartridge/scripts/common/Utils').getErrorMessage(errorCode);
        Logger.getLogger('worldpay').error('Order Notification : Read Custom Object : ' + errorCode + ' : ' + errorMessage + ' : ' + e);
        return { success: false };
    }
    return { success: true };
}
/** Exported functions **/
module.exports = {
    removeNotifyCustomObject: removeNotifyCustomObject
};
