'use strict';

var System = require('dw/system/System');

/**
 * Methood to get user-agent header value
 * @param {string} serviceUrl - Service url
 * @returns {string} - header value
 */
function getUserAgentHeader(serviceUrl) {
    const COMPATIBILITY_VERSION = (parseFloat(System.getCompatibilityMode()) / 100).toString();
    const hostName = System.getInstanceHostname();
    const integrationType = serviceUrl.indexOf('/payment_pages') > 0 ? 'Offsite' : 'Onsite';
    const environment = serviceUrl.indexOf('try.') > 0 ? 'Try' : 'Live'

    const {
        WORLDPAY_PLUGIN
    } = require('*/cartridge/scripts/common/constants/index');

    return `${WORLDPAY_PLUGIN.PLATFORM_NAME}/${COMPATIBILITY_VERSION} (${hostName}) ${WORLDPAY_PLUGIN.PLUGIN_NAME}/${WORLDPAY_PLUGIN.PLUGIN_VERSION} ${integrationType} ${environment}`   
}

module.exports = { getUserAgentHeader: getUserAgentHeader };