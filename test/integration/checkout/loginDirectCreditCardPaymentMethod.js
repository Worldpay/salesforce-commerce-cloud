var testData = require('../helpers/common');
var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');


describe('Place Order - Registered User Direct Credit Card Payment Method', function () {
    this.timeout(25000);

    var variantId = testData.variantId;
    var quantity = 1;
    var cookieJar = request.jar();
    var cookieString;

    var myRequest = {
        url: '',
        method: 'POST',
        rejectUnauthorized: false,
        resolveWithFullResponse: true,
        jar: cookieJar,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    };

    myRequest.url = config.baseUrl + '/Cart-AddProduct';
    myRequest.form = {
        pid: variantId,
        quantity: quantity
    };

    before(function () {
        // ----- adding product to Cart
        return request(myRequest)
            .then(function (response) {
                assert.equal(response.statusCode, 200, 'Expected add to Cart request statusCode to be 200.');
                cookieString = cookieJar.getCookieString(myRequest.url);
            })
            // ---- csrf token generation
            .then(function () {
                myRequest.method = 'POST';
                myRequest.url = config.baseUrl + '/CSRF-Generate';
                var cookie = request.cookie(cookieString);
                cookieJar.setCookie(cookie, myRequest.url);
                return request(myRequest);
            })
            // ----login in account
            .then(function (csrfResponse) {
                var csrfJsonResponse = JSON.parse(csrfResponse.body);
                myRequest.method = 'POST';
                myRequest.url = config.baseUrl + '/Account-Login?' +
                    'checkoutLogin=' + true;
                myRequest.form = {
                    loginEmail: testData.loginDetails.loginId,
                    loginPassword: testData.loginDetails.password,
                    csrf_token: csrfJsonResponse.csrf.token
                };
                return request(myRequest);
            })
            // ---check response
            .then(function (response) {
                assert.equal(response.statusCode, 200, 'Expected CheckoutShippingServices-SubmitShipping statusCode to be 200.');
            })
            // ----csrf token generation
            .then(function () {
                myRequest.method = 'POST';
                myRequest.url = config.baseUrl + '/CSRF-Generate';
                var cookie = request.cookie(cookieString);
                cookieJar.setCookie(cookie, myRequest.url);
                return request(myRequest);
            })
            // ----set shipping address
            .then(function (csrfResponse) {
                var csrfJsonResponse = JSON.parse(csrfResponse.body);
                myRequest.method = 'POST';
                myRequest.url = config.baseUrl + '/CheckoutShippingServices-SubmitShipping?' +
                    csrfJsonResponse.csrf.tokenName + '=' +
                    csrfJsonResponse.csrf.token;
                myRequest.form = {
                    dwfrm_shipping_shippingAddress_addressFields_firstName: testData.shippingAddress.firstName,
                    dwfrm_shipping_shippingAddress_addressFields_lastName: testData.shippingAddress.lastName,
                    dwfrm_shipping_shippingAddress_addressFields_address1: testData.shippingAddress.address1,
                    dwfrm_shipping_shippingAddress_addressFields_address2: testData.shippingAddress.address2,
                    dwfrm_shipping_shippingAddress_addressFields_country: testData.shippingAddress.country,
                    dwfrm_shipping_shippingAddress_addressFields_states_stateCode: testData.shippingAddress.stateCode,
                    dwfrm_shipping_shippingAddress_addressFields_city: testData.shippingAddress.city,
                    dwfrm_shipping_shippingAddress_addressFields_postalCode: testData.shippingAddress.postalCode,
                    dwfrm_shipping_shippingAddress_addressFields_phone: testData.shippingAddress.phone,
                    dwfrm_shipping_shippingAddress_shippingMethodID: '001'
                };
                return request(myRequest);
            })
            // ---response of submitshipping
            .then(function (response) {
                assert.equal(response.statusCode, 200, 'Expected CheckoutShippingServices-SubmitShipping statusCode to be 200.');
            })
            // ----csrf token generation
            .then(function () {
                myRequest.method = 'POST';
                myRequest.url = config.baseUrl + '/CSRF-Generate';
                var cookie = request.cookie(cookieString);
                cookieJar.setCookie(cookie, myRequest.url);
                return request(myRequest);
            })
            // ---setting billing address and payment method
            .then(function (csrfResponse) {
                var csrfJsonResponse = JSON.parse(csrfResponse.body);
                myRequest.method = 'POST';
                myRequest.url = config.baseUrl + '/CheckoutServices-SubmitPayment?' +
                    csrfJsonResponse.csrf.tokenName + '=' +
                    csrfJsonResponse.csrf.token;
                myRequest.form = {
                    dwfrm_billing_addressFields_firstName: testData.billingAddress.firstName,
                    dwfrm_billing_addressFields_lastName: testData.billingAddress.lastName,
                    dwfrm_billing_addressFields_address1: testData.billingAddress.address1,
                    dwfrm_billing_addressFields_address2: testData.billingAddress.address2,
                    dwfrm_billing_addressFields_country: testData.billingAddress.country,
                    dwfrm_billing_addressFields_states_stateCode: testData.billingAddress.stateCode,
                    dwfrm_billing_addressFields_city: testData.billingAddress.city,
                    dwfrm_billing_addressFields_postalCode: testData.billingAddress.postalCode,
                    dwfrm_billing_billingUserFields_email: testData.billingAddress.email,
                    dwfrm_billing_billingUserFields_phone: testData.billingAddress.phone,
                    dwfrm_billing_creditCardFields_cpf: '',
                    dwfrm_billing_paymentMethod: 'CREDIT_CARD',
                    dwfrm_billing_creditCardFields_cardType: testData.creditCardVisa2.cardType,
                    dwfrm_billing_creditCardFields_cards: testData.creditCardVisa2.cardName,
                    dwfrm_billing_creditCardFields_cardOwner: testData.creditCardVisa2.cardOwner,
                    dwfrm_billing_creditCardFields_cardNumber: testData.creditCardVisa2.number,
                    dwfrm_billing_creditCardFields_expirationMonth: testData.creditCardVisa2.monthIndex,
                    dwfrm_billing_creditCardFields_expirationYear: testData.creditCardVisa2.yearIndex,
                    dwfrm_billing_creditCardFields_securityCode: testData.creditCardVisa2.cvn,
                    dwfrm_billing_creditCardFields_saveCard: true
                };
                return request(myRequest);
            })
            // response of submit payment
            .then(function (response) {
                assert.equal(response.statusCode, 200, 'Expected CheckoutServices-SubmitPayment statusCode to be 200.');
            });
    });

    it('positive test for Direct Credit Card', function () {
        myRequest.url = config.baseUrl + '/CheckoutServices-PlaceOrder';

        return request(myRequest)
            // Handle response from request
            .then(function (response) {
                var bodyAsJson = JSON.parse(response.body);
               // console.log('***********' + JSON.stringify(bodyAsJson) + '**********'); // eslint-disable-line
                assert.equal(response.statusCode, 200, 'Expected statusCode to be 200.');
                assert.equal(bodyAsJson.error, false, 'Expected error status is false.');
                assert.equal(bodyAsJson.continueUrl, '/on/demandware.store/Sites-MobileFirst-Site/en_US/Order-Confirm', 'Expected continue url should be displayed.');
            });
    });
});
