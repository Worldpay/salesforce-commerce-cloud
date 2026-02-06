'use strict';

const ServiceRegistry = require('dw/svc/LocalServiceRegistry');
const Logger = require('dw/system/Logger').getLogger('awp');
const {
    mockValue
} = require('*/cartridge/scripts/service/mocks/paymentQueries');

/**
 * Creates a configurable payment queries service
 * @param {Object} config - Service configuration object
 * @param {string} [config.method] - HTTP method (GET, POST, PUT, DELETE, etc.) - defaults to 'GET'
 * @param {string} config.path - URL path for the service endpoint
 * @param {Object} [config.headers] - Additional headers to include in the request
 * @param {Object} [config.mockResponse] - Mock response for testing/development
 * @returns {Object} - Configured service instance
 */
const createPaymentQueriesService = (config) => {
    const serviceId = 'worldpay_access.http.worldpay.payment.post';

    return ServiceRegistry.createService(serviceId, {
        createRequest: function (svc, params) {
            svc.setRequestMethod(config.method || 'GET');
            svc.setURL(svc.getURL() + config.path);

            // Set default headers
            svc.addHeader(
                'Content-Type',
                'application/vnd.worldpay.payments-v6+json'
            );
            svc.addHeader('Accept', 'application/json');

            // Add custom headers
            if (config.headers) {
                Object.keys(config.headers).forEach(function (key) {
                    svc.addHeader(key, config.headers[key]);
                });
            }

            return params ? JSON.stringify(params) : null;
        },

        parseResponse: function (svc, httpClient) {
            try {
                Logger.debug(
                    'Response Text createPaymentQueriesService - {0} : {1}',
                    httpClient.text,
                    serviceId
                );
                return httpClient.text ? JSON.parse(httpClient.text) : {};
            } catch (e) {
                const error = e instanceof Error ? e : new Error(String(e));
                Logger.error('Error parsing response: {0}', error.message);
                return { error: true, message: 'Failed to parse response' };
            }
        },

        mockCall: function () {
            if (config.mockResponse) {
                Logger.debug('Using mock response for service: {0}', serviceId);
                return {
                    status: 'OK',
                    object: config.mockResponse
                };
            }
            return null;
        }
    });
};

/**
 * Example of how to use createPaymentQueriesService for payment retrieval
 * @param {string} paymentId - The ID of the payment to retrieve
 * @returns {Object} - An object containing either the payment details or an error flag
 */
const getPayment = (paymentId) => {
    // Create a GET service for payment queries with mock support
    const service = createPaymentQueriesService({
        path: '/paymentQueries/payments/' + encodeURIComponent(paymentId),
        headers: {
            'X-WP-ClientType': 'SFCC'
        },
        mockResponse: mockValue // Use mock response for testing
    });

    // Call the service
    const result = service.call();

    if (result.ok) {
        return { error: false, payment: result.object };
    }
    return { error: true };
};
/**
 * Posts a manage payment request to the specified URL
 * @param {Object} params - The parameters for the request
 * @param {string} params.paymentHrefPath - The URL path for the payment request
 * @param {Object | null} params.requestBody - The body of the request
 * @returns {Object} - The result of the service call
 */
const postManagePayment = ({paymentHrefPath, requestBody}) => {
    const service = createPaymentQueriesService({
        method: 'POST',
        path: paymentHrefPath,
        headers: {
            'WP-Api-Version': '2024-06-01'
        }
        // mockResponse: mockValue
    });

    const result = service.call(requestBody);

    if (result.ok) {
        return { error: false, response: result.object };
    }
    return { error: true };
};

const postCancelRequest = (cancelHrefUrlPath) => {
    const service = createPaymentQueriesService({
        method: 'POST',
        path: cancelHrefUrlPath,
        headers: {
            'WP-Api-Version': '2024-06-01'
        }
        // mockResponse: mockValue
    });

    const result = service.call();

    if (result.ok) {
        return { error: false, response: result.object };
    }
    return { error: true };
};

const postPartialCancelRequest = (partialCancelHrefUrlPath, amountMinor, currency, reference) => {
    const payload = {
        reference: reference || 'partial-cancel-' + new Date().getTime(),
        value: {
            amount: amountMinor,
            currency: currency
        }
    };

    const service = createPaymentQueriesService({
        method: 'POST',
        path: partialCancelHrefUrlPath,
        headers: {
            'Content-Type': 'application/vnd.worldpay.payments-v7+json',
            'Accept': 'application/vnd.worldpay.payments-v7+json',
            'WP-Api-Version': '2024-06-01'
        }
    });

    const result = service.call(payload);

    if (result.ok) {
        return { error: false, response: result.object };
    }
    return {
        error: true,
        statusCode: result.error,
        errorMessage: result.errorMessage
    };
};

module.exports = {
    createPaymentQueriesService,
    getPayment,
    postCancelRequest,
    postPartialCancelRequest,
    postManagePayment
};
