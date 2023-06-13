'use strict';

/**
 * Reads the Custom Object Configuration and creates a config object
 * @param {paymentMethodID} paymentMethodID - paymentMethodID
 * @returns {Object} - object with the config details
 */
function getPaymentMethodConfiguration(paymentMethodID) {
    var config = {};
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var co = CustomObjectMgr.getCustomObject('MultiMerchantByPaymentMethod', paymentMethodID);

    if (co && co.custom) {
        config.paymentMethodID = co.custom.ID;
        config.MerchantID = co.custom.merchantID;
        config.GooglePayMerchantID = co.custom.googlePayMerchantID;
        config.GatewayMerchantID = co.custom.gatewayMerchantID;
        config.WorldpayMerchantNumber = co.custom.mandateNumber;
        config.XMLUserName = co.custom.userName;
        config.XMLPassword = co.custom.password;
    }
    return config;
}

module.exports = {
    getPaymentMethodConfiguration: getPaymentMethodConfiguration
};
