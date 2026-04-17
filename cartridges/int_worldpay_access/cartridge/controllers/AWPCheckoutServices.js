/* global session */

'use strict';

const server = require('server');
const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');

const serviceFacade = require('*/cartridge/scripts/service/serviceFacade');
const tokenFacade = require('*/cartridge/scripts/service/tokenFacade');
const awpConstants = require('*/cartridge/scripts/common/awpConstants');
const threeDsHelper = require('*/cartridge/scripts/helpers/threeDsHelper');

/**
 * Reads and parses billing data from session privacy object
 * @returns {Object|null} Parsed billing data or null if not available
 */
function readBillingDataFromSession() {
    let billingData = null;
    const rawBilling = session.privacy.billingData;
    if (rawBilling) {
        try {
            billingData = JSON.parse(rawBilling);
        } catch (e) {
            Logger.getLogger('awp').error('AWPRedirect: Failed to parse session.privacy.billingData: {0}', e);
        }
    }
    session.privacy.billingData = null;
    return billingData;
}

/**
 * Checks if an order uses the Checkout SDK payment method
 * @param {dw.order.Order} order - The order to check
 * @returns {boolean} True if the order has Checkout SDK payment instrument, false otherwise
 */
function isCheckoutSdkOrder(order) {
    try {
        const it = order.getPaymentInstruments(awpConstants.WORLDPAY_CHECKOUTSDK).iterator();
        return it.hasNext();
    } catch (e) {
        return false;
    }
}

/**
 * Retrieves the Checkout SDK session href from the order's payment instrument
 * @param {dw.order.Order} order - The order to get the session href from
 * @returns {string} The session href or empty string if not found
 */
function getCheckoutSdkSessionHref(order) {
    try {
        const it = order.getPaymentInstruments(awpConstants.WORLDPAY_CHECKOUTSDK).iterator();
        if (!it.hasNext()) return '';

        const pi = it.next();
        if (!pi || !pi.custom) return '';

        const href = pi.custom.awpSessionHref || '';
        return href ? String(href) : '';
    } catch (e) {
        return '';
    }
}


/**
 * Determines save-card intent and customer info for Checkout SDK order
 * @param {dw.order.Order} order - The order
 * @returns {{saveCard: boolean, customerNo: string, customerEmail: string}} Save-card intent and customer info
 */
function getCheckoutSdkSaveCardInfo(order) {
    const res = { saveCard: false, customerNo: '', customerEmail: '' };
    try {
        const customer = order && order.getCustomer && order.getCustomer();
        const profile = customer && customer.getProfile ? customer.getProfile() : null;
        if (!profile || !profile.customerNo) return res;

        const piIt = order.getPaymentInstruments(awpConstants.WORLDPAY_CHECKOUTSDK).iterator();
        if (!piIt.hasNext()) return res;

        const pi = piIt.next();
        if (pi && pi.custom && pi.custom.awpSaveCard || order.custom.isRecurring) {
            res.saveCard = true;
            res.customerNo = String(profile.customerNo || '');
            res.customerEmail = order.customerEmail || (profile.email || '');
        }
    } catch (e) {
        Logger.getLogger('awp').warn('getCheckoutSdkSaveCardInfo error: {0}', e);
    }
    return res;
}

/**
 * Safely handles payment processing with fallback parameter handling
 * @param {dw.order.Order} order - The order to process payments for
 * @param {Object} req - The request object
 * @param {Object} orderHookData - Additional data for payment processing hooks
 * @returns {Object} The result of payment handling with error property
 */
function safeHandlePayments(order, req, orderHookData) {
    const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    try {
        if (COHelpers && typeof COHelpers.handlePayments === 'function') {
            return COHelpers.handlePayments(order, orderHookData || {});
        }
    } catch (e) {
        Logger.getLogger('awp').error('safeHandlePayments error: {0}', e);
        return { error: true };
    }
    return { error: false };
}

/**
 * Extracts token data from a Payments API response
 * @param {Object} payRes - Payment response wrapper
 * @returns {Object|null} Token object if found
 */
