'use strict';

var Site = require('dw/system/Site');
var HookMgr = require('dw/system/HookMgr');

/**
 * returns the selected type of MultiMerchant
 * @returns {string} - Selected Type
 */
function getMultiMerchantSelection() {
    return Site.current.getCustomPreferenceValue('multiMerchantType').value;
}

/**
 * returns the current Site ID
 * @returns {string} - Current Site ID
 */
function getCurrentSiteID() {
    return Site.getCurrent().getID();
}

/**
 * This sets the credentials into the service based on type
 * @param {Service} svc - Service Object
 * @returns {Service} svc - Udated Service Object
 */
function getMultiMerchantConfiguration() {
    var type = getMultiMerchantSelection();
    var config = {};

    if (type && HookMgr.hasHook('app.multi.merchant.by.' + type)) {
        config = HookMgr.callHook('app.multi.merchant.by.' + type, 'getMultiMerchantConfiguraionsFromCO');
    }
    return config;
}


module.exports = {
    getMultiMerchantSelection: getMultiMerchantSelection,
    getCurrentSiteID: getCurrentSiteID,
    getMultiMerchantConfiguration: getMultiMerchantConfiguration
};
