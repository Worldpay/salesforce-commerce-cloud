'use strict';

var assert = require('chai').assert;
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Array = require('../../../mocks/dw.util.Collection');

var basket = {
    totalGrossPrice: {
        value: 'some value'
    },
    totals: {
        currencyCode: 'USD',
        grandTotalValue: 100,
        orderLevelDiscountTotal: {
            value: 10
        },
        shippingLevelDiscountTotal: {
            value: 10
        },
        decimalTaxValue : 2
    },
    lineItems: {
        label: 'prd name',
        amount: {
            currency: 'USD',
            value: 100
        }
    },
    shipments: [
        {
            UUID: '00001',
            shippingMethods: [
                {
                    ID: '001',
                    displayName: 'Ground',
                    description: 'Order received within 7-10 business days',
                    custom: {
                        estimatedArrivalTime: '7-10 Business Days'
                    },
                    decimalShippingCost: 100
                },
                {
                    ID: '002',
                    displayName: '2-Day Express',
                    description: 'Order received in 2 business days',
                    custom: {
                        estimatedArrivalTime: '2 Business Days'
                    },
                    decimalShippingCost: 100
                },
                {
                    ID: '003',
                    displayName: 'Overnight',
                    description: 'Order received the next business day',
                    custom: {
                        estimatedArrivalTime: 'Next Day'
                    },
                    decimalShippingCost: 100
                }
            ],
            selectedShippingMethod : '001'
        }
    ],
    shippingMethods: {
        id: 'Ground',
        label: 'shipping method name' + ' : ' + 'arrival time',
        amount: {
            currency: 'USD',
            value: 100
        }
    }
};
var req = {
    currentCustomer: {
        raw : 'text'
    },
    geolocation: {}
};

describe('Chrome Payment', function () {
    var ChromePaymentModel = require('../../../mocks/models/chromepayment');
    it('Consumes cart model and creates chrome payment model', function () {
        var result = new ChromePaymentModel(basket, req);
        assert.isNotNull(result);
        assert.isNotNull(result.details);
        assert.isNotNull(result.supportedInstruments);
        assert.equal(result.details.total.amount.currency, 'USD');
        assert.isNotNull(result.supportedInstruments[0].supportedMethods, 'basic-card');
    });
});