function extractTokenFromPaymentsResponse(payRes) {
    const body = payRes && (payRes.object || payRes.raw || payRes.response)
        ? (payRes.object || payRes.raw || payRes.response)
        : null;
    if (!body) return null;

    if (body.token) return body.token;
    if (body.paymentInstrument && body.paymentInstrument.token) return body.paymentInstrument.token;
    if (body.paymentInstrument && body.paymentInstrument.card && body.paymentInstrument.card.token) return body.paymentInstrument.card.token;

    if (body.tokenId && (body.href || body.cardNumber || body.cardExpiry || body.cardExpiryDate)) {
        return body;
    }

    return null;
}

/**
 * Checks if the Payments API outcome indicates a successful result
 * @param {Object} result - The result object from the Payments API
 * @returns {boolean} True if the payment outcome is OK, false otherwise
 */
function isPaymentsApiOutcomeOk(result) {
    if (!result || result.error) return false;

    const body = result.object || result.raw || result.response || null;
    if (!body) return true;

    const status =
        (body.outcome && (body.outcome.paymentStatus || body.outcome.status)) ||
        body.paymentStatus ||
        body.status ||
        body.lastEvent ||
        '';

    const okSet = { AUTHORIZED: true, CAPTURED: true, SUCCESS: true, COMPLETED: true };
    return !status || !!okSet[String(status).toUpperCase()];
}

/**
 * Finalizes payment handling and order placement for Checkout SDK
 * @param {dw.order.Order} order - The order
 * @param {dw.system.Request} req - The request
 * @returns {{error: boolean, redirectUrl: string}} Result
 */
function finalizeCheckoutSdkOrder(order, req) {
    const errUrl = URLUtils.url('Cart-Show', 'placeerror', 'Payment failed').toString();

    const hp = safeHandlePayments(order, req, {});
    if (hp && hp.error) {
        Logger.getLogger('awp').error('finalizeCheckoutSdkOrder: handlePayments failed for order {0}', order.orderNo);
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
        return { error: true, redirectUrl: errUrl };
    }

    threeDsHelper.clearThreeDsSession();

    return {
        error: false,
        redirectUrl: URLUtils.url('Order-AWPConfirm', 'orderID', order.orderNo, 'orderToken', order.orderToken).toString()
    };
}

/**
 * Parses fraud outcome from payment response
 * @param {Object} payRes - The payment response object
 * @returns {Object} Parsed fraud data with outcomeRaw, outcome, and score properties
 */
function parseFraudOutcome(payRes) {
    let body = payRes && (payRes.object || payRes.raw || payRes.response)
        ? (payRes.object || payRes.raw || payRes.response)
        : null;

    if (!body) {
        return {
            outcomeRaw: '',
            outcome: '',
            score: null
        };
    }

    let outcomeRaw = '';
    let score = null;

    if (body.fraud) {
        outcomeRaw = body.fraud.outcome ? String(body.fraud.outcome) : '';
        if (body.fraud.score !== undefined && body.fraud.score !== null) {
            score = Number(body.fraud.score);
        }
    }
    else if (body.outcome && String(body.outcome).toLowerCase().indexOf('fraud') === 0) {
        outcomeRaw = String(body.outcome);
        if (body.score !== undefined && body.score !== null) {
            score = Number(body.score);
        }
    }

    // Normalize:
    // "lowRisk(silentMode)" -> "LOWRISK"
    // "fraudHighRisk" -> "HIGHRISK"
    let normalized = '';

    if (outcomeRaw) {
        normalized = outcomeRaw
            .replace(/\(.*\)$/g, '')
            .replace(/^fraud/i, '')
            .replace(/\s+/g, '')
            .toUpperCase();
    }

    return {
        outcomeRaw: outcomeRaw,
        outcome: normalized,
        score: score
    };
}

/**
 * Checks if the parsed fraud outcome indicates high risk
 * @param {Object} parsed - The parsed fraud outcome object
 * @returns {boolean} True if the fraud outcome is high risk, false otherwise
 */
function isHighRiskFraud(parsed) {
    if (!parsed) return false;

    if (parsed.outcome === 'HIGHRISK' || parsed.outcome === 'HIGH_RISK') return true;

    return false;
}

