'use strict';
/**
 * Define the version of the Google Pay API referenced when creating your
 * configuration
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#PaymentDataRequest|apiVersion in PaymentDataRequest}
 */
const baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0
};

var googleMerchantID = document.getElementById('googlePayMerchantID').value;
var googleMerchantName = document.getElementById('googleMerchantName').value;
var gatewayMerchantID = document.getElementById('gatewayMerchantId').value;
var gatewayMerchantName = document.getElementById('gatewayMerchantName').value;
var googlePayEnvironment = document.getElementById('googlePayEnvironment').value;

var currencyCode = document.getElementById('currencyCode').value;
var taxTotal = '';
var shippingTotal = '';
var grossTotal = '';
var isPdpPage = document.getElementById('isPdpPage').value;

var shippingMethods = {
    defaultSelectedOptionId: '',
    shippingOptions: [{
        id: '',
        label: '',
        description: '',
        cost: ''
    }]
};

/**
 * Card networks supported by your site and your gateway
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#CardParameters|CardParameters}
 */

const ALLOWED_CARD_NETWORKS = ['AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA'];
/**
 * Card authentication methods supported by your site and your gateway
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#CardParameters|CardParameters}
 * supported card networks
 */
const ALLOWED_CARD_AUTH_METHODS = ['PAN_ONLY', 'CRYPTOGRAM_3DS'];

/**
 * Identify your gateway and your site's gateway merchant identifier
 *
 * The Google Pay API response will return an encrypted payment method capable
 * of being charged by a supported gateway after payer authorization
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#gateway|PaymentMethodTokenizationSpecification}
 */
var TOKENIZATION_SPECIFICATION = {
    type: 'PAYMENT_GATEWAY',
    parameters: {
        gateway: gatewayMerchantName,
        gatewayMerchantId: gatewayMerchantID
    }
};

/**
 * Describe your site's support for the CARD payment method and its required
 * fields
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#CardParameters|CardParameters}
 */
