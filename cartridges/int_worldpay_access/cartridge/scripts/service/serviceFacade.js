/* eslint-disable no-underscore-dangle */

'use strict';

const utils = require('*/cartridge/scripts/common/utils');
const Logger = require('dw/system/Logger');
const ServiceRegistry = require('dw/svc/LocalServiceRegistry');
const Encoding = require('dw/crypto/Encoding');
const Bytes = require('dw/util/Bytes');
const Site = require('dw/system/Site');

/**
 * Authorizes an order service.
 *
 * @param {Object} order - The order object.
 * @param {Object} billingData - Billing data.
 * @param {Object} token - The saved payment token if it exists.
 * @returns {Object} The response from the service call.
 */
function authorizeOrderService(order, billingData, token) {
    const buildPayload = require('*/cartridge/scripts/common/buildPayload');

    try {
        if (!order) {
            Logger.getLogger('awp').error('authorizeOrderService: Missing order');
            return { error: true };
        }

        const payload = buildPayload.build(order, billingData, token);
        Logger.getLogger('awp').info('payload: {0}', JSON.stringify(payload));
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

                svc.addHeader(
                    'Accept',
                    'application/vnd.worldpay.payment-queries-v1.hal+json'
                );
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

                    text:
                        params && params.mockResponse
                            ? JSON.stringify(params.mockResponse)
                            : null
                };
            }
        }
    );
}

// eslint-disable-next-line require-jsdoc
function queryPaymentStatus(orderNo) {
    const entity = Site.getCurrent().getCustomPreferenceValue('MerchantEntity');
    const svc = createGetSvc();

    const query = '/paymentQueries/payments?transactionReference=' + encodeURIComponent(orderNo) +
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
    queryPaymentStatus: queryPaymentStatus,
    createGetSvc: createGetSvc
};
