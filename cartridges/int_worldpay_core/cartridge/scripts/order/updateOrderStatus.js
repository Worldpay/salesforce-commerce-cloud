/**
 * Demandware Script File
 * This script updates the OrderStatus,ExportStatus, PaymentStatus , ConfirmationStatus in Order
 * Object depending on the changed status notification recieved. It also prepends the status
 * and timestamp to the statusHistory.
 *
 * @input Order : dw.order.Order The order.
 * @input response : Object
 * @input updateStatus : String
 * @input customObjectID :  String
 */

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger');
var Order = require('dw/order/Order');
var utils = require('*/cartridge/scripts/common/utils');
var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
var Transaction = require('dw/system/Transaction');

/**
 * This function updates the fraudsight risk values to the order's custom attributes
 * @param {dw.order.Order} orderObj - the order object.
 * @param {Object} response - the payment response
 */
function updateFraudSightData(orderObj, response) {
    var order = orderObj;
    if (!order.custom.isFraudRiskNotified) {
        if (response.riskScore && response.riskFinalScore) {
            if (response.riskMessage === 'review') {
                order.custom.isFraudSightOrderReview = true;
            }
            order.custom.riskMessage = response.riskMessage;
            order.custom.riskFinalScore = response.riskFinalScore;
            order.custom.riskProvider = response.riskProvider;
        }
        if (response.fraudSightMessage) {
            if (response.fraudSightMessage === 'review') {
                order.custom.isFraudSightOrderReview = true;
            }
            order.custom.fraudSightRiskMessage = response.fraudSightMessage;
            order.custom.fraudSightRiskReason = response.fraudSightReason;
            order.custom.fraudSightRiskScore = response.fraudSightScore;
        }
    }
}

 /**
  * This function calculate and handle the refund functionality
  * Object by calling orderHelper method
  * @param {order} order - Current users's Order
  * @param {Object} responseAmount - responseAmount
  */
function handleRefund(order, responseAmount) {
    var orderObj = order;
    if (!order.custom.refundedInCsc) {
        var partialRefundAmount;
        if (order.custom.wpgPartialRefundAmount) {
            partialRefundAmount = order.custom.wpgPartialRefundAmount;
        } else {
            partialRefundAmount = 0;
        }
        var refundedAmunt = parseFloat(responseAmount / 100);
        var alreadyRefundedAmount = parseFloat(partialRefundAmount);
        var amountRefunded = alreadyRefundedAmount + refundedAmunt;
        Transaction.wrap(function () {
            orderObj.custom.wpgPartialRefundAmount = amountRefunded;
        });
    } else {
        Transaction.wrap(function () {
            orderObj.custom.refundedInCsc = false;
        });
    }
}

/**
 * This script updates the OrderStatus,ExportStatus, PaymentStatus , ConfirmationStatus in Order
 * Object depending on the changed status notification recieved. It also prepends the status
 * and timestamp to the statusHistory.
 * @param {dw.order.Order} orderToBeUpdated - Current users's Order
 * @param {Object} response - Response
 * @param {string} updateStatus - Update Status
 * @param {string} customObjectID - Custom Object ID
 */
