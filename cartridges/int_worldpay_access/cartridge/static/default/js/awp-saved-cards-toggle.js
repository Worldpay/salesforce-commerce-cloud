(function () {
  function toggleSavedCards() {
    var list = document.getElementById('awpSavedCardsContainer');
    if (!list) return;

    var useSaved = document.getElementById('awpUseSavedCard');
    if (!useSaved) return;

    list.classList.toggle('d-none', !useSaved.checked);

  }

  function init() {
    // init state
    toggleSavedCards();

    document.addEventListener('change', function (e) {
      if (!e.target) return;

      if (e.target.name === 'awpSavedChoice' ||
          e.target.id === 'awpUseNewCard' ||
          e.target.id === 'awpUseSavedCard') {
        toggleSavedCards();
      }
    });

    document.addEventListener('click', function (e) {
      var row = e.target && e.target.closest ? e.target.closest('.saved-payment-instrument') : null;
      if (!row) return;

      var useSaved = document.getElementById('awpUseSavedCard');
      if (useSaved && !useSaved.checked) {
        useSaved.checked = true;
      }
      toggleSavedCards();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