/**
 * Persists fraud outcome data on the order
 * @param {dw.order.Order} order - The order to persist fraud data on
 * @param {Object} payRes - The payment response object containing fraud data
 * @returns {Object|null} Parsed fraud data or null if an error occurs
 */
function persistFraudOnOrder(order, payRes) {
    try {
        let pf = parseFraudOutcome(payRes);
        let body = payRes && (payRes.object || payRes.raw || payRes.response)
            ? (payRes.object || payRes.raw || payRes.response)
            : null;

        const orderRef = order;
        Transaction.wrap(function () {
            orderRef.custom.awpFraudOutcome = pf.outcomeRaw || pf.outcome || '';
            orderRef.custom.awpFraudScore = (pf.score !== null && !Number.isNaN(pf.score)) ? String(pf.score) : '';

            if (body && body.paymentId) {
                orderRef.custom.awpPaymentId = String(body.paymentId);
            }
        });

        return pf;
    } catch (e) {
        Logger.getLogger('awp').warn('Could not persist fraud data for order {0}: {1}', order.orderNo, e);
        return null;
    }
}

/**
 * Persists paymentId on the order if present in response
 * @param {dw.order.Order} order - The order to persist payment data on
 * @param {Object} payRes - The payment response object containing paymentId
 */
function persistPaymentIdOnOrder(order, payRes) {
    try {
        let body = payRes && (payRes.object || payRes.raw || payRes.response)
            ? (payRes.object || payRes.raw || payRes.response)
            : null;

        if (body && body.paymentId) {
            const orderRef = order;
            Transaction.wrap(function () {
                orderRef.custom.awpPaymentId = String(body.paymentId);
            });
        }
    } catch (e) {
        Logger.getLogger('awp').warn('Could not persist paymentId for order {0}: {1}', order.orderNo, e);
    }
}

/**
 * Retrieves the card holder name from the Checkout SDK payment instrument
 * @param {dw.order.Order} order - The order to get the card holder name from
 * @returns {string} The card holder name or empty string if not found
 */
function getCheckoutSdkCardHolderName(order) {
    try {
        const it = order.getPaymentInstruments(awpConstants.WORLDPAY_CHECKOUTSDK).iterator();
        if (!it.hasNext()) return '';

        const pi = it.next();
        if (!pi || !pi.custom) return '';

        const name = pi.custom.awpCardHolderName || '';
        return name ? String(name).replace(/\s+/g, ' ').trim() : '';
    } catch (e) {
        Logger.getLogger('awp').error('getCheckoutSdkCardHolderName: exception for order {0}: {1}', order.orderNo, e);
        return '';
    }
}

