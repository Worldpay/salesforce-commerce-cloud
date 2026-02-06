/* eslint-disable valid-jsdoc */

'use strict';

const Transaction = require('dw/system/Transaction');
const Logger = require('dw/system/Logger');
const Resource = require('dw/web/Resource');

/**
 * Handle: called at SubmitPayment
 * - For HPP (Access), we don't collect card data in SFRA.
 * - We just ensure a single PI exists with the selected payment method and basket total.
 *
 * @param {dw.order.Basket} basket
 * @param {Object} paymentInformation
 * @param {String} paymentMethodID
 * @param {dw.system.Request} req
 * @returns {{fieldErrors: Object[], serverErrors: String[], error: boolean}}
 */
/* eslint-disable-next-line no-unused-vars */
exports.Handle = function Handle(basket, paymentInformation, paymentMethodID, req) {
    try {
        Transaction.wrap(function () {
            basket.removeAllPaymentInstruments();
            basket.createPaymentInstrument(paymentMethodID, basket.totalGrossPrice);
        });
        return { error: false, fieldErrors: [], serverErrors: [] };
    } catch (e) {
        Logger.getLogger('awp').error('Worldpay.Handle exception: {0}', e);
        return { 
            error: true, 
            fieldErrors: [], 
            serverErrors: [Resource.msg('error.technical', 'checkout', null)] 
        };
    }
};

/**
 * Authorize: called during PlaceOrder
 * - For HPP we do not perform gateway auth here.
 * - We just attach the processor & a provisional transactionID so SFRA can place the order.
 *
 * @param {dw.order.Order} order
 * @param {dw.order.PaymentInstrument} paymentInstrument
 * @param {dw.order.PaymentProcessor} paymentProcessor
 * @returns {{authorized: boolean, error: boolean}}
 */
exports.Authorize = function Authorize(order, paymentInstrument, paymentProcessor) {
    try {
        Transaction.wrap(function () {
            const paymentTransaction = paymentInstrument.getPaymentTransaction();
            paymentTransaction.setPaymentProcessor(paymentProcessor);
            paymentTransaction.setTransactionID(order.orderNo);
        });
        return { authorized: true, error: false };
    } catch (e) {
        return { authorized: false, error: true };
    }
};
