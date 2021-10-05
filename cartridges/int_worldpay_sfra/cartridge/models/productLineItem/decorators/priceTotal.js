'use strict';

var base = module.superModule;
var collections = require('*/cartridge/scripts/util/collections');

module.exports = function (object, lineItem) {
    var price = lineItem.adjustedPrice;
    collections.forEach(lineItem.optionProductLineItems, function (item) {
        price = price.add(item.adjustedPrice);
    });
    base.call(this, object, lineItem);
    Object.defineProperty(object, 'decimalPrice', {
        enumerable: true,
        value: price.value
    });
    Object.defineProperty(object, 'currencyCode', {
        enumerable: true,
        value: price.getCurrencyCode()
    });
};
