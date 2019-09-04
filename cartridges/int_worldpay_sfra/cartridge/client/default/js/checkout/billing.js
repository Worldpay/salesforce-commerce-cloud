'use strict';
module.exports = function () {
/*
*Payment method tab click handling and manipulating the
*cpg DOM for CC, BS and WP
*/
    var updateBoletoDOM = function (countryCode, paymentType) {
        if (!countryCode && !paymentType) {
            return;
        }
        var billingForm = $('#dwfrm_billing');// eslint-disable-line

        if (countryCode === 'BR' && (paymentType === 'CREDIT_CARD' || paymentType === 'BOLETO-SSL' || paymentType === 'Worldpay')) {
            billingForm.find('#boleto-content').removeClass('tab-pane fade');
        } else if (countryCode === 'BR' && paymentType === 'Worldpay' && $('.saved-payment-security-code').length > 0) {// eslint-disable-line
            billingForm.find('#boleto-content').removeClass('tab-pane fade');
        } else {
            billingForm.find('#boleto-content').addClass('tab-pane fade');
        }
        if ($('.tokenization-disabled').length > 0 && paymentType === 'Worldpay') {// eslint-disable-line
            $('.worldpaySaveCreditFields input:checkbox').removeAttr('checked');// eslint-disable-line
        }
        $('.payment-information input').removeClass('is-invalid');// eslint-disable-line
        $('.payment-information select').removeClass('is-invalid');// eslint-disable-line
        $('.payment-information .security-code-input .invalid-feedback').removeAttr('style');// eslint-disable-line
        $('.payment-information .saved-payment-security-code').val('');// eslint-disable-line
        $('.payment-information .securityCode').val('');// eslint-disable-line
        if ($('.nav-item#CREDIT_CARD').length > 0) { // eslint-disable-line
            $('.cardNumber').data('cleave').properties.creditCardStrictMode = true; // eslint-disable-line
        }
    };

/*
*Payment method tab click handling and manipulating the
*cpg DOM for CC, BS and WP
*/
    $(document).on('click', '.payment-options .nav-item', function (e) {// eslint-disable-line
        var paymentType = $(e.currentTarget).attr('data-method-id'),// eslint-disable-line
            countryCode = $('#billingCountry').val();// eslint-disable-line
        $('.payment-information').attr('data-payment-method-id', paymentType);// eslint-disable-line

        updateBoletoDOM(countryCode, paymentType);
    });

    $(document).on('focus', '.saved-payment-security-code', function () {// eslint-disable-line
        $(document).find('#worldpayCards').val('');// eslint-disable-line
    });


    $(document).on('change', '#worldpayCards', function () {// eslint-disable-line
        $(document).find('.saved-payment-security-code').val('');// eslint-disable-line
    });

    $(document).ajaxStart(function(event, xhr, settings) {// eslint-disable-line
        if ($(event.currentTarget.activeElement).hasClass('submit-payment') || $(event.currentTarget.activeElement).hasClass('place-order') || $(event.currentTarget.activeElement).hasClass('submit-shipping')) {// eslint-disable-line
             $.spinner().start();// eslint-disable-line
        }
    });
    $(document).ajaxComplete(function (event, xhr, settings) {// eslint-disable-line
       if ($("#containergpay").length && $("#containergpay").attr('data-set') == "0"){ // eslint-disable-line
     		addGooglePayButton(); // eslint-disable-line
       }
        $.spinner().stop();// eslint-disable-line
        if (settings.url === $('.place-order').data('action')) {// eslint-disable-line
            if (xhr.responseJSON.isValidCustomOptionsHPP && xhr.responseJSON.customOptionsHPPJSON) {
                var libraryObject = new WPCL.Library();// eslint-disable-line
                libraryObject.setup(JSON.parse(unescape(xhr.responseJSON.customOptionsHPPJSON)));
                $('#custom-trigger').trigger('click');// eslint-disable-line
                $('button.place-order').hide();// eslint-disable-line
                $('.edit-button').hide();// eslint-disable-line
                $('.error-message-text').text('');// eslint-disable-line
                $('.error-message').hide();// eslint-disable-line
            } else if (xhr.responseJSON.isKlarna && xhr.responseJSON.klarnasnippet) {
                var decodedSnippet = xhr.responseJSON.klarnasnippet;
                if (decodedSnippet) {
                    $('#klarnaiframe').contents().find('body').html(decodedSnippet);// eslint-disable-line
                    $('#klarnaiframe').show();// eslint-disable-line
                }
                $('button.place-order').hide();// eslint-disable-line
                $('.edit-button').hide();// eslint-disable-line
                $('.error-message-text').text('');// eslint-disable-line
                $('.error-message').hide();// eslint-disable-line
            }
        }
        if ($(event.currentTarget.activeElement).attr('value') === 'submit-payment') {// eslint-disable-line
            var str = $('.payment-details').find('div span').text();// eslint-disable-line
            if (str.length > 0 && str.trim().indexOf('/') === (str.trim().length - 1)) {
                str = str.replace('/', '');
            }
            $('.payment-details').find('div span').text(str);// eslint-disable-line
            var paymentinstrument = xhr.responseJSON.order.billing.payment.selectedPaymentInstruments[0];
            if (paymentinstrument.paymentMethod && paymentinstrument.paymentMethod === 'CREDIT_CARD' && paymentinstrument.ccnum && (paymentinstrument.ccnum.indexOf('*') < 0)) {
                var ccnum = JSON.parse(xhr.responseJSON.order.billing.payment.selectedPaymentInstruments[0].ccnum);
                var iframeurl = $('#cardiframe').data('url');// eslint-disable-line
                $('#cardiframe').attr('src', iframeurl +'?ccnumber= '+ccnum);// eslint-disable-line
                window.addEventListener('message', function (event) {// eslint-disable-line
                    var data = JSON.parse(event.data);
                    var dataSessionId = data.SessionId;
                   // console.log(dataSessionId);// eslint-disable-line
        		    var url = $('#sessionIDEP').val();// eslint-disable-line
        		$.ajax({ // eslint-disable-line
            url: url,
            data: { dataSessionId: dataSessionId },
            type: 'POST'
        });
                }, false);
            } else {
            	$('#cardiframe').attr('src', '');// eslint-disable-line
            	$('#cardiframe').removeAttr('src');// eslint-disable-line
            }
        }
    });
    $(document).ready(function(){// eslint-disable-line
    	var checkoutmain = $('#checkout-main'); // eslint-disable-line
        if (checkoutmain.length && checkoutmain.attr('data-checkout-stage') === 'placeOrder') {
     		var cardnumber = $('#hidden-card-number');// eslint-disable-line
            if (cardnumber.length && cardnumber.attr('data-number').indexOf('*') < 0) {
                var ccnum = cardnumber.data('number');
    		var iframeurl = $('#cardiframe').data('url');// eslint-disable-line
            $('#cardiframe').attr('src', iframeurl +'?ccnumber=' +ccnum);// eslint-disable-line   		
                window.addEventListener('message', function (event) {
                    var data = JSON.parse(event.data);
                    var dataSessionId = data.SessionId;
                   // console.log(dataSessionId);// eslint-disable-line
        var url = $('#sessionIDEP').val();// eslint-disable-line
        		$.ajax({// eslint-disable-line
            url: url,
            data: { dataSessionId: dataSessionId },
            type: 'POST'
        });
                }, false);
            } else {
    		$('#cardiframe').attr('src', ''); // eslint-disable-line
            $('#cardiframe').removeAttr('src'); // eslint-disable-line
            }
        }
    });

$('body').on('change', '.addressSelector', function () { // eslint-disable-line
    var lookupCountry = $("option[value=" + this.value + "]", this).attr("data-country-code"); // eslint-disable-line
    $.ajax({ // eslint-disable-line
        url: $('.form-nav.billing-nav.payment-information').data('apmlookup-url') + '&lookupCountry=' + lookupCountry, // eslint-disable-line
        type: 'get',
        context: this,
        dataType: 'html',
        success: function (data) {
            $('.form-nav.billing-nav.payment-information').parent().html(data); // eslint-disable-line
            require('../base/checkout/billing').paymentTabs();
            if ($('.nav-item#CREDIT_CARD').length > 0) { // eslint-disable-line
                var cleave = require('../base/components/cleave');
                cleave.handleCreditCardNumber('.cardNumber', '#cardType');
            }

            var paymentType = $('#dwfrm_billing').find('.nav-link.active').parent('li').attr('data-method-id');// eslint-disable-line
            var countryCode = $('#billingCountry').val();// eslint-disable-line
            updateBoletoDOM(countryCode, paymentType);
        }
    });
});
/*
*Payment section change on change of billing country
*/
$('body').on('change', '#billingCountry', function () { // eslint-disable-line
    var lookupCountry = $('#billingCountry').val(); // eslint-disable-line
    $.ajax({ // eslint-disable-line
        url: $('.form-nav.billing-nav.payment-information').data('apmlookup-url') + '&lookupCountry=' + lookupCountry, // eslint-disable-line
        type: 'get',
        context: this,
        dataType: 'html',
        success: function (data) {
            $('.form-nav.billing-nav.payment-information').parent().html(data); // eslint-disable-line
            require('../base/checkout/billing').paymentTabs();
            if ($('.nav-item#CREDIT_CARD').length > 0) { // eslint-disable-line
                var cleave = require('../base/components/cleave');
                cleave.handleCreditCardNumber('.cardNumber', '#cardType');
            }
            var paymentType = $('#dwfrm_billing').find('.nav-link.active').parent('li').attr('data-method-id');// eslint-disable-line
            var countryCode = $('#billingCountry').val();// eslint-disable-line
            updateBoletoDOM(countryCode, paymentType);
        }
    });
});

/*
*Add payment button for credit card event function as ajax replaced the payment section and event binding lost.
*/
    $(document).on('click', '.btn.add-payment', function (e) {// eslint-disable-line
        e.preventDefault();
        $('.payment-information').data('is-new-payment', true);// eslint-disable-line
        require('./../base/checkout/billing').methods.clearCreditCardForm();
        $('.credit-card-form').removeClass('checkout-hidden');// eslint-disable-line
        $('.user-payment-instruments').addClass('checkout-hidden');// eslint-disable-line
        $('.payment-information input').removeClass('is-invalid');// eslint-disable-line
        $('.payment-information select').removeClass('is-invalid');// eslint-disable-line
        $('.payment-information .security-code-input .invalid-feedback').removeAttr('style');// eslint-disable-line
        $('.payment-information .saved-payment-security-code').val('');// eslint-disable-line
    });

/*
*Back to payment button for credit card event function as ajax replaced the payment section and event binding lost.
*/
    $(document).on('click', '.cancel-new-payment', function (e) {// eslint-disable-line
        e.preventDefault();// eslint-disable-line
        $('.payment-information').data('is-new-payment', false);// eslint-disable-line
        require('./../base/checkout/billing').methods.clearCreditCardForm();
        $('.user-payment-instruments').removeClass('checkout-hidden');// eslint-disable-line
        $('.credit-card-form').addClass('checkout-hidden');// eslint-disable-line
        $('.credit-card-form input[name$="_cardOwner"]').val('');// eslint-disable-line
        $('.payment-information input').removeClass('is-invalid');// eslint-disable-line
        $('.payment-information select').removeClass('is-invalid');// eslint-disable-line
        $('.payment-information .security-code-input .invalid-feedback').removeAttr('style');// eslint-disable-line
        $('.payment-information .saved-payment-security-code').val('');// eslint-disable-line
    });

/*
*Submit shipping button handling.
*/
$('.submit-shipping').on('click', function (e) { // eslint-disable-line
    var shippingCountry = $('#shippingCountry').val(); // eslint-disable-line
    $.ajax({ // eslint-disable-line
        url: $('.form-nav.billing-nav.payment-information').data('apmlookup-url') + '&shippingCountry=' + shippingCountry, // eslint-disable-line
        type: 'get',
        context: this,
        dataType: 'html',
        success: function (data) {
            $('.form-nav.billing-nav.payment-information').parent().html(data); // eslint-disable-line
            require('../base/checkout/billing').paymentTabs();
            var cleave = require('../base/components/cleave');
            cleave.handleCreditCardNumber('.cardNumber', '#cardType');
            $('.cardNumber').data('cleave').properties.creditCardStrictMode = true; // eslint-disable-line
        }
    });
});

/*
*Security code validation handling.
*/
    $('#securityCode').on('keypress', function (ev) {// eslint-disable-line
        var evt = (ev) || window.event;
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    });

/*
*Submit payment button handling where process the encryption for card fields.
*/
$('.submit-payment').on('click', function (e) { // eslint-disable-line
    $('#dwfrm_billing').find('[name$="_encryptedData"]').val(''); // eslint-disable-line
    if ($('.payment-information').data('payment-method-id')) {// eslint-disable-line
        $('input[name$="paymentMethod"]').val($('.payment-information').data('payment-method-id'));// eslint-disable-line
    }
    if ($('.payment-information').data('payment-method-id')=="PAYWITHGOOGLE-SSL"){ // eslint-disable-line
   	 if($('#signature').attr('value')=="" || $('#protocolVersion').attr('value')=="" || $('#signedMessage').attr('value')==""){ // eslint-disable-line
   		$("#gpayerror").show(); // eslint-disable-line
        return false;
    }
    }
    if ($('.data-checkout-stage').data('customer-type') === 'registered') {// eslint-disable-line
        // if payment method is credit card
       	$('.payment-information input:hidden[name$=storedPaymentUUID]').remove();// eslint-disable-line
       	$('.payment-information input:hidden[name$=securityCode]').remove();// eslint-disable-line
        if ($('.payment-information').data('payment-method-id') === 'Worldpay') {// eslint-disable-line
            if (!($('.payment-information').data('is-new-payment'))) {// eslint-disable-line
                var cvvCode = $('.saved-payment-instrument.' + 'selected-payment .saved-payment-security-code').val();// eslint-disable-line
                var savedPaymentInstrument = $('.saved-payment-instrument' +'.selected-payment');// eslint-disable-line
                if (savedPaymentInstrument.data('uuid') && cvvCode) {
                    $('.payment-information').append('<input type="hidden" name="storedPaymentUUID" value='+savedPaymentInstrument.data('uuid')+' />');// eslint-disable-line
                    $('.payment-information').append('<input type="hidden" name="securityCode" value='+cvvCode+' />');// eslint-disable-line
                }
            }
        }
    }
    if ($('input[name$="paymentMethod"]').val() === 'CREDIT_CARD' && undefined !== $('.cardNumber').data('cleave')) {// eslint-disable-line
        var creditCardTypes = {
            visa: 'Visa',
            mastercard: 'MasterCard',
            amex: 'Amex',
            discover: 'Discover',
            uatp: 'Airplus',
            diners: 'DinersClub',
            dankort: 'Dankort',
            instapayment: 'Instapayment',
            jcb: 'JCB',
            maestro: 'Maestro',
            laser: 'Laser',
            general: 'General',
            unionPay: 'UnionPay',
            mir: 'Mir',
            generalStrict: 'GeneralStrict',
            unknown: 'Unknown'
        };

        var cardType = creditCardTypes[Object.keys(creditCardTypes).indexOf($('.cardNumber').data('cleave').properties.creditCardType) > -1 // eslint-disable-line
                ?
                $('.cardNumber').data('cleave').properties.creditCardType // eslint-disable-line
                :
                'unknown'];
        $('#cardType').val(cardType); // eslint-disable-line
        $('.card-number-wrapper').attr('data-type', cardType); // eslint-disable-line
        if ($('.WorldpayClientSideEncryptionEnabled').length > 0) { // eslint-disable-line
            var data = {
                cvc: $('#dwfrm_billing').find('input[name*="_securityCode"]').val(), // eslint-disable-line
                cardHolderName: $('#dwfrm_billing').find('input[name*="_cardOwner"]').val(), // eslint-disable-line
                cardNumber: $('#dwfrm_billing').find('input[name*="_cardNumber"]').val().replace(/ /g, ''), // eslint-disable-line
                expiryMonth: $('#dwfrm_billing').find('[name$="_expirationMonth"]').val() < 10 ? '0' + $('#dwfrm_billing').find('[name$="_expirationMonth"]').val() : $('#dwfrm_billing').find('[name$="_expirationMonth"]').val(), // eslint-disable-line
                expiryYear: $('#dwfrm_billing').find('[name$="_expirationYear"]').val() // eslint-disable-line
            };
            Worldpay.setPublicKey($('.WorldpayClientSideEncryptionEnabled').attr('data-publickey')); // eslint-disable-line
            var encryptedData = Worldpay.encrypt(data, function () { // eslint-disable-line
            // console.log("Worldpay Client Side Encryption validation error "+e);
            });
            if (encryptedData) {
                $('#dwfrm_billing').find('[name$="_encryptedData"]').val(encryptedData); // eslint-disable-line
            }
        }
    }
    if ($('.saved-payment-security-code').length > 0) {// eslint-disable-line
        var regex = /^(\s*|[0-9]{3})$/;
        var regexAmex = /^(\s*|[0-9]{4})$/;
        $('.saved-payment-security-code').each(function () {// eslint-disable-line
            var cardTypeText = $('.saved-payment-security-code').parents('.saved-payment-instrument').find('.saved-credit-card-type').text();// eslint-disable-line
            if (cardTypeText && cardTypeText.indexOf('Amex') > -1 && (regexAmex.test($(this).val()) === false)) {// eslint-disable-line
                $(this).siblings('.invalid-feedback').show();// eslint-disable-line
            } else if (cardTypeText && cardTypeText.indexOf('Amex') < 0 && (regex.test($(this).val()) === false)) {// eslint-disable-line
                $(this).siblings('.invalid-feedback').show();// eslint-disable-line
            }
        });
    }
});

    $('body').on('focusout', '#cardNumber', function (evt) {// eslint-disable-line
        var cType = $('.card-number-wrapper')[0].dataset.type;// eslint-disable-line
        if (cType === 'visa' || cType === 'mastercard' || cType === 'discover' || cType === 'maestro' || cType === 'laser' || cType === 'uatp' || cType === 'diners' || cType === 'jcb') {
            $('#securityCode').attr('maxlength', 3);// eslint-disable-line
        } else {
            $('#securityCode').attr('maxlength', 4);// eslint-disable-line
        }
        return true;
    });
};
