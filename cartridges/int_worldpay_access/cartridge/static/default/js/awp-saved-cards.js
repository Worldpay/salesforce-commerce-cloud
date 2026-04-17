(function () {
  function setHidden(val) {
    var h = document.getElementById('awpSavedPIUUID');
    if (h) h.value = val || '';
  }

  function renderSelection(container, selectedUuid) {
    container.dataset.selectedUuid = selectedUuid || '';
    setHidden(selectedUuid || '');
    container.querySelectorAll('.saved-payment-instrument').forEach(function (row) {
      var isSelected = selectedUuid && (row.getAttribute('data-uuid') === selectedUuid);
      row.classList.toggle('selected-payment', !!isSelected);
    });
  }

  function clearSelection(container) {
    renderSelection(container, '');
    var useNew = container.querySelector('#awpUseNewCard');
    if (useNew) useNew.checked = true;
  }

  function updateSavedCardsVisibility() {
    var selected = document.querySelector('input.payment-method-radio[name="dwfrm_billing_paymentMethod"]:checked');
    var method = selected && (selected.value || selected.getAttribute('data-method-id'));
    var isWorldpay = method === 'Worldpay' || method === 'WORLDPAY_CHECKOUTSDK';

    document.querySelectorAll('.awp-saved-cards').forEach(function (el) {
      el.classList.toggle('d-none', !isWorldpay);
      if (!isWorldpay) clearSelection(el);
    });
  }

  document.addEventListener('click', function (e) {
    var row = e.target.closest('.awp-saved-cards .saved-payment-instrument');
    if (!row) return;

    var container = row.closest('.awp-saved-cards');
    var uuid = row.getAttribute('data-uuid') || '';
    var current = container.dataset.selectedUuid || '';

    if (current === uuid) {
      clearSelection(container);
    } else {
      renderSelection(container, uuid);
      var useNew = container.querySelector('#awpUseNewCard');
      if (useNew) useNew.checked = false;
    }
  });

  document.addEventListener('change', function (e) {
    if (e.target && e.target.matches('input.payment-method-radio[name="dwfrm_billing_paymentMethod"]')) {
      updateSavedCardsVisibility();
    }
    if (e.target && e.target.id === 'awpUseNewCard') {
      var container = e.target.closest('.awp-saved-cards');
      if (e.target.checked && container) clearSelection(container);
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    updateSavedCardsVisibility();
    document.querySelectorAll('.awp-saved-cards').forEach(clearSelection);
  });
})();