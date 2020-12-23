'use strict';

/**
 * Override the Service Credentials for the type payment method
 * @param {paymentMthd} paymentMthd - paymentMthd
 * @returns {Object} - object with the config details
 */
function getMultiMerchantConfiguraionsFromCO(paymentMthd) {
    var PaymentMethodHelper = require('*/cartridge/scripts/multimerchant/MultiMerchantByPaymentMethod');
    var result = {};
    var paymentMethodID;
    if (paymentMthd) {
        paymentMethodID = paymentMthd.ID;
    }
    var config = PaymentMethodHelper.getPaymentMethodConfiguration(paymentMethodID);
    if (config && Object.prototype.hasOwnProperty.call(config, 'MerchantID') &&
        Object.prototype.hasOwnProperty.call(config, 'XMLUserName') &&
        Object.prototype.hasOwnProperty.call(config, 'XMLPassword')) {
        result = config;
    }

    return result;
}
module.exports = {
    getMultiMerchantConfiguraionsFromCO: getMultiMerchantConfiguraionsFromCO
};
