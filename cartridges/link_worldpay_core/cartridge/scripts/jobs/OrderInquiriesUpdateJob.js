/**
 * This script updates the order Inquiries  job
 */
function orderInquiriesUpdate() {
    var Util = require('dw/util');
    var Site = require('dw/system/Site');
    var Net = require('dw/net');
    var Resource = require('dw/web/Resource');
    var Order = require('dw/order/Order');
    var SystemObjectMgr = require('dw/object/SystemObjectMgr');
    var worldPayJobs = require('link_worldpay_core/cartridge/scripts/jobs/WorldpayJobs');
    var Logger = require('dw/system/Logger');
    var Transaction = require('dw/system/Transaction');

    var errorCount = 0;
    var errorMessage = ' ';
    var totalCount = 0;
    var CreationDate = new Util.Calendar();
    var errorList = new Util.ArrayList();
    var scriptFailed = false;
    var generateErrorMessageForJobResult;

    CreationDate.add(Util.Calendar.MILLISECOND, -60000 * Site.getCurrent().getCustomPreferenceValue('WorldpayOrderInquiryLagTime'));

    var type = 'Order';
    var queryString = 'paymentStatus={' + 0 + '} AND (status={' + 1 + '} OR status={' + 2 + '} OR status={' + 3 + '}) AND creationDate<={' + 4 + '}';
    var sortString = 'creationDate asc';

    var ordersReturnedByQueryIterator = SystemObjectMgr.querySystemObjects(type, queryString, sortString, Order.PAYMENT_STATUS_NOTPAID, Order.ORDER_STATUS_CREATED, Order.ORDER_STATUS_NEW, Order.ORDER_STATUS_OPEN, CreationDate.getTime());

  // Expression
    if (ordersReturnedByQueryIterator.getCount() > 0) {
    // Object Iterator
        while (ordersReturnedByQueryIterator.hasNext()) {
            var orderReturnedByQuery = ordersReturnedByQueryIterator.next();
            totalCount = 0;
      // Assign
            var errorCode = '';

      // CheckWorldpayOrder
            var checkWorldpayOrderResult = require('link_worldpay_core/cartridge/scripts/pipelets/CheckWorldpayOrder').checkWorldpayOrder(orderReturnedByQuery);

            var worldPayTokenRequested = checkWorldpayOrderResult.TokenRequested;
            var paymentInstr = checkWorldpayOrderResult.PaymentInstrument;
      // Expression
            if (!checkWorldpayOrderResult.WorldpayOrderFound) {
                continue; // eslint-disable-line
            } else {
                // Assign
                var orderNo = orderReturnedByQuery.orderNo;
                totalCount += 1;

                var sendWorldpayOrderInquiriesRequestResult;
                // SendWorldpayOrderInquiriesRequest
                sendWorldpayOrderInquiriesRequestResult = require('link_worldpay_core/cartridge/scripts/pipelets/SendWorldpayOrderInquiriesRequest').sendWorldpayOrderInquiriesRequest(orderReturnedByQuery, paymentInstr);
                errorMessage = sendWorldpayOrderInquiriesRequestResult.errorMessage;
                errorCode = sendWorldpayOrderInquiriesRequestResult.errorCode;
                if (sendWorldpayOrderInquiriesRequestResult.success) {
                    // Assign
                    errorMessage = errorCode ? errorCode + '-' + sendWorldpayOrderInquiriesRequestResult.errorMessage : '';
                    var serviceResponse = sendWorldpayOrderInquiriesRequestResult.response;
                    // Expression
                    if (!errorCode && serviceResponse != null) {
                        // Assign
                        Logger.getLogger('worldpay').debug('OrderInquiryRequestService serviceResponse : ' + serviceResponse);
                        var updateStatus = serviceResponse.lastEvent;
                        // Expression
                        if (!(orderReturnedByQuery.custom.WorldpayLastEvent && orderReturnedByQuery.custom.WorldpayLastEvent.equalsIgnoreCase(updateStatus))) {
                            // WorldpayJobs-UpdateOrderStatus
                            var flag = worldPayJobs.updateOrderStatus(orderReturnedByQuery, updateStatus, serviceResponse);
                            // ERROR
                            if (!flag) {
                                // Assign
                                errorCount += 1;
                                // GenerateErrorMessageForJob.js
                                generateErrorMessageForJobResult = require('link_worldpay_core/cartridge/scripts/pipelets/GenerateErrorMessageForJob').generateErrorMessageForJob(errorMessage, orderNo, null, errorList);
                                errorList = generateErrorMessageForJobResult.errorListResult;

                                continue; // eslint-disable-line
                            }
                        }
                        // WorldpayJobs-UpdateOrderStatus  OK
                        // GetCustomer
                        var customerBasedOnEmail;
                        try {
                            var CustomerManager = require('dw/customer/CustomerMgr');
                            customerBasedOnEmail = CustomerManager.getCustomerByLogin(orderReturnedByQuery.getCustomerEmail());
                        } catch (Exception) {
                            continue; // eslint-disable-line
                        }
                        if (!customerBasedOnEmail || customerBasedOnEmail == null) {
                            continue; // eslint-disable-line
                        }
            // ASSIGN
                        var cardNumber = serviceResponse.cardNumber.valueOf().toString();
                        var cardType = serviceResponse.cardBrand.valueOf().toString();
            // Expression
                        if (cardNumber && worldPayTokenRequested && paymentInstr.paymentMethod.equals('Worldpay') && (!('paymentCardAdded' in paymentInstr.custom) || !paymentInstr.custom.paymentCardAdded)) {
                            // update the token details in customer account's saved card from service response only for Redirect
                            worldPayJobs.addOrUpdateToken(customerBasedOnEmail, serviceResponse, cardNumber, cardType);
                            // paymentCardAdded
                            Transaction.wrap(function () { // eslint-disable-line
                                paymentInstr.custom.paymentCardAdded = true;
                            }); // eslint-disable-line
                        }
                        if (cardNumber && worldPayTokenRequested) {
                            // order updated with token details from service response, the payment instrument passed is of order. This will be called for both CC direct and Redirect
                            paymentInstr = worldPayJobs.updateOrderToken(paymentInstr, serviceResponse);
                        } else {
                            continue; // eslint-disable-line
                        }
                    } else {
            // Assign
                        errorCount += 1;

            // GenerateErrorMessageForJob.js
                        generateErrorMessageForJobResult = require('link_worldpay_core/cartridge/scripts/pipelets/GenerateErrorMessageForJob').generateErrorMessageForJob(errorMessage, orderNo, null, errorList);
                        errorList = generateErrorMessageForJobResult.errorListResult;

                        continue; // eslint-disable-line
                    }
                } else {
          // Asssign
                    scriptFailed = true;
                    errorCount += 1;

                    Logger.getLogger('worldpay').error('Order Inquiry Update Job - Error Code : {0} Error Message {1}', errorCode, sendWorldpayOrderInquiriesRequestResult.errorMessage);
                    // GenerateErrorMessageForJob.js
                    generateErrorMessageForJobResult = require('link_worldpay_core/cartridge/scripts/pipelets/GenerateErrorMessageForJob').generateErrorMessageForJob(errorMessage, orderNo, null, errorList);
                    errorList = generateErrorMessageForJobResult.errorListResult;

                    // End of Iteration Flow
                    break;
                }
            }
        }
    // Expression
    // Expression
        if (Site.getCurrent().getCustomPreferenceValue('EnableJobMailerService') && errorCount > 0) {
      // WriteToNotifyLog.js
            var writeToNotifyLogResult = require('link_worldpay_core/cartridge/scripts/pipelets/WriteToNotifyLog').writeToNotifyLog(errorList);

      // Assign
            var mailTo = Site.getCurrent().getCustomPreferenceValue('NotifyJobMailTo').toString();
            var mailFrom = Site.getCurrent().getCustomPreferenceValue('NotifyJobMailFrom').toString();
            var mailCC = Site.getCurrent().getCustomPreferenceValue('NotifyJobMailCC').toString();

            var renderingParameters = new Util.HashMap();
            renderingParameters.put('totalCount', totalCount);
            renderingParameters.put('errorCount', errorCount);
            renderingParameters.put('filePath', writeToNotifyLogResult.filePath);
            renderingParameters.put('errorString', errorMessage);
      // Send Mail
            var template = new Util.Template('emailtemplateforjob.isml');
            var content = template.render(renderingParameters);
            var mail = new Net.Mail();

            mail.addTo(mailTo);
            mail.setFrom(mailFrom);
            mail.addCc(mailCC);
            mail.setSubject(Resource.msg('enquiry.Job.subjectLine', 'worldpay', null).toString());
            mail.setContent(content);
            mail.send();

      // Expression
            if (scriptFailed) {
                throw new Error('Script Failed');
            } else {
                return;
            }
        } else {
            return;
        }
    }
}

/** Exported functions **/
module.exports = {
    orderInquiriesUpdate: orderInquiriesUpdate
};
