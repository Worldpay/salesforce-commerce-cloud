'use strict';
var Site = require('dw/system/Site');
/**
 * Update Token details in customer payment cards
 * @param {Object} responseData service response object
 * @param {dw.customer.Customer} customerObj - The customer object
 * @param {dw.order.PaymentInstrument} paymentInstrument - The payment instrument
 * @return {Object} returns an json object
 */
function addOrUpdateToken(responseData, customerObj, paymentInstrument) {
    var tokenType = Site.getCurrent().getCustomPreferenceValue('tokenType');
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var Transaction = require('dw/system/Transaction');
    if ((customerObj && responseData.authenticatedShopperID.valueOf().toString() === customerObj.profile.customerNo) || (tokenType)) {
        var wallet = customerObj.getProfile().getWallet();
        var paymentInstruments = wallet.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
        var matchedPaymentInstrument = require('*/cartridge/scripts/common/paymentInstrumentUtils').getTokenPaymentInstrument(
            paymentInstruments, paymentInstrument.creditCardNumber,
            paymentInstrument.creditCardType, paymentInstrument.creditCardExpirationMonth, paymentInstrument.creditCardExpirationYear);

        if (matchedPaymentInstrument == null) {
            Transaction.begin();
            var newPaymentInstrument = wallet.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);
            var cardNumberToSave = '';
            if (responseData.cardNumber.valueOf().toString()) {
                cardNumberToSave = responseData.cardNumber.valueOf().toString();
            } else {
                cardNumberToSave = paymentInstrument.creditCardNumber;
            }
            newPaymentInstrument = require('*/cartridge/scripts/common/paymentInstrumentUtils').copyPaymentCardToInstrument(newPaymentInstrument,
                cardNumberToSave, responseData.cardBrand.valueOf().toString(),
                Number(responseData.cardExpiryMonth.valueOf()), Number(responseData.cardExpiryYear.valueOf()),
                responseData.cardHolderName.valueOf().toString(), responseData.paymentTokenID.valueOf().toString(), responseData.bin.valueOf().toString());
            if (!(newPaymentInstrument && newPaymentInstrument.getCreditCardNumber() && newPaymentInstrument.getCreditCardExpirationMonth() &&
                    newPaymentInstrument.getCreditCardExpirationYear() && newPaymentInstrument.getCreditCardType() &&
                    newPaymentInstrument.getCreditCardHolder())) {
                Transaction.rollback();
            }
            Transaction.commit();
        } else if (!matchedPaymentInstrument.getCreditCardToken()) {
            Transaction.wrap(function () {
                matchedPaymentInstrument = require('*/cartridge/scripts/common/paymentInstrumentUtils').copyPaymentCardToInstrument(
                    matchedPaymentInstrument, null, null, null, null, null, responseData.paymentTokenID.valueOf().toString(), responseData.bin.valueOf().toString());
            });
        }
    }
    return {
        success: true
    };
}

/**
 * Update Token Identifier details in customer payment cards
 * @param {Object} responseData service response object
 * @param {dw.customer.Customer} customerObj - The customer object
 * @param {dw.order.PaymentInstrument} paymentInstrument - The payment instrument
 * @return {Object} returns an json object
 */
