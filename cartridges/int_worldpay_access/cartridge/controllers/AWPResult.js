/* eslint-disable no-underscore-dangle */

'use strict';

const server = require('server');
const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');
const Resource = require('dw/web/Resource');
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');

const facade = require('*/cartridge/scripts/service/serviceFacade');


/**
 * Extracts the Worldpay payment status from the given details object.
 * @param {Object} det - The details object containing payment information.
 * @returns {string|null} The extracted payment status or null if not found.
 */
function extractWPStatus(det) {
    if (!det) return null;

    const outcomeStatus = det.outcome && (det.outcome.paymentStatus || det.outcome.status);
    if (outcomeStatus) return String(outcomeStatus).toUpperCase();

    const flat = det.paymentStatus || det.status;
    if (flat) return String(flat).toUpperCase();

    const mapEvent = (ev) => {
        if (!ev) return null;
        const s = String(ev).toLowerCase();
        if (s === 'authorizationsucceeded') return 'AUTHORIZED';
        if (s === 'authorizationcompleted') return 'AUTHORIZED';
        if (s === 'settlementrequested') return 'CAPTURE_REQUESTED';
        if (s === 'settlementrequestsubmitted') return 'CAPTURE_REQUESTED';
        if (s === 'settlementapproved') return 'CAPTURED';
        if (s === 'settlementprocessed') return 'SETTLED';
        return null;
    };

    const mappedFromLast = mapEvent(det.lastEvent);
    if (mappedFromLast) return mappedFromLast;

    if (Array.isArray(det.events) && det.events.length) {
        let score = 0;
        let best = null;

        const WEIGHT = { AUTHORIZED: 1, CAPTURE_REQUESTED: 2, CAPTURED: 3, SETTLED: 3 };

        for (let i = 0; i < det.events.length; i++) {
            const name = det.events[i] && det.events[i].eventName;
            const ev = mapEvent(name);
            if (ev) {
                const sc = WEIGHT[ev] || 0;
                if (sc > score) {
                    score = sc;
                    best = ev;
                    if (sc === 3) break;
                }
            }
        }

        if (best) return best;
    }

    if (det.issuer && det.issuer.authorizationCode) return 'AUTHORIZED';

    return null;
}


/**
 * Retrieves an order object from the request querystring parameters.
 * @param {dw.system.Request} req - The request object containing querystring parameters.
 * @returns {{order: (dw.order.Order|null), orderNo: string, token: string}} The order, order number, and token.
 */
function getOrderFromQuery(req) {
    const orderNo = req.querystring.orderNo;
    const token = req.querystring.token;
    if (!orderNo || !token) return { order: null, orderNo: orderNo, token: token };
    const order = OrderMgr.getOrder(orderNo, token);
    return { order: order, orderNo: orderNo, token: token };
}

server.get('Success', server.middleware.https, function (req, res, next) {
    const ord = getOrderFromQuery(req);
    if (!ord.order) {
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', 'Order not found'));
        return next();
    }
    res.render('checkout/confirmation/processing', { 
        orderNo: ord.orderNo, 
        token: ord.token,
        isPending: true
    });
    return next();
});

server.get('Pending', server.middleware.https, function (req, res, next) {
    const ord = getOrderFromQuery(req);
    if (!ord.order) {
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', 'Order not found'));
        return next();
    }
    res.render('checkout/confirmation/processing', {
        orderNo: ord.orderNo,
        token: ord.token,
        isPending: true
    });
    return next();
});

/**
 * Handles negative payment result scenarios by failing the order and redirecting to the appropriate error page.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @param {string} message - The error message to display.
 * @returns {void} Returns nothing.
 */
function handleNegativeResult(req, res, next, message) {
    const ord = getOrderFromQuery(req);
    if (!ord.order) {
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', 'Order not found'));
        return next();
    }

    if (ord.order.status.value !== Order.ORDER_STATUS_FAILED && ord.order.status.value !== Order.ORDER_STATUS_CANCELLED) {
        try {
            Transaction.wrap(function () {
                OrderMgr.failOrder(ord.order, true);
            });
        } catch (e) {
            Logger.getLogger('awp').warn('Fail order on negative result failed: {0}', e);
        }
    }

    res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', message));
    return next();
}

server.get('Cancel', server.middleware.https, function (req, res, next) {
    return handleNegativeResult(req, res, next, Resource.msg('awp.cancelled', 'worldpay', null));
});

server.get('Error', server.middleware.https, function (req, res, next) {
    return handleNegativeResult(req, res, next, Resource.msg('awp.error', 'worldpay', null));
});

server.get('Expiry', server.middleware.https, function (req, res, next) {
    return handleNegativeResult(req, res, next, Resource.msg('awp.expired', 'worldpay', null));
});

server.get('Failure', server.middleware.https, function (req, res, next) {
    return handleNegativeResult(req, res, next, Resource.msg('awp.failed', 'worldpay', null));
});

server.get('Check', server.middleware.https, function (req, res, next) {
    const orderNo = req.querystring.orderNo;
    const token = req.querystring.token;
    const order = OrderMgr.getOrder(orderNo, token);

    if (!order) { res.json({ error: true, reason: 'order' }); return next(); }

    let q;
    try {
        const txRef = (order.custom && order.custom.latestTransactionReference)
            ? String(order.custom.latestTransactionReference)
            : orderNo;
        q = facade.queryPaymentStatus(txRef);
    } catch (e) {
        Logger.getLogger('awp').error('AWPResult.Check: exception calling queryPaymentStatus for {0}: {1}', orderNo, e);
        res.json({ error: true, reason: 'service' });
        return next();
    }

    const status = extractWPStatus(q.raw); 
    const norm = (status || '').toUpperCase();
    const ok = new Set(['AUTHORIZED','AUTHORISED','CAPTURE_REQUESTED','CAPTURED','SETTLED','SUCCESS','APPROVED']);

    if (!ok.has(norm)) {
        res.json({ ready: false });
        return next();
    }

    const confirmUrl = URLUtils.url('Order-AWPConfirm',
        'orderID', order.orderNo,
        'orderToken', order.orderToken
    ).toString();

    res.json({
        error: false,
        ready: true,
        approved: true, 
        orderID: order.orderNo,
        orderToken: order.orderToken,
        continueUrl: confirmUrl
    });
    return next();
});

module.exports = server.exports();
