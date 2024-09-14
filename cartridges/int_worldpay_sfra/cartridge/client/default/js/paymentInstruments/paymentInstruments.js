'use strict';
var base = require('base/paymentInstruments/paymentInstruments');
var formValidation = require('base/components/formValidation');
var cleave = require('../components/cleave');

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
                    var redirect = $('<form>')
                        .appendTo(document.body)
                        .attr({
                            method: 'POST',
                            action: data.continueUrl
                        });
                    $('<input>')
                        .appendTo(redirect)
                        .attr({
                            name: 'orderID',
                            value: data.orderID
                        });
                    $('<input>')
                        .appendTo(redirect)
                        .attr({
                            name: 'paymentInstrument',
                            value: data.paymentInstrument
                        });
                    $('<input>')
                        .appendTo(redirect)
                        .attr({
                            name: 'isSaveCardAction',
                            value: true
                        });
                    redirect.submit();
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

module.exports = base;
