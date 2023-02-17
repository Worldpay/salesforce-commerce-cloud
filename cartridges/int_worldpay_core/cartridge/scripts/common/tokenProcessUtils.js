'use strict';
var Site = require('dw/system/Site');

/**
 * Creates new Credit Card payment instrument and store in Customer's wallet
 * @param {Object} responseData - service response data
 * @param {Object} customerObj - current customer object
 * @param {Object} paymentInstrument - The payment instrument
 * @returns {Object} - null
 */
function createNewPaymentInstrument(responseData, customerObj, paymentInstrument) {
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var Transaction = require('dw/system/Transaction');
    var cardNumberToSave = '';
    var newPaymentInstrument;
    var wallet = customerObj.getProfile().getWallet();
    Transaction.begin();
    newPaymentInstrument = wallet.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);
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
    return null;
}

/**
 * Deletes existing paymenet instrument and creates new Credit card payment instrument with updated data
 * @param {Object} responseData - Service response
 * @param {Object} customerObj - Current customer
 * @param {Object} paymentInstrument - The payment instrument
 * @param {Object} matchedPaymentInstrument - Existing Credit card payment instrument
 * @returns {Object} - returns success or error object
 */
function updatePaymentInstrument(responseData, customerObj, paymentInstrument, matchedPaymentInstrument) {
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var Transaction = require('dw/system/Transaction');
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var serviceFacade = require('*/cartridge/scripts/service/serviceFacade');
    var newPaymentInstrument;
    var wallet = customerObj.getProfile().getWallet();
    if (responseData.paymentTokenID) {
        session.privacy.saveCardCheckBoxValue = 'yes';
    }
    var updateTokenResult = serviceFacade.updateTokenWOP(customer, paymentInstrument, responseData,
        responseData.cardExpiryMonth.valueOf(), responseData.cardExpiryYear.valueOf());
    if (updateTokenResult.error) {
        if (updateTokenResult.errorCode.equals(worldpayConstants.MAXUPDATELIMITERRORCODE)) {
            session.privacy.hasUpdateLimitReached = 'yes';
        }
        return updateTokenResult;
    }
    Transaction.wrap(function () {
        wallet.removePaymentInstrument(matchedPaymentInstrument);
        newPaymentInstrument = wallet.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);
        newPaymentInstrument = require('*/cartridge/scripts/common/paymentInstrumentUtils').copyPaymentCardToInstrument(
            newPaymentInstrument, responseData.cardNumber.valueOf().toString(),
            responseData.cardBrand.valueOf().toString(),
            Number(responseData.cardExpiryMonth.valueOf()),
            Number(responseData.cardExpiryYear.valueOf()),
            responseData.cardHolderName.valueOf().toString(),
            responseData.paymentTokenID.valueOf().toString(),
            responseData.bin.valueOf().toString());
    });
    return null;
}
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
    if (session.privacy.hasUpdateLimitReached) {
        delete session.privacy.hasUpdateLimitReached;
    }
    var result;
    if ((customerObj && responseData.authenticatedShopperID.valueOf().toString() === customerObj.profile.customerNo) || (tokenType)) {
        var wallet = customerObj.getProfile().getWallet();
        var paymentInstruments = wallet.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
        var matchedPaymentInstrument = require('*/cartridge/scripts/common/paymentInstrumentUtils').getTokenPaymentInstrument(
            paymentInstruments, paymentInstrument.creditCardNumber,
            paymentInstrument.creditCardType, paymentInstrument.creditCardExpirationMonth, paymentInstrument.creditCardExpirationYear, responseData);

        if (matchedPaymentInstrument == null) {
            result = createNewPaymentInstrument(responseData, customerObj, paymentInstrument);
        } else if (!matchedPaymentInstrument.getCreditCardToken()) {
            if (responseData.paymentTokenID) {
                session.privacy.saveCardCheckBoxValue = 'yes';
            }
            Transaction.wrap(function () {
                matchedPaymentInstrument = require('*/cartridge/scripts/common/paymentInstrumentUtils').copyPaymentCardToInstrument(
                    matchedPaymentInstrument, null, null, null, null, null, responseData.paymentTokenID.valueOf().toString(), responseData.bin.valueOf().toString());
            });
        } else if (matchedPaymentInstrument && responseData) {
            result = updatePaymentInstrument(responseData, customerObj, paymentInstrument, matchedPaymentInstrument);
        }
    }
    if (result == null) {
        return {
            success: true
        };
    }
    return result;
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
 * @param {Object} paymentInstrument The payment instrument
 * @param {Object} enableTokenizationPref The enableTokenizationPref Object
 * @param {Object} customerObj - The customer object
 * @param {Object} serviceResponse service response object
 * @return {Object} returns an json object
 */
function checkServiceResponse(paymentInstrument, enableTokenizationPref, customerObj, serviceResponse) {
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
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
    if (session.privacy.saveCardCheckBoxValue) {
        delete session.privacy.saveCardCheckBoxValue;
    }
    if (serviceResponse.lastEvent.equalsIgnoreCase(worldpayConstants.AUTHORIZED) ||
        (Site.getCurrent().getCustomPreferenceValue('enableSalesrequest') && serviceResponse.lastEvent.equalsIgnoreCase(worldpayConstants.CAPTURED))) {
        var serviceResponseObj = checkServiceResponse(paymentInstrument, enableTokenizationPref, customerObj, serviceResponse);
        return serviceResponseObj;
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
exports.checkServiceResponse = checkServiceResponse;
