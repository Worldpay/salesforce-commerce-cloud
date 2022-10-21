'use strict';

var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var AccountModel = require('*/cartridge/models/account');
var OrderModel = require('*/cartridge/models/order');
var Locale = require('dw/util/Locale');
var collections = require('*/cartridge/scripts/util/collections');
var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

/**
 * Prepares for checkout process and load data into modal
 * @param {Object} req object
 * @param {Object} preferredAddress object
 * @return {Object} - result json
 */
function beginCheckout(req, preferredAddress) {
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        return {
            error: true
        };
    }
    var validatedProducts = validationHelpers.validateProducts(currentBasket);
    if (validatedProducts.error) {
        return {
            error: true
        };
    }
    var billingAddress = currentBasket.billingAddress;
    var currentCustomer = req.currentCustomer.raw;
    var currentLocale = Locale.getLocale(req.locale.id);
    // only true if customer is registered
    if (req.currentCustomer.addressBook && req.currentCustomer.addressBook.preferredAddress) {
        var shipments = currentBasket.shipments;
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
    if (currentBasket.currencyCode !== req.session.currency.currencyCode) {
        Transaction.wrap(function () {
            currentBasket.updateCurrency();
        });
    }
    COHelpers.recalculateBasket(currentBasket);
    var shippingForm = COHelpers.prepareShippingForm(currentBasket);
    var billingForm = COHelpers.prepareBillingForm(currentBasket);
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
 * Fills the paymentForm from basket data to support checkout process
 * @param {dw.order.Basket} currentBasket - currentBasket
 * @param {string} paymentMethodID - paymentMethodID
 * @returns {Object} - paymentObject
 */
function fillPaymentFormFromBasket(currentBasket, paymentMethodID) {
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
    COHelpers.prepareBillingForm(currentBasket);
    paymentData.paymentInformation.selectedPaymentMethodID.value = paymentMethodID;
    return paymentData;
}

/**
 * Sets address to basket address object
 * @param {Object} basketAddress - Contains basket address object
 * @param {Object} address - Contains address values to set
 */
function setAddress(basketAddress, address) {
    basketAddress.setAddress1(address.address1 || '');
    basketAddress.setAddress2(address.address2 || '');
    basketAddress.setCity(address.city || '');
    basketAddress.setPostalCode(address.postalCode || '');
    basketAddress.setStateCode(address.stateCode || '');
    basketAddress.setCountryCode(address.countryCode || '');
    basketAddress.setPhone(address.phone || '');
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
    let fullName = address.fullName;
    if (fullName) {
        let names = fullName.split(' ');
        if (names.length > 2) {
            shippingAddress.setFirstName(names[0] || '');
            shippingAddress.setSecondName(names[1] || '');
            shippingAddress.setLastName(names[2] || '');
        } else if (names.length < 2) {
            shippingAddress.setFirstName(fullName);
        } else {
            shippingAddress.setFirstName(names[0] || '');
            shippingAddress.setLastName(names[1] || '');
        }
    }
    setAddress(shippingAddress, address);
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
    let fullName = address.fullName;
    if (fullName) {
        let names = fullName.split(' ');
        if (names.length > 2) {
            billingAddress.setFirstName(names[0] || '');
            billingAddress.setSecondName(names[1] || '');
            billingAddress.setLastName(names[2] || '');
        } else if (names.length < 2) {
            billingAddress.setFirstName(fullName);
        } else {
            billingAddress.setFirstName(names[0] || '');
            billingAddress.setLastName(names[1] || '');
        }
    }
    setAddress(billingAddress, address);
}

/**
 * Removes Bonus Discounts applied to the cart
 * @param {Object} currentBasket - Current cart
 */
function removeBonusDiscountLineItems(currentBasket) {
    var lineItems = currentBasket.getBonusDiscountLineItems().toArray();
    for (var lineItem of lineItems) {
        currentBasket.removeBonusDiscountLineItem(lineItem);
    }
}

/**
 * Removes all products from cart
 * @param {Object} currentBasket - Current cart
 */
function removeAllProductLineItems(currentBasket) {
    var lineItems = currentBasket.getAllProductLineItems().toArray();
    for (var lineItem of lineItems) {
        currentBasket.removeProductLineItem(lineItem);
    }
}

/**
 * Removes all coupons applied to cart
 * @param {Object} currentBasket - Current cart
 */
function removeCouponLineItem(currentBasket) {
    var lineItems = currentBasket.getCouponLineItems().toArray();
    for (var lineItem of lineItems) {
        currentBasket.removeCouponLineItem(lineItem);
    }
}

/**
 * Removes all gift certificates
 * @param {Object} currentBasket - Current cart
 */
function removeGiftCertificateLineItem(currentBasket) {
    var lineItems = currentBasket.getGiftCertificateLineItems().toArray();
    for (var lineItem of lineItems) {
        currentBasket.removeGiftCertificateLineItem(lineItem);
    }
}

/**
 * Removes all price adjustments done to a cart
 * @param {Object} currentBasket - Current cart
 */
function removePriceAdjustment(currentBasket) {
    var lineItems = currentBasket.getPriceAdjustments().toArray();
    for (var lineItem of lineItems) {
        currentBasket.removePriceAdjustment(lineItem);
    }
}
module.exports = {
    beginCheckout: beginCheckout,
    fillPaymentFormFromBasket: fillPaymentFormFromBasket,
    setBillingAddressToBasket: setBillingAddressToBasket,
    setShippingAddressToBasket: setShippingAddressToBasket,
    removeBonusDiscountLineItems: removeBonusDiscountLineItems,
    removeAllProductLineItems: removeAllProductLineItems,
    removeCouponLineItem: removeCouponLineItem,
    removeGiftCertificateLineItem: removeGiftCertificateLineItem,
    removePriceAdjustment: removePriceAdjustment
};
