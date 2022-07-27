/**
 * Event listener for Pay by link button
 */
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
                            if ($('.add-to-cart-messages').length === 0) {
                                $('body').append(
                                    '<div class="add-to-cart-messages"></div>'
                                );
                            }
                            $('.add-to-cart-messages').append(
                                '<div class="alert alert-success add-to-basket-alert text-center" role="alert">'
                                + response.successMessage
                                + '</div>'
                            );
                            setTimeout(function () {
                                $('.add-to-basket-alert').remove();
                            }, 5000);
                        },
                        error: function (err) {
                            $.spinner().stop();
                            if (err.errorMessage) {
                                if ($('.add-to-cart-messages').length === 0) {
                                    $('body').append(
                                        '<div class="add-to-cart-messages"></div>'
                                    );
                                }
                                $('.add-to-cart-messages').append(
                                    '<div class="alert alert-danger add-to-basket-alert text-center" role="alert">'
                                    + err.errorMessage
                                    + '</div>'
                                );
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
