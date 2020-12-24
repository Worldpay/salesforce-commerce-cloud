'use strict';

/**
 * Get the applicable Cards based on the country and amount
 * @param {Object} req - request
 * @returns {string[]} result - Result of payments
 */
function getSupportedInstruments(req) {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var creditCardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
    var applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
        req.currentCustomer.raw,
        req.geolocation.countryCode,
        null
    );
    var result = applicablePaymentCards.toArray().map(function (card) {
        return card.cardType.toLowerCase();
    });

    var types = ['debit', 'credit']; // Prepaid not supported in SFCC
    var supportedInstruments = [{
        supportedMethods: 'basic-card',
        data: { supportedNetworks: result, supportedTypes: types }
    }];

    return supportedInstruments;
}

/**
 * Get the applicable Cards based on the country and amount
 * @param {Object} cart - cart
 * @returns {number} Shipping Cost
 */
function getSelectedShippingMethodCost(cart) {
    var shipMethods = cart.shipments[0].shippingMethods;
    var selectedShippingMethodId = cart.shipments[0].selectedShippingMethod;
    var selectedShippingMethod = shipMethods.filter(function (shp) {
        return (shp.ID === selectedShippingMethodId);
    });
    return selectedShippingMethod[0].decimalShippingCost;
}

/**
 * To get the list of line items.
 * @param {Object} cart - cart Model
 * @returns {{amount: {currency, value: *}, label: string}[]} - Line Items Object
 */
function getDisplayLineItems(cart) {
    var lineItems = [];
    // eslint-disable-next-line no-unused-vars
    var selcetedShippingCost = getSelectedShippingMethodCost(cart);
    var items = (cart && cart.items && cart.items.length > 0) ? cart.items : [];
    lineItems = items.map(function (product) {
        return {
            label: product.productName,
            amount: {
                currency: product.currencyCode,
                value: product.decimalPrice
            }
        };
    });
    var discount = {
        label: 'Discount Total',
        amount: {
            currency: cart.totals.currencyCode,
            value: cart.totals.orderLevelDiscountTotal.value * -1
        }
    };
    var shippingDiscount = {
        label: 'Shipping Discount',
        amount: {
            currency: cart.totals.currencyCode,
            value: cart.totals.shippingLevelDiscountTotal.value * -1
        }
    };
    var shippingTotal = {
        label: 'Shipping cost',
        amount: {
            currency: cart.totals.currencyCode,
            value: getSelectedShippingMethodCost(cart)
        }
    };
    var salesTax = {
        label: 'Sales Tax',
        amount: {
            currency: cart.totals.currencyCode,
            value: cart.totals.decimalTaxValue
        }
    };
    lineItems.push(discount, shippingDiscount, shippingTotal, salesTax);
    return lineItems;
}

/**
 *
 * @param {Object} cart -Cart Model
 * @returns {{total: {amount: {currency: string, value: *}, label: string}}} - totals object
 */
function getTotals(cart) {
    return {
        label: 'Grand Total',
        amount: {
            currency: cart.totals.currencyCode,
            value: cart.totals.grandTotalValue
        }
    };
}

/**
 * To get the list of applicable Shipping Methods
 * @param {Object} cart - Cart Model
 * @return {oObject} - Shipping methods
 */
function getShippingMethods(cart) {
    var shipMethods = cart.shipments[0].shippingMethods;
    var shippingMethods = shipMethods.map(function (shippingMethod) {
        return {
            id: shippingMethod.ID,
            label: shippingMethod.displayName + ' : ' + shippingMethod.estimatedArrivalTime,
            amount: {
                currency: cart.totals.currencyCode,
                value: shippingMethod.decimalShippingCost
            }
        };
    });
    return shippingMethods;
}

/**
 * Get the applicable Cards based on the country and amount
 * @param {Object} cart - cart
 * @returns {Object} Result
 */
function getDetails(cart) {
    var result = {};
    result.total = getTotals(cart);
    result.displayItems = getDisplayLineItems(cart);
    result.shippingOptions = getShippingMethods(cart);
    return result;
}

/**
 * This function takes the OOB cart model and prepares the required model for chrome payment
 * @param {Object} cart - Cart Model Object
 * @param {Object} req - Request from the route
 * @constructor
 */
function ChromeAPIPayment(cart, req) {
    this.supportedInstruments = getSupportedInstruments(req);
    this.details = getDetails(cart);
}


module.exports = ChromeAPIPayment;
