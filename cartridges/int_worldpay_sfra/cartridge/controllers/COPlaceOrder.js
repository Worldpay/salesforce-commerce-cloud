/* eslint-disable no-undef */
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
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

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
 * @param {dw.order.Order} orderObj - the order object
 * @return {Object} returns an json object
 */
function authStatusOrderPlacement(paymentMethod, paymentStatus, paymentInstrument, orderObj) {
    var order = orderObj;
    var error;
    if (!paymentMethod.equals(WorldpayConstants.KLARNASLICEIT) &&
        !paymentMethod.equals(WorldpayConstants.KLARNAPAYLATER) &&
        !paymentMethod.equals(WorldpayConstants.KLARNAPAYNOW) &&
        !paymentMethod.equals(WorldpayConstants.IDEAL) &&
        !paymentMethod.equals(WorldpayConstants.PAYPAL) &&
        !paymentMethod.equals(WorldpayConstants.WORLDPAY) &&
        !paymentMethod.equals(WorldpayConstants.CHINAUNIONPAY)) {
        var orderInfo = Utils.getWorldpayOrderInfo(paymentStatus);
        var macstatus = Utils.verifyMac(orderInfo.mac, orderInfo.orderKey, orderInfo.orderAmount, orderInfo.orderCurrency, orderInfo.orderStatus);
        if (macstatus.error) {
            Transaction.wrap(function () {
                order.custom.worldpayMACMissingVal = true;
            });
            error = Utils.worldpayErrorMessage();
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
            Logger.getLogger('worldpay').error(' mac issue ');
            return {
                redirect: true,
                stage: 'placeOrder',
                placeerror: error.errorMessage
            };
        }
    }
    if (order.status.value === Order.ORDER_STATUS_FAILED && paymentStatus !== 'AUTHORISED') {
        Transaction.wrap(function () {
            order.custom.worldpayMACMissingVal = true;
        });
        error = Utils.worldpayErrorMessage();
        return {
            redirect: true,
            stage: 'payment',
            placeerror: error.errorMessage
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

    if (!empty(session.privacy.currentOrderNo)) {
        delete session.privacy.currentOrderNo;
    }
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
        var paymentStatus = req.querystring.paymentStatus;
        if (undefined !== paymentStatus && paymentStatus[0] === WorldpayConstants.AUTHORIZED) {
            paymentStatus = WorldpayConstants.AUTHORIZED;
        }
        if (undefined !== paymentStatus && paymentStatus[1] === WorldpayConstants.PENDING) {
            paymentStatus = WorldpayConstants.PENDING;
        }
        Logger.getLogger('worldpay').debug(req.querystring.order_id + ' orderid COPlaceOrder paymentStatus ' + paymentStatus);
        if (undefined !== paymentStatus && paymentStatus.equals(WorldpayConstants.AUTHORIZED)) {
            req.session.privacyCache.set('order_id', null);

            authResult = authStatusOrderPlacement(paymentMethod, paymentStatus, paymentInstrument, order);
            Transaction.wrap(function () {
                order.custom.WorldpayLastEvent = WorldpayConstants.AUTHORIZED;
            });
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
            Transaction.wrap(function () {
                order.custom.WorldpayLastEvent = WorldpayConstants.PENDING;
            });
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
            Transaction.wrap(function () {
                order.custom.WorldpayLastEvent = WorldpayConstants.REFUSED;
            });

            if (!paymentMethod.equals(WorldpayConstants.KLARNASLICEIT) &&
                !paymentMethod.equals(WorldpayConstants.KLARNAPAYLATER) &&
                !paymentMethod.equals(WorldpayConstants.KLARNAPAYNOW) &&
                !paymentMethod.equals(WorldpayConstants.IDEAL) &&
                !paymentMethod.equals(WorldpayConstants.PAYPAL) &&
                !paymentMethod.equals(WorldpayConstants.WORLDPAY) &&
                !paymentMethod.equals(WorldpayConstants.CHINAUNIONPAY)) {
                if (undefined !== paymentStatus && (paymentStatus.equals(WorldpayConstants.CANCELLEDSTATUS) || paymentStatus.equals(WorldpayConstants.REFUSED))) {
                    if (require('*/cartridge/scripts/common/Utils').verifyMac(orderInformation.mac,
                        orderInformation.orderKey,
                        orderInformation.orderAmount,
                        orderInformation.orderCurrency,
                        orderInformation.orderStatus).error) {
                        // app.getController('Cart').Show();
                        res.redirect(URLUtils.url('Cart-Show'));
                        return next();
                    }
                    if (paymentStatus.equals(WorldpayConstants.CANCELLEDSTATUS)) {
                        var ArrayList = require('dw/util/ArrayList');
                        Transaction.wrap(function () {
                            order.custom.transactionStatus = new ArrayList('POST_AUTH_CANCELLED');
                        });
                    }
                }
            }
            error = Utils.worldpayErrorMessage();
            if (paymentMethod.equals(WorldpayConstants.KONBINI)) {
                Transaction.wrap(function () {
                    OrderMgr.cancelOrder(order);
                });
                res.redirect(URLUtils.url('Cart-Show'));
            } else {
                Transaction.wrap(function () {
                    OrderMgr.failOrder(order, true);
                });
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
        if (paymentMethod.equals(WorldpayConstants.KLARNASLICEIT) ||
            paymentMethod.equals(WorldpayConstants.KLARNAPAYLATER) ||
            paymentMethod.equals(WorldpayConstants.KLARNAPAYNOW)) {
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
                klarnaConfirmationSnippet: (paymentMethod.equals(WorldpayConstants.KLARNASLICEIT) ||
                    paymentMethod.equals(WorldpayConstants.KLARNAPAYLATER) ||
                    paymentMethod.equals(WorldpayConstants.KLARNAPAYNOW)) ? authResult.reference : ''
            });
        } else {
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                returningCustomer: true,
                klarnaConfirmationSnippet: (paymentMethod.equals(WorldpayConstants.KLARNASLICEIT) ||
                    paymentMethod.equals(WorldpayConstants.KLARNAPAYLATER) ||
                    paymentMethod.equals(WorldpayConstants.KLARNAPAYNOW)) ? authResult.reference : ''
            });
        }
    } else {
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }
    return next();
});


