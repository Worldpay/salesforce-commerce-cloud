'use strict';

const base = module.superModule;

const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');
const Status = require('dw/system/Status');
const Transaction = require('dw/system/Transaction');

/**
 * Attempts to create an order from the current basket
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {dw.order.Order} The order object created from the current basket
 */
function createOrder(currentBasket) {
    let order;
    order = base.createOrder(currentBasket);
    // eslint-disable-next-line no-undef
    session.privacy.currentOrderNo = order.orderNo;

    return order;
}

/**
 * Places an order and handles the transaction.
 * @param {dw.order.Order} order - The order object to be placed
 * @returns {Object} result - An object containing the error status
 */
function placeOrder(order) {
    let result = {
        error: false
    };

    try {
        Transaction.begin();
        const placeOrderStatus = OrderMgr.placeOrder(order);
        if (placeOrderStatus === Status.ERROR) {
            throw new Error();
        }
        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
        Transaction.commit();
    } catch (e) {
        Transaction.wrap(function () {
            OrderMgr.failOrder(order, true);
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
    prepareCustomerForm: base.prepareCustomerForm,
    prepareShippingForm: base.prepareShippingForm,
    prepareBillingForm: base.prepareBillingForm,
    copyCustomerAddressToShipment: base.copyCustomerAddressToShipment,
    copyCustomerAddressToBilling: base.copyCustomerAddressToBilling,
    copyShippingAddressToShipment: base.copyShippingAddressToShipment,
    copyBillingAddressToBasket: base.copyBillingAddressToBasket,
    validateFields: base.validateFields,
    validateShippingForm: base.validateShippingForm,
    validateBillingForm: base.validateBillingForm,
    validateCreditCard: base.validateCreditCard,
    calculatePaymentTransaction: base.calculatePaymentTransaction,
    recalculateBasket: base.recalculateBasket,
    createOrder: createOrder,
    placeOrder: placeOrder,
    savePaymentInstrumentToWallet: base.savePaymentInstrumentToWallet,
    getRenderedPaymentInstruments: base.getRenderedPaymentInstruments,
    ensureValidShipments: base.ensureValidShipments,
    setGift: base.setGift,
    validateCustomerForm: base.validateCustomerForm,
    validatePayment: base.validatePayment,
    sendConfirmationEmail: base.sendConfirmationEmail
};