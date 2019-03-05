var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var testData = require('../helpers/common');

describe('Place Order - SEPA Payment Method', function () {
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
            // ------csrf token generation
            .then(function () {
                myRequest.method = 'POST';
                myRequest.url = config.baseUrl + '/CSRF-Generate';
                var cookie = request.cookie(cookieString);
                cookieJar.setCookie(cookie, myRequest.url);
                return request(myRequest);
            })
            // ------set shipping address
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
            // -----response of submit shipping
            .then(function (response) {
                assert.equal(response.statusCode, 200, 'Expected CheckoutShippingServices-SubmitShipping statusCode to be 200.');
            })
            // -----csrf token generation
            .then(function () {
                myRequest.method = 'POST';
                myRequest.url = config.baseUrl + '/CSRF-Generate';
                var cookie = request.cookie(cookieString);
                cookieJar.setCookie(cookie, myRequest.url);
                return request(myRequest);
            })
            // -----setting billing address and payment method
            .then(function (csrfResponse) {
                var csrfJsonResponse = JSON.parse(csrfResponse.body);
                myRequest.method = 'POST';
                myRequest.url = config.baseUrl + '/CheckoutServices-SubmitPayment?' +
                    csrfJsonResponse.csrf.tokenName + '=' +
                    csrfJsonResponse.csrf.token;
                myRequest.form = {
                    dwfrm_billing_addressFields_firstName: testData.sepaBillingAddress.firstName,
                    dwfrm_billing_addressFields_lastName: testData.sepaBillingAddress.lastName,
                    dwfrm_billing_addressFields_address1: testData.sepaBillingAddress.address1,
                    dwfrm_billing_addressFields_address2: testData.sepaBillingAddress.address2,
                    dwfrm_billing_addressFields_country: testData.sepaBillingAddress.country,
                    dwfrm_billing_addressFields_states_stateCode: testData.sepaBillingAddress.stateCode,
                    dwfrm_billing_addressFields_city: testData.sepaBillingAddress.city,
                    dwfrm_billing_addressFields_postalCode: testData.sepaBillingAddress.postalCode,
                    dwfrm_billing_billingUserFields_email: testData.sepaBillingAddress.email,
                    dwfrm_billing_billingUserFields_phone: testData.sepaBillingAddress.phone,
                    dwfrm_billing_elvFields_elvMandateID: 'M-100038056-201901095421233',
                    dwfrm_billing_elvFields_elvMandateType: 'RECURRING',
                    dwfrm_billing_elvFields_iban: 'DE93100000000012345678',
                    dwfrm_billing_elvFields_accountHolderName: 'sonal cxcxz',
                    dwfrm_billing_elvFields_elvConsent: true,
                    dwfrm_billing_paymentMethod: 'ELV-SSL',
                    dwfrm_billing_creditCardFields_cards: 'VISA-SSL',
                    dwfrm_billing_creditCardFields_expirationMonth: '1',
                    dwfrm_billing_creditCardFields_expirationYear: '2025'
                };
                return request(myRequest);
            })
            // -----response of submit payment
            .then(function (response) {
                assert.equal(response.statusCode, 200, 'Expected CheckoutServices-SubmitPayment statusCode to be 200.');
            });
    });

    it('positive test for SEPA Payment Method', function () {
        myRequest.url = config.baseUrl + '/CheckoutServices-PlaceOrder';

        return request(myRequest)
            // Handle response from request
            .then(function (response) {
                var bodyAsJson = JSON.parse(response.body);
                console.log('***********' + JSON.stringify(bodyAsJson) + '**********'); // eslint-disable-line
                assert.equal(response.statusCode, 200, 'Expected statusCode to be 200.');
                assert.equal(bodyAsJson.error, false, 'Expected error status is false.');
                assert.equal((bodyAsJson.continueUrl).includes('apmName=ELV-SSL'), true, 'Expected payment method should be displayed.');
                assert.equal((bodyAsJson.continueUrl).includes('order_id=' + bodyAsJson.orderID), true, 'Expected order number should be displayed.');
                assert.equal(bodyAsJson.continueUrl, 'https://worldpay03-tech-prtnr-eu04-dw.demandware.net/on/demandware.store/Sites-MobileFirst-Site/en_US/COPlaceOrder-Submit?order_id=' + bodyAsJson.orderID + '&order_token=' + bodyAsJson.orderToken + '&paymentStatus=PENDING&apmName=ELV-SSL', 'Expected continue url should be displayed');
            });
    });
});
