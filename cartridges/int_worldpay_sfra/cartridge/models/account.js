'use strict';

var base = module.superModule;
var URLUtils = require('dw/web/URLUtils');

/**
 * Creates a plain object that contains payment instrument information
 * @param {Object} userPaymentInstruments - current customer's paymentInstruments
 * @returns {Object} object that contains info about the current customer's payment instruments
 */
function getCustomerPaymentInstruments(userPaymentInstruments) {
    var paymentInstruments;

    paymentInstruments = userPaymentInstruments.map(function (paymentInstrument) {
        var result = {
            creditCardHolder: paymentInstrument.creditCardHolder,
            maskedCreditCardNumber: paymentInstrument.maskedCreditCardNumber,
            creditCardType: paymentInstrument.creditCardType,
            creditCardExpirationMonth: paymentInstrument.creditCardExpirationMonth,
            creditCardExpirationYear: paymentInstrument.creditCardExpirationYear,
            UUID: paymentInstrument.UUID,
            binToken: (Object.prototype.hasOwnProperty.call(paymentInstrument.raw.custom, 'binToken')) ? paymentInstrument.raw.custom.binToken : null
        };

        result.cardTypeImage = {
            src: URLUtils.staticURL('/images/' +
                paymentInstrument.creditCardType.toLowerCase().replace(/\s/g, '') +
                '-dark.svg'),
            alt: paymentInstrument.creditCardType
        };

        return result;
    });

    return paymentInstruments;
}

/**
 * Account class that represents the current customer's profile dashboard
 * @param {dw.customer.Customer} currentCustomer - Current customer
 * @param {Object} addressModel - The current customer's preferred address
 * @param {Object} orderModel - The current customer's order history
 * @constructor
 */
function account(currentCustomer, addressModel, orderModel) {
    base.call(this, currentCustomer, addressModel, orderModel);
    this.customerPaymentInstruments = currentCustomer.wallet
    && currentCustomer.wallet.paymentInstruments
        ? getCustomerPaymentInstruments(currentCustomer.wallet.paymentInstruments)
        : null;
}
account.getCustomerPaymentInstruments = getCustomerPaymentInstruments;
module.exports = account;
