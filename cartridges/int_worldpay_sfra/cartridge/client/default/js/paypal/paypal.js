/**
 * Paypal Smart Payment Buttons
*/

function loadPaypalSdk() {
    if(!window.paypal) {
        const script = document.createElement('script');
        var currency = window.paypalData.currency;
        var clientId = window.paypalData.paypalSslClintId;
        if(!clientId) {
            return;
        }
        script.src = 'https://www.paypal.com/sdk/js?client-id=' + clientId + '&currency=' + currency + '&intent=authorize';
        script.type = 'text/javascript';
        script.async = true;
        document.head.appendChild(script);
    }

    $(document).ready(function () {
         var checkExists = setInterval(function () {
            var container = $('#paypal-button-container');
        
            if(container.length) {
                clearInterval(checkExists);
                var orderId = null;

                paypal.Buttons({
                    style: {
                        layout: 'horizontal',
                        height: 40,
                        tagline: false
                    },

                    createOrder: function(data, actions) {
                        var data = {}
                        if (window.paypalData.isPDP) {
                            data = {
                                pid: $('.add-to-cart').attr('data-pid'),
                                qty: $('.custom-select').val(),
                                isPDP: window.paypalData.isPDP
                            }
                        }
                        return fetch(window.paypalData.urls.createOrder, {
                            method: 'POST',
                            body: JSON.stringify({ data: data })
                        }).then(function(res) {
                            return res.json();
                        }).then(function(orderData) {
                            orderId = orderData.orderId;
                            return orderData.id;
                        });
                    },

                    onApprove: function(data, actions) {
                        return fetch(window.paypalData.urls.onAprrove, {
                            method: 'POST',
                            body: JSON.stringify({ orderID: orderId })
                        }).then(function(res) {
                            return res.json();
                        }).then(function(orderData) {
                            if (orderData && orderData.success) {
                                var redirect = $('<form>')
                                .appendTo(document.body)
                                .attr({
                                    method: 'POST',
                                    action: orderData.continueUrl
                                });
                                $('<input>')
                                    .appendTo(redirect)
                                    .attr({
                                        name: 'orderID',
                                        value: orderData.orderID
                                    });
                                $('<input>')
                                    .appendTo(redirect)
                                    .attr({
                                        name: 'orderToken',
                                        value: orderData.orderToken
                                    });
                                redirect.submit();
                                return;
                            }
                            
                            $('.error-message').show();
                            $('.error-message-text').text(orderData.errorMessage);
                            
                        });
                    }
                }).render('#paypal-button-container');
            }
        }, 300);
    });
};

$(document).ready(function () {
    loadPaypalSdk();
});
