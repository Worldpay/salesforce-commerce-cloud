'use strict';

/* global customer */

const Transaction = require('dw/system/Transaction');
const ArrayList = require('dw/util/ArrayList');

/**
 * Middleware to cancel recurring order
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 */
function cancelRecurring(req, res, next) {
    const orderID = req.httpParameterMap.orderID? req.httpParameterMap.orderID.value : null;

    if (!orderID) {
        res.json({
            error: true
        });
        this.emit('route:Complete', req, res);
        return null;
    }

    const customerOrders = customer.orderHistory.getOrders();
    
    if (!customerOrders) {
        return null;
    }

    const recurringOrder = new ArrayList(customerOrders).toArray().find(function (o) {
        return o.orderNo === orderID && o.custom.isRecurring;
    });

    if (!recurringOrder) {
        res.json({
            error: true
        });
        this.emit('route:Complete', req, res);
        return null;
    }

    Transaction.wrap(function () {
        recurringOrder.custom.isReccuringActive = false
    });

    res.json({
        error: false
    });

    return next();
}

module.exports = cancelRecurring;
