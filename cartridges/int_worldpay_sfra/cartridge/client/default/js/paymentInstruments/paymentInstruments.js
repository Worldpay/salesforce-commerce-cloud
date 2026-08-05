'use strict';
var base = require('base/paymentInstruments/paymentInstruments');
var formValidation = require('base/components/formValidation');
var cleave = require('../components/cleave');
var safeDom = require('../components/safeDom');

base.submitPayment = function () {
    $('form.payment-form').submit(function (e) {
        var $form = $(this);
        e.preventDefault();
        var url = $form.attr('action');
        $form.spinner().start();
        $('form.payment-form').trigger('payment:submit', e);
        $form[0][0].value = screen.height;
        $form[0][1].value = screen.width;
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
                } else if (data.nominalerror) {
                    $('#nominalerror').show();
                } else if (data.maxUpdateLimitError) {
                    $('#maxUpdateLimitError').show();
                }

                if (!data.success) {
                    formValidation($form, data);
                } else if (data.orderID) {
                    safeDom.submitRedirectForm(data.continueUrl, {
                        orderID: data.orderID,
                        paymentInstrument: data.paymentInstrument,
                        isSaveCardAction: true
                    });
                } else {
                    safeDom.redirect(data.redirectUrl);
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    safeDom.redirect(err.responseJSON.redirectUrl);
                }
                $form.spinner().stop();
            }
        });
        return false;
    });
};

module.exports = base;
