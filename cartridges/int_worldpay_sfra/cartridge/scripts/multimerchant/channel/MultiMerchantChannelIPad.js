'use strict';

var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');

/**
 * Checks device name based on request userAgent.
 * @param {userAgent} - userAgent
 */
function MultiMerchantChannelIPad() {
    this.value = WorldpayConstants.MULTI_MERCHANT_CHANNEL_IPAD_VALUE;
    this.name = WorldpayConstants.MULTI_MERCHANT_CHANNEL_IPAD_NAME;// this name will be used to lookup the credentials from CO
    this.isChannelMatched = function (userAgent) {
        var UserAgentHelper = require('*/cartridge/scripts/multimerchant/channel/UserAgentHelper');

        if (UserAgentHelper.isCSC()) {
            this.name = WorldpayConstants.MULTI_MERCHANT_CHANNEL_CSC_NAME;
            return true;
        }
        // eslint-disable-next-line new-cap
        var UserAgent = UserAgentHelper.UserAgent();
        var deviceInformation = null;
        if (userAgent) {
            deviceInformation = UserAgent.parse(userAgent);
        }
        if (deviceInformation && deviceInformation.isMobile && deviceInformation.isiPad) {
            return true;
        }
        return false;
    };
}

module.exports = {
    MultiMerchantChannelIPad: MultiMerchantChannelIPad
};
