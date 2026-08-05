'use strict';

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
// const Logger = require('dw/system/Logger').getLogger('clickToPay', 'clickToPay');

const ClickToPayService = LocalServiceRegistry.createService('int_worldpay.clicktopay.post', {
    createRequest: function(svc, params) {
        svc.setURL(params.endpoint);
        svc.setRequestMethod(params.method);
        
        for each(let key in params.headers.keySet()) {
            svc.addHeader(key, params.headers.get(key));
        }
        
        if (params.body) {
            return JSON.stringify(params.body);
        }
    },
    parseResponse: function(svc, res) {
        return { code: res.statusCode, body: res.text };
    },
    filterLogMessage: function (msg) {
        return msg;
    }
});

exports.ClickToPayService = ClickToPayService;
