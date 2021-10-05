'use strict';
window.jQuery = window.$ = require('jquery');
window.CryptoJS = require('crypto-js');
var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./instantCheckout/instantCheckout'));
});
