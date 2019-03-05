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
    if ((customerObj && responseData.authenticatedShopperID.valueOf().toString() === customerObj.profile.customerNo && responseData.cardNumber) || (tokenType)) {
        var wallet = customerObj.getProfile().getWallet();
        var paymentInstruments = wallet.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
        var matchedPaymentInstrument = require('link_worldpay_core/cartridge/scripts/common/PaymentInstrumentUtils').getTokenPaymentInstrument(paymentInstruments, paymentInstrument.creditCardNumber, paymentInstrument.creditCardType, paymentInstrument.creditCardExpirationMonth, paymentInstrument.creditCardExpirationYear);

        if (matchedPaymentInstrument == null) {
            Transaction.begin();
            var newPaymentInstrument = wallet.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);
            newPaymentInstrument = require('link_worldpay_core/cartridge/scripts/common/PaymentInstrumentUtils').copyPaymentCardToInstrument(newPaymentInstrument, responseData.cardNumber.valueOf().toString(),
                responseData.cardBrand.valueOf().toString(), new Number(responseData.cardExpiryMonth.valueOf()), new Number(responseData.cardExpiryYear.valueOf()), // eslint-disable-line
                responseData.cardHolderName.valueOf().toString(), responseData.paymentTokenID.valueOf().toString());
            if (!(newPaymentInstrument && newPaymentInstrument.getCreditCardNumber() && newPaymentInstrument.getCreditCardExpirationMonth() &&
                    newPaymentInstrument.getCreditCardExpirationYear() && newPaymentInstrument.getCreditCardType() &&
                    newPaymentInstrument.getCreditCardHolder())) {
                Transaction.rollback();
            }
            Transaction.commit();
        } else if (!matchedPaymentInstrument.getCreditCardToken()) {
            Transaction.wrap(function () {
                matchedPaymentInstrument = require('link_worldpay_core/cartridge/scripts/common/PaymentInstrumentUtils').copyPaymentCardToInstrument(matchedPaymentInstrument, null, null, null, null, null, responseData.paymentTokenID.valueOf().toString());
            });
        }
    }
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
    var WorldpayConstants = require('link_worldpay_core/cartridge/scripts/common/WorldpayConstants');
    if (serviceResponse.lastEvent.equalsIgnoreCase(WorldpayConstants.AUTHORIZED)) {
        if (paymentInstrument != null && paymentInstrument.paymentMethod.equals(WorldpayConstants.ELV)) {
            return {
                authorized: true,
                echoData: ''
            };
        }
        if (Site.getCurrent().getCustomPreferenceValue('WorldpayEnableTokenization') && customerObj != null && customerObj.authenticated && serviceResponse.paymentTokenID) {
            addOrUpdateToken(serviceResponse, customerObj, paymentInstrument);
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

exports.checkAuthorization = checkAuthorization;
exports.addOrUpdateToken = addOrUpdateToken;
