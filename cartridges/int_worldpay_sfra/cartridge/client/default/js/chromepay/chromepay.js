/* eslint-disable no-unused-vars */
'use strict';
var Cleave = require('cleave.js').default;
var dataSessionId = null;
var CryptoJS = require('crypto-js');

/**
 * Encrypts the payment Details.
 * @param {details}  details The instrument to convert.
 * @returns {string} encryptedData
 */
function encryption(details) {
    if ($('.WorldpayClientSideEncryptionEnabled').length > 0) {
        var data = {
            cvc: details.cardSecurityCode,
            cardHolderName: details.cardholderName,
            cardNumber: details.cardNumber,
            expiryMonth: details.expiryMonth,
            expiryYear: details.expiryYear
        };
        Worldpay.setPublicKey($('.WorldpayClientSideEncryptionEnabled').attr('data-publickey'));
        var encryptedData = Worldpay.encrypt(data, function () {
        });
        if (encryptedData) {
            return encryptedData;
        }
    }
    return null;
}

// eslint-disable-next-line require-jsdoc
function base64url(source) {
      // Encode in classical base64
    let encodedSource = CryptoJS.enc.Base64.stringify(source);

      // Remove padding equal characters
    encodedSource = encodedSource.slice(0, encodedSource.indexOf('=') !== -1 ? encodedSource.indexOf('=') : encodedSource.length);

      // Replace characters according to base64url specifications
    encodedSource = encodedSource.replace(/\+/g, '-');
    encodedSource = encodedSource.replace(/\//g, '_');

    return encodedSource;
}

// eslint-disable-next-line require-jsdoc
function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        // eslint-disable-next-line no-mixed-operators
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
}

// eslint-disable-next-line require-jsdoc
function createJWT() {
    var header = {
        alg: 'HS256',
        typ: 'JWT'
    };

    var jwtIssuer = document.getElementById('iss').value;
    var orgUnitId = document.getElementById('OrgUnitId').value;
    var jwtMacKey = document.getElementById('jwtMacKey').value;
    var iat = document.getElementById('iat').value;
    var jti = uuidv4();

    var data = {
        jti: jti,
        iat: iat,
        iss: jwtIssuer,
        OrgUnitId: orgUnitId
    };

    var secret = jwtMacKey;
    var stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
    var encodedHeader = base64url(stringifiedHeader);
    var stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(data));
    var encodedData = base64url(stringifiedData);
    var signature = encodedHeader + '.' + encodedData;
    // eslint-disable-next-line new-cap
    signature = CryptoJS.HmacSHA256(signature, secret);
    signature = base64url(signature);
    return encodedHeader + '.' + encodedData + '.' + signature;
}

// eslint-disable-next-line require-jsdoc
function extractSessionId(ddcResponseStr) {
    var startIndex = ddcResponseStr.indexOf('sendNotification(');
    if (startIndex !== -1) {
        var endIndex = ddcResponseStr.indexOf(');', startIndex);
        if (endIndex !== -1) {
            var functionCall = ddcResponseStr.substring(startIndex, endIndex + 2);
            var parts = functionCall.split('"');

            if (parts.length >= 2) {
                var sessionId = parts[1].trim(); // The session ID should be the second part
                return sessionId;
            }
        }
    }
    return new Error('Session ID not found');
}

/**
 * Converts the payment instrument into a JSON string.
 *
 * @private
 * @param {PaymentResponse} instrument The instrument to convert.
 */
function instrumentToJsonString(instrument) {
    var details = instrument.details;
    var instrumentString = JSON.stringify(instrument);
    var cardNumber = instrument.details.cardNumber;
    var cardType = Cleave.CreditCardDetector.getInfo(cardNumber, false);
    var cardTypeString = JSON.stringify(cardType);
    var encryptedData = encryption(details);
    var placeorderURL = $('#placeOrderChromePay').val();
    var bin = cardNumber;
    var JWT = createJWT();
    if (cardNumber.length) {
        $.spinner().start();
        var iframeurl = $('#card-iframe').val();
        window.addEventListener('message', function (event) {
            var data = JSON.parse(event.data);
            dataSessionId = data.SessionId;
        }, false);
        $.when($.ajax({
            url: iframeurl,
            type: 'GET',
            async: false,
            data: { bin: bin, JWT: JWT },
            success: function (response) {
                if (response.responseObject) {
                    var ddcResponse = response.responseObject;
                    var ddcResponseStr = ddcResponse.toString();
                    dataSessionId = extractSessionId(ddcResponseStr);
                }
            }

        })).then($.ajax({
            url: placeorderURL,
            dataType: 'json',
            data: { dataSessionId: dataSessionId,
                encryptedData: encryptedData,
                instrumentString: instrumentString,
                cardTypeString: cardTypeString,
                browserScreenHeight: screen.height,
                browserScreenWidth: screen.width
            },
            type: 'POST',
            success: function (response) {
                if (response.error && response.errorMessage) {
                    var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
                    'fade show" role="alert">' +
                    '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                    '<span aria-hidden="true">&times;</span>' +
                    '</button>' + response.errorMessage + '</div>';

                    $('.cart-error').append(errorHtml);
                    $('.checkout-btn').addClass('disabled');
                    $('#chrome-pay-now').addClass('disabled');
                    $.spinner().stop();
                } else if (response.redirectUrl) {
                    window.location.href = response.redirectUrl;
                    $.spinner().stop();
                } else if (response.continueUrl) {
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
                    $.spinner().stop();
                }
            }
        }));
    }
}

