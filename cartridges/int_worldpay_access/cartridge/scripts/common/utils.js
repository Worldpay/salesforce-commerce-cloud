/* eslint-disable no-underscore-dangle */

'use strict';

const Logger = require('dw/system/Logger');
const Site = require('dw/system/Site');
const ServiceRegistry = require('dw/svc/LocalServiceRegistry');
const Encoding = require('dw/crypto/Encoding');
const Bytes = require('dw/util/Bytes');
const UUIDUtils = require('dw/util/UUIDUtils');

/**
 * Builds a Basic Authentication header from credentials
 * @param {Object} cred - Service credential object
 * @returns {string} Basic auth header string
 */
function buildBasicAuthHeader(cred) {
    const rawAuth = cred.getUser() + ':' + cred.getPassword();
    const encodedAuth = Encoding.toBase64(new Bytes(rawAuth, 'UTF-8'));
    return 'Basic ' + encodedAuth;
}

/**
 * Safely parses JSON text without throwing errors
 * @param {string} text - The JSON string to parse
 * @returns {Object|null} Parsed object or null if parsing fails
 */
function safeJsonParse(text) {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
}

/**
 * Calls the Worldpay payment pages service (HPP)
 * @param {Object} payload - The payment request payload
 * @returns {Object} Response object containing error status, redirectUrl, response body and statusCode
 */
function serviceCall(payload) {
    const wpApiVersion = Site.getCurrent().getCustomPreferenceValue('WPApiVersion');

    try {
        const service = ServiceRegistry.createService('worldpay_access.http.worldpay.payment.post', {
            createRequest: function (svc, args) {
                svc.setRequestMethod('POST');

                const cred = svc.getConfiguration().getCredential();
                const baseUrl = cred.getURL().replace(/\/+$/, '');
                svc.setURL(baseUrl + '/payment_pages');

                const userAgent = require('*/cartridge/scripts/helpers/serviceHelper').getUserAgentHeader(svc.getURL());

                svc.addHeader('Authorization', buildBasicAuthHeader(cred));
                svc.addHeader('Content-Type', 'application/vnd.worldpay.payment_pages-v1.hal+json');
                svc.addHeader('Accept', 'application/vnd.worldpay.payment_pages-v1.hal+json');
                svc.addHeader('User-Agent', userAgent);
                svc.addHeader('WP-Api-Version', wpApiVersion);

                return JSON.stringify(args);
            },

            parseResponse: function (svc, client) {
                const parsed = safeJsonParse(client.text);
                if (!parsed) {
                    Logger.getLogger('awp').error('HPP: Invalid JSON response. status={0}', client.statusCode);
                }
                return {
                    statusCode: client.statusCode,
                    body: parsed,
                    rawText: client.text
                };
            },

            filterLogMessage: function (msg) {
                if (!msg) return msg;
                try {
                    const str = typeof msg === 'string' ? msg : JSON.stringify(msg);
                    return str
                        .replace(/"cardNumber"\s*:\s*"\d+"/g, '"cardNumber":"****"')
                        .replace(/"cvc"\s*:\s*"\d+"/g, '"cvc":"***"');
                } catch (e) {
                    return msg;
                }
            }
        });

        const result = service.call(payload);

        if (!result || result.status === 'SERVICE_UNAVAILABLE') {
            Logger.getLogger('awp').error('HPP: Service unavailable: {0}', result);
            return { error: true, response: result };
        }

        const obj = result.object || {};
        const body = obj.body || null;

        const redirectUrl = (body && body.url) || (result.object && result.object.url) || null;

        return {
            error: !result.ok || !redirectUrl,
            redirectUrl: redirectUrl,
            response: body || result.object || null,
            statusCode: obj.statusCode || null
        };
    } catch (ex) {
        Logger.getLogger('awp').error('HPP exception: {0}', ex);
        return { error: true };
    }
}

/**
 * Calls the Worldpay payments API service
 * @param {Object} payload - The payment request payload
 * @returns {Object} Response object containing error status, statusCode, object body and rawText
 */
