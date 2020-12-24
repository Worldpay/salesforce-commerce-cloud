'use strict';
var base = require('base/paymentInstruments/paymentInstruments');
var formValidation = require('base/components/formValidation');
var cleave = require('base/components/cleave');

var url;

base.submitPayment = function () {
    $('form.payment-form').submit(function (e) {
        var $form = $(this);
        e.preventDefault();
        url = $form.attr('action');
        $form.spinner().start();
        $('form.payment-form').trigger('payment:submit', e);
        var formData = cleave.serializeData($form);
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: formData,
            success: function (data) {
                $form.spinner().stop();

                if (data.gatewayerror) {
                    $('#gatewayerror').show();
                }

                if (!data.success) {
                    formValidation($form, data);
                } else {
                    location.href = data.redirectUrl;
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
                $form.spinner().stop();
            }
        });
        return false;
    });
};

/*
*card type and security code handling where process differnt card types.
*/
base.ccValidation = function () {
    $('body').on('focusout', 'form.payment-form #cardNumber', function () {
        if (undefined !== $('input#cardNumber').data('cleave')) {
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

            var cardType = creditCardTypes[Object.keys(creditCardTypes).indexOf($('input#cardNumber').data('cleave').properties.creditCardType) > -1
                ?
                $('input#cardNumber').data('cleave').properties.creditCardType
                :
                'unknown'];
            $('#cardType').val(cardType);
            $('.card-number-wrapper').attr('data-type', cardType);
        }
        var cType = $('.card-number-wrapper')[0].dataset.type;
        if (cType === 'visa' || cType === 'mastercard' || cType === 'discover' || cType === 'maestro' || cType === 'laser' || cType === 'uatp' || cType === 'diners' || cType === 'jcb') {
            $('#securityCode').attr('maxlength', 3);
        } else {
            $('#securityCode').attr('maxlength', 4);
        }
        return true;
    });
};

module.exports = base;