server.post('Redirect', server.middleware.https, function (req, res, next) {
    const orderNo = req.querystring.orderNo;
    if (!orderNo) {
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', 'Missing orderNo'));
        return next();
    }

    const order = OrderMgr.getOrder(orderNo);
    if (!order) {
        Logger.getLogger('awp').error('AWPRedirect: Order not found for orderNo={0}', orderNo);
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', 'Order not found'));
        return next();
    }

    const piAll = order.getPaymentInstruments();
    const hasPI = (piAll && (piAll.length ? piAll.length > 0 : piAll.size && piAll.size() > 0));
    if (!hasPI) {
        Logger.getLogger('awp').error('AWPRedirect: No PI on order {0}', orderNo);
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', 'Payment method missing'));
        return next();
    }

    const billingData = readBillingDataFromSession();

    const isSdk = isCheckoutSdkOrder(order);

    let profile = null;
    let tokenHref = null;

    if (isSdk) {
        const sessionHref = getCheckoutSdkSessionHref(order);

        const Site = require('dw/system/Site');
        const fraudSightEnabled = Site.getCurrent().getCustomPreferenceValue('EnableFraudSight');
        const fraudSightSilentMode = Site.getCurrent().getCustomPreferenceValue('FraudSightSilentMode');

        const billAddr = order.billingAddress;
        const customerProfile = order.getCustomer && order.getCustomer() && order.getCustomer().getProfile ? order.getCustomer().getProfile() : null;

        const opts = {
            sessionHref: sessionHref,
            fraudSight: {
                enabled: fraudSightEnabled,
                silentMode: fraudSightSilentMode,
                tmxSessionId: session.privacy.awpTmxSessionId ? String(session.privacy.awpTmxSessionId) : ''
            },
            customer: {
                firstName: billAddr ? (billAddr.firstName || '') : '',
                lastName: billAddr ? (billAddr.lastName || '') : '',
                email: order.customerEmail || (customerProfile ? (customerProfile.email || '') : ''),
                phone: billAddr ? (billAddr.phone || '') : '',
                customerId: customerProfile ? String(customerProfile.customerNo || '') : '',
                ipAddress: session.privacy.awpClientIp ? String(session.privacy.awpClientIp) : ''
            }
        };

        let usingSavedCard = false;
        let chosenUUID = session.privacy.awpSavedPIUUID || '';
        let choice = session.privacy.awpSavedChoice || '';

        if (choice === 'saved' && chosenUUID) {
            let customer = order.getCustomer && order.getCustomer();
            profile = customer && customer.getProfile ? customer.getProfile() : null;
            let wallet = profile && profile.getWallet ? profile.getWallet() : null;

            if (wallet) {
                let it = wallet.getPaymentInstruments('CREDIT_CARD').iterator();
                while (it.hasNext()) {
                    let instrument = it.next();
                    if (instrument.UUID === chosenUUID && instrument.custom && instrument.custom.awpTokenHref) {
                        tokenHref = String(instrument.custom.awpTokenHref);
                        break;
                    }
                }
            }

            if (!tokenHref) {
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', 'Saved card not found'));
                return next();
            }

            usingSavedCard = true;
            opts.tokenHref = tokenHref;
            session.privacy.awpUsedSavedCard = true;
        }

        if (!sessionHref && !usingSavedCard) {
            Logger.getLogger('awp').error('AWPRedirect: Missing sessionHref for CheckoutSDK order {0}', orderNo);
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
            res.redirect(URLUtils.url('Cart-Show', 'placeerror', 'Missing session'));
            return next();
        }

        const threeDsEnabled = Site.getCurrent().getCustomPreferenceValue('EnableThreeDs');
        if (threeDsEnabled) {
            const deviceData = threeDsHelper.buildThreeDsDeviceData(req);
            opts.threeDS = {
                returnUrl: URLUtils.https('AWPCheckoutServices-ThreeDSReturn', 'orderNo', order.orderNo).toString(),
                deviceData: deviceData
            };
        }

        const chn = getCheckoutSdkCardHolderName(order);
        if (chn) {
            opts.cardHolderName = chn;
        }

        if (!usingSavedCard) {
            try {
                const saveInfo = getCheckoutSdkSaveCardInfo(order);
                if (saveInfo.saveCard) {
                    opts.saveCard = true;
                    opts.customerNo = saveInfo.customerNo;
                    opts.customerEmail = saveInfo.customerEmail;

                    let before = tokenFacade.getLatestTokenByNamespace('cust-' + saveInfo.customerNo);
                    session.privacy.awpLatestTokenIdBefore = (before && before.token && before.token.tokenId)
                        ? String(before.token.tokenId)
                        : '';
                }
            } catch (e) {
                Logger.getLogger('awp').warn('CheckoutSDK save card setup failed for order {0}: {1}', orderNo, e);
            }
        }

        const payRes = serviceFacade.authorizeCheckoutSdkPayment(order, billingData, opts);
        try {
            const tokenFromPayment = extractTokenFromPaymentsResponse(payRes);
            if (tokenFromPayment) {
                session.privacy.awpTokenFromPayment = JSON.stringify(tokenFromPayment);
            }
        } catch (e) {
            Logger.getLogger('awp').warn('CheckoutSDK: could not persist token from payment for order {0}: {1}', orderNo, e);
        }
        persistPaymentIdOnOrder(order, payRes);

        let parsedFraud = null;
        if (fraudSightEnabled) {
            parsedFraud = persistFraudOnOrder(order, payRes);
        }

        const handled = threeDsHelper.handleCheckoutSdkThreeDsResponse({
            payRes: payRes,
            order: order,
            orderNo: orderNo,
            req: req,
            res: res,
            isPaymentsApiOutcomeOk: isPaymentsApiOutcomeOk
        });
        if (handled) return next();

        if (fraudSightEnabled && !fraudSightSilentMode) {
            if (!parsedFraud) parsedFraud = parseFraudOutcome(payRes);

            if (isHighRiskFraud(parsedFraud)) {
                Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

                res.redirect(URLUtils.url(
                    'Cart-Show',
                    'placeerror',
                    'We could not process your payment. Please try another payment method.'
                ));
                return next();
            }
        }

        const finalRes = finalizeCheckoutSdkOrder(order, req);
        res.redirect(finalRes.redirectUrl);
        return next();
    }

    const chosenUUID = session.privacy.awpSavedPIUUID || '';
    session.privacy.awpSavedPIUUID = '';

    profile = req.currentCustomer && req.currentCustomer.profile;
    try {
        if (profile && profile.customerNo) {
            let before = tokenFacade.getLatestTokenByNamespace('cust-' + profile.customerNo);
            session.privacy.awpLatestTokenIdBefore = (before && before.token && before.token.tokenId)
                ? String(before.token.tokenId)
                : '';
        } else {
            session.privacy.awpLatestTokenIdBefore = '';
        }
    } catch (e) {
        session.privacy.awpLatestTokenIdBefore = '';
        Logger.getLogger('awp').error('HPPRedirect: Error retrieving latest token for customer: {0}', e);
    }

    if (chosenUUID) {
        let customer = order.getCustomer && order.getCustomer();
        profile = customer && customer.getProfile ? customer.getProfile() : null;
        let wallet = profile && profile.getWallet ? profile.getWallet() : null;

        if (!wallet) {
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', 'No wallet'));
            return next();
        }

        let it = wallet.getPaymentInstruments('CREDIT_CARD').iterator();
        while (it.hasNext()) {
            let instrument = it.next();
            if (instrument.UUID === chosenUUID && instrument.custom && instrument.custom.awpTokenHref) {
                tokenHref = String(instrument.custom.awpTokenHref);
                break;
            }
        }
        if (!tokenHref) {
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', 'Saved card not found'));
            return next();
        }
        session.privacy.awpUsedSavedCard = true;
    }

    const result = serviceFacade.authorizeOrderService(order, billingData, { tokenHref: tokenHref });
    if (result.error || !result.redirectUrl) {
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
        Logger.getLogger('awp').error('HPPRedirect: Failed to get HPP session for order {0}', orderNo);
        res.redirect(URLUtils.url('Cart-Show', 'placeerror', 'Payment failed'));
        return next();
    }

    res.redirect(result.redirectUrl);
    return next();
});

