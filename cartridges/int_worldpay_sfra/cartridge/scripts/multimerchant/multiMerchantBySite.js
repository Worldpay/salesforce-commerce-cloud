'use strict';

var globalHelper = require('*/cartridge/scripts/multimerchant/globalMultiMerchantHelper');

/**
 * Reads the Custom Object Configuration and creates a config object
 * @returns {Object} - object with the config details
 */
function getSiteConfiguration() {
    var config = {};
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var siteID = globalHelper.getCurrentSiteID();
    var co = CustomObjectMgr.getCustomObject('MultiMerchantBySite', siteID);

    if (co && co.custom) {
        config.siteID = co.custom.Name;
        config.XMLPassword = co.custom.XMLPassword;
        config.XMLUserName = co.custom.XMLUserName;
        config.MerchantID = co.custom.MerchantID;
    }
    return config;
}

module.exports = {
    getSiteConfiguration: getSiteConfiguration
};
