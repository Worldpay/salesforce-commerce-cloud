/**
 * Paypal Smart Payment Buttons
*/
var safeDom = require('../components/safeDom');

var paypalSdkPromise = null;

function getContainer() {
    return $('#paypal-button-container').first();
}

function getPaypalData(container) {
    var data = window.paypalData || {};

    if (data.paypalSslClientId && data.urls) {
        return data;
    }

    return {
        paypalSslClientId: container.attr('data-paypal-client-id'),
        currency: container.attr('data-paypal-currency'),
        isPDP: container.attr('data-paypal-is-pdp') === 'true',
        urls: {
            createOrder: container.attr('data-paypal-create-order-url'),
            onAprrove: container.attr('data-paypal-on-approve-url')
        }
    };
}

function loadPaypalSdk(paypalData) {
    if (window.paypal && window.paypal.Buttons) {
        return Promise.resolve(window.paypal);
    }

    if (paypalSdkPromise) {
        return paypalSdkPromise;
    }

    paypalSdkPromise = new Promise(function (resolve, reject) {
        var existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');

        if (existingScript) {
            existingScript.addEventListener('load', function () {
                resolve(window.paypal);
            });
            existingScript.addEventListener('error', reject);
            return;
        }

        if (!paypalData.paypalSslClientId) {
            reject(new Error('Missing PayPal SSL client id.'));
            return;
        }

        var script = document.createElement('script');
        script.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(paypalData.paypalSslClientId) + '&currency=' + encodeURIComponent(paypalData.currency) + '&intent=authorize';
        script.type = 'text/javascript';
        script.async = true;
        script.onload = function () {
            resolve(window.paypal);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });

    return paypalSdkPromise;
}

function getPdpData(paypalData) {
    if (!paypalData.isPDP) {
        return {};
    }

    return {
        pid: $('.add-to-cart').attr('data-pid'),
        qty: $('.custom-select').val(),
        isPDP: paypalData.isPDP
    };
}

function showPaypalError(message) {
    $('.error-message').show();
    $('.error-message-text').text(message || 'PayPal is currently unavailable.');
}

function render() {
    var container = getContainer();

    if (!container.length) {
        return Promise.resolve();
    }

    if (container.data('worldpayPaypalRendered') && container.children().length) {
        return Promise.resolve();
    }

    var paypalData = getPaypalData(container);
    var orderId = null;

    return loadPaypalSdk(paypalData).then(function (paypalSdk) {
        if (!paypalSdk || !paypalSdk.Buttons) {
            throw new Error('PayPal SDK did not expose Buttons.');
        }

        container.empty();

        return paypalSdk.Buttons({
            style: {
                layout: 'horizontal',
                height: 40,
                tagline: false
            },

            createOrder: function () {
                return fetch(paypalData.urls.createOrder, {
                    method: 'POST',
                    body: JSON.stringify({ data: getPdpData(paypalData) })
                }).then(function (res) {
                    return res.json();
                }).then(function (orderData) {
                    if (!orderData || !orderData.success || !orderData.id) {
                        throw new Error(orderData && orderData.errorMessage ? orderData.errorMessage : 'PayPal order creation failed.');
                    }

                    orderId = orderData.orderId;
                    return orderData.id;
                });
            },

            onApprove: function () {
                return fetch(paypalData.urls.onAprrove, {
                    method: 'POST',
                    body: JSON.stringify({ orderID: orderId })
                }).then(function (res) {
                    return res.json();
                }).then(function (orderData) {
                    if (orderData && orderData.success) {
                        safeDom.submitRedirectForm(orderData.continueUrl, {
                            orderID: orderData.orderID,
                            orderToken: orderData.orderToken
                        });
                        return;
                    }

                    showPaypalError(orderData && orderData.errorMessage);
                });
            },

            onError: function (error) {
                console.error('[PayPal] Button error:', error);
                showPaypalError(error && error.message);
            }
        }).render(container[0]).then(function () {
            container.data('worldpayPaypalRendered', true);
        });
    });
}

window.WorldpayPaypal = {
    render: render
};

module.exports = {
    render: render
};