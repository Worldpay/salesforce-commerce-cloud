'use strict';

const Logger = require('dw/system/Logger');
const Site = require('dw/system/Site');
const ServiceRegistry = require('dw/svc/LocalServiceRegistry');
const Encoding = require('dw/crypto/Encoding');
const Bytes = require('dw/util/Bytes');

/**
 * Sends the JSON request to the server via service call and returns the answer or null if not successfull
 * @param {Object} payload - The request payload to be sent to Worldpay 
 * @returns {Object|null} The parsed JSON response from Worldpay, or null in case of failure
 */
function serviceCall(payload) {
    const wpApiVersion = Site.getCurrent().getCustomPreferenceValue('WPApiVersion');
    

    let service;
    let result;
    try {
        service = ServiceRegistry.createService('worldpay_access.http.worldpay.payment.post', {
            createRequest: function (svc, args) {
                svc.setRequestMethod('POST');
                svc.setURL(svc.getConfiguration().getCredential().getURL() + '/payment_pages');

                const credential = svc.getConfiguration().getCredential();
                const rawAuth = credential.getUser() + ':' + credential.getPassword();
                const encodedAuth = Encoding.toBase64(new Bytes(rawAuth, 'UTF-8'));
                const userAgent = require('*/cartridge/scripts/helpers/serviceHelper').getUserAgentHeader(svc.getURL())

                svc.addHeader('Authorization', 'Basic ' + encodedAuth);
                svc.addHeader('Content-Type', 'application/vnd.worldpay.payment_pages-v1.hal+json');
                svc.addHeader('User-Agent', userAgent);
                svc.addHeader('WP-Api-Version', wpApiVersion);

                return JSON.stringify(args); 
            },

            parseResponse: function (svc, client) {
                let response = null;
                try {
                    response = JSON.parse(client.text);
                    Logger.getLogger('awp').info('Access API Response: ' + JSON.stringify(response));
                } catch (e) {
                    Logger.getLogger('awp').error('Access API: Invalid JSON response');
                }
                return response;
            },

            filterLogMessage: function (msg) {
                if (!msg) return msg;
                try {
                    let str = typeof msg === 'string' ? msg : JSON.stringify(msg);
                    return str.replace(/"cardNumber"\s*:\s*"\d+"/, '"cardNumber":"****"')
                        .replace(/"cvc"\s*:\s*"\d+"/, '"cvc":"***"');
                } catch (e) {
                    return msg;
                }
            }
        });

        result = service.call(payload);

        if (!result || result.status === 'SERVICE_UNAVAILABLE') {
            Logger.getLogger('awp').error('Access API result/service unavailable: ' + result);
            return result;
        }

        return {
            error: false,
            redirectUrl: result.object.url,
            response: result.object
        };

    } catch (ex) {
        Logger.getLogger('awp').error('Access API exception: ' + ex);
        return null;
    }
}

module.exports = {
    serviceCall: serviceCall
};
