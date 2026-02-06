'use strict';

const service = require('dw/svc');

const LocalServiceRegistry = service.LocalServiceRegistry;
const awpConstants = require('*/cartridge/scripts/common/awpConstants');

module.exports = LocalServiceRegistry.createService(awpConstants.SERVICE_ID, {
    createRequest: function (svc, args) {
        svc.setRequestMethod('POST');
        svc.addHeader('Content-Type', 'application/json');
        svc.addHeader('Accept', 'application/vnd.worldpay.payment_pages-v1.hal+json');
        svc.addHeader('WP-Api-Version', '2024-06-01');
        const url = svc.getConfiguration().getCredential().getURL() + '/payment_pages';
        svc.setURL(url);

        return JSON.stringify(args);
    },

    parseResponse: function (svc, client) {
        let result = {};
        try {
            result.response = JSON.parse(client.text);
            result.status = client.statusCode;
            return result;
        } catch (e) {
            return {
                error: true,
                message: 'Invalid JSON response',
                raw: client.text
            };
        }
    },

    filterLogMessage: function (msg) {
        return msg;
    }
});
