/* global session, empty */

'use strict';

const server = require('server');
const page = module.superModule;
server.extend(page);

const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');
const OrderMgr = require('dw/order/OrderMgr');

server.prepend(
    'Show',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        const errorMessage = req.querystring.placeerror || null;

        if (errorMessage) {
            let viewData = res.getViewData();

            viewData.valid = {
                error: true,
                message: errorMessage
            }

            return next();
        }

        if (!empty(session.privacy.currentOrderNo)) {
            Transaction.wrap(function () {
                OrderMgr.failOrder(OrderMgr.getOrder(session.privacy.currentOrderNo), true);
            });

            if (errorMessage) {
                res.redirect(URLUtils.url('Cart-Show', 'placeerror', errorMessage));
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
