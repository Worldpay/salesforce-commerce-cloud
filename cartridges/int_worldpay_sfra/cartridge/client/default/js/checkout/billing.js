'use strict';

var base = require('base/checkout/billing');

/**
 * Updates the DOM for BOLETO
 * @param {string}countryCode - Country Code
 * @param {string}paymentType - Payment Type
 */
function updateBoletoDOM(countryCode, paymentType) {
    if (!countryCode && !paymentType) {
        return;
    }
    var billingForm = $('#dwfrm_billing');
    var enableCpf = document.getElementById('enableCPF') ? document.getElementById('enableCPF').value : '';
    if (countryCode === 'BR' && (paymentType === 'CREDIT_CARD' || paymentType === 'BOLETO-SSL' || paymentType === 'Worldpay') && enableCpf) {
        billingForm.find('#boleto-content').removeClass('tab-pane fade');
        $('#statementNarrativecontent').show();
    } else if (countryCode === 'BR' && paymentType === 'Worldpay' && enableCpf && $('.saved-payment-security-code').length > 0) {
        billingForm.find('#boleto-content').removeClass('tab-pane fade');
        $('#statementNarrativecontent').show();
    } else {
        billingForm.find('#boleto-content').addClass('tab-pane fade');
    }
    var enableInstallmentsForLatAm = document.getElementById('enableInstallmentsForLatAm').value;
    var isApplicableFOrLatem = document.getElementById('isApplicableFOrLatem').value;
    if ((paymentType === 'CREDIT_CARD' || paymentType === 'Worldpay') && ((enableInstallmentsForLatAm && isApplicableFOrLatem === 'true'))) {
        $('#statementNarrativecontent').show();
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
}

/*
*Payment method tab click handling and manipulating the
*cpg DOM for CC, BS and WP
*/
base.updateBoleto = function () {
    $(document).on('click', '.payment-options .nav-item', function (e) {
        var paymentType = $(e.currentTarget).attr('data-method-id').trim(), // eslint-disable-line
            countryCode = $('#billingCountry').val();
        $('.payment-information').attr('data-payment-method-id', paymentType);
        $('#' + paymentType).hide();
        $('#' + paymentType + 'Head').show();
        var scrollAnimate = require('base/components/scrollAnimate');
        scrollAnimate($('#payment-head-content'));
        if (paymentType === 'CREDIT_CARD' || paymentType === 'PAYWITHGOOGLE-SSL' || paymentType === 'Worldpay' || paymentType === 'SAMSUNGPAY' || paymentType === 'DW_APPLE_PAY') {
            $('#statementNarrativecontent').hide();
        } else {
            $('#statementNarrativecontent').show();
        }
        var enableCpf = document.getElementById('enableCPF') ? document.getElementById('enableCPF').value : '';
        var enableInstallmentsForLatAm = document.getElementById('enableInstallmentsForLatAm').value;
        var isApplicableFOrLatem = document.getElementById('isApplicableFOrLatem').value;
        if ((paymentType === 'CREDIT_CARD' || paymentType === 'Worldpay') && ((enableCpf && countryCode === 'BR') || (enableInstallmentsForLatAm && isApplicableFOrLatem === 'true'))) {
            $('#statementNarrativecontent').show();
        }
        var allPaymentMethodLength = $('#allpaymentmethodslength').attr('value');
        var isApplePaySupportedBrowser = $('body').hasClass('apple-pay-enabled');
        for (var i = 1; i <= allPaymentMethodLength; i++) {
            var nextPaymentMethod = $('#allpaymentmethods' + i).attr('value');
            if (paymentType !== nextPaymentMethod) {
                $('#' + nextPaymentMethod).show();
                $('#' + nextPaymentMethod + 'Head').hide();
            }
            // Applepay will be displayed only on apple devices
            if (nextPaymentMethod === 'DW_APPLE_PAY' && !isApplePaySupportedBrowser) {
                $('#' + nextPaymentMethod).hide();
            }
        }
        updateBoletoDOM(countryCode, paymentType);
    });
};


base.onFocusOfSavedCards = function () {
    $(document).on('focus', '.saved-payment-security-code', function () {
        $(document).find('#worldpayCards').val('');
    });
};

base.onChangeWorldpayCards = function () {
    $(document).on('change', '#worldpayCards', function () {
        $(document).find('.saved-payment-security-code').val('');
        $(document).find('.saved-payment-instrument').removeClass('selected-payment');
    });
};

base.validateSecurityCode = function () {
    $('#securityCode').on('keypress', function (ev) {
        var evt = (ev) || window.event;
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    });
};

base.handleSaveCard = function () {
    $('body').on('click', '.nav-item#CREDIT_CARD', function () {
        $('.tab-pane.credit-card-content-redirect input[name$="_creditCardFields_saveCard"]').prop('checked', false);
        $('.tab-pane.credit-card-content input[name$="_creditCardFields_saveCard"]').prop('checked', true);
        if ($('#showDisclaimer').attr('value') === 'true' && $('.data-checkout-stage').data('customer-type') === 'registered') {
            $('.dis_id').show();
            if ($('#isDisclaimerMandatory').attr('value') === undefined && ($("input[name$='disclaimer']:checked").val() === 'no')) {
                $('#chose-to-save').show();
            }
        }
    });
    $('body').on('click', '#payment-method-creditcard', function () {
        $('.tab-pane.credit-card-content-redirect input[name$="_creditCardFields_saveCard"]').prop('checked', false);
        $('.tab-pane.credit-card-content input[name$="_creditCardFields_saveCard"]').prop('checked', true);
        if ($('#showDisclaimer').attr('value') === 'true' && $('.data-checkout-stage').data('customer-type') === 'registered') {
            $('.dis_id').show();
            if ($('#isDisclaimerMandatory').attr('value') === undefined && ($("input[name$='disclaimer']:checked").val() === 'no')) {
                $('#chose-to-save').show();
            }
        }
    });
    $('body').on('click', '.nav-item#Worldpay', function () {
        $('.tab-pane.credit-card-content input[name$="_creditCardFields_saveCard"]').prop('checked', false);
        $('.tab-pane.credit-card-content-redirect input[name$="_creditCardFields_saveCard"]').prop('checked', true);
        if ($('#showDisclaimer').attr('value') === 'true' && $('.data-checkout-stage').data('customer-type') === 'registered') {
            $('.dis_idredirect').show();
            if ($('#isDisclaimerMandatory').attr('value') === undefined && ($("input[name$='disclaimercc']:checked").val() === 'no')) {
                $('#chose-to-save-redirect').show();
            }
        }
    });
    $('body').on('click', '#payment-method-worldpay', function () {
        $('.tab-pane.credit-card-content input[name$="_creditCardFields_saveCard"]').prop('checked', false);
        $('.tab-pane.credit-card-content-redirect input[name$="_creditCardFields_saveCard"]').prop('checked', true);
        if ($('#showDisclaimer').attr('value') === 'true' && $('.data-checkout-stage').data('customer-type') === 'registered') {
            $('.dis_idredirect').show();
            if ($('#isDisclaimerMandatory').attr('value') === undefined && ($("input[name$='disclaimercc']:checked").val() === 'no')) {
                $('#chose-to-save-redirect').show();
            }
        }
    });
};

/*
*Submit payment button handling where process the encryption for card fields.
*/
base.processEncryption = function () {
    $('.submit-payment').on('click', function (e) { // eslint-disable-line
        $('#dwfrm_billing').find('[name$="_encryptedData"]').val('');
        if ($('.payment-information').data('payment-method-id')) {
            $('input[name$="paymentMethod"]').val($('.payment-information').data('payment-method-id'));
        }
        if ($('.payment-information').data('payment-method-id') === 'PAYWITHGOOGLE-SSL') {
            if ($('#signature').attr('value') == '' || $('#protocolVersion').attr('value') == '' || $('#signedMessage').attr('value') == '') { // eslint-disable-line
                $('#gpay-error').show();
                return false;
            }
        }
        if ($('#isDisclaimerMandatory').attr('value') == 'true' && // eslint-disable-line
            $('#showDisclaimer').attr('value') == 'true' && // eslint-disable-line
            $('.form-check-input.check').is(':checked')) {
            if ($('div.user-payment-instruments.checkout-hidden').length !== 0 && $('.payment-information').data('payment-method-id') === 'CREDIT_CARD') {
                if ($('#clickeventdis').attr('value') == '' && ($("input[name$='disclaimer']:checked").val() == 'no')) { // eslint-disable-line
                    $('#disclaimer-error').show();
                    return false;
                }
            }
        }

        if ($('#isDisclaimerMandatory').attr('value') == 'true' && // eslint-disable-line
            $('#showDisclaimer').attr('value') == 'true' && // eslint-disable-line
            $('.form-check-input.checkccredirect').is(':checked')) {
            if ($('.payment-information').data('payment-method-id') === 'Worldpay' && $('.saved-payment-instrument.selected-payment.worldpay').length === 0) {
                if ($('#clickeventdis').attr('value') == '' && ($("input[name$='disclaimercc']:checked").val() == 'no')) { // eslint-disable-line
                    $('#disclaimer-error-cc-redirect').show();
                    return false;
                }
            } else if ($('.payment-information').data('payment-method-id') === 'Worldpay' && $('.saved-payment-instrument.selected-payment.worldpay').length !== 0) {
                $('#disclaimer-error-cc-redirect').hide();
            }
        }

        if ($('#isDisclaimerMandatory').attr('value') === undefined && $('.form-check-input.check').is(':checked')) {
            if ($('.payment-information').data('payment-method-id') === 'CREDIT_CARD') {
                $('#chose-to-save').hide();
            }
        }
        if ($('#isDisclaimerMandatory').attr('value') === undefined && $('.form-check-input.checkccredirect').is(':checked')) {
            if ($('.payment-information').data('payment-method-id') === 'Worldpay') {
                $('#chose-to-save-redirect').hide();
            }
        }
        if ($('.data-checkout-stage').data('customer-type') === 'registered') {
            // if payment method is credit card
            $('.payment-information input:hidden[name$=storedPaymentUUID]').remove();
            if ($('.payment-information').data('payment-method-id') === 'Worldpay') {
                if (!($('.payment-information').data('is-new-payment'))) {
                    // var cvvCode = $('.saved-payment-instrument.' + 'selected-payment .saved-payment-security-code').val(); // eslint-disable-line
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
                    expiryMonth: $('#dwfrm_billing').find('[name$="_expirationMonth"]').val() < 10 ?
                        '0' + $('#dwfrm_billing').find('[name$="_expirationMonth"]').val() :
                        $('#dwfrm_billing').find('[name$="_expirationMonth"]').val(),
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
};

base.validateSecurityCodeLength = function () {
    $('body').on('focusout', '#cardNumber', function (evt) { // eslint-disable-line
        var cType = $('.card-number-wrapper')[0].dataset.type;
        if (cType === 'visa' ||
            cType === 'mastercard' ||
            cType === 'discover' ||
            cType === 'maestro' ||
            cType === 'laser' ||
            cType === 'uatp' ||
            cType === 'diners' ||
            cType === 'jcb') {
            $('#securityCode').attr('maxlength', 3);
        } else {
            $('#securityCode').attr('maxlength', 4);
        }
        return true;
    });
};

base.shippingAPMLookup = function () {
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
};

/*
*Back to payment button for credit card event function as ajax replaced the payment section and event binding lost.
*/
base.cancelNewPayment = function () {
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
};

/*
*Add payment button for credit card event function as ajax replaced the payment section and event binding lost.
*/
base.addPayment = function () {
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
};

/*
*Payment section change on change of billing country
*/
base.onBillingCountryChange = function () {
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

                var paymentType;
                if ($('#dwfrm_billing').find('.nav-link.active').length) {
                    paymentType = $('#dwfrm_billing').find('.nav-link.active').parent('li').attr('data-method-id');
                    $('#' + paymentType).hide();
                    $('#' + paymentType + 'Head').show();
                } else {
                    paymentType = $('#dwfrm_billing').find('.active [data-method-id].selected').attr('data-method-id');
                }

                var countryCode = $('#billingCountry').val();
                updateBoletoDOM(countryCode, paymentType);
            }
        });
    });
};

base.onAddressSelectorChange = function () {
    $('body').on('change', '.addressSelector', function () {
        var lookupCountry = $(this.selectedOptions).attr('data-country-code');
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

                var paymentType;
                if ($('#dwfrm_billing').find('.nav-link.active').length) {
                    paymentType = $('#dwfrm_billing').find('.nav-link.active').parent('li').attr('data-method-id');
                    $('#' + paymentType).hide();
                    $('#' + paymentType + 'Head').show();
                } else {
                    paymentType = $('#dwfrm_billing').find('.active [data-method-id].selected').attr('data-method-id');
                }
                var countryCode = $('#billingCountry').val();
                updateBoletoDOM(countryCode, paymentType);
            }
        });
    });
};

