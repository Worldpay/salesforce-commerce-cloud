'use strict';

const server = require('server');
const serviceFacade = require('*/cartridge/scripts/service/serviceFacade');
const { getUrlPath } = require('*/cartridge/scripts/util/url');
const OrderMgr = require('dw/order/OrderMgr');

/**
 * Retrieves the href for a specific card payment action from the payment details result.
 * @param {Object} paymentDetailsResult - The payment details result object.
 * @param {string} actionString - The action string (e.g., 'settle', 'cancel', 'partialCancel').
 * @returns {string|null} The href for the specified card payment action, or null if not found.
 */
function getCardPaymentsHref(paymentDetailsResult, actionString) {
    if (
        paymentDetailsResult &&
        paymentDetailsResult._links &&
        paymentDetailsResult._links['cardPayments:' + actionString] &&
        paymentDetailsResult._links['cardPayments:' + actionString].href !== undefined
    ) {
        return paymentDetailsResult._links['cardPayments:' + actionString].href;
    }
    return null;
}

/**
 * CancelOrder - Business Manager menu action for canceling orders
 * This method handles the order cancel functionality called from Business Manager
*/
server.get('QueryOrderLinkCancel', function (req, res, next) {
    const params = req.httpParameterMap;
    const orderID = params.order_no.stringValue;
    const order = OrderMgr.getOrder(orderID);
    const txRef = (order && order.custom && order.custom.latestTransactionReference)
        ? String(order.custom.latestTransactionReference)
        : orderID;

    // Service Query Payment - It is required for getting the payment ID
    const paymentStatusResult = serviceFacade.queryPaymentStatus(txRef);
    if (paymentStatusResult.error) {
        res.render('/csc/error', {
            orderID: orderID,
            errorMessage: 'Failed to query payment status'
        });
        next();
        return;
    }

    // Extract the cancel href from cardPayments
    const cancelHref = getCardPaymentsHref(paymentStatusResult.raw, 'cancel');
    const cancelHrefUrlPath = getUrlPath(cancelHref);

    if (!cancelHrefUrlPath) {
        res.render('/csc/error', {
            errorMessage: 'Cancel link not found in payment details',
            orderID: orderID
        });
        next();
        return;
    }

    if (paymentStatusResult.status === 'authorizationRequested' ||
        paymentStatusResult.status === 'authorizationSucceeded'
    ) {
        res.render('/csc/cancelOrder', {
            success: true,
            orderID: orderID,
            paymentStatus: paymentStatusResult.status,
            message: 'Payment status retrieved successfully',
            cancelHrefUrlPath: cancelHrefUrlPath
        });
    } else {
        res.render('/csc/cancelOrder', {
            success: false,
            orderID: orderID,
            paymentStatus: paymentStatusResult.status,
            message: 'Payment cannot be canceled in its current state',
            cancelHrefUrlPath: cancelHrefUrlPath
        });
    }

    next();
});

