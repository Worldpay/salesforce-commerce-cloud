'use strict';
var base = module.superModule;
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
/**
 * @param {order} order object
 * @returns {result} order status error
 */
function placeOrder(order) {
    var result = {
        error: false
    };

    try {
        Transaction.begin();
        var placeOrderStatus = OrderMgr.placeOrder(order);
        if (placeOrderStatus === Status.ERROR) {
            throw new Error();
        }
        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
        Transaction.commit();
    } catch (e) {
        Transaction.wrap(function () {
            OrderMgr.failOrder(order);
        });
        result.error = true;
    }

    return result;
}


module.exports = {
    getFirstNonDefaultShipmentWithProductLineItems: base.getFirstNonDefaultShipmentWithProductLineItems,
    ensureNoEmptyShipments: base.ensureNoEmptyShipments,
    getProductLineItem: base.getProductLineItem,
    isShippingAddressInitialized: base.isShippingAddressInitialized,
    prepareShippingForm: base.prepareShippingForm,
    prepareBillingForm: base.prepareBillingForm,
    copyCustomerAddressToShipment: base.copyCustomerAddressToShipment,
    copyCustomerAddressToBilling: base.copyCustomerAddressToBilling,
    copyShippingAddressToShipment: base.copyShippingAddressToShipment,
    copyBillingAddressToBasket: base.copyBillingAddressToBasket,
    validateFields: base.validateFields,
    validateShippingForm: base.validateShippingForm,
    validateBillingForm: base.validateBillingForm,
    validatePayment: base.validatePayment,
    validateCreditCard: base.validateCreditCard,
    calculatePaymentTransaction: base.calculatePaymentTransaction,
    recalculateBasket: base.recalculateBasket,
    handlePayments: base.handlePayments,
    createOrder: base.createOrder,
    placeOrder: placeOrder,
    savePaymentInstrumentToWallet: base.savePaymentInstrumentToWallet,
    getRenderedPaymentInstruments: base.getRenderedPaymentInstruments,
    sendConfirmationEmail: base.sendConfirmationEmail,
    ensureValidShipments: base.ensureValidShipments,
    setGift: base.setGift
};
