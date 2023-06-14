'use strict';
var page = module.superModule;
var server = require('server');
server.extend(page);
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var URLUtils = require('dw/web/URLUtils');
var ResourceBundle = require('*/cartridge/models/resources');
var Transaction = require('dw/system/Transaction');

/**
 * Checkout-Begin : The Checkout-Begin endpoint will render the checkout shipping page for both guest shopper and returning shopper
 * @name Base/Checkout-Begin
 * @function
 * @memberof Checkout
 * @param {middleware} - server.middleware.https
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - csrfProtection.generateToken
 * @param {querystringparameter} - stage - a flag indicates the checkout stage
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.prepend('Begin', server.middleware.https, consentTracking.consent,
    csrfProtection.generateToken, function (req, res, next) {
        var Resources = new ResourceBundle();
        var viewData = res.getViewData();
        var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
        viewData.Resources = Resources;
        var errorMessage = null;
        if (undefined !== req.querystring.placeerror && req.querystring.placeerror) {
            errorMessage = req.querystring.placeerror;
        }

        if (!empty(session.privacy.currentOrderNo)) {
            var orderMgr = require('dw/order/OrderMgr');
            var order = orderMgr.getOrder(session.privacy.currentOrderNo);
            Transaction.wrap(function () {
                orderMgr.failOrder(order, true);
            });
            if (order.paymentInstrument.paymentMethod.equals(worldpayConstants.GOOGLEPAY)) {
                var gPayHelper = require('*/cartridge/scripts/checkout/gPayHelpers');
                gPayHelper.restoreCart();
            }
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

/**
 * Checkout-HandleBrowserBack : this will be checking the session attributes that are set in placeOrder step, if back button is pressed - we fail the order and retain the basket.
 * @name Base/Checkout-Begin
 * @function
 * @memberof Checkout
 * @param {middleware} - server.middleware.include
 * @param {renders} - isml
  */
server.get('HandleBrowserBack', server.middleware.include, function (req, res, next) {
    var gPayHelper = require('*/cartridge/scripts/checkout/gPayHelpers');
    gPayHelper.restoreCart();
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
    res.render('checkout/browserBack', {});
    return next();
});

module.exports = server.exports();
