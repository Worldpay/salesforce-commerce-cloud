(function () {

  const elements = document.getElementsByClassName("recurringBtn");

  for(var i = 0; i < elements.length; i++) {
    elements[i].addEventListener("click",function(e){
      e.preventDefault();

    const text = "Confirm to cancel";
    if (confirm(text) == true) {
      fetch(e.target.href)
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
            if (!data.error) {
                e.target.classList.add('disabled');
                e.target.parentElement.parentElement.children[0].classList.add('text-muted');
            }
        })
    }
    },false);
  }

  function viewAllRecurring() {
    document.addEventListener('click', function (e) {
      var btn = e.target ? e.target.getElementsByClassName('view-all-recurring') : null;
      if (!btn) return;

      const els = document.getElementsByClassName("recurring-item");

      if (!els || !els.length) return;

      Array.prototype.forEach.call(els, function(el) {
        el.classList.remove('hidden')
      });
      e.target.parentElement.classList.add('hidden');

    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    viewAllRecurring();
  });
})();  
