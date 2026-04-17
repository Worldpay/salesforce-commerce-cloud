(function () {
  function el(id) { return document.getElementById(id); }

  function setConsent(val) {
    var c = el('awpSaveCardConsent');
    if (c) c.value = val ? 'true' : '';
  }

  function setCheckbox(val) {
    var cb = el('awpSaveCard');
    if (cb) cb.checked = !!val;
  }

  function hideIfUsingSavedCard() {
    var useSaved = el('awpUseSavedCard');
    var wrap = document.querySelector('.awp-save-card');
    if (!wrap) return;

    if (useSaved && useSaved.checked) {
      wrap.classList.add('d-none');
      setCheckbox(false);
      setConsent(false);
    } else {
      wrap.classList.remove('d-none');
    }
  }

  function bind() {
    var cb = el('awpSaveCard');
    if (!cb) return;

    cb.addEventListener('change', function () {
      setConsent(cb.checked);
    });

    document.addEventListener('change', function (e) {
      if (e.target && (e.target.id === 'awpUseSavedCard' || e.target.id === 'awpUseNewCard')) {
        hideIfUsingSavedCard();
      }
    });

    hideIfUsingSavedCard();
    setConsent(cb.checked);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
