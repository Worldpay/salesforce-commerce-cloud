'use strict';

const Site = require('dw/system/Site');
const URLUtils = require('dw/web/URLUtils');
const Logger = require('dw/system/Logger');

const riskDataHelper = require('*/cartridge/scripts/service/riskDataHelper');

/**
 * Adds create token information for logged-in customers to the payload.
 * @param {dw.order.Order} order - Current order
 * @param {Object} payload - The payload object to modify
 * @param {Object} token - The saved payment token if it exists.
 * @returns {Object} - Updated payload object
 */
function addCreateTokenForLoggedIn(order, payload, token) {
    try {
        const customer = order.getCustomer && order.getCustomer();
        const profile  = customer && customer.getProfile ? customer.getProfile() : null;
        if (!profile) return payload;

        const namespace = 'cust-' + profile.getCustomerNo();

        let updatedPayload = Object.assign({}, payload);

        updatedPayload.customerAgreement = {
            type: 'cardOnFile',
            storedCardUsage: 'first'
        };

        updatedPayload.createToken = {
            type: 'worldpay',
            namespace: namespace,
            description: 'Default card ' + (profile.getEmail() || ''),
            optIn: 'Ask'
        };

        if (token && token.tokenHref) {
            let href = token.tokenHref;
            updatedPayload.paymentInstrument = {
                type: 'card/tokenized',
                href: href
            };
            updatedPayload.customerAgreement = {
                type: 'cardOnFile',
                storedCardUsage: 'subsequent'
            };

            if (updatedPayload.createToken) delete updatedPayload.createToken;
        }

        return updatedPayload;
    } catch (e) {
        Logger.getLogger('awp').error('addCreateTokenForLoggedIn error: {0}', e);
    }
    return payload;
}

/**
 * Creates the JSON request
 * @param {dw.order.Order} order - Current order
 * @param {Object} billingData - Billing data
 * @param {Object} token - The saved payment token if it exists.
 * @returns {Object} - JSON payload
 */
function build(order, billingData, token) {
    const merchantEntity = Site.getCurrent().getCustomPreferenceValue('MerchantEntity');
    const narrative = Site.getCurrent().getCustomPreferenceValue('Narrative');
    const showCardIcons = Site.getCurrent().getCustomPreferenceValue('HPPShowCardIcons');
    const showCardOwner = Site.getCurrent().getCustomPreferenceValue('HPPShowCardholderName');
    const showChangePayment = Site.getCurrent().getCustomPreferenceValue('HPPShowChangePaymentMethodButton');

    const threeDs = Site.getCurrent().getCustomPreferenceValue('EnableThreeDs');
    const enabledSaveCards = Site.getCurrent().getCustomPreferenceValue('EnableSaveCards');
    const enabledAutoCapture = Site.getCurrent().getCustomPreferenceValue('EnableAutoCapture');

    let payload = {
        transactionReference: order.orderNo,
        description: 'Test Payment SFCC ' + order.orderNo,
        merchant: merchantEntity,
        narrative: narrative,
        settlement: {
            auto: enabledAutoCapture
        },
        hostedProperties: {
            showCardIcons: showCardIcons,
            showCardholderName: showCardOwner,
            showChangePaymentMethodButton: showChangePayment
        },
        value: {
            currency: order.getCurrencyCode(),
            amount: Math.round(order.totalGrossPrice.value * 100)
        },
        resultURLs: {
            successURL: URLUtils.https('AWPResult-Success', 'orderNo', order.orderNo, 'token', order.getOrderToken()).toString(),
            cancelURL: URLUtils.https('AWPResult-Cancel', 'orderNo', order.orderNo, 'token', order.getOrderToken()).toString(),
            errorURL: URLUtils.https('AWPResult-Error', 'orderNo', order.orderNo, 'token', order.getOrderToken()).toString(),
            expiryURL: URLUtils.https('AWPResult-Expiry', 'orderNo', order.orderNo, 'token', order.getOrderToken()).toString(),
            failureURL: URLUtils.https('AWPResult-Failure', 'orderNo', order.orderNo, 'token', order.getOrderToken()).toString(),
            pendingURL: URLUtils.https('AWPResult-Pending', 'orderNo', order.orderNo, 'token', order.getOrderToken()).toString()
        }
    };

    if (!threeDs) {
        payload.threeDS = { type: threeDs };
    }

    if (enabledSaveCards) {
        payload = addCreateTokenForLoggedIn(order, payload, token);
    }
    
    payload.riskData = riskDataHelper.buildRiskData(order);

    /**
     * Returns the value of the input if it exists, otherwise returns the input itself.
     * @param {Object} x - The input object to check.
     * @returns {any} - The value of the input object or the input itself.
     */
    function val(x) { return x && (x.value !== undefined ? x.value : x); }

    const bd = (billingData && billingData.address) ? billingData.address : null;

    if (bd) {
        payload.billingAddress = {
            firstName: val(bd.firstName) || '',
            lastName: val(bd.lastName) || '',
            address1: val(bd.address1) || '',
            address2: val(bd.address2) || '',
            city: val(bd.city) || '',
            postalCode: val(bd.postalCode) || '',
            countryCode: val(bd.countryCode) || '',
            state: val(bd.stateCode) || ''
        };
    }

    return payload;
}

module.exports = {
    build: build
};
