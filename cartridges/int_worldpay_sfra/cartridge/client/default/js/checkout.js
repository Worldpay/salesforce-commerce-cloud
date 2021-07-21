'use strict';

var processInclude = require('base/util');

/**
 * Initialize events
 */
function initializeEvents() {
    var name = 'placeerror';
    var error = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search);
    if (error) {
    $('.error-message').show(); // eslint-disable-line
    $('.error-message-text').text(decodeURIComponent(error[1])); // eslint-disable-line
    }

    processInclude(require('base/checkout/checkout'));
    processInclude(require('./checkout/billing'));
    if ($('.nav-item#CREDIT_CARD').length > 0) { // eslint-disable-line
    	$('.cardNumber').data('cleave').properties.creditCardStrictMode = true; // eslint-disable-line
    }
}

/* var appBilling = {
	init: function(){
		var stepBilling = require('./checkout/billing');
		stepBilling.init();
	}
}; */

$(document).ready(function () {// eslint-disable-line
    initializeEvents();
	// appBilling.init();
});
