'use strict';

var server = require('server');
var params = request.httpParameterMap;
var Order = require('dw/order/Order');

server.get('VoidSale', function (req, res, next) {
    var orderID = params.order_no.stringValue;
    var OrderMgr = require('dw/order/OrderMgr');
    var OrderHelpers = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper.js');
    var hourDifference = OrderHelpers.getHourDifference(orderID);
    var order = OrderMgr.getOrder(orderID);
    res.render('/order/voidSale', {
        order: order,
        requestType: '',
        hourDifference: hourDifference,
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
    });
    next();
});

server.get('VoidSaleAction', function (req, res, next) {
    var orderID = params.order_id.stringValue;
    var success = true;
    var OrderMgr = require('dw/order/OrderMgr');
    var OrderHelpers = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper.js');
    var order = OrderMgr.getOrder(orderID);
    var result = OrderHelpers.voidSale(orderID);
    if (!result || result.error) {
        success = false;
    }
    res.render('/order/voidSale', {
        order: order,
        requestType: 'response',
        success: success,
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
    });
    next();
});

server.get('Refund', function (req, res, next) {
    let orderID = params.order_no.stringValue;
    let OrderMgr = require('dw/order/OrderMgr');
    let order = OrderMgr.getOrder(orderID);
    let utils = require('*/cartridge/scripts/common/utils');
    let totalprice = utils.calculateNonGiftCertificateAmount(order);
    let amount = totalprice.getValue();
    var paymentMethod = order.paymentInstrument.getPaymentMethod();
    var OrderHelpers = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper');
    var isRefundAllowed = OrderHelpers.isRefundAllowed(paymentMethod);
    var productLineItems = order.getAllProductLineItems();
    var iterator = productLineItems.iterator();
    var refundLineItemUUID = order.custom.wpgRefundLineItems;
    var capturedLineItemUUID = order.custom.wpgCapturedLineItems;
    var ArrayList = require('dw/util/ArrayList');
    var availableLineItems = new ArrayList();
    while (iterator.hasNext()) {
        var temp = iterator.next();
        if (capturedLineItemUUID.includes(temp.UUID) && !refundLineItemUUID.includes(temp.UUID)) {
            availableLineItems.push(temp);
        }
    }
    var shippingTax = order.getAdjustedShippingTotalTax().getValue();
    var shippingTotal = order.getAdjustedShippingTotalPrice().getValue();
    var shipmentlength = order.shipments.length;
    var shipments = order.getShipments();
    res.render('/order/refundOrder', {
        order: order,
        amount: amount,
        requestType: '',
        paymentMethod: paymentMethod,
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED,
        isRefundAllowed: isRefundAllowed,
        productLineItems: availableLineItems,
        shippingTax: shippingTax,
        shippingTotal: shippingTotal,
        shipmentlength: shipmentlength,
        shipments: shipments
    });
    next();
});

/**
 * Process Refund Action
 * @param {Object} partialRefundAmount Partial Refund Amount
 * @param {Object} currency - Currency type
 * @param {Object} orderID - order details
 * @param {Object} order - current order object
 * @param {Object} amount - total refund amount
 * @param {Object} selectedLineItems - items selected for partial refund
 * @return {Object} returns result
 */
function processRefundAction(partialRefundAmount, currency, orderID, order, amount, selectedLineItems) {
    var Transaction = require('dw/system/Transaction');
    var ArrayList = require('dw/util/ArrayList');
    var OrderHelpers = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper');
    var refundLineItemUUID = new ArrayList(order.custom.wpgRefundLineItems);
    var settleamount = 0;
    var uuid;
    var result;
    var amounts = amount;
    var shipmentNo = [];
    var orders = order;
    var duplicateLineItemCapture = false;
    for (var i = 0; i < selectedLineItems.length; i++) {
        var LineItemPrice = selectedLineItems[i].grossPrice.value;
        uuid = selectedLineItems[i].UUID;
        var shippingPrice = selectedLineItems[i].shipment.shippingTotalGrossPrice / selectedLineItems[i].shipment.productLineItems.size();
        settleamount += LineItemPrice + shippingPrice;
        shipmentNo.push(selectedLineItems[i].shipment.shipmentNo);
        if (refundLineItemUUID.indexOf(uuid) < 0) {
            refundLineItemUUID.push(uuid);
        } else {
            duplicateLineItemCapture = true;
        }
    }
    settleamount = parseInt((settleamount * (Math.pow(10, 2))).toFixed(0), 10);
    if (orders.custom.WorldpayLastEvent === 'CAPTURED') {
        if (settleamount <= amounts && (settleamount + partialRefundAmount) <= amounts && !duplicateLineItemCapture) {
            result = OrderHelpers.partialRefund(orderID, settleamount, partialRefundAmount, currency, shipmentNo);
        }
    } else {
        amounts = orders.custom.wpgPartialSettleAmount;
        amounts = parseInt((amounts * (Math.pow(10, 2))).toFixed(0), 10);
        if (settleamount <= amounts && (settleamount + partialRefundAmount) <= amounts && !duplicateLineItemCapture) {
            result = OrderHelpers.partialRefund(orderID, settleamount, partialRefundAmount, currency, shipmentNo);
            Transaction.wrap(function () {
                orders.custom.wpgRefundLineItems = refundLineItemUUID;
            });
        }
    }
    return result;
}

