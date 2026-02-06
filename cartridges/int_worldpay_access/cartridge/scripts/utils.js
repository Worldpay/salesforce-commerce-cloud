'use strict';

const Site = require('dw/system/Site');
const Logger = require('dw/system/Logger');

/**
 * Validate IP Address range
 * @param {string} requestRemoteAddress - remote IP address of request
 * @return {Object} returns an json object
 */
function validateIP(requestRemoteAddress) {
    const customPreferences = Site.getCurrent().preferences.custom;
    const ipAddressList = customPreferences.WorldpayNotificationIPAddresses;

    if (!ipAddressList) {
        Logger.getLogger('awp').error('Worldpay Notification IPAddresses is not set');
        return { error: true };
    }

    if (ipAddressList.indexOf(requestRemoteAddress) < 0) {
        Logger.getLogger('awp').error(`Worldpay Notification IPAddresses ${requestRemoteAddress} is not whitelisted`);
        return { error: true };
        
    }
    
    return { success: true, error: false };
}

module.exports = {
    validateIP: validateIP
};
