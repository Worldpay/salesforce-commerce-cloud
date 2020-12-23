'use strict';
var PaymentMgr = require('dw/order/PaymentMgr');
/**
* This Method returns the token ID & matched payment instrument from the saved payment cards for authenticated user.
* Match criteria - last 4 digit of card and card type must be same
* @param {dw.order.PaymentInstrument} customerPaymentInstruments customer payment instrument list.
* @param {string} cardNumber -  cardNumber.
* @param {string} cardType -  cardType.
* @param {string} expirationMonth -  expirationMonth.
* @param {string} expirationYear -  expirationYear.
* @return {dw.order.PaymentInstrument  } the last called URL
*/
function getTokenPaymentInstrument(customerPaymentInstruments, cardNumber, cardType, expirationMonth, expirationYear) {
    var cardTypeMatch = false;
    var creditCardInstrument = null;
    var paymentCard = null;
    // find credit card in payment instruments
    if (customerPaymentInstruments && cardNumber && cardType && expirationMonth && expirationYear) {
        var cardExpirationMonth = Number(expirationMonth);
        var cardExpirationYear = Number(expirationYear);
        var instrumentsIter = customerPaymentInstruments.iterator();
        while (instrumentsIter.hasNext()) {
            creditCardInstrument = instrumentsIter.next();
            if (!creditCardInstrument.creditCardNumber) {
                continue;
            }
            paymentCard = PaymentMgr.getPaymentCard(creditCardInstrument.creditCardType);
            // card type match
            cardTypeMatch = paymentCard != null && cardType.equalsIgnoreCase(paymentCard.custom.worldPayCardType) ? true : cardType.equalsIgnoreCase(creditCardInstrument.creditCardType);
            // find token ID exists for matching payment card
            if (cardTypeMatch && cardExpirationMonth === creditCardInstrument.getCreditCardExpirationMonth() && cardExpirationYear === creditCardInstrument.getCreditCardExpirationYear() &&
          cardNumber.substring(cardNumber.length - 4).equals(creditCardInstrument.creditCardNumber.substring(creditCardInstrument.creditCardNumber.length - 4))) {
                return creditCardInstrument;
            }
        }
    }
    return null;
}

/**
*  Copy payment card to instruments
* @param {dw.order.PaymentInstrument} paymentInstr - customer payment instrument list.
* @param {string} ccNumber -  cardNumber.
* @param {string} ccType -  cardType.
* @param {string} ccExpiryMonth -  expirationMonth.
* @param {string} ccExpiryYear -  expirationYear.
* @param {string} ccHolder -  ccHolder.
* @param {string} ccToken -  ccToken.
* @return {dw.order.PaymentInstrument} payment Instruments
*/
function copyPaymentCardToInstrument(paymentInstr, ccNumber, ccType, ccExpiryMonth, ccExpiryYear, ccHolder, ccToken, bin) {
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var paymentTokenID = ccToken;
    var Site = require('dw/system/Site');
    var tokenType = Site.getCurrent().getCustomPreferenceValue('tokenType');
    var creditCardNumber = ccNumber;
    var creditCardExpirationMonth = ccExpiryMonth;
    var creditCardExpirationYear = ccExpiryYear;
    var creditCardType = ccType;
    var creditCardHolder = ccHolder;

    if (paymentInstr == null) {
        return null;
    }

    if (!PaymentInstrument.METHOD_CREDIT_CARD.equals(paymentInstr.paymentMethod)) {
        return null;
    }
    var Transaction = require('dw/system/Transaction');
    Transaction.wrap(function () {
  // copy the credit card details to the payment instrument
        if (!paymentInstr.getCreditCardHolder() && creditCardHolder) {
            paymentInstr.setCreditCardHolder(creditCardHolder);
        }
        if (!paymentInstr.getCreditCardNumber() && creditCardNumber) {
            paymentInstr.setCreditCardNumber(creditCardNumber);
        }
        if (!paymentInstr.getCreditCardExpirationMonth() && creditCardExpirationMonth) {
            paymentInstr.setCreditCardExpirationMonth(typeof (creditCardExpirationMonth) === 'object' ? creditCardExpirationMonth.valueOf() : creditCardExpirationMonth);
        }
        if (!paymentInstr.getCreditCardExpirationYear() && creditCardExpirationYear) {
            paymentInstr.setCreditCardExpirationYear(typeof (creditCardExpirationYear) === 'object' ? creditCardExpirationYear.valueOf() : creditCardExpirationYear);
        }
        if (!paymentInstr.getCreditCardType() && creditCardType) {
        	var newCCType = creditCardType.toString().replace(/_DEBIT|_CREDIT|_ELECTRON/g ,"");
            var cardList = PaymentMgr.getPaymentMethod(paymentInstr.paymentMethod).getActivePaymentCards();
            if (cardList) {
                var cardItr = cardList.iterator();
                var paymentCard;
                while (cardItr.hasNext()) {
                    paymentCard = cardItr.next();
                    if (paymentCard.custom.worldPayCardType !== null && paymentCard.custom.worldPayCardType.indexOf(newCCType) > -1) {
                        paymentInstr.setCreditCardType(paymentCard.cardType);
                        break;
                    }
                }
            }
        }
        if (!paymentInstr.getCreditCardToken() && paymentTokenID) {
            paymentInstr.setCreditCardToken(paymentTokenID);
            paymentInstr.custom.binToken = bin;
            if(tokenType){
                paymentInstr.custom.tokenScope= tokenType;
                } else {
                	paymentInstr.custom.tokenScope = 'shopper';
                }
        }

    });
    return paymentInstr;
}

