'use strict';

const base = module.superModule;

/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current user's basket/order
 * @param {Object} options - options for view rendering
 *   - containerView: 'basket' | 'order'
 *   - usingMultiShipping, countryCode, etc. (din SFRA)
 */
function OrderModel(lineItemContainer, options) {
    // eslint-disable-next-line no-param-reassign
    options = options || {};
    if (!options.containerView) {
        // eslint-disable-next-line no-param-reassign
        options.containerView = 'basket';
    }

    base.call(this, lineItemContainer, options);

    if (this.orderNumber != null) {
        try {
            const OrderMgr = require('dw/order/OrderMgr');
            const orderobj = OrderMgr.getOrder(this.orderNumber);
            if (orderobj) {
                this.confstatus = orderobj.confirmationStatus;
            }
        } catch (e) { 
            this.confstatus = null;
        }
    }

    this.isReccuring = lineItemContainer.custom.isRecurring;

    this.Resources = {
        getResource: function (labelName, typeOfLabel) {
            try {
                const Site = require('dw/system/Site');
                const Resource = require('dw/web/Resource');
                const CustomObjectMgr = require('dw/object/CustomObjectMgr');
                const isConfigurationLableEnabled = Site.getCurrent().getCustomPreferenceValue('AWPEnableConfigurableLabels');
                const labelObj = CustomObjectMgr.getCustomObject('ConfiguredLabels', labelName);
                if (labelObj && labelObj.custom.labelValue && isConfigurationLableEnabled) {
                    return labelObj.custom.labelValue;
                }
                return Resource.msg(labelName, typeOfLabel, null);
            } catch (e) {
                const ResourceFallback = require('dw/web/Resource');
                return ResourceFallback.msg(labelName, typeOfLabel, null);
            }
        }
    };
}

OrderModel.prototype = Object.create(base.prototype);
OrderModel.prototype.constructor = OrderModel;

module.exports = OrderModel;