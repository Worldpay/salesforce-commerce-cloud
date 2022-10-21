'use strict';

var ArrayList = require('dw/util/ArrayList');

/**
 * Fetches the available channel objects and place to add new channel support
 * @returns {ArrayList} supportedChannels
 */
function getAvailableChannels() {
    var Desktop = require('*/cartridge/scripts/multimerchant/channel/multiMerchantChannelDesktop');
    var Mobile = require('*/cartridge/scripts/multimerchant/channel/multiMerchantChannelMobile');
    var IPad = require('*/cartridge/scripts/multimerchant/channel/multiMerchantChannelIPad');
    var CSC = require('*/cartridge/scripts/multimerchant/channel/multiMerchantChannelCSC');

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
    var co = CustomObjectMgr.getCustomObject('MultiMerchantByChannel', channelName);

    if (co && co.custom) {
        config.ChannelID = co.custom.Name;
        config.MerchantID = co.custom.MerchantID;
        config.GooglePayMerchantID = co.custom.GooglePayMerchantID;
        config.WorldpayMerchantNumber = co.custom.WorldpayMerchantNumber;
        config.XMLUserName = co.custom.XMLUserName;
        config.XMLPassword = co.custom.XMLPassword;
    }

    return config;
}

module.exports = {
    getChannelForUserAgent: getChannelForUserAgent,
    getChannelConfiguration: getChannelConfiguration
};