/**
 * Simulates processing the payment data on the server.
 * @param {PaymentResponse} instrumentResponse The payment information to
 * process.
 */
function sendPaymentToServer(instrumentResponse) {
    instrumentResponse.complete('success')
            .then(function () {
                instrumentToJsonString(instrumentResponse);
            })
            .catch(function (err) {
                return new Error('There is an error with Chrome Pay : ' + err.responseText);
            });
}
/**
 * Invokes PaymentRequest for credit cards.
 * @param {PaymentRequest} request The PaymentRequest object.
 */
function onBuyClicked(request) {
    request.show().then(function (instrumentResponse) {
        sendPaymentToServer(instrumentResponse);
    })
        .catch(function (err) {
            return new Error('There is an error with Chrome Pay : ' + err.responseText);
        });
}
/**
 * Updates the total,tax and shippingmethods
 * @param {PaymentData} paymentData Has the content which will be updated for ui
 * @param {shippingOption} shippingOption selected shipping option code
 * @param {resolve} resolve To resolve the promise
 * @param {reject} reject To reject the promise
 */
function onShippingMethodChange(paymentData, shippingOption, resolve, reject) {
    var urlSelectShippingMethod = $('#SelectShippingMethod').val();
    $.when($.ajax({
        url: urlSelectShippingMethod,
        type: 'POST',
        data: {
            methodID: shippingOption
        },
        error: function (err) {
            // error handling goes here for onShippingMethodChange
            return new Error('There is an error while initializing the Chrome Pay onShippingMethodChange: ' + err.responseText);
        }
    })).then(function () {
        var url = $('#chrome-pay-now').data('target');
        $.when($.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            error: function (err) {
                // error handling goes here
                return new Error('There is an error while initializing the Chrome Pay for : ' + err.responseText);
            }
        })).then(function (data) {
            // eslint-disable-next-line no-param-reassign
            paymentData = data.chromePayment;
            const initialPaymentData = paymentData;
            initialPaymentData.details.shippingOptions.forEach((option) => {
                // eslint-disable-next-line no-param-reassign
                option.selected = option.id === shippingOption;
            });

            resolve(paymentData.details);
        }).catch(function (error) {
            reject(error);
        });
    });
}
/**
 * Updates the total,tax and shippingmethods
 * @param {PaymentData} paymentData Has the content which will be updated for ui
 * @param {paymentRequest} paymentRequest selected shipping option code
 * @param {resolve} resolve To resolve the promise
 * @param {reject} reject To reject the promise
 */
function onShippingAddressChange(paymentData, paymentRequest, resolve, reject) {
    var state = paymentRequest.shippingAddress.region;
    var shippingAddress = paymentRequest.shippingAddress;
    var urlSelectShippingAddress = $('#SelectShippingAddress').val();

    $.when($.ajax({
        url: urlSelectShippingAddress,
        type: 'POST',
        data: {
            city: shippingAddress.city,
            postalCode: shippingAddress.postalCode,
            stateCode: state,
            countryCode: shippingAddress.country
        },
        error: function (err) {
            // error handling goes here
            return new Error('There is an error while initializing the Chrome Pay : ' + err.responseText);
        }
    })).then(function () {
        // This ajax call converts the cartmodel into chrome payload
        var URL = $('#chrome-pay-now').data('target');
        $.when($.ajax({
            url: URL,
            type: 'GET',
            dataType: 'json',
            error: function (err) {
                // error handling goes here
                return new Error('There is an error while initializing the Chrome Pay : ' + err.responseText);
            }
        })).then(function (data) {
            // eslint-disable-next-line no-param-reassign
            paymentData = data.chromePayment;
            resolve(paymentData.details);
        }).catch(function (error) {
            reject(error);
        });
    });
}

/**
 * Init the chrome pay
 */
function initializeChromePayment() {
    let paymentData;
    let paymentRequest;
    let url = $('#chrome-pay-now').data('target');
    let options = {
        requestPayerName: true,
        requestPayerPhone: true,
        requestPayerEmail: true,
        requestShipping: true
    };

    $.when($.ajax({
        url: url,
        type: 'get',
        dataType: 'json',
        error: function (err) {
            // error handling goes here for initializeChromePayment
            return new Error('There is an error while initializing the Chrome Pay : ' + err.responseText);
        }
    })).then(function (data) {
        paymentData = data.chromePayment;

        paymentRequest = new PaymentRequest(paymentData.supportedInstruments, paymentData.details, options);
        onBuyClicked(paymentRequest);
        paymentRequest.addEventListener('shippingaddresschange', (event) => {
            event.updateWith(new Promise(function (resolve, reject) {
                onShippingAddressChange(paymentData, paymentRequest, resolve, reject);
            }));
        });
        paymentRequest.addEventListener('shippingoptionchange', (event) => {
            event.updateWith(new Promise(function (resolve, reject) {
                onShippingMethodChange(paymentData, paymentRequest.shippingOption, resolve, reject);
            }));
        });
    });
}
// Start
if (window.PaymentRequest) {
    $(document).on('click', '#chrome-pay-now', function () {
        initializeChromePayment();
    });
}