/**
*  Copy payment card to instruments to store transaction Identifier
* @param {dw.order.PaymentInstrument} paymentInstr - customer payment instrument list.
* @param {string} ccNumber -  cardNumber.
* @param {string} ccType -  cardType.
* @param {string} ccExpiryMonth -  expirationMonth.
* @param {string} ccExpiryYear -  expirationYear.
* @param {string} ccHolder -  ccHolder.
* @param {string} transactionIdentifier -  transactionIdentifier.
* @return {dw.order.PaymentInstrument} payment Instruments
*/
function copyPaymentCardToInstrumentfortransID(paymentInstr, ccNumber, ccType, ccExpiryMonth, ccExpiryYear, ccHolder, transactionIdentifier) {
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var transactionIdentifier=transactionIdentifier;
    var creditCardNumber = ccNumber;
    var creditCardExpirationMonth = ccExpiryMonth;
    var creditCardExpirationYear = ccExpiryYear;
    var creditCardType = ccType;
    var creditCardHolder = ccHolder;

    if (paymentInstr == null) {
        return null;
    }

    if (!PaymentInstrument.METHOD_CREDIT_CARD.equals(paymentInstr.paymentMethod)) {
        return null;
    }
    var Transaction = require('dw/system/Transaction');
    Transaction.wrap(function () {
  // copy the credit card details to the payment instrument
        if (!paymentInstr.getCreditCardHolder() && creditCardHolder) {
            paymentInstr.setCreditCardHolder(creditCardHolder);
        }
        if (!paymentInstr.getCreditCardNumber() && creditCardNumber) {
            paymentInstr.setCreditCardNumber(creditCardNumber);
        }
        if (!paymentInstr.getCreditCardExpirationMonth() && creditCardExpirationMonth) {
            paymentInstr.setCreditCardExpirationMonth(typeof (creditCardExpirationMonth) === 'object' ? creditCardExpirationMonth.valueOf() : creditCardExpirationMonth);
        }
        if (!paymentInstr.getCreditCardExpirationYear() && creditCardExpirationYear) {
            paymentInstr.setCreditCardExpirationYear(typeof (creditCardExpirationYear) === 'object' ? creditCardExpirationYear.valueOf() : creditCardExpirationYear);
        }
        if (!paymentInstr.getCreditCardType() && creditCardType) {
            var cardList = PaymentMgr.getPaymentMethod(paymentInstr.paymentMethod).getActivePaymentCards();
            if (cardList) {
                var cardItr = cardList.iterator();
                var paymentCard;
                while (cardItr.hasNext()) {
                    paymentCard = cardItr.next();
                    if (paymentCard.custom.worldPayCardType !== null && paymentCard.custom.worldPayCardType.indexOf(creditCardType) > -1) {
                        paymentInstr.setCreditCardType(paymentCard.cardType);
                        break;
                    }
                }
            }
        }
        paymentInstr.custom.transactionIdentifier= transactionIdentifier;
    });
    return paymentInstr;
}

