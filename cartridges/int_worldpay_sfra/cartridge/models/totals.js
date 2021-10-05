'use strict';

var base = module.superModule;

/**
 * @constructor
 * @classdesc totals class that represents the order totals of the current line item container
 *
 * @param {dw.order.lineItemContainer} lineItemContainer - The current user's line item container
 */
function totals(lineItemContainer) {
    base.call(this, lineItemContainer);
    if (this.totalShippingCost === '-') {
        this.grandTotalValue = '-';
        this.currencyCode = lineItemContainer.totalGrossPrice.getCurrencyCode();
        this.decimalTaxValue = '-';
    } else {
        this.grandTotalValue = lineItemContainer.totalGrossPrice.value;
        this.currencyCode = lineItemContainer.totalGrossPrice.getCurrencyCode();
        this.decimalTaxValue = lineItemContainer.totalTax.value;
    }
}

module.exports = totals;
