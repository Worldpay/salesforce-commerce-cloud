'use strict';

var server = require('server');
var Resource = require('dw/web/Resource');

server.post('SettleOrder', function (req, res, next) {
    const { postManagePayment } = require('*/cartridge/scripts/service/paymentQueries');
    const params = req.httpParameterMap;
    const settleHrefUrlPath = params.actionHrefUrlPath.stringValue || '';
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
            errorMessage: Resource.msg('csc.error.settle.use.partial', 'worldpaybm', null)
        });
        next();
        return;
    }

    const settleRequest = postManagePayment({
        paymentHrefPath: settleHrefUrlPath,
        requestBody: null
    });

    if (settleRequest.error) {
        res.render('/csc/error', {
            errorMessage: Resource.msg('csc.error.settle.order', 'worldpaybm', null)
        });
        next();
        return;
    }

    Transaction.wrap(function () {
        order.custom.partialPending = true;
    });

    res.render('/csc/successNotification', {
        message: Resource.msg('csc.success.settle.order', 'worldpaybm', null)
    });
    next();
});

server.post('PartialSettleOrder', function (req, res, next) {
    const {
        postManagePayment
    } = require('*/cartridge/scripts/service/paymentQueries');
    const { checkPartialAmountValue, updatePendingPartialAmount, toMinorUnits } = require('*/cartridge/scripts/helpers/cscHelpers');
    const params = req.httpParameterMap;
    const settledAmountStr = params.settleAmount.stringValue;
    const settleHrefUrlPath = params.actionHrefUrlPath.stringValue || '';
    const orderNo = params.order_no && params.order_no.stringValue;
    const currency = params.currency.stringValue || 'EUR';

    const exponent = 2;
    const settledAmountMinor = toMinorUnits(settledAmountStr, exponent);

    const checkAmountValid = checkPartialAmountValue(orderNo, settledAmountMinor, 'settle');

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
    
    const settleRequest = postManagePayment({
        paymentHrefPath:settleHrefUrlPath, 
        requestBody: {
            "value": {
                "amount": settledAmountMinor,
                "currency": currency
            },
            "reference": "partial-settle-reference-1"
        }
    });

    if (settleRequest.error) {
        res.render('/csc/error', {
            errorMessage: Resource.msg('csc.error.partial.settle.order', 'worldpaybm', null)
        });
        next();
        return;
    }

    // Add the settled amount to pending partial settled amount after successful settlement
    updatePendingPartialAmount(orderNo, settledAmountMinor, 'settle');

    res.render('/csc/successNotification', {
        message: Resource.msg('csc.success.partial.settle.order', 'worldpaybm', null)
    });
    next();
});

module.exports = server.exports();
