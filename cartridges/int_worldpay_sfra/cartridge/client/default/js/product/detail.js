'use strict';

var base = require('base/product/detail');

/**
 * Update add to cart button
 */
function updateAddToCart() {
    $('body').on('product:updateAddToCart', function (e, response) {
        $('button.add-to-cart', response.$productContainer).attr('disabled',
            (!response.product.readyToOrder || !response.product.available));
        var enable = $('.product-availability').toArray().every(function (item) {
            return $(item).data('available') && $(item).data('ready-to-order');
        });
        $('button.add-to-cart-global').attr('disabled', !enable);
        var isApplePayEnabled = $('.cart-and-ipay').data('flag');
        if (isApplePayEnabled) {
            var applePayDiv = $('div.apple-pay-btn', response.$productContainer);
            if (!response.product.readyToOrder || !response.product.available) {
                applePayDiv.addClass('d-none');
            } else {
                applePayDiv.removeClass('d-none');
                var applePay = $('#apple-pay-button', response.$productContainer);
                applePay.attr('sku', response.product.id);
            }
            var applePayGlobalDiv = $('div.apple-pay-btn-global');
            if (!enable) {
                applePayGlobalDiv.addClass('d-none');
            } else {
                var applePayGlobal = $('#apple-pay-button-global', response.$productContainer);
                applePayGlobal.attr('sku', response.product.id);
                applePayGlobalDiv.removeClass('d-none');
            }
        }
    });
}

base.updateAddToCart = updateAddToCart;

module.exports = base;
