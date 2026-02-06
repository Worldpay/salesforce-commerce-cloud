'use strict';

/**
 * get value of configured label
 */
function Resources() {
    this.getResource = function (labelName, typeOfLabel) {
        const Site = require('dw/system/Site');
        const Resource = require('dw/web/Resource');
        const CustomObjectMgr = require('dw/object/CustomObjectMgr');
        const isConfigurationLableEnabled = Site.getCurrent().getCustomPreferenceValue('AWPEnableConfigurableLabels');
        const labelNameValuePairCustomObject = CustomObjectMgr.getCustomObject('ConfiguredLabels', labelName);
        if (labelNameValuePairCustomObject && labelNameValuePairCustomObject.custom.labelValue && isConfigurationLableEnabled) {
            return labelNameValuePairCustomObject.custom.labelValue;
        }
        return Resource.msg(labelName, typeOfLabel, null);
    };
}

module.exports = Resources;