server.post('SaveDeviceData', server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) {
    let tmx = (req.form && req.form.tmxSessionId) ? String(req.form.tmxSessionId) : '';
    tmx = tmx.replace(/[^a-zA-Z0-9\-_]/g, '');
    session.privacy.awpTmxSessionId = tmx;

    try {
        let dd = {};
        if (req.form && req.form.browserLanguage) dd.browserLanguage = String(req.form.browserLanguage);
        if (req.form && req.form.browserScreenHeight) dd.browserScreenHeight = Number(req.form.browserScreenHeight);
        if (req.form && req.form.browserScreenWidth) dd.browserScreenWidth = Number(req.form.browserScreenWidth);
        if (req.form && req.form.browserColorDepth) dd.browserColorDepth = String(req.form.browserColorDepth);
        if (req.form && (req.form.timeZone || req.form.timeZone === 0)) dd.timeZone = String(req.form.timeZone);
        if (req.form && req.form.browserJavaEnabled !== undefined) dd.browserJavaEnabled = req.form.browserJavaEnabled === 'true' || req.form.browserJavaEnabled === true;
        if (req.form && req.form.browserJavascriptEnabled !== undefined) dd.browserJavascriptEnabled = req.form.browserJavascriptEnabled === 'true' || req.form.browserJavascriptEnabled === true;
        if (req.form && req.form.channel) dd.channel = String(req.form.channel);

        if (Object.keys(dd).length) {
            session.privacy.awp3dsDeviceData = JSON.stringify(dd);
        }
    } catch (e) {
        Logger.getLogger('awp').debug('SaveDeviceData: 3DS device data parse error: {0}', e);
    }

    res.json({ ok: true });
    return next();
});

