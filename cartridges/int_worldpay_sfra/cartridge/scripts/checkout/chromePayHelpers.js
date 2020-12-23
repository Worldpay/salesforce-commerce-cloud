'use strict';
var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentInstrumentUtils = require('*/cartridge/scripts/common/PaymentInstrumentUtils');
var Transaction = require('dw/system/Transaction');

/**
 * This method returns name of the Card configured for CREDIT_CARD in BM
 * corresponding worldpay cardType returned from service response
 * @param {string} cardType - worldPayCardType
 * @returns {string} - card name
 */
function getCardType(cardType) {
    var cardName;
    switch (cardType) {
        case 'visa':
            cardName = 'Visa';
            break;
        case 'mastercard':
            cardName = 'MasterCard';
            break;
        case 'amex':
            cardName = 'Amex';
            break;
        case 'jcb':
            cardName = 'JCB';
            break;
        case 'maestro':
            cardName = 'Maestro';
            break;
        case 'diners':
            cardName = 'DinersClub';
            break;
        case 'discover':
            cardName = 'Discover';
            break;
        case 'dankort':
            cardName = 'Dankort';
            break;
        case 'laser':
            cardName = 'Laser';
            break;
        case 'airplus':
            cardName = 'Airplus';
            break;
        default:
            cardName = '';
            break;
    }
    return cardName;
}

/**
 * This method is for setting first name and last name on Address object
 * @param {Object} address - address from payment requestAPI
 * @param {Object} basketAddress - Basket Address
 */
function setNames(address, basketAddress) {
    Transaction.wrap(function () {
        var splitName = (address.recipient).split(' ');
        var nameLength = splitName.length;
        if (nameLength > 1) {
            var lastName = splitName[splitName.length - 1];
            var firstName = splitName.slice(0, splitName.length - 1).join(' ');
            basketAddress.setFirstName(firstName);
            basketAddress.setLastName(lastName);
        } else {
            basketAddress.setFirstName(address.recipient);
            basketAddress.setLastName(address.recipient);
        }
    });
}

/**
 * This method returns status of creating payment instrument in basket
 * @param {Object} currentBasket - Basket
 * @param {Object} PaymentDetails - PaymentDetails
 * @returns {Object} - status
 */
function createpaymentInstrument(currentBasket, PaymentDetails) {
    Transaction.wrap(function () {
        PaymentInstrumentUtils.removeExistingPaymentInstruments(currentBasket);

        var paymentInstrument = currentBasket.createPaymentInstrument(
                PaymentInstrument.METHOD_CREDIT_CARD, PaymentDetails.paymentPrice
            );
        var cardNumber = PaymentDetails.cardNumber;
        var expirationMonth = Number(PaymentDetails.expiryMonth);
        var expirationYear = Number(PaymentDetails.expiryYear);
        var holderName = PaymentDetails.cardHolderName;
        var cardType = PaymentDetails.cardType.toLowerCase();
        var worldPayCardType = getCardType(cardType);
        paymentInstrument.setCreditCardHolder(holderName);
        paymentInstrument.setCreditCardNumber(cardNumber);
        paymentInstrument.setCreditCardType(worldPayCardType);
        paymentInstrument.setCreditCardExpirationMonth(expirationMonth);
        paymentInstrument.setCreditCardExpirationYear(expirationYear);
    });
    return { error: false, success: true };
}

/**
 * This method returns status of setting billing Address in basket
 * @param {Object} currentBasket - Basket
 * @param {Object} billingAddress - Billing Address
 * @returns {Object} - Status
 */
function setBillingAddressOnBasket(currentBasket, billingAddress) {
    var address = billingAddress;
    var basketBillingAddress = currentBasket.billingAddress;

    Transaction.wrap(function () {
        if (!basketBillingAddress) {
            basketBillingAddress = currentBasket.createBillingAddress();
        }
        setNames(address, basketBillingAddress);
        basketBillingAddress.setAddress1(address.addressLine[0]);
        basketBillingAddress.setCity(address.city);
        basketBillingAddress.setPostalCode(address.postalCode);
        basketBillingAddress.setStateCode(address.region);
        basketBillingAddress.setCountryCode(address.country);
        if (!basketBillingAddress.phone) {
            basketBillingAddress.setPhone(address.phone);
        }
    });
    return { error: false, success: true };
}


/**
 * This method returns status of setting Shipping Address in basket
 * @param {Object} currentBasket - Basket
 * @param {Object} shippingAddress - Shipping Address
 * @returns {Object} - Status
 */
function setShippingAddressOnBasket(currentBasket, shippingAddress) {
    var address = shippingAddress;
    var basketShippingAddress = currentBasket.defaultShipment.shippingAddress;

    Transaction.wrap(function () {
        if (!basketShippingAddress) {
            basketShippingAddress = currentBasket.createShippingAddress();
        }
        setNames(address, basketShippingAddress);
        basketShippingAddress.setAddress1(address.addressLine[0]);
        basketShippingAddress.setCity(address.city);
        basketShippingAddress.setPostalCode(address.postalCode);
        basketShippingAddress.setStateCode(address.region);
        basketShippingAddress.setCountryCode(address.country);
        if (!basketShippingAddress.phone) {
            basketShippingAddress.setPhone(address.phone);
        }
    });
    return { error: false, success: true };
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {Object} orderObj - The current order's number
 * @param {string} cardNumber -  cardNumber.
 * @param {string} encryptedData - encryptedData
 * @param {string} cvc - cvc
 * @return {Object} returns an error object
 */
function ccAuthorizeRequestServiceChromePay(orderObj, cardNumber, encryptedData, cvc) {
    var WorldpayPayment = require('*/cartridge/scripts/order/WorldpayPayment');
    var orderNumber = orderObj.orderNo;
    var CCAuthorizeRequestResult = WorldpayPayment.authorize(orderNumber, cardNumber, encryptedData, cvc);
    return { CCAuthorizeRequestResult: CCAuthorizeRequestResult };
}

module.exports = {
    createpaymentInstrument: createpaymentInstrument,
    setBillingAddressOnBasket: setBillingAddressOnBasket,
    setShippingAddressOnBasket: setShippingAddressOnBasket,
    ccAuthorizeRequestServiceChromePay: ccAuthorizeRequestServiceChromePay
};