/**
 *
 * @param {Order} order - Order
 * @param {Object} req - Request
 * @param {Object} res - Response
 * @param {Object} next - Next
 * @returns {Object} next
 */
function placeOrder(order, req, res, next) {
    if (!order && req.querystring.order_token !== order.getOrderToken()) {
        return next(new Error(Resource.msg('error.applepay.token.mismatch', 'checkout', null)));
    }
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', order, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);

    if (fraudDetectionStatus.status === 'fail') {
        Transaction.wrap(function () {
            OrderMgr.failOrder(order);
        });

        // fraud detection failed
        req.session.privacyCache.set('fraudDetectionStatus', true);
        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus.errorCode).toString(),
            errorMessage: Resource.msg('error.applepay.fraud', 'checkout', null)
        });
        return next();
    }


    // Places the order
    var placeOrderResult = checkoutHelper.placeOrder(order, fraudDetectionStatus);
    if (placeOrderResult.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.applepay.place.order', 'checkout', null)
        });
        return next();
    }

    checkoutHelper.sendConfirmationEmail(order, req.locale.id);
    res.redirect(URLUtils.https('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken));
    return next();
}


server.post('SubmitOrder', csrfProtection.generateToken, function (req, res, next) {
    var order = OrderMgr.getOrder(req.querystring.order_id);
    if (!order && req.querystring.order_token !== order.getOrderToken()) {
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }
    var paymentInstrument = null;
    if (!empty(order) && !empty(order.getPaymentInstruments())) {
        paymentInstrument = order.getPaymentInstruments()[0];
    }

    if (!empty(paymentInstrument) && paymentInstrument.paymentMethod === 'DW_APPLE_PAY') {
        placeOrder(order, req, res, next);
    }
    return next();
});

module.exports = server.exports();
