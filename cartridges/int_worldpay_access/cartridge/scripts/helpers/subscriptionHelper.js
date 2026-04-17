'use strict';

const Site = require('dw/system/Site');
const Resource = require('dw/web/Resource');


/**
 * Check if basket is valid
 * @param {Object} currentBasket - Current basket
 * @returns {boolean} - Elegibility
 */
function isEligible(currentBasket) {
    if (!currentBasket) {
        return {
            error: false
        }
    }

    const allowRecurringTokenization = Boolean(
        Site.getCurrent().getCustomPreferenceValue('allowRecurringTokenization')
    );

    var subProductsQty = 0;
    var regulatProductQty = 0;
    const productLineItems = currentBasket.getProductLineItems().iterator();

    while (productLineItems.hasNext()) {
        var pli = productLineItems.next();

        // if (!pli || !pli.product) return

        if (pli.product.custom.isAllowRecurring) {
            subProductsQty += pli.quantity
        } else {
            regulatProductQty++
        }
    }

    if (regulatProductQty > 0 && subProductsQty > 0) {
        return {
            error: true,
            errorMessage: Resource.msg('checkout.reccuring.error.not.eligible', 'checkout', null) 
        }
    }

    if (subProductsQty > 1) {
        return {
            error: true,
            errorMessage: Resource.msg('checkout.reccuring.error.limit', 'checkout', null) 
        }
    }

    if (subProductsQty > 0 && !allowRecurringTokenization) {
        return {
            error: true,
            errorMessage: Resource.msg('checkout.reccuring.error.disabled', 'checkout', null)
        }
    }

    return {
        error: false
    }
}

/**
 * Check if current basket reccuring
 * @param {Object} currentBasket - Current basket
 * @returns {boolean} - Is Reccuring
 */
function isSubscription(currentBasket) {
    if (!currentBasket) {
        return false;
    }

    const plis = currentBasket.getProductLineItems().toArray();

    return plis.find(function (pli) {
        return pli.product.custom.isAllowRecurring;
    })


}

module.exports = { 
    isEligible: isEligible,
    isSubscription: isSubscription
};