base.initBillingEvents = function () {
    $(document).ready(function () {
        var paymentType = $('.payment-information').data('payment-method-id').trim();// eslint-disable-line
        if ($('.payment-group .payment-method').length === 0) {
            $('#' + paymentType).hide();
            $('#' + paymentType + 'Head').show();
        }
        if (paymentType === 'CREDIT_CARD' || paymentType === 'PAYWITHGOOGLE-SSL' || paymentType === 'Worldpay' || paymentType === 'SAMSUNGPAY' || paymentType === 'DW_APPLE_PAY') {
            $('#statementNarrativecontent').hide();
        } else {
            $('#statementNarrativecontent').show();
        }
        var countryCode = $('#billingCountry').val();
        var enableCpf = document.getElementById('enableCPF') ? document.getElementById('enableCPF').value : '';
        var enableInstallmentsForLatAm = document.getElementById('enableInstallmentsForLatAm').value;
        var isApplicableFOrLatem = document.getElementById('isApplicableFOrLatem').value;
        if ((paymentType === 'CREDIT_CARD' || paymentType === 'Worldpay') && ((enableCpf && countryCode === 'BR') || (enableInstallmentsForLatAm && isApplicableFOrLatem === 'true'))) {
            $('#statementNarrativecontent').show();
        }
        var allPaymentMethodLength = $('#allpaymentmethodslength').attr('value');
        var isApplePaySupportedBrowser = $('body').hasClass('apple-pay-enabled');
        for (var i = 1; i <= allPaymentMethodLength; i++) {
            var nextPaymentMethod = $('#allpaymentmethods' + i).attr('value');
            if (paymentType !== nextPaymentMethod) {
                $('#' + nextPaymentMethod).show();
                $('#' + nextPaymentMethod + 'Head').hide();
            }
            // Applepay will be displayed only on apple devices
            if (nextPaymentMethod === 'DW_APPLE_PAY' && !isApplePaySupportedBrowser) {
                $('#' + nextPaymentMethod).hide();
            }
        }

        var checkoutmain = $('#checkout-main');
        if (checkoutmain.length && checkoutmain.attr('data-checkout-stage') === 'placeOrder') {
            var cardnumber = $('#hidden-card-number');
            if ((cardnumber.length && cardnumber.attr('data-number').indexOf('*') < 0) || paymentType === 'PAYWITHGOOGLE-SSL') {
                var bin = cardnumber ? cardnumber.data('number') : null;
                var iframeurl = $('#card-iframe').data('url');
                var ccnum2;
                if (bin) {
                    ccnum2 = iframeurl + '?instrument=' + bin.toString();
                } else {
                    ccnum2 = iframeurl;
                }
                $('#card-iframe').attr('src', ccnum2);
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
                $('#card-iframe').attr('src', '');
                $('#card-iframe').removeAttr('src');
            }
        }
        if ($('.form-check-input.check').is(':checked') && $('.payment-information').data('payment-method-id') === 'CREDIT_CARD') {
            $('.dis_id').show();
            if ($('#isDisclaimerMandatory').attr('value') === undefined && $('#showDisclaimer').attr('value') === 'true' && ($("input[name$='disclaimer']:checked").val() === 'no')) {
                $('#chose-to-save').show();
            }
        }
        if ($('.form-check-input.checkccredirect').is(':checked') && $('.payment-information').data('payment-method-id') === 'Worldpay') {
            $('.dis_idredirect').show();
            if ($('#isDisclaimerMandatory').attr('value') === undefined && $('#showDisclaimer').attr('value') === 'true' && ($("input[name$='disclaimercc']:checked").val() === 'no')) {
                $('#chose-to-save-redirect').show();
            }
        }
        $('.form-check-input.check').click(function () {
            if ($('.payment-information').data('payment-method-id') === 'CREDIT_CARD') {
                if ($(this).is(':checked')) {
                    $('.dis_id').show();
                    if ($('#isDisclaimerMandatory').attr('value') === undefined && $('#showDisclaimer').attr('value') === 'true' && ($("input[name$='disclaimer']:checked").val() === 'no')) {
                        $('#chose-to-save').show();
                    }
                } else {
                    $('.dis_id').hide();
                    $('#disclaimer-error').hide();
                    $('#chose-to-save').hide();
                }
            }
        });
        $('.form-check-input.checkccredirect').click(function () {
            if ($('.payment-information').data('payment-method-id') === 'Worldpay') {
                if ($(this).is(':checked')) {
                    $('.dis_idredirect').show();
                    if ($('#isDisclaimerMandatory').attr('value') === undefined && $('#showDisclaimer').attr('value') === 'true' && ($("input[name$='disclaimercc']:checked").val() === 'no')) {
                        $('#chose-to-save-redirect').show();
                    }
                } else {
                    $('.dis_idredirect').hide();
                    $('#disclaimer-error-cc-redirect').hide();
                    $('#chose-to-save-redirect').hide();
                }
            }
        });
        $('#disclaimerModal').on('hidden.bs.modal', function () {
            if ($("input[name$='disclaimer']:checked").val() === 'no') {
                $('.form-check-input.check').prop('checked', false);
                $('.dis_id').hide();
                $('#disclaimer-error').hide();
            }
            $('#chose-to-save').hide();
            if ($("input[name$='disclaimer']:checked").val()) {
                $('#disclaimer-error').hide();
            }
        });

        $('#disclaimerModalRedirect').on('hidden.bs.modal', function () {
            if ($("input[name$='disclaimercc']:checked").val() === 'no') {
                $('.form-check-input.checkccredirect').prop('checked', false);
                $('.dis_idredirect').hide();
                $('#disclaimer-error-cc-redirect').hide();
            }
            $('#chose-to-save-redirect').hide();
            if ($("input[name$='disclaimercc']:checked").val()) {
                $('#disclaimer-error-cc-redirect').hide();
            }
        });
    });
};

