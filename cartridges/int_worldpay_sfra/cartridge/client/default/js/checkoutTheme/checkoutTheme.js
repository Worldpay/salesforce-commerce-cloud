'use strict';

var updatePaymentInfoDom = require('../checkout/billing').updatePaymentInfoDom;

/**
 * This method shows narrative content for supported payments
 * @param {Object} paymentType - paymentType value
 * @param {Object} countryCode - countryCode value
 */
function enableNarrativeContent(paymentType, countryCode) {
    var enableCpf = document.getElementById('enableCPF') ? document.getElementById('enableCPF').value : '';
    var enableInstallmentsForLatAm = document.getElementById('enableInstallmentsForLatAm').value;
    var isApplicableFOrLatem = document.getElementById('isApplicableFOrLatem').value;
    if ((enableCpf && countryCode === 'BR') || (enableInstallmentsForLatAm && isApplicableFOrLatem === 'true')) {
        switch (paymentType) {
            case 'CREDIT_CARD':
            case 'Worldpay':
                $('#statementNarrativecontent').show();
                break;
            default:
                break;
        }
    }
}
/**
 * To handle the Payment Method on Change events
 */
function onChangeRadioPaymentMethodBucket() {
    $(document).on('change', '.radio[name="payment-method"]', function (e) {
        $(this).closest('.payment-group').find('.payment-method').removeClass('active');
        $(this).closest('.payment-method').addClass('active');
        $(this).closest('.payment-group').find('.payment-method .nav-item').removeClass('selected');
        $(this).closest('.payment-method').find('.nav-item').addClass('selected');

        var paymentType = $('.active [data-method-id].selected').attr('data-method-id');
        var countryCode = $('#billingCountry').val();
        if (paymentType === undefined && $('.paybyAlternativePayment').hasClass('active')) {
            $('.alternative-payment-listitem:first-child')
                .addClass('selected')
                .find('.radio')
                .prop('checked', true)
                .trigger('change');
        }

        switch (paymentType) {
            case 'CREDIT_CARD':
            case 'PAYWITHGOOGLE-SSL':
            case 'Worldpay':
            case 'SAMSUNGPAY':
                $('#statementNarrativecontent').hide();
                break;
            default:
                $('#statementNarrativecontent').show();
                break;
        }
        enableNarrativeContent(paymentType, countryCode);

        if (paymentType === 'Worldpay') {
            $('#credit-card-content-redirect').addClass('show');
        } else {
            $('#credit-card-content-redirect').removeClass('show');
        }

        $('.payment-information').attr('data-payment-method-id', paymentType).data('payment-method-id', paymentType);

        if (e.originalEvent) {
            updatePaymentInfoDom(countryCode, paymentType);
        }

        if (paymentType === 'CREDIT_CARD') {
            $('.tab-pane.credit-card-content-redirect input[name$="_creditCardFields_saveCard"]').prop('checked', false);
            $('.tab-pane.credit-card-content input[name$="_creditCardFields_saveCard"]').prop('checked', true);
            if ($('#isDisclaimerMandatory').attr('value') === undefined &&
                $('#showDisclaimer').attr('value') === 'true' &&
                $('.data-checkout-stage').data('customer-type') === 'registered' && ($("input[name$='disclaimer']:checked").val() === 'no')) {
                $('#chose-to-save').show();
            }
        }
        if (paymentType === 'Worldpay') {
            $('.tab-pane.credit-card-content input[name$="_creditCardFields_saveCard"]').prop('checked', false);
            $('.tab-pane.credit-card-content-redirect input[name$="_creditCardFields_saveCard"]').prop('checked', true);
            if ($('#isDisclaimerMandatory').attr('value') === undefined &&
                $('#showDisclaimer').attr('value') === 'true' &&
                $('.data-checkout-stage').data('customer-type') === 'registered' && ($("input[name$='disclaimercc']:checked").val() === 'no')) {
                $('#chose-to-save-redirect').show();
            }
        }
    });
}

/**
 * To handle the APMs
 */
function onChangeRadioPaymentByAlternativePayment() {
    $(document).on('change', '.radio[name="paybyalternativepayment-options"]', function (e) {
        $('.alternative-payment-listitem').removeClass('selected');
        $(this).closest('.alternative-payment-listitem').addClass('selected');

        var paymentType = $('.active [data-method-id].selected').attr('data-method-id');
        var countryCode = $('#billingCountry').val();

        $('.active .payment-form-content[data-href-id]').removeClass('show');
        $('.active .payment-form-content[data-href-id=' + paymentType + ']').addClass('show');
        $('.payment-information').attr('data-payment-method-id', paymentType).data('payment-method-id', paymentType);

        if (e.originalEvent) {
            updatePaymentInfoDom(countryCode, paymentType);
        }
    });
}

/**
 * Handle the tooltip action
 */
function onFocusBlurFieldTooltipAction() {
    $(document).on('focus blur', '.field-tooltip-action', function (e) {
        e.preventDefault();
        var parentWrapper = $(this).parent('.field-tooltip');
        if (parentWrapper.hasClass('_active')) {
            parentWrapper.removeClass('_active');
            $(this).attr('aria-expanded', 'false');
            $(this).next('.field-tooltip-content').attr('aria-hidden', 'true');
        } else {
            parentWrapper.addClass('_active');
            $(this).attr('aria-expanded', 'true');
            $(this).next('.field-tooltip-content').attr('aria-hidden', 'false');
        }
    });
}

module.exports = {
    onChangeRadioPaymentMethodBucket: onChangeRadioPaymentMethodBucket,
    onChangeRadioPaymentByAlternativePayment: onChangeRadioPaymentByAlternativePayment,
    onFocusBlurFieldTooltipAction: onFocusBlurFieldTooltipAction
};
