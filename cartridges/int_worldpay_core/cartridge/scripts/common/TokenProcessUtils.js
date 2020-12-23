'use strict';
var Site = require('dw/system/Site');
/**
 * Update Token details in customer payment cards
 * @param {Object} responseData service response object
 * @param {dw.customer.Customer} customerObj -  The customer object
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument
 * @return {Object} returns an json object
 */
function addOrUpdateToken(responseData, customerObj, paymentInstrument) {
    var tokenType = Site.getCurrent().getCustomPreferenceValue('tokenType');
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var Transaction = require('dw/system/Transaction');
    if ((customerObj && responseData.authenticatedShopperID.valueOf().toString() === customerObj.profile.customerNo) || (tokenType)) {
        var wallet = customerObj.getProfile().getWallet();
        var paymentInstruments = wallet.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
        var matchedPaymentInstrument = require('*/cartridge/scripts/common/PaymentInstrumentUtils').getTokenPaymentInstrument(
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
            newPaymentInstrument = require('*/cartridge/scripts/common/PaymentInstrumentUtils').copyPaymentCardToInstrument(newPaymentInstrument,
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
                matchedPaymentInstrument = require('*/cartridge/scripts/common/PaymentInstrumentUtils').copyPaymentCardToInstrument(
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
 * @param {dw.customer.Customer} customerObj -  The customer object
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument
 * @return {Object} returns an json object
 */
function addOrUpdateIdentifier(responseData, customerObj, paymentInstrument) {
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var Transaction = require('dw/system/Transaction');
    var wallet = customerObj.getProfile().getWallet();
    var paymentInstruments = wallet.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
    var matchedPaymentInstrument = require('*/cartridge/scripts/common/PaymentInstrumentUtils').getTokenPaymentInstrument(
        paymentInstruments, paymentInstrument.creditCardNumber, paymentInstrument.creditCardType,
        paymentInstrument.creditCardExpirationMonth, paymentInstrument.creditCardExpirationYear);
    if (matchedPaymentInstrument == null) {
        Transaction.begin();
        var newPaymentInstrument = wallet.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);
        newPaymentInstrument = require('*/cartridge/scripts/common/PaymentInstrumentUtils').copyPaymentCardToInstrumentfortransID(
            newPaymentInstrument, responseData.cardNumber.valueOf().toString(),
            responseData.cardBrand.valueOf().toString(), Number(responseData.cardExpiryMonth.valueOf()), Number(responseData.cardExpiryYear.valueOf()),
            responseData.cardHolderName.valueOf().toString(), responseData.transactionIdentifier.valueOf().toString());
        if (!(newPaymentInstrument && newPaymentInstrument.getCreditCardNumber() && newPaymentInstrument.getCreditCardExpirationMonth() &&
            newPaymentInstrument.getCreditCardExpirationYear() && newPaymentInstrument.getCreditCardType() && newPaymentInstrument.getCreditCardHolder())) {
            Transaction.rollback();
        }
    }
    Transaction.wrap(function () {
        matchedPaymentInstrument = require('*/cartridge/scripts/common/PaymentInstrumentUtils').copyPaymentCardToInstrumentfortransID(
            matchedPaymentInstrument, null, null, null, null, null, responseData.transactionIdentifier.valueOf().toString());
    });


    return {
        success: true
    };
}

/**
 * Check Authorization response as last event from worldpay
 * @param {Object} serviceResponse service response object
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument
 * @param {dw.customer.Customer} customerObj -  The customer object
 * @return {Object} returns an json object
 */
function checkAuthorization(serviceResponse, paymentInstrument, customerObj) {
    var Resource = require('dw/web/Resource');
    var EnableTokenizationPref = Site.getCurrent().getCustomPreferenceValue('WorldpayEnableTokenization');
    var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
    if (Site.getCurrent().getCustomPreferenceValue('enableStoredCredentials')) {
        EnableTokenizationPref = true;
    }
    if (serviceResponse.lastEvent.equalsIgnoreCase(WorldpayConstants.AUTHORIZED) ||
        (Site.getCurrent().getCustomPreferenceValue('enableSalesrequest') && serviceResponse.lastEvent.equalsIgnoreCase(WorldpayConstants.CAPTURED))) {
        if (paymentInstrument != null && paymentInstrument.paymentMethod.equals(WorldpayConstants.ELV)) {
            return {
                authorized: true,
                echoData: ''
            };
        }
        if (EnableTokenizationPref && customerObj != null && customerObj.authenticated && (serviceResponse.paymentTokenID)) {
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
    } else if (serviceResponse.lastEvent.equalsIgnoreCase(WorldpayConstants.CANCELLEDSTATUS)) {
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