base.removeEmojis = function () {
    var ranges = [
        '\ud83c[\udf00-\udfff]',
        '\ud83d[\udc00-\ude4f]',
        '\ud83d[\ude80-\udeff]',
        '\u00a9[\u2000-\u3300]',
        '\u00ae[\u2000-\u3300]',
        '\ud83c[\ud000-\udfff]',
        '\ud83d[\ud000-\udfff]',
        '\ud83e[\ud000-\udfff]'
    ];

    /**
     * Removing emoji's from input field, if any
     */
    function removeInvalidChars() {
        var statementNarrativeValue = $('#statementNarrative').val();
        statementNarrativeValue = statementNarrativeValue.replace(new RegExp(ranges.join('|'), 'g'), '');
        $('#statementNarrative').val(statementNarrativeValue);
    }

    $('body').on('paste blur', '#statementNarrative', function () {
        setTimeout(function () {
            removeInvalidChars();
        }, 0);
    });
};

base.onBillingAjaxComplete = function () {
    $(document).ajaxComplete(function (event, xhr, settings) {
        if ($('#containergpay').length && $('#containergpay').attr('data-set') == "0") { // eslint-disable-line
            addGooglePayButton(); // eslint-disable-line
        }
        $.spinner().stop();

        var paymentType = $('.payment-information').data('payment-method-id').trim();// eslint-disable-line
        if ($('.payment-group .payment-method').length === 0) {
            $('#' + paymentType).hide();
            $('#' + paymentType + 'Head').show();
        }

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
            var paymentinstrument = xhr.responseJSON.order && xhr.responseJSON.order.billing.payment.selectedPaymentInstruments[0];
            if (paymentinstrument &&
                paymentinstrument.paymentMethod &&
                ((paymentinstrument.paymentMethod === 'CREDIT_CARD' &&
                paymentinstrument.ccnum &&
                (paymentinstrument.ccnum.indexOf('*') < 0)) || paymentinstrument.paymentMethod === 'PAYWITHGOOGLE-SSL')) {
                var bin;
                if (xhr.responseJSON.order.billing.payment.selectedPaymentInstruments[0].ccnum) {
                    bin = JSON.parse(xhr.responseJSON.order.billing.payment.selectedPaymentInstruments[0].ccnum);
                } else {
                    bin = null;
                }

                var iframeurl = $('#card-iframe').data('url');
                var ccnum2;
                if (bin) {
                    ccnum2 = iframeurl + '?instrument=' + bin.toString();
                } else {
                    ccnum2 = iframeurl;
                }
                $('#card-iframe').attr('src', ccnum2);
                window.addEventListener('message', function (event) { // eslint-disable-line
                    var data = JSON.parse(event.data);
                    var dataSessionId = data.SessionId;
                    var url = $('#sessionIDEP').val();
                    $.ajax({
                        url: url,
                        data: { dataSessionId: dataSessionId },
                        type: 'POST'
                    });
                }, false);
            } else {
                $('#card-iframe').attr('src', '');
                $('#card-iframe').removeAttr('src');
            }
        }
        if ($('.form-check-input.check').is(':checked') && $('.payment-information').data('payment-method-id') === 'CREDIT_CARD') {
            $('.dis_id').show();
            if ($('#isDisclaimerMandatory').attr('value') === undefined &&
                $('#showDisclaimer').attr('value') === 'true' &&
                !$('[name="disclaimer"][value="yes"]').is(':checked')) {
                $('#chose-to-save').show();
            }
        }
        if ($('.form-check-input.checkccredirect').is(':checked') &&
            $('.payment-information').data('payment-method-id') === 'Worldpay' &&
            !$('[name="disclaimercc"][value="yes"]').is(':checked')) {
            $('.dis_idredirect').show();
            if ($('#isDisclaimerMandatory').attr('value') === undefined && $('#showDisclaimer').attr('value') === 'true' && ($("input[name$='disclaimercc']:checked").val() === 'no')) {
                $('#chose-to-save-redirect').show();
            }
        }

        $('.form-check-input.check').click(function () {
            if ($('.payment-information').data('payment-method-id') === 'CREDIT_CARD') {
                if ($(this).is(':checked')) {
                    $('.dis_id').show();
                    if ($('#isDisclaimerMandatory').attr('value') === undefined && $('#showDisclaimer').attr('value') === 'true' && ($("input[name$='disclaimer']:checked").val() === 'no')) {
                        $('#chose-to-save').show();
                    }
                } else {
                    $('.dis_id').hide();
                    $('#disclaimer-error').hide();
                    $('#chose-to-save').hide();
                }
            }
        });
        $('.form-check-input.checkccredirect').click(function () { // eslint-disable-line

            if ($('.payment-information').data('payment-method-id') === 'Worldpay') {
                if ($(this).is(':checked')) {
                    $('.dis_idredirect').show();
                    if ($('#isDisclaimerMandatory').attr('value') === undefined && $('#showDisclaimer').attr('value') === 'true' && ($("input[name$='disclaimercc']:checked").val() === 'no')) {
                        $('#chose-to-save-redirect').show();
                    }
                } else {
                    $('.dis_idredirect').hide();
                    $('#disclaimer-error-cc-redirect').hide();
                    $('#chose-to-save-redirect').hide();
                }
            }
        });

        $('#disclaimerModal').on('hidden.bs.modal', function () {
            if ($("input[name$='disclaimer']:checked").val() === 'no') {
                $('.form-check-input.check').prop('checked', false);
                $('.dis_id').hide();
                $('#disclaimer-error').hide();
            }
            $('#chose-to-save').hide();
            if ($("input[name$='disclaimer']:checked").val()) {
                $('#disclaimer-error').hide();
            }
        });
        $('#disclaimerModalRedirect').on('hidden.bs.modal', function () {
            if ($("input[name$='disclaimercc']:checked").val() === 'no') {
                $('.form-check-input.checkccredirect').prop('checked', false);
                $('.dis_idredirect').hide();
                $('#disclaimer-error-cc-redirect').hide();
            }
            $('#chose-to-save-redirect').hide();
            if ($("input[name$='disclaimercc']:checked").val()) {
                $('#disclaimer-error-cc-redirect').hide();
            }
        });
    });
};

