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
    var orderID = params.order_no.stringValue;
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderID);
    var utils = require('*/cartridge/scripts/common/utils');
    var totalprice = utils.calculateNonGiftCertificateAmount(order);
    var amount = totalprice.getValue();
    var paymentMethod = order.paymentInstrument.getPaymentMethod();
    res.render('/order/refundOrder', {
        order: order,
        amount: amount,
        requestType: '',
        paymentMethod: paymentMethod,
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
    });
    next();
});

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
    var partialRefundAmount;
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
    if ((paymentMethod === worldpayConstants.KLARNASLICEIT || paymentMethod === worldpayConstants.KLARNAPAYLATER || paymentMethod === worldpayConstants.KLARNAPAYNOW)) {
        settleamount = amount;
    } else {
        settleamount = parseInt((settleamount * (Math.pow(10, 2))).toFixed(0), 10);
    }
    partialRefundAmount = parseInt((partialRefundAmount * (Math.pow(10, 2))).toFixed(0), 10);
    var currency = totalprice.getCurrencyCode().toString();
    var result;
    if (order.custom.WorldpayLastEvent === 'CAPTURED') {
        if (settleamount <= amount && (settleamount + partialRefundAmount) <= amount) {
            result = OrderHelpers.partialRefund(orderID, settleamount, partialRefundAmount, currency);
        } else {
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
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED
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
    res.render('/order/partialSettleOrder', {
        order: order,
        amount: amount,
        requestType: '',
        statusConfirmed: Order.CONFIRMATION_STATUS_CONFIRMED,
        isPartialCaptureAllowed: isPartialCaptureAllowed,
        paymentMethod: paymentMethod
    });
    next();
});

server.get('PartialSettleOrderAction', function (req, res, next) {
    var orderID = params.order_id.stringValue;
    var settleamount = params.settleAmount.rawValue;
    var trackingID = params.trackingID.rawValue;
    var success = true;
    var invalidCaptureAmount = false;
    var OrderMgr = require('dw/order/OrderMgr');
    var OrderHelpers = require('*/cartridge/scripts/helpers/worldpayCscOrderHelper');
    var order = OrderMgr.getOrder(orderID);
    var partialSettleAmount;
    var paymentMethod = order.paymentInstrument.getPaymentMethod();
    var isPartialCaptureAllowed = OrderHelpers.partialCaptureAllowedMethods(paymentMethod);
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    if (order.custom.wpgPartialSettleAmount) {
        partialSettleAmount = order.custom.wpgPartialSettleAmount;
    } else {
        partialSettleAmount = 0;
    }
    var utils = require('*/cartridge/scripts/common/utils');
    var totalprice = utils.calculateNonGiftCertificateAmount(order);
    var amount = totalprice.getValue();
    if ((paymentMethod === worldpayConstants.KLARNASLICEIT || paymentMethod === worldpayConstants.KLARNAPAYLATER || paymentMethod === worldpayConstants.KLARNAPAYNOW)) {
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
    var currency = totalprice.getCurrencyCode().toString();
    var result;
    if (settleamount <= amount && (settleamount + partialSettleAmount) <= amount) {
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
        paymentMethod: paymentMethod
    });
    next();
});

module.exports = server.exports();
