'use strict';

const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');
const Logger = require('dw/system/Logger').getLogger('recurringPaymentJob');

const recurringFacade = require('*/cartridge/scripts/service/recurringFacade');
const recurringHelper = require('*/cartridge/scripts/helpers/recurring/recurring');

/**
 * Get recurring orders with date in past
 * @returns {Object} Search result
 */
function getRecurringOrders() {
    return OrderMgr.searchOrders('(status={0} OR status={1} OR status={2}) AND custom.isRecurring = {3} AND custom.isReccuringActive = {4} AND custom.nextRecurringBillingDate <= {5}', 
        'creationDate desc',
        Order.ORDER_STATUS_CREATED,
        Order.ORDER_STATUS_NEW,
        Order.ORDER_STATUS_OPEN,
        true,
        true,
        new Date()
    );
}

/**
 * Filter and loop orders
 * @param {dw.util.SeekableIterator} ordersIterator - Recurring orders
 * @returns {Object|null} - Job results
 */
function filterRecurringOrders(ordersIterator) {
    if (!ordersIterator) {
        return null;
    }

    const orderList = ordersIterator.asList();

    if (orderList.empty) {
        return null;
    }

    let results = { 
        total: orderList.length,
        successTotal: 0,
        failedTotal: 0
    };

    orderList.toArray().forEach(function (order) {
        try {
            var customer = order.getCustomer();
            var paymentInstruments = customer.getProfile().getWallet().getPaymentInstruments();

            var piWithToken = paymentInstruments.toArray().find(function (pi) {
                return pi && pi.custom.awpTokenHref
            });

            if (piWithToken) {
                // call for recurring payment
                const result = recurringFacade.authorizeRecurringPayment(order, {
                    tokenHref: piWithToken.custom.awpTokenHref
                })
                
                if (result && !result.error) {
                    // success reccurring
                    recurringHelper.updateOrderNextBillingDate(order);
                    ++results.successTotal;
                } else {
                    // failed reccurring
                    Logger.error("Failed to proceed new recurring, Order No {0}", order.orderNo);
                    ++results.failedTotal;
                }
            } else {
                // missing payment
                Logger.error("Failed to proceed new recurring, Order No {0}, no token", order.orderNo);
                ++results.failedTotal;
            }
        } catch (error) {
            Logger.error("Failed to proceed order, Error {0}", error);
            ++results.failedTotal
        }
    });

    return results;
}

module.exports = {
    getRecurringOrders: getRecurringOrders,
    filterRecurringOrders: filterRecurringOrders
};
