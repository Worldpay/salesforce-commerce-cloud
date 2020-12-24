/**
*  This function initiates the order cancel or refund request with Worldpay
*  @input   orderNo  : String
*  @output response  : Object
*   @output errorCode : String
*   @output errorMessage : String
*
*/

/**
 * This function initiates the order cancel or refund request with Worldpay
 * @param {dw.order.Order} orderNo - Current users's Order
 * @return {Object} returns an object
 */
function initiateCancelOrder(orderNo) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Logger = require('dw/system/Logger');
    var errorCode = '';
    var errorMessage = '';

    if (!orderNo) {
        Logger.getLogger('worldpay').error('InitiateCancelOrder.js : Invalid Order');
        return { success: false };
    }
    var orderObj = OrderMgr.getOrder(orderNo);
    if (!orderObj) {
        Logger.getLogger('worldpay').error('InitiateCancelOrder.js : Invalid Order:' + orderNo);
        return { success: false };
    }

    var merchantID = '';
    // get all payment instruments for the order
    var paymentInstruments = orderObj.getPaymentInstruments();
    var iter = paymentInstruments.iterator();
    var paymentInstrument = null;
    while (iter.hasNext()) {
        paymentInstrument = iter.next();
        if ('WorldpayMID' in paymentInstrument.custom) {
            merchantID = paymentInstrument.custom.WorldpayMID;
            break;
        }
    }

    var initiateCancelOrderResult = require('*/cartridge/scripts/service/ServiceFacade').initiateCancelOrderService(orderNo, merchantID);
    var response;
    if (initiateCancelOrderResult.error) {
        if (initiateCancelOrderResult.errorCode.equals('RESPONSE_EMPTY') || initiateCancelOrderResult.errorCode.equals('SERVICE_UNAVAILABLE')) {
            errorCode = initiateCancelOrderResult.errorCode;
            errorMessage = initiateCancelOrderResult.errorMessage;
            Logger.getLogger('worldpay').debug('InitiateCancelOrder.js : ErrorCode : ' + initiateCancelOrderResult.errorCode +
               ' : Error Message : ' + initiateCancelOrderResult.errorMessage);
            return { success: true, errorCode: errorCode, errorMessage: errorMessage };
        }
        errorCode = initiateCancelOrderResult.errorCode;
        errorMessage = initiateCancelOrderResult.errorMessage;
        Logger.getLogger('worldpay').debug('InitiateCancelOrder.js : ErrorCode : ' + initiateCancelOrderResult.errorCode +
               ' : Error Message : ' + initiateCancelOrderResult.errorMessage);
        return { success: true, errorCode: errorCode, errorMessage: errorMessage };
    } else if (initiateCancelOrderResult.success) {
        response = initiateCancelOrderResult.response;
        Logger.getLogger('worldpay').debug('InitiateCancelOrder.js : Response : ' + initiateCancelOrderResult.response);
    }
    return { success: true, errorCode: errorCode, errorMessage: errorMessage, response: response };
}

/** Exported functions **/
module.exports = {
    initiateCancelOrder: initiateCancelOrder
};