base.onBillingAjaxStart = function () {
    $(document).ajaxStart(function (event, xhr, settings) { // eslint-disable-line
        if ($(event.currentTarget.activeElement).hasClass('submit-payment') ||
            $(event.currentTarget.activeElement).hasClass('place-order') ||
            $(event.currentTarget.activeElement).hasClass('submit-shipping')) {
            $.spinner().start();
        }
    });
};

base.selectSavedPaymentInstrument = function () {
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

base.paymentTabs = function () {
    if ($('.payment-group .payment-method').length) {
        var existingPaymentID = $('.payment-information[data-payment-method-id]').data('payment-method-id');
        $('.payment-method').removeClass('active');
        if (existingPaymentID === 'CREDIT_CARD') {
            $('.payment-method.paybyCreditcard').addClass('active');
            $('#payment-method-creditcard').prop('checked', true).trigger('change');
        } else if (existingPaymentID === 'Worldpay') {
            $('.payment-method.paybyWorldPay').addClass('active');
            $('#payment-method-worldpay').prop('checked', true).trigger('change');
            $('#credit-card-content-redirect').addClass('show');
        } else if (existingPaymentID === 'PAYWITHGOOGLE-SSL' || existingPaymentID === 'SAMSUNGPAY') {
            $('.payment-method.paybyWallet').addClass('active');
            $('#payment-method-wallet').prop('checked', true).trigger('change');
        } else if (existingPaymentID === null) { // Most common usecase
            $('.payment-method')
            .first()
                .addClass('active')
                .find('[name=payment-method]')
                .prop('checked', true)
                .trigger('change');

            var newAssignedMethod = $('.active [data-method-id]').attr('data-method-id');

            if (newAssignedMethod === 'Worldpay') {
                $('#credit-card-content-redirect').addClass('show');
            }

            $('.payment-information[data-payment-method-id]').attr('data-payment-method-id', newAssignedMethod).data('payment-method-id', newAssignedMethod);

            if (newAssignedMethod !== 'CREDIT_CARD' && newAssignedMethod !== 'Worldpay' && newAssignedMethod !== 'PAYWITHGOOGLE-SSL' && newAssignedMethod !== 'SAMSUNGPAY') {
                $('.payment-method.paybyAlternativePayment').addClass('active');
                $('#payment-method-alternativepayment').prop('checked', true).trigger('change');
                $('.alternative-payment-listitem#' + newAssignedMethod)
                    .addClass('selected')
                    .find('.radio')
                    .prop('checked', true)
                    .trigger('change');
            }
        } else {
            $('.payment-method.paybyAlternativePayment').addClass('active');
            $('#payment-method-alternativepayment').prop('checked', true).trigger('change');
            $('.alternative-payment-listitem#' + existingPaymentID)
                .addClass('selected')
                .find('.radio')
                .prop('checked', true)
                .trigger('change');
        }

        var billingForm = $('#dwfrm_billing');
        var countryCode = $('#billingCountry').val();
        var paymentType = $('.active [data-method-id].selected').attr('data-method-id') || $('.active [data-method-id]').attr('data-method-id');
        if (countryCode === 'BR' && (paymentType === 'CREDIT_CARD' || paymentType === 'BOLETO-SSL' || paymentType === 'Worldpay')) {
            billingForm.find('#boleto-content').removeClass('tab-pane fade');
        } else if (countryCode === 'BR' && paymentType === 'Worldpay' && $('.saved-payment-security-code').length > 0) {
            billingForm.find('#boleto-content').removeClass('tab-pane fade');
        } else {
            billingForm.find('#boleto-content').addClass('tab-pane fade');
        }
    } else {
        $('.payment-options .nav-item').on('click', function (e) {
            e.preventDefault();
            var methodID = $(this).data('method-id');
            $('.payment-information').data('payment-method-id', methodID);
        });
    }
};
module.exports = base;

module.exports.updateBoletoDOM = updateBoletoDOM;
