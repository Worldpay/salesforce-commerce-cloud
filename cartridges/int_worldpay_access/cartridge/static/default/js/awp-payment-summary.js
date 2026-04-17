(function () {
  'use strict';

  if (window.__awpPaymentSummaryInitialized) {
    return;
  }
  window.__awpPaymentSummaryInitialized = true;

  function getPaymentMethodName(order) {
    var payment = order && order.billing && order.billing.payment;
    var instrument = payment && payment.selectedPaymentInstruments && payment.selectedPaymentInstruments[0];

    return (payment && payment.selectedPaymentMethodName)
      || (instrument && instrument.paymentMethodName)
      || '';
  }

  function getSelectedPaymentLabel() {
    var radio = document.querySelector(
      'input[type="radio"][name="dwfrm_billing_paymentMethod"]:checked,' +
      'input[type="radio"][name*="paymentMethod"]:checked,' +
      'input[type="radio"][name*="selectedPaymentMethod"]:checked,' +
      'input[type="radio"][name*="paymentMethods"]:checked'
    );

    if (!radio || !radio.id) {
      return '';
    }

    var label = document.querySelector('label[for="' + radio.id + '"]');
    return label ? String(label.textContent || '').trim() : '';
  }

  function updatePaymentMethodName(name) {
    var el = document.querySelector('.selected-payment-method-name');

    if (el && name) {
      el.textContent = name;
    }
  }

  function syncFromSelection() {
    updatePaymentMethodName(getSelectedPaymentLabel());
  }

  function syncFromOrder(order) {
    updatePaymentMethodName(getPaymentMethodName(order));
  }

  document.addEventListener('change', function () {
    setTimeout(syncFromSelection, 0);
  }, true);

  document.addEventListener('click', function () {
    setTimeout(syncFromSelection, 0);
  }, true);

  document.addEventListener('checkout:updateCheckoutView', function (event) {
    var data = event && event.detail;
    if (data && data.order) {
      syncFromOrder(data.order);
      return;
    }

    syncFromSelection();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncFromSelection);
  } else {
    syncFromSelection();
  }
})();