function orderHelper(orderToBeUpdated, response, updateStatus, customObjectID) {
    var ArrayList = require('dw/util/ArrayList');
    var OrderMgr = require('dw/order/OrderMgr');
    var notifyCO;
    var customObj = customObjectID;
    var COtimeStamp;
    var order = orderToBeUpdated;
    if (customObj == null) {
        COtimeStamp = new Date();
    } else {
        // Get Custom Object based on passed custom object id.
        notifyCO = CustomObjectMgr.getCustomObject('OrderNotifyUpdates', customObj);
        if (notifyCO != null && notifyCO !== '') {
            COtimeStamp = notifyCO.custom.timeStamp;
        }
    }
    var statusFound = false;
    var statusHist = order.custom.transactionStatus;
    var statusList;
    if (statusHist && statusHist.length < 0) {
        statusList = new ArrayList();
    } else {
        statusList = new ArrayList(statusHist);
        var li = '';
        for (var ind = 0; ind < statusHist.length; ind++) {
            li = statusHist[ind];
            if (li.indexOf(updateStatus) > -1) {
                statusFound = true;
            }
        }
    }
    var responseAmount = response.captureAmount;
    if (responseAmount) {
        var amountInResponse = parseFloat(((responseAmount) / 100));
        var reference = (amountInResponse).toString();
        if (updateStatus.equalsIgnoreCase(worldpayConstants.CAPTURED) && reference) {
            var wpgSettleRefStatusHist = order.custom.wpgSettleReference; // statusHist
            Transaction.wrap(function () {
                order.custom.wpgPartialSettleAmount = amountInResponse;
            });
            var wpgSettleRefStatusList;
            if (wpgSettleRefStatusHist == null) {
                wpgSettleRefStatusList = new ArrayList();
            } else {
                wpgSettleRefStatusList = new ArrayList(wpgSettleRefStatusHist);
            }
            wpgSettleRefStatusList.addAt(0, reference + ':' + COtimeStamp);
            order.custom.wpgSettleReference = wpgSettleRefStatusList;
        }
    }
    updateFraudSightData(order, response);
    if (!statusFound) {
        statusList.addAt(0, updateStatus + ':' + COtimeStamp);
    }
    order.custom.transactionStatus = statusList;
    if (response.accountRangeId) {
        order.custom.accountRangeId = response.accountRangeId;
    }
    if (response.virtualAccountNumber) {
        order.custom.virtualAccountNumber = response.virtualAccountNumber;
    }
    if (response.issuerCountry) {
        order.custom.issuerCountry = response.issuerCountry;
    }
    if (response.affluence) {
        order.custom.affluence = response.affluence;
    }
    if (response.sourceType) {
        order.custom.sourceType = response.sourceType;
    }
    if (response.availableBalance) {
        order.custom.availableBalance = response.availableBalance;
    }
    if (response.prepaidCardType) {
        order.custom.prepaidCardType = response.prepaidCardType;
    }
    if (response.reloadable) {
        order.custom.reloadable = response.reloadable;
    }
    if (response.cardProductType) {
        order.custom.cardProductType = response.cardProductType;
    }
    if (updateStatus) {
        order.custom.WorldpayLastEvent = updateStatus;
    }
    if (response.riskScore) {
        order.custom.riskScore = response.riskScore;
    }
    if (response.authID) {
        order.custom.authID = response.authID;
    }
    if (response.declineCode) {
        order.custom.declineCode = response.declineCode;
    }
    if (response.cardNumber) {
        order.custom.cardNumer = response.cardNumber;
    }
    if (response.cvcResultCode) {
        order.custom.cvcResultCode = response.cvcResultCode;
    }
    if (response.avsResultCode) {
        order.custom.avsResultCode = response.avsResultCode;
    }
    if (response.aaVAddressResultCode) {
        order.custom.aaVAddressResultCode = response.aaVAddressResultCode;
    }
    if (response.aaVPostcodeResultCode) {
        order.custom.aaVPostcodeResultCode = response.aaVPostcodeResultCode;
    }
    if (response.threeDSecureResult) {
        order.custom.issuerResponse = response.threeDSecureResult;
    }
    if (order.custom.issuerResponse && !(response.threeDSecureResult)) {
        order.custom.issuerResponse = null;
    }
    if (order.custom.declineCode && (updateStatus !== worldpayConstants.AUTHORIZED)) {
        order.custom.declineCode = null;
    }
    if (updateStatus.equals(worldpayConstants.AUTHORIZED) && order.getStatus().valueOf() === Order.ORDER_STATUS_CANCELLED) {
        OrderMgr.undoCancelOrder(order);
        order.setExportStatus(Order.EXPORT_STATUS_READY);
        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
        Logger.getLogger('worldpay').debug('Update Order Status for Order: ' + order.orderNo + ' is ' + updateStatus);
    } else if (updateStatus.equals(worldpayConstants.REFUSED)) {
        // No Change
    } else if (updateStatus.equals(worldpayConstants.CANCELLEDSTATUS)) {
        if (order.getStatus().valueOf() === Order.ORDER_STATUS_NEW || order.getStatus().valueOf() === Order.ORDER_STATUS_OPEN) {
            OrderMgr.cancelOrder(order);
            Logger.getLogger('worldpay').debug('Update Order Status ' + updateStatus + ' Order: ' + order.orderNo + ' cancelled after New/ Open status.');
        } else if (order.getStatus().valueOf() === Order.ORDER_STATUS_CREATED) {
            OrderMgr.failOrder(order);
            Logger.getLogger('worldpay').debug('Update Order Status ' + updateStatus + ' Order: ' + order.orderNo + ' failed after created status.');
        }
        order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
        order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
    } else if (updateStatus.equals(worldpayConstants.CAPTURED)) {
        order.setStatus(Order.ORDER_STATUS_COMPLETED);
        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
        Logger.getLogger('worldpay').debug('Update Order Status ' + updateStatus + ' Order: ' + order.orderNo + ' Payment status is paid.');
    } else if (updateStatus.equals(worldpayConstants.SENT_FOR_REFUND)) {
        handleRefund(order, responseAmount);
    } else if (updateStatus.equals(worldpayConstants.SETTLED)) {
        // No Change
    } else if (updateStatus.equals(worldpayConstants.INFORMATION_REQUESTED)) {
        // No Change
    } else if (updateStatus.equals(worldpayConstants.CHARGED_BACK)) {
        // No Change
    } else if (updateStatus.equals(worldpayConstants.EXPIRED)) {
        if (order.getStatus().valueOf() === Order.ORDER_STATUS_NEW || order.getStatus().valueOf() === Order.ORDER_STATUS_OPEN) {
            OrderMgr.cancelOrder(order);
            order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
            order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
            Logger.getLogger('worldpay').debug('Update Order Status ' + updateStatus + ' Order: ' + order.orderNo + ' not comfirmed');
        }
    } else {
        // No Change
    }
}

/**
 * This script updates the OrderStatus,ExportStatus, PaymentStatus , ConfirmationStatus in Order
 * Object by calling orderHelper method
 * @param {dw.order.Order} orderToBeUpdated - Current users's Order
 * @param {Object} response - Response
 * @param {string} updateStatus - Update Status
 * @param {string} customObjectID - Custom Object ID
 * @return {Object} returns an object
 */
function updateOrderStatus(orderToBeUpdated, response, updateStatus, customObjectID) {
    var returnVal;
    Transaction.wrap(function () {
        var order = orderToBeUpdated;
        try {
            orderHelper(orderToBeUpdated, response, updateStatus, customObjectID);
            returnVal = {
                success: true
            };
        } catch (e) {
            var errorCode = worldpayConstants.NOTIFYERRORCODE116;
            var errorMessage = utils.getErrorMessage(errorCode);
            Logger.getLogger('worldpay').error(
                'Order Notification : Update Order : ' + order.orderNo + ' : ' + errorCode + ' : ' + errorMessage + e);
            returnVal = {
                success: false
            };
        }
    });
    return returnVal;
}

module.exports = {
    updateOrderStatus: updateOrderStatus
};
