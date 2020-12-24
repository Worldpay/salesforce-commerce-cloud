'use strict';

var formHelpers = require('base/checkout/formErrors');

/**
 * Clear the form errors.
 */
function clearServerErrors() {
    $('#instant-checkout-error').parent('.server-error').addClass('d-none');
    var selector = '.checkout-instant-payment';
    formHelpers.clearPreviousErrors(selector);
}

/**
 * updates the totals summary
 * @param {Array} totals - the totals data
 */
function updateTotals(totals) {
    $('.instant-checkout-totals .shipping-cost').text(totals.totalShippingCost);
    $('.instant-checkout-totals .tax-total').text(totals.totalTax);
    $('.instant-checkout-totals .sub-total-instant').text(totals.subTotal);
    $('.instant-checkout-totals .grand-total').text(totals.grandTotal);

    if (totals.orderLevelDiscountTotal.value > 0) {
        $('.instant-checkout-totals .order-discount').removeClass('hide-order-discount');
        $('.instant-checkout-totals .order-discount-total').text('- ' + totals.orderLevelDiscountTotal.formatted);
    } else {
        $('.instant-checkout-totals .order-discount').addClass('hide-order-discount');
    }

    if (totals.shippingLevelDiscountTotal.value > 0) {
        $('.instant-checkout-totals .shipping-discount').removeClass('hide-shipping-discount');
        $('.instant-checkout-totals .shipping-discount-total').text('- ' +
            totals.shippingLevelDiscountTotal.formatted);
    } else {
        $('.instant-checkout-totals .shipping-discount').addClass('hide-shipping-discount');
    }
}

