'use strict';
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var PaymentMgr = require('dw/order/PaymentMgr');
var serviceFacade = require('*/cartridge/scripts/service/serviceFacade');
var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
/**
* Helper function for partial settling order
* @param {string} orderID - order number
* @param {integer} settleAmount - settleAmount
* @param {integer} partialSettleAmount - partialSettleAmount
* @param {string} currency - currency
* @param {string} trackingID - trackingID
* @return {Object} returns an result object
*/
function partialCapture(orderID, settleAmount, partialSettleAmount, currency, trackingID) {
    var result;
    result = serviceFacade.cscPartialCapture(orderID, settleAmount, partialSettleAmount, currency, trackingID);
    var order = OrderMgr.getOrder(orderID);
    if (result.success) {
        Transaction.wrap(function () {
            order.custom.wpgPartialSettleAmount = (partialSettleAmount + settleAmount) / 100;
            order.custom.WorldpayLastEvent = worldpayConstants.PARTIAL;
        });
    }
    return result;
}

/**
* Helper function for partial settling order
* @param {string} orderID - order number
* @param {integer} settleAmount - settleAmount
* @param {integer} partialRefundAmount - partialRefundAmount
* @param {string} currency - currency
* @return {Object} returns an result object
*/
function partialRefund(orderID, settleAmount, partialRefundAmount, currency) {
    var result;
    result = serviceFacade.cscPartialRefund(orderID, settleAmount, currency);
    var order = OrderMgr.getOrder(orderID);
    if (result.success) {
        Transaction.wrap(function () {
            order.custom.wpgPartialRefundAmount = (partialRefundAmount + settleAmount) / 100;
            order.custom.WorldpayLastEvent = worldpayConstants.REFUND;
        });
    }
    return result;
}

/**
* Helper function for Cancelling order
* @param {string} orderNumber - order number
* @return {Object} returns an result object
*/
function cancelOrder(orderNumber) {
    var result;
    result = serviceFacade.cscCancel(orderNumber);
    var order = OrderMgr.getOrder(orderNumber);
    if (result.success) {
        Transaction.wrap(function () {
            order.custom.WorldpayLastEvent = 'cancelled';
        });
    }

    return result;
}

/**
* Helper function for void sale request
* @param {string} orderNumber - order number
* @return {Object} returns an result object
*/
function voidSale(orderNumber) {
    var result;
    var apmName;
    var paymentMthd;
    var order = OrderMgr.getOrder(orderNumber);
    if (!order) {
        var Logger = require('dw/system/Logger');
        Logger.getLogger('worldpay').error('authorize : Invalid Order');
        return result;
    }
    var pi;
    var paymentInstruments = order.getPaymentInstruments();
    if (paymentInstruments.length > 0) {
        for (var i = 0; i < paymentInstruments.length; i++) {
            pi = paymentInstruments[i];
            var payProcessor = PaymentMgr.getPaymentMethod(pi.getPaymentMethod()).getPaymentProcessor();
            if (payProcessor != null && payProcessor.getID().equalsIgnoreCase(worldpayConstants.WORLDPAY)) {
                    // update payment instrument with transaction basic attributes
                apmName = pi.getPaymentMethod();
                paymentMthd = PaymentMgr.getPaymentMethod(apmName);
                break;
            }
        }
    }
    result = serviceFacade.voidSaleService(order, paymentMthd);
    if (order.custom.WorldpayLastEvent && result.response.lastEvent === worldpayConstants.VOIDED) {
        Transaction.wrap(function () {
            order.custom.WorldpayLastEvent = worldpayConstants.VOIDED;
        });
    }
    return result;
}
/**
* Helper function for finding the hour difference between order creation time and current time
* @param {string} orderNumber - order number
* @return {Object} returns an hourDifference object
*/
function getHourDifference(orderNumber) {
    var orderCreationDate = OrderMgr.getOrder(orderNumber).creationDate;
    var orderCreationHour = new Date(orderCreationDate).getTime();
    var currentHour = new Date().getTime();
    var hourDifference = (currentHour - orderCreationHour) / 1000;
    hourDifference /= (60 * 60);
    return hourDifference;
}
/**
 * provide a partial capture only for few payment method.
 * @param{string} paymentMethod - selected payment payment
 *  @return {boolean} returns an boolean
 */
function partialCaptureAllowedMethods(paymentMethod) {
    switch (paymentMethod) {
        case 'CREDIT_CARD':
        case 'KLARNA_PAYNOW-SSL':
        case 'KLARNA_SLICEIT-SSL':
        case 'KLARNA_PAYLATER-SSL':
        case 'Worldpay':
        case 'PAYPAL-EXPRESS':
        case 'PAYWITHGOOGLE-SSL':
        case 'DW_APPLE_PAY':
            return true;
        default:
            return false;
    }
}
module.exports = {
    voidSale: voidSale,
    getHourDifference: getHourDifference,
    partialCapture: partialCapture,
    partialRefund: partialRefund,
    cancelOrder: cancelOrder,
    partialCaptureAllowedMethods: partialCaptureAllowedMethods
};
