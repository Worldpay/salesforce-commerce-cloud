'use strict';

var processInclude = require('./base/util');

/**
 * Initialize events
 */
function initializeEvents() {
    processInclude(require('./base/paymentInstruments/paymentInstruments'));
    processInclude(require('./paymentInstruments/paymentInstruments'));
    $('input#cardNumber').data('cleave').properties.creditCardStrictMode = true; // eslint-disable-line
}

$(document).ready(function () {// eslint-disable-line
    initializeEvents();
});