/**
 * PartialCancelOrder - Business Manager menu action for partially canceling orders
 * This method handles the order partial cancel functionality called from Business Manager
*/
server.get('QueryOrderLinkPartialCancel', function (req, res, next) {
    const params = req.httpParameterMap;
    const orderID = params.order_no.stringValue;
    const order = OrderMgr.getOrder(orderID);
    const txRef = (order && order.custom && order.custom.latestTransactionReference)
        ? String(order.custom.latestTransactionReference)
        : orderID;

    const paymentStatusResult = serviceFacade.queryPaymentStatus(txRef);
    if (paymentStatusResult.error) {
        res.render('/csc/error', {
            orderID: orderID,
            errorMessage: 'Failed to query payment status'
        });
        return next();
    }

    const paymentDetails = paymentStatusResult.raw || {};
    const value = paymentDetails.value || {};
    let currency = value.currency || null;
    const amountMinor = value.amount;
    const amountMajor = typeof amountMinor === 'number'
        ? (amountMinor / 100).toFixed(2)
        : null;

    if (!currency && order && order.getTotalGrossPrice()) {
        currency = order.getTotalGrossPrice().getCurrencyCode();
    }

    const partialCancelHref = getCardPaymentsHref(paymentDetails, 'partialCancel');
    const partialCancelHrefUrlPath = getUrlPath(partialCancelHref);

    if (!partialCancelHrefUrlPath) {
        res.render('/csc/error', {
            errorMessage: 'Partial cancel link not found in payment details',
            orderID: orderID
        });
        return next();
    }

    const canPartialCancel =
        paymentStatusResult.status === 'authorizationRequested' ||
        paymentStatusResult.status === 'authorizationSucceeded';

    let lineItems = [];
    if (order) {
        const plis = order.getProductLineItems().toArray();
        lineItems = plis.map(function (pli) {
            const product = pli.product;
            let imageURL = null;
            if (product) {
                const img = product.getImage('small', 0) || product.getImage('medium', 0);
                if (img) {
                    imageURL = img.getAbsURL().toString();
                }
            }

            const money = pli.getAdjustedGrossPrice() || pli.getGrossPrice();
            const lineTotalMajor = money ? money.value.toFixed(2) : null;

            return {
                uuid: pli.UUID,
                productID: pli.productID,
                name: pli.productName,
                quantity: pli.quantity && pli.quantity.value,
                lineTotalMajor: lineTotalMajor,
                imageURL: imageURL
            };
        });
    }

    res.render('/csc/partialCancelOrder', {
        success: canPartialCancel,
        orderID: orderID,
        paymentStatus: paymentStatusResult.status,
        message: canPartialCancel
            ? 'Payment status retrieved successfully'
            : 'Payment cannot be partially canceled in its current state',
        partialCancelHrefUrlPath: partialCancelHrefUrlPath,
        currency: currency,
        totalAmount: amountMajor,
        lineItems: lineItems
    });

    return next();
});

server.post('CancelOrder', function (req, res, next) {
    const Transaction = require('dw/system/Transaction');

    const { postCancelRequest } = require('*/cartridge/scripts/service/paymentQueries');
    const params = req.httpParameterMap;
    const cancelHrefUrlPath = params.cancelHrefUrlPath;
    const orderNo = params.order_no && params.order_no.stringValue;

    const cancelRequest = postCancelRequest(cancelHrefUrlPath);
    if (cancelRequest.error) {
        res.render('/csc/error', { errorMessage: 'Failed to cancel the payment' });
        return next();
    }

    try {
        let order = orderNo ? OrderMgr.getOrder(orderNo) : null;
        if (order) {
            var status = Transaction.wrap(function () {
                return OrderMgr.cancelOrder(order);
            });
            if (!status || status.isError()) {
                res.render('/csc/error', { errorMessage: 'Payment canceled, but order cancel failed' });
                return next();
            }
        }
    } catch (e) {
        return next();
    }

    res.json({ success: true });
    return next();
});

server.post('PartialCancelOrder', function (req, res, next) {
    const paymentQueries = require('*/cartridge/scripts/service/paymentQueries');
    const AwpPartialCancel = require('*/cartridge/scripts/helpers/csc/partialCancelHelper');

    let params = req.httpParameterMap;

    let orderNo = params.order_no && params.order_no.stringValue;
    let partialCancelHrefUrlPath = params.partialCancelHrefUrlPath && params.partialCancelHrefUrlPath.stringValue;
    let currency = params.currency && params.currency.stringValue;

    if (!orderNo || !partialCancelHrefUrlPath || !currency) {
        res.json({
            success: false,
            message: 'Missing parameters for partial cancel'
        });
        return next();
    }

    let order = OrderMgr.getOrder(orderNo);
    if (!order) {
        res.json({ success: false, message: 'Order not found' });
        return next();
    }

    /**
     * Calls the partial cancel request service with the provided parameters.
     * @param {string} hrefPath - The partial cancel endpoint path.
     * @param {number} amountMinor - The amount to cancel in minor units.
     * @param {string} curr - The currency code.
     * @param {string} reference - The reference for the partial cancel.
     * @returns {Object} The result of the partial cancel request.
     */
    function partialCancelFn(hrefPath, amountMinor, curr, reference) {
        return paymentQueries.postPartialCancelRequest(hrefPath, amountMinor, curr, reference);
    }

    let result = AwpPartialCancel.handlePartialCancel(
        order,
        params,
        partialCancelHrefUrlPath,
        currency,
        partialCancelFn
    );

    res.json({
        success: result.success,
        message: result.message
    });
    return next();
});


module.exports = server.exports();
