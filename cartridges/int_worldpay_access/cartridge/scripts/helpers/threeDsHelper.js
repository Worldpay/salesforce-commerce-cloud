/* global session */

'use strict';

const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const Logger = require('dw/system/Logger');

/**
 * Gets the normalized outcome/status string from a Payments API response
 * @param {Object} result - The result object from the Payments API
 * @returns {string} The outcome/status string
 */
function getPaymentsOutcome(result) {
    if (!result || result.error) return '';

    const body = result.object || result.raw || result.response || null;
    if (!body) return '';

    const raw =
        (body.outcome && (body.outcome.paymentStatus || body.outcome.status)) ||
        body.outcome ||
        body.paymentStatus ||
        body.status ||
        body.lastEvent ||
        '';

    return raw ? String(raw) : '';
}

/**
 * Normalizes an outcome string for comparison
 * @param {string} outcome - The outcome string
 * @returns {string} Normalized outcome
 */
function normalizeOutcome(outcome) {
    return outcome ? String(outcome).replace(/[^a-z0-9]/gi, '').toLowerCase() : '';
}

/**
 * Checks if outcome indicates 3DS device data required
 * @param {Object} result - The Payments API result
 * @returns {boolean} True if 3DS DDC is required
 */
function isThreeDsDeviceDataRequired(result) {
    const out = normalizeOutcome(getPaymentsOutcome(result));
    return out === '3dsdevicedatarequired';
}

/**
 * Checks if outcome indicates 3DS challenge required
 * @param {Object} result - The Payments API result
 * @returns {boolean} True if 3DS challenge is required
 */
function isThreeDsChallenged(result) {
    const out = normalizeOutcome(getPaymentsOutcome(result));
    return out === '3dschallenged';
}

/**
 * Gets the 3DS outcome from a Payments API response
 * @param {Object} result - The Payments API result
 * @returns {string} The 3DS outcome
 */
function getThreeDsOutcome(result) {
    if (!result || result.error) return '';
    const body = result.object || result.raw || result.response || null;
    if (!body || !body.threeDS) return '';
    return body.threeDS.outcome ? String(body.threeDS.outcome) : '';
}

/**
 * Determines if a 3DS outcome should block order placement
 * @param {Object} result - The Payments API result
 * @returns {boolean} True if the 3DS outcome is a hard failure
 */
function isThreeDsHardFailure(result) {
    const out = normalizeOutcome(getThreeDsOutcome(result));
    if (!out) return false;

    const hardFail = {
        authenticationfailed: true,
        failed: true,
        notauthenticated: true,
        challengefailed: true,
        authenticationrejected: true
    };

    return !!hardFail[out];
}

/**
 * Determines if a 3DS outcome can proceed (soft outcomes require authorization)
 * @param {Object} result - The Payments API result
 * @param {Function} isPaymentsApiOutcomeOk - Outcome OK checker
 * @returns {boolean} True if outcome allows proceed
 */
function isThreeDsOutcomeAllowed(result, isPaymentsApiOutcomeOk) {
    const out = normalizeOutcome(getThreeDsOutcome(result));
    if (!out) return true;

    const ok = { authenticated: true, bypassed: true };
    const soft = { authenticationoutage: true };

    if (out === 'authenticationunavailable') return false;

    if (ok[out]) return true;
    if (soft[out]) return isPaymentsApiOutcomeOk(result);
    if (isThreeDsHardFailure(result)) return false;

    return isPaymentsApiOutcomeOk(result);
}

/**
 * Determines if a 3DS response indicates a negative outcome
 * @param {Object} result - The Payments API result
 * @param {Function} isPaymentsApiOutcomeOk - Outcome OK checker
 * @returns {boolean} True if 3DS failed
 */
function isThreeDsNegative(result, isPaymentsApiOutcomeOk) {
    if (isThreeDsDeviceDataRequired(result) || isThreeDsChallenged(result)) return false;

    const threeOut = normalizeOutcome(getThreeDsOutcome(result));
    if (threeOut) {
        return !isThreeDsOutcomeAllowed(result, isPaymentsApiOutcomeOk);
    }

    const out = normalizeOutcome(getPaymentsOutcome(result));
    const hard = {
        '3dsfailed': true,
        '3dsauthenticationfailed': true,
        '3dsnotauthenticated': true,
        '3dschallengefailed': true,
        '3dsauthenticationrejected': true,
        '3dsunavailable': true
    };

    return !!hard[out];
}

/**
 * Reads 3DS device data from session
 * @returns {Object|null} Parsed device data or null
 */
function readThreeDsDeviceDataFromSession() {
    if (!session.privacy.awp3dsDeviceData) return null;
    try {
        return JSON.parse(session.privacy.awp3dsDeviceData);
    } catch (e) {
        Logger.getLogger('awp').error('readThreeDsDeviceDataFromSession parse error: {0}', e);
        return null;
    }
}

/**
 * Builds 3DS device data payload using session data and request headers
 * @param {dw.system.Request} req - The request object
 * @returns {Object|null} Device data payload
 */
function buildThreeDsDeviceData(req) {
    const sessionData = readThreeDsDeviceDataFromSession() || {};
    const data = {};

    if (sessionData.browserLanguage) data.browserLanguage = String(sessionData.browserLanguage);
    if (sessionData.browserScreenHeight) data.browserScreenHeight = Number(sessionData.browserScreenHeight);
    if (sessionData.browserScreenWidth) data.browserScreenWidth = Number(sessionData.browserScreenWidth);
    if (sessionData.browserColorDepth) data.browserColorDepth = String(sessionData.browserColorDepth);
    if (sessionData.timeZone || sessionData.timeZone === 0) data.timeZone = String(sessionData.timeZone);
    if (sessionData.browserJavaEnabled !== undefined) data.browserJavaEnabled = !!sessionData.browserJavaEnabled;
    if (sessionData.browserJavascriptEnabled !== undefined) data.browserJavascriptEnabled = !!sessionData.browserJavascriptEnabled;

    if (sessionData.channel) {
        data.channel = String(sessionData.channel);
    } else {
        data.channel = 'browser';
    }

    try {
        const accept = req.httpHeaders && req.httpHeaders.get('accept');
        if (accept) data.acceptHeader = String(accept);
    } catch (e) {
        Logger.getLogger('awp').error('buildThreeDsDeviceData accept header error: {0}', e);
    }

    try {
        const ua = req.httpHeaders && (req.httpHeaders.get('user-agent') || req.httpHeaders.get('User-Agent'));
        if (ua) data.userAgentHeader = String(ua);
    } catch (e) {
        Logger.getLogger('awp').error('buildThreeDsDeviceData user-agent error: {0}', e);
    }

    return Object.keys(data).length ? data : null;
}

/**
 * Extracts origin from a URL string
 * @param {string} url - The URL
 * @returns {string} Origin (scheme + host)
 */
function getOriginFromUrl(url) {
    if (!url) return '';
    const m = String(url).match(/^(https?:\/\/[^/]+)/i);
    return m ? m[1] : '';
}

/**
 * Clears 3DS session data
 */
function clearThreeDsSession() {
    session.privacy.awp3dsOrderNo = null;
    session.privacy.awp3dsSupplyHref = null;
    session.privacy.awp3dsDdc = null;
    session.privacy.awp3dsChallenge = null;
    session.privacy.awp3dsCompleteHref = null;
}

/**
 * Handles initial 3DS response for Checkout SDK payment
 * @param {Object} params - Parameters
 * @returns {boolean} True if response was handled
 */
