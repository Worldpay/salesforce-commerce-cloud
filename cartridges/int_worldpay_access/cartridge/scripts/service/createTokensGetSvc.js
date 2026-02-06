'use strict';

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const Bytes = require('dw/util/Bytes');
const Encoding = require('dw/crypto/Encoding');
const Logger = require('dw/system/Logger');

/**
 * Generates an authorization header for Basic authentication.
 *
 * @param {Object} cred - The credentials object containing user and password.
 * @returns {string} The Basic authorization header.
 */
function authHeader(cred) {
    const raw = cred.getUser() + ':' + cred.getPassword();
    const b64 = Encoding.toBase64(new Bytes(raw, 'UTF-8'));
    return 'Basic ' + b64;
}

/**
 * Creates a service for retrieving tokens from Worldpay.
 *
 * @returns {Object} The service instance for token retrieval.
 */
function createTokensGetSvc() {
    return LocalServiceRegistry.createService('worldpay_access.http.tokens.get', {
        createRequest: function (svc, args) {
            const cred = svc.getConfiguration().getCredential();
            const base = cred.getURL().replace(/\/+$/, '');
            let path = args.path;
            if (path.charAt(0) !== '/') path = '/' + path;

            svc.setRequestMethod('GET');
            svc.setURL(base + path);
            Logger.getLogger('awp').info('createTokensGetSvc: url={0}', base + path);
            svc.addHeader('Authorization', authHeader(cred));
            svc.addHeader('Accept', 'application/vnd.worldpay.tokens-v3.hal+json');
            svc.addHeader('WP-Api-Version', '2024-06-01');

            return null;
        },
        parseResponse: function (svc, client) {
            let body = null;
            try { 
                body = client.text ? JSON.parse(client.text) : null; 
            } catch (e) { 
                Logger.getLogger('awp').error('createTokensGetSvc: error={0}', e);
            }
            return { code: client.statusCode, body: body };
        }
    });
}

/**
 * Creates a service for deleting tokens from Worldpay.
 *
 * @returns {Object} The service instance for token retrieval.
 */
function deleteTokenDeleteSvc() {
    return LocalServiceRegistry.createService('worldpay_access.http.tokens.delete', {
        createRequest: function (svc, args) {
            const cred = svc.getConfiguration().getCredential();

            const href = args.href || '';
            const url = href;
            Logger.getLogger('awp').info('deleteTokenGetSvc: url={0}', url);
            svc.setRequestMethod('DELETE');
            svc.setURL(url);
            svc.addHeader('Authorization', authHeader(cred));
            svc.addHeader('Accept', 'application/vnd.worldpay.tokens-v3.hal+json');
            return null;
        },
        parseResponse: function (svc, client) {
            let body = null;
            try { 
                body = client.text ? JSON.parse(client.text) : null; 
            } catch (e) { 
                Logger.getLogger('awp').error('deleteTokenGetSvc: error={0}', e);
            }
            return { code: client.statusCode, body: body };
        }
    });
}

module.exports = {
    createTokensGetSvc: createTokensGetSvc,
    deleteTokenDeleteSvc: deleteTokenDeleteSvc
};
