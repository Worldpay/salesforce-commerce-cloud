var Transaction = require('dw/system/Transaction');
var OrderManager = require('dw/order/OrderMgr');
var UpdateOrderStatus = require('*/cartridge/scripts/order/UpdateOrderStatus');
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
    var UpdateOrderStatus = require('*/cartridge/scripts/order/UpdateOrderStatus');
    var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
    var orderStatus = order.status.displayValue;
    var updateStatus = serviceResponseLastEvent;
    var status;
    var updateOrderStatusResult;
    if (WorldpayConstants.FAILEDSTATUS.equalsIgnoreCase(orderStatus) && (WorldpayConstants.AUTHORIZED.equalsIgnoreCase(updateStatus))) {
        OrderManager.undoFailOrder(order);
        OrderManager.placeOrder(order);
        orderStatus = order.status.displayValue;
    }
    if (WorldpayConstants.AUTHORIZED.equalsIgnoreCase(updateStatus)) {
        if (!(WorldpayConstants.OPEN.equalsIgnoreCase(orderStatus) || WorldpayConstants.COMPLETED.equalsIgnoreCase(orderStatus) || WorldpayConstants.NEW.equalsIgnoreCase(orderStatus))) {
            Transaction.wrap(function () {
                status = OrderManager.placeOrder(order);
            });
            if (status.isError()) {
                return false;
            }
        }
        Transaction.wrap(function () {
            updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        });
        return updateOrderStatusResult.success;
    } else if (WorldpayConstants.REFUSED.equalsIgnoreCase(updateStatus)) {
        if (!(WorldpayConstants.CANCELLEDSTATUS.equalsIgnoreCase(orderStatus) || WorldpayConstants.FAILEDSTATUS.equalsIgnoreCase(orderStatus))) {
            Transaction.wrap(function () {
                status = OrderManager.failOrder(order, true);
            });
            if (status.isError()) {
                return false;
            }
        }
        Transaction.wrap(function () {
            updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        });
        return updateOrderStatusResult.success;
    } else if (WorldpayConstants.CANCELLEDSTATUS.equalsIgnoreCase(updateStatus)) {
        if (WorldpayConstants.CANCELLEDSTATUS.equalsIgnoreCase(orderStatus)) {
            Transaction.wrap(function () {
                if (order.getStatus().valueOf() === Order.ORDER_STATUS_CREATED) {
                    status = OrderManager.failOrder(order, true);
                } else {
                    status = OrderManager.cancelOrder(order);
                }
                Logger.debug('Worldpay Job | Update Order Status : CANCELLED : {0} : Status : {1}', order.orderNo, status.message);
            });
            if (status.isError()) {
                return false;
            }
        }
        updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        return updateOrderStatusResult.success;
    } else if (WorldpayConstants.EXPIRED.equalsIgnoreCase(updateStatus)) {
        Transaction.wrap(function () {
            status = OrderManager.failOrder(order, true);
        });
        if (status.isError()) {
            return false;
        }
        Transaction.wrap(function () {
            updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        });
        return updateOrderStatusResult.success;
    } else if (WorldpayConstants.CAPTURED.equalsIgnoreCase(updateStatus) && WorldpayConstants.CREATED.equalsIgnoreCase(orderStatus)) {
        Transaction.wrap(function () {
            status = OrderManager.placeOrder(order);
        });
        if (status.isError()) {
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
    var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
    var tokenType = Site.getCurrent().getCustomPreferenceValue('tokenType');
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var currentCustomer = customerInformation;
    var saveCustomerCreditCardResult;
    var createdPaymentInstrument;
    if (currentCustomer.profile.customerNo.equals(serviceResponse.authenticatedShopperID.valueOf().toString()) || tokenType.toString().equals(WorldpayConstants.merchanttokenType)) {
        var customerPaymentInstruments = currentCustomer.getProfile().getWallet().getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
        // GetPaymentcardToken to fetch the saved card based on card details found in service response
        var getPaymentCardTokenResult = require('*/cartridge/scripts/pipelets/GetPaymentCardToken').getPaymentCardToken( 
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
                    saveCustomerCreditCardResult = require('*/cartridge/scripts/pipelets/SaveCustomerCreditCard').saveCustomerCreditCard( 
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
            saveCustomerCreditCardResult = require('*/cartridge/scripts/pipelets/SaveCustomerCreditCard').saveCustomerCreditCard(createdPaymentInstrument,
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
        readNotifyCustomObjectResult = require('*/cartridge/scripts/pipelets/ReadNotifyCustomObject').readNotifyCustomObject(customObjectID);
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
        removeCustomObjectResult = require('*/cartridge/scripts/pipelets/RemoveNotifyCustomObject').removeNotifyCustomObject(customObjectID);
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
