'use strict';

const BASE_REQUEST = {
    apiVersion: 2,
    apiVersionMinor: 0
};

var googleMerchantID = document.getElementById('googlePayMerchantID').value;
var googleMerchantName = document.getElementById('googleMerchantName').value;
var gatewayMerchantID = document.getElementById('gatewayMerchantId').value;
var gatewayMerchantName = document.getElementById('gatewayMerchantName').value;
var googlePayEnvironment = document.getElementById('googlePayEnvironment').value;

var grossPrice = document.getElementById('grossPrice').value;
var currencyCode = document.getElementById('currencyCode').value;
var grossPriceleng = grossPrice.length;
var usablegrossPrice = grossPrice.slice(1, grossPriceleng);

const ALLOWED_CARD_NETWORKS = ['AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA'];
const ALLOWED_CARD_AUTH_METHODS = ['PAN_ONLY', 'CRYPTOGRAM_3DS'];

const TOKENIZATION_SPECIFICATION = {
    type: 'PAYMENT_GATEWAY',
    parameters: {
        gateway: gatewayMerchantName,
        gatewayMerchantId: gatewayMerchantID
    }
};


const BASE_CARD_PAYMENT_METHOD = {
    type: 'CARD',
    parameters: {
        allowedAuthMethods: ALLOWED_CARD_AUTH_METHODS,
        allowedCardNetworks: ALLOWED_CARD_NETWORKS
    }
};


const CARD_PAYMENT_METHOD = Object.assign(
    {},
    BASE_CARD_PAYMENT_METHOD,
    {
        tokenizationSpecification: TOKENIZATION_SPECIFICATION
    }
);

let paymentsClient = null;

/**
 * Checks if the Google Pay is ready for Payment
 * @returns {Object} - object
 */
function getGoogleIsReadyToPayRequest() {
    return Object.assign(
        {},
        BASE_REQUEST,
        {
            allowedPaymentMethods: [BASE_CARD_PAYMENT_METHOD]
        }
    );
}


/**
 * Gets the Google Payment Clients
 * @returns {Object} - object
 */
function getGooglePaymentsClient() {
    if (paymentsClient === null) {
        paymentsClient = new google.payments.api.PaymentsClient({ environment: googlePayEnvironment });
    }
    return paymentsClient;
}

/**
 * Get the Transaction information
 * @returns {Object} - Transaction information
 */
function getGoogleTransactionInfo() {
    return {
        currencyCode: currencyCode,
        totalPriceStatus: 'FINAL',
        // set to cart total
        totalPrice: usablegrossPrice
    };
}

/**
 * Process the Payment Data
 * @param {Object}paymentData - paymentData
 */
function processPayment(paymentData) {
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
}

/**
 * Gets the Google Payment Data Request
 * @returns {Object} - Payment Data Request
 */
function getGooglePaymentDataRequest() {
    const paymentDataRequest = Object.assign({}, BASE_REQUEST);
    paymentDataRequest.allowedPaymentMethods = [CARD_PAYMENT_METHOD];
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
    paymentDataRequest.merchantInfo = {
        merchantId: googleMerchantID,
        merchantName: googleMerchantName
    };
    return paymentDataRequest;
}

/**
 * Logic after the Google Pay button is clicked
 */
function onGooglePaymentButtonClicked() {
    const paymentDataRequest = getGooglePaymentDataRequest();
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
    paymentsClient = getGooglePaymentsClient();
    paymentsClient.loadPaymentData(paymentDataRequest)
        .then(function (paymentData) {
            processPayment(paymentData);
        })
        .catch(function (err) {
            throw new Error(err);
        });
}


/**
 * Adds the Google Pay Button
 */
function addGooglePayButton() {
    let isGooglePaySet = $('#containergpay').attr('data-set');
    if (isGooglePaySet !== '1') {
        paymentsClient = getGooglePaymentsClient();
        const button = paymentsClient.createButton({ onClick: onGooglePaymentButtonClicked });
        document.getElementById('containergpay').appendChild(button);
        $('#containergpay').attr('data-set', '1');
    }
}

/**
 * Checks if the Google Payment is loaded
 */
function onGooglePayLoaded() {
    paymentsClient = getGooglePaymentsClient();
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

