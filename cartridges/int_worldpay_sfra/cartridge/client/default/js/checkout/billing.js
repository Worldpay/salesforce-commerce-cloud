'use strict';

/*
*Payment method tab click handling and manipulating the
*cpg DOM for CC, BS and WP
*/
module.exports = function () {
    var updateBoletoDOM = function (countryCode, paymentType) {
        if (!countryCode && !paymentType) {
            return;
        }
        var billingForm = $('#dwfrm_billing');
        if (countryCode === 'BR' && (paymentType === 'CREDIT_CARD' || paymentType === 'BOLETO-SSL' || paymentType === 'Worldpay')) {
            billingForm.find('#boleto-content').removeClass('tab-pane fade');
        } else if (countryCode === 'BR' && paymentType === 'Worldpay' && $('.saved-payment-security-code').length > 0) {
            billingForm.find('#boleto-content').removeClass('tab-pane fade');
        } else {
            billingForm.find('#boleto-content').addClass('tab-pane fade');
        }
        if ($('.tokenization-disabled').length > 0 && paymentType === 'Worldpay') {
            $('.worldpaySaveCreditFields input:checkbox').removeAttr('checked');
        }
        $('.payment-information input').removeClass('is-invalid');
        $('.payment-information select').removeClass('is-invalid');
        $('.payment-information .security-code-input .invalid-feedback').removeAttr('style');
        $('.payment-information .saved-payment-security-code').val('');
        $('.payment-information .securityCode').val('');
        if ($('.nav-item#CREDIT_CARD').length > 0) {
            $('.cardNumber').data('cleave').properties.creditCardStrictMode = true;
        }
    };

	/*
	*Payment method tab click handling and manipulating the
	*cpg DOM for CC, BS and WP
	*/
    $(document).on('click', '.payment-options .nav-item', function (e) {
        var paymentType = $(e.currentTarget).attr('data-method-id'), // eslint-disable-line
            countryCode = $('#billingCountry').val();
        $('.payment-information').attr('data-payment-method-id', paymentType);

        updateBoletoDOM(countryCode, paymentType);
    });

    $(document).on('focus', '.saved-payment-security-code', function () {
        $(document).find('#worldpayCards').val('');
    });


    $(document).on('change', '#worldpayCards', function () {
        $(document).find('.saved-payment-security-code').val('');
        $(document).find('.saved-payment-instrument').removeClass('selected-payment');
    });

    $(document).ajaxStart(function (event, xhr, settings) { // eslint-disable-line
        if ($(event.currentTarget.activeElement).hasClass('submit-payment') || $(event.currentTarget.activeElement).hasClass('place-order') || $(event.currentTarget.activeElement).hasClass('submit-shipping')) {
            $.spinner().start();
        }
    });
    $(document).ajaxComplete(function (event, xhr, settings) {
        if ($('#containergpay').length && $('#containergpay').attr('data-set') == "0") { // eslint-disable-line
            addGooglePayButton(); // eslint-disable-line
        }
        $.spinner().stop();
        if (settings.url === $('.place-order').data('action')) {
            if (xhr.responseJSON.isValidCustomOptionsHPP && xhr.responseJSON.customOptionsHPPJSON) {
                var libraryObject = new WPCL.Library(); // eslint-disable-line
                libraryObject.setup(JSON.parse(unescape(xhr.responseJSON.customOptionsHPPJSON)));
                $('#custom-trigger').trigger('click');
                $('button.place-order').hide();
                $('.edit-button').hide();
                $('.error-message-text').text('');
                $('.error-message').hide();
            } else if (xhr.responseJSON.isKlarna && xhr.responseJSON.klarnasnippet) {
                var decodedSnippet = xhr.responseJSON.klarnasnippet;
                if (decodedSnippet) {
                    $('#klarnaiframe').contents().find('body').html(decodedSnippet);
                    $('#klarnaiframe').show();
                }
                $('button.place-order').hide();
                $('.edit-button').hide();
                $('.error-message-text').text('');
                $('.error-message').hide();
            }
        }
        if (settings.url === $('.submit-payment').data('action')) {
            var str = $('.payment-details').find('div span').text();
            if (str.length > 0 && str.trim().indexOf('/') === (str.trim().length - 1)) {
                str = str.replace('/', '');
            }
            $('.payment-details').find('div span').text(str);
            var paymentinstrument = xhr.responseJSON.order.billing.payment.selectedPaymentInstruments[0];
            if (paymentinstrument.paymentMethod && paymentinstrument.paymentMethod === 'CREDIT_CARD' && paymentinstrument.ccnum && (paymentinstrument.ccnum.indexOf('*') < 0)) {
                var bin = JSON.parse(xhr.responseJSON.order.billing.payment.selectedPaymentInstruments[0].ccnum);
                var ccnum = CryptoJS.AES.encrypt(bin.toString(), "SecretPassphrase"); // eslint-disable-line
                var iframeurl = $('#cardiframe').data('url');
                var ccnum2 = iframeurl + '?instrument=' + encodeURIComponent(ccnum.toString());
                $('#cardiframe').attr('src', ccnum2);
                window.addEventListener('message', function (event) { // eslint-disable-line
                    var data = JSON.parse(event.data);
                    var dataSessionId = data.SessionId;
                    // console.log(dataSessionId);
                    var url = $('#sessionIDEP').val();
                    $.ajax({
                        url: url,
                        data: { dataSessionId: dataSessionId },
                        type: 'POST'
                    });
                }, false);
            } else {
                $('#cardiframe').attr('src', '');
                $('#cardiframe').removeAttr('src');
            }
        }
        if ($('.form-check-input.check').is(':checked') && $('.payment-information').data('payment-method-id') === 'CREDIT_CARD') {
            $('.dis_id').show();
            if ($('#isDisclaimerMandatory').attr('value') === undefined && $('#showDisclaimer').attr('value') === 'true' && !$('[name="disclaimer"][value="yes"]').is(':checked')) {
                $('#chosetosave').show();
            }
        }
        if ($('.form-check-input.checkccredirect').is(':checked') && $('.payment-information').data('payment-method-id') === 'Worldpay' && !$('[name="disclaimercc"][value="yes"]').is(':checked')) {
            $('.dis_idredirect').show();
            if ($('#isDisclaimerMandatory').attr('value') === undefined && $('#showDisclaimer').attr('value') === 'true') {
                $('#chosetosaveredirect').show();
            }
        }

        $('.form-check-input.check').click(function () {
            if ($('.payment-information').data('payment-method-id') === 'CREDIT_CARD') {
                if ($(this).is(':checked')) {
                    $('.dis_id').show();
                    if ($('#isDisclaimerMandatory').attr('value') === undefined && $('#showDisclaimer').attr('value') === 'true') {
                        $('#chosetosave').show();
                    }
                } else {
                    $('.dis_id').hide();
                    $('#disclaimererror').hide();
                    $('#chosetosave').hide();
                }
            }
        });
        $('.form-check-input.checkccredirect').click(function () { // eslint-disable-line

            if ($('.payment-information').data('payment-method-id') === 'Worldpay') {
                if ($(this).is(':checked')) {
                    $('.dis_idredirect').show();
                    if ($('#isDisclaimerMandatory').attr('value') === undefined && $('#showDisclaimer').attr('value') === 'true') {
                        $('#chosetosaveredirect').show();
                    }
                } else {
                    $('.dis_idredirect').hide();
                    $('#disclaimererrorccredirect').hide();
                    $('#chosetosaveredirect').hide();
                }
            }
        });

        $('#disclaimerModal').on('hidden.bs.modal', function () {
            if ($("input[name$='disclaimer']:checked").val() === 'no') {
                $('.form-check-input.check').prop('checked', false);
                $('.dis_id').hide();
                $('#disclaimererror').hide();
            }
            $('#chosetosave').hide();
            if ($("input[name$='disclaimer']:checked").val()) {
                $('#disclaimererror').hide();
            }
        });
        $('#disclaimerModalRedirect').on('hidden.bs.modal', function () {
            if ($("input[name$='disclaimercc']:checked").val() === 'no') {
                $('.form-check-input.checkccredirect').prop('checked', false);
                $('.dis_idredirect').hide();
                $('#disclaimererrorccredirect').hide();
            }
            $('#chosetosaveredirect').hide();
            if ($("input[name$='disclaimercc']:checked").val()) {
                $('#disclaimererrorccredirect').hide();
            }
        });
    });
    $(document).ready(function () {
        var checkoutmain = $('#checkout-main');
        if (checkoutmain.length && checkoutmain.attr('data-checkout-stage') === 'placeOrder') {
            var cardnumber = $('#hidden-card-number');
            if (cardnumber.length && cardnumber.attr('data-number').indexOf('*') < 0) {
                var bin = cardnumber.data('number');
                var ccnum = CryptoJS.AES.encrypt(bin.toString(), "SecretPassphrase"); // eslint-disable-line
                var iframeurl = $('#cardiframe').data('url');
                var ccnum2 = iframeurl + '?instrument=' + encodeURIComponent(ccnum.toString());
                $('#cardiframe').attr('src', ccnum2);
                window.addEventListener('message', function (event) {
                    var data = JSON.parse(event.data);
                    var dataSessionId = data.SessionId;
                    // console.log(dataSessionId);
                    var url = $('#sessionIDEP').val();
                    $.ajax({
                        url: url,
                        data: { dataSessionId: dataSessionId },
                        type: 'POST'
                    });
                }, false);
            } else {
                $('#cardiframe').attr('src', '');
                $('#cardiframe').removeAttr('src');
            }
        }
        if ($('.form-check-input.check').is(':checked') && $('.payment-information').data('payment-method-id') === 'CREDIT_CARD') {
            $('.dis_id').show();
            if ($('#isDisclaimerMandatory').attr('value') === undefined && $('#showDisclaimer').attr('value') === 'true') {
                $('#chosetosave').show();
            }
        }
        if ($('.form-check-input.checkccredirect').is(':checked') && $('.payment-information').data('payment-method-id') === 'Worldpay') {
            $('.dis_idredirect').show();
            if ($('#isDisclaimerMandatory').attr('value') === undefined && $('#showDisclaimer').attr('value') === 'true') {
                $('#chosetosaveredirect').show();
            }
        }
        $('.form-check-input.check').click(function () {
            if ($('.payment-information').data('payment-method-id') === 'CREDIT_CARD') {
                if ($(this).is(':checked')) {
                    $('.dis_id').show();
                    if ($('#isDisclaimerMandatory').attr('value') === undefined && $('#showDisclaimer').attr('value') === 'true') {
                        $('#chosetosave').show();
                    }
                } else {
                    $('.dis_id').hide();
                    $('#disclaimererror').hide();
                    $('#chosetosave').hide();
                }
            }
        });
        $('.form-check-input.checkccredirect').click(function () {
            if ($('.payment-information').data('payment-method-id') === 'Worldpay') {
                if ($(this).is(':checked')) {
                    $('.dis_idredirect').show();
                    if ($('#isDisclaimerMandatory').attr('value') === undefined && $('#showDisclaimer').attr('value') === 'true') {
                        $('#chosetosaveredirect').show();
                    }
                } else {
                    $('.dis_idredirect').hide();
                    $('#disclaimererrorccredirect').hide();
                    $('#chosetosaveredirect').hide();
                }
            }
        });
        $('#disclaimerModal').on('hidden.bs.modal', function () {
            if ($("input[name$='disclaimer']:checked").val() === 'no') {
                $('.form-check-input.check').prop('checked', false);
                $('.dis_id').hide();
                $('#disclaimererror').hide();
            }
            $('#chosetosave').hide();
            if ($("input[name$='disclaimer']:checked").val()) {
                $('#disclaimererror').hide();
            }
        });

        $('#disclaimerModalRedirect').on('hidden.bs.modal', function () {
            if ($("input[name$='disclaimercc']:checked").val() === 'no') {
                $('.form-check-input.checkccredirect').prop('checked', false);
                $('.dis_idredirect').hide();
                $('#disclaimererrorccredirect').hide();
            }
            $('#chosetosaveredirect').hide();
            if ($("input[name$='disclaimercc']:checked").val()) {
                $('#disclaimererrorccredirect').hide();
            }
        });
    });

    $('body').on('change', '.addressSelector', function () {
        var lookupCountry = $('option[value=' + this.value + ']', this).attr('data-country-code');
        $.ajax({
            url: $('.form-nav.billing-nav.payment-information').data('apmlookup-url') + '&lookupCountry=' + lookupCountry,
            type: 'get',
            context: this,
            dataType: 'html',
            success: function (data) {
                $('.form-nav.billing-nav.payment-information').parent().html(data);
                require('base/checkout/billing').paymentTabs();
                if ($('.nav-item#CREDIT_CARD').length > 0) {
                    var cleave = require('base/components/cleave');
                    cleave.handleCreditCardNumber('.cardNumber', '#cardType');
                }

                var paymentType = $('#dwfrm_billing').find('.nav-link.active').parent('li').attr('data-method-id');
                var countryCode = $('#billingCountry').val();
                updateBoletoDOM(countryCode, paymentType);
            }
        });
    });
	/*
	*Payment section change on change of billing country
	*/
    $('body').on('change', '#billingCountry', function () {
        var lookupCountry = $('#billingCountry').val();
        $.ajax({
            url: $('.form-nav.billing-nav.payment-information').data('apmlookup-url') + '&lookupCountry=' + lookupCountry,
            type: 'get',
            context: this,
            dataType: 'html',
            success: function (data) {
                $('.form-nav.billing-nav.payment-information').parent().html(data);
                require('base/checkout/billing').paymentTabs();
                if ($('.nav-item#CREDIT_CARD').length > 0) {
                    var cleave = require('base/components/cleave');
                    cleave.handleCreditCardNumber('.cardNumber', '#cardType');
                }
                var paymentType = $('#dwfrm_billing').find('.nav-link.active').parent('li').attr('data-method-id');
                var countryCode = $('#billingCountry').val();
                updateBoletoDOM(countryCode, paymentType);
            }
        });
    });

	/*
	*Add payment button for credit card event function as ajax replaced the payment section and event binding lost.
	*/
    $(document).on('click', '.btn.add-payment', function (e) {
        e.preventDefault();
        $('.payment-information').data('is-new-payment', true);
        require('base/checkout/billing').methods.clearCreditCardForm();
        $('.credit-card-form').removeClass('checkout-hidden');
        $('.user-payment-instruments').addClass('checkout-hidden');
        $('.payment-information input').removeClass('is-invalid');
        $('.payment-information select').removeClass('is-invalid');
        $('.payment-information .security-code-input .invalid-feedback').removeAttr('style');
        $('.payment-information .saved-payment-security-code').val('');
    });

	/*
	*Back to payment button for credit card event function as ajax replaced the payment section and event binding lost.
	*/
    $(document).on('click', '.cancel-new-payment', function (e) {
        e.preventDefault();
        $('.payment-information').data('is-new-payment', false);
        require('base/checkout/billing').methods.clearCreditCardForm();
        $('.user-payment-instruments').removeClass('checkout-hidden');
        $('.credit-card-form').addClass('checkout-hidden');
        $('.credit-card-form input[name$="_cardOwner"]').val('');
        $('.payment-information input').removeClass('is-invalid');
        $('.payment-information select').removeClass('is-invalid');
        $('.payment-information .security-code-input .invalid-feedback').removeAttr('style');
        $('.payment-information .saved-payment-security-code').val('');
    });

	/*
	*Submit shipping button handling.
	*/
    $('.submit-shipping').on('click', function (e) { // eslint-disable-line
        var shippingCountry = $('#shippingCountrydefault').val();
        $.ajax({
            url: $('.form-nav.billing-nav.payment-information').data('apmlookup-url') + '&shippingCountry=' + shippingCountry,
            type: 'get',
            context: this,
            dataType: 'html',
            success: function (data) {
                $('.form-nav.billing-nav.payment-information').parent().html(data);

                // unchecks the save credit card options on the non-active tabs
                $(".nav-link:not('.active')").each(function () {
                    var paymentContent = $(this).attr('href');
                    // eslint-disable-next-line no-useless-concat
                    var elem = $(paymentContent + ' ' + 'input[name$="_creditCardFields_saveCard"]');
                    elem.prop('checked', false);
                });

                require('base/checkout/billing').paymentTabs();
                var cleave = require('base/components/cleave');
                cleave.handleCreditCardNumber('.cardNumber', '#cardType');
                $('.cardNumber').data('cleave').properties.creditCardStrictMode = true;
            }
        });
    });

	/*
	*Security code validation handling.
	*/
    $('#securityCode').on('keypress', function (ev) {
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
        $('#dwfrm_billing').find('[name$="_encryptedData"]').val('');
        if ($('.payment-information').data('payment-method-id')) {
            $('input[name$="paymentMethod"]').val($('.payment-information').data('payment-method-id'));
        }
        if ($('.payment-information').data('payment-method-id') === 'PAYWITHGOOGLE-SSL') {
            if ($('#signature').attr('value') == '' || $('#protocolVersion').attr('value') == '' || $('#signedMessage').attr('value') == '') { // eslint-disable-line
                $('#gpayerror').show();
                return false;
            }
        }
        if ($('#isDisclaimerMandatory').attr('value') == 'true' && $('#showDisclaimer').attr('value') == 'true' && $('.form-check-input.check').is(':checked')) { // eslint-disable-line
            if ($('div.user-payment-instruments.checkout-hidden').length !== 0 && $('.payment-information').data('payment-method-id') === 'CREDIT_CARD') {
                if ($('#clickeventdis').attr('value') == '' && ($("input[name$='disclaimer']:checked").val() == 'no')) { // eslint-disable-line
                    $('#disclaimererror').show();
                    return false;
                }
            }
        }

        if ($('#isDisclaimerMandatory').attr('value') == 'true' && $('#showDisclaimer').attr('value') == 'true' && $('.form-check-input.checkccredirect').is(':checked')) { // eslint-disable-line
            if ($('.payment-information').data('payment-method-id') === 'Worldpay' && $('.saved-payment-instrument.selected-payment.worldpay').length === 0) {
                if ($('#clickeventdis').attr('value') == '' && ($("input[name$='disclaimercc']:checked").val() == 'no')) { // eslint-disable-line
                    $('#disclaimererrorccredirect').show();
                    return false;
                }
            } else if ($('.payment-information').data('payment-method-id') === 'Worldpay' && $('.saved-payment-instrument.selected-payment.worldpay').length !== 0) {
                $('#disclaimererrorccredirect').hide();
            }
        }

        if ($('#isDisclaimerMandatory').attr('value') === undefined && $('.form-check-input.check').is(':checked')) {
            if ($('.payment-information').data('payment-method-id') === 'CREDIT_CARD') {
                $('#chosetosave').hide();
            }
        }
        if ($('#isDisclaimerMandatory').attr('value') === undefined && $('.form-check-input.checkccredirect').is(':checked')) {
            if ($('.payment-information').data('payment-method-id') === 'Worldpay') {
                $('#chosetosaveredirect').hide();
            }
        }
        if ($('.data-checkout-stage').data('customer-type') === 'registered') {
            // if payment method is credit card
            $('.payment-information input:hidden[name$=storedPaymentUUID]').remove();
            if ($('.payment-information').data('payment-method-id') === 'Worldpay') {
                if (!($('.payment-information').data('is-new-payment'))) {
                    var cvvCode = $('.saved-payment-instrument.' + 'selected-payment .saved-payment-security-code').val(); // eslint-disable-line
                    var savedPaymentInstrument = $('.saved-payment-instrument' + '.selected-payment'); // eslint-disable-line
                    if (savedPaymentInstrument.data('uuid') && savedPaymentInstrument.data('paymentmethod') === 'Worldpay') {
                        $('.payment-information').append('<input type="hidden" name="storedPaymentUUID" value=' + savedPaymentInstrument.data('uuid') + ' />');
                        // $('.payment-information').append('<input type="hidden" name="securityCode" value='+cvvCode+' />');
                    }
                }
            }
        }
        if ($('input[name$="paymentMethod"]').val() === 'CREDIT_CARD' && undefined !== $('.cardNumber').data('cleave')) {
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

            var cardType = creditCardTypes[Object.keys(creditCardTypes).indexOf($('.cardNumber').data('cleave').properties.creditCardType) > -1
                ?
                $('.cardNumber').data('cleave').properties.creditCardType
                :
                'unknown'];
            $('#cardType').val(cardType);
            $('.card-number-wrapper').attr('data-type', cardType);
            if ($('.WorldpayClientSideEncryptionEnabled').length > 0) {
                var data = {
                    cvc: $('#dwfrm_billing').find('input[name*="_securityCode"]').val(),
                    cardHolderName: $('#dwfrm_billing').find('input[name*="_cardOwner"]').val(),
                    cardNumber: $('#dwfrm_billing').find('input[name*="_cardNumber"]').val().replace(/ /g, ''),
                    expiryMonth: $('#dwfrm_billing').find('[name$="_expirationMonth"]').val() < 10 ? '0' + $('#dwfrm_billing').find('[name$="_expirationMonth"]').val() : $('#dwfrm_billing').find('[name$="_expirationMonth"]').val(),
                    expiryYear: $('#dwfrm_billing').find('[name$="_expirationYear"]').val()
                };
                Worldpay.setPublicKey($('.WorldpayClientSideEncryptionEnabled').attr('data-publickey')); // eslint-disable-line
                var encryptedData = Worldpay.encrypt(data, function () { // eslint-disable-line
                    // console.log("Worldpay Client Side Encryption validation error "+e);
                });
                if (encryptedData) {
                    $('#dwfrm_billing').find('[name$="_encryptedData"]').val(encryptedData);
                }
            }
        }
        if ($('.saved-payment-security-code').length > 0) {
            var regex = /^(\s*|[0-9]{3})$/;
            var regexAmex = /^(\s*|[0-9]{4})$/;
            $('.saved-payment-security-code').each(function () {
                var cardTypeText = $('.saved-payment-security-code').parents('.saved-payment-instrument').find('.saved-credit-card-type').text();
                if (cardTypeText && cardTypeText.indexOf('Amex') > -1 && (regexAmex.test($(this).val()) === false)) {
                    $(this).siblings('.invalid-feedback').show();
                } else if (cardTypeText && cardTypeText.indexOf('Amex') < 0 && (regex.test($(this).val()) === false)) {
                    $(this).siblings('.invalid-feedback').show();
                }
            });
        }
    });

    $('body').on('focusout', '#cardNumber', function (evt) { // eslint-disable-line
        var cType = $('.card-number-wrapper')[0].dataset.type;
        if (cType === 'visa' || cType === 'mastercard' || cType === 'discover' || cType === 'maestro' || cType === 'laser' || cType === 'uatp' || cType === 'diners' || cType === 'jcb') {
            $('#securityCode').attr('maxlength', 3);
        } else {
            $('#securityCode').attr('maxlength', 4);
        }
        return true;
    });

    $('body').on('click', '.nav-item#CREDIT_CARD', function () {
        $('.tab-pane.credit-card-content-redirect input[name$="_creditCardFields_saveCard"]').prop('checked', false);
        $('.tab-pane.credit-card-content input[name$="_creditCardFields_saveCard"]').prop('checked', true);
        if ($('#isDisclaimerMandatory').attr('value') === undefined && $('#showDisclaimer').attr('value') === 'true' && $('.data-checkout-stage').data('customer-type') === 'registered') {
            $('#chosetosave').show();
        }
    });

    $('body').on('click', '.nav-item#Worldpay', function () {
        $('.tab-pane.credit-card-content input[name$="_creditCardFields_saveCard"]').prop('checked', false);
        $('.tab-pane.credit-card-content-redirect input[name$="_creditCardFields_saveCard"]').prop('checked', true);
        if ($('#isDisclaimerMandatory').attr('value') === undefined && $('#showDisclaimer').attr('value') === 'true' && $('.data-checkout-stage').data('customer-type') === 'registered') {
            $('#chosetosaveredirect').show();
        }
    });

    $(document).on('click', '.saved-payment-instrument', function (e) {
        e.preventDefault();
        var paymentMethod = $(this).data('paymentmethod');
        if (paymentMethod && paymentMethod === 'Worldpay') {
            $('.saved-payment-security-code').val('');
            $('.saved-payment-instrument').removeClass('selected-payment');
            $(this).addClass('selected-payment');
            $('.saved-payment-instrument .card-image').removeClass('checkout-hidden');
            $('.saved-payment-instrument .security-code-input').addClass('checkout-hidden');
            $('.saved-payment-instrument.selected-payment ' +
                '.security-code-input').removeClass('checkout-hidden');
        } else {
            $('.saved-payment-security-code').val('');
            $('.saved-payment-instrument').removeClass('selected-payment');
            $(this).addClass('selected-payment');
            $('.saved-payment-instrument .card-image').removeClass('checkout-hidden');
            $('.saved-payment-instrument .security-code-input').addClass('checkout-hidden');
            $('.saved-payment-instrument.selected-payment' +
                ' .card-image').addClass('checkout-hidden');
            $('.saved-payment-instrument.selected-payment ' +
                '.security-code-input').removeClass('checkout-hidden');
        }
    });
};

