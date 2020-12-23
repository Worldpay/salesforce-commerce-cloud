/**
* Demandware Script File
* This script returns the token ID & matched payment instrument from the saved payment cards for authenticated user.
* Match criteria - last 4 digit of card and card type must be same
*
 * @param {dw.util.Collection} customerPaymentInstruments customer payment instrument list.
 * @param {string} cardNumber -  cardNumber.
 * @param {string} cardType -  cardType.
 * @param {string} expirationMonth -  expirationMonth.
 * @param {string} expirationYear -  expirationYear.
 * @return {Object} returns an json object having MatchedCustomerPaymentInstrument.
*/
function getPaymentCardToken(customerPaymentInstruments, cardNumber, cardType, expirationMonth, expirationYear) {
    var Logger = require('dw/system/Logger');
    var paymentTokenID = null;
    var matchedCustomerPaymentInstrument = null;
    var creditCardInstrument = null;
    try {
        // find credit card in payment instruments
        creditCardInstrument = require('*/cartridge/scripts/common/PaymentInstrumentUtils').getTokenPaymentInstrument(
            customerPaymentInstruments, cardNumber, cardType, expirationMonth, expirationYear);
        if (creditCardInstrument) {
            matchedCustomerPaymentInstrument = creditCardInstrument;
            if (creditCardInstrument.getCreditCardToken()) {
                paymentTokenID = creditCardInstrument.getCreditCardToken();
            }
        }
    } catch (ex) {
        Logger.getLogger('worldpay').error('GetPaymentCardToken error recieved : ' + ex.message);
        return { success: false, paymentTokenID: paymentTokenID, matchedCustomerPaymentInstrument: matchedCustomerPaymentInstrument };
    }
    return { success: true, paymentTokenID: paymentTokenID, matchedCustomerPaymentInstrument: matchedCustomerPaymentInstrument };
}
/** Exported functions **/
module.exports = {
    getPaymentCardToken: getPaymentCardToken
};
