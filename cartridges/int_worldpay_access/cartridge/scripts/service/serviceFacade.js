/* eslint-disable no-underscore-dangle */

'use strict';

const utils = require('*/cartridge/scripts/common/utils');
const Logger = require('dw/system/Logger');
const ServiceRegistry = require('dw/svc/LocalServiceRegistry');
const Encoding = require('dw/crypto/Encoding');
const Bytes = require('dw/util/Bytes');
const Site = require('dw/system/Site');
const Transaction = require('dw/system/Transaction');

/**
 * Authorizes an order using the Worldpay HPP service
 * @param {dw.order.Order} order - The order to authorize
 * @param {Object} billingData - Billing data for the payment
 * @param {string} token - Payment token
 * @returns {Object} - Returns result object with error flag and redirectUrl or response
 */
function authorizeOrderService(order, billingData, token) {
    const buildPayload = require('*/cartridge/scripts/common/buildPayload');

    try {
        if (!order) {
            Logger.getLogger('awp').error('authorizeOrderService: Missing order');
            return { error: true };
        }

        const payload = buildPayload.build(order, billingData, token);
        if (payload && payload.transactionReference && order.custom) {
            var orderRef = order;
            Transaction.wrap(function () {
                orderRef.custom.latestTransactionReference = String(payload.transactionReference);
            });
        }

        const result = utils.serviceCall(payload);

        if (!result || result.error || !result.redirectUrl) {
            Logger.getLogger('awp').error('authorizeOrderService: Invalid or missing response');
            return { error: true, response: result && result.object };
        }

        return result;
    } catch (e) {
        Logger.getLogger('awp').error('authorizeOrderService Exception: ' + e.toString());
        return { error: true };
    }
}

/**
 * Authorizes a payment using the Worldpay Checkout SDK
 * @param {dw.order.Order} order - The order to authorize
 * @param {Object} billingData - Billing data for the payment
 * @param {Object} opts - Options object containing sessionHref
 * @returns {Object} - Returns result object with error flag and response
 */
function authorizeCheckoutSdkPayment(order, billingData, opts) {
    const buildPayload = require('*/cartridge/scripts/common/buildPayload');

    try {
        if (!order) {
            Logger.getLogger('awp').error('authorizeCheckoutSdkPayment: Missing order');
            return { error: true };
        }

        const sessionHref = opts && opts.sessionHref ? String(opts.sessionHref) : '';
        const tokenHref = opts && opts.tokenHref ? String(opts.tokenHref) : '';
        if (!sessionHref && !tokenHref) {
            Logger.getLogger('awp').error('authorizeCheckoutSdkPayment: Missing sessionHref/tokenHref for order {0}', order.orderNo);
            return { error: true };
        }

        const payload = buildPayload.build(order, billingData, null, Object.assign({
            flow: 'CHECKOUTSDK',
            sessionHref: sessionHref,
            tokenHref: tokenHref
        }, opts || {}));

        if (payload && payload.transactionReference && order.custom) {
            var orderRef = order;
            Transaction.wrap(function () {
                orderRef.custom.latestTransactionReference = String(payload.transactionReference);
            });
        }

        const result = utils.serviceCallPayments(payload);

        if (!result || result.error) {
            Logger.getLogger('awp').error('authorizeCheckoutSdkPayment: Invalid or error response');
            return { error: true, response: result && result.object };
        }

        return result;
    } catch (e) {
        Logger.getLogger('awp').error('authorizeCheckoutSdkPayment Exception: ' + e.toString());
        return { error: true };
    }
}

/**
 * Posts to a Payments API action href
 * @param {string} href - The action href
 * @param {Object|null} payload - Optional payload
 * @returns {Object} Response object
 */
