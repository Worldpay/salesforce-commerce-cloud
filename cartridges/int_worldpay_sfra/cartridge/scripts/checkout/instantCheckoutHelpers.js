'use strict';

var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var AccountModel = require('*/cartridge/models/account');
var OrderModel = require('*/cartridge/models/order');
var Locale = require('dw/util/Locale');
var collections = require('*/cartridge/scripts/util/collections');
var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

/**
 * Prepares for checkout process and load data into modal
 * @param {Object} req object
 * @return {Object} - result json
 */
function beginCheckout(req) {
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        return {
            error: true,
            errorDetail: Resource.msg('quick.checkout.error', 'cart', null)
        };
    }

    var validatedProducts = validationHelpers.validateProducts(currentBasket);
    if (validatedProducts.error) {
        return {
            error: true,
            errorDetail: Resource.msg('quick.checkout.error', 'cart', null)
        };
    }

    var billingAddress = currentBasket.billingAddress;

    var currentCustomer = req.currentCustomer.raw;
    var currentLocale = Locale.getLocale(req.locale.id);
    var preferredAddress;

    // only true if customer is registered
    if (req.currentCustomer.addressBook && req.currentCustomer.addressBook.preferredAddress) {
        var shipments = currentBasket.shipments;
        preferredAddress = req.currentCustomer.addressBook.preferredAddress;

        collections.forEach(shipments, function (shipment) {
            if (!shipment.shippingAddress) {
                COHelpers.copyCustomerAddressToShipment(preferredAddress, shipment);
            }
        });

        if (!billingAddress) {
            COHelpers.copyCustomerAddressToBilling(preferredAddress);
        }
    }

    // Calculate the basket
    Transaction.wrap(function () {
        COHelpers.ensureNoEmptyShipments(req);
    });

    if (currentBasket.shipments.length <= 1) {
        req.session.privacyCache.set('usingMultiShipping', false);
    }

    if (currentBasket.currencyCode !== req.session.currency.currencyCode) {
        Transaction.wrap(function () {
            currentBasket.updateCurrency();
        });
    }

    COHelpers.recalculateBasket(currentBasket);

    var shippingForm = COHelpers.prepareShippingForm(currentBasket);
    var billingForm = COHelpers.prepareBillingForm(currentBasket);
    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');

    if (preferredAddress) {
        shippingForm.copyFrom(preferredAddress);
        billingForm.copyFrom(preferredAddress);
    }

    // Loop through all shipments and make sure all are valid
    var allValid = COHelpers.ensureValidShipments(currentBasket);

    var orderModel = new OrderModel(
        currentBasket,
        {
            customer: currentCustomer,
            usingMultiShipping: usingMultiShipping,
            shippable: allValid,
            countryCode: currentLocale.country,
            containerView: 'basket'
        }
    );

    var accountModel = new AccountModel(req.currentCustomer);

    return {
        error: false,
        order: orderModel,
        customer: accountModel,
        forms: {
            shippingForm: shippingForm,
            billingForm: billingForm
        }
    };
}

/**
 * Sets the shipping address to basket
 * @param {dw.order.Basket} currentBasket - currentBasket
 * @param {dw.customer.CustomerAddress} address - address
 */
function setShippingAddressToBasket(currentBasket, address) {
    var shipment = currentBasket.defaultShipment;
    var shippingAddress = shipment.shippingAddress;
    if (!shippingAddress) {
        shippingAddress = shipment.createShippingAddress();
    }
    shippingAddress.setFirstName(address.firstName || '');
    shippingAddress.setLastName(address.lastName || '');
    shippingAddress.setAddress1(address.address1 || '');
    shippingAddress.setAddress2(address.address2 || '');
    shippingAddress.setCity(address.city || '');
    shippingAddress.setPostalCode(address.postalCode || '');
    shippingAddress.setStateCode(address.stateCode || '');
    shippingAddress.setCountryCode(address.countryCode || '');
    shippingAddress.setPhone(address.phone || '');
}

/**
 * Sets the billing address to basket
 * @param {dw.order.Basket} currentBasket - currentBasket
 * @param {dw.customer.CustomerAddress} address - address
 */
