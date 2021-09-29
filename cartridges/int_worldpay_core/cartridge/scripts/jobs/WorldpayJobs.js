var Transaction = require('dw/system/Transaction');
var OrderManager = require('dw/order/OrderMgr');
var UpdateOrderStatus = require('*/cartridge/scripts/order/updateOrderStatus');
var Logger = require('dw/system/Logger');
/**
 * Updates the status of order based on serviceResponseLastEvent
 * @param {number} order - Current users's order
 * @param {string} serviceResponseLastEvent - Update Status of the order
 * @param {Object} serviceResponse - Service Response
 * @return {boolean} returns true/false depending upon success
 */
function updateOrderStatus(order, serviceResponseLastEvent, serviceResponse) {
    var Resource = require('dw/web/Resource');
    var Order = require('dw/order/Order');
    var Logger = require('dw/system/Logger');
    var UpdateOrderStatus = require('*/cartridge/scripts/order/updateOrderStatus');
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var orderStatus = order.status.displayValue;
    var orderStatusCode = order.getStatus().valueOf();
    var updateStatus = serviceResponseLastEvent;
    var status;
    var updateOrderStatusResult;
    Logger.getLogger('worldpay').debug('Update Order Status : ' + updateStatus + ' for Order Number : ' + order.orderNo + ' Current status: ' + orderStatus);
    if (orderStatusCode === Order.ORDER_STATUS_FAILED && (worldpayConstants.AUTHORIZED.equalsIgnoreCase(updateStatus))) {
        let undoFailOrderStatus = OrderManager.undoFailOrder(order);
        if (undoFailOrderStatus.isError) {
            Logger.getLogger('worldpay').debug('Update Order Status : Job Failed during undoFailOrder : ' + undoFailOrderStatus);
        }
        let placeOrderStatus = OrderManager.placeOrder(order);
        if (placeOrderStatus.isError) {
            Logger.getLogger('worldpay').debug('Update Order Status : Job Failed after undoFailOrder\'s place order : ' + placeOrderStatus);
        }
        orderStatus = order.status.displayValue;
    } 
    if (worldpayConstants.AUTHORIZED.equalsIgnoreCase(updateStatus)) {
        if (!(orderStatusCode === Order.ORDER_STATUS_OPEN || orderStatusCode === Order.ORDER_STATUS_COMPLETED || orderStatusCode === Order.ORDER_STATUS_NEW)) {
            Transaction.wrap(function () {
                status = OrderManager.placeOrder(order);
            });
            if (status.isError()) {
                Logger.getLogger('worldpay').debug('Update Order Status : Place order for order num: ' + order.orderNo + ' failed. Order\'s current status: ' + orderStatus);
                return false;
            }
        }
        Transaction.wrap(function () {
            updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        });
        return updateOrderStatusResult.success;
    } else if (worldpayConstants.REFUSED.equalsIgnoreCase(updateStatus)) {
        if (!(orderStatusCode === Order.ORDER_STATUS_CANCELLED || orderStatusCode === Order.ORDER_STATUS_FAILED)) {
            Transaction.wrap(function () {
                status = OrderManager.failOrder(order, true);
            });
            if (status.isError()) {
                Logger.getLogger('worldpay').debug('Update Order Status : ' + updateStatus + ' for Order: ' + order.orderNo + ' Failed');
                return false;
            }
        }
        Transaction.wrap(function () {
            updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        });
        return updateOrderStatusResult.success;
    } else if (worldpayConstants.CANCELLEDSTATUS.equalsIgnoreCase(updateStatus)) {
        if (orderStatusCode === Order.ORDER_STATUS_CANCELLED) {
            Logger.getLogger('worldpay').debug('Update Order Status : ' + updateStatus);
            Transaction.wrap(function () {
                if (orderStatusCode === Order.ORDER_STATUS_CREATED) {
                    status = OrderManager.failOrder(order, true);
                } else {
                    status = OrderManager.cancelOrder(order);
                }
                Logger.debug('Update Order Status : CANCELLED : {0} : Status : {1}', order.orderNo, status.message);
            });
            if (status.isError()) {
                return false;
            }
        }
        updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        return updateOrderStatusResult.success;
    } else if (worldpayConstants.EXPIRED.equalsIgnoreCase(updateStatus)) {
        Transaction.wrap(function () {
            status = OrderManager.failOrder(order, true);
        });
        if (status.isError()) {
            Logger.getLogger('worldpay').debug('Update Order Status : Payment : ' + updateStatus + ' for Order: ' + order.orderNo);
            return false;
        }
        Transaction.wrap(function () {
            updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        });
        return updateOrderStatusResult.success;
    } else if (worldpayConstants.CAPTURED.equalsIgnoreCase(updateStatus) && orderStatusCode === Order.ORDER_STATUS_CREATED) {
        Transaction.wrap(function () {
            status = OrderManager.placeOrder(order);
        });
        if (status.isError()) {
            Logger.getLogger('worldpay').debug('Update Order Status : Order ' + order.orderNo + ' failed after : ' + updateStatus + ' Place order Status: ' + status);
            return false;
        }
        Transaction.wrap(function () {
            updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        });
        return updateOrderStatusResult.success;
    }
    Transaction.wrap(function () {
        updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
    });
    return updateOrderStatusResult.success;
}

/**
 * Adds the Token in a new card or an existing card without Token
 * otherwise Updates the Token
 * @param {Object} customerInformation - Current customer Object
 * @param {Object} serviceResponse - Service Response
 * @param {string} cardNumber - Card Number
 * @param {string} cardType - Card Type
 */