/**
 * Hook function to update token details in Payment Instrument.
 * @param {string} responseData -  responseData.
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment instrument object
*/
function updatePaymentInstrumentToken(responseData, paymentInstrument) {
    var StringUtils = require('dw/util/StringUtils');
    if (responseData != null && paymentInstrument != null && responseData.paymentTokenID != null && StringUtils.trim(responseData.paymentTokenID)) {
        paymentInstrument.custom.wpTokenEvent = responseData.tokenEvent;
        if (!paymentInstrument.creditCardToken) {
            paymentInstrument.setCreditCardToken(responseData.paymentTokenID);
        }
        var Calendar = require('dw/util/Calendar');
        var tokenExpiryCal = new Calendar();
        tokenExpiryCal.set(responseData.paymentTokenExpiryYear, responseData.paymentTokenExpiryMonth, responseData.paymentTokenExpiryDay);
        paymentInstrument.custom.wpPaymentTokenExpiry = tokenExpiryCal.time;
        paymentInstrument.custom.wpTokenEventReference = responseData.tokenEventReference;
        paymentInstrument.custom.wpTokenReason = responseData.tokenReason;

    }
}

/**
 * remove existing payment instrument
 * @param {string} cart - cart
 */
function removeExistingPaymentInstruments(cart) {
    var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
    if (cart != null) {
        var ccPaymentInstrs = cart.getPaymentInstruments();
        if (ccPaymentInstrs && ccPaymentInstrs.length > 0) {
            var iter = ccPaymentInstrs.iterator();
            var existingPI = null;
            while (iter.hasNext()) {
                existingPI = iter.next();
                if (existingPI.paymentMethod != null && PaymentMgr.getPaymentMethod(existingPI.paymentMethod).paymentProcessor.ID.equalsIgnoreCase(WorldpayConstants.WORLDPAY)) {
                    cart.removePaymentInstrument(existingPI);
                }
            }
        }
    }
}

/**
 * Hook function to add Payment details with token ID. This function is called during the xml order
 * creation. This is primarily required for CC direct .
 * @param {Object} billingAddress - billing Address
 * @param {dw.order.PaymentInstrument} paymentInstrument - customer payment instrument list.
 * @param {string} ccCVN -  ccCVN.
 * @return {Object} payment
*/
function getCardPaymentMethodToken(billingAddress, paymentInstrument, ccCVN) {
    var Site = require('dw/system/Site');
    var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
    var tokenType = Site.getCurrent().getCustomPreferenceValue('tokenType');
    if(tokenType === null || tokenType) {
        var payment= new XML('<TOKEN-SSL tokenScope="'+ paymentInstrument.custom.tokenScope.toLowerCase() +'"></TOKEN-SSL>');
    }
    payment.paymentTokenID = paymentInstrument.creditCardToken;

    if (paymentInstrument.creditCardExpirationMonth) {
       payment.paymentInstrument.cardDetails.expiryDate.date.@month=paymentInstrument.creditCardExpirationMonth;
    }
    if (paymentInstrument.creditCardExpirationYear) {
       payment.paymentInstrument.cardDetails.expiryDate.date.@year= paymentInstrument.creditCardExpirationYear;
    }
    if (paymentInstrument.creditCardHolder) {
        payment.paymentInstrument.cardDetails.cardHolderName = paymentInstrument.creditCardHolder;
    }
    var disableCVV = Site.getCurrent().getCustomPreferenceValue('WorldpayDisableCVV');
    if (!disableCVV) {
        payment.paymentInstrument.cardDetails.cvc = ccCVN;
    }
    payment.paymentInstrument.cardDetails.cardAddress.address.firstName = billingAddress.firstName;
    payment.paymentInstrument.cardDetails.cardAddress.address.lastName = billingAddress.lastName;
    payment.paymentInstrument.cardDetails.cardAddress.address.address1 = billingAddress.address1;
    payment.paymentInstrument.cardDetails.cardAddress.address.address2 = (billingAddress.address2 != null) ? billingAddress.address2 : '';
    payment.paymentInstrument.cardDetails.cardAddress.address.postalCode = billingAddress.postalCode;
    payment.paymentInstrument.cardDetails.cardAddress.address.city = billingAddress.city;
    payment.paymentInstrument.cardDetails.cardAddress.address.state = billingAddress.stateCode;
    payment.paymentInstrument.cardDetails.cardAddress.address.countryCode = billingAddress.countryCode.value.toString().toUpperCase();
    payment.paymentInstrument.cardDetails.cardAddress.address.telephoneNumber = billingAddress.phone;

    return payment;
}