module.exports = {
    startInstantPurchase: function () {
        $(document).on('click', '#quick-pay-now', function () {
            $('.checkout-continue').spinner().start();
            var url = $(this).data('target');
            $.ajax({
                url: url,
                method: 'GET',
                dataType: 'json',
                success: function (data) {
                    if (data.error && data.redirectUrl) {
                        window.location.href = data.redirectUrl;
                    } else {
                        $('.quick-pay-modal').empty().html(data.instantCheckoutContent);
                        $('.quick-pay-modal #instant-checkout').modal('show');
                        $('.quick-pay-modal').on('shown.bs.modal', function () {
                            $('#instant-checkout #saved-payment-security-code').focus();
                        });
                        // default selected card logo
                        var cardType = $('#payment-selector-instant option:selected').data('card-type');
                        $('.credit-card-logo').attr('data-credit-card-type', cardType);
                        $('.minicart .popover').removeClass('show');
                    }
                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },
    selectShippingAddress: function () {
        $(document).on('change', '#shipmentSelector-instant.addressSelector', function () {
            clearServerErrors();
            var selectedOption = $('option:selected', this);
            var seletedShippingAddreesID = selectedOption.data('address-id');
            var url = selectedOption.parents('select#shipmentSelector-instant').data('action');
            $('#instant-checkout .modal-content').spinner().start();
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: { seletedShippingAddreesID: seletedShippingAddreesID }
            }).done(function (data) {
                if (data.error && data.errorMessage) {
                    $('#instant-checkout-error').text(data.errorMessage);
                    $('#instant-checkout-error').parent('.server-error').removeClass('d-none');
                    $.spinner().stop();
                } else {
                    updateTotals(data.order.totals);
                }
                $.spinner().stop();
            }).fail(function () {
                $.spinner().stop();
            });
        });
    },
    selectShippingMethod: function () {
        $(document).on('change', '.instant-shipping-method-list', function () {
            clearServerErrors();
            var methodID = $(':checked', this).val();
            var seletedShippingAddreesID = $('#shipmentSelector-instant option:selected').data('address-id');
            var url = $(this).data('select-shipping-method-url');
            $('.instant-shipping-method-list').spinner().start();
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: { methodID: methodID, seletedShippingAddreesID: seletedShippingAddreesID }
            }).done(function (data) {
                if (data.error && data.errorMessage) {
                    $('#instant-checkout-error').text(data.errorMessage);
                    $('#instant-checkout-error').parent('.server-error').removeClass('d-none');
                    $.spinner().stop();
                } else {
                    updateTotals(data.order.totals);
                }
                $.spinner().stop();
            }).fail(function () {
                $.spinner().stop();
            });
        });
    },
    selectBillingAddress: function () {
        $(document).on('change', '#billingSelector-instant.addressSelector', function () {
            clearServerErrors();
            var selectedOption = $('option:selected', this);
            var seletedBillingAddreesID = selectedOption.data('address-id');
            var url = selectedOption.parents('select#billingSelector-instant').data('action');
            $('#instant-checkout .modal-content').spinner().start();
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: { seletedBillingAddreesID: seletedBillingAddreesID }
            }).done(function (data) {
                if (data.error && data.errorMessage) {
                    $('#instant-checkout-error').text(data.errorMessage);
                    $('#instant-checkout-error').parent('.server-error').removeClass('d-none');
                    $.spinner().stop();
                } else {
                    $.spinner().stop();
                }
            }).fail(function () {
                $.spinner().stop();
            });
        });
    },

    selectPaymentInstrument: function () {
        $(document).on('change', '#payment-selector-instant', function () {
            clearServerErrors();
            $('#instant-checkout #saved-payment-security-code').val('');
            $('#instant-checkout #saved-payment-security-code').focus();
            var cardType = $('#payment-selector-instant option:selected').data('card-type');
            $('.credit-card-logo').attr('data-credit-card-type', cardType);
        });
    },

    completeCheckout: function () {
        $(document).on('click', '#complete-checkout', function (e) {
            e.preventDefault();
            var shippingAddressID = $('#shipmentSelector-instant.addressSelector option:selected').data('address-id');
            var billingAddressID = $('#billingSelector-instant.addressSelector option:selected').data('address-id');
            var shippingMethodID = $('.instant-shipping-method-list :checked').val();
            var $paymentInstrument = $('#instant-checkout #payment-selector-instant option:selected');
            var savedPaymentID = $paymentInstrument.data('payment-id');
            var cvv = $('.checkout-instant-payment #saved-payment-security-code').val();
            var url = $('#instant-checkout #complete-checkout').data('target');
            var postData = {
                shippingAddressID: shippingAddressID,
                billingAddressID: billingAddressID,
                shippingMethodID: shippingMethodID,
                savedPaymentID: savedPaymentID,
                cvv: cvv
            };
            $('#instant-checkout .modal-content').spinner().start();

            // if 3ds2 enabled
            var typeOf3DS = $('.quick-pay-modal').data('threedstype');
            if (typeOf3DS === 'two3d') {
                var ccBinNumber = $paymentInstrument.data('bin-token');
                if (ccBinNumber) {
                    var ccnum = CryptoJS.AES.encrypt(ccBinNumber.toString(), 'SecretPassphrase');
                    var iframeurl = $('#card-iframe').data('url');
                    var sourceURL = iframeurl + '?instrument=' + encodeURIComponent(ccnum.toString());
                    $('#card-iframe').attr('src', sourceURL);
                    window.addEventListener('message', function (event) {
                        var data = JSON.parse(event.data);
                        var dataSessionId = data.SessionId;
                        var sessionURL = $paymentInstrument.data('session-service');
                        $.ajax({
                            url: sessionURL,
                            data: { dataSessionId: dataSessionId },
                            type: 'POST'
                        });
                    }, false);
                } else {
                    $('#card-iframe').attr('src', '');
                    $('#card-iframe').removeAttr('src');
                }
            }
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: postData
            }).done(function (data) {
                if (data.error) {
                    // display error on pop-up
                    if (data.invalidCVV) {
                        $('.checkout-instant-payment .saved-payment-security-code').addClass('is-invalid');
                        $('#savedPaymentSecurityCodeInvalidMessage').text(data.cvvErrorMessage);
                        $.spinner().stop();
                    } else if (data.missingCVV) {
                        $('.checkout-instant-payment .saved-payment-security-code').addClass('is-invalid');
                        $('#savedPaymentSecurityCodeInvalidMessage').text(data.cvvErrorMessage);
                        $.spinner().stop();
                    } else if (data.errorMessage) {
                        $('#instant-checkout-error').text(data.errorMessage);
                        $('#instant-checkout-error').parent('.server-error').removeClass('d-none');
                        $.spinner().stop();
                    } else if (data.redirectUrl) {
                        window.location.href = data.redirectUrl;
                    }
                } else {
                    var placeOrderUrl = $('#instant-checkout #complete-checkout').data('action');
                    $.ajax({
                        url: placeOrderUrl,
                        type: 'post',
                        dataType: 'json'
                    }).done(function (resp) {
                        if (!resp.error && resp.continueUrl && !resp.is3D) {
                            var continueUrl = resp.continueUrl;
                            var urlParams = {
                                ID: resp.orderID,
                                token: resp.orderToken
                            };
                            continueUrl += (continueUrl.indexOf('?') !== -1 ? '&' : '?') +
                                Object.keys(urlParams).map(function (key) {
                                    return key + '=' + encodeURIComponent(urlParams[key]);
                                }).join('&');
                            window.location.href = continueUrl;
                        } else if (!resp.error && resp.continueUrl && resp.is3D) {
                            window.location.href = resp.continueUrl;
                        } else if (resp.error && resp.errorMessage) {
                            $('#instant-checkout-error').text(resp.errorMessage);
                            $('#instant-checkout-error').parent('.server-error').removeClass('d-none');
                            $.spinner().stop();
                        } else {
                            $.spinner().stop();
                        }
                    }).fail(function () {
                        $.spinner().stop();
                    });
                }
            }).fail(function () {
                $.spinner().stop();
            });
        });
    }
};

