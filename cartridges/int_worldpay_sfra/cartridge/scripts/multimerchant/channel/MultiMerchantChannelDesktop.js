'use strict';

var WorldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');

/**
 * Checks device name based on request userAgent.
 * @param {userAgent} - userAgent
 */
function MultiMerchantChannelDesktop() {
    this.value = WorldpayConstants.MULTI_MERCHANT_CHANNEL_DESKTOP_VALUE;
    this.name = WorldpayConstants.MULTI_MERCHANT_CHANNEL_DESKTOP_NAME; // this name will be used to lookup the credentials from CO
    this.isChannelMatched = function (userAgent) {
        var userAgentHelper = require('*/cartridge/scripts/multimerchant/channel/userAgentHelper');

        if (userAgentHelper.isCSC()) {
            this.name = WorldpayConstants.MULTI_MERCHANT_CHANNEL_CSC_NAME;
            return true;
        }
        // eslint-disable-next-line new-cap
        var UserAgent = userAgentHelper.UserAgent();
        var deviceInformation = null;
        if (userAgent) {
            deviceInformation = UserAgent.parse(userAgent);
        }
        if (deviceInformation && deviceInformation.isDesktop) {
            return true;
        }
        return false;
    };
}

module.exports = {
    MultiMerchantChannelDesktop: MultiMerchantChannelDesktop
};