/**
 * Process Refund Action
 * @param {Object} orderObj - current order object
 * @param {Object} selectedLineItems - selected items for partial capture
 * @param {Object} amount - total capture amount
 * @param {Object} currency - Currency type
 * @param {Object} orderID - order details
 * @param {Object} partialSettleAmount Partial Refund Amount
 * @param {Object} trackingID - Tracking ID for capture
 * @returns {Object} - Success or Error object
 */
function processPartialSettleOrder(orderObj, selectedLineItems, amount, currency, orderID, partialSettleAmount, trackingID) {
    var Transaction = require('dw/system/Transaction');
    var ArrayList = require('dw/util/ArrayList');
    var OrderHelpers = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper');
    var order = orderObj;
    var capturedLineItemUUID = new ArrayList(order.custom.wpgCapturedLineItems);
    var uuid;
    var result;
    var success = true;
    var settledamount = 0;
    var duplicateLineItemCapture = false;
    var shipmentNo = [];
    for (var i = 0; i < selectedLineItems.length; i++) {
        var LineItemPrice = selectedLineItems[i].grossPrice.value;
        uuid = selectedLineItems[i].UUID;
        var shippingPrice = selectedLineItems[i].shipment.shippingTotalGrossPrice / selectedLineItems[i].shipment.productLineItems.size();
        settledamount += LineItemPrice + shippingPrice;
        shipmentNo.push(selectedLineItems[i].shipment.shipmentNo);
        if (capturedLineItemUUID.indexOf(uuid) < 0) {
            capturedLineItemUUID.push(uuid);
        } else {
            duplicateLineItemCapture = true;
        }
    }
    settledamount = parseInt((settledamount * (Math.pow(10, 2))).toFixed(0), 10);
    if (settledamount <= amount && (settledamount + partialSettleAmount) <= amount && !duplicateLineItemCapture) {
        result = OrderHelpers.partialCapture(orderID, settledamount, partialSettleAmount, currency, trackingID, shipmentNo);
    } else {
        success = false;
    }
    Transaction.wrap(function () {
        order.custom.wpgCapturedLineItems = capturedLineItemUUID;
    });
    return {
        result: result,
        success: success
    };
}

// eslint-disable-next-line require-jsdoc
function getRefundAction(productLineItems, request, selectedLineItems) {
    var selectedLineItemUUID = request.selectedLineItems.getStringValue().split(',');

    var iterator = productLineItems.iterator();
    while (iterator.hasNext()) {
        var temp = iterator.next();
        if (selectedLineItemUUID.includes(temp.UUID)) {
            selectedLineItems.push(temp);
        }
    }
}

/**
 * Process Partial Refund Action
 * @param {Object} settleamount - Amount already settled
 * @param {Object} amount - Total order amount
 * @param {Object} partialRefundAmount - refund amount
 * @param {Object} currency - Currency
 * @param {Object} orderID - Order ID
 * @returns {Object} - Success or Error object
 */
