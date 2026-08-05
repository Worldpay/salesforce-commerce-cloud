/**
 * Event listener for Pay by link button
 */
var safeDom = require('../components/safeDom');

function ensureMessagesContainer() {
    if ($('.add-to-cart-messages').length === 0) {
        var messages = document.createElement('div');

        messages.className = 'add-to-cart-messages';
        document.body.appendChild(messages);
    }
}

module.exports = {
    payByLink: function () {
        document.getElementById('pay-by-link').addEventListener('click', function () {
            var input = document.getElementById('CheckoutServices-PayByLink');
            var url = input.value;
            $.spinner().start();
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                success: function (data) {
                    $.ajax({
                        url: data.redirectURL,
                        type: 'post',
                        dataType: 'json',
                        data: { payByLink: true },
                        success: function (response) {
                            $.spinner().stop();
                            ensureMessagesContainer();
                            if (response.successMessage) {
                                safeDom.appendAlert($('.add-to-cart-messages'),
                                    'alert alert-success add-to-basket-alert text-center',
                                    response.successMessage);
                                setTimeout(function () {
                                    $('.add-to-basket-alert').remove();
                                }, 5000);
                            } else if (response.errorMessage) {
                                safeDom.appendAlert($('.add-to-cart-messages'),
                                    'alert alert-danger add-to-basket-alert text-center',
                                    response.errorMessage);
                                setTimeout(function () {
                                    $('.add-to-basket-alert').remove();
                                }, 5000);
                            }
                        },
                        error: function (err) {
                            $.spinner().stop();
                            if (err.errorMessage) {
                                ensureMessagesContainer();
                                safeDom.appendAlert($('.add-to-cart-messages'),
                                    'alert alert-danger add-to-basket-alert text-center',
                                    err.errorMessage);
                                setTimeout(function () {
                                    $('.add-to-basket-alert').remove();
                                }, 5000);
                            }
                        }
                    });
                },
                error: function () {
                    $.spinner().stop();
                    window.location.replace(document.getElementById('Cart-Show').value);
                }
            });
        }, false);
    }
};
