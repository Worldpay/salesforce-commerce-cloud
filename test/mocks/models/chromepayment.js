'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var collections = require('../util/collections');
var ArrayList = require('../dw.util.Collection');

function proxyModel() {
    return proxyquire('../../../cartridges/int_worldpay_sfra/cartridge/models/chromepayment', {
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
                        return new ArrayList ([
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
                        ]);
                    }
                };
            },
            getApplicablePaymentCards: function () {
                return ['applicable payment cards'];
            },
        },
        'dw/util/ArrayList': ArrayList,
        '*/cartridge/scripts/util/array': collections,
        'dw/order/PaymentInstrument': {},
        'dw/web/URLUtils': {
            https: function(){
                return 'some url';
            }
        },
    });
}

module.exports = proxyModel();