function processPartialRefundAction(settleamount, amount, partialRefundAmount, currency, orderID) {
    var OrderHelpers = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper');
    if (settleamount <= amount && (settleamount + partialRefundAmount) <= amount) {
        return OrderHelpers.partialRefund(orderID, settleamount, partialRefundAmount, currency);
    }
    return {
        success: false,
        invalidRefundAmount: true
    };
}
server.get('RefundAction', function (req, res, next) {
    var orderID = params.order_id.stringValue;
    var settleamount = params.settleAmount.rawValue;
    var success = true;
    var invalidRefundAmount = false;
    var OrderMgr = require('dw/order/OrderMgr');
    var OrderHelpers = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper');
    var order = OrderMgr.getOrder(orderID);
    var paymentMethod = order.paymentInstrument.getPaymentMethod();
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var isRefundAllowed = OrderHelpers.isRefundAllowed(paymentMethod);
    var partialRefundAmount;
    var shipment = order.shipments;
    var productLineItems = order.getAllProductLineItems();
    var duplicateLineItemCapture = false;
    var request = params;
    if (order.custom.wpgPartialRefundAmount) {
        partialRefundAmount = order.custom.wpgPartialRefundAmount;
    } else {
        partialRefundAmount = 0;
    }
    var utils = require('*/cartridge/scripts/common/utils');
    var totalprice = utils.calculateNonGiftCertificateAmount(order);
    var amount = totalprice.getValue();
    // multiplying amount with currentExponent (2) power of 10 since downstream systems have currency exponent of 2
    amount = parseInt((amount.toFixed(2) * (Math.pow(10, 2))).toFixed(0), 10);
    switch (paymentMethod) {
        case worldpayConstants.KLARNASLICEIT:
        case worldpayConstants.KLARNAPAYLATER:
        case worldpayConstants.KLARNAPAYNOW:
        case worldpayConstants.KLARNA:
            settleamount = amount;
            break;
        default:
            settleamount = parseInt((settleamount * (Math.pow(10, 2))).toFixed(0), 10);
            break;
    }
    partialRefundAmount = parseInt((partialRefundAmount * (Math.pow(10, 2))).toFixed(0), 10);
    var currency = totalprice.getCurrencyCode().toString();
    var result;
    if (shipment.length > 1) {
        var selectedLineItems = [];
        getRefundAction(productLineItems, request, selectedLineItems);
        result = processRefundAction(partialRefundAmount, currency, orderID, order, amount, selectedLineItems);
    } else if (order.custom.WorldpayLastEvent === 'CAPTURED') {
        result = processPartialRefundAction(settleamount, amount, partialRefundAmount, currency, orderID);
        if (result.success === false) {
            success = false;
            invalidRefundAmount = true;
        }
    } else {
        amount = order.custom.wpgPartialSettleAmount;
        amount = parseInt((amount * (Math.pow(10, 2))).toFixed(0), 10);
        if (settleamount <= amount && (settleamount + partialRefundAmount) <= amount) {
            result = OrderHelpers.partialRefund(orderID, settleamount, partialRefundAmount, currency);
        } else {
            success = false;
            invalidRefundAmount = true;
        }
    }
    if (!result || result.error) {
        success = false;
    }
    res.render('/order/refundOrder', {
        order: order,
        requestType: 'response',
        success: success,
        invalidRefundAmount: invalidRefundAmount,
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED,
        isRefundAllowed: isRefundAllowed,
        paymentMethod: paymentMethod,
        duplicateLineItemCapture: duplicateLineItemCapture
    });
    next();
});


server.get('CancelOrder', function (req, res, next) {
    var orderID = params.order_no.stringValue;
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderID);

    res.render('/order/cancelOrder', {
        order: order,
        requestType: '',
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
    });
    next();
});

server.get('CancelOrderAction', function (req, res, next) {
    var orderID = params.order_id.stringValue;
    var success = true;
    var OrderMgr = require('dw/order/OrderMgr');
    var OrderHelpers = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper');
    var order = OrderMgr.getOrder(orderID);
    var result = OrderHelpers.cancelOrder(orderID);
    if (!result || result.error) {
        success = false;
    }
    res.render('/order/cancelOrder', {
        order: order,
        requestType: 'response',
        success: success,
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
    });
    next();
});

