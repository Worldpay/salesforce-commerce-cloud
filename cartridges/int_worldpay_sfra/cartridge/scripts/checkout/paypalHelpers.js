'use strict';

var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');

var cartHelper;
var basketCalculationHelpers;
var COHelpers;
var collections;

/**
 * Create or update basket for paypal from Product details page
 * @param {string} pid - Prdouct id to add
 * @param {string} quantity - Product quantity
 * @param {{isPDP: boolean, sfccCustomer: dw.customer.Customer, countryCode: string}} options
 * @returns 
 */
function createBasket(pid, quantity, options) {
    if (!options || !options.isPDP || !pid) {
        return null;
    }

    COHelpers = COHelpers || require('*/cartridge/scripts/checkout/checkoutHelpers');
    collections = collections || require('*/cartridge/scripts/util/collections');
    cartHelper = cartHelper || require('*/cartridge/scripts/cart/cartHelpers');
    basketCalculationHelpers = basketCalculationHelpers || require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentOrNewBasket();

    removeAllProductLineItems(currentBasket);

    Transaction.wrap(function () {
        var qty = parseInt(quantity, 10);
        var result = cartHelper.addProductToCart(currentBasket, pid, qty, [], []);

        if (!result.error) {
            cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
            basketCalculationHelpers.calculateTotals(currentBasket);

            var address = getAddress(options.sfccCustomer, options.countryCode)

            COHelpers.copyCustomerAddressToBilling(address)
            collections.forEach(currentBasket.shipments, function (shipment) {
                if (!shipment.shippingAddress) {
                    COHelpers.copyCustomerAddressToShipment(address, shipment);
                }
            });
        }
    });

    return currentBasket;
}

/**
 * Get address to set in shipping and billing
 * @param {dw.customer.Customer} sfccCustomer 
 * @param {string} countryCode - req country code
 * @returns {dw.customer.CustomerAddress|object} address - The customer address
 */
function getAddress(sfccCustomer, countryCode) {
    if (!sfccCustomer || !sfccCustomer.authenticated) {
        // guest address object
        return {
            firstName: 'guest',
            lastName: 'guest',
            address1: '',
            address2: '',
            city: '',
            countryCode: {
                value: countryCode || ''
            },
            phone: ''
        }
    }

    if (sfccCustomer.addressBook.addresses && sfccCustomer.addressBook.addresses.length === 0) {
        // customer without saved address
        return {
            firstName: sfccCustomer.profile.firstName,
            lastName: sfccCustomer.profile.lastName,
            address1: '',
            address2: '',
            city: '',
            countryCode: {
                value: countryCode
            },
            phone: sfccCustomer.profile.phoneHome || ''
        }
    }

    // return preffered address or 1st from addressbook
    return customer.addressBook.preferredAddress || sfccCustomer.addressBook.addresses[0]

}


/**
 * Removes all products from cart
 * @param {Object} currentBasket - Current cart
 */
function removeAllProductLineItems(currentBasket) {
    if (!currentBasket) {
        return;
    }

    var lineItems = currentBasket.getAllProductLineItems().toArray();
    for (var lineItem of lineItems) {
        currentBasket.removeProductLineItem(lineItem);
    }
}

module.exports = {
    createBasket: createBasket
};