function getPaymentTokenForSavedCard (billingAddress, paymentInstrument, ccCVN) {
    var payment= new XML('<TOKEN-SSL tokenScope="'+ paymentInstrument.custom.tokenScope.toLowerCase() + '" captureCvc="true"></TOKEN-SSL>');
    payment.paymentTokenID = paymentInstrument.creditCardToken;
    return payment;
}


/**
 * Hook function to add Payment details. This function is called during the xml order
 * creation. This is primarily required for CC direct .
 * @param {string} paymentMethod -  paymentMethod.
 * @param {Object} billingAddress - billing Address
 * @param {dw.order.PaymentInstrument} paymentInstrument - customer payment instrument list.
 * @param {string} ccCVN -  ccCVN.
 * @param {string} encryptedData - encryptedData
 * @param {string} cardNumber -  cardNumber.
 * @return {Object} payment
*/
function getCardPaymentMethod(orderObj,paymentMethod, billingAddress, paymentInstrument, ccCVN, encryptedData, cardNumber) {
    var Site = require('dw/system/Site');
    var str = '<' + paymentMethod + '/>';
    var payment = new XML(str);
    var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
    if (Site.getCurrent().getCustomPreferenceValue('WorldpayEnableClientSideEncryption')) {
        payment = new XML(WorldpayConstants.CSE);
        payment.encryptedData = encryptedData;
    } else {
        payment.cardNumber = (cardNumber && cardNumber.indexOf('*') < 0) ? cardNumber : paymentInstrument.creditCardNumber;
        payment.expiryDate.date.@month=paymentInstrument.creditCardExpirationMonth;
        payment.expiryDate.date.@year= paymentInstrument.creditCardExpirationYear;
        payment.cardHolderName = paymentInstrument.creditCardHolder;
        var disableCVV = Site.getCurrent().getCustomPreferenceValue('WorldpayDisableCVV');
        if (!disableCVV) {
            if(!(orderObj.createdBy.equals(WorldpayConstants.CUSTOMERORDER)) && session.isUserAuthenticated() && session.privacy.motocvn) {
                ccCVN = session.privacy.motocvn;
                delete session.privacy.motocvn;
            }
            payment.cvc = ccCVN;
        }
    }
    payment.cardAddress.address.firstName = billingAddress.firstName;
    payment.cardAddress.address.lastName = billingAddress.lastName;
    payment.cardAddress.address.address1 = billingAddress.address1;
    payment.cardAddress.address.address2 = (billingAddress.address2 != null) ? billingAddress.address2 : '';
    payment.cardAddress.address.postalCode = billingAddress.postalCode;
    payment.cardAddress.address.city = billingAddress.city;
    payment.cardAddress.address.state = billingAddress.stateCode;
    payment.cardAddress.address.countryCode = billingAddress.countryCode.value.toString().toUpperCase();
    payment.cardAddress.address.telephoneNumber = billingAddress.phone;

    return payment;
}

/** Exported functions **/
module.exports = {
    copyPaymentCardToInstrumentfortransID:copyPaymentCardToInstrumentfortransID,
    getCardPaymentMethod: getCardPaymentMethod,
    getCardPaymentMethodToken: getCardPaymentMethodToken,
    updatePaymentInstrumentToken: updatePaymentInstrumentToken,
    removeExistingPaymentInstruments: removeExistingPaymentInstruments,
    copyPaymentCardToInstrument: copyPaymentCardToInstrument,
    getTokenPaymentInstrument: getTokenPaymentInstrument,
    getPaymentTokenForSavedCard: getPaymentTokenForSavedCard
};
