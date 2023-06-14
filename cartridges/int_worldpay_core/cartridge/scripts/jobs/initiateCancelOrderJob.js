/**
 * Makes the cancel order service call and processes result
 * @param {dw.util.Collection} ordersReturnedByQueryIterator - Contains orders that needs to be canceled
 * @returns {Object} - success or failure object
 */
function cancelOrderServiceCall(ordersReturnedByQueryIterator) {
    var Logger = require('dw/system/Logger');
    var Util = require('dw/util');
    var errorList = new Util.ArrayList();
    var generateErrorMessageForJobResult;
    var orderReturnedByQuery = ordersReturnedByQueryIterator.next();
    var errorCode = null;
    var scriptFailed = false;
    var errorCount = 0;
    var errorString = ' ';
    var orderNo = orderReturnedByQuery.orderNo;
    var initiateCancelOrderResult;
    var updateTransactionStatusResult;
    initiateCancelOrderResult = require('*/cartridge/scripts/pipelets/initiateCancelOrder').initiateCancelOrder(orderNo);
    errorCode = initiateCancelOrderResult.errorCode;
    var errorMessage = initiateCancelOrderResult.errorMessage;
    if (initiateCancelOrderResult.success) {
        errorString = errorCode ? errorCode + '-' + errorMessage : '';
        var serviceresponse = initiateCancelOrderResult.response;
        if (!errorCode && serviceresponse != null) {
            Logger.getLogger('worldpay').debug('InitiateCancelOrder serviceResponse : ' + serviceresponse);
            updateTransactionStatusResult = require('*/cartridge/scripts/order/updateTransactionStatus').updateTransactionStatus(
                orderReturnedByQuery, false);
        }
        if (errorCode || serviceresponse == null || updateTransactionStatusResult.success === false) {
            errorCount += 1;
        }
    } else {
        scriptFailed = true;
        errorCount += 1;
        Logger.getLogger('worldpay').error(
            'Order Cancel Job - Error Code : {0} Error Message {1}', errorCode, initiateCancelOrderResult.errorMessage);
        return {
            success: false,
            scriptFailed: scriptFailed,
            errorCount: errorCount,
            errorString: errorString,
            errorList: errorList
        };
    }
    if (errorCount > 0) {
        generateErrorMessageForJobResult = require('*/cartridge/scripts/pipelets/generateErrorMessageForJob').generateErrorMessageForJob(
            errorMessage, orderNo, null, errorList);
        errorList = generateErrorMessageForJobResult.errorListResult;
    }
    return {
        success: true,
        scriptFailed: scriptFailed,
        errorCount: errorCount,
        errorString: errorString,
        errorList: errorList
    };
}

/**
 * Creates notify log and send email
 * @param {number} errorCount - error count
 * @param {number} totalCount - total error count
 * @param {string} errorString - error string
 * @param {Array} errorList - error list
 * @param {boolean} scriptFailed - flag for detecting it script failed
 */
function sendMail(errorCount, totalCount, errorString, errorList, scriptFailed) {
    var Util = require('dw/util');
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');
    var Net = require('dw/net');
    if (errorCount > 0) {
        var writeToNotifyLogResult = require('*/cartridge/scripts/pipelets/writeToNotifyLog').writeToNotifyLog(errorList);
        var mailTo = Site.getCurrent().getCustomPreferenceValue('NotifyJobMailTo').toString();
        var mailFrom = Site.getCurrent().getCustomPreferenceValue('NotifyJobMailFrom').toString();
        var mailCC = Site.getCurrent().getCustomPreferenceValue('NotifyJobMailCC').toString();
        var renderingParameters = new Util.HashMap();
        renderingParameters.put('totalCount', totalCount);
        renderingParameters.put('errorCount', errorCount);
        renderingParameters.put('filePath', writeToNotifyLogResult.filePath);
        renderingParameters.put('errorString', errorString);
        var template = new Util.Template('emailtemplateforjob.isml');
        var mail = new Net.Mail();
        var content = template.render(renderingParameters);
        mail.addTo(mailTo);
        mail.setFrom(mailFrom);
        mail.addCc(mailCC);
        mail.setSubject(Resource.msg('refund.cancel.Job.subjectLine', 'worldpay', null).toString());
        mail.setContent(content);
        mail.send();
        if (!scriptFailed) {
            return;
        }
        throw new Error('Script Failed');
    }
    return;
}
/**
 * This script fetch orders, initiates the cancel order job
 * and notifies about errors through mail
 */
function initiateCancelOrder() {
    var Util = require('dw/util');
    var Site = require('dw/system/Site');
    var Order = require('dw/order/Order');
    var errorCount = 0;
    var errorString = ' ';
    var totalCount = 0;
    var errorList = new Util.ArrayList();
    var CreationDate = new Util.Calendar();
    var scriptFailed = false;
    var inquiryLagTime = Site.getCurrent().getCustomPreferenceValue('WorldpayOrderInquiryLagTime');
    CreationDate.add(Util.Calendar.MILLISECOND, -60000 * inquiryLagTime);
    var type = 'Order';
    var queryString = 'status={' + 0 + '} AND creationDate<={' + 1 + '} AND custom.worldpayMACMissingVal ={' + 2 + '}';
    var sortString = 'creationDate asc';
    var systemObject = require('dw/object/SystemObjectMgr');
    var ordersReturnedByQueryIterator = systemObject.querySystemObjects(
        type, queryString, sortString, Order.ORDER_STATUS_FAILED, CreationDate.getTime(), true);
    if (ordersReturnedByQueryIterator.getCount() > 0) {
        while (ordersReturnedByQueryIterator.hasNext()) {
            totalCount++;
            var result = cancelOrderServiceCall(ordersReturnedByQueryIterator);
            errorCount += result.errorCount;
            errorString = result.errorString;
            scriptFailed = result.scriptFailed;
            errorList = result.errorList;
            if (!result.success) {
                break;
            }
        }
        if (Site.getCurrent().getCustomPreferenceValue('EnableJobMailerService')) {
            sendMail(errorCount, totalCount, errorString, errorList, scriptFailed);
        }
        return;
    }
}

module.exports = {
    initiateCancelOrder: initiateCancelOrder
};
