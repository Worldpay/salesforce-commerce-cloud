'use strict';
var server = require('server');

var BasketMgr = require('dw/order/BasketMgr');

var clickToPayHeler = require('*/cartridge/scripts/common/clickToPayHelper');


server.get('GetContent',
    server.middleware.https,
    function (req, res, next) {
        const renderTemplate = 'checkout/billing/paymentOptions/clicktopayContent';
        const currentBasket = BasketMgr.getCurrentBasket();

        if (!currentBasket) {
            res.render(renderTemplate, {
                enabled: false
            });

            return next();
        }

        var context = clickToPayHeler.getCtpContext(currentBasket);

        res.render(renderTemplate, {
            enabled: !!context || !context.success,
            clientLibrary: context.clientLibrary,
            clientLibraryIntegrity: context.clientLibraryIntegrity,
            jwt: JSON.stringify(context.jwt)
        });

        return next();


    });


module.exports = server.exports();