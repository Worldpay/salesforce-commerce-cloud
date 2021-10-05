'use strict';

/**
 * get value of configured label
 */
function Resources() {
    this.getResource = function (labelName, typeOfLabel) {
        var Site = require('dw/system/Site');
        var Resource = require('dw/web/Resource');
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var isConfigurationLableEnabled = Site.getCurrent().getCustomPreferenceValue('EnableConfigurableLabels');
        var labelNameValuePairCustomObject = CustomObjectMgr.getCustomObject('ConfiguredLabels', labelName);
        if (labelNameValuePairCustomObject && labelNameValuePairCustomObject.custom.labelValue && isConfigurationLableEnabled) {
            return labelNameValuePairCustomObject.custom.labelValue;
        }
        return Resource.msg(labelName, typeOfLabel, null);
    };
}

module.exports = Resources;
