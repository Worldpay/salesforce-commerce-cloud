'use strict';

var processInclude = require('base/util');

/**
 * Initialize events
 */
function initializeEvents() {
    var name = 'placeerror';
    var error = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search);
    if (error) {
        $('.error-message').show();
        $('.error-message-text').text(decodeURIComponent(error[1]));
    }

    processInclude(require('./checkout/checkout'));
    processInclude(require('./checkout/billing'));

    if ($('.nav-item#CREDIT_CARD').length > 0) {
        $('.cardNumber').data('cleave').properties.creditCardStrictMode = true;
    }

    // unchecks the save credit card options on the non-active tabs
    $(".nav-link:not('.active')").each(function () {
        var paymentContent = $(this).attr('href');
        // eslint-disable-next-line no-useless-concat
        $(paymentContent + ' ' + 'input[name$="_creditCardFields_saveCard"]').prop('checked', false);
    });

    // Enable Apple Pay
    if (window.dw &&
        window.dw.applepay &&
        window.ApplePaySession &&
        window.ApplePaySession.canMakePayments()) {
        $('body').addClass('apple-pay-enabled');
    }
}

$(document).ready(function () {
    initializeEvents();
});
