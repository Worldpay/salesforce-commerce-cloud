'use strict';

var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');

/**
 * Checks device name based on request userAgent.
 * @param {userAgent} - userAgent
 */
function MultiMerchantChannelCSC() {
    this.value = worldpayConstants.MULTI_MERCHANT_CHANNEL_CSC_VALUE;
    this.name = worldpayConstants.MULTI_MERCHANT_CHANNEL_CSC_NAME;// this name will be used to lookup the credentials from CO
    // eslint-disable-next-line no-unused-vars
    this.isChannelMatched = function (userAgent) {
        var clientId = request.clientId;
        if (clientId && clientId === 'dw.csc') {
            return true;
        }
        return false;
    };
}

module.exports = {
    MultiMerchantChannelCSC: MultiMerchantChannelCSC
};
