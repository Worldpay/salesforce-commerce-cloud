'use strict';

/**
 * Reads the Custom Object Configuration and creates a config object
 * @param {paymentMethodID} paymentMethodID - paymentMethodID
 * @returns {Object} - object with the config details
 */
function getPaymentMethodConfiguration(paymentMethodID) {
    var config = {};
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var CO = CustomObjectMgr.getCustomObject('MultiMerchantByPaymentMethod', paymentMethodID);

    if (CO && CO.custom) {
        config.paymentMethodID = CO.custom.ID;
        config.MerchantID = CO.custom.merchantID;
        config.GooglePayMerchantID = CO.custom.googlePayMerchantID;
        config.WorldpayMerchantNumber = CO.custom.mandateNumber;
        config.XMLUserName = CO.custom.userName;
        config.XMLPassword = CO.custom.password;
    }
    return config;
}

module.exports = {
    getPaymentMethodConfiguration: getPaymentMethodConfiguration
};
