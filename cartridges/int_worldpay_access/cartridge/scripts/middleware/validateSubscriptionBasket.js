'use strict';

const BasketMgr = require('dw/order/BasketMgr');
const URLUtils = require('dw/web/URLUtils');
const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');

/**
 * Middleware to validate subscription basket/order
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 */
function validateSubscriptionBasket(req, res, next) {
    const currentBasket = BasketMgr.getCurrentBasket();
    const subscriptionHelper = require('*/cartridge/scripts/helpers/subscriptionHelper');

    if (!currentBasket) {
        return next();
    }

    Transaction.wrap(function () {
        currentBasket.custom.isRecurring = !!subscriptionHelper.isSubscription(currentBasket);
    });

    if (currentBasket.custom.isRecurring && (!req.currentCustomer.raw.authenticated || !req.currentCustomer.raw.registered)) {
        let viewData = res.getViewData();
        const message = Resource.msg('checkout.reccuring.error.not.logged.in', 'checkout', null);

        viewData.valid = {
            error: true,
            message: message
        }
        res.redirect(URLUtils.https('Cart-Show', 'placeerror', message));
        return next();
    }

    const isEligible = subscriptionHelper.isEligible(currentBasket);

    if (!isEligible || isEligible.error) {
        let viewData = res.getViewData();

        viewData.valid = {
            error: true,
            message: isEligible.errorMessage
        }
        res.redirect(URLUtils.https('Cart-Show', 'placeerror', isEligible.errorMessage));
        return next();

    }

    return next();
}

module.exports = validateSubscriptionBasket;