function postPaymentsAction(href, payload) {
    const wpApiVersion = Site.getCurrent().getCustomPreferenceValue('WPApiVersion') || '2024-06-01';
    try {
        const service = ServiceRegistry.createService('worldpay_access.http.worldpay.payments.post', {
            createRequest: function (svc, args) {
                svc.setRequestMethod('POST');

                const cred = svc.getConfiguration().getCredential();
                const rawAuth = cred.getUser() + ':' + cred.getPassword();
                const encoded = Encoding.toBase64(new Bytes(rawAuth, 'UTF-8'));
                svc.addHeader('Authorization', 'Basic ' + encoded);
                svc.addHeader('Content-Type', 'application/json');
                svc.addHeader('Accept', 'application/json');
                svc.addHeader('WP-Api-Version', wpApiVersion);

                svc.setURL(String(args.href));

                if (!args.payload || (typeof args.payload === 'object' && !Object.keys(args.payload).length)) {
                    return null;
                }
                return JSON.stringify(args.payload);
            },
            parseResponse: function (svc, client) {
                let parsed = null;
                try {
                    parsed = client.text ? JSON.parse(client.text) : null;
                } catch (e) {
                    Logger.getLogger('awp').error('postPaymentsAction parse error: {0}', e);
                }
                return {
                    statusCode: client.statusCode,
                    body: parsed,
                    rawText: client.text
                };
            }
        });

        const result = service.call({ href: href, payload: payload || null });

        if (!result || result.status === 'SERVICE_UNAVAILABLE') {
            Logger.getLogger('awp').error('PAYMENTS ACTION: Service unavailable: {0}', result);
            return { error: true, response: result };
        }

        const obj = result.object || {};
        const body = obj.body || null;
        const okHttp = obj.statusCode >= 200 && obj.statusCode < 300;
        const ok = !!result.ok && okHttp;

        if (!ok) {
            Logger.getLogger('awp').error(
                'PAYMENTS ACTION: call failed. ok={0} http={1} statusCode={2} raw={3}',
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
    } catch (e) {
        Logger.getLogger('awp').error('PAYMENTS ACTION exception: {0}', e);
        return { error: true };
    }
}

/**
 * Supplies 3DS device data collection reference
 * @param {string} href - The action href
 * @param {Object} payload - Payload containing collectionReference
 * @returns {Object} Response object
 */
function supply3dsDeviceData(href, payload) {
    return postPaymentsAction(href, payload || null);
}

/**
 * Completes a 3DS challenge
 * @param {string} href - The action href
 * @returns {Object} Response object
 */
function complete3dsChallenge(href) {
    return postPaymentsAction(href, null);
}

// eslint-disable-next-line require-jsdoc
function createGetSvc(params) {
    return ServiceRegistry.createService(
        'worldpay_access.http.worldpay.paymentQueries.get',
        {
            createRequest: function (svc, args) {
                const cred = svc.getConfiguration().getCredential();

                const base = cred.getURL().replace(/\/+$/, '');

                const path = args && args.path ? String(args.path) : '';
                let url;

                if (/^https?:\/\//i.test(path)) {
                    url = path;
                } else {
                    if (path.charAt(0) !== '/') path = '/' + path;
                    url = base + path;
                }

                svc.setRequestMethod('GET');
                svc.setURL(url);

                const rawAuth = cred.getUser() + ':' + cred.getPassword();
                const encoded = Encoding.toBase64(new Bytes(rawAuth, 'UTF-8'));
                svc.addHeader('Authorization', 'Basic ' + encoded);

                svc.addHeader('Accept', 'application/vnd.worldpay.payment-queries-v1.hal+json');
                svc.addHeader('WP-Api-Version', '2024-06-01');

                return null;
            },
            parseResponse: function (svc, client) {
                let body = null;
                try {
                    body = client.text ? JSON.parse(client.text) : null;
                } catch (e) {
                    Logger.getLogger('awp').error('createGetSvc: error={0}', e);
                }
                return { code: client.statusCode, body: body };
            },
            mockCall: function () {
                return {
                    statusCode: 200,
                    statusMessage: 'OK',
                    text: params && params.mockResponse ? JSON.stringify(params.mockResponse) : null
                };
            }
        }
    );
}

// eslint-disable-next-line require-jsdoc
function queryPaymentStatus(transactionReference) {
    const entity = Site.getCurrent().getCustomPreferenceValue('MerchantEntity');
    const svc = createGetSvc();

    const txRef = transactionReference ? String(transactionReference) : '';
    const query = '/paymentQueries/payments?transactionReference=' + encodeURIComponent(txRef) +
        (entity ? '&entityReference=' + encodeURIComponent(entity) : '');
    const listRes = svc.call({ path: query });

    if (!listRes.ok) return { error: true };

    const list = listRes.object && listRes.object.body &&
        listRes.object.body._embedded && listRes.object.body._embedded.payments;

    if (!list || !list.length) {
        return { error: false, status: null, raw: listRes.object ? listRes.object.body : null };
    }

    const selfLink = list[0] && list[0]._links && list[0]._links.self && list[0]._links.self.href;
    if (!selfLink) {
        const fallback = (list[0].issuer && list[0].issuer.authorizationCode) ? 'AUTHORIZED' : null;
        return { error: false, status: fallback, raw: listRes.object ? listRes.object.body : null };
    }

    const detRes = svc.call({ path: selfLink });

    if (!detRes.ok) {
        const fb = (list[0].issuer && list[0].issuer.authorizationCode) ? 'AUTHORIZED' : null;
        return { error: false, status: fb, raw: listRes.object ? listRes.object.body : null };
    }

    const det = detRes.object && detRes.object.body;

    const status =
        (det && det.outcome && (det.outcome.paymentStatus || det.outcome.status)) ||
        (det && (det.paymentStatus || det.status || det.lastEvent)) ||
        (det && det.issuer && det.issuer.authorizationCode ? 'AUTHORIZED' : null);

    return { error: false, status: status, raw: det || null };
}

module.exports = {
    authorizeOrderService: authorizeOrderService,
    authorizeCheckoutSdkPayment: authorizeCheckoutSdkPayment,
    supply3dsDeviceData: supply3dsDeviceData,
    complete3dsChallenge: complete3dsChallenge,
    queryPaymentStatus: queryPaymentStatus,
    createGetSvc: createGetSvc
};