function addOrUpdateToken(customerInformation, serviceResponse, cardNumber, cardType) {
    var Site = require('dw/system/Site');
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var tokenType = Site.getCurrent().getCustomPreferenceValue('tokenType');
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var currentCustomer = customerInformation;
    var saveCustomerCreditCardResult;
    var createdPaymentInstrument;
    if (currentCustomer.profile.customerNo.equals(serviceResponse.authenticatedShopperID.valueOf().toString()) || tokenType.toString().equals(worldpayConstants.merchanttokenType)) {
        var customerPaymentInstruments = currentCustomer.getProfile().getWallet().getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
        // GetPaymentcardToken to fetch the saved card based on card details found in service response
        var getPaymentCardTokenResult = require('*/cartridge/scripts/pipelets/getPaymentCardToken').getPaymentCardToken( 
            customerPaymentInstruments, cardNumber, cardType, serviceResponse.cardExpiryMonth.valueOf(), serviceResponse.cardExpiryYear.valueOf());
        if (!getPaymentCardTokenResult.success) {
            return;
        }
        var paymentTokenID = getPaymentCardTokenResult.paymentTokenID;
        var matchedCustomerPaymentInstrument = getPaymentCardTokenResult.matchedCustomerPaymentInstrument;
        // found matched saved card
        if (matchedCustomerPaymentInstrument != null) {
            if (!paymentTokenID) {
                Transaction.wrap(function () {
                    saveCustomerCreditCardResult = require('*/cartridge/scripts/pipelets/saveCustomerCreditCard').saveCustomerCreditCard( 
                        matchedCustomerPaymentInstrument, serviceResponse.paymentTokenID.valueOf().toString(), null, null, null, null, null);
                });
                return;
            }
            return;
        }
        // no matched payment card found in customer's account
        if (serviceResponse.cardNumber) {
            Transaction.begin();
            createdPaymentInstrument = currentCustomer.getProfile().getWallet().createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);
            saveCustomerCreditCardResult = require('*/cartridge/scripts/pipelets/saveCustomerCreditCard').saveCustomerCreditCard(createdPaymentInstrument,
                serviceResponse.paymentTokenID.valueOf().toString(),
                serviceResponse.cardNumber.valueOf().toString(),
                Number(serviceResponse.cardExpiryMonth.valueOf()),
                Number(serviceResponse.cardExpiryYear.valueOf()),
                serviceResponse.cardBrand.valueOf().toString(),
                serviceResponse.cardHolderName.valueOf().toString());
            if (saveCustomerCreditCardResult.success) {
                Transaction.commit();
            } else {
                Transaction.rollback();
            }
            return;
        }
        return;
    }
    return;
}

/**
 * Updates Order Token in payment instrument
 * @param {Object} paymentInstrument - Payment Instrument
 * @param {Object} serviceResponse - Service Response
 * @return {Object} returns updated payment instrument
 */
function updateOrderToken(paymentInstrument, serviceResponse) {
    var Util = require('dw/util');
    var paymentInstr = paymentInstrument;
    if (paymentInstr != null && serviceResponse) {
        if (!paymentInstr.creditCardToken && serviceResponse.paymentTokenID) {
            Transaction.wrap(function () {
                paymentInstr.setCreditCardToken(serviceResponse.paymentTokenID);
            });
        }
        var tokenExpiryCal = new Util.Calendar();
        tokenExpiryCal.set(serviceResponse.paymentTokenExpiryYear, serviceResponse.paymentTokenExpiryMonth, serviceResponse.paymentTokenExpiryDay);
        Transaction.wrap(function () {
            paymentInstr.custom.wpTokenEvent = serviceResponse.tokenEvent;
            paymentInstr.custom.wpTokenReason = serviceResponse.tokenReason;
            paymentInstr.custom.wpTokenEventReference = serviceResponse.tokenEventReference;
            paymentInstr.custom.wpPaymentTokenExpiry = tokenExpiryCal.time;
        });
    }
    return paymentInstr;
}

/**
 * reads custom object
 * @param {Object} customObjectID - Custom Object
 * @return {Object} returns object as a response
 */
function readCustomObject(customObjectID) {
    var readNotifyCustomObjectResult;
    Transaction.wrap(function () {
        readNotifyCustomObjectResult = require('*/cartridge/scripts/pipelets/readNotifyCustomObject').readNotifyCustomObject(customObjectID);
    });
    return readNotifyCustomObjectResult;
}

/**
 * Removes custom object
 * @param {Object} customObjectID - Custom Object
 * @return {Object} returns result of remove call
 */
function removeCustomObject(customObjectID) {
    var removeCustomObjectResult;
    Transaction.wrap(function () {
        removeCustomObjectResult = require('*/cartridge/scripts/pipelets/removeNotifyCustomObject').removeNotifyCustomObject(customObjectID);
    });
    return removeCustomObjectResult;
}

/**
 * Removes cards which do not have worldpay issued token
 */
function deleteCard() {
    var customerMgr = require('dw/customer/CustomerMgr');
    var registeredUsers = customerMgr.queryProfiles("", "customerNo ASC");
    for each(var user in registeredUsers) {
        var wallet = user.getWallet();
        var creditCardsSaved = wallet.getPaymentInstruments('CREDIT_CARD');
        for each(var card in creditCardsSaved) {
            var paymentTokenID = card.creditCardToken;
            if (!paymentTokenID) {
                Transaction.wrap(function () {
                    wallet.removePaymentInstrument(card);
                });
            }
        }
    }
}

module.exports = {
    updateOrderStatus: updateOrderStatus,
    deleteCard: deleteCard,
    addOrUpdateToken: addOrUpdateToken,
    updateOrderToken: updateOrderToken,
    readCustomObject: readCustomObject,
    removeCustomObject: removeCustomObject
};
