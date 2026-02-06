/* global session */
/* eslint-disable no-underscore-dangle */

'use strict';

const server = require('server');
server.extend(module.superModule);

const Resource = require('dw/web/Resource');
const URLUtils = require('dw/web/URLUtils');

const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');
const OrderModel = require('*/cartridge/models/order');
const Locale = require('dw/util/Locale');
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const PaymentInstrument = require('dw/order/PaymentInstrument');

const tokenFacade = require('*/cartridge/scripts/service/tokenFacade');
const reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
const checkoutHelper = require('*/cartridge/scripts/checkout/checkoutHelpers');
const facade = require('*/cartridge/scripts/service/serviceFacade');

/**
 * Maps the brand name to the corresponding SFRA brand name.
 * @param {string} brand - The brand name to map.
 * @param {string} firstDigit - The first digit of the card number.
 * @returns {string} - The mapped SFRA brand name.
 */
function mapBrandToSFRA(brand, firstDigit) {
    const cardBrand = (brand || '').toLowerCase();
    if (cardBrand === 'visa') return 'Visa';
    if (cardBrand === 'mastercard' || cardBrand === 'master card') return 'MasterCard';
    if (cardBrand === 'amex' || cardBrand === 'american express') return 'Amex';
    if (cardBrand === 'discover') return 'Discover';
    if (cardBrand === 'diners' || cardBrand === 'diners club') return 'Diners';
    if (cardBrand === 'jcb') return 'JCB';
    
    if (firstDigit === '4') return 'Visa';
    if (firstDigit === '5') return 'MasterCard';
    if (firstDigit === '3') return 'Amex';
    if (firstDigit === '6') return 'Discover';
    return 'Visa';
}

/**
 * Safely retrieves a nested property from an object using a dot-separated path.
 *
 * @param {Object} obj - The source object from which to retrieve the value.
 * @param {string} path - Dot-separated path to the desired property (e.g. "user.profile.email").
 * @param {*} [dflt] - Default value to return if the property does not exist or is null/undefined.
 * @returns {*} - The value found at the specified path, or the default value if not found.
 */
function get(obj, path, dflt) { 
    if (!obj || !path) return dflt;
    const val = path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
    return (val === null || val === undefined) ? dflt : val;
}

/**
 * Retrieves the customer's profile and wallet if authenticated and registered.
 * @param {dw.order.Order} order - The order object.
 * @returns {{profile: dw.customer.CustomerProfile, wallet: dw.customer.Wallet}|null} The profile and wallet, or null if unavailable.
 */
function getProfileWallet(order) {
    const customer = order && typeof order.getCustomer === 'function' ? order.getCustomer() : null;
    if (!customer || !customer.authenticated || !customer.registered) return null;

    const profile = customer.getProfile && typeof customer.getProfile === 'function' ? customer.getProfile() : null;
    if (!profile) return null;

    const wallet = profile.getWallet && typeof profile.getWallet === 'function' ? profile.getWallet() : null;
    if (!wallet) return null;

    return { profile, wallet };
}

/**
 * Retrieves the latest payment token for a given namespace.
 * @param {string} namespace - The namespace to search for the latest token.
 * @returns {Object|null} The latest token object or null if not found or on error.
 */
function fetchLatestToken(namespace) {
    try {
        const latest = tokenFacade.getLatestTokenByNamespace(namespace);
        if ((latest && latest.error) || !(latest && latest.token)) return null;
        return latest;
    } catch (e) {
        Logger.getLogger('awp').error('getLatestTokenByNamespace failed: {0}', e);
        return null;
    }
}

/**
 * Extracts the self HREF from a token object.
 * @param {Object} token - The token object.
 * @returns {string|null} The self HREF string or null if not found.
 */
function extractSelfHrefFromToken(token) {
    if (!token) return null;
    const links = token._links;
    if (links && links['tokens:token'] && links['tokens:token'].href) {
        return String(links['tokens:token'].href);
    }
    if (token.tokenPaymentInstrument && token.tokenPaymentInstrument.href) {
        return String(token.tokenPaymentInstrument.href);
    }
    return null;
}

/**
 * Fetches the token detail for a given selfHref.
 * @param {string} selfHref - The self HREF of the token.
 * @returns {Object|null} The token detail object or null if not found or on error.
 */
function fetchTokenDetail(selfHref) {
    if (!selfHref) return null;
    try {
        const det = tokenFacade.getTokenDetail(selfHref);
        if (det && det.error) return null;
        return det && det.detail ? det.detail : null;
    } catch (e) {
        Logger.getLogger('awp').error('getTokenDetail failed: {0}', e);
        return null;
    }
}

