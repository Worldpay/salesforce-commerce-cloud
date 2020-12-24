'use strict';

var ArrayList = require('dw/util/ArrayList');

/**
 * Fetches the available channel objects and place to add new channel support
 * @returns {ArrayList} supportedChannels
 */
function getAvailableChannels() {
    var Desktop = require('*/cartridge/scripts/multimerchant/channel/MultiMerchantChannelDesktop');
    var Mobile = require('*/cartridge/scripts/multimerchant/channel/MultiMerchantChannelMobile');
    var IPad = require('*/cartridge/scripts/multimerchant/channel/MultiMerchantChannelIPad');
    var CSC = require('*/cartridge/scripts/multimerchant/channel/MultiMerchantChannelCSC');

    var supportedChannels = new ArrayList();
    supportedChannels.add(new Desktop.MultiMerchantChannelDesktop());
    supportedChannels.add(new Mobile.MultiMerchantChannelMobile());

    supportedChannels.add(new IPad.MultiMerchantChannelIPad());
    supportedChannels.add(new CSC.MultiMerchantChannelCSC());

    return supportedChannels;
}


/**
 * Bring up selected the channels from BM
 * @returns {ArrayList} selectedChannelList
 */
function getSelectedChannels() {
    var Site = require('dw/system/Site');
    var selectedBMChannels;
    var selectedChannelList;

    selectedBMChannels = Site.getCurrent().getCustomPreferenceValue('multiMerchantChannelList');
    selectedBMChannels = selectedBMChannels.map(function (channel) {
        return channel.value;
    });
    selectedChannelList = new ArrayList(selectedBMChannels);
    return selectedChannelList;
}

/**
 * Filter the channels from available list
 * @param {Array} selectedChannels - selectedChannels
 * @param {Array} availableChannels - availableChannels
 * @returns {Array} - filtered channels
 */
function filterChannels(selectedChannels, availableChannels) {
    var filteredChannels = [];
    var availableChannelArray = (availableChannels.length > 0) ? availableChannels.toArray() : [];

    filteredChannels = availableChannelArray.filter(function (channel) {
        return (selectedChannels.contains(channel.value));
    });
    return filteredChannels;
}

/**
 * Pull the channel based on user agent
 * @param {string} userAgent - User agent from request
 * @returns {string} - Matched channel
 */
function getChannelForUserAgent(userAgent) {
    var selectedChannels = [];
    var availableChannels = [];
    var filteredChannels = [];
    var isChannelMatchFound;
    var matchedChannel;

    selectedChannels = getSelectedChannels();
    availableChannels = getAvailableChannels();
    filteredChannels = filterChannels(selectedChannels, availableChannels);
    for (var channel = 0; channel < filteredChannels.length; channel++) {
        isChannelMatchFound = filteredChannels[channel].isChannelMatched(userAgent);
        if (isChannelMatchFound) {
            matchedChannel = filteredChannels[channel].name;
            break;
        }
    }
    return matchedChannel;
}

/**
 * Reads the Custom Object Configuration and creates a config object
 * @param {string} channelName - channelName
 * @returns {Object} - object with the config details
 */
function getChannelConfiguration(channelName) {
    var config = {};
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var CO = CustomObjectMgr.getCustomObject('MultiMerchantByChannel', channelName);

    if (CO && CO.custom) {
        config.ChannelID = CO.custom.Name;
        config.MerchantID = CO.custom.MerchantID;
        config.GooglePayMerchantID = CO.custom.GooglePayMerchantID;
        config.WorldpayMerchantNumber = CO.custom.WorldpayMerchantNumber;
        config.XMLUserName = CO.custom.XMLUserName;
        config.XMLPassword = CO.custom.XMLPassword;
    }

    return config;
}

module.exports = {
    getChannelForUserAgent: getChannelForUserAgent,
    getChannelConfiguration: getChannelConfiguration
};
