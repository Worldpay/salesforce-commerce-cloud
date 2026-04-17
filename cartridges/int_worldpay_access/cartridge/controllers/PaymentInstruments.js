'use strict';

const page = module.superModule;
const server = require('server');
const userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
const Resource = require('dw/web/Resource');

const Logger = require('dw/system/Logger');

server.extend(page);

server.prepend('DeletePayment', userLoggedIn.validateLoggedInAjax, function (req, res, next) {
    try {
        const CustomerMgr = require('dw/customer/CustomerMgr');

        const UUID = req.querystring.UUID;
        if (!UUID) return next();

        const customer = CustomerMgr.getCustomerByCustomerNumber(req.currentCustomer.profile.customerNo);
        if (!customer || !customer.profile || !customer.profile.wallet) return next();

        const wallet = customer.profile.wallet;
        const it = wallet.getPaymentInstruments().iterator();
        let rawPI = null;
        while (it.hasNext()) {
            const cand = it.next();
            if (cand.UUID === UUID) { rawPI = cand; break; }
        }
        if (!rawPI) return next();

        const href = rawPI.custom && rawPI.custom.awpTokenHref;
        if (href) {
            const tokenFacade = require('*/cartridge/scripts/service/tokenFacade');
            const del = tokenFacade.deleteTokenByHref(String(href));

            if (del && del.error) {
                Logger.getLogger('awp').warn('DeletePayment: token delete failed UUID={0} href={1}', UUID, href);
                return next();
            }

            if (wallet.getPaymentInstruments().length === 0) {
                res.json({
                    UUID: UUID,
                    message: Resource.msg('msg.no.saved.payments', 'payment', null)
                });
            } else {
                res.json({ UUID: UUID });
            }
        }
    } catch (e) {
        Logger.getLogger('awp').error('DeletePayment prepend ex: {0}', e);
    }
    return next();
});

module.exports = server.exports();
