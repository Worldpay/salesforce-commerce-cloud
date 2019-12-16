/**
 * World pay order inquiries request response
 * @param {dw.order.Order} orderObject - Inquired order
 * @param {dw.order.PaymentInstrument} PaymentInstrument - the payment instrument
 * @return {Object} returns an object
 */
function sendWorldpayOrderInquiriesRequest(orderObject, PaymentInstrument) {
    var errorCode = '';
    var errorMessage = '';

    // Fetch the APM Name from the Payment isntrument.
    var apmName = PaymentInstrument.getPaymentMethod();

    // Fetch the APM Type from the Payment Method i.e. if the Payment Methoid is of DIRECT or REDIRECT type.
    var PaymentMgr = require('dw/order/PaymentMgr');
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    var Logger = require('dw/system/Logger');
    var Transaction = require('dw/system/Transaction');

    if (!orderObject) {
        Logger.getLogger('worldpay').error('SendWorldpayOrderInquiriesRequest : Order Number not available');
        return { success: true };
    }


    var merchantID = '';
    var response;
    if ('WorldpayMID' in PaymentInstrument.custom) {
        merchantID = PaymentInstrument.custom.WorldpayMID;
    }

    var orderInquiryRequestResult = require('*/cartridge/scripts/service/ServiceFacade').orderInquiryRequestService(paymentMthd, orderObject, merchantID);
    if (orderInquiryRequestResult.error) {
        if (orderInquiryRequestResult.errorCode.equals('RESPONSE_EMPTY') || orderInquiryRequestResult.errorCode.equals('SERVICE_UNAVAILABLE')) {
            errorCode = orderInquiryRequestResult.errorCode;
            errorMessage = orderInquiryRequestResult.errorMessage;
            return { success: true, errorCode: errorCode, errorMessage: errorMessage };
        }
        errorCode = orderInquiryRequestResult.errorCode;
        errorMessage = orderInquiryRequestResult.errorMessage;
        return { success: true, errorCode: errorCode, errorMessage: errorMessage };
    } else if (orderInquiryRequestResult.success) {
        response = orderInquiryRequestResult.response;
        // save token details in order object
        Transaction.wrap(function () {
            require('*/cartridge/scripts/common/PaymentInstrumentUtils').updatePaymentInstrumentToken(orderInquiryRequestResult.response, PaymentInstrument);
        });
    }
    return { success: true, errorCode: errorCode, errorMessage: errorMessage, response: response };
}

/** Exported functions **/
module.exports = {
    sendWorldpayOrderInquiriesRequest: sendWorldpayOrderInquiriesRequest
};
