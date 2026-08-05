'use strict';

(function () {
    var baseRequest = {
        apiVersion: 2,
        apiVersionMinor: 0
    };

    var ALLOWED_CARD_NETWORKS = ['AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA', 'CB'];
    var ALLOWED_CARD_AUTH_METHODS = ['PAN_ONLY', 'CRYPTOGRAM_3DS'];
    var googleMerchantID = '';
    var googleMerchantName = '';
    var gatewayMerchantID = '';
    var gatewayMerchantName = '';
    var googlePayEnvironment = '';
    var currencyCode = '';
    var taxTotal = '';
    var shippingTotal = '';
    var grossTotal = '';
    var isPdpPage = 'null';
    var paymentsClient = null;
    var TOKENIZATION_SPECIFICATION;
    var baseCardPaymentMethod;
    var cardPaymentMethod;

    var shippingMethods = {
        defaultSelectedOptionId: '',
        shippingOptions: [{
            id: '',
            label: '',
            description: '',
            cost: ''
        }]
    };

    function getInputValue(id) {
        var element = document.getElementById(id);

        return element ? element.value : '';
    }

    function parseAmount(value) {
        var parsed = parseFloat(String(value || '').replace(/[^0-9.-]/g, ''));

        return Number.isFinite(parsed) ? parsed : 0;
    }

    function formatAmount(value) {
        return parseAmount(value).toFixed(2);
    }

    function getFallbackTotal() {
        return getInputValue('googlePayBasketTotal') || $('.grand-total').first().text();
    }

    function refreshGooglePayConfig() {
        googleMerchantID = getInputValue('googlePayMerchantID');
        googleMerchantName = getInputValue('googleMerchantName');
        gatewayMerchantID = getInputValue('gatewayMerchantId');
        gatewayMerchantName = getInputValue('gatewayMerchantName');
        googlePayEnvironment = getInputValue('googlePayEnvironment');
        currencyCode = getInputValue('currencyCode');
        isPdpPage = getInputValue('isPdpPage') || 'null';

        TOKENIZATION_SPECIFICATION = {
            type: 'PAYMENT_GATEWAY',
            parameters: {
                gateway: gatewayMerchantName,
                gatewayMerchantId: gatewayMerchantID
            }
        };

        baseCardPaymentMethod = {
            type: 'CARD',
            parameters: {
                allowedAuthMethods: ALLOWED_CARD_AUTH_METHODS,
                allowedCardNetworks: ALLOWED_CARD_NETWORKS,
                billingAddressRequired: true,
                billingAddressParameters: {
                    format: 'FULL',
                    phoneNumberRequired: true
                }
            }
        };

        cardPaymentMethod = Object.assign(
            {},
            baseCardPaymentMethod,
            {
                tokenizationSpecification: TOKENIZATION_SPECIFICATION
            }
        );
    }

    function getGoogleIsReadyToPayRequest() {
        refreshGooglePayConfig();

        return Object.assign(
            {},
            baseRequest,
            {
                allowedPaymentMethods: [baseCardPaymentMethod]
            }
        );
    }

    function getGoogleShippingAddressParameters() {
        return {
            phoneNumberRequired: true
        };
    }

    function getGoogleTransactionInfo() {
        var url = $('#PDPGooglePay-GetCurrentBasket').val();
        var grossAmount;
        var shippingAmount;
        var taxAmount;

        $.ajax({
            url: url,
            type: 'get',
            async: false,
            data: {},
            success: function (response) {
                taxTotal = response.taxTotal;
                shippingTotal = response.shippingTotal;
                grossTotal = response.grossTotal;
            },
            error: function (xhr) {
                console.error('[GooglePay] Failed to get current basket totals:', xhr);
            }
        });

        if (!grossTotal) {
            grossTotal = getFallbackTotal();
        }

        grossAmount = parseAmount(grossTotal);
        shippingAmount = parseAmount(shippingTotal);
        taxAmount = parseAmount(taxTotal);

        if (grossAmount <= 0) {
            console.error('[GooglePay] Unable to determine a valid totalPrice for transactionInfo.', {
                grossTotal: grossTotal,
                shippingTotal: shippingTotal,
                taxTotal: taxTotal
            });
        }

        grossTotal = formatAmount(grossAmount);
        shippingTotal = formatAmount(shippingAmount);
        taxTotal = formatAmount(taxAmount);

        return {
            displayItems: [
                {
                    label: 'Subtotal',
                    type: 'SUBTOTAL',
                    price: formatAmount(grossAmount - shippingAmount - taxAmount)
                },
                {
                    type: 'LINE_ITEM',
                    label: 'Shipping cost',
                    price: shippingTotal,
                    status: 'FINAL'
                },
                {
                    label: 'Tax',
                    type: 'TAX',
                    price: taxTotal
                }
            ],
            currencyCode: currencyCode,
            totalPriceStatus: 'FINAL',
            totalPrice: grossTotal,
            totalPriceLabel: 'Total'
        };
    }

    function getGoogleDefaultShippingOptions() {
        var shippingOptions = [];

        for (var i = 0; i < shippingMethods.shippingOptions.length; i++) {
            shippingOptions.push({
                id: shippingMethods.shippingOptions[i].id,
                label: shippingMethods.shippingOptions[i].label,
                description: shippingMethods.shippingOptions[i].description
            });
        }

        return {
            defaultSelectedOptionId: shippingMethods.defaultSelectedOptionId,
            shippingOptions: shippingOptions
        };
    }

    function getGooglePaymentDataRequest() {
        var paymentDataRequest = Object.assign({}, baseRequest);

        refreshGooglePayConfig();
        paymentDataRequest.allowedPaymentMethods = [cardPaymentMethod];
        paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
        paymentDataRequest.merchantInfo = {
            merchantId: googleMerchantID,
            merchantName: googleMerchantName
        };

        if (isPdpPage !== 'null') {
            paymentDataRequest.callbackIntents = ['SHIPPING_ADDRESS', 'SHIPPING_OPTION', 'PAYMENT_AUTHORIZATION'];
            paymentDataRequest.shippingAddressRequired = true;
            paymentDataRequest.emailRequired = true;
            paymentDataRequest.shippingAddressParameters = getGoogleShippingAddressParameters();
            paymentDataRequest.shippingOptionRequired = true;
            paymentDataRequest.shippingOptionParameters = getGoogleDefaultShippingOptions();
        } else {
            paymentDataRequest.callbackIntents = ['PAYMENT_AUTHORIZATION'];
            paymentDataRequest.shippingAddressRequired = false;
            paymentDataRequest.shippingOptionRequired = false;
        }

        return paymentDataRequest;
    }

    function processPayment() {
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve({});
            }, 3000);
        });
    }

    function submitRedirect(response) {
        var redirect = $('<form>')
            .appendTo(document.body)
            .attr({
                method: 'POST',
                action: response.continueUrl
            });

        $('<input>')
            .appendTo(redirect)
            .attr({
                name: 'orderID',
                value: response.orderID
            });
        $('<input>')
            .appendTo(redirect)
            .attr({
                name: 'orderToken',
                value: response.orderToken
            });
        redirect.submit();
        localStorage.removeItem('narrativeValue');
    }

    function onPaymentAuthorized(paymentData) {
        return new Promise(function (resolve) {
            processPayment(paymentData)
                .then(function () {
                    var parsedGoogleToken;
                    var signature;
                    var protocolVersion;
                    var signedMessage;
                    var url;
                    var googleToken = paymentData.paymentMethodData.tokenizationData.token;

                    resolve({ transactionState: 'SUCCESS' });
                    parsedGoogleToken = $.parseJSON(googleToken);
                    signature = parsedGoogleToken.signature;
                    protocolVersion = parsedGoogleToken.protocolVersion;
                    signedMessage = parsedGoogleToken.signedMessage;
                    $('#signature').attr('value', signature);
                    $('#protocolVersion').attr('value', protocolVersion);
                    $('#signedMessage').attr('value', signedMessage);
                    $('#gpay-error').html('');
                    url = $('#PDPGooglePay-SubmitOrder').val();

                    if (isPdpPage !== 'null') {
                        $.ajax({
                            url: url,
                            type: 'post',
                            data: {
                                shippingAddressFirstName: paymentData.shippingAddress.name,
                                shippingAddressLastName: paymentData.shippingAddress.name,
                                shippingAddressFullName: paymentData.shippingAddress.name,
                                shippingAddressAddress1: paymentData.shippingAddress.address1,
                                shippingAddressAddress2: paymentData.shippingAddress.address2,
                                shippingAddressCity: paymentData.shippingAddress.locality,
                                shippingAddressPostalCode: paymentData.shippingAddress.postalCode,
                                shippingAddressStateCode: paymentData.shippingAddress.administrativeArea,
                                shippingAddressCountryCode: paymentData.shippingAddress.countryCode,
                                shippingAddressPhone: paymentData.shippingAddress.phoneNumber,
                                shippingMethodId: paymentData.shippingOptionData.id,
                                billingAddressFullName: paymentData.paymentMethodData.info.billingAddress.name,
                                billingAddressAddress1: paymentData.paymentMethodData.info.billingAddress.address1,
                                billingAddressAddress2: paymentData.paymentMethodData.info.billingAddress.address2,
                                billingAddressCity: paymentData.paymentMethodData.info.billingAddress.locality,
                                billingAddressPostalCode: paymentData.paymentMethodData.info.billingAddress.postalCode,
                                billingAddressStateCode: paymentData.paymentMethodData.info.billingAddress.administrativeArea,
                                billingAddressCountryCode: paymentData.paymentMethodData.info.billingAddress.countryCode,
                                billingAddressPhone: paymentData.paymentMethodData.info.billingAddress.phoneNumber,
                                email: paymentData.email,
                                signature: signature,
                                protocolVersion: protocolVersion,
                                signedMessage: signedMessage
                            },
                            success: function () {
                                url = $('#CheckoutServices-PlaceOrder').val();
                                $.ajax({
                                    url: url,
                                    type: 'post',
                                    data: {
                                        browserScreenHeight: screen.height,
                                        browserScreenWidth: screen.width
                                    },
                                    success: function (response) {
                                        if (response.redirectUrl) {
                                            $(location).attr('href', response.redirectUrl);
                                        } else if (response.errorMessage) {
                                            var restoreUrl = $('#PDPGooglePay-RestoreBasket').val();
                                            $.ajax({
                                                url: restoreUrl,
                                                type: 'post',
                                                async: false,
                                                data: {}
                                            });
                                            $('.add-to-cart-messages').append(
                                                '<div class="alert alert-danger add-to-basket-alert text-center" role="alert">'
                                                + response.errorMessage
                                                + '</div>'
                                            );
                                            setTimeout(function () {
                                                $('.add-to-basket-alert').remove();
                                            }, 5000);
                                        } else if (response.action) {
                                            submitRedirect(response);
                                        }
                                    }
                                });
                            }
                        });
                    }
                })
                .catch(function () {
                    resolve({
                        transactionState: 'ERROR',
                        error: {
                            intent: 'PAYMENT_AUTHORIZATION',
                            message: 'Insufficient funds',
                            reason: 'PAYMENT_DATA_INVALID'
                        }
                    });
                });
        });
    }

    function updateShippingOptions(shippingAddress) {
        if (shippingAddress && isPdpPage !== 'null') {
            var url = $('#CheckoutShippingServices-UpdateShippingMethodsList').val();

            $.ajax({
                url: url,
                type: 'post',
                async: false,
                data: {
                    countryCode: shippingAddress.countryCode,
                    stateCode: shippingAddress.administrativeArea,
                    city: shippingAddress.locality,
                    postalCode: shippingAddress.postalCode
                },
                success: function (response) {
                    var applicableShippingMethods = response.order.shipping[0].applicableShippingMethods;

                    shippingMethods.shippingOptions = [];
                    for (var i = 0; i < applicableShippingMethods.length; i++) {
                        var newShippingMethod = {
                            id: applicableShippingMethods[i].ID,
                            label: applicableShippingMethods[i].displayName,
                            description: applicableShippingMethods[i].description,
                            cost: applicableShippingMethods[i].decimalShippingCost.toString()
                        };

                        if (applicableShippingMethods[i].default) {
                            shippingMethods.defaultSelectedOptionId = applicableShippingMethods[i].ID;
                        }
                        shippingMethods.shippingOptions.push(newShippingMethod);
                    }
                }
            });
        }
    }

    function calculateNewTransactionInfo() {
        var newTransactionInfo = getGoogleTransactionInfo();

        newTransactionInfo.totalPrice = grossTotal;
        return newTransactionInfo;
    }

    function onPaymentDataChanged(intermediatePaymentData) {
        return new Promise(function (resolve) {
            var shippingAddress = intermediatePaymentData.shippingAddress;
            var shippingOptionData = intermediatePaymentData.shippingOptionData;
            var paymentDataRequestUpdate = {};
            var url;

            if (intermediatePaymentData.callbackTrigger === 'INITIALIZE' || intermediatePaymentData.callbackTrigger === 'SHIPPING_ADDRESS') {
                if (shippingAddress) {
                    url = $('#PDPGooglePay-SelectShippingDetails').val();
                    $.ajax({
                        url: url,
                        type: 'post',
                        async: false,
                        data: {
                            shippingAddressFirstName: shippingAddress.name,
                            shippingAddressLastName: shippingAddress.name,
                            shippingAddressAddress1: shippingAddress.address1,
                            shippingAddressAddress2: shippingAddress.address2,
                            shippingAddressCity: shippingAddress.locality,
                            shippingAddressPostalCode: shippingAddress.postalCode,
                            shippingAddressStateCode: shippingAddress.administrativeArea,
                            shippingAddressCountryCode: shippingAddress.countryCode,
                            shippingAddressPhone: shippingAddress.phoneNumber,
                            shippingMethodId: getGoogleDefaultShippingOptions().defaultSelectedOptionId
                        }
                    });
                }
                updateShippingOptions(shippingAddress);
                paymentDataRequestUpdate.newShippingOptionParameters = getGoogleDefaultShippingOptions();
                paymentDataRequestUpdate.newTransactionInfo = calculateNewTransactionInfo();
            } else if (intermediatePaymentData.callbackTrigger === 'SHIPPING_OPTION') {
                if (shippingAddress) {
                    url = $('#PDPGooglePay-SelectShippingDetails').val();
                    $.ajax({
                        url: url,
                        type: 'post',
                        async: false,
                        data: {
                            shippingAddressFirstName: shippingAddress.name,
                            shippingAddressLastName: shippingAddress.name,
                            shippingAddressAddress1: shippingAddress.address1,
                            shippingAddressAddress2: shippingAddress.address2,
                            shippingAddressCity: shippingAddress.locality,
                            shippingAddressPostalCode: shippingAddress.postalCode,
                            shippingAddressStateCode: shippingAddress.administrativeArea,
                            shippingAddressCountryCode: shippingAddress.countryCode,
                            shippingAddressPhone: shippingAddress.phoneNumber,
                            shippingMethodId: shippingOptionData.id
                        }
                    });
                }
                paymentDataRequestUpdate.newTransactionInfo = calculateNewTransactionInfo();
            }
            resolve(paymentDataRequestUpdate);
        });
    }

    function getGooglePaymentsClient() {
        refreshGooglePayConfig();

        if (!window.google || !window.google.payments || !window.google.payments.api) {
            return null;
        }

        if (paymentsClient === null) {
            if (isPdpPage !== 'null') {
                paymentsClient = new window.google.payments.api.PaymentsClient({
                    environment: googlePayEnvironment,
                    merchantInfo: {
                        merchantName: googleMerchantName,
                        merchantId: gatewayMerchantID
                    },
                    paymentDataCallbacks: {
                        onPaymentAuthorized: onPaymentAuthorized,
                        onPaymentDataChanged: onPaymentDataChanged
                    }
                });
            } else {
                paymentsClient = new window.google.payments.api.PaymentsClient({
                    environment: googlePayEnvironment,
                    merchantInfo: {
                        merchantName: googleMerchantName,
                        merchantId: gatewayMerchantID
                    },
                    paymentDataCallbacks: {
                        onPaymentAuthorized: onPaymentAuthorized
                    }
                });
            }
        }

        return paymentsClient;
    }

    function onGooglePaymentButtonClicked() {
        if (isPdpPage !== 'null') {
            var url = $('#PDPGooglePay-PrepareBasket').val();
            var addToCart;

            $.ajax({
                url: url,
                type: 'get',
                async: false,
                data: {}
            });
            addToCart = document.querySelector('.add-to-cart');
            if (addToCart) {
                addToCart.click();
            }
        }

        var paymentDataRequest = getGooglePaymentDataRequest();
        var paymentsClient = getGooglePaymentsClient();

        if (!paymentsClient) {
            console.warn('[GooglePay] Google PaymentsClient is not available.');
            return;
        }

        paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
        paymentsClient.loadPaymentData(paymentDataRequest).then(function (paymentData) {
            processPayment(paymentData);
        })
        .catch(function () {
            var url = $('#PDPGooglePay-RestoreBasket').val();

            if (url) {
                $.ajax({
                    url: url,
                    type: 'post',
                    async: false,
                    data: {}
                });
            }
        });
    }

    function addGooglePayButton() {
        var container = document.getElementById('containergpay');
        var paymentsClient;
        var button;

        refreshGooglePayConfig();

        if (!container || container.getAttribute('data-set') === '1' || container.children.length) {
            return Promise.resolve();
        }

        paymentsClient = getGooglePaymentsClient();
        if (!paymentsClient) {
            return Promise.resolve();
        }

        if (isPdpPage === 'null') {
            var url = $('#PDPGooglePay-GetCustomPreference').val();
            $.ajax({
                url: url,
                type: 'get',
                async: false,
                success: function (response) {
                    googleMerchantID = response.preferences.googlePayMerchantID;
                    gatewayMerchantID = response.preferences.gatewayMerchantID;
                    TOKENIZATION_SPECIFICATION = {
                        type: 'PAYMENT_GATEWAY',
                        parameters: {
                            gateway: gatewayMerchantName,
                            gatewayMerchantId: gatewayMerchantID
                        }
                    };
                    cardPaymentMethod = Object.assign(
                        {},
                        baseCardPaymentMethod,
                        {
                            tokenizationSpecification: TOKENIZATION_SPECIFICATION
                        }
                    );
                    paymentsClient = null;
                    paymentsClient = getGooglePaymentsClient();
                }
            });
        }

        button = paymentsClient.createButton({
            onClick: onGooglePaymentButtonClicked,
            buttonSizeMode: 'fill',
            buttonType: 'plain'
        });
        container.appendChild(button);
        container.setAttribute('data-set', '1');
        return Promise.resolve();
    }

    function onGooglePayLoaded() {
        var paymentsClient = getGooglePaymentsClient();

        if (!paymentsClient) {
            return Promise.resolve();
        }

        return paymentsClient.isReadyToPay(getGoogleIsReadyToPayRequest())
            .then(function (response) {
                if (response.result) {
                    return addGooglePayButton();
                }
                return null;
            })
            .catch(function (err) {
                console.error('[GooglePay] Failed to initialize:', err);
            });
    }

    refreshGooglePayConfig();
    window.addGooglePayButton = addGooglePayButton;
    window.onGooglePayLoaded = onGooglePayLoaded;
    window.WorldpayGooglePay = {
        render: addGooglePayButton,
        onGooglePayLoaded: onGooglePayLoaded
    };
}());
