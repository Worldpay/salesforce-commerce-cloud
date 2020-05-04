'use strict';
var page = module.superModule;
var server = require('server');
server.extend(page);
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var URLUtils = require('dw/web/URLUtils');

server.prepend(
        'Begin',
        server.middleware.https,
        consentTracking.consent,
        csrfProtection.generateToken,
        function (req, res, next) {
            // eslint-disable-next-line no-undef
            if (!empty(session.privacy.currentOrderNo)) {
                var orderMgr = require('dw/order/OrderMgr');
                // eslint-disable-next-line no-undef
                dw.system.Transaction.wrap(function () {
                    // eslint-disable-next-line no-undef
                    orderMgr.failOrder(orderMgr.getOrder(session.privacy.currentOrderNo), true);
                });
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder'));
                // eslint-disable-next-line no-undef
                delete session.privacy.currentOrderNo;
                return next();
            }
            return next();
        });

module.exports = server.exports();
