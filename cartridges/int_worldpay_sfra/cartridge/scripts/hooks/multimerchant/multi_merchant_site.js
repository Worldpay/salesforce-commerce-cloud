'use strict';

/**
 * Override the Service Credentials for the type Site
 * @param {Service} service - Service
 * @returns {Service} - Updated Service
 */
function getMultiMerchantConfiguraionsFromCO() {
    var siteHelper = require('*/cartridge/scripts/multimerchant/multiMerchantBySite');
    var result = {};
    var config = siteHelper.getSiteConfiguration();
    if (config &&
        Object.prototype.hasOwnProperty.call(config, 'MerchantID') &&
        Object.prototype.hasOwnProperty.call(config, 'XMLUserName') &&
        Object.prototype.hasOwnProperty.call(config, 'XMLPassword')) {
        result = config;
    }
    return result;
}

module.exports = {
    getMultiMerchantConfiguraionsFromCO: getMultiMerchantConfiguraionsFromCO
};