server.get('ThreeDSDeviceDataForm', server.middleware.https, function (req, res, next) {
    let raw = session.privacy.awp3dsDdc || '';
    if (!raw) {
        res.render('checkout/3dsError', { message: '3DS device data missing' });
        return next();
    }

    let ddc = null;
    try {
        ddc = JSON.parse(raw);
    } catch (e) {
        Logger.getLogger('awp').error('ThreeDSDeviceDataForm: parse error: {0}', e);
    }

    if (!ddc || !ddc.url || !ddc.jwt || !ddc.bin) {
        res.render('checkout/3dsError', { message: '3DS device data missing' });
        return next();
    }

    res.render('checkout/3dsDeviceDataForm', {
        ddcUrl: ddc.url,
        ddcJwt: ddc.jwt,
        ddcBin: ddc.bin
    });
    return next();
});

server.post('Supply3dsDeviceData', server.middleware.https, function (req, res, next) {
    let orderNo = req.querystring.orderNo || session.privacy.awp3dsOrderNo || '';
    let order = orderNo ? OrderMgr.getOrder(orderNo) : null;
    if (!order) {
        threeDsHelper.clearThreeDsSession();
        res.json({ error: true, redirectUrl: URLUtils.url('Cart-Show', 'placeerror', 'Order not found').toString() });
        return next();
    }

    let supplyHref = session.privacy.awp3dsSupplyHref ? String(session.privacy.awp3dsSupplyHref) : '';
    if (!supplyHref) {
        threeDsHelper.clearThreeDsSession();
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', '3DS action missing').toString()
        });
        return next();
    }

    let collectionReference = (req.form && req.form.collectionReference) ? String(req.form.collectionReference) : '';
    let payload = collectionReference ? { collectionReference: collectionReference } : {};

    let actionRes = serviceFacade.supply3dsDeviceData(supplyHref, payload);

    if (!actionRes || actionRes.error) {
        threeDsHelper.clearThreeDsSession();
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', '3DS device data failed').toString()
        });
        return next();
    }

    try {
        let tokenFrom3ds = extractTokenFromPaymentsResponse(actionRes);
        if (tokenFrom3ds) {
            session.privacy.awpTokenFromPayment = JSON.stringify(tokenFrom3ds);
        }
    } catch (e) {
        Logger.getLogger('awp').warn('3DS device data: token parse failed for order {0}: {1}', order.orderNo, e);
    }

    if (threeDsHelper.isThreeDsChallenged(actionRes)) {
        let body = actionRes.object || actionRes.raw || actionRes.response || {};
        let ch = body.challenge || {};
        let completeAction = body._actions && body._actions.complete3dsChallenge;
        let completeHref = completeAction && completeAction.href ? String(completeAction.href) : '';

        if (!ch || !ch.url || !ch.jwt || !completeHref) {
            threeDsHelper.clearThreeDsSession();
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
            res.json({
                error: true,
                redirectUrl: URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', '3DS challenge missing').toString()
            });
            return next();
        }

        session.privacy.awp3dsChallenge = JSON.stringify({
            url: String(ch.url),
            jwt: String(ch.jwt),
            reference: ch.reference ? String(ch.reference) : '',
            origin: threeDsHelper.getOriginFromUrl(String(ch.url))
        });
        session.privacy.awp3dsCompleteHref = completeHref;

        res.json({
            error: false,
            redirectUrl: URLUtils.https('AWPCheckoutServices-ThreeDSChallenge', 'orderNo', order.orderNo).toString()
        });
        return next();
    }

    if (!isPaymentsApiOutcomeOk(actionRes) || threeDsHelper.isThreeDsNegative(actionRes, isPaymentsApiOutcomeOk)) {
        threeDsHelper.clearThreeDsSession();
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', '3DS authentication failed').toString()
        });
        return next();
    }

    persistPaymentIdOnOrder(order, actionRes);

    const Site = require('dw/system/Site');
    const fraudSightEnabled = Site.getCurrent().getCustomPreferenceValue('EnableFraudSight');
    if (fraudSightEnabled) {
        persistFraudOnOrder(order, actionRes);
    }

    let finalRes = finalizeCheckoutSdkOrder(order, req);
    res.json({ error: finalRes.error, redirectUrl: finalRes.redirectUrl });
    return next();
});

