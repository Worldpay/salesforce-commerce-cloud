'use strict';

var base = module.superModule;
var PaymentMgr = require('dw/order/PaymentMgr');

/**
 * Gets the Merchant for GooglePay
 * @returns {Object} - Google Merchant ID
 */
function getMerchantIdForGpay() {
    var Site = require('dw/system/Site');
    var isMultiMerchantSupportEnabled = Site.current.getCustomPreferenceValue('enableMultiMerchantSupport');
    var GlobalHelper = require('*/cartridge/scripts/multimerchant/GlobalMultiMerchantHelper');
    var multiMerchantType = Site.current.getCustomPreferenceValue('multiMerchantType').value;
    var paymentMthd = PaymentMgr.getPaymentMethod('PAYWITHGOOGLE-SSL');
    var googlePayMerchantID;
    if (isMultiMerchantSupportEnabled && (multiMerchantType === 'channel' || multiMerchantType === 'paymentMethod')) {
        var config = GlobalHelper.getMultiMerchantConfiguration(paymentMthd);
        if (config && config.GooglePayMerchantID) {
            googlePayMerchantID = config.GooglePayMerchantID;
        }
    } else {
        googlePayMerchantID = Site.current.getCustomPreferenceValue('googlePayMerchantID');
    }
    return googlePayMerchantID;
}

/**
 * Gets the GooglePay configuration Object
 * @return {Object} - Result
 */
function getGooglePayConfig() {
    var Site = require('dw/system/Site');
    let result = {};
    result.googlePayMerchantID = getMerchantIdForGpay();
    result.googlePayEnvironment = Site.current.getCustomPreferenceValue('googlePayEnvironment');
    result.googleMerchantName = Site.current.getCustomPreferenceValue('googleMerchantName');
    result.gatewayMerchantId = Site.current.getCustomPreferenceValue('gatewayMerchantId');
    result.gatewayMerchantName = Site.current.getCustomPreferenceValue('gatewayMerchantName');
    return result;
}


/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @param {Object} options - The current order's line items
 * @constructor
 */
function OrderModel(lineItemContainer, options) {
    var OrderMgr = require('dw/order/OrderMgr');
    base.call(this, lineItemContainer, options);
    if (this.orderNumber != null) {
        var orderobj = OrderMgr.getOrder(this.orderNumber);
        this.confstatus = orderobj.confirmationStatus;
    }
    this.Resources = {
        getResource: function (labelName, typeOfLabel) {
            var Site = require('dw/system/Site');
            var Resource = require('dw/web/Resource');
            var CustomObjectMgr = require('dw/object/CustomObjectMgr');
            var isConfigurationLableEnabled = Site.getCurrent().getCustomPreferenceValue('EnableConfigurableLabels');
            var labelNameValuePairCustomObject = CustomObjectMgr.getCustomObject('ConfiguredLabels', labelName);
            if (labelNameValuePairCustomObject && labelNameValuePairCustomObject.custom.labelValue && isConfigurationLableEnabled) {
                return labelNameValuePairCustomObject.custom.labelValue;
            }
            return Resource.msg(labelName, typeOfLabel, null);
        }
    };
    if (PaymentMgr.getPaymentMethod('PAYWITHGOOGLE-SSL').isActive()) {
        this.googlepay = getGooglePayConfig();
    }
}

OrderModel.prototype = Object.create(base.prototype);
module.exports = OrderModel;
