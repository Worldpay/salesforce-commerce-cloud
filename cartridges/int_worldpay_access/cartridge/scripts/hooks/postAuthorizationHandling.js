'use strict';

const URLUtils = require('dw/web/URLUtils');
const awpConstants = require('*/cartridge/scripts/common/awpConstants');

exports.postAuthorization = function (handlePaymentResult, order /* , options */) {
    const pis = order.getPaymentInstruments(awpConstants.WORLDPAY);
    const hasPI = pis && ((pis.length && pis.length > 0) || (pis.size && pis.size() > 0));
    if (!hasPI) return {};

    return {
        error: false,
        continueUrl: URLUtils.url('AWPCheckoutServices-Redirect', 'orderNo', order.orderNo).toString()
    };
};
