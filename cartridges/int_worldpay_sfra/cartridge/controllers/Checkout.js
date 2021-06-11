'use strict';
var page = module.superModule;
var server = require('server');
server.extend(page);
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var URLUtils = require('dw/web/URLUtils');

server.prepend('Begin', server.middleware.https, consentTracking.consent, csrfProtection.generateToken, function(req, res, next) {
    var errorMessage = null;
    if (req.querystring.placeerror) {
        errorMessage = req.querystring.placeerror;
    }
    if (!empty(session.privacy.currentOrderNo)) {
        var orderMgr = require('dw/order/OrderMgr');
        dw.system.Transaction.wrap(function() {
            orderMgr.failOrder(orderMgr.getOrder(session.privacy.currentOrderNo), true);
        });
        if (errorMessage) {
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', errorMessage));
        } else {
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder'));
        }
        delete session.privacy.currentOrderNo;
        return next();
    }
    return next();
});

module.exports = server.exports();
