'use strict';

var assert = require('chai').assert;
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../../mockModuleSuperModule');
var baseCheckoutHelpersMock = require('../../../../../test/mocks/scripts/checkout/baseCheckoutHelpers');
var collections = require('../../../../../test/mocks/util/collections');
var renderTemplateHelper = require('../../../../mocks/helpers/renderTemplateHelper');

describe('checkoutHelpers', function () {
    var checkoutHelpers;
    describe('placeOrder', function () {
        var setConfirmationStatusStub = sinon.stub();
        var setExportStatusStub = sinon.stub();
        var status = {
            OK: 0,
            ERROR: 1
        };
        var orderMgr = {
            createOrder: function () {
                return { order: 'new order' };
            },
            placeOrder: function () {
                return status.OK;
            },
            failOrder: function () {
                return { order: 'failed order' };
            }
        };
        var PaymentMgr = {
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
            }
        };
        var order = {
            setConfirmationStatus: setConfirmationStatusStub,
            setExportStatus: setExportStatusStub
        };
        before(function () {
            mockSuperModule.create(baseCheckoutHelpersMock);
            checkoutHelpers = proxyquire('../../../../../cartridges/int_worldpay_sfra/cartridge/scripts/checkout/checkoutHelpers', {
                'dw/system/Transaction': {
                    wrap: function (callback) {
                        callback.call(this);
                    },
                    begin: function () {},
                    commit: function () {}
                },
                'dw/order/PaymentMgr': PaymentMgr,
                'dw/order/OrderMgr': orderMgr,
                'dw/order/Order': order,
                'dw/system/Status': status,
                '*/cartridge/scripts/util/collections': collections,
                '*/cartridge/scripts/renderTemplateHelper': renderTemplateHelper
            });
        });

        after(function () {
            mockSuperModule.remove();
        });

        beforeEach(function () {
            setConfirmationStatusStub.reset();
            setExportStatusStub.reset();
        });
        it('should return result with error = false when no exception ', function () {
            var result = checkoutHelpers.placeOrder(order);

            assert.isTrue(setConfirmationStatusStub.calledOnce);
            assert.isFalse(result.error);
        });

        it('should return result with error = true when exception is thrown', function () {
            var order = {}; // eslint-disable-line
            var result = checkoutHelpers.placeOrder(order);

            assert.isTrue(setConfirmationStatusStub.notCalled);
            assert.isTrue(result.error);
        });
    });
});
