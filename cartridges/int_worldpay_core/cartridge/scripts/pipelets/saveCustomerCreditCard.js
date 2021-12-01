/**
 * This script attempts to add the credit card details provided
 * as input parameters to the customer payment instrument.
 *
 * @input PaymentInstrument : dw.customer.CustomerPaymentInstrument
 * @input PaymentTokenID : String
 * @input CreditCardNumber : String
 * @input CreditCardExpirationMonth : Number
 * @input CreditCardExpirationYear : Number
 * @input CreditCardType : String
 * @input CreditCardHolder : String
 */
var Logger = require('dw/system/Logger');
var PaymentMgr = require('dw/order/PaymentMgr');

/**
 * This method attempts to set credit card details
 * @param {dw.customer.CustomerPaymentInstrument} paymentInstr - Payment Instrument
 * @param {string} creditCardNumber - Credit Card Number
 * @param {number} creditCardExpirationMonth - Expiration Month
 * @param {number} creditCardExpirationYear - Expiration Year
 * @param {string} creditCardHolder - Holder
 */
function setCreditCardDetails(paymentInstr, creditCardNumber, creditCardExpirationMonth, creditCardExpirationYear, creditCardHolder) {
    // copy the credit card details to the payment instrument
    if (!paymentInstr.getCreditCardHolder() && creditCardHolder) {
        paymentInstr.setCreditCardHolder(creditCardHolder);
    }
    if (!paymentInstr.getCreditCardNumber() && creditCardNumber) {
        paymentInstr.setCreditCardNumber(creditCardNumber);
    }
    if (!paymentInstr.getCreditCardExpirationMonth() && creditCardExpirationMonth) {
        paymentInstr.setCreditCardExpirationMonth(creditCardExpirationMonth);
    }
    if (!paymentInstr.getCreditCardExpirationYear() && creditCardExpirationYear) {
        paymentInstr.setCreditCardExpirationYear(creditCardExpirationYear);
    }
}

/**
 * This method attempts to set the credit card type
 * @param {dw.customer.CustomerPaymentInstrument} paymentInstr - Payment Instrument
 * @param {string} creditCardType - Card type
 */
function setCardType(paymentInstr, creditCardType) {
    var cardList = PaymentMgr.getPaymentMethod(paymentInstr.paymentMethod).getActivePaymentCards();
    if (cardList) {
        var cardItr = cardList.iterator();
        paymentInstr.setCreditCardType('Visa');
        while (cardItr.hasNext()) {
            var paymentCard = cardItr.next();
            if (paymentCard.custom.worldPayCardType) {
                var ccType = creditCardType.substring(0, creditCardType.toString().indexOf('-'));
                var paymentCardType = paymentCard.custom.worldPayCardType.substring(0, paymentCard.custom.worldPayCardType.toString().indexOf('-'));
                if (ccType.equalsIgnoreCase(paymentCardType)) {
                    paymentInstr.setCreditCardType(paymentCard.cardType);
                    break;
                }
            }
        }
    }
}

/**
 * This script attempts to add the credit card details provided
 * as input parameters to the customer payment instrument.
 * @param {dw.customer.CustomerPaymentInstrument} paymentInstrument - Payment Instrument
 * @param {string} paymentTokenID - Token ID
 * @param {string} creditCardNumber - Credit Card Number
 * @param {number} creditCardExpirationMonth - Expiration Month
 * @param {number} creditCardExpirationYear - Expiration Year
 * @param {string} creditCardType - Card type
 * @param {string} creditCardHolder - Holder
 * @return {Object} returns an object
 */
function saveCustomerCreditCard(paymentInstrument, paymentTokenID, creditCardNumber, creditCardExpirationMonth, creditCardExpirationYear, creditCardType, creditCardHolder) {
    var paymentInstr = paymentInstrument;
    var Site = require('dw/system/Site');
    var tokenType = Site.getCurrent().getCustomPreferenceValue('tokenType');

    if (paymentInstr == null) {
    // no payment instrument given
        Logger.debug('No customer payment instrument given to store credit card data');
        return { success: false };
    }

    if (!paymentInstrument.METHOD_CREDIT_CARD.equals(paymentInstr.paymentMethod) && paymentInstr.paymentMethod !== 'Worldpay') {
    // given payment instrument not a credit card
        Logger.debug('Customer payment instrument is of type {0}, type {1} required.', paymentInstr.paymentMethod, paymentInstrument.METHOD_CREDIT_CARD);
        return { success: false };
    }
    setCreditCardDetails(paymentInstr, creditCardNumber, creditCardExpirationMonth, creditCardExpirationYear, creditCardHolder);
    if (!paymentInstr.getCreditCardType() && creditCardType) {
        setCardType(paymentInstr, creditCardType);
    }

    if (!paymentInstr.getCreditCardToken() && paymentTokenID) {
        paymentInstr.setCreditCardToken(paymentTokenID);
        if (tokenType) {
            paymentInstr.custom.tokenScope = tokenType;
        } else {
            paymentInstr.custom.tokenScope = 'shopper';
        }
    }

    return { success: true };
}
/** Exported functions **/
module.exports = {
    saveCustomerCreditCard: saveCustomerCreditCard
};
