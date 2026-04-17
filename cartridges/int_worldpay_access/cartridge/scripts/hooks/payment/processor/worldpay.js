/* eslint-disable valid-jsdoc */

'use strict';

const Transaction = require('dw/system/Transaction');
const Logger = require('dw/system/Logger');
const Resource = require('dw/web/Resource');

const awpConstants = require('*/cartridge/scripts/common/awpConstants');

/**
 * Handle: called at SubmitPayment
 * - For HPP (Access), we don't collect card data in SFRA.
 * - For CheckoutSDK, we must persist sessionHref (worldpaySessionState) on the PI custom attributes.
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

            const pi = basket.createPaymentInstrument(paymentMethodID, basket.totalGrossPrice);

            if (String(paymentMethodID) === String(awpConstants.WORLDPAY_CHECKOUTSDK)) {
                const sessionHref = paymentInformation && paymentInformation.worldpaySessionState
                    ? String(paymentInformation.worldpaySessionState)
                    : '';

                if (sessionHref) {
                    pi.custom.awpSessionHref = sessionHref;
                } else { 
                    Logger.getLogger('awp').warn('CheckoutSDK Handle: missing worldpaySessionState/sessionHref on SubmitPayment');
                }

                let chn = paymentInformation && paymentInformation.wpCardholderName
                    ? String(paymentInformation.wpCardholderName)
                    : '';
                chn = chn.replace(/\s+/g, ' ').trim();
                Logger.getLogger('awp').info('CheckoutSDK Handle: read cardholder name "{0}" from paymentInformation for CheckoutSDK', chn);
                if (chn) {
                    pi.custom.awpCardHolderName = chn;
                }

                if (paymentInformation && paymentInformation.awpSaveCard) {
                    pi.custom.awpSaveCard = true;
                }

            }
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
 * - We do not perform gateway auth here.
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
        Logger.getLogger('awp').error('Worldpay.Authorize exception: {0}', e);
        return { authorized: false, error: true };
    }
};
