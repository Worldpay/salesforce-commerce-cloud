'use strict';
var page = module.superModule;
var server = require('server');
server.extend(page);
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var URLUtils = require('dw/web/URLUtils');
var ResourceBundle = require('*/cartridge/models/resources');
var Transaction = require('dw/system/Transaction');

server.prepend(
        'Begin',
        server.middleware.https,
        consentTracking.consent,
        csrfProtection.generateToken,
        function (req, res, next) {
            var Resources = new ResourceBundle();
            var viewData = res.getViewData();
            viewData.Resources = Resources;

            var errorMessage = null;
            if (undefined !== req.querystring.placeerror && req.querystring.placeerror) {
                errorMessage = req.querystring.placeerror;
            }

            if (!empty(session.privacy.currentOrderNo)) {
                var orderMgr = require('dw/order/OrderMgr');

                Transaction.wrap(function () {
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

server.get('HandleBrowserBack', server.middleware.include, function (req, res, next) {
    if (!empty(session.privacy.isInstantPurchaseBasket)) {
        delete session.privacy.isInstantPurchaseBasket;
    }
    if (!empty(session.privacy.currentOrderNo)) {
        var OrderMgr = require('dw/order/OrderMgr');

        Transaction.wrap(function () {
            OrderMgr.failOrder(OrderMgr.getOrder(session.privacy.currentOrderNo), true);
        });
        delete session.privacy.currentOrderNo;
    }
    return next();
});

module.exports = server.exports();
