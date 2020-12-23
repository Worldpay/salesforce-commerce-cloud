/**
 * This script initiates the cancel order job
 */
function initiateCancelOrder() {
    var Util = require('dw/util');
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');
    var Net = require('dw/net');
    var Order = require('dw/order/Order');
    var Logger = require('dw/system/Logger');
  // Assign Node
    var errorCount = 0;
    var errorString = ' ';
    var totalCount = 0;
    var CreationDate = new Util.Calendar();
    var errorList = new Util.ArrayList();
    var scriptFailed = false;
    var inquiryLagTime = Site.getCurrent().getCustomPreferenceValue('WorldpayOrderInquiryLagTime');
    CreationDate.add(Util.Calendar.MILLISECOND, -60000 * inquiryLagTime);
    var generateErrorMessageForJobResult;
  // SearchSystemObject

    var type = 'Order';
    var queryString = 'status={' + 0 + '} AND creationDate<={' + 1 + '} AND custom.worldpayMACMissingVal ={' + 2 + '}';
    var sortString = 'creationDate asc';

    var systemObject = require('dw/object/SystemObjectMgr');
    var ordersReturnedByQueryIterator = systemObject.querySystemObjects(type, queryString, sortString, Order.ORDER_STATUS_FAILED, CreationDate.getTime(), true);

    if (ordersReturnedByQueryIterator.getCount() > 0) {
        while (ordersReturnedByQueryIterator.hasNext()) {
            var orderReturnedByQuery = ordersReturnedByQueryIterator.next();
            totalCount = 0;
            var errorCode = null;
            var orderNo = orderReturnedByQuery.orderNo;
            totalCount++;

            var initiateCancelOrderResult;
            var updateTransactionStatusResult;
            initiateCancelOrderResult = require('*/cartridge/scripts/pipelets/InitiateCancelOrder').initiateCancelOrder(orderNo);
            errorCode = initiateCancelOrderResult.errorCode;
            var errorMessage = initiateCancelOrderResult.errorMessage;
            if (initiateCancelOrderResult.success) {
                errorString = errorCode ? errorCode + '-' + errorMessage : '';
                var serviceresponse = initiateCancelOrderResult.response;
                if (!errorCode && serviceresponse != null) {
                    Logger.getLogger('worldpay').debug('InitiateCancelOrder serviceResponse : ' + serviceresponse);
                    updateTransactionStatusResult = require('*/cartridge/scripts/order/UpdateTransactionStatus').updateTransactionStatus(orderReturnedByQuery, false);
                }
                if (errorCode || serviceresponse == null || updateTransactionStatusResult.success === false) {
                    errorCount += 1;
                }
            } else {
                scriptFailed = true;
                errorCount += 1;
                Logger.getLogger('worldpay').error('Order Cancel Job - Error Code : {0} Error Message {1}', errorCode, initiateCancelOrderResult.errorMessage);
                break;
            }
            if (errorCount > 0) {
                generateErrorMessageForJobResult = require('*/cartridge/scripts/pipelets/GenerateErrorMessageForJob').generateErrorMessageForJob(errorMessage, orderNo, null, errorList);
                errorList = generateErrorMessageForJobResult.errorListResult;
            }
        }
        if (Site.getCurrent().getCustomPreferenceValue('EnableJobMailerService')) {
            if (errorCount > 0) {
                var writeToNotifyLogResult = require('*/cartridge/scripts/pipelets/WriteToNotifyLog').writeToNotifyLog(errorList);
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
            } else {
                return;
            }
        }
        return;
    }
}

/** Exported functions **/
module.exports = {
    initiateCancelOrder: initiateCancelOrder
};
