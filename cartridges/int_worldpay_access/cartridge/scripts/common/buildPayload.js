'use strict';

const Site = require('dw/system/Site');
const URLUtils = require('dw/web/URLUtils');
const Logger = require('dw/system/Logger');

const riskDataHelper = require('*/cartridge/scripts/service/riskDataHelper');

/**
 * Adds token creation configuration to the payload for logged-in customers
 * @param {dw.order.Order} order - The order object
 * @param {Object} payload - The payment payload object
 * @param {Object} token - The token object containing tokenHref if available
 * @returns {Object} Updated payload with token creation or tokenized payment instrument
 */
function addCreateTokenForLoggedIn(order, payload, token) {
    try {
        const customer = order.getCustomer && order.getCustomer();
        const profile = customer && customer.getProfile ? customer.getProfile() : null;
        if (!profile) return payload;

        const namespace = 'cust-' + profile.getCustomerNo();

        let updatedPayload = Object.assign({}, payload);

        updatedPayload.customerAgreement = {
            type: order.custom.isRecurring ? 'subscription' : 'cardOnFile',
            storedCardUsage: 'first'
        };

        updatedPayload.createToken = {
            type: 'worldpay',
            namespace: namespace,
            description: 'Default card ' + (profile.getEmail() || ''),
            optIn: order.custom.isRecurring ? 'Silent' : 'Ask'
        };

        if (token && token.tokenHref) {
            const href = token.tokenHref;
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
 * Extracts the value property from an object if it exists, otherwise returns the object itself
 * @param {*} x - The input value or object
 * @returns {*} The extracted value or the original input
 */
function val(x) { return x && (x.value !== undefined ? x.value : x); }

/**
 * Builds the HPP (Hosted Payment Page) payload for Worldpay payment processing
 * @param {dw.order.Order} order - The order object
 * @param {Object} billingData - The billing data object containing address information
 * @param {Object} token - The token object for saved card payments
 * @returns {Object} The HPP payload object
 */
function buildHpp(order, billingData, token) {
    const utils = require('*/cartridge/scripts/common/utils');
    const merchantEntity = Site.getCurrent().getCustomPreferenceValue('MerchantEntity');
    const narrative = Site.getCurrent().getCustomPreferenceValue('Narrative');
    const showCardIcons = Site.getCurrent().getCustomPreferenceValue('HPPShowCardIcons');
    const showCardOwner = Site.getCurrent().getCustomPreferenceValue('HPPShowCardholderName');
    const showChangePayment = Site.getCurrent().getCustomPreferenceValue('HPPShowChangePaymentMethodButton');

    const threeDs = Site.getCurrent().getCustomPreferenceValue('EnableThreeDs');
    const enabledSaveCards = Site.getCurrent().getCustomPreferenceValue('EnableSaveCards');
    const enabledAutoCapture = Site.getCurrent().getCustomPreferenceValue('AutoCapture');
    const enabledFraudSight = Site.getCurrent().getCustomPreferenceValue('EnableFraudSight');

    let payload = {
        transactionReference: utils.buildTransactionReference(order.orderNo),
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
        payload.threeDS = { type: 'disabled' };
    }

    if (!enabledFraudSight) {
        payload.fraud = { type: 'disabled' };
    }

    if (enabledSaveCards) {
        payload = addCreateTokenForLoggedIn(order, payload, token);
    }

    payload.riskData = riskDataHelper.buildRiskData(order);

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

/**
 * Normalizes a phone number by removing all non-digit characters
 * @param {string} phone - The phone number to normalize
 * @returns {string} The normalized phone number containing only digits
 */
function normalizePhone(phone) {
    if (!phone) return '-';
    return String(phone).replace(/\D+/g, '');
}


/**
 * Builds the Checkout SDK payload for Worldpay payment processing
 * @param {dw.order.Order} order - The order object
 * @param {Object} billingData - The billing data object containing address information
 * @param {Object} opts - Options object containing sessionHref and other configuration
 * @returns {Object} The Checkout SDK payload object
 */
function buildCheckoutSdk(order, billingData, opts) {
    const utils = require('*/cartridge/scripts/common/utils');
    const merchantEntity = Site.getCurrent().getCustomPreferenceValue('MerchantEntity');
    const narrative = Site.getCurrent().getCustomPreferenceValue('Narrative');
    const enableThreeDs = !!Site.getCurrent().getCustomPreferenceValue('EnableThreeDs');
    const enableAutoCapture = Site.getCurrent().getCustomPreferenceValue('AutoCapture');

    const sessionHref = opts && opts.sessionHref ? String(opts.sessionHref) : '';

    const payload = {
        transactionReference: utils.buildTransactionReference(order.orderNo),
        merchant: {
            entity: merchantEntity
        },
        instruction: {
            settlement: {
                auto: enableAutoCapture
            },
            method: 'card',
            paymentInstrument: {
                type: 'checkout',
                sessionHref: sessionHref
            },
            narrative: {
                line1: narrative
            },
            value: {
                currency: order.getCurrencyCode(),
                amount: Math.round(order.totalGrossPrice.value * 100)
            }
        }
    };

    if (opts && opts.tokenHref) {
        payload.instruction.paymentInstrument = {
            type: 'token',
            href: String(opts.tokenHref)
        };
        payload.instruction.customerAgreement = {
            type: order.custom.isRecurring ? 'subscription' : 'cardOnFile',
            storedCardUsage: 'subsequent'
        };
    }

    if (opts && opts.fraudSight && opts.fraudSight.enabled) {
        payload.instruction.fraud = {
            type: 'fraudSight',
            silentMode: opts.fraudSight.silentMode
        };
        if (opts.fraudSight.tmxSessionId) {
            payload.instruction.fraud.tmxSessionId = String(opts.fraudSight.tmxSessionId);
        }
    }

    if (opts && opts.cardHolderName) {
        payload.instruction.paymentInstrument.cardHolderName = String(opts.cardHolderName);
    }

    if (opts && opts.customer) {
        payload.instruction.customer = {
            firstName: opts.customer.firstName || '',
            lastName: opts.customer.lastName || '',
            email: opts.customer.email || '',
            phone: normalizePhone(opts.customer.phone) || '-',
            customerId: opts.customer.customerId || 'guest',
            ipAddress: opts.customer.ipAddress || ''
        };
    }

    if (enableThreeDs && opts && opts.threeDS && opts.threeDS.returnUrl) {
        payload.instruction.threeDS = {
            type: 'integrated',
            mode: opts.threeDS.mode || 'always',
            challenge: {
                returnUrl: String(opts.threeDS.returnUrl)
            }
        };

        if (opts.threeDS.challenge && opts.threeDS.challenge.windowSize) {
            payload.instruction.threeDS.challenge.windowSize = String(opts.threeDS.challenge.windowSize);
        }

        if (opts.threeDS.deviceData) {
            payload.instruction.threeDS.deviceData = opts.threeDS.deviceData;
        }
    }

    if (opts && opts.saveCard && opts.customerNo) {
        payload.instruction.customerAgreement = {
            type: order.custom.isRecurring ? 'subscription' : 'cardOnFile',
            storedCardUsage: 'first'
        };
        payload.instruction.tokenCreation = {
            type: 'worldpay'
        };

        if (order.custom.isRecurring) {
            const customer = order.getCustomer && order.getCustomer();
            const profile = customer && customer.getProfile ? customer.getProfile() : null;
            if (profile) {
                payload.instruction.tokenCreation.namespace = 'cust-' + profile.getCustomerNo();
            }
        }
    }

    try {
        const shipment = order.defaultShipment;
        const sa = shipment && shipment.shippingAddress;
        if (sa) {
            payload.instruction.shipping = {
                firstName: sa.firstName || '',
                lastName: sa.lastName || '',
                address: {
                    address1: sa.address1 || '',
                    address2: sa.address2 || '-',
                    city: sa.city || '',
                    postalCode: sa.postalCode || '',
                    state: sa.stateCode || '',
                    countryCode: (sa.countryCode && sa.countryCode.value) ? sa.countryCode.value : (sa.countryCode || '')
                }
            };
        }
    } catch (e) {
        Logger.getLogger('awp').error('buildCheckoutSdk shipping address error: {0}', e);
    }

    const bd = (billingData && billingData.address) ? billingData.address : null;
    if (bd && !(opts && opts.tokenHref)) {
        payload.instruction.paymentInstrument.billingAddress = {
            address1: val(bd.address1) || '',
            address2: val(bd.address2) || '-',
            postalCode: val(bd.postalCode) || '',
            city: val(bd.city) || '',
            state: val(bd.stateCode) || '',
            countryCode: val(bd.countryCode) || ''
        };
    }

    return payload;
}

/**
 * Builds the payment payload based on the specified flow (HPP or Checkout SDK)
 * @param {dw.order.Order} order - The order object
 * @param {Object} billingData - The billing data object containing address information
 * @param {Object} token - The token object for saved card payments
 * @param {Object} options - Options object containing flow type and other configuration
 * @returns {Object} The payment payload object
 */
function build(order, billingData, token, options) {
    const flow = options && options.flow ? String(options.flow) : 'HPP';

    if (flow === 'CHECKOUTSDK') {
        return buildCheckoutSdk(order, billingData, options || {});
    }

    return buildHpp(order, billingData, token);
}

module.exports = {
    build: build
};
