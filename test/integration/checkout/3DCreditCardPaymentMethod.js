var testData = require('../helpers/common');
var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');


describe('Place Order - 3D Credit Card Payment Method', function () {
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
            // ---- set shipping address
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
            // --- response of submitshipping
            .then(function (response) {
                assert.equal(response.statusCode, 200, 'Expected CheckoutShippingServices-SubmitShipping statusCode to be 200.');
            })
            // ---- csrf token generation
            .then(function () {
                myRequest.method = 'POST';
                myRequest.url = config.baseUrl + '/CSRF-Generate';
                var cookie = request.cookie(cookieString);
                cookieJar.setCookie(cookie, myRequest.url);
                return request(myRequest);
            })
            // --- setting billing address and payment method
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
					dwfrm_billing_creditCardFields_encryptedData: 'eyJhbGciOiJSU0ExXzUiLCJlbmMiOiJBMjU2R0NNIiwia2lkIjoiMSIsImNvbS53b3JsZHBheS5hcGlWZXJzaW9uIjoiMS4wIiwiY29tLndvcmxkcGF5LmxpYlZlcnNpb24iOiIxLjAuMSIsImNvbS53b3JsZHBheS5jaGFubmVsIjoiamF2YXNjcmlwdCJ9.Qh3iAov8JKH1k9kuFM8ivS2Xm2ZiNVAu6Q8tmn4zsHxmOWXQQv7dvqRgB6pb1-kMIjhHRikpaeVbaeS1w-7Vt9aGSR3dEvRNBCPf5nQEF7iqy6QQl8g-V4g_NH9leHLOtxzUrZ5VR1o3A-q8RulCcMqj3VlTO6aOS3PueqQS07TrgFDj5hg4efiwT3flz0ubOy8GdbrZX7Vlsyi5guGzVyuZKR9Kau6KQKu37ZbC9hU8m9WL_XLy-1rjV_RtdoECcq1utcrwOeRVQoG5BpVuZ5Wg1doI7ZcXMtvX2AkkA0CZsWxQvRPS_AMtYqjgeqc9v5D_49NVxNlDI4PB37BAXw.XQnOG-vVApfhzSkl.yWm8rxxFxrz-JjrCMp2rSY5vd-Z8C8FU3rL6UUfZxI9asdkrFOIicrSLgZlpndSaF1tIQOxhFpVcxQit-RHHKAcRcdrKO9d7TYXUng3xXN_sMP4ZxmBh8AEVqCu5v_WIEvSEzI0Key467w.Q6TW_5HI7jm69R1F5cx1UA',
                    dwfrm_billing_paymentMethod: 'CREDIT_CARD',
                    dwfrm_billing_creditCardFields_cardType: testData.creditCard3D.cardType,
                    dwfrm_billing_creditCardFields_cards: testData.creditCard3D.cardName,
                    dwfrm_billing_creditCardFields_cardOwner: testData.creditCard3D.cardOwner,
                    dwfrm_billing_creditCardFields_cardNumber: testData.creditCard3D.number,
                    dwfrm_billing_creditCardFields_expirationMonth: testData.creditCard3D.monthIndex,
                    dwfrm_billing_creditCardFields_expirationYear: testData.creditCard3D.yearIndex,
                    dwfrm_billing_creditCardFields_securityCode: testData.creditCard3D.cvn
                };
                return request(myRequest);
            })
            // response of submit payment
            .then(function (response) {
                assert.equal(response.statusCode, 200, 'Expected CheckoutServices-SubmitPayment statusCode to be 200.');
            });
    });

    it('positive test for 3D Credit Card', function () {
        myRequest.url = config.baseUrl + '/CheckoutServices-PlaceOrder';
        return request(myRequest)
		
            // Handle response from request
            .then(function (response) {
                var bodyAsJson = JSON.parse(response.body);
                assert.equal(response.statusCode, 200, 'Expected statusCode to be 200.');
                assert.equal(bodyAsJson.error, false, 'Expected error status is false.');
                assert.equal((bodyAsJson.continueUrl).includes('Worldpay-Worldpay3D'), true, 'Expected payment method should be displayed.');
                assert.equal((bodyAsJson.continueUrl).includes(bodyAsJson.orderID), true, 'Expected order number should be displayed.');
            });
    });
});
