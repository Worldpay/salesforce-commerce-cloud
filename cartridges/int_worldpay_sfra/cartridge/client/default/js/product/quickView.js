'use strict';

var base = require('base/product/quickView');

/**
 * Update add to cart
 */
function updateAddToCart() {
    $('body').on('product:updateAddToCart', function (e, response) {
        $('button.add-to-cart', response.$productContainer).attr('disabled',
            (!response.product.readyToOrder || !response.product.available));
        var dialog = $(response.$productContainer)
            .closest('.quick-view-dialog');
        $('.add-to-cart-global', dialog).attr('disabled',
            !$('.global-availability', dialog).data('ready-to-order')
            || !$('.global-availability', dialog).data('available')
        );
        var isApplePayEnabled = $('.cart-and-ipay').data('flag');
        if (isApplePayEnabled !== false) {
            var applePayDiv = $('div.apple-pay-btn', response.$productContainer);
            if (!response.product.readyToOrder || !response.product.available) {
                applePayDiv.addClass('d-none');
            } else {
                applePayDiv.removeClass('d-none');
                var applePay = $('#apple-pay-button', response.$productContainer);
                applePay.attr('sku', response.product.id);
            }
            var applePayGlobalDiv = $('div.apple-pay-btn-global');
            if (!$('.global-availability', dialog).data('ready-to-order')
                    || !$('.global-availability', dialog).data('available')) {
                applePayGlobalDiv.addClass('d-none');
            } else {
                var applePayGlobal = $('#apple-pay-button-global', applePayGlobalDiv);
                applePayGlobal.attr('sku', response.product.id);
                applePayGlobalDiv.removeClass('d-none');
            }
        }
    });
}

base.updateAddToCart = updateAddToCart;

module.exports = base;
