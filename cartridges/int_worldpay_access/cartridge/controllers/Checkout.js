/* global session, empty */

'use strict';

const server = require('server');
const page = module.superModule;
server.extend(page);

const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
const URLUtils = require('dw/web/URLUtils');
const ResourceBundle = require('*/cartridge/models/resources');
const Transaction = require('dw/system/Transaction');
const OrderMgr = require('dw/order/OrderMgr');
const PaymentMgr = require('dw/order/PaymentMgr');

/**
 * Checkout-Begin : Handles cases where a payment session failed or was cancelled.
 * If a session variable indicates a pending order, it fails it and redirects the user back to placeOrder.
 */
server.prepend(
    'Begin',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        const Resources = new ResourceBundle();
        let viewData = res.getViewData();
        viewData.Resources = Resources;

        const errorMessage = req.querystring.placeerror || null;

        if (!empty(session.privacy.currentOrderNo)) {
            const order = OrderMgr.getOrder(session.privacy.currentOrderNo);

            if (order && order.status.value !== 8 /* FAILED */) {
                Transaction.wrap(function () {
                    OrderMgr.failOrder(order, true);
                });
            }

            delete session.privacy.currentOrderNo;

            const redirectURL = errorMessage
                ? URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', errorMessage)
                : URLUtils.url('Checkout-Begin', 'stage', 'placeOrder');

            res.redirect(redirectURL);
            return next();
        }

        const methods = PaymentMgr.getActivePaymentMethods();

        const list = [];
        const it = methods && methods.iterator ? methods.iterator() : null;
        if (it) {
            while (it.hasNext()) {
                let method = it.next();
                list.push({
                    id: method.ID,
                    displayName: (method.getName && method.getName()) || method.ID,
                    processorId: method.paymentProcessor ? method.paymentProcessor.ID : null
                });
            }
        }

        viewData.paymentMethods = list;

        return next();
    }
);

/**
 * Checkout-HandleBrowserBack : Fails the order if user presses the browser back button after placing the order
 * and restores the basket.
 */
server.get(
    'HandleBrowserBack',
    server.middleware.include,
    function (req, res, next) {
        if (!empty(session.privacy.isInstantPurchaseBasket)) {
            delete session.privacy.isInstantPurchaseBasket;
        }

        if (!empty(session.privacy.currentOrderNo)) {
            const order = OrderMgr.getOrder(session.privacy.currentOrderNo);

            if (order && order.status.value !== 8 /* FAILED */) {
                Transaction.wrap(function () {
                    OrderMgr.failOrder(order, true);
                });
            }

            delete session.privacy.currentOrderNo;
        }

        res.render('checkout/browserBack');
        return next();
    }
);

module.exports = server.exports();
