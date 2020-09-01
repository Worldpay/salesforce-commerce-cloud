'use strict';

var GlobalHelper = require('*/cartridge/scripts/multimerchant/GlobalMultiMerchantHelper');

/**
 * Reads the Custom Object Configuration and creates a config object
 * @returns {Object} - object with the config details
 */
function getSiteConfiguration() {
    var config = {};
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var siteID = GlobalHelper.getCurrentSiteID();
    var CO = CustomObjectMgr.getCustomObject('MultiMerchantBySite', siteID);

    if (CO && CO.custom) {
        config.siteID = CO.custom.Name;
        config.XMLPassword = CO.custom.XMLPassword;
        config.XMLUserName = CO.custom.XMLUserName;
        config.MerchantID = CO.custom.MerchantID;
    }

    return config;
}

module.exports = {
    getSiteConfiguration: getSiteConfiguration
};
