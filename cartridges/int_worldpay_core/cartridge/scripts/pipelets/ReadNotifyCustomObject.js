/**
* Demandware Script File
* This script reads the custom object based on customObjectID , reads the xnlstring in that custom Object
* and returns the changed status recieved in status notification
*
*   @input customObjectID :  String
*   @output changedStatus : String
*   @output xmlString : String
*   @output  response : Object
*/

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger');
var Utils = require('*/cartridge/scripts/common/Utils');
var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');

/**
 * Reads OrderNotifyUpdates custom object
 * @param {number} customObjectID - Custom Object ID
 * @return {Object} returns an JSON object
 */
function readNotifyCustomObject(customObjectID) {
    var customObj = customObjectID;
    var notifyCO;
    var changedStatus;
    var xmlString;
    var response;
    var errorCode;
    var errorMessage;
    try {
        if (!customObj || customObj === null) {
            return { success: false, changedStatus: changedStatus, xmlString: xmlString, response: response };
        }
      // Get Custom Object based on passed custom object id.
        notifyCO = CustomObjectMgr.getCustomObject('OrderNotifyUpdates', customObj);
        if (notifyCO && notifyCO !== null && notifyCO !== '') {
         // fetch from XML
            xmlString = notifyCO.custom.xmlString;
            try {
                if (xmlString != null) {
                    this.content = new XML(xmlString);
                    response = Utils.parseResponse(xmlString);
                } else {
                    errorCode = WorldpayConstants.NOTIFYERRORCODE111;
                    errorMessage = Utils.getErrorMessage(errorCode);
                    Logger.getLogger('worldpay').error('Order Notification : Read Custom Object : ' + errorCode + ' : ' + errorMessage + ' : ' + xmlString);
                    return { success: false, changedStatus: changedStatus, xmlString: xmlString, response: response };
                }
            } catch (ex) {
                this.status = false;
                errorCode = WorldpayConstants.NOTIFYERRORCODE112;
                errorMessage = Utils.getErrorMessage(errorCode);
                Logger.getLogger('worldpay').error('Order Notification : Read Custom Object : ' + errorCode + ' : ' + errorMessage + ' : ' + xmlString + ' : ' + ex);
                return { success: false, changedStatus: changedStatus, xmlString: xmlString, response: response };
            }
            var orderCode;
            try {
                if (this.content.localName().equalsIgnoreCase(WorldpayConstants.XMLPAYMENTSERVICE)) {
                    var temp = this.content;
                    if (WorldpayConstants.XMLORDERSTATUSEVENT in temp.notify) {
                        orderCode = temp.notify.orderStatusEvent.attribute('orderCode').toString();
                    } else {
                        errorCode = WorldpayConstants.NOTIFYERRORCODE112;
                        errorMessage = Utils.getErrorMessage(errorCode);
                        Logger.getLogger('worldpay').error('Order Notification : Read Custom Object : ' + errorCode + ' : ' + errorMessage + ' : ' + xmlString);
                    }
                    if (WorldpayConstants.XMLLASTEVENT in temp.notify.orderStatusEvent.payment) {
                        changedStatus = temp.notify.orderStatusEvent.payment.lastEvent;
                        var cvcId = temp.notify.orderStatusEvent.payment.CVCResultCode.attribute('description').toString();
                        var avsId = temp.notify.orderStatusEvent.payment.AVSResultCode.attribute('description').toString();
                        var riskScore = 0;
                        if (temp.notify.orderStatusEvent.payment.riskScore.attribute('finalScore')) {
                            var riskFinalScoreString = temp.notify.orderStatusEvent.payment.riskScore.attribute('finalScore').toString();
                            riskScore = Number(riskFinalScoreString);
                        } else if (temp.notify.orderStatusEvent.payment.riskScore.attribute('value')) {
                            var riskScoreString = temp.notify.orderStatusEvent.payment.riskScore.attribute('value').toString();
                            riskScore = Number(riskScoreString);
                        }
                        if (changedStatus.equalsIgnoreCase(WorldpayConstants.CANCELLEDSTATUS)) {
                            if ((cvcId.equalsIgnoreCase(WorldpayConstants.FAILEDSTATUS) && avsId.equalsIgnoreCase(WorldpayConstants.FAILEDSTATUS)) ||
                                    (cvcId.equalsIgnoreCase('D') && avsId.equalsIgnoreCase('J')) || (riskScore > 100)) {
                                changedStatus = 'POST_AUTH_CANCELLED';
                            }
                        }
                    } else {
                        errorCode = WorldpayConstants.NOTIFYERRORCODE112;
                        errorMessage = Utils.getErrorMessage(errorCode);
                        Logger.getLogger('worldpay').error('Order Notification : Read Custom Object : ' + errorCode + ' : ' + errorMessage + ' : ' + xmlString);
                        return { success: false, changedStatus: changedStatus, xmlString: xmlString, response: response };
                    }
                } else {
                    errorCode = WorldpayConstants.NOTIFYERRORCODE112;
                    errorMessage = Utils.getErrorMessage(errorCode);
                    Logger.getLogger('worldpay').error('Order Notification : Read Custom Object : ' + errorCode + ' : ' + errorMessage + ' : ' + xmlString);
                    return { success: false, changedStatus: changedStatus, xmlString: xmlString, response: response };
                }
            } catch (ex) {
                errorCode = WorldpayConstants.NOTIFYERRORCODE117;
                errorMessage = Utils.getErrorMessage(errorCode);
                Logger.getLogger('worldpay').error('Order Notification : Read Custom Object : ' + errorCode + ' : ' + errorMessage + ' : ' + xmlString + ' : ' + ex);
                return { success: false, changedStatus: changedStatus, xmlString: xmlString, response: response, orderCode: orderCode };
            }
            changedStatus = changedStatus.toString();
        }
    } catch (e) {
        errorCode = WorldpayConstants.NOTIFYERRORCODE117;
        errorMessage = Utils.getErrorMessage(errorCode);
        Logger.getLogger('worldpay').error('Order Notification : Read Custom Object : ' + errorCode + ' : ' + errorMessage + ' : ' + e);
        return { success: false, changedStatus: changedStatus, xmlString: xmlString, response: response };
    }
    return { success: true, changedStatus: changedStatus, xmlString: xmlString, response: response };
}
/** Exported functions **/
module.exports = {
    readNotifyCustomObject: readNotifyCustomObject
};
