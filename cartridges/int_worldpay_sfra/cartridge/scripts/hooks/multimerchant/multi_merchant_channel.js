'use strict';

/**
 * Override the Service Credentials for the type Site
 * @param {Service} service - Service
 * @returns {Service} - Updated Service
 */
function getMultiMerchantConfiguraionsFromCO() {
    var ChannelHelper = require('*/cartridge/scripts/multimerchant/MultiMerchantByChannel');
    var userAgent = request.getHttpUserAgent();
    var result = {};
    var channelName = ChannelHelper.getChannelForUserAgent(userAgent);
    channelName = (!channelName) ? 'Default' : channelName;

    var config = ChannelHelper.getChannelConfiguration(channelName);
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
