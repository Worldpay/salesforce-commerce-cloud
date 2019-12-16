'use strict';
var server = require('server');

var Logger = require('dw/system/Logger');
var PaymentMgr = require('dw/order/PaymentMgr');
var OrderMgr = require('dw/order/OrderMgr');
var OrderModel = require('*/cartridge/models/order');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var StringUtils = require('dw/util/StringUtils');
var Utils = require('*/cartridge/scripts/common/Utils');
var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
var checkoutHelper = require('*/cartridge/scripts/checkout/checkoutHelpers');
var Order = require('dw/order/Order');

/**
 * Pending status order placement
 * @param {string} PendingStatus - PendingStatus
 * @param {dw.order.Order} order - the order object
 * @param {Object} paymentMethod - paymentMethod Object
 * @return {Object} returns an json object
 */
function pendingStatusOrderPlacement(PendingStatus, order, paymentMethod) {
    var error;
    if (undefined === PendingStatus || PendingStatus.equals(WorldpayConstants.OPEN)) {
        if (order.status.value === Order.ORDER_STATUS_FAILED) {
            error = Utils.worldpayErrorMessage();
            return {
                redirect: true,
                stage: 'payment',
                placeerror: error.errorMessage
            };
        }
        return {
            redirect: true,
            stage: 'orderConfirm',
            ID: order.orderNo,
            token: order.orderToken
        };
    }
    error = Utils.worldpayErrorMessage();
    if (paymentMethod.equals(WorldpayConstants.KONBINI)) {
        Transaction.wrap(function () {
            OrderMgr.cancelOrder(order);
        });
        return {
            error: true
        };
    }
    Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
    });
    return {
        redirect: true,
        stage: 'placeOrder',
        placeerror: error.errorMessage
    };
}

/**
 * Authorize status order placement
 * @param {Object} paymentMethod - paymentMethod Object
 * @param {string} paymentStatus - transaction payment status
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument
 * @param {dw.order.Order} order - the order object
 * @return {Object} returns an json object
 */
function authStatusOrderPlacement(paymentMethod, paymentStatus, paymentInstrument, order) {
    var error;
    if (!paymentMethod.equals(WorldpayConstants.KLARNA) && !paymentMethod.equals(WorldpayConstants.IDEAL) && !paymentMethod.equals(WorldpayConstants.PAYPAL) && !paymentMethod.equals(WorldpayConstants.WORLDPAY) && !paymentMethod.equals(WorldpayConstants.CHINAUNIONPAY)) {
        var orderInfo = Utils.getWorldpayOrderInfo(paymentStatus);
        var macstatus = Utils.verifyMac(orderInfo.mac, orderInfo.orderKey, orderInfo.orderAmount, orderInfo.orderCurrency, orderInfo.orderStatus);
        if (macstatus.error) {
            Transaction.wrap(function () {
                order.custom.worldpayMACMissingVal = true;// eslint-disable-line
            });
            error = Utils.worldpayErrorMessage();
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
            // FailImpl(order, error.errorMessage);
            Logger.getLogger('worldpay').error(' mac issue ');
            // return {error : true, success : false, errorMessage : error.errorMessage};
            return {
                redirect: true,
                stage: 'placeOrder',
                placeerror: error.errorMessage
            };
        }
    }
    if (order.status.value === Order.ORDER_STATUS_FAILED) {
        Transaction.wrap(function () {
            order.custom.worldpayMACMissingVal = true;// eslint-disable-line
        });
        error = Utils.worldpayErrorMessage();
        // app.getController('COBilling').Start({'errorMessage':error.errorMessage});
        return {
            redirect: true,
            stage: 'payment',
            placeerror: error.errorMessage
        };
    }
    if (paymentMethod.equals(WorldpayConstants.KLARNA)) {
        // Service Request - for Klarna Confirmation Inquiry
        var paymentMthd = PaymentMgr.getPaymentMethod(WorldpayConstants.KLARNA);
        var WorldpayPreferences = require('*/cartridge/scripts/object/WorldpayPreferences');
        WorldpayPreferences = new WorldpayPreferences();
        var preferences = WorldpayPreferences.worldPayPreferencesInit(paymentMthd);

        var confirmationRequestKlarnaResult = require('*/cartridge/scripts/service/ServiceFacade').confirmationRequestKlarnaService(order.orderNo, preferences, paymentInstrument.custom.WorldpayMID);
        if (confirmationRequestKlarnaResult.error) {
            Logger.getLogger('worldpay').error('COPlaceOrder.js HandleAuthenticationResponse : ErrorCode : ' + confirmationRequestKlarnaResult.errorCode + ' : Error Message : ' + confirmationRequestKlarnaResult.errorMessage);
            Utils.failImpl(order, confirmationRequestKlarnaResult.errorMessage);
            return {
                redirect: true,
                stage: 'placeOrder',
                placeerror: confirmationRequestKlarnaResult.errorMessage
            };
        }
        return {
            success: true,
            paymentMethod: paymentMethod,
            reference: confirmationRequestKlarnaResult.response.reference
        };
    }
    return {
        success: true,
        paymentMethod: paymentMethod
    };
}

/**
 *  Handle Ajax after order review page palce order
 */
