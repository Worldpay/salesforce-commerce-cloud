/* global session */

'use strict';

const server = require('server');
const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');

const serviceFacade = require('*/cartridge/scripts/service/serviceFacade');
const tokenFacade = require('*/cartridge/scripts/service/tokenFacade');

server.post('Redirect', server.middleware.https, function (req, res, next) {
    const orderNo = req.querystring.orderNo;
    if (!orderNo) {
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', 'Missing orderNo'));
        return next();
    }

    const order = OrderMgr.getOrder(orderNo);
    if (!order) {
        Logger.getLogger('awp').error('HPPRedirect: Order not found for orderNo=' + orderNo);
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', 'Order not found'));
        return next();
    }


    const pi = order.getPaymentInstruments();
    const hasPI = (pi && (pi.length ? pi.length > 0 : pi.size && pi.size() > 0));
    if (!hasPI) {
        Logger.getLogger('awp').error('HPPRedirect: No Worldpay PI on order ' + orderNo);
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', 'Payment method missing'));
        return next();
    }

    let billingData = null;
    const rawBilling = session.privacy.billingData;
    if (rawBilling) {
        try {
            billingData = JSON.parse(rawBilling);
        } catch (e) {
            Logger.getLogger('awp').error('HPPRedirect: Failed to parse session.privacy.billingData: ' + e);
        }
    }

    session.privacy.billingData = null; 

    let tokenHref = null;
    const chosenUUID = session.privacy.awpSavedPIUUID || '';

    session.privacy.awpSavedPIUUID = '';

    try {
        const before = tokenFacade.getLatestTokenByNamespace('cust-' + req.currentCustomer.profile.customerNo);
        session.privacy.awpLatestTokenIdBefore = (before && before.token && before.token.tokenId) ? String(before.token.tokenId) : '';
    } catch (e) {
        session.privacy.awpLatestTokenIdBefore = '';
    }
    
    if (chosenUUID) {
        const customer = order.getCustomer();
        const profile = customer && customer.getProfile();
        const wallet = profile && profile.getWallet();
        if (!wallet) {
            return res.redirect(URLUtils.url('Checkout-Begin','stage','payment','placeerror','No wallet'));
        }
        const it = wallet.getPaymentInstruments('CREDIT_CARD').iterator();
        while (it.hasNext()) {
            const instrument = it.next();
            if (instrument.UUID === chosenUUID && instrument.custom && instrument.custom.awpTokenHref) {
                tokenHref = String(instrument.custom.awpTokenHref); 
                break;
            }
        }
        if (!tokenHref) {
            return res.redirect(URLUtils.url('Checkout-Begin','stage','payment','placeerror','Saved card not found'));
        }
        session.privacy.awpUsedSavedCard = true;
    }

    let result = serviceFacade.authorizeOrderService(order, billingData, { tokenHref: tokenHref });
    if (result.error || !result.redirectUrl) {
        Transaction.wrap(function () {
            OrderMgr.failOrder(order, true);
        });

        Logger.getLogger('awp').error('HPPRedirect: Failed to get HPP session for order ' + orderNo);
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', 'Payment failed'));
        return next();
    }

    res.redirect(result.redirectUrl);
    return next();
});

module.exports = server.exports();
