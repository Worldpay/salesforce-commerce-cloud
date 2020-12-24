'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var collections = require('../util/collections');
var ArrayList = require('../dw.util.Collection');
var WorldpayPreferences = require('../../mocks/models/worldpaypreferences');
var WorldpayConstants = require('../../mocks/models/worldpayconstants');
var URLUtils = require('../dw.web.URLUtils');

function proxyModel() {
    return proxyquire('../../../cartridges/int_worldpay_sfra/cartridge/models/payment', {
        '*/cartridge/scripts/util/collections': collections,
        '*/cartridge/scripts/common/Utils' : {
            getConfiguredLabel : function (name, type) {
                return "test label"
            }
        },
        'dw/order/PaymentMgr': {
            getApplicablePaymentMethods: function () {
                return [
                    {
                        ID: 'GIFT_CERTIFICATE',
                        name: 'Gift Certificate'
                    },
                    {
                        ID: 'CREDIT_CARD',
                        name: 'Credit Card'
                    }
                ];
            },
            getPaymentMethod: function () {
                return {
                    getApplicablePaymentCards: function () {
                        return [
                            {
                                cardType: 'Visa',
                                custom: { worldPayCardType: 'Visa' },
                                name: 'Visa',
                                UUID: 'some UUID'
                            },
                            {
                                cardType: 'Amex',
                                custom: { worldPayCardType: 'Amex' },
                                name: 'American Express',
                                UUID: 'some UUID'
                            },
                            {
                                cardType: 'Master Card',
                                custom: { worldPayCardType: 'Master Card' },
                                name: 'MasterCard'
                            },
                            {
                                cardType: 'Discover',
                                custom: { worldPayCardType: 'Discover' },
                                name: 'Discover'
                            }
                        ];
                    }
                };
            },
            getApplicablePaymentCards: function () {
                return ['applicable payment cards'];
            }
        },
        'dw/web/Resource': {
            msg: function () {
                return 'someString';
            },
            msgf: function () {
                return 'someString';
            }
        },
        '*/cartridge/scripts/order/WorldpayPayment': {
            applicablePaymentMethods: function () {
                return {
                    applicableAPMs: [
                        {
                            ID: 'GIFT_CERTIFICATE',
                            name: 'Gift Certificate'
                        },
                        {
                            ID: 'CREDIT_CARD',
                            name: 'Credit Card'
                        }
                    ]
                };
            }
        },
        'dw/util/ArrayList': ArrayList,
        '*/cartridge/scripts/util/array': collections,
        '*/cartridge/scripts/object/WorldpayPreferences': WorldpayPreferences,
        '*/cartridge/scripts/common/WorldpayConstants': WorldpayConstants,
        'dw/web/URLUtils': URLUtils,
        'dw/util/StringUtils': {
            formatMoney: function () {
                return 'formatted money';
            }
        },
        'dw/order/PaymentInstrument': {}
    });
}

module.exports = proxyModel();
