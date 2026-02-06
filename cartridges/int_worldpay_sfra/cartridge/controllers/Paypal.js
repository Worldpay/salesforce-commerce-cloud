'use strict';
var server = require('server');

var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var BasketMgr = require('dw/order/BasketMgr');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
 var Order = require('dw/order/Order');

var worldpayPayment = require('*/cartridge/scripts/order/worldpayPayment');
var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var checkoutHelper = require('*/cartridge/scripts/checkout/checkoutHelpers');
var utils = require('*/cartridge/scripts/common/utils');
var serviceFacade = require('*/cartridge/scripts/service/serviceFacade');


/**
 * Paypal-CreateOrder : Endpoint to create order in Worldpay
 */
server.post('CreateOrder',
    server.middleware.https,
    function (req, res, next) {
        var requestBodyAsString = req.httpParameterMap.requestBodyAsString;
        var params = requestBodyAsString ? JSON.parse(requestBodyAsString) : null;
        var paramsData = params && params.data ? params.data : null; // cehck if PDP flow
        var currentBasket = BasketMgr.getCurrentBasket();

        if (paramsData && paramsData.isPDP) {
            // PDP flow
            currentBasket = require('*/cartridge/scripts/checkout/paypalHelpers').createBasket(paramsData.pid, paramsData.qty, {
                countryCode: req.geolocation.countryCode,
                isPDP: paramsData.isPDP,
                sfccCustomer: req.currentCustomer.raw
            })
        }

        if (!currentBasket) {
            res.json({ success:  false });
            return next();
        }

        worldpayPayment.handleAPM(currentBasket, {
            selectedPaymentMethodID: {
                value: worldpayConstants.PAYPAL_SSL
            },
            paymentPrice: currentBasket.totalGrossPrice
        });

        var order = COHelpers.createOrder(currentBasket);
        var piObject = checkoutHelper.getPaypaymentInstruments(order);  
        var orderamount = utils.calculateNonGiftCertificateAmount(order);
        var authorizeOrderResult = serviceFacade.authorizeOrderService(orderamount, order, piObject.pi, order.customer, piObject.paymentMthd);

        res.json({
            success: authorizeOrderResult && authorizeOrderResult.success,
            orderId: order.getOrderNo(),
            id: authorizeOrderResult.response.referenceID
        });

        return next();
    }
);

/**
 * Paypal-OnApprove : Endpoint to handle order creation and place order
 */
server.post('OnApprove',
    server.middleware.https,
    function (req, res, next) {
        var requestBodyAsString = req.httpParameterMap.requestBodyAsString;
        var params = requestBodyAsString ? JSON.parse(requestBodyAsString) : null;
        var orderID = params && params.orderID ? params.orderID : null;

        if (!orderID) {
            res.json({
                success: false,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });

            return next();
        }

        var approveServiceResult = serviceFacade.approveService(orderID);
        var order = OrderMgr.getOrder(orderID);

        if (approveServiceResult.error) {
            // fail order and show error message
            
            if (order) {
                Transaction.wrap(function () {
                    OrderMgr.failOrder(order, true);
                });
            }

            res.json({
                success: false,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });

            return next();
        }

        if (!order || order.getStatus().value === Order.ORDER_STATUS_FAILED) {
            res.redirect(URLUtils.https('Cart-Show'));

            return next();
        }

        // Places the order
        var placedOrderResult = COHelpers.placeOrder(order);

        if (placedOrderResult.error) {
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', Resource.msg('error.technical', 'checkout', null)));
            
            return next();
        }

        Transaction.wrap(function () {
            order.custom.WorldpayLastEvent = worldpayConstants.AUTHORIZED;
        });

        if (!empty(session.privacy.currentOrderNo)) {
            delete session.privacy.currentOrderNo;
        }
    
    
        res.json({
            success: true,
            continueUrl: URLUtils.https('Order-Confirm').toString(),
            orderID: order.orderNo,
            orderToken: order.orderToken
        });

        return next();
    }
);

/**
 * Remote include for paypal Smart button (CLP or PDP)
 */
server.get('Include',
    server.middleware.https,
    function (req, res, next) {
        res.render('checkout/billing/paymentOptions/paypalPdp', {
            isPDP: true
        });
        return next();
    });

module.exports = server.exports();