const baseCardPaymentMethod = {
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

/**
 * Describe your site's support for the CARD payment method including optional
 * fields
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#CardParameters|CardParameters}
 */
var cardPaymentMethod = Object.assign(
    {},
    baseCardPaymentMethod,
    {
        tokenizationSpecification: TOKENIZATION_SPECIFICATION
    }
);

/**
 * An initialized google.payments.api.PaymentsClient object or null if not yet set
 *
 * @see {@link getGooglePaymentsClient}
 */
let paymentsClient = null;

/**
 * Configure your site's support for payment methods supported by the Google Pay
 * API.
 *
 * Each member of allowedPaymentMethods should contain only the required fields,
 * allowing reuse of this base request when determining a viewer's ability
 * to pay and later requesting a supported payment method
 *
 * @returns {Object} Google Pay API version, payment methods supported by the site
 */
function getGoogleIsReadyToPayRequest() {
    return Object.assign(
        {},
        baseRequest,
        {
            allowedPaymentMethods: [baseCardPaymentMethod]
        }
    );
}

/**
 * Provide Google Pay API with shipping address parameters when using dynamic buy flow.
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#ShippingAddressParameters|ShippingAddressParameters}
 * @returns {Object} shipping address details, suitable for use as shippingAddressParameters property of PaymentDataRequest
*/
function getGoogleShippingAddressParameters() {
    return {
        phoneNumberRequired: true
    };
}

/**
 * Provide Google Pay API with a payment amount, currency, and amount status
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#TransactionInfo|TransactionInfo}
 * @returns {Object} transaction info, suitable for use as transactionInfo property of PaymentDataRequest
 */
function getGoogleTransactionInfo() {
    var url = $('#PDPGooglePay-GetCurrentBasket').val();
    $.ajax({
        url: url,
        type: 'get',
        async: false,
        data: {},
        success: function (response) {
            taxTotal = response.taxTotal;
            shippingTotal = response.shippingTotal;
            grossTotal = response.grossTotal;
        }
    });
    return {
        displayItems: [
            {
                label: 'Subtotal',
                type: 'SUBTOTAL',
                price: (grossTotal - shippingTotal - taxTotal).toFixed(2).toString()
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

/**
 * Provide Google Pay API with shipping options and a default selected shipping option.
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#ShippingOptionParameters|ShippingOptionParameters}
 * @returns {Object} shipping option parameters, suitable for use as shippingOptionParameters property of PaymentDataRequest
 */
function getGoogleDefaultShippingOptions() {
    var shippingOptions = [];
    for (var i = 0; i < shippingMethods.shippingOptions.length; i++) {
        let shippingOption = {
            id: shippingMethods.shippingOptions[i].id,
            label: shippingMethods.shippingOptions[i].label,
            description: shippingMethods.shippingOptions[i].description
        };
        shippingOptions.push(shippingOption);
    }
    return {
        defaultSelectedOptionId: shippingMethods.defaultSelectedOptionId,
        shippingOptions: shippingOptions
    };
}

/**
* Configure support for the Google Pay API
*
* @see {@link https://developers.google.com/pay/api/web/reference/request-objects#PaymentDataRequest|PaymentDataRequest}
* @returns {Object} PaymentDataRequest fields
*/
function getGooglePaymentDataRequest() {
    const paymentDataRequest = Object.assign({}, baseRequest);
    paymentDataRequest.allowedPaymentMethods = [cardPaymentMethod];
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
    paymentDataRequest.merchantInfo = {
        // See {@link https://developers.google.com/pay/api/web/guides/test-and-deploy/integration-checklist|Integration checklist}
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

/**
 * Process payment data returned by the Google Pay API
 *
 * @param {Object} paymentData response from Google Pay API after user approves payment
 * @see {@link https://developers.google.com/pay/api/web/reference/response-objects#PaymentData|PaymentData object reference}
 * @return {Object} returns a Promise object
 */
function processPayment(paymentData) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve({});
        }, 3000);
    });
}

/**
 * Processes payment and executes custom code
 *
 * @param {Object} paymentData - Contains info required for processing payment
 * @returns {Object} A promise which processes the payment and executes custom code
 */
function onPaymentAuthorized(paymentData) {
    return new Promise(function (resolve, reject) {
    // handle the response
        processPayment(paymentData)
            .then(function () {
                resolve({ transactionState: 'SUCCESS' });
                var jsonString = JSON.stringify(paymentData);
                var parsedjsonString = $.parseJSON(jsonString);
                var googletoken = parsedjsonString.paymentMethodData.tokenizationData.token;
                var parsedgoogletoken = $.parseJSON(googletoken);
                var signature = parsedgoogletoken.signature;
                var protocolVersion = parsedgoogletoken.protocolVersion;
                var signedMessage = parsedgoogletoken.signedMessage;
                $('#signature').attr('value', signature);
                $('#protocolVersion').attr('value', protocolVersion);
                $('#signedMessage').attr('value', signedMessage);
                $('#gpay-error').html('');
                let url = $('#PDPGooglePay-SubmitOrder').val();
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
                        success: function (response) {
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
                                        url = response.redirectUrl;
                                        $(location).attr('href', url);
                                    } else if (response.errorMessage) {
                                        let url = $('#PDPGooglePay-RestoreBasket').val();
                                        $.ajax({
                                            url: url,
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

/**
 * Updates the shipping applicable shipping methods
 *
 * @param {Object} shippingAddress - Contains shipping address selected by user
 */
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
                let applicableShippingMethods = response.order.shipping[0].applicableShippingMethods;
                shippingMethods.shippingOptions = [];
                for (let i = 0; i < applicableShippingMethods.length; i++) {
                    let newShippingMethod = {
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

/**
 * Provides shipping costs of all applicable shipping methods
 *
 * @returns {Object} shipping costs of all applicable shipping methods
 */
function getShippingCosts() {
    var shippingCost = {};
    for (var i = 0; i < shippingMethods.shippingOptions.length; i++) {
        shippingCost[shippingMethods.shippingOptions[i].id] = shippingMethods.shippingOptions[i].cost;
    }
    return shippingCost;
}

/**
 * Helper function to create a new TransactionInfo object.
 * @param {string} shippingOptionId respresenting the selected shipping option in the payment sheet.
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#TransactionInfo|TransactionInfo}
 * @returns {Object} transaction info, suitable for use as transactionInfo property of PaymentDataRequest
*/
function calculateNewTransactionInfo(shippingOptionId) {
    let newTransactionInfo = getGoogleTransactionInfo();
    let totalPrice = 0.00;
    newTransactionInfo.displayItems.forEach(displayItem => totalPrice += parseFloat(displayItem.price));
    newTransactionInfo.totalPrice = grossTotal;
    return newTransactionInfo;
}

/**
 * Handles dynamic buy flow shipping address and shipping options callback intents.
 *
 * @param {Object} intermediatePaymentData response from Google Pay API a shipping address or shipping option is selected in the payment sheet.
 * @see {@link https://developers.google.com/pay/api/web/reference/response-objects#IntermediatePaymentData|IntermediatePaymentData object reference}
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/response-objects#PaymentDataRequestUpdate|PaymentDataRequestUpdate}
 * @returns {Promise<{Object}>} Promise of PaymentDataRequestUpdate object to update the payment sheet.
 */
function onPaymentDataChanged(intermediatePaymentData) {
    return new Promise(function (resolve, reject) {
        let shippingAddress = intermediatePaymentData.shippingAddress;
        let shippingOptionData = intermediatePaymentData.shippingOptionData;
        let paymentDataRequestUpdate = {};
        if (intermediatePaymentData.callbackTrigger === 'INITIALIZE' || intermediatePaymentData.callbackTrigger === 'SHIPPING_ADDRESS') {
            if (shippingAddress) {
                let url = $('#PDPGooglePay-SelectShippingDetails').val();
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
                    },
                    success: function (response) {}
                });
            }
            updateShippingOptions(shippingAddress);
            paymentDataRequestUpdate.newShippingOptionParameters = getGoogleDefaultShippingOptions();
            let selectedShippingOptionId = paymentDataRequestUpdate.newShippingOptionParameters.defaultSelectedOptionId;
            paymentDataRequestUpdate.newTransactionInfo = calculateNewTransactionInfo(selectedShippingOptionId);
        } else if (intermediatePaymentData.callbackTrigger === 'SHIPPING_OPTION') {
            if (shippingAddress) {
                let url = $('#PDPGooglePay-SelectShippingDetails').val();
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
                    },
                    success: function (response) {}
                });
            }
            paymentDataRequestUpdate.newTransactionInfo = calculateNewTransactionInfo(shippingOptionData.id);
        }
        resolve(paymentDataRequestUpdate);
    });
}

/**
 * Return an active PaymentsClient or initialize
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/client#PaymentsClient|PaymentsClient constructor}
 * @returns {google.payments.api.PaymentsClient} Google Pay API client
*/
function getGooglePaymentsClient() {
    if (paymentsClient === null) {
        if (isPdpPage !== 'null') {
            paymentsClient = new google.payments.api.PaymentsClient({
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
            paymentsClient = new google.payments.api.PaymentsClient({
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

/**
 * Show Google Pay payment sheet when Google Pay payment button is clicked
 */
function onGooglePaymentButtonClicked() {
    if (isPdpPage !== 'null') {
        var url = $('#PDPGooglePay-PrepareBasket').val();
        $.ajax({
            url: url,
            type: 'get',
            async: false,
            data: {}
        });
        var addToCart = document.querySelector('.add-to-cart');
        addToCart.click();
    }
    const paymentDataRequest = getGooglePaymentDataRequest();
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
    const paymentsClient = getGooglePaymentsClient();
    paymentsClient.loadPaymentData(paymentDataRequest).then(function (paymentData) {
        processPayment(paymentData);
    })
    .catch(function () {
        let url = $('#PDPGooglePay-RestoreBasket').val();
        $.ajax({
            url: url,
            type: 'post',
            async: false,
            data: {}
        });
    });
}

/**
 * Add a Google Pay purchase button alongside an existing checkout button
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#ButtonOptions|Button options}
 * @see {@link https://developers.google.com/pay/api/web/guides/brand-guidelines|Google Pay brand guidelines}
 */
function addGooglePayButton() {
    let isGooglePaySet = $('#containergpay').attr('data-set');
    if (isGooglePaySet !== '1') {
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
                }
            });
        }
        paymentsClient = getGooglePaymentsClient();
        const button = paymentsClient.createButton({ onClick: onGooglePaymentButtonClicked, buttonSizeMode: 'fill', buttonType: 'plain' });
        document.getElementById('containergpay').appendChild(button);
        $('#containergpay').attr('data-set', '1');
    }
}

/**
 * Initialize Google PaymentsClient after Google-hosted JavaScript has loaded
 *
 * Display a Google Pay payment button after confirmation of the viewer's
 * ability to pay.
 */
function onGooglePayLoaded() {
    const paymentsClient = getGooglePaymentsClient();
    paymentsClient.isReadyToPay(getGoogleIsReadyToPayRequest())
        .then(function (response) {
            if (response.result) {
                addGooglePayButton();
            }
        })
        .catch(function (err) {
            throw new Error(err);
        });
}

