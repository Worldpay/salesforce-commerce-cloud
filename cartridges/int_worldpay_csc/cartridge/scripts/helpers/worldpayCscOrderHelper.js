'use strict';
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var serviceFacade = require('*/cartridge/scripts/service/serviceFacade');
var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
/**
* Helper function for partial settling order
* @param {string} orderID - order number
* @param {integer} settleAmount - settleAmount
* @param {integer} partialSettleAmount - partialSettleAmount
* @param {string} currency - currency
* @param {string} trackingID - trackingID
* @param {string} shipmentNo - shipmentNo
* @return {Object} returns an result object
*/
function partialCapture(orderID, settleAmount, partialSettleAmount, currency, trackingID, shipmentNo) {
    var result;
    result = serviceFacade.cscPartialCapture(orderID, settleAmount, partialSettleAmount, currency, trackingID, shipmentNo);
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
* @param {string} shipmentNo - shipmentNo
* @return {Object} returns an result object
*/
function partialRefund(orderID, settleAmount, partialRefundAmount, currency, shipmentNo) {
    var result;
    result = serviceFacade.cscPartialRefund(orderID, settleAmount, currency, shipmentNo);
    var order = OrderMgr.getOrder(orderID);
    if (result.success) {
        Transaction.wrap(function () {
            order.custom.wpgPartialRefundAmount = (partialRefundAmount + settleAmount) / 100;
            order.custom.WorldpayLastEvent = worldpayConstants.REFUND;
            order.custom.refundedInCsc = true;
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
    var checkoutHelper = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var result;
    var order = OrderMgr.getOrder(orderNumber);
    if (!order) {
        var Logger = require('dw/system/Logger');
        Logger.getLogger('worldpay').error('authorize : Invalid Order');
        return result;
    }
    var piObject = checkoutHelper.getPaypaymentInstruments(order);
    result = serviceFacade.voidSaleService(order, piObject.paymentMthd);
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
        case 'PAYPAL-SSL':
        case 'PAYWITHGOOGLE-SSL':
        case 'DW_APPLE_PAY':
            return true;
        default:
            return false;
    }
}
/**
 * return true if payment method doesnot support partial capture.
 * @param{string} paymentMethod - selected payment payment
 *  @return {boolean} returns an boolean
 */
function isCaptureAllowed(paymentMethod) {
    switch (paymentMethod) {
        case 'ALIPAYMOBILE-SSL':
        case 'ALIPAY-SSL':
        case 'ACH_DIRECT_DEBIT-SSL':
        case 'SEPA_DIRECT_DEBIT-SSL':
            return false;
        default:
            return true;
    }
}
/**
 * return true if payment method doesnot support refund.
 * @param{string} paymentMethod - selected payment payment
 *  @return {boolean} returns an boolean
 */
function isRefundAllowed(paymentMethod) {
    switch (paymentMethod) {
        case 'KONBINI-SSL':
        case 'MISTERCASH-SSL':
            return false;
        default:
            return true;
    }
}


module.exports = {
    voidSale: voidSale,
    getHourDifference: getHourDifference,
    partialCapture: partialCapture,
    partialRefund: partialRefund,
    cancelOrder: cancelOrder,
    partialCaptureAllowedMethods: partialCaptureAllowedMethods,
    isCaptureAllowed: isCaptureAllowed,
    isRefundAllowed: isRefundAllowed
};