/**
 * Derives card metadata such as last 4 digits, brand, expiration, and holder from payment instrument data.
 * @param {Object} listPI - The payment instrument object from the token list.
 * @param {Object} detail - The detailed token object.
 * @returns {Object} An object containing last4, brand, expMonth, expYear, holder, and firstDigit.
 */
function deriveCardMeta(listPI, detail) {
    let last4 = null;
    let brand = null;
    let expMonth = null;
    let expYear = null;
    let holder = (listPI && listPI.cardHolderName) ? listPI.cardHolderName : null;

    const maskedFromList = (listPI && listPI.cardNumber) ? listPI.cardNumber : null;
    if (maskedFromList) last4 = String(maskedFromList).slice(-4);
    const expObj = (listPI && listPI.cardExpiryDate) ? listPI.cardExpiryDate : null;
    if (expObj) { expMonth = expObj.month; expYear = expObj.year; }

    if (detail) {
        let dPI = get(detail, 'paymentInstrument', null) || get(detail, 'instrument', null) || get(detail, 'card', null);
        if (dPI && dPI.card) dPI = dPI.card;

        if (dPI) {
            if (!brand) brand = dPI.brand || null;
            if (!last4) last4 = get(dPI, 'number.last4Digits', null) || get(dPI, 'number.last4', null);
            if (!expMonth) expMonth = dPI.expiryMonth || expMonth;
            if (!expYear) expYear = dPI.expiryYear || expYear;
            if (!holder) holder = dPI.cardHolderName || holder;
        }
    }

    return {
        last4: last4 ? String(last4) : null,
        brand: brand ? String(brand) : null,
        expMonth: expMonth != null ? String(expMonth) : null,
        expYear: expYear != null ? String(expYear) : null,
        holder: holder ? String(holder) : null,
        firstDigit: maskedFromList ? String(maskedFromList).charAt(0) : null
    };
}

/**
 * Finds a duplicate payment instrument in the wallet that matches the card type, last 4 digits, and expiration date.
 * @param {dw.customer.Wallet} wallet - The customer's wallet object.
 * @param {string} cardTypeForSFRA - The card type as mapped for SFRA.
 * @param {Object} meta - Card metadata containing last4, expMonth, and expYear.
 * @returns {dw.order.PaymentInstrument|null} The matching payment instrument if found, otherwise null.
 */
function findDuplicatePI(wallet, cardTypeForSFRA, meta) {
    const it = wallet.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD).iterator();
    while (it.hasNext()) {
        const pi = it.next();
        const sameType =
            pi.getCreditCardType &&
            String(pi.getCreditCardType()).toLowerCase() === String(cardTypeForSFRA).toLowerCase();

        const existingMasked = pi.getMaskedCreditCardNumber ? String(pi.getMaskedCreditCardNumber()) : '';
        const existingLast4  = existingMasked ? existingMasked.slice(-4) : '';
        const sameLast4 = meta.last4 && existingLast4 && existingLast4 === meta.last4;

        const sameExp =
            String(meta.expMonth) === String(pi.getCreditCardExpirationMonth()) &&
            String(meta.expYear) === String(pi.getCreditCardExpirationYear());

        if (sameType && sameLast4 && sameExp) return pi;
    }
    return null;
}

/**
 * Creates or updates a payment instrument in the customer's wallet with the provided card metadata and extras.
 * @param {dw.customer.Wallet} wallet - The customer's wallet object.
 * @param {dw.order.PaymentInstrument|null} dupPI - The duplicate payment instrument if found, otherwise null.
 * @param {string} cardTypeForSFRA - The card type as mapped for SFRA.
 * @param {Object} meta - Card metadata containing last4, brand, expMonth, expYear, holder, and firstDigit.
 * @param {Object} extras - Additional data such as selfHref, tokenId, and namespace.
 */
function upsertWalletPI(wallet, dupPI, cardTypeForSFRA, meta, extras) {
    Transaction.wrap(() => {
        const targetPI = dupPI || wallet.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);

        if (meta.last4) {
            const sfccMasked = '************' + meta.last4;
            targetPI.setCreditCardNumber(sfccMasked);
        }
        if (cardTypeForSFRA) targetPI.setCreditCardType(cardTypeForSFRA);
        if (meta.expMonth) targetPI.setCreditCardExpirationMonth(Number(meta.expMonth));
        if (meta.expYear) targetPI.setCreditCardExpirationYear(Number(meta.expYear));
        if (meta.holder) targetPI.setCreditCardHolder(meta.holder);

        if (targetPI.custom) {
            targetPI.custom.awpTokenHref = extras.selfHref || '';
            if (meta.last4) targetPI.custom.awpLast4 = meta.last4;
            if (meta.brand) targetPI.custom.awpCardBrand = meta.brand;
            if (meta.expMonth) targetPI.custom.awpExpiryMonth = meta.expMonth;
            if (meta.expYear) targetPI.custom.awpExpiryYear = meta.expYear;
            if (extras.tokenId) targetPI.custom.awpTokenId = String(extras.tokenId);
            targetPI.custom.awpNamespace = extras.namespace;
        }
    });
}

