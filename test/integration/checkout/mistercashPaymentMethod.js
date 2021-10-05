var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var testData = require('../helpers/common');

describe('Place Order - MisterCash Payment Method', function () {
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
            // csrf token generation
            .then(function () {
                myRequest.method = 'POST';
                myRequest.url = config.baseUrl + '/CSRF-Generate';
                var cookie = request.cookie(cookieString);
                cookieJar.setCookie(cookie, myRequest.url);
                return request(myRequest);
            })
            // set shipping address
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
            // response of submitshipping
            .then(function (response) {
                assert.equal(response.statusCode, 200, 'Expected CheckoutShippingServices-SubmitShipping statusCode to be 200.');
            })
            // csrf token generation
            .then(function () {
                myRequest.method = 'POST';
                myRequest.url = config.baseUrl + '/CSRF-Generate';
                var cookie = request.cookie(cookieString);
                cookieJar.setCookie(cookie, myRequest.url);
                return request(myRequest);
            })
            // setting billing address and payment method
            .then(function (csrfResponse) {
                var csrfJsonResponse = JSON.parse(csrfResponse.body);
                myRequest.method = 'POST';
                myRequest.url = config.baseUrl + '/CheckoutServices-SubmitPayment?' +
                    csrfJsonResponse.csrf.tokenName + '=' +
                    csrfJsonResponse.csrf.token;
                myRequest.form = {
                    dwfrm_billing_addressFields_firstName: testData.mistercashBillingAddress.firstName,
                    dwfrm_billing_addressFields_lastName: testData.mistercashBillingAddress.lastName,
                    dwfrm_billing_addressFields_address1: testData.mistercashBillingAddress.address1,
                    dwfrm_billing_addressFields_address2: testData.mistercashBillingAddress.address2,
                    dwfrm_billing_addressFields_country: testData.mistercashBillingAddress.country,
                    dwfrm_billing_addressFields_states_stateCode: testData.mistercashBillingAddress.stateCode,
                    dwfrm_billing_addressFields_city: testData.mistercashBillingAddress.city,
                    dwfrm_billing_addressFields_postalCode: testData.mistercashBillingAddress.postalCode,
                    dwfrm_billing_billingUserFields_email: testData.mistercashBillingAddress.email,
                    dwfrm_billing_billingUserFields_phone: testData.mistercashBillingAddress.phone,
                    dwfrm_billing_creditCardFields_cpf: '',
                    dwfrm_billing_idealFields_bank: 'ING',
                    dwfrm_billing_paymentMethod: 'MISTERCASH-SSL'
                };
                return request(myRequest);
            })
            // response of submit payment
            .then(function (response) {
                assert.equal(response.statusCode, 200, 'Expected CheckoutServices-SubmitPayment statusCode to be 200.');
            });
    });

    it('positive test for MisterCash Payment Method', function () {
        myRequest.url = config.baseUrl + '/CheckoutServices-PlaceOrder';

        return request(myRequest)
            // Handle response from request
            .then(function (response) {
                var bodyAsJson = JSON.parse(response.body);
                // console.log('***********' + JSON.stringify(bodyAsJson) + '**********'); // eslint-disable-line
                assert.equal(response.statusCode, 200, 'Expected statusCode to be 200.');
                assert.equal(bodyAsJson.error, false, 'Expected error status is false.');
                assert.equal((bodyAsJson.continueUrl).includes('paymentMethod=MISTERCASH'), true, 'Expected payment method should be displayed.');
                assert.equal((bodyAsJson.continueUrl).includes('orderNo=' + bodyAsJson.orderID), true, 'Expected order number should be displayed.');
            });
    });
});
