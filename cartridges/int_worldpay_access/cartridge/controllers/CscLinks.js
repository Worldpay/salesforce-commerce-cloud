'use strict';

var server = require('server');
var Resource = require('dw/web/Resource');

const {
    getAccessRequestTypeFromRequestId,
    getFormTemplate,
    getCardPaymentsHref
} = require('*/cartridge/scripts/helpers/cscHelpers');

/**
 * Retrieves payment details and action-specific href for processing payment actions
 * @param {Object} req - The request object
 * @param {'refund' | 'settle' | 'partialSettle' | 'partialRefund'} actionType - The action type ('refund' or 'settle')
 * @returns {Object} Object containing success status, data, or error information
 */
function getPaymentActionsDetails(req, actionType) {
    const serviceFacade = require('*/cartridge/scripts/service/serviceFacade');
    const { getUrlPath } = require('*/cartridge/scripts/util/url');

    const params = req.httpParameterMap;
    const orderID = params.order_no.stringValue;
    const OrderMgr = require('dw/order/OrderMgr');
    const order = OrderMgr.getOrder(orderID);
    const txRef = (order && order.custom && order.custom.latestTransactionReference)
        ? String(order.custom.latestTransactionReference)
        : orderID;

    // Service Query Payment - It is required for getting the payment ID
    const paymentStatusResult = serviceFacade.queryPaymentStatus(txRef);
    if (paymentStatusResult.error) {
        return {
            success: false,
            errorMessage: Resource.msg('csc.error.query.payment.status', 'worldpaybm', null),
            orderID: orderID
        };
    }

    // Extract the href from cardPayments based on action type
    const actionHref = getCardPaymentsHref(paymentStatusResult.raw, actionType);
    const actionHrefUrlPath = getUrlPath(actionHref);

    if (!actionHref) {
        return {
            success: false,
            errorMessage: Resource.msgf('csc.error.action.link.not.found', 'worldpaybm', null, actionType.charAt(0).toUpperCase() + actionType.slice(1)),
            orderID: orderID
        };
    }

    if (order && order.custom.partialPending) {
        return {
            success: false,
            errorMessage: Resource.msgf('csc.error.partial.pending', 'worldpaybm', null, actionType.charAt(0).toUpperCase() + actionType.slice(1)),
            orderID: orderID
        };
    }

    return {
        success: true,
        orderID: orderID,
        paymentStatus: paymentStatusResult.status,
        actionHrefUrlPath: actionHrefUrlPath,
        actionType: actionType,
        currency: paymentStatusResult.raw.value.currency
    };
}

server.get('Get', function (req, res, next) {
    const params = req.httpParameterMap;
    const accessRequestType = params.accessReqType ? params.accessReqType.intValue : null;
    const requestType = getAccessRequestTypeFromRequestId(
        accessRequestType
    );

    if (!requestType) {
        res.render('/csc/error', {
            errorMessage: Resource.msg('csc.error.invalid.access.request.type', 'worldpaybm', null)
        });
        next();
        return;
    }

    const result = getPaymentActionsDetails(req, requestType);

    if (!result.success) {
        res.render('/csc/error', {
            orderID: result.orderID,
            errorMessage: result.errorMessage
        });
        next();
        return;
    }
    const template = getFormTemplate(requestType);
    res.render(template, {
        success: true,
        orderID: result.orderID,
        paymentStatus: result.paymentStatus,
        message: Resource.msg('csc.success.payment.status.retrieved', 'worldpaybm', null),
        actionHrefUrlPath: result.actionHrefUrlPath,
        currency: result.currency
    });

    next();
});

module.exports = server.exports();