function addOrUpdateIdentifier(responseData, customerObj, paymentInstrument) {
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var Transaction = require('dw/system/Transaction');
    var wallet = customerObj.getProfile().getWallet();
    var paymentInstruments = wallet.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
    var matchedPaymentInstrument = require('*/cartridge/scripts/common/paymentInstrumentUtils').getTokenPaymentInstrument(
        paymentInstruments, paymentInstrument.creditCardNumber, paymentInstrument.creditCardType,
        paymentInstrument.creditCardExpirationMonth, paymentInstrument.creditCardExpirationYear);
    if (matchedPaymentInstrument == null) {
        Transaction.begin();
        var newPaymentInstrument = wallet.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);
        newPaymentInstrument = require('*/cartridge/scripts/common/paymentInstrumentUtils').copyPaymentCardToInstrumentfortransID(
            newPaymentInstrument, responseData.cardNumber.valueOf().toString(),
            responseData.cardBrand.valueOf().toString(), Number(responseData.cardExpiryMonth.valueOf()), Number(responseData.cardExpiryYear.valueOf()),
            responseData.cardHolderName.valueOf().toString(), responseData.transactionIdentifier.valueOf().toString());
        if (!(newPaymentInstrument && newPaymentInstrument.getCreditCardNumber() && newPaymentInstrument.getCreditCardExpirationMonth() &&
            newPaymentInstrument.getCreditCardExpirationYear() && newPaymentInstrument.getCreditCardType() && newPaymentInstrument.getCreditCardHolder())) {
            Transaction.rollback();
        }
    }
    Transaction.wrap(function () {
        matchedPaymentInstrument = require('*/cartridge/scripts/common/paymentInstrumentUtils').copyPaymentCardToInstrumentfortransID(
            matchedPaymentInstrument, null, null, null, null, null, responseData.transactionIdentifier.valueOf().toString());
    });
    return {
        success: true
    };
}

/**
 * This method get TokenizationPref value
 * @return {boolean} boolean representation for EnableTokenizationPref
 */
function getTokenPref() {
    var enableTokenizationPref = Site.getCurrent().getCustomPreferenceValue('WorldpayEnableTokenization');
    if (Site.getCurrent().getCustomPreferenceValue('enableStoredCredentials')) {
        enableTokenizationPref = true;
    }
    return enableTokenizationPref;
}
/**
 * Check Authorization response as last event from worldpay
 * @param {Object} serviceResponse service response object
 * @param {dw.order.PaymentInstrument} paymentInstrument - The payment instrument
 * @param {dw.customer.Customer} customerObj - The customer object
 * @return {Object} returns an json object
 */
function checkAuthorization(serviceResponse, paymentInstrument, customerObj) {
    var Resource = require('dw/web/Resource');
    var enableTokenizationPref = getTokenPref();
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    if (serviceResponse.lastEvent.equalsIgnoreCase(worldpayConstants.AUTHORIZED) ||
        (Site.getCurrent().getCustomPreferenceValue('enableSalesrequest') && serviceResponse.lastEvent.equalsIgnoreCase(worldpayConstants.CAPTURED))) {
        if (paymentInstrument != null && paymentInstrument.paymentMethod.equals(worldpayConstants.ELV)) {
            return {
                authorized: true,
                echoData: ''
            };
        }
        if (enableTokenizationPref && customerObj != null && customerObj.authenticated && (serviceResponse.paymentTokenID)) {
            addOrUpdateToken(serviceResponse, customerObj, paymentInstrument);
        }
        if (Site.getCurrent().getCustomPreferenceValue('enableStoredCredentials') && customerObj != null && customerObj.authenticated &&
            paymentInstrument && !paymentInstrument.custom.transactionIdentifier && request.clientId !== 'dw.csc') {
            addOrUpdateIdentifier(serviceResponse, customerObj, paymentInstrument);
        }
        return {
            authorized: true,
            echoData: serviceResponse.is3DSecure ? serviceResponse.echoData : ''
        };
    } else if (serviceResponse.lastEvent.equalsIgnoreCase(worldpayConstants.CANCELLEDSTATUS)) {
        return {
            error: true,
            errorMessage: Resource.msg('worldpay.error.codecancelled', 'worldpayerror', null)
        };
    }
    return {
        error: true,
        errorkey: 'worldpay.error.code' + serviceResponse.errorCode,
        errorMessage: Resource.msg('worldpay.error.code' + serviceResponse.errorCode, 'worldpayerror', null)
    };
}
exports.addOrUpdateIdentifier = addOrUpdateIdentifier;
exports.checkAuthorization = checkAuthorization;
exports.addOrUpdateToken = addOrUpdateToken;