function setBillingAddressToBasket(currentBasket, address) {
    var billingAddress = currentBasket.billingAddress;
    if (!billingAddress) {
        billingAddress = currentBasket.createBillingAddress();
    }
    billingAddress.setFirstName(address.firstName || '');
    billingAddress.setLastName(address.lastName || '');
    billingAddress.setAddress1(address.address1 || '');
    billingAddress.setAddress2(address.address2 || '');
    billingAddress.setCity(address.city || '');
    billingAddress.setPostalCode(address.postalCode || '');
    billingAddress.setStateCode(address.stateCode || '');
    billingAddress.setCountryCode(address.countryCode || '');
    billingAddress.setPhone(address.phone || '');
}

/**
 * Get the address object by address ID
 * @param {dw.customer.CustomerAddress.ID} addressID - addressID
 * @returns {dw.customer.CustomerAddress} address - address
 */
function getAddressByID(addressID) {
    var address;
    if (customer && customer.isAuthenticated()) {
        var addressBook = customer.profile.addressBook;
        address = addressBook.getAddress(addressID);
    }
    return address;
}

/**
 * Fills the paymentForm from basket data to support checkout process
 * @param {dw.order.Basket} currentBasket - currentBasket
 * @param {dw.customer.CustomerPaymentInstrument} paymentInstrument - paymentInstrument
 * @param {string} cvv - cvv
 * @returns {Object} - paymentObject
 */
function fillPaymentFormFromBasket(currentBasket, paymentInstrument, cvv) {
    var paymentData = {
        paymentInformation: {
            cardType: {
                value: ''
            },
            cardOwner: {
                value: ''
            },
            cardNumber: {
                value: ''
            },
            securityCode: {
                value: ''
            },
            expirationMonth: {
                value: ''
            },
            expirationYear: {
                value: ''
            },
            selectedPaymentMethodID: {
                value: ''
            },
            encryptedData: {
                value: ''
            },
            saveCard: {
                value: ''
            },
            creditCardToken: ''
        }
    };
    var paymentForm = COHelpers.prepareBillingForm(currentBasket);
    paymentForm.creditCardFields.cardType.value = paymentInstrument.creditCardType;
    paymentForm.creditCardFields.cardOwner.value = paymentInstrument.creditCardHolder;
    paymentForm.creditCardFields.cardNumber.value = paymentInstrument.creditCardNumber;
    paymentForm.creditCardFields.expirationMonth.selectedOption = paymentInstrument.creditCardExpirationMonth;
    paymentForm.creditCardFields.expirationYear.value = paymentInstrument.creditCardExpirationYear;
    paymentForm.creditCardFields.securityCode.value = cvv;

    paymentData.paymentInformation.cardOwner.value = paymentInstrument.creditCardHolder;
    paymentData.paymentInformation.cardNumber.value = paymentInstrument.creditCardNumber;
    paymentData.paymentInformation.cardType.value = paymentInstrument.creditCardType;
    paymentData.paymentInformation.securityCode.value = cvv;
    paymentData.paymentInformation.expirationMonth.value = paymentInstrument.creditCardExpirationMonth;
    paymentData.paymentInformation.expirationYear.value = paymentInstrument.creditCardExpirationYear;
    paymentData.paymentInformation.creditCardToken = paymentInstrument.raw.creditCardToken;
    paymentData.paymentInformation.selectedPaymentMethodID.value = paymentInstrument.raw.paymentMethod;

    return paymentData;
}

/**
 * Checks if the cvv is valid
 * @param {string} cvv - cvv
 * @returns {boolean} result - result
 */
function isValidCVV(cvv) {
    var pattern = /^[0-9]{0,4}$/;
    return pattern.test(cvv);
}

/**
 * Checks if the cvv has valid Length
 * @param {string} cardType - cardType
 * @param {string} cvv - cvv
 * @returns {boolean} result - result
 */
function isValidCVVLength(cardType, cvv) {
    var cvvRegexAmex = /^([0-9]{4})$/;
    var cvvRegexNonAmex = /^([0-9]{3})$/;
    if (cardType.equalsIgnoreCase('AMEX')) {
        return cvvRegexAmex.test(cvv);
    }
    return cvvRegexNonAmex.test(cvv);
}

module.exports = {
    beginCheckout: beginCheckout,
    setBillingAddressToBasket: setBillingAddressToBasket,
    setShippingAddressToBasket: setShippingAddressToBasket,
    getAddressByID: getAddressByID,
    fillPaymentFormFromBasket: fillPaymentFormFromBasket,
    isValidCVV: isValidCVV,
    isValidCVVLength: isValidCVVLength
};
