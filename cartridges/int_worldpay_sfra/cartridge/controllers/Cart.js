'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var redirectHelpers = require('*/cartridge/scripts/common/redirectHelpers');

/**
 * Cart-Show : The Cart-Show endpoint renders the cart page with the current basket
 * @name Base/Cart-Show
 * @function
 * @memberof Cart
 * @param {middleware} - server.middleware.https
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - csrfProtection.generateToken
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.prepend(
    'Show',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        var errorMessage = redirectHelpers.getFlashError() || req.querystring.placeerror || null;
        var viewData = res.getViewData();

        viewData.worldpayErrorMessage = errorMessage;
        res.setViewData(viewData);

        if (!empty(session.privacy.currentOrderNo)) {
            var orderMgr = require('dw/order/OrderMgr');

            Transaction.wrap(function () {
                orderMgr.failOrder(orderMgr.getOrder(session.privacy.currentOrderNo), true);
            });
            if (errorMessage) {
                redirectHelpers.setFlashError(errorMessage);
                res.redirect(URLUtils.url('Cart-Show'));
            } else {
                res.redirect(URLUtils.url('Cart-Show'));
            }
            delete session.privacy.currentOrderNo;
            return next();
        }
        return next();
    }
);

module.exports = server.exports();
