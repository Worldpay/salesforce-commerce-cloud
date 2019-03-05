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
 * This script attempts to add the credit card details provided
 * as input parameters to the customer payment instrument.
 * @param {dw.customer.CustomerPaymentInstrument} PaymentInstrument - Payment Instrument
 * @param {string} PaymentTokenID - Token ID
 * @param {string} CreditCardNumber - Credit Card Number
 * @param {number} CreditCardExpirationMonth - Expiration Month
 * @param {number} CreditCardExpirationYear - Expiration Year
 * @param {string} CreditCardType - Card type
 * @param {string} CreditCardHolder - Holder
 * @return {Object} returns an object
 */
function saveCustomerCreditCard(PaymentInstrument, PaymentTokenID, CreditCardNumber, CreditCardExpirationMonth, CreditCardExpirationYear, CreditCardType, CreditCardHolder) {
    var paymentInstr = PaymentInstrument;
    var paymentTokenID = PaymentTokenID;
    var creditCardNumber = CreditCardNumber;
    var creditCardExpirationMonth = CreditCardExpirationMonth;
    var creditCardExpirationYear = CreditCardExpirationYear;
    var creditCardType = CreditCardType;
    var creditCardHolder = CreditCardHolder;

    if (paymentInstr == null) {
    // no payment instrument given
        Logger.debug('No customer payment instrument given to store credit card data');
        return { success: false };
    }

    if (!PaymentInstrument.METHOD_CREDIT_CARD.equals(paymentInstr.paymentMethod)) {
    // given payment instrument not a credit card
        Logger.debug('Customer payment instrument is of type {0}, type {1} required.', paymentInstr.paymentMethod, PaymentInstrument.METHOD_CREDIT_CARD);
        return { success: false };
    }

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
    if (!paymentInstr.getCreditCardType() && creditCardType) {
        var cardList = PaymentMgr.getPaymentMethod(paymentInstr.paymentMethod).getActivePaymentCards();
        if (cardList) {
            var cardItr = cardList.iterator();
            var paymentCard;
            paymentInstr.setCreditCardType('Visa');
            while (cardItr.hasNext()) {
                paymentCard = cardItr.next();
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

    if (!paymentInstr.getCreditCardToken() && paymentTokenID) {
        paymentInstr.setCreditCardToken(paymentTokenID);
    }

    return { success: true };
}
/** Exported functions **/
module.exports = {
    saveCustomerCreditCard: saveCustomerCreditCard
};
