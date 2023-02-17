var form = document.getElementById('klarna-form');
form.addEventListener('submit', e => {
    var data = [];
    var checkboxes = document.querySelectorAll('.lineitem');
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked === true) {
            data.push(checkboxes[i].value);
        }
    }
    document.getElementById('selectedLineItems').value = data;
    if (data.length > 0) {
        return true;
    }
    var errorMsg = document.getElementById('checkbox-error');
    errorMsg.style.display = 'block';
    errorMsg.style.color = 'red';
    e.preventDefault();
    return false;
});
