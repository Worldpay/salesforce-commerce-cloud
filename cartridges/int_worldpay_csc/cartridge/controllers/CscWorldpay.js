'use strict';

var server = require('server');
var params = request.httpParameterMap; //eslint-disable-line
var Order = require('dw/order/Order');

server.get('VoidSale', function (req, res, next) {
    var orderID = params.order_no.stringValue;
    var OrderMgr = require('dw/order/OrderMgr');
    var defaultLocale = dw.system.Site.getCurrent().defaultLocale; //eslint-disable-line
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
    var defaultLocale = dw.system.Site.getCurrent().defaultLocale; //eslint-disable-line
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

module.exports = server.exports();
