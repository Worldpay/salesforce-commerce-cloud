/**
 * WorldpayPreferences object contains all configuration data,
 * which are necessary to call the worldpay service.
 * This data is retrieved from custom site preferences.
 *
 * To include this script use:
 *
 */

var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');

/**
 * an Empty function for prototype
 */
function WorldpayPreferences() {}

/**
 * Returns the site preference
 * @param {string} preference - Current users's order
 * @return {Object} returns site preference value
 */
function getSitePeference(preference) {
    var result = null;
    var loggerSource = '[worldPayPreferences.js]';
    var Logger = require('dw/system/Logger');
    result = Site.getCurrent().getCustomPreferenceValue(preference);
    if (!result) {
        // supress error. WorldpayPaymentMethodMaskIncludes is not mandatory and can be empty
        if (!(('WorldpayPaymentMethodMaskIncludes'.equals(preference)) || ('WorldpayPaymentMethodMaskExcludes'.equals(preference)) ||
                ('WorldpayConfigurablePaymentMethodMask'.equals(preference)) || ('WorldpayMACSecretCode'.equals(preference)))) {
            Logger.error('{0} Site specific custom preference "{1}" is missing.',
                loggerSource, preference);
        }
    }
    return result;
}
WorldpayPreferences.prototype = {
    worldPayPreferencesInit: function (paymentMthd) {
        if (paymentMthd && paymentMthd.custom.merchantID) {
            this.merchantCode = paymentMthd.custom.merchantID;
            this.userName = paymentMthd.custom.userName;
            this.XMLPassword = paymentMthd.custom.password;
        } else {
            this.merchantCode = getSitePeference('WorldpayMerchantCode');
            this.userName = '';
            this.XMLPassword = '';
        }

        this.MACSecretCode = getSitePeference('WorldpayMACSecretCode');
        this.captureServiceTrackingId = getSitePeference('captureservicetrackingid');
        this.currencyExponent = getSitePeference('WorldpayCurrencyExponent');
        this.successURL = getSitePeference('WorldpayRedirectSuccessURL');
        this.pendingURL = getSitePeference('WorldpayRedirectPendingURL');
        this.failureURL = getSitePeference('WorldpayRedirectFailureURL');
        this.cancelURL = getSitePeference('WorldpayRedirectCancelURL');
        this.termURL = getSitePeference('WorldpayTermURL');
        this.paymentMethodsIncludes = getSitePeference('WorldpayPaymentMethodMaskIncludes');
        this.paymentMethodsExcludes = getSitePeference('WorldpayPaymentMethodMaskExcludes');
        this.configurablePaymentMethods = getSitePeference('WorldpayConfigurablePaymentMethodMask');
        this.enableAPMLookUpService = getSitePeference('EnableAPMLookUpService');
        this.XMLVersion = '1.4';
        this.country = this.getLocale().getCountry();
        this.language = this.getLocale().getLanguage();
        this.worldPayIdealBankList = getSitePeference('WorldpayIdealBankList');
        this.worldPayEnableCardSelection = getSitePeference('WorldpayEnableCardSelection');
        this.worldPayPaymentMethodMaskIncludes = getSitePeference('WorldpayPaymentMethodMaskIncludes');
        this.worldPayMerchantNumber = getSitePeference('WorldpayMerchantNumber');
        this.worldPayEnableTokenization = Site.getCurrent().getCustomPreferenceValue('WorldpayEnableTokenization');
        this.worldPayInstallationId = getSitePeference('WorldpayInstallationId');
        this.tokenType = getSitePeference('tokenType');
        return this;
    },

    missingPreferences: function () {
        return (this.merchantCode.value != null ||
            this.currencyExponent.value != null || this.captureServiceTrackingId.value != null);
    },


    missingRedirectPreferences: function () {
        return (this.merchantCode.value != null ||
            this.currencyExponent.value != null ||
            this.successURL.value != null ||
            this.pendingURL.value != null ||
            this.failureURL.value != null ||
            this.cancelURL.value != null ||
            this.MACSecretCode.value != null ||
            this.captureServiceTrackingId.value != null);
    },
    isDefinedPymentMethodsExcludes: function () {
        return (this.paymentMethodsExcludes.value == null);
    },

    getSuccessURL: function () {
        var result = '';
        result = URLUtils.https(this.successURL);
        return result;
    },

    getPendingURL: function () {
        var result = '';
        result = URLUtils.https(this.pendingURL);
        return result;
    },

    getFailureURL: function () {
        var result = '';
        result = URLUtils.https(this.failureURL);
        return result;
    },

    getCancelURL: function () {
        var result = '';
        result = URLUtils.https(this.cancelURL);
        return result;
    },

    getTermURL: function () {
        var result = '';
        result = URLUtils.https(this.termURL);
        return result;
    },

    /**
     * Returns the current locale of the current site.
     * If locale is set to default, the return value is 'en_US'
     * @return {string} returns site locale object
     */
    getLocale: function () {
        // assume that en_US is the default locale
        var Locale = require('dw/util/Locale');
        var result = Locale.getLocale('en_US');
        if (Site.getCurrent().getDefaultLocale() !== 'default') {
            result = Locale.getLocale(Site.getCurrent().getDefaultLocale());
        }
        return result;
    }
};
module.exports = WorldpayPreferences;
