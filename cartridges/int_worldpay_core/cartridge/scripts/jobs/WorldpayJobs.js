var Transaction = require('dw/system/Transaction');
var OrderManager = require('dw/order/OrderMgr');
var UpdateOrderStatus = require('*/cartridge/scripts/order/UpdateOrderStatus');
/**
 * Updates the status of order
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


  // OrderStatus.js
    var orderStatus = order.status.displayValue;
    var updateStatus = serviceResponseLastEvent;
    var status;
    var updateOrderStatusResult;
    if ('FAILED'.equalsIgnoreCase(orderStatus) && ('AUTHORISED'.equalsIgnoreCase(updateStatus))) {
        OrderManager.undoFailOrder(order);
        OrderManager.placeOrder(order);
        orderStatus = order.status.displayValue;
    }

  // Expression
    if (Resource.msg('notification.paymentStatus.AUTHORISED', 'worldpay', null).equalsIgnoreCase(updateStatus)) {
        // Expression
        if (!('OPEN'.equalsIgnoreCase(orderStatus) || 'COMPLETED'.equalsIgnoreCase(orderStatus) || 'NEW'.equalsIgnoreCase(orderStatus))) {
            // PlaceOrder
            Transaction.wrap(function () {
                status = OrderManager.placeOrder(order);
            });
            if (status.isError()) {
                // ERROR
                return false;
            }
        }

        // UpdateOrderStatus.js
        Transaction.wrap(function () {
            updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        });
        return updateOrderStatusResult.success;
    } else if (Resource.msg('notification.paymentStatus.REFUSED', 'worldpay', null).equalsIgnoreCase(updateStatus)) {
    // Expression
        if (!('CANCELLED'.equalsIgnoreCase(orderStatus) || 'FAILED'.equalsIgnoreCase(orderStatus))) {
      // FailOrder
            Transaction.wrap(function () {
                status = OrderManager.failOrder(order, true);
            });
            if (status.isError()) {
        // ERROR
                return false;
            }
        }
        // UpdateOrderStatus.js
        Transaction.wrap(function () {
            updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        });
        return updateOrderStatusResult.success;
    } else if (Resource.msg('notification.paymentStatus.CANCELLED', 'worldpay', null).equalsIgnoreCase(updateStatus)) {
    // Expression
        if ('CANCELLED'.equalsIgnoreCase(orderStatus)) {
      // CancelOrder
            Transaction.wrap(function () {
                if (order.getStatus().valueOf() === Order.ORDER_STATUS_CREATED) {
                    status = OrderManager.failOrder(order, true);
                } else {
                    status = OrderManager.cancelOrder(order);
                }
                Logger.debug('Worldpay Job | Update Order Status : CANCELLED : {0} : Status : {1}', order.orderNo, status.message);
            });
            if (status.isError()) {
        // ERROR
                return false;
            }
        }
        // UpdateOrderStatus.js
        updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        return updateOrderStatusResult.success;
    } else if (Resource.msg('notification.paymentStatus.EXPIRED', 'worldpay', null).equalsIgnoreCase(updateStatus)) {
    // FailOrder
        Transaction.wrap(function () {
            status = OrderManager.failOrder(order, true);
        });
        if (status.isError()) {
    // ERROR
            return false;
        }
    // UpdateOrderStatus.js
        Transaction.wrap(function () {
            updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        });
        return updateOrderStatusResult.success;
    } else if (Resource.msg('notification.paymentStatus.CAPTURED', 'worldpay', null).equalsIgnoreCase(updateStatus) && ('CREATED').equalsIgnoreCase(orderStatus)) {
    // PlaceOrder
        Transaction.wrap(function () {
            status = OrderManager.placeOrder(order);
        });
        if (status.isError()) {
      // ERROR
            return false;
        }

      // UpdateOrderStatus.js
        Transaction.wrap(function () {
            updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
        });
        return updateOrderStatusResult.success;
    }
    // UpdateOrderStatus.js
    Transaction.wrap(function () {
        updateOrderStatusResult = UpdateOrderStatus.updateOrderStatus(order, serviceResponse, updateStatus, null);
    });
    return updateOrderStatusResult.success;
}

/**
 * Adds or Updates the Token
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
  // Expression
    if (currentCustomer.profile.customerNo.equals(serviceResponse.authenticatedShopperID.valueOf().toString()) || tokenType.toString().equals(WorldpayConstants.merchanttokenType)) {
    // GetCustomerPaymentInstruments
        var customerPaymentInstruments = currentCustomer.getProfile().getWallet().getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
    // GetPaymentcardToken to fetch the saved card based on card details found in service response
        var getPaymentCardTokenResult = require('*/cartridge/scripts/pipelets/GetPaymentCardToken').getPaymentCardToken(customerPaymentInstruments, cardNumber, cardType, serviceResponse.cardExpiryMonth.valueOf(), serviceResponse.cardExpiryYear.valueOf());
        if (!getPaymentCardTokenResult.success) {
            // when no card token found and resulted in exception
            return;
        }
        var paymentTokenID = getPaymentCardTokenResult.paymentTokenID;
        var matchedCustomerPaymentInstrument = getPaymentCardTokenResult.matchedCustomerPaymentInstrument;

      // found matched saved card
        if (matchedCustomerPaymentInstrument != null) {
        // Expression
            if (!paymentTokenID) {
                // missing payment token in saved card
                Transaction.wrap(function () {
                    saveCustomerCreditCardResult = require('*/cartridge/scripts/pipelets/SaveCustomerCreditCard').saveCustomerCreditCard(matchedCustomerPaymentInstrument, serviceResponse.paymentTokenID.valueOf().toString(), null, null, null, null, null);
                });
                return;
            }
            // payment token already exists
            return;
        }

        // no matched payment card found in customer's account
        if (serviceResponse.cardNumber) {
            Transaction.begin();
          // CreateCustomerPaymentInstrument
            createdPaymentInstrument = currentCustomer.getProfile().getWallet().createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);
          // SaveCustomerCreditCard
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
  // Expression
    if (paymentInstr != null && serviceResponse) {
    // Expression
        if (!paymentInstr.creditCardToken && serviceResponse.paymentTokenID) {
      // Assign
            Transaction.wrap(function () {
                paymentInstr.setCreditCardToken(serviceResponse.paymentTokenID);
            });
        }
    // Assign
        var tokenExpiryCal = new Util.Calendar();
        tokenExpiryCal.set(serviceResponse.paymentTokenExpiryYear, serviceResponse.paymentTokenExpiryMonth, serviceResponse.paymentTokenExpiryDay);
    // Assign
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
	var registeredUsers =  customerMgr.queryProfiles("","customerNo ASC");
   for each (var user in  registeredUsers) { 
    	var wallet =  user.getWallet();
    	var creditCardsSaved = wallet.getPaymentInstruments('CREDIT_CARD');
    	for each (var card in creditCardsSaved) {
    		var paymentTokenID = card.creditCardToken;
    		if (!paymentTokenID) {
    			Transaction.wrap(function () {
    			wallet.removePaymentInstrument(card);
    			 });
    		}
    	}
   }

}

/** Exported functions **/
module.exports = {
    updateOrderStatus: updateOrderStatus,
    deleteCard: deleteCard,
    addOrUpdateToken: addOrUpdateToken,
    updateOrderToken: updateOrderToken,
    readCustomObject: readCustomObject,
    removeCustomObject: removeCustomObject
};