function handleCheckoutSdkThreeDsResponse(params) {
    const payRes = params.payRes;
    const order = params.order;
    const orderNo = params.orderNo;
    const res = params.res;
    const isPaymentsApiOutcomeOk = params.isPaymentsApiOutcomeOk;
    let body = null;

    if (isThreeDsDeviceDataRequired(payRes)) {
        body = payRes.object || payRes.raw || payRes.response || {};
        const ddc = body.deviceDataCollection || {};
        const supplyAction = body._actions && body._actions.supply3dsDeviceData;
        const supplyHref = supplyAction && supplyAction.href ? String(supplyAction.href) : '';

        if (!ddc || !ddc.jwt || !ddc.url || !ddc.bin || !supplyHref) {
            Logger.getLogger('awp').error('AWPRedirect: 3DS DDC required but missing data for order {0}', orderNo);
            clearThreeDsSession();
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', '3DS device data missing'));
            return true;
        }

        session.privacy.awp3dsOrderNo = order.orderNo;
        session.privacy.awp3dsSupplyHref = supplyHref;
        session.privacy.awp3dsDdc = JSON.stringify({
            jwt: String(ddc.jwt),
            url: String(ddc.url),
            bin: String(ddc.bin),
            origin: getOriginFromUrl(String(ddc.url))
        });

        res.render('checkout/3dsDeviceData', {
            ddcFormUrl: URLUtils.https('AWPCheckoutServices-ThreeDSDeviceDataForm', 'orderNo', order.orderNo).toString(),
            supplyUrl: URLUtils.https('AWPCheckoutServices-Supply3dsDeviceData', 'orderNo', order.orderNo).toString(),
            ddcOrigin: getOriginFromUrl(String(ddc.url))
        });
        return true;
    }

    if (isThreeDsChallenged(payRes)) {
        body = payRes.object || payRes.raw || payRes.response || {};
        const ch = body.challenge || {};
        const completeAction = body._actions && body._actions.complete3dsChallenge;
        const completeHref = completeAction && completeAction.href ? String(completeAction.href) : '';

        if (!ch || !ch.url || !ch.jwt || !completeHref) {
            Logger.getLogger('awp').error('AWPRedirect: 3DS challenge required but missing data for order {0}', orderNo);
            clearThreeDsSession();
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', '3DS challenge missing'));
            return true;
        }

        session.privacy.awp3dsOrderNo = order.orderNo;
        session.privacy.awp3dsChallenge = JSON.stringify({
            url: String(ch.url),
            jwt: String(ch.jwt),
            reference: ch.reference ? String(ch.reference) : '',
            origin: getOriginFromUrl(String(ch.url))
        });
        session.privacy.awp3dsCompleteHref = completeHref;

        res.render('checkout/3dsChallenge', {
            challengeFormUrl: URLUtils.https('AWPCheckoutServices-ThreeDSChallengeForm', 'orderNo', order.orderNo).toString()
        });
        return true;
    }

    if (!isPaymentsApiOutcomeOk(payRes) || isThreeDsNegative(payRes, isPaymentsApiOutcomeOk)) {
        Logger.getLogger('awp').error('AWPRedirect: CheckoutSDK payment failed for order {0}', orderNo);
        clearThreeDsSession();
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', '3DS authentication failed'));
        return true;
    }

    return false;
}

module.exports = {
    getPaymentsOutcome: getPaymentsOutcome,
    normalizeOutcome: normalizeOutcome,
    isThreeDsDeviceDataRequired: isThreeDsDeviceDataRequired,
    isThreeDsChallenged: isThreeDsChallenged,
    getThreeDsOutcome: getThreeDsOutcome,
    isThreeDsHardFailure: isThreeDsHardFailure,
    isThreeDsOutcomeAllowed: isThreeDsOutcomeAllowed,
    isThreeDsNegative: isThreeDsNegative,
    readThreeDsDeviceDataFromSession: readThreeDsDeviceDataFromSession,
    buildThreeDsDeviceData: buildThreeDsDeviceData,
    getOriginFromUrl: getOriginFromUrl,
    clearThreeDsSession: clearThreeDsSession,
    handleCheckoutSdkThreeDsResponse: handleCheckoutSdkThreeDsResponse
};
