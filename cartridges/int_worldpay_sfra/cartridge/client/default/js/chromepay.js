'use strict';
window.jQuery = window.$ = require('jquery');

var processInclude = require('base/util');


/**
 * hiding the Chrome Payment Option in other browsers than chrome
 */
function hideChromePayButton() {
    var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    if (!isChrome) {
        $('.chrome-pay-button-enable').hide();
    }
}

$(document).ready(function () {
    var error = $('.error-message').attr('data-error-message');

    if (!error) {
        var name = 'placeerror';
        var match = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search);

        error = match ? decodeURIComponent(match[1]) : '';
    }

    if (error) {
        $('.error-message').show();
        $('.error-message-text').text(error);
    }
    try {
        var url = new URL(window.location.href);

        if (url.searchParams.has('placeerror')) {
            url.searchParams.delete('placeerror');
            window.history.pushState('', '', url.pathname + url.search + url.hash);
        }
    } catch (e) {
        // ignore malformed URLs
    }

    hideChromePayButton();
    processInclude(require('./chromepay/chromepay'));
});
