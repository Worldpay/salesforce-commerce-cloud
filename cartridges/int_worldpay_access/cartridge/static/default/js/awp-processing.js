(function () {
  function init() {
    var root = document.querySelector('[data-awp-processing]');
    if (!root) return;

    if (root.__awpProcessingInit) return;
    root.__awpProcessingInit = true;

    var orderNo = root.dataset.orderNo;
    var token = root.dataset.token;
    var checkUrl = root.dataset.checkUrl;
    var errorUrl = root.dataset.errorUrl;
    var notApprovedUrl = root.dataset.notapprovedUrl;
    var backUrl = root.dataset.backUrl;

    var maxTries = parseInt(root.dataset.maxTries, 10) || 45;
    var baseDelay = parseInt(root.dataset.baseDelay, 10) || 2000;

    var tries = 0;

    function tick() {
      fetch(
        checkUrl +
          '?orderNo=' + encodeURIComponent(orderNo) +
          '&token=' + encodeURIComponent(token),
        { credentials: 'same-origin' }
      )
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          if (data.error) {
            window.location = errorUrl;
            return;
          }

          if (!data.ready) {
            if (++tries >= maxTries) {
              window.location = backUrl;
              return;
            }
            setTimeout(tick, baseDelay);
            return;
          }

          if (data.continueUrl) {
            window.location = data.continueUrl;
            return;
          }

          window.location = notApprovedUrl;
        })
        .catch(function () {
          if (++tries >= maxTries) {
            window.location = errorUrl;
            return;
          }
          setTimeout(tick, baseDelay);
        });
    }

    tick();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
