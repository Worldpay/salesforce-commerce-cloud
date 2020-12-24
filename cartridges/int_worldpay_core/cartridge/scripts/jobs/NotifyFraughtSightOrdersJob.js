
/**
 * This script notifies the list of fraud sight potential risk orders.
 * @param {string} jobParams job parameters
 */
function notifyFraudSightRiskOrders(jobParams) {
    var Util = require('dw/util');
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');
    var Net = require('dw/net');
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var Logger = require('dw/system/Logger');
    var riskOrders = [];
    var totalCount = 0;
    var queryString = 'custom.isFraudSightOrderReview = true';
    var orderStatus = jobParams.status;
    var statuses = orderStatus.split(',');
    if (statuses) {
        if (statuses.length > 1) {
            var statusQueryStr = ' AND (';
            statuses.forEach(function (status) {
                statusQueryStr += 'status = ' + status + ' OR ';
            });
            queryString += statusQueryStr.substring(0, statusQueryStr.length - 4) + ')';
        } else {
            queryString += ' AND status = ' + statuses[0];
        }
    }
    var ordersReturnedByQueryIterator = OrderMgr.queryOrders(queryString, 'creationDate desc');
    if (ordersReturnedByQueryIterator.getCount() > 0) {
        Transaction.wrap(function () {
            while (ordersReturnedByQueryIterator.hasNext()) {
                var orderReturnedByQuery = ordersReturnedByQueryIterator.next();
                totalCount++;
                var riskOrder = {
                    orderNumber: orderReturnedByQuery.orderNo,
                    fraudSightRiskReason: orderReturnedByQuery.custom.fraudSightRiskReason ? orderReturnedByQuery.custom.fraudSightRiskReason : '-',
                    fraudSightRiskScore: orderReturnedByQuery.custom.fraudSightRiskScore ? orderReturnedByQuery.custom.fraudSightRiskScore : '-',
                    fraudSightRiskMessage: orderReturnedByQuery.custom.fraudSightRiskMessage ? orderReturnedByQuery.custom.fraudSightRiskMessage : '-',
                    riskProvider: orderReturnedByQuery.custom.riskProvider ? orderReturnedByQuery.custom.riskProvider : '-',
                    riskFinalScore: orderReturnedByQuery.custom.riskFinalScore ? orderReturnedByQuery.custom.riskFinalScore : '-',
                    riskMessage: orderReturnedByQuery.custom.riskMessage ? orderReturnedByQuery.custom.riskMessage : '-'
                };
                riskOrders.push(riskOrder);
                orderReturnedByQuery.custom.isFraudSightOrderReview = false;
                orderReturnedByQuery.custom.isFraudRiskNotified = true;
            }
        });
    }
    if (Site.getCurrent().getCustomPreferenceValue('EnableJobMailerService')) {
        var mailTo = Site.getCurrent().getCustomPreferenceValue('NotifyFraudSightOrderMailTo').toString();
        var mailFrom = Site.getCurrent().getCustomPreferenceValue('NotifyFraudSightOrderMailFrom').toString();
        var renderingParameters = new Util.HashMap();
        renderingParameters.put('totalCount', Number(totalCount));
        if (totalCount > 0) {
            var fraudSightOrders = require('*/cartridge/scripts/pipelets/WriteToNotifyLog').writeToNotifyFraudRiskOrders(riskOrders);
            renderingParameters.put('orders', riskOrders);
            renderingParameters.put('filePath', fraudSightOrders.filePath);
            renderingParameters.put('fileName', fraudSightOrders.fileName);
        } else {
            Logger.debug('No new FraudSight Risk Orders found');
        }
        var template = new Util.Template('notifyFraudSightOrdersEmail.isml');
        var mail = new Net.Mail();
        var content = template.render(renderingParameters);
        mail.addTo(mailTo);
        mail.setFrom(mailFrom);
        mail.setSubject(Resource.msgf('notify.fraudsight.risk.orders.subjectLine', 'worldpay', null, [Site.getCurrent().getID()]).toString());
        mail.setContent(content);
        mail.send();
    }
}

/** Exported functions **/
module.exports = {
    notifyFraudSightRiskOrders: notifyFraudSightRiskOrders
};