server.get('ThreeDSChallenge', server.middleware.https, function (req, res, next) {
    let raw = session.privacy.awp3dsChallenge || '';
    if (!raw) {
        res.render('checkout/3dsError', { message: '3DS challenge missing' });
        return next();
    }

    res.render('checkout/3dsChallenge', {
        challengeFormUrl: URLUtils.https('AWPCheckoutServices-ThreeDSChallengeForm').toString()
    });
    return next();
});

server.get('ThreeDSChallengeForm', server.middleware.https, function (req, res, next) {
    let raw = session.privacy.awp3dsChallenge || '';
    let ch = null;
    try {
        ch = raw ? JSON.parse(raw) : null;
    } catch (e) {
        Logger.getLogger('awp').error('ThreeDSChallengeForm: parse error: {0}', e);
    }

    if (!ch || !ch.url || !ch.jwt) {
        res.render('checkout/3dsError', { message: '3DS challenge missing' });
        return next();
    }

    res.render('checkout/3dsChallengeForm', {
        challengeUrl: ch.url,
        challengeJwt: ch.jwt
    });
    return next();
});

server.post('ThreeDSReturn', server.middleware.https, function (req, res, next) {
    let orderNo = req.querystring.orderNo || '';
    let order = orderNo ? OrderMgr.getOrder(orderNo) : null;
    if (!order) {
        threeDsHelper.clearThreeDsSession();
        res.render('checkout/3dsReturn', {
            message: 'Order not found',
            redirectUrl: URLUtils.url('Cart-Show', 'placeerror', 'Order not found').toString()
        });
        return next();
    }

    let completeHref = session.privacy.awp3dsCompleteHref ? String(session.privacy.awp3dsCompleteHref) : '';
    if (!completeHref) {
        threeDsHelper.clearThreeDsSession();
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
        res.render('checkout/3dsReturn', {
            message: '3DS completion missing',
            redirectUrl: URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', '3DS completion missing').toString()
        });
        return next();
    }

    let actionRes = serviceFacade.complete3dsChallenge(completeHref);
    if (!actionRes || actionRes.error || !isPaymentsApiOutcomeOk(actionRes) || threeDsHelper.isThreeDsNegative(actionRes, isPaymentsApiOutcomeOk)) {
        threeDsHelper.clearThreeDsSession();
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
        res.render('checkout/3dsReturn', {
            message: '3DS authentication failed',
            redirectUrl: URLUtils.url('Checkout-Begin', 'stage', 'payment', 'placeerror', '3DS authentication failed').toString()
        });
        return next();
    }

    persistPaymentIdOnOrder(order, actionRes);

    const Site = require('dw/system/Site');
    const fraudSightEnabled = Site.getCurrent().getCustomPreferenceValue('EnableFraudSight');
    if (fraudSightEnabled) {
        persistFraudOnOrder(order, actionRes);
    }

    try {
        let tokenFrom3dsReturn = extractTokenFromPaymentsResponse(actionRes);
        if (tokenFrom3dsReturn) {
            session.privacy.awpTokenFromPayment = JSON.stringify(tokenFrom3dsReturn);
        }
    } catch (e) {
        Logger.getLogger('awp').warn('3DS return: token parse failed for order {0}: {1}', order.orderNo, e);
    }

    let finalRes = finalizeCheckoutSdkOrder(order, req);
    res.render('checkout/3dsReturn', {
        message: finalRes.error ? 'Payment failed' : 'Payment complete',
        redirectUrl: finalRes.redirectUrl
    });
    return next();
});

module.exports = server.exports();