/**
 * Saves the latest payment token to the customer's wallet if available.
 * @param {dw.order.Order} order - The order object.
 */
function saveTokenToWallet(order) {
    const profileWallet = getProfileWallet(order);
    if (!profileWallet) return;
    const { profile, wallet } = profileWallet;

    const namespace = `cust-${profile.getCustomerNo()}`;
    const latest = fetchLatestToken(namespace);
    if (!latest) return;

    const selfHref = extractSelfHrefFromToken(latest.token);
    const detail = selfHref ? fetchTokenDetail(selfHref) : null;
    const listPI = latest.token.paymentInstrument || {};

    const meta = deriveCardMeta(listPI, detail);
    if (!meta.last4 || !meta.expMonth || !meta.expYear) return;

    const cardTypeForSFRA = mapBrandToSFRA(meta.brand, meta.firstDigit) || 'CREDIT_CARD';
    const dupPI = findDuplicatePI(wallet, cardTypeForSFRA, meta);

    upsertWalletPI(wallet, dupPI, cardTypeForSFRA, meta, {
        selfHref,
        tokenId: latest.token.tokenId,
        namespace
    });
}

/**
 * Adds access fields to the order.
 * @param {Order} order - The current order.
 * @param {Object} det - The details object containing information to add.
 */
function addAccessFieldsToOrder(order, det) {
    Transaction.wrap(function () {
        let ord = order;
        if (ord.custom) {
            let narrative = det && det.narrative || {};
            let issuer = det && det.issuer || {};
            let scheme = det && det.scheme || {};

            ord.custom.awpNarrativeLine = narrative.line1 || null;
            ord.custom.awpAuthID = issuer.authorizationCode || null;
            ord.custom.awpSettleReference = scheme.reference || null;
            ord.custom.awpEventsJson = det && det.events ? JSON.stringify(det.events) : '[]';
        }
    });
}

server.get('AWPConfirm', server.middleware.https, function (req, res, next) {
    const orderID = req.querystring.orderID;
    const orderToken = req.querystring.orderToken;
    const order = OrderMgr.getOrder(orderID, orderToken);
    if (!order) {
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', 'Order not found'));
        return next();
    }

    if (order.status.value === Order.ORDER_STATUS_FAILED) {
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', Resource.msg('error.technical', 'checkout', null)));
        return next();
    }

    try {
        const q = facade.queryPaymentStatus(order.orderNo);
        if (q && !q.error && q.raw) {
            addAccessFieldsToOrder(order, q.raw);
        }
    } catch (e) {
        Logger.getLogger('awp').error('Error querying payment status: {0}', e);
    }

    if (order.status.value === Order.ORDER_STATUS_CREATED ||
        order.status.value === Order.ORDER_STATUS_NEW ||
        order.status.value === Order.ORDER_STATUS_OPEN) {

        const placement = checkoutHelper.placeOrder(order);
        if (placement.error) {
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', Resource.msg('error.technical', 'checkout', null)));
            return next();
        }
        checkoutHelper.sendConfirmationEmail(order, req.locale.id);
    }

    const config = { numberOfLineItems: '*' };
    const currentLocale = Locale.getLocale(req.locale.id);
    const orderModel = new OrderModel(order, { config: config, countryCode: currentLocale.country, containerView: 'order' });
    const reportingURLs = reportingUrlsHelper.getOrderReportingURLs(order);

    if (session.privacy.awpUsedSavedCard) {
        session.privacy.awpUsedSavedCard = null;
    } else if (order.getCustomer().getProfile()) {
        const beforeId = session.privacy.awpLatestTokenIdBefore || '';

        session.privacy.awpLatestTokenIdBefore = '';

        const after = tokenFacade.getLatestTokenByNamespace('cust-' + order.getCustomer().getProfile().getCustomerNo());
        let afterId = (after && after.token && after.token.tokenId) ? String(after.token.tokenId) : '';
        if (afterId && afterId !== beforeId) {
            saveTokenToWallet(order);
        }
    }

    res.render('checkout/confirmation/confirmation', {
        order: orderModel,
        returningCustomer: !!req.currentCustomer.profile,
        reportingURLs: reportingURLs,
        orderUUID: order.getUUID()
    });
    return next();
});

module.exports = server.exports();