server.get('Submit', function (req, res, next) {
    var order = OrderMgr.getOrder(req.querystring.order_id);
    var error;
    if (!order && req.querystring.order_token !== order.getOrderToken()) {
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }

    // Check payment processor as worldpay
    var isWorldpayPaymentProcessor = false;
    var paymentInstruments = order.getPaymentInstruments();
    var paymentMethod;
    var paymentInstrument;
    var authResult;
    var pendingResult;
    if (paymentInstruments.length > 0) {
        for (var i = 0; i < paymentInstruments.length; i++) {
            paymentInstrument = paymentInstruments[i];
            var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod())
                    .getPaymentProcessor();
            if (paymentProcessor != null && paymentProcessor.getID().toLowerCase().equals('worldpay')) {
                isWorldpayPaymentProcessor = true;
                paymentMethod = paymentInstrument.paymentMethod;
                break;
            }
        }
    }

    if (isWorldpayPaymentProcessor) {
        // var Order = require('dw/order/Order');
        var paymentStatus = req.querystring.paymentStatus;
        if (undefined !== paymentStatus && paymentStatus[0] === WorldpayConstants.AUTHORIZED) {
            paymentStatus = WorldpayConstants.AUTHORIZED;
        }
        Logger.getLogger('worldpay').debug(req.querystring.order_id + ' orderid COPlaceOrder paymentStatus ' + paymentStatus);
        if (undefined !== paymentStatus && paymentStatus.equals(WorldpayConstants.AUTHORIZED)) {
            req.session.privacyCache.set('order_id', null);

            authResult = authStatusOrderPlacement(paymentMethod, paymentStatus, paymentInstrument, order);

            if (authResult.redirect && authResult.stage.equals('placeOrder')) {
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', authResult.placeerror));
                return next();
            }

            if (authResult.redirect && authResult.stage.equals('payment')) {
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', authResult.placeerror));
                return next();
            }
        } else if (undefined !== paymentStatus && paymentStatus.equals(WorldpayConstants.PENDING)) {
            var PendingStatus = req.querystring.status;

            pendingResult = pendingStatusOrderPlacement(PendingStatus, order, paymentMethod);
            if (pendingResult.error) {
                res.redirect(URLUtils.url('Cart-Show'));
            }
            if (pendingResult.redirect && pendingResult.stage.equals('placeOrder')) {
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', pendingResult.placeerror));
                return next();
            }

            if (pendingResult.redirect && pendingResult.stage.equals('payment')) {
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', pendingResult.placeerror));
                return next();
            }

            if (pendingResult.redirect && pendingResult.stage.equals('orderConfirm')) {
                // trigger order confirmation email
                checkoutHelper.sendConfirmationEmail(order, req.locale.id);
                res.redirect(URLUtils.url('Order-Confirm', 'ID', pendingResult.ID, 'token', pendingResult.token).toString());
                return next();
            }
        } else {
            var orderInformation = Utils.getWorldpayOrderInfo(paymentStatus);

            if (!paymentMethod.equals(WorldpayConstants.KLARNA) && !paymentMethod.equals(WorldpayConstants.IDEAL) && !paymentMethod.equals(WorldpayConstants.PAYPAL) && !paymentMethod.equals(WorldpayConstants.WORLDPAY) && !paymentMethod.equals(WorldpayConstants.CHINAUNIONPAY)) {
                if (undefined !== paymentStatus && (paymentStatus.equals(WorldpayConstants.CANCELLEDSTATUS) || paymentStatus.equals(WorldpayConstants.REFUSED))) {
                    if (require('*/cartridge/scripts/common/Utils').verifyMac(orderInformation.mac, orderInformation.orderKey, orderInformation.orderAmount, orderInformation.orderCurrency, orderInformation.orderStatus).error) {
                        // app.getController('Cart').Show();
                        res.redirect(URLUtils.url('Cart-Show'));
                        return next();
                    }
                    if (undefined !== paymentStatus && paymentStatus.equals(WorldpayConstants.CANCELLEDSTATUS)) {
                        var ArrayList = require('dw/util/ArrayList');
                        Transaction.wrap(function () {
                            order.custom.transactionStatus = new ArrayList('POST_AUTH_CANCELLED');
                        });
                    }
                }
            }
            error = Utils.worldpayErrorMessage();
            if (paymentMethod.equals(WorldpayConstants.KONBINI)) {
                Transaction.wrap(function () { OrderMgr.cancelOrder(order); });
                res.redirect(URLUtils.url('Cart-Show'));
            } else {
                Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
                // FailImpl(order, error.errorMessage);
                // return {error: true, success : false, errorMessage : error.errorMessage};
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', error.errorMessage));
            }
            return next();
        }
        var orderPlacementStatus = checkoutHelper.placeOrder(order);

        if (orderPlacementStatus.error) {
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', Resource.msg('error.technical', 'checkout', null)));
            return next();
        }

        var config = {
            numberOfLineItems: '*'
        };
        var orderModel = new OrderModel(order, { config: config });
        if (paymentMethod.equals(WorldpayConstants.KLARNA)) {
            authResult.reference = StringUtils.decodeString(StringUtils.decodeBase64(authResult.reference), StringUtils.ENCODE_TYPE_HTML);
            authResult.reference = authResult.reference.replace('window.location.href', 'window.top.location.href');
        }
        // trigger order confirmation email
        checkoutHelper.sendConfirmationEmail(order, req.locale.id);
        if (!req.currentCustomer.profile) {
            var passwordForm = server.forms.getForm('newPasswords');
            passwordForm.clear();
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                returningCustomer: false,
                passwordForm: passwordForm,
                klarnaConfirmationSnippet: paymentMethod.equals(WorldpayConstants.KLARNA) ? authResult.reference : ''
            });
        } else {
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                returningCustomer: true,
                klarnaConfirmationSnippet: paymentMethod.equals(WorldpayConstants.KLARNA) ? authResult.reference : ''
            });
        }
    } else {
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }
    return next();
});

module.exports = server.exports();
