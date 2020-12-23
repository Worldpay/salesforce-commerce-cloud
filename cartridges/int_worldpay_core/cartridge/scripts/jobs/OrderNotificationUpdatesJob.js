'use strict';

/**
 * Defines alternate flow in case of null Order or non worldpay Order
 * or Order without state or Order with error in State
 * @param {number} errorCount - total error Count
 * @param {dw.util.ArrayList} errorList - List of all occurred errors
 * @param {string} errorMessage - Corresponding error message
 * @param {number} orderNo - Order Number
 * @param {string} XMLString - String representation of XML
 * @param {number} customObjectID - Custom Object ID
 * @return {Object} returns an object
 */
function alternateFlow(errorCount, errorList, errorMessage, orderNo, XMLString, customObjectID) {
  // Assign
    var errorCountIncrement = errorCount + 1;
  // GenerateErrorMessageForJob.js
    var generateErrorMessageForJobResult = require('*/cartridge/scripts/pipelets/GenerateErrorMessageForJob').generateErrorMessageForJob(errorMessage,
        orderNo, XMLString, errorList);

    var worldPayJobs = require('*/cartridge/scripts/jobs/WorldpayJobs');
  // RemoveCustomObject
    worldPayJobs.removeCustomObject(customObjectID);

    return {
        errorCount: errorCountIncrement,
        errorString: generateErrorMessageForJobResult.errorString,
        errorList: generateErrorMessageForJobResult.errorListResult
    };
}

/**
Batch job for reading Custom Objects of Order Notifications and updating Order Statuses
**/
function orderNotificationUpdateJob() {
  // Assign
    var Util = require('dw/util');
    var errorCount = 0;
    var errorString = '';
    var errorList = new Util.ArrayList();
    var totalCount = 0;
    var alternateFLowResult = '';
    var Net = require('dw/net');
    var Resource = require('dw/web/Resource');
    var worldPayJobs = require('*/cartridge/scripts/jobs/WorldpayJobs');
    var Site = require('dw/system/Site');
    var Order = require('dw/order/OrderMgr');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var searchResultIterator = CustomObjectMgr.queryCustomObjects('OrderNotifyUpdates', '', 'creationDate', null);
    if (searchResultIterator.getCount() > 0) {
        while (searchResultIterator.hasNext()) {
            var result = searchResultIterator.next();
            var errorMessage;
            var orderNo = result.custom.orderNo;
            var customObjectID = result.custom.ID;
            totalCount += 1;
            var readCustomObject = worldPayJobs.readCustomObject(customObjectID);

            var changedStatus = readCustomObject.changedStatus;
            var response = readCustomObject.response;
            var xmlString = readCustomObject.xmlString;
            var updateStatus = changedStatus;
            if (updateStatus != null) {
                var order = Order.getOrder(orderNo);
                if (!order || order == null) {
                    errorMessage = 'order does not exist';

                    alternateFLowResult = alternateFlow(errorCount, errorList, errorMessage, orderNo, xmlString, customObjectID);
                    errorCount = alternateFLowResult.errorCount;
                    errorList = alternateFLowResult.errorList;
                    errorString = alternateFLowResult.errorString;
                    continue; // eslint-disable-line
                }
                var checkWorldpayOrderResult = require('*/cartridge/scripts/pipelets/CheckWorldpayOrder').checkWorldpayOrder(order);
                if (!checkWorldpayOrderResult.WorldpayOrderFound) {
                    errorMessage = 'Not a worldpay order';

                    alternateFLowResult = alternateFlow(errorCount, errorList, errorMessage, orderNo, xmlString, customObjectID);
                    errorCount = alternateFLowResult.errorCount;
                    errorList = alternateFLowResult.errorList;
                    errorString = alternateFLowResult.errorString;
                    continue; // eslint-disable-line
                }
                var worldPayTokenRequested = checkWorldpayOrderResult.TokenRequested;
                var paymentInstr = checkWorldpayOrderResult.PaymentInstrument;

                var flag = worldPayJobs.updateOrderStatus(order, updateStatus, response);
                if (!flag) {
                    errorMessage = 'Error in order status update';

                    alternateFLowResult = alternateFlow(errorCount, errorList, errorMessage, orderNo, xmlString, customObjectID);
                    errorCount = alternateFLowResult.errorCount;
                    errorList = alternateFLowResult.errorList;
                    errorString = alternateFLowResult.errorString;
                    continue; // eslint-disable-line
                }
                var serviceResponse = response;
                var CustomerObj = require('dw/customer/CustomerMgr').getCustomerByLogin(order.getCustomerEmail());
                if (!CustomerObj || CustomerObj == null) {
                    worldPayJobs.removeCustomObject(customObjectID);
                    continue; // eslint-disable-line
                }
                var cardNumber = serviceResponse.cardNumber.valueOf().toString();
                var cardType = serviceResponse.cardBrand.valueOf().toString();
                if (cardNumber && worldPayTokenRequested && serviceResponse.paymentTokenID) {
                    var updatePaymentToken = true;
                    var orderPaymentInstruments = order.getPaymentInstruments();
                    var orderPaymentInstrumentsIterator = orderPaymentInstruments.iterator();

                    while (orderPaymentInstrumentsIterator.hasNext()) {
                        var orderPaymentInstrument = orderPaymentInstrumentsIterator.next();
                        if (orderPaymentInstrument.getPaymentMethod().equalsIgnoreCase('CREDIT_CARD')) {
                            updatePaymentToken = false;
                        }
                    }
                    if (updatePaymentToken) {
                        worldPayJobs.addOrUpdateToken(CustomerObj, serviceResponse, cardNumber, cardType);
                    }
                    worldPayJobs.updateOrderToken(paymentInstr, serviceResponse);
                }
                worldPayJobs.removeCustomObject(customObjectID);
            } else {
                errorMessage = 'No status to update ' + updateStatus;

                alternateFLowResult = alternateFlow(errorCount, errorList, errorMessage, orderNo, xmlString, customObjectID);

                errorCount = alternateFLowResult.errorCount;
                errorList = alternateFLowResult.errorList;
                errorString = alternateFLowResult.errorString;

                continue; // eslint-disable-line
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
                renderingParameters.put('fileName', writeToNotifyLogResult.fileName);
                renderingParameters.put('errorString', errorString);
                var template = new Util.Template('emailtemplateforjob.isml');
                var content = template.render(renderingParameters);
                var mail = new Net.Mail();

                mail.addTo(mailTo);
                mail.setFrom(mailFrom);
                mail.addCc(mailCC);
                mail.setSubject(Resource.msg('notify.Job.subjectLine', 'worldpay', null).toString());
                mail.setContent(content);
                mail.send();
            } else {
                return;
            }
        } else {
            return;
        }
    } else {
        return;
    }
}


/** Exported functions **/
module.exports = {
    orderNotificationUpdateJob: orderNotificationUpdateJob
};
