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
var utils = require('*/cartridge/scripts/common/utils');
var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
var checkoutHelper = require('*/cartridge/scripts/checkout/checkoutHelpers');
var Order = require('dw/order/Order');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * Pending status order placement
 * @param {string} PendingStatus - PendingStatus
 * @param {dw.order.Order} order - the order object
 * @param {Object} paymentMethod - paymentMethod Object
 * @return {Object} returns an json object
 */
function pendingStatusOrderPlacement(PendingStatus, order, paymentMethod) {
    var error;
    if (undefined === PendingStatus || PendingStatus.equals(worldpayConstants.OPEN)) {
        if (order.status.value === Order.ORDER_STATUS_FAILED) {
            Logger.getLogger('worldpay').debug('failing the order');
            error = utils.worldpayErrorMessage();
            Logger.getLogger('worldpay').debug('PendingStatus is :' + PendingStatus);
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
    error = utils.worldpayErrorMessage();
    if (paymentMethod.equals(worldpayConstants.KONBINI)) {
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
    var Site = require('dw/system/Site');
    var currentSite = Site.getCurrent();
    var order = orderObj;
    var error;
    if (!paymentMethod.equals(worldpayConstants.KLARNA) &&
        !paymentMethod.equals(worldpayConstants.KLARNASLICEIT) &&
        !paymentMethod.equals(worldpayConstants.KLARNAPAYLATER) &&
        !paymentMethod.equals(worldpayConstants.KLARNAPAYNOW) &&
        !paymentMethod.equals(worldpayConstants.IDEAL) &&
        !paymentMethod.equals(worldpayConstants.PAYPAL) &&
        !paymentMethod.equals(worldpayConstants.PAYPAL_SSL) &&
        !paymentMethod.equals(worldpayConstants.WORLDPAY) &&
        !paymentMethod.equals(worldpayConstants.CHINAUNIONPAY)) {
        var orderInfo = utils.getWorldpayOrderInfo(paymentStatus);
        var macstatus = utils.verifyMac(orderInfo.mac, orderInfo.orderKey, orderInfo.orderAmount, orderInfo.orderCurrency, orderInfo.orderStatus);
        if (macstatus.error) {
            if (currentSite.getCustomPreferenceValue('enableErrorMailService')) {
                utils.sendErrorNotification(order.orderNo, worldpayConstants.WORLDPAY_MAC_MISSING_VAL, paymentMethod);
            }
            Transaction.wrap(function () {
                order.custom.worldpayMACMissingVal = true;
            });
            error = utils.worldpayErrorMessage();
            Transaction.wrap(function () {
                OrderMgr.failOrder(order, true);
            });
            Logger.getLogger('worldpay').error(' mac issue ');
            return {
                redirect: true,
                stage: 'placeOrder',
                placeerror: error.errorMessage
            };
        }
    }
    if (order.status.value === Order.ORDER_STATUS_FAILED && paymentStatus !== 'AUTHORISED') {
        if (currentSite.getCustomPreferenceValue('enableErrorMailService')) {
            utils.sendErrorNotification(order.orderNo, worldpayConstants.WORLDPAY_MAC_MISSING_VAL, paymentMethod);
        }
        Transaction.wrap(function () {
            order.custom.worldpayMACMissingVal = true;
        });
        error = utils.worldpayErrorMessage();
        return {
            redirect: true,
            stage: 'payment',
            placeerror: error.errorMessage
        };
    }
    return {
        success: true,
        paymentMethod: paymentMethod,
        redirect: true,
        stage: 'orderConfirm'
    };
}
/**
 * Check payment processor as worldpay
 * @param {dw.order.Order} order - current order Object
 * @returns {Object} isWorldpayPaymentProcessor
 */
function getPaymentProcessor(order) {
    var isWorldpayPaymentProcessor = false;
    var paymentMethod;
    var paymentInstrument;
    var paymentInstruments = order.getPaymentInstruments();

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
    return {
        isWorldpayPaymentProcessor: isWorldpayPaymentProcessor,
        paymentMethod: paymentMethod,
        paymentInstrument: paymentInstrument
    };
}
/**
 * Authorize status order placement
 * @param {Object} paymentStatus - transaction payment status
 * @param {string} paymentMethod - transaction payment statuspaymentMethod Object
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {Object} req - dw Request object
 * @param {Object} res - dw Response object
 * @return {Object} returns an json object
 */
function coAuthorizationResult(paymentStatus, paymentMethod, paymentInstrument, order, req, res) {
    var authResult;
    var orderObj = order;
    Logger.getLogger('worldpay').debug('Entered AUTHORIZED)');
    Logger.getLogger('worldpay').debug('paymentStatus is :' + paymentStatus);
    req.session.privacyCache.set('order_id', null);

    authResult = authStatusOrderPlacement(paymentMethod, paymentStatus, paymentInstrument, order);
    Logger.getLogger('worldpay').debug('authResult in AUTHORIZED :' + authResult);
    Transaction.wrap(function () {
        orderObj.custom.WorldpayLastEvent = worldpayConstants.AUTHORIZED;
    });
    if ((!paymentMethod.equals('Worldpay')) && authResult.redirect && authResult.stage.equals('orderConfirm')) {
        // trigger order confirmation email
        checkoutHelper.sendConfirmationEmail(order, req.locale.id);
        res.render('/checkout/orderConfirmForm', {
            error: false,
            orderID: orderObj.orderNo,
            orderToken: orderObj.orderToken,
            continueUrl: URLUtils.url('Order-Confirm').toString()
        });
        return {
            authResult: authResult,
            next: true
        };
    }
    if (authResult.redirect && authResult.stage.equals('placeOrder')) {
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', authResult.placeerror));
        return {
            authResult: authResult,
            next: true
        };
    }

    if (authResult.redirect && authResult.stage.equals('payment')) {
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', authResult.placeerror));
        return {
            authResult: authResult,
            next: true
        };
    }
    return {
        authResult: authResult,
        next: false
    };
}
/**
 * Verifies that entered credit card information is a valid card. If the information is valid a
 * @param {Object} PendingStatus - Current PendingStatus object
 * @param {Object} req - the req object
 * @param {Object} paymentMethod - the paymentMethod object
 * @param {Object} currentSite - current site
 */
function processPendingStatus(PendingStatus, req, paymentMethod, currentSite) {
    if (currentSite.getCustomPreferenceValue('enableErrorMailService')) {
        if (PendingStatus === 'EXPIRED') {
            utils.sendErrorNotification(req.querystring.order_id, worldpayConstants.ORDER_STATUS_PENDINGEXPIRED, paymentMethod);
        }
        if (PendingStatus === 'FAILURE') {
            utils.sendErrorNotification(req.querystring.order_id, worldpayConstants.ORDER_STATUS_PENDINGFAILURE, paymentMethod);
        }
        if (PendingStatus === 'ERROR') {
            utils.sendErrorNotification(req.querystring.order_id, worldpayConstants.ORDER_STATUS_PENDINGERROR, paymentMethod);
        }
    }
}
/**
 * This function will returns an true or false.
 * @param {Object} req - the req object
 * @param {Object} res - the paymentMethod object
 * @param {Object} currentSite - current site
 * @return {Object} returns an true or false
 */
function sendPendingResult(req, res, currentSite) {
    var pendingResult;
    var order = OrderMgr.getOrder(req.querystring.order_id);
    var orderObj = {
        orderNo: req.querystring.order_id,
        orderToken: req.querystring.order_token
    };
    var paymentProcessor = getPaymentProcessor(order);
    var paymentMethod = paymentProcessor.paymentMethod;
    var PendingStatus = req.querystring.status;
    Logger.getLogger('worldpay').debug('PendingStatus is :' + PendingStatus);
    pendingResult = pendingStatusOrderPlacement(PendingStatus, order, paymentMethod);
    Logger.getLogger('worldpay').debug('pendingResult :' + PendingStatus);
    Transaction.wrap(function () {
        order.custom.WorldpayLastEvent = worldpayConstants.PENDING;
    });
    if (pendingResult.error) {
        if (currentSite.getCustomPreferenceValue('enableErrorMailService')) {
            utils.sendErrorNotification(req.querystring.order_id, worldpayConstants.ORDER_STATUS_PENDINGERROR, paymentMethod);
        }
        res.redirect(URLUtils.url('Cart-Show'));
    }
    if (pendingResult.redirect && pendingResult.stage.equals('placeOrder')) {
        processPendingStatus(PendingStatus, req, paymentMethod, currentSite);
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', pendingResult.placeerror));
        return true;
    }

    if (pendingResult.redirect && pendingResult.stage.equals('payment')) {
        if (currentSite.getCustomPreferenceValue('enableErrorMailService')) {
            utils.sendErrorNotification(req.querystring.order_id, worldpayConstants.ORDER_STATUS_PENDINGERROR, paymentMethod);
        }
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', pendingResult.placeerror));
        return true;
    }

    if (pendingResult.redirect && pendingResult.stage.equals('orderConfirm')) {
                // trigger order confirmation email
        checkoutHelper.sendConfirmationEmail(order, req.locale.id);
        res.render('/checkout/orderConfirmForm', {
            error: false,
            orderID: orderObj.orderNo,
            orderToken: orderObj.orderToken,
            continueUrl: URLUtils.url('Order-Confirm').toString()
        });
        return true;
    }
    return false;
}
/**
 * this method is for process the PaymentStatus
 * @param {Object} paymentStatus - transaction payment status
 * @param {string} orderInformation - orderInformation Object
 * @param {Object} currentSite - currentSite object
 * @param {dw.order.Order} orderObj - the order object
 * @param {Object} res - dw Response object
 *  @param {Object} paymentMethod - paymentMethod Object
 * @return {Object} returns an true or false
 */
function sendCancelledStatus(paymentStatus, orderInformation, currentSite, orderObj, res, paymentMethod) {
    var order = orderObj;
    if (undefined !== paymentStatus && (paymentStatus.equals(worldpayConstants.CANCELLEDSTATUS) || paymentStatus.equals(worldpayConstants.REFUSED))) {
        if (require('*/cartridge/scripts/common/utils').verifyMac(orderInformation.mac,
        orderInformation.orderKey,
        orderInformation.orderAmount,
        orderInformation.orderCurrency,
        orderInformation.orderStatus).error) {
            if (currentSite.getCustomPreferenceValue('enableErrorMailService')) {
                utils.sendErrorNotification(order.orderNo, worldpayConstants.WORLDPAY_MAC_MISSING_VAL, paymentMethod);
            }
            res.redirect(URLUtils.url('Cart-Show'));
            return true;
        }
        if (paymentStatus.equals(worldpayConstants.CANCELLEDSTATUS)) {
            var ArrayList = require('dw/util/ArrayList');
            Transaction.wrap(function () {
                order.custom.transactionStatus = new ArrayList('POST_AUTH_CANCELLED');
            });
            return false;
        }
    }
    return false;
}
/**
 *  Handle Ajax after order review page palce order
 */
server.get('Submit',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var order = OrderMgr.getOrder(req.querystring.order_id);
        var Site = require('dw/system/Site');
        var currentSite = Site.getCurrent();
        var error;
        if (!empty(session.privacy.currentOrderNo)) {
            delete session.privacy.currentOrderNo;
        }
        if (!order && req.querystring.order_token !== order.getOrderToken()) {
            res.redirect(URLUtils.url('Cart-Show'));
            return next();
        }
    // Check payment processor as worldpay
        var authResult;

        var paymentProcessor = getPaymentProcessor(order);
        var paymentMethod = paymentProcessor.paymentMethod;
        var paymentInstrument = paymentProcessor.paymentInstrument;
        if (paymentProcessor.isWorldpayPaymentProcessor === true) {
            var paymentStatus = req.querystring.paymentStatus;
            Logger.getLogger('worldpay').debug('paymentStatus is :' + paymentStatus);
            if (undefined !== paymentStatus && paymentStatus[0] === worldpayConstants.AUTHORIZED) {
                paymentStatus = worldpayConstants.AUTHORIZED;
            }
            if (undefined !== paymentStatus && paymentStatus[1] === worldpayConstants.PENDING) {
                paymentStatus = worldpayConstants.PENDING;
            }
            Logger.getLogger('worldpay').debug(req.querystring.order_id + ' orderid COPlaceOrder paymentStatus ' + paymentStatus);
            if (undefined !== paymentStatus && paymentStatus.equals(worldpayConstants.AUTHORIZED)) {
                var resultTest = coAuthorizationResult(paymentStatus, paymentMethod, paymentInstrument, order, req, res);
                if (resultTest.next) {
                    return next();
                }
                authResult = resultTest.authResult;
            } else if (undefined !== paymentStatus && paymentStatus.equals(worldpayConstants.PENDING)) {
                var result = sendPendingResult(req, res, currentSite);
                if (result) {
                    return next();
                }
            } else {
                var orderInformation = utils.getWorldpayOrderInfo(paymentStatus);
                Logger.getLogger('worldpay').debug('Entered refused flow');
                Transaction.wrap(function () {
                    order.custom.WorldpayLastEvent = worldpayConstants.REFUSED;
                });

                if (!paymentMethod.equals(worldpayConstants.KLARNA) &&
                !paymentMethod.equals(worldpayConstants.KLARNASLICEIT) &&
                !paymentMethod.equals(worldpayConstants.KLARNAPAYLATER) &&
                !paymentMethod.equals(worldpayConstants.KLARNAPAYNOW) &&
                !paymentMethod.equals(worldpayConstants.IDEAL) &&
                !paymentMethod.equals(worldpayConstants.PAYPAL) &&
                !paymentMethod.equals(worldpayConstants.PAYPAL_SSL) &&
                !paymentMethod.equals(worldpayConstants.WORLDPAY) &&
                !paymentMethod.equals(worldpayConstants.CHINAUNIONPAY)) {
                    var sendCancelledResult = sendCancelledStatus(paymentStatus, orderInformation, currentSite, order, res, paymentMethod);
                    if (sendCancelledResult) {
                        return next();
                    }
                }
                error = utils.worldpayErrorMessage();
                if (paymentMethod.equals(worldpayConstants.KONBINI)) {
                    Logger.getLogger('worldpay').debug('entered konbini flow');
                    Transaction.wrap(function () {
                        OrderMgr.cancelOrder(order);
                    });
                    res.redirect(URLUtils.url('Cart-Show'));
                } else {
                    Transaction.wrap(function () {
                        OrderMgr.failOrder(order, true);
                        Logger.getLogger('worldpay').debug('failing the order');
                    });
                    if (currentSite.getCustomPreferenceValue('enableErrorMailService')) {
                        if (paymentMethod === 'Worldpay') {
                            utils.sendErrorNotification(req.querystring.order_id, worldpayConstants.REFUSED_STATUS_ORDER, paymentMethod);
                        } else {
                            utils.sendErrorNotification(req.querystring.order_id, worldpayConstants.ORDER_STATUS_CANCELLED, paymentMethod);
                        }
                    }
                    res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'placeerror', error.errorMessage));
                }
                return next();
            }
            var orderPlacementStatus = checkoutHelper.placeOrder(order);

            if (orderPlacementStatus.error) {
                if (currentSite.getCustomPreferenceValue('enableErrorMailService')) {
                    utils.sendErrorNotification(req.querystring.order_id, worldpayConstants.ORDER_STATUS_CANCELLED, paymentMethod);
                }
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', Resource.msg('error.technical', 'checkout', null)));
                return next();
            }

            var config = {
                numberOfLineItems: '*'
            };
            var orderModel = new OrderModel(order, { config: config });
            if (paymentMethod.equals(worldpayConstants.KLARNASLICEIT) ||
            paymentMethod.equals(worldpayConstants.KLARNAPAYLATER) ||
            paymentMethod.equals(worldpayConstants.KLARNAPAYNOW) ||
            paymentMethod.equals(worldpayConstants.KLARNA)) {
                if (authResult) {
                    authResult.reference = StringUtils.decodeString(StringUtils.decodeBase64(authResult.reference), StringUtils.ENCODE_TYPE_HTML);
                    authResult.reference = authResult.reference.replace('window.location.href', 'window.top.location.href');
                }
            }
            if (req.currentCustomer.addressBook) {
                // save all used shipping addresses to address book of the logged in customer
                var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
                var allAddresses = addressHelpers.gatherShippingAddresses(order);
                allAddresses.forEach(function (address) {
                    if (!addressHelpers.checkIfAddressStored(address, req.currentCustomer.addressBook.addresses)) {
                        addressHelpers.saveAddress(address, req.currentCustomer, addressHelpers.generateAddressName(address));
                    }
                });
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
                    klarnaConfirmationSnippet: ((paymentMethod.equals(worldpayConstants.KLARNA) ||
                    paymentMethod.equals(worldpayConstants.KLARNASLICEIT) ||
                    paymentMethod.equals(worldpayConstants.KLARNAPAYLATER) ||
                    paymentMethod.equals(worldpayConstants.KLARNAPAYNOW)) && authResult) ? authResult.reference : '',
                    orderUUID: order.getUUID()
                });
            } else {
                res.render('checkout/confirmation/confirmation', {
                    order: orderModel,
                    returningCustomer: true,
                    klarnaConfirmationSnippet: ((paymentMethod.equals(worldpayConstants.KLARNA) ||
                    paymentMethod.equals(worldpayConstants.KLARNASLICEIT) ||
                    paymentMethod.equals(worldpayConstants.KLARNAPAYLATER) ||
                    paymentMethod.equals(worldpayConstants.KLARNAPAYNOW)) && authResult) ? authResult.reference : '',
                    orderUUID: order.getUUID()
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
    var Site = require('dw/system/Site');
    if (!order && req.querystring.order_token !== order.getOrderToken()) {
        return next(new Error(Resource.msg('error.applepay.token.mismatch', 'checkout', null)));
    }
    var orderObj = {
        orderNo: req.querystring.order_id,
        orderToken: req.querystring.order_token
    };
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', order, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);

    if (fraudDetectionStatus.status === 'fail') {
        Transaction.wrap(function () {
            OrderMgr.failOrder(order, true);
        });
        if (Site.getCurrent().getCustomPreferenceValue('enableErrorMailService')) {
            utils.sendErrorNotification(order.orderNo, worldpayConstants.FRAUD_DETECTION, 'DW_APPLE_PAY');
        }

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
        if (Site.getCurrent().getCustomPreferenceValue('enableErrorMailService')) {
            utils.sendErrorNotification(order.orderNo, worldpayConstants.FRAUD_DETECTION, 'DW_APPLE_PAY');
        }
        res.json({
            error: true,
            errorMessage: Resource.msg('error.applepay.place.order', 'checkout', null)
        });
        return next();
    }
    checkoutHelper.sendConfirmationEmail(order, req.locale.id);
    res.render('/checkout/orderConfirmForm', {
        error: false,
        orderID: orderObj.orderNo,
        orderToken: orderObj.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString()
    });
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