function serviceCallPayments(payload) {
    const wpApiVersion = Site.getCurrent().getCustomPreferenceValue('WPApiVersion') || '2024-06-01';

    try {
        const service = ServiceRegistry.createService('worldpay_access.http.worldpay.payments.post', {
            createRequest: function (svc, args) {
                svc.setRequestMethod('POST');

                const cred = svc.getConfiguration().getCredential();
                const baseUrl = cred.getURL().replace(/\/+$/, '');
                svc.setURL(baseUrl + '/api/payments');

                const userAgent = require('*/cartridge/scripts/helpers/serviceHelper').getUserAgentHeader(svc.getURL());

                svc.addHeader('Authorization', buildBasicAuthHeader(cred));
                svc.addHeader('Content-Type', 'application/json');
                svc.addHeader('Accept', 'application/json');
                svc.addHeader('User-Agent', userAgent);
                svc.addHeader('WP-Api-Version', wpApiVersion);

                return JSON.stringify(args);
            },

            parseResponse: function (svc, client) {
                const parsed = safeJsonParse(client.text);

                return {
                    statusCode: client.statusCode,
                    body: parsed,
                    rawText: client.text
                };
            },

            filterLogMessage: function (msg) {
                if (!msg) return msg;
                try {
                    const str = typeof msg === 'string' ? msg : JSON.stringify(msg);

                    return str
                        .replace(/"cardNumber"\s*:\s*"\d+"/g, '"cardNumber":"****"')
                        .replace(/"cvc"\s*:\s*"\d+"/g, '"cvc":"***"')
                        .replace(/"cvv"\s*:\s*"\d+"/g, '"cvv":"***"');
                } catch (e) {
                    return msg;
                }
            }
        });

        const result = service.call(payload);

        if (!result || result.status === 'SERVICE_UNAVAILABLE') {
            Logger.getLogger('awp').error('PAYMENTS: Service unavailable: {0}', result);
            return { error: true, response: result };
        }

        const obj = result.object || {};
        const body = obj.body || null;

        const okHttp = obj.statusCode >= 200 && obj.statusCode < 300;
        const ok = !!result.ok && okHttp && body;

        if (!ok) {
            Logger.getLogger('awp').error(
                'PAYMENTS: call failed. ok={0} http={1} statusCode={2} raw={3}',
                result.ok,
                okHttp,
                obj.statusCode,
                obj.rawText
            );
            return {
                error: true,
                statusCode: obj.statusCode,
                object: body,
                rawText: obj.rawText
            };
        }

        return {
            error: false,
            statusCode: obj.statusCode,
            object: body,
            rawText: obj.rawText
        };
    } catch (ex) {
        Logger.getLogger('awp').error('PAYMENTS exception: {0}', ex);
        return { error: true };
    }
}

/**
 * Builds a unique transaction reference using UUID-orderNo format
 * @param {string} orderNo - Order number
 * @param {Object} [opts] - Optional config
 * @param {string} [opts.prefix] - Optional prefix (e.g., recurring)
 * @param {string|number} [opts.suffix] - Optional suffix
 * @returns {string} Transaction reference
 */
function buildTransactionReference(orderNo, opts) {
    var uuid = UUIDUtils.createUUID();
    var base = uuid + '-' + String(orderNo || '');
    if (opts && opts.prefix) {
        base = String(opts.prefix) + '-' + base;
    }
    if (opts && opts.suffix !== undefined && opts.suffix !== null && String(opts.suffix)) {
        base = base + '-' + String(opts.suffix);
    }
    return base;
}

/**
 * Extracts orderNo from transaction reference formatted as UUID-orderNo
 * Supports optional prefix (e.g., recurring-) and suffix.
 * @param {string} transactionReference - Reference from Worldpay
 * @returns {string|null} orderNo if resolved
 */
function extractOrderNoFromTransactionReference(transactionReference) {
    if (!transactionReference) return null;
    var ref = String(transactionReference);
    if (ref.indexOf('recurring-') === 0) {
        ref = ref.substring('recurring-'.length);
    }
    var uuidRe = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})-(.+)$/;
    var match = ref.match(uuidRe);
    if (match && match[2]) {
        return String(match[2]).split('-')[0] || null;
    }
    return ref || null;
}

module.exports = {
    serviceCall: serviceCall,
    serviceCallPayments: serviceCallPayments,
    buildTransactionReference: buildTransactionReference,
    extractOrderNoFromTransactionReference: extractOrderNoFromTransactionReference
};