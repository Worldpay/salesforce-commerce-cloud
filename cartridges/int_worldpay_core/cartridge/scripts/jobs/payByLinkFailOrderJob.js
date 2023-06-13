'use strict';


/**
 * Batch job for fetching Pay By Link orders and failing them after expiry time.
**/
function failOrder() {
    var Site = require('dw/system/Site');
    var SystemObjectMgr = require('dw/object/SystemObjectMgr');
    var Order = require('dw/order/Order');
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');
    var Util = require('dw/util');
    var Net = require('dw/net');
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var type = 'Order';
    var queryString = 'confirmationStatus={' + 0 + '} AND paymentStatus={' + 1 + '} AND custom.isPayByLinkOrder ={' + 2 + '} AND status ={' + 3 + '}';
    var sortString = 'creationDate asc';
    var resendEmail = Site.getCurrent().getCustomPreferenceValue('resendEmailAfterExpired');
    var currentDate = new Date();
    var expiryTime;
    var order;
    var ordersReturnedByQueryIterator = SystemObjectMgr.querySystemObjects(
        type, queryString, sortString, Order.CONFIRMATION_STATUS_NOTCONFIRMED, Order.PAYMENT_STATUS_NOTPAID, true, Order.ORDER_STATUS_CREATED);
    while (ordersReturnedByQueryIterator.hasNext()) {
        order = ordersReturnedByQueryIterator.next();
        expiryTime = Site.getCurrent().getCustomPreferenceValue('payByLinkExpiryTime') * 60 * 60 * 1000;
        if (order.paymentInstrument.paymentMethod.equals(worldpayConstants.WORLDPAY) && (currentDate.getTime() - order.creationDate.getTime() > expiryTime) &&
        (currentDate.getTime() - order.creationDate.getTime() < 2 * expiryTime)) {
            if (resendEmail && !order.custom.payByLinkReminderEmailSent) {
                var mailTo = order.customerEmail;
                var renderingParameters = new Util.HashMap();
                renderingParameters.put('orderId', order.orderNo);
                renderingParameters.put('expiryTime', expiryTime / 3600000);
                var template = new Util.Template('checkout/sendPayByLinkExpiryNotification.isml');
                var content = template.render(renderingParameters);
                var mail = new Net.Mail();
                mail.addTo(mailTo);
                mail.setFrom('info@fisglobal.com');
                mail.setSubject(Resource.msg('alert.pay.by.link.mail.subject', 'worldpay', null).toString() + ' ' + order.orderNo);
                mail.setContent(content);
                mail.send();
                Transaction.begin();
                order.custom.payByLinkReminderEmailSent = true;
                Transaction.commit();
            }
        } else if (order.paymentInstrument.paymentMethod.equals(worldpayConstants.WORLDPAY) &&
        (currentDate.getTime() - order.creationDate.getTime() >= 2 * expiryTime) &&
        (currentDate.getTime() - order.creationDate.getTime() > 2 * expiryTime)) {
            Transaction.begin();
            OrderMgr.failOrder(order, false);
            Transaction.commit();
        }
    }
}


module.exports = {
    failOrder: failOrder
};
