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
var utils = require('*/cartridge/scripts/common/utils');
var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');

/**
 * Handles change of status for PostAuthCancelled scenario
 * @param {Object} temp - XmlBody
 * @returns {string} - changedStatus
 */
function handlePostAuthCancelledStatus(temp) {
    var changedStatus;
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
    if (changedStatus.equalsIgnoreCase(worldpayConstants.CANCELLEDSTATUS)) {
        if ((cvcId.equalsIgnoreCase(worldpayConstants.FAILEDSTATUS) && avsId.equalsIgnoreCase(worldpayConstants.FAILEDSTATUS)) ||
                (cvcId.equalsIgnoreCase('D') && avsId.equalsIgnoreCase('J')) || (riskScore > 100)) {
            changedStatus = 'POST_AUTH_CANCELLED';
        }
    }
    return changedStatus;
}

/**
 * Helper function for readNotifyCustomObject
 * @param {string} xmlString - Order Notification Updates XML
 * @param {string} content - service response content
 * @returns {Object} - success or error object
 */
function readNotifyCustomObjectHelper(xmlString, content) {
    var orderCode;
    var errorCode;
    var errorMessage;
    var changedStatus;
    if (content.localName().equalsIgnoreCase(worldpayConstants.XMLPAYMENTSERVICE)) {
        var temp = content;
        if (worldpayConstants.XMLORDERSTATUSEVENT in temp.notify) {
            orderCode = temp.notify.orderStatusEvent.attribute('orderCode').toString();
        } else {
            errorCode = worldpayConstants.NOTIFYERRORCODE112;
            errorMessage = utils.getErrorMessage(errorCode);
            Logger.getLogger('worldpay').error('Order Notification : Read Custom Object : ' + errorCode + ' : ' + errorMessage + ' : ' + xmlString);
        }
        if (worldpayConstants.XMLLASTEVENT in temp.notify.orderStatusEvent.payment) {
            changedStatus = handlePostAuthCancelledStatus(temp);
        } else {
            errorCode = worldpayConstants.NOTIFYERRORCODE112;
            errorMessage = utils.getErrorMessage(errorCode);
            Logger.getLogger('worldpay').error('Order Notification : Read Custom Object : ' + errorCode + ' : ' + errorMessage + ' : ' + xmlString);
            return { success: false, changedStatus: changedStatus, xmlString: xmlString, response: response };
        }
    } else {
        errorCode = worldpayConstants.NOTIFYERRORCODE112;
        errorMessage = utils.getErrorMessage(errorCode);
        Logger.getLogger('worldpay').error('Order Notification : Read Custom Object : ' + errorCode + ' : ' + errorMessage + ' : ' + xmlString);
        return { success: false, changedStatus: changedStatus, xmlString: xmlString, response: response };
    }
    return { success: true, changedStatus: changedStatus, xmlString: xmlString, response: response, orderCode: orderCode };
}

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
                    response = utils.parseResponse(xmlString);
                } else {
                    errorCode = worldpayConstants.NOTIFYERRORCODE111;
                    errorMessage = utils.getErrorMessage(errorCode);
                    Logger.getLogger('worldpay').error('Order Notification : Read Custom Object : ' + errorCode + ' : ' + errorMessage + ' : ' + xmlString);
                    return { success: false, changedStatus: changedStatus, xmlString: xmlString, response: response };
                }
            } catch (ex) {
                this.status = false;
                errorCode = worldpayConstants.NOTIFYERRORCODE112;
                errorMessage = utils.getErrorMessage(errorCode);
                Logger.getLogger('worldpay').error('Order Notification : Read Custom Object : ' + errorCode + ' : ' + errorMessage + ' : ' + xmlString + ' : ' + ex);
                return { success: false, changedStatus: changedStatus, xmlString: xmlString, response: response };
            }
            var orderCode;
            try {
                var result = readNotifyCustomObjectHelper(xmlString, this.content);
                if (!result.success) {
                    return result;
                }
                orderCode = result.orderCode;
                changedStatus = result.changedStatus;
            } catch (ex) {
                errorCode = worldpayConstants.NOTIFYERRORCODE117;
                errorMessage = utils.getErrorMessage(errorCode);
                Logger.getLogger('worldpay').error('Order Notification : Read Custom Object : ' + errorCode + ' : ' + errorMessage + ' : ' + xmlString + ' : ' + ex);
                return { success: false, changedStatus: changedStatus, xmlString: xmlString, response: response, orderCode: orderCode };
            }
            changedStatus = changedStatus.toString();
        }
    } catch (e) {
        errorCode = worldpayConstants.NOTIFYERRORCODE117;
        errorMessage = utils.getErrorMessage(errorCode);
        Logger.getLogger('worldpay').error('Order Notification : Read Custom Object : ' + errorCode + ' : ' + errorMessage + ' : ' + e);
        return { success: false, changedStatus: changedStatus, xmlString: xmlString, response: response };
    }
    return { success: true, changedStatus: changedStatus, xmlString: xmlString, response: response };
}
/** Exported functions **/
module.exports = {
    readNotifyCustomObject: readNotifyCustomObject
};