server.get('PartialCaptureOrder', function (req, res, next) {
    var orderID = params.order_no.stringValue;
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderID);
    var utils = require('*/cartridge/scripts/common/utils');
    var totalprice = utils.calculateNonGiftCertificateAmount(order);
    var amount = totalprice.getValue();
    var OrderHelpers = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper');
    var paymentMethod = order.paymentInstrument.getPaymentMethod();
    var isPartialCaptureAllowed = OrderHelpers.partialCaptureAllowedMethods(paymentMethod);
    var isCaptureAllowed = OrderHelpers.isCaptureAllowed(paymentMethod);
    var productLineItems = order.getAllProductLineItems();
    var iterator = productLineItems.iterator();
    var capturedLineItemUUID = order.custom.wpgCapturedLineItems;
    var ArrayList = require('dw/util/ArrayList');
    var availableLineItems = new ArrayList();
    while (iterator.hasNext()) {
        var temp = iterator.next();
        if (!capturedLineItemUUID.includes(temp.UUID)) {
            availableLineItems.push(temp);
        }
    }
    var shippingTax = order.getAdjustedShippingTotalTax().getValue();
    var shippingTotal = order.getAdjustedShippingTotalPrice().getValue();
    var shipmentlength = order.shipments.length;
    var shipments = order.getShipments();
    res.render('/order/partialSettleOrder', {
        order: order,
        amount: amount,
        requestType: '',
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED,
        isPartialCaptureAllowed: isPartialCaptureAllowed,
        paymentMethod: paymentMethod,
        isCaptureAllowed: isCaptureAllowed,
        productLineItems: availableLineItems,
        shippingTax: shippingTax,
        shippingTotal: shippingTotal,
        shipmentlength: shipmentlength,
        shipments: shipments
    });
    next();
});

server.get('PartialSettleOrderAction', function (req, res, next) {
    var orderID = params.order_id.stringValue;
    var settleamount = params.settleAmount.rawValue;
    var request = params;
    var trackingID = params.trackingID.rawValue;
    var success = true;
    var invalidCaptureAmount = false;
    var OrderMgr = require('dw/order/OrderMgr');
    var OrderHelpers = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper');
    var order = OrderMgr.getOrder(orderID);
    var shipment = order.shipments;
    var productLineItems = order.getAllProductLineItems();
    var partialSettleAmount;
    var result;
    var paymentMethod = order.paymentInstrument.getPaymentMethod();
    var isPartialCaptureAllowed = OrderHelpers.partialCaptureAllowedMethods(paymentMethod);
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var isCaptureAllowed = OrderHelpers.isCaptureAllowed(paymentMethod);
    var utils = require('*/cartridge/scripts/common/utils');
    var totalprice = utils.calculateNonGiftCertificateAmount(order);
    var amount = totalprice.getValue();
    var currency = totalprice.getCurrencyCode().toString();
    var duplicateLineItemCapture = false;
    if (order.custom.wpgPartialSettleAmount) {
        partialSettleAmount = order.custom.wpgPartialSettleAmount;
    } else {
        partialSettleAmount = 0;
    }
    if ((paymentMethod === worldpayConstants.KLARNA || paymentMethod === worldpayConstants.KLARNASLICEIT || paymentMethod === worldpayConstants.KLARNAPAYLATER || paymentMethod === worldpayConstants.KLARNAPAYNOW)) {
        settleamount = amount;
    }
    if (isPartialCaptureAllowed) {
        settleamount = parseInt((settleamount * (Math.pow(10, 2))).toFixed(0), 10);
    } else {
        settleamount = parseInt((amount.toFixed(2) * (Math.pow(10, 2))).toFixed(0), 10);
    }
    // multiplying amount with currentExponent (2) power of 10 since downstream systems have currency exponent of 2
    amount = parseInt((amount.toFixed(2) * (Math.pow(10, 2))).toFixed(0), 10);
    partialSettleAmount = parseInt((partialSettleAmount * (Math.pow(10, 2))).toFixed(0), 10);
    if (shipment.length > 1) {
        var selectedLineItems = [];
        getRefundAction(productLineItems, request, selectedLineItems);
        result = processPartialSettleOrder(order, selectedLineItems, amount, currency, orderID, partialSettleAmount, trackingID);
    } else if (settleamount <= amount && (settleamount + partialSettleAmount) <= amount) {
        result = OrderHelpers.partialCapture(orderID, settleamount, partialSettleAmount, currency, trackingID);
    } else {
        success = false;
        invalidCaptureAmount = true;
    }
    if (!result || result.error) {
        success = false;
    }
    res.render('/order/partialSettleOrder', {
        order: order,
        requestType: 'response',
        success: success,
        invalidCaptureAmount: invalidCaptureAmount,
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED,
        isPartialCaptureAllowed: isPartialCaptureAllowed,
        trackingID: trackingID,
        paymentMethod: paymentMethod,
        isCaptureAllowed: isCaptureAllowed,
        duplicateLineItemCapture: duplicateLineItemCapture
    });
    next();
});

module.exports = server.exports();
