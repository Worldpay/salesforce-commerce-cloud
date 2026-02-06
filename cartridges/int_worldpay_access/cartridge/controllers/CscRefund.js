'use strict';

var server = require('server');
var Resource = require('dw/web/Resource');

server.post('PartialRefundOrder', function (req, res, next) {
    const {
        postManagePayment
    } = require('*/cartridge/scripts/service/paymentQueries');
    const { checkPartialAmountValue, updatePendingPartialAmount, toMinorUnits } = require('*/cartridge/scripts/helpers/cscHelpers');
    const params = req.httpParameterMap;
    const refundAmountStr = params.refundAmount.stringValue;
    const refundHrefUrlPath = params.actionHrefUrlPath.stringValue || '';
    const currency = params.currency.stringValue || 'EUR';
    const orderNo = params.order_no && params.order_no.stringValue;

    const exponent = 2;
    const refundAmountMinor = toMinorUnits(refundAmountStr, exponent);

    const checkAmountValid = checkPartialAmountValue(orderNo, refundAmountMinor, 'refund');

    if (!checkAmountValid) {
        res.render('/csc/error', {
            errorMessage: Resource.msg('csc.error.partial.settle.invalid', 'worldpaybm', null)
        });
        next();
        return;
    }

    const OrderMgr = require('dw/order/OrderMgr');
    const order = OrderMgr.getOrder(orderNo);

    if (order && order.custom.partialPending) {
        res.render('/csc/error', {
            errorMessage: Resource.msg('csc.error.partial.pending', 'worldpaybm', null)
        });
        next();
        return;
    }

    const refundRequest = postManagePayment({
        paymentHrefPath:refundHrefUrlPath, 
        requestBody: {
            "value": {
                "amount": refundAmountMinor,
                "currency": currency
            },
            "reference": "partial-refund-reference-1"
        }
    });

    if (refundRequest.error) {
        res.render('/csc/error', {
            errorMessage: Resource.msg('csc.error.partial.refund.order', 'worldpaybm', null)
        });
        next();
        return;
    }

    // Add the refunded amount to pending partial refunded amount after successful refund
    updatePendingPartialAmount(orderNo, refundAmountMinor, 'refund');

    res.render('/csc/successNotification', {
        message: Resource.msg('csc.success.partial.refund.order', 'worldpaybm', null)
    });
    next();
});


server.post('RefundOrder', function (req, res, next) {
    const { postManagePayment } = require('*/cartridge/scripts/service/paymentQueries');
    const params = req.httpParameterMap;
    const refundHrefUrlPath = params.actionHrefUrlPath.stringValue || '';
    const orderNo = params.order_no && params.order_no.stringValue;

    const OrderMgr = require('dw/order/OrderMgr');
    const Transaction = require('dw/system/Transaction');
    const order = OrderMgr.getOrder(orderNo);

    if (!order) {
        res.render('/csc/error', {
            errorMessage: Resource.msg('csc.error.order.notfound', 'worldpaybm', null)
        });
        next();
        return;
    }

    if (order.custom.partialPending) {
        res.render('/csc/error', {
            errorMessage: Resource.msg('csc.error.partial.pending', 'worldpaybm', null)
        });
        next();
        return;
    }

    const partialSettled = Number(order.custom.pendingPartialSettledAmount) || 0;
    const partialRefunded = Number(order.custom.pendingPartialRefundedAmount) || 0;

    if (partialSettled > 0 || partialRefunded > 0) {
        res.render('/csc/error', {
            errorMessage: Resource.msg('csc.error.refund.use.partial', 'worldpaybm', null)
        });
        next();
        return;
    }

    const refundRequest = postManagePayment({ paymentHrefPath: refundHrefUrlPath, requestBody: null });

    if (refundRequest.error) {
        res.render('/csc/error', {
            errorMessage: Resource.msg('csc.error.refund.order', 'worldpaybm', null)
        });
        next();
        return;
    }

    Transaction.wrap(function () {
        order.custom.partialPending = true;
    });

    res.render('/csc/successNotification', {
        message: Resource.msg('csc.success.refund.order', 'worldpaybm', null)
    });
    next();
});

module.exports = server.exports();
