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
    var name = 'placeerror';
    var error = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search);
    if (error) {
        $('.error-message').show();
        $('.error-message-text').text(decodeURIComponent(error[1]));
    }
    var url = location.href;
    var newurl = url.split('&placeerror')[0];
    const nextTitle = '';
    const nextState = '';
    window.history.pushState(nextState, nextTitle, newurl);
    hideChromePayButton();
    processInclude(require('./chromepay/chromepay'));
});
