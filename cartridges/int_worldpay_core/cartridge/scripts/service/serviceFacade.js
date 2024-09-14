var libCreateRequest = require('*/cartridge/scripts/lib/libCreateRequest');
var utils = require('*/cartridge/scripts/common/utils');
var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
var currentSite = Site.getCurrent();
var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');

/**
* method to validate service response
* @param {Object} responseObject - response object
* @return {Object} returns an JSON object
*/
function validateResponse(responseObject) {
    let errorCode = '';
    let errorMessage = '';
    if (!responseObject) {
        errorCode = 'RESPONSE_EMPTY';
        errorMessage = utils.getErrorMessage('servererror');
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    } else if ('status' in responseObject && responseObject.getStatus().equals('SERVICE_UNAVAILABLE')) {
        errorCode = 'SERVICE_UNAVAILABLE';
        errorMessage = utils.getErrorMessage('servererror');
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return null;
}

/**
* method to validate order request xml
* @param {XML} orderRequest - order request xml
* @return {Object} returns an JSON object
*/
function validateOrderRequest(orderRequest) {
    let errorCode = '';
    let errorMessage = '';
    if (!orderRequest) {
        errorCode = 'INVALID_REQUEST';
        errorMessage = 'Inavlid XML Request ';
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return null;
}

/**
* method for response error check
* @param {Object} response - response object
* @return {Object} returns an JSON object
*/
function responseErrorCheck(response) {
    let errorCode = '';
    let errorMessage = '';
    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = utils.getErrorMessage(errorCode);
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return null;
}

/**
* Function for confirmation Service Request for Klarna
* @param {string} orderNo - order number
* @param {Object} preferences - worldpay preferences
* @param {string} merchantCode - merchantCode configured in preference
* @return {Object} returns an JSON object
*/
function confirmationRequestKlarnaService(orderNo, preferences, merchantCode) {
    var errorCode;
    var errorMessage;
    var order = libCreateRequest.createConfirmationRequestKlarna(orderNo, preferences, merchantCode);
    var responseObj = utils.serviceCall(order, null, preferences, null, orderNo);
    let responseResult = validateResponse(responseObj);
    if (responseResult && responseResult.error) {
        return responseResult;
    }
    // parsing response
    var result = responseObj.object;
    var response = utils.parseResponse(result);
    Logger.getLogger('worldpay').debug('confirmationRequestKlarna Response : ' + result);
    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = response.getErrorMessage();
        if (currentSite.getCustomPreferenceValue('enableErrorMailService')) {
            utils.sendErrorNotification(orderNo, worldpayConstants.CONFIRMATION_REQKLARNA, 'KLARNA');
        }
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, response: response };
}

/**
* This function is Service wrapper for Order Cancel or Refund.
* @param {string} orderNo - order number
* @param {string} merchantID - merchantID configured in preference
* @return {Object} returns an JSON object
*/
function initiateCancelOrderService(orderNo, merchantID) {
    var OrderMgr = require('dw/order/OrderMgr');
    var errorCode = '';
    var errorMessage = '';

    if (!orderNo) {
        return { error: true };
    }

    var orderObj = OrderMgr.getOrder(orderNo);
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit(null, orderObj);

    var order = libCreateRequest.createCancelOrderRequest(orderNo, preferences, merchantID);
    var responseObj = utils.serviceCall(order, null, preferences, merchantID, orderNo);
    let responseResult = validateResponse(responseObj);
    if (responseResult && responseResult.error) {
        return responseResult;
    }
    // parsing response
    var result = responseObj.object;
    var response = utils.parseResponse(result);
    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = response.getErrorMessage();
        if (currentSite.getCustomPreferenceValue('enableErrorMailService')) {
            utils.sendErrorNotification(orderNo, worldpayConstants.INITIATE_CANCEL_ORDER_FAILED, '');
        }
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, response: response };
}

/**
 * This function is Service wrapper for Order Inquiry
 * @param {dw.order.PaymentMethod} paymentMthd - payment method
 * @param {dw.order.Order} orderObj - order Object
 * @param {string} merchantID - merchantID configured in preference
 * @return {Object} returns an JSON object
 */
function orderInquiryRequestService(paymentMthd, orderObj, merchantID) {
    var errorCode = '';
    var errorMessage = '';
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd, orderObj);

    var order = libCreateRequest.createOrderInquiriesRequest(orderObj.getOrderNo(), preferences, merchantID);
    var responseObject = utils.serviceCall(order, null, preferences, merchantID, orderObj.getOrderNo());

    let responseResult = validateResponse(responseObject);
    if (responseResult && responseResult.error) {
        return responseResult;
    }

    var result = responseObject.object;
    var response = utils.parseResponse(result);

    if (response.isError()) {
        errorMessage = response.getErrorMessage();
        errorCode = response.getErrorCode();
        if (currentSite.getCustomPreferenceValue('enableErrorMailService')) {
            utils.sendErrorNotification(orderObj.getOrderNo(), worldpayConstants.ORDERINQUIRY_FAILED, paymentMthd);
        }
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, response: response };
}

/**
 * Service wrapper for Order Authorization for APM or redirect orders
 * @param {dw.value.Money} nonGiftCertificateAmnt - Non gift certificate amount
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment instrument object
 * @param {dw.customer.Customer} customer - Current customer
 * @param {dw.order.PaymentMethod} paymentMthd - payment method
 * @return {Object} returns an JSON object
 */
function authorizeOrderService(nonGiftCertificateAmnt, orderObj, paymentInstrument, customer, paymentMthd) {
    var orderRequest = libCreateRequest.createRequest(nonGiftCertificateAmnt, orderObj, paymentInstrument, customer);
    let orderRequestResult = validateOrderRequest(orderRequest);
    if (orderRequestResult && orderRequestResult.error) {
        return orderRequestResult;
    }
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd, orderObj);
    var responseObject = utils.serviceCall(orderRequest, null, preferences, null, orderObj.getOrderNo());   // Making Service Call and Getting Response

    let responseResult = validateResponse(responseObject);
    if (responseResult && responseResult.error) {
        return responseResult;
    }
    var result = responseObject.object;
    var response = utils.parseResponse(result);
    Logger.getLogger('worldpay').debug('AuthorizeOrderService Response string : ' + result);
    let responseErrorResult = responseErrorCheck(response);
    if (responseErrorResult && responseErrorResult.error) {
        return responseErrorResult;
    }
    return { success: true, response: response };
}

/**
 * Service wrapper for 3D order second request service
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {Object} request - current request
 * @param {dw.order.PaymentInstrument} paymentIntrument - payment instrument object
 * @param {Object} preferences - worldpay preferences
 * @param {string} echoData - authorization response echoData string
 * @param {string} encryptedData - encryptedData
 * @param {Object} cardOrderObj - cardOrderObj
 * @return {Object} returns an JSON object
 */
function secondAuthorizeRequestService(orderObj, request, paymentIntrument, preferences, echoData, encryptedData, cardOrderObj) {
    var errorCode = '';
    var errorMessage = '';
    var order = libCreateRequest.createInitialRequest3D(orderObj, request, paymentIntrument, preferences, echoData, encryptedData, cardOrderObj);
    order = libCreateRequest.createSecondOrderMessage(order, cardOrderObj.paRes, cardOrderObj.md);
    let orderRequestResult = validateOrderRequest(order);
    if (orderRequestResult && orderRequestResult.error) {
        return orderRequestResult;
    }
    let requestHeader = !empty(session.privacy.serviceCookie) ? session.privacy.serviceCookie : paymentIntrument.custom.resHeader;
    if (session.privacy.serviceCookie) {
        delete session.privacy.serviceCookie;
    }
    let responseObject = utils.serviceCall(order, requestHeader, preferences, null, orderObj.getOrderNo());

    let responseResult = validateResponse(responseObject);
    if (responseResult && responseResult.error) {
        return responseResult;
    }

    var result = responseObject.object;
    Logger.getLogger('worldpay').debug('SecondAuthorizeRequestService Response string : ' + result);
    var response = utils.parseResponse(result);

    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = utils.getErrorMessage(errorCode);
        if (currentSite.getCustomPreferenceValue('enableErrorMailService')) {
            utils.sendErrorNotification(orderObj.orderNo, worldpayConstants.AUTHENTICATION_FAILED, '');
        }
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, response: response };
}

/**
 * Service wrapper for 3D order second request service for MyAccount
 * @param {string} paRes - error code
 * @param {string} md - MD
 * @param {Object} preferences - worldpay preferences
 *  @param {dw.order.PaymentInstrument} paymentIntrument - payment instrument object
 * @return {Object} returns an JSON object
 */
function secondAuthenticate3DRequestService(paRes, md, preferences, paymentIntrument) {
    var errorCode = '';
    var errorMessage = '';
    var order = libCreateRequest.createSaveCardAuthenticateRequest(paRes, md, preferences);
    let orderRequestResult = validateOrderRequest(order);
    if (orderRequestResult && orderRequestResult.error) {
        return orderRequestResult;
    }
    var requestHeader = !empty(session.privacy.serviceCookie) ? session.privacy.serviceCookie : paymentIntrument.custom.resHeader;
    if (session.privacy.serviceCookie) {
        delete session.privacy.serviceCookie;
    }
    var responseObject = utils.serviceCall(order, requestHeader, preferences, null);

    let responseResult = validateResponse(responseObject);
    if (responseResult && responseResult.error) {
        return responseResult;
    }

    var result = responseObject.object;
    Logger.getLogger('worldpay').debug('SecondAuthorizeRequestService Response string : ' + result);
    var response = utils.parseResponse(result);

    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = utils.getErrorMessage(errorCode);
        if (currentSite.getCustomPreferenceValue('enableErrorMailService')) {
            utils.sendErrorNotification(md, worldpayConstants.SECOND_AUTHORIZATION_FAILED, '');
        }
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, response: response };
}

/**
 * Function to authorize 3d version2
 * @param {string} orderNo - order number
 * @param {dw.order.PaymentInstrument} paymentIntrument - payment instrument object
 * @param {Object} request - Request
 * @param {Object} preferences - worldpay preferences
 * @return {XML} returns a XML
 */
function secondAuthorizeRequestService2(orderNo, paymentIntrument, request, preferences) {
    var order = libCreateRequest.createInitialRequest3D2(orderNo, request, preferences);
    let orderRequestResult = validateOrderRequest(order);
    if (orderRequestResult && orderRequestResult.error) {
        return orderRequestResult;
    }
    var requestHeader = !empty(session.privacy.serviceCookie) ? session.privacy.serviceCookie : paymentIntrument.custom.resHeader;
    if (session.privacy.serviceCookie) {
        delete session.privacy.serviceCookie;
    }
    var resObject = utils.serviceCall(order, requestHeader, preferences, null);
    let responseResult = validateResponse(resObject);
    if (responseResult && responseResult.error) {
        return responseResult;
    }
    var result = resObject.object;
    Logger.getLogger('worldpay').debug('CCAuthorizeRequestService Response string : ' + result);
    var response = utils.parseResponse(result);

    let responseErrorResult = responseErrorCheck(response);
    if (responseErrorResult && responseErrorResult.error) {
        return responseErrorResult;
    }
    return { success: true, serviceresponse: response, responseObject: resObject };
}

/**
 * Service wrapper for Credit Card orders
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {Object} request - current request
 * @param {dw.order.PaymentInstrument} paymentIntrument - payment instrument object
 * @param {Object} preferences - worldpay preferences
 * @param {string} cardNumber -  cardNumber.
 * @param {string} encryptedData - encryptedData
 * @param {string} cvn - cvn
 * @return {Object} returns an JSON object
 */
function ccAuthorizeRequestService(orderObj, request, paymentIntrument, preferences, cardNumber, encryptedData, cvn) {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var isSavedRedirectCard;
    var order;

    var apmName = paymentIntrument.getPaymentMethod();
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    if (paymentMthd.ID === worldpayConstants.WORLDPAY && paymentIntrument.creditCardToken) {
        isSavedRedirectCard = true;
    }

    var cardObj = {
        cardNumber: cardNumber,
        cvn: cvn
    };
    if (isSavedRedirectCard) {
        order = libCreateRequest.createSavedCardAuthRequest(orderObj, request, paymentIntrument, preferences, null, encryptedData, cardObj);
    } else {
        order = libCreateRequest.createInitialRequest3D(orderObj, request, paymentIntrument, preferences, null, encryptedData, cardObj);
    }

    if (preferences.enableExemptionEngine && !empty(preferences.exemptionType) && !empty(preferences.exemptionPlacement)) {
        order = libCreateRequest.addExemptionAttributes(order, preferences);
    }

    let orderRequestResult = validateOrderRequest(order);
    if (orderRequestResult && orderRequestResult.error) {
        return orderRequestResult;
    }
    var responseObject = utils.serviceCall(order, null, preferences, null, orderObj.getOrderNo());
    let responseResult = validateResponse(responseObject);
    if (responseResult && responseResult.error) {
        return responseResult;
    }
    var result = responseObject.object;
    Logger.getLogger('worldpay').debug('CCAuthorizeRequestService Response string : ' + result);
    var response = utils.parseResponse(result);

    // checks if any error occurs
    let responseErrorResult = responseErrorCheck(response);
    if (responseErrorResult && responseErrorResult.error) {
        return responseErrorResult;
    }
    return { success: true, serviceresponse: response, responseObject: responseObject };
}

/**
 * This method returns APM list for lookup service
 * @param {Object} fileReader -read the content in files
 * @return {Object} returns an JSON object
 */
function getApmList(fileReader) {
    var XMLStreamConstants = require('dw/io/XMLStreamConstants');
    var XMLStreamReader = require('dw/io/XMLStreamReader');
    var xmlStreamReader = new XMLStreamReader(fileReader);
    var ArrayList = require('dw/util/ArrayList');
    var APMList = new ArrayList();
    while (xmlStreamReader.hasNext()) {
        if (xmlStreamReader.next() === XMLStreamConstants.START_ELEMENT) {
            var localElementName = xmlStreamReader.getLocalName();
            if (localElementName && localElementName.equalsIgnoreCase(worldpayConstants.XMLPAYMENTOPTION)) {
                var apmName = xmlStreamReader.readElementText();
                APMList.addAt(0, apmName);
            }
        }
    }
    xmlStreamReader.close();
    return APMList;
}
/**
 * Service wrapper for Lookup service
 * @param {string} country - country
 * @return {Object} returns an JSON object
 */
function apmLookupService(country) {
    var isCountrySpoofingEnabled = currentSite.getCustomPreferenceValue('countryspoofing');
    var listOfSpoofedCountry = currentSite.getCustomPreferenceValue('listofspoofedcountry');
    if (isCountrySpoofingEnabled) {
        for (var i = 0; i < listOfSpoofedCountry.length; i++) {
            var countryPair = listOfSpoofedCountry[i];
            var spoofedcountry = countryPair.substring(0, 2);
            if (spoofedcountry === country) {
                // eslint-disable-next-line no-param-reassign
                country = countryPair.substring(3, 5);
                break;
            }
        }
    }
    var errorCode = '';
    var errorMessage = '';
    var content = '';
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit();
    var requestXML = new XML('<paymentService version=\'' + preferences.XMLVersion + '\' merchantCode=\'' + preferences.merchantCode +
        '\'><inquiry><paymentOptionsInquiry countryCode=\'' + country + '\'/></inquiry></paymentService>');
    var responseObject = utils.serviceCall(requestXML, null, preferences, null);
    let responseResult = validateResponse(responseObject);
    if (responseResult && responseResult.error) {
        return responseResult;
    }

    // Read response
    try {
        content = new XML(responseObject.object);
        Logger.getLogger('worldpay').debug('APMLookupService Response : ' + content);
    } catch (ex) {
        errorCode = worldpayConstants.NOTIFYERRORCODE111;
        errorMessage = utils.getErrorMessage(errorCode);
        Logger.getLogger('worldpay').error('APM LookUp Service : ' + errorCode + ' : ' + errorMessage + ' : ' + ex);
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    try {
        if (content.localName().equalsIgnoreCase(worldpayConstants.XMLPAYMENTSERVICE)) {
            var temp = content;
            if (worldpayConstants.XMLPAYMENTOPTION in temp.reply) {
                var Reader = require('dw/io/Reader');
                var fileReader = new Reader(temp.reply);
                var APMList = getApmList(fileReader);
                fileReader.close();
                return { success: true, apmList: APMList };
            }

            errorCode = worldpayConstants.NOTIFYERRORCODE111;
            errorMessage = utils.getErrorMessage(errorCode);
            Logger.getLogger('worldpay').error('APM LookUp Service : ' + errorCode + ' : ' + errorMessage);
            return { error: true, errorCode: errorCode, errorMessage: errorMessage };
        }

        errorCode = worldpayConstants.NOTIFYERRORCODE111;
        errorMessage = utils.getErrorMessage(errorCode);
        Logger.getLogger('worldpay').error('APM LookUp Service : ' + errorCode + ' : ' + errorMessage);
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    } catch (ex) {
        errorCode = worldpayConstants.NOTIFYERRORCODE111;
        errorMessage = utils.getErrorMessage(errorCode);
        Logger.getLogger('worldpay').error('APM LookUp Service : ' + errorCode + ' : ' + errorMessage + ' : ' + ex);
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
}
/**
 * Service wrapper for Capture service
 * @param {string} orderCode - users's Order
 * @return {Object} returns an JSON object
 */
function createCaptureService(orderCode) {
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderCode);
    var errorCode = '';
    var errorMessage = '';
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit(null, order);
    var ArrayList = require('dw/util/ArrayList');
    var shipmentUUIDList = new ArrayList();
    // iterate each shipment in order
    for (var i = 0; i < order.shipments.length; i++) {
        shipmentUUIDList.push(order.shipments[i].UUID);
    }
    // Capture Service Call
    var orderXML = libCreateRequest.createCaptureServiceRequest(preferences,
        order.orderNo,
        order.adjustedMerchandizeTotalPrice.value,
        order.currencyCode,
        worldpayConstants.DEBITCREDITINDICATOR,
        shipmentUUIDList);
    var responseObj = utils.serviceCall(orderXML, null, preferences, null);
    if (!responseObj) {
        errorCode = 'RESPONSE_EMPTY';
        errorMessage = 'Empty Response';
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    } else if ('status' in responseObj && responseObj.getStatus().equals('SERVICE_UNAVAILABLE')) {
        errorCode = 'SERVICE_UNAVAILABLE';
        errorMessage = responseObj.getErrorMessage();
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    // parsing response
    var result = responseObj.object;
    Logger.getLogger('worldpay').debug('Capture Service Response : ' + result);
    var response = utils.parseResponse(result);


    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = response.getErrorMessage();
        if (currentSite.getCustomPreferenceValue('enableErrorMailService')) {
            utils.sendErrorNotification(order.orderNo, worldpayConstants.CAPTURE_FAILED, '');
        }
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, response: response };
}
/**
 * Service wrapper for VoidSale service
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {Object} paymentMthd - Current payment method
 * @return {Object} returns an JSON object
 */
function voidSaleService(orderObj, paymentMthd) {
    var errorCode = '';
    var errorMessage = '';
    var orderRequest = libCreateRequest.createVoidRequest(orderObj, paymentMthd);
    let orderRequestResult = validateOrderRequest(orderRequest);
    if (orderRequestResult && orderRequestResult.error) {
        return orderRequestResult;
    }
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd, orderObj);
    var responseObject = utils.serviceCall(orderRequest, null, preferences, null);   // Making Service Call and Getting Response

    let responseResult = validateResponse(responseObject);
    if (responseResult && responseResult.error) {
        return responseResult;
    }

    var result = responseObject.object;
    var response = utils.parseResponse(result);
    Logger.getLogger('worldpay').debug('AuthorizeOrderService Response string : ' + result);
    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = utils.getErrorMessage(errorCode);
        if (currentSite.getCustomPreferenceValue('enableErrorMailService')) {
            utils.sendErrorNotification(orderObj.orderNo, worldpayConstants.VOIDSALE_FAILED, paymentMthd);
        }
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, response: response };
}
/**
 * Function to create request for partial caputure in csc
 * @param {Object} orderID - orderid
 * @param {string} settleAmount - amount to be captured
 * @param {string} partialSettleAmount - partial SettleAmount to be captured
 * @param {Object} currency - currency
 * @param {string} trackingID - trackingID
 * @param {string} shipmentNo - shipmentNo
 * @return {Object} returns an JSON object
 */
function cscPartialCapture(orderID, settleAmount, partialSettleAmount, currency, trackingID, shipmentNo) {
    var errorCode = '';
    var errorMessage = '';
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderID);
    var paymentMethod = order.paymentInstrument.getPaymentMethod();
    var partialCaptureRequest;
    if ((paymentMethod === worldpayConstants.KLARNA || paymentMethod === worldpayConstants.KLARNASLICEIT || paymentMethod === worldpayConstants.KLARNAPAYLATER || paymentMethod === worldpayConstants.KLARNAPAYNOW)) {
        partialCaptureRequest = libCreateRequest.createKlarnaCaptureRequest(orderID, settleAmount, currency, trackingID);
    } else {
        partialCaptureRequest = libCreateRequest.createPartialCaptureRequest(orderID, settleAmount, currency, shipmentNo);
    }
    if (!partialCaptureRequest) {
        errorCode = 'INVALID_REQUEST';
        errorMessage = 'Inavlid XML Request ';
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    var PaymentMgr = require('dw/order/PaymentMgr');
    var paymentIntrument = order.getPaymentInstrument();
    var apmName = paymentIntrument.getPaymentMethod();
    // Fetch the APM Type from the Payment Method i.e. if the Payment Methoid is of DIRECT or REDIRECT type.
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    WorldpayPreferences = new WorldpayPreferences();
    var preferences = WorldpayPreferences.worldPayPreferencesInit(paymentMthd, order);
    var responseObject = utils.serviceCall(partialCaptureRequest, null, preferences, null);   // Making Service Call and Getting Response

    let responseResult = validateResponse(responseObject);
    if (responseResult && responseResult.error) {
        return responseResult;
    }

    var result = responseObject.object;
    var response = utils.parseResponse(result);
    Logger.getLogger('worldpay').debug('AuthorizeOrderService Response string : ' + result);
    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = utils.getErrorMessage(errorCode);
        if (currentSite.getCustomPreferenceValue('enableErrorMailService')) {
            utils.sendErrorNotification(orderID, worldpayConstants.PARTIAL_CAPTURE_FAILED, paymentMethod);
        }
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, response: response };
}

/**
 * Function to create request for partial caputure in csc
 * @param {Object} orderID - orderid
 * @param {string} settleAmount - amount to be captured
 * @param {Object} currency - currency
 * @param {Object} shipmentNo - shipmentNo
 * @return {Object} returns an JSON object
 */
function cscPartialRefund(orderID, settleAmount, currency, shipmentNo) {
    var errorCode = '';
    var errorMessage = '';
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderID);
    var paymentMethod = order.paymentInstrument.getPaymentMethod();
    var PaymentMgr = require('dw/order/PaymentMgr');
    // Fetch the APM Name from the Payment isntrument.
    var paymentIntrument = order.getPaymentInstrument();
    var apmName = paymentIntrument.getPaymentMethod();
    // Fetch the APM Type from the Payment Method i.e. if the Payment Methoid is of DIRECT or REDIRECT type.
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    var partialRefundRequest;
    if ((paymentMethod === worldpayConstants.KLARNA || paymentMethod === worldpayConstants.KLARNASLICEIT || paymentMethod === worldpayConstants.KLARNAPAYLATER || paymentMethod === worldpayConstants.KLARNAPAYNOW)) {
        partialRefundRequest = libCreateRequest.createKlarnaRefundRequest(orderID, settleAmount, currency);
    } else {
        partialRefundRequest = libCreateRequest.createPartialRefundRequest(orderID, settleAmount, currency, shipmentNo);
    }
    if (!partialRefundRequest) {
        errorCode = 'INVALID_REQUEST';
        errorMessage = 'Inavlid XML Request ';
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    WorldpayPreferences = new WorldpayPreferences();
    var preferences = WorldpayPreferences.worldPayPreferencesInit(paymentMthd, order);
    var responseObject = utils.serviceCall(partialRefundRequest, null, preferences, null);   // Making Service Call and Getting Response

    let responseResult = validateResponse(responseObject);
    if (responseResult && responseResult.error) {
        return responseResult;
    }

    var result = responseObject.object;
    var response = utils.parseResponse(result);
    Logger.getLogger('worldpay').debug('AuthorizeOrderService Response string : ' + result);
    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = utils.getErrorMessage(errorCode);
        if (currentSite.getCustomPreferenceValue('enableErrorMailService')) {
            utils.sendErrorNotification(orderID, worldpayConstants.PARTIAL_REFUND_FAILED, paymentMethod);
        }
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, response: response };
}

/**
 * Function to create request for partial caputure in csc
 * @param {Object} orderID - orderid
 * @return {Object} returns an JSON object
 */
function cscCancel(orderID) {
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderID);
    var errorCode = '';
    var errorMessage = '';
    var cancelRequest = libCreateRequest.createCancelRequest(orderID);
    if (!cancelRequest) {
        errorCode = 'INVALID_REQUEST';
        errorMessage = 'Inavlid XML Request ';
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    var PaymentMgr = require('dw/order/PaymentMgr');
    var paymentIntrument = order.getPaymentInstrument();
    var apmName = paymentIntrument.getPaymentMethod();
    // Fetch the APM Type from the Payment Method i.e. if the Payment Methoid is of DIRECT or REDIRECT type.
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    WorldpayPreferences = new WorldpayPreferences();
    var preferences = WorldpayPreferences.worldPayPreferencesInit(paymentMthd, order);
    var responseObject = utils.serviceCall(cancelRequest, null, preferences, null);   // Making Service Call and Getting Response

    let responseResult = validateResponse(responseObject);
    if (responseResult && responseResult.error) {
        return responseResult;
    }

    var result = responseObject.object;
    var response = utils.parseResponse(result);
    Logger.getLogger('worldpay').debug('AuthorizeOrderService Response string : ' + result);
    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = utils.getErrorMessage(errorCode);
        if (currentSite.getCustomPreferenceValue('enableErrorMailService')) {
            utils.sendErrorNotification(orderID, worldpayConstants.ORDER_CANCEL_FAILED, '');
        }
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, response: response };
}
/**
 * Service wrapper for Create Token from My Account
 * @param {Object} customer - customer object
 * @param {Object} paymentInstrument - PaymentInstrument
 * @param {Object} preferences - worldpay preferences
 * @param {number} cardNumber - Card Number
 * @param {number} expirationMonth - Expiration Month
 * @param {number} expirationYear - Expiration Year
 * @return {Object} returns an JSON object
 */
function createTokenWOP(customer, paymentInstrument, preferences, cardNumber, expirationMonth, expirationYear) {
    var order = libCreateRequest.createTokenRequestWOP(customer, paymentInstrument, preferences, cardNumber, expirationMonth, expirationYear);
    let orderRequestResult = validateOrderRequest(order);
    if (orderRequestResult && orderRequestResult.error) {
        return orderRequestResult;
    }
    var responseObject = utils.serviceCall(order, null, preferences, null);
    let responseResult = validateResponse(responseObject);
    if (responseResult && responseResult.error) {
        return responseResult;
    }
    var result = responseObject.object;
    Logger.getLogger('worldpay').debug('CCAuthorizeRequestService Response string : ' + result);
    var response = utils.parseResponse(result);
    // checks if any error occurs
    let responseErrorResult = responseErrorCheck(response);
    if (responseErrorResult && responseErrorResult.error) {
        return responseErrorResult;
    }
    return { success: true, serviceresponse: response, responseObject: responseObject };
}

/**
 * Sends Updates token data to Worldpay and resolves conflicts
 * @param {Object} customer - current customer object
 * @param {Object} paymentInstrument - payment instrument used for order payment
 * @param {Object} responseData - response from worldpay
 * @param {string} expirationMonth - card expiry month
 * @param {string} expirationYear - card expiry year
 * @returns {Object} - returns success or error object
 */
function updateTokenWOP(customer, paymentInstrument, responseData, expirationMonth, expirationYear) {
    var PaymentMgr = require('dw/order/PaymentMgr');
    // Fetch the APM Type from the Payment Method i.e. if the Payment Methoid is of DIRECT or REDIRECT type.
    var paymentMthd = PaymentMgr.getPaymentMethod('CREDIT_CARD');
    var worldpayPreferences = new WorldpayPreferences();
    var preferences = worldpayPreferences.worldPayPreferencesInit(paymentMthd);
    var errorCode = '';
    var errorMessage = '';
    var order = libCreateRequest.updateTokenRequestWOP(customer, preferences, responseData, expirationMonth, expirationYear);
    if (!order) {
        errorCode = 'INVALID_REQUEST';
        errorMessage = 'Inavlid XML Request ';
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    var responseObject = utils.serviceCall(order, null, preferences, null);
    if (!responseObject) {
        errorCode = 'RESPONSE_EMPTY';
        errorMessage = utils.getErrorMessage('servererror');
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    } else if ('status' in responseObject && responseObject.getStatus().equals('SERVICE_UNAVAILABLE')) {
        errorCode = 'SERVICE_UNAVAILABLE';
        errorMessage = utils.getErrorMessage('servererror');
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    var result = responseObject.object;
    Logger.getLogger('worldpay').debug('CCAuthorizeRequestService Response string : ' + result);
    var response = utils.parseResponse(result);
    // checks if any error occurs
    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = utils.getErrorMessage(errorCode);
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, serviceresponse: response, responseObject: responseObject };
}

/**
 * Function to create request for deleting payment token from Account dashboard
 * @param {Object} payment - PaymentInstrument
 * @param {string} customerNo - Customer Number
 * @param {Object} preferences - worldpay preferences
 * @return {Object} returns an JSON object
 */
function deleteToken(payment, customerNo, preferences) {
    var errorCode = '';
    var errorMessage = '';
    var deleteTokenReq = libCreateRequest.deletePaymentToken(payment, customerNo, preferences);
    if (!deleteTokenReq) {
        errorCode = 'INVALID_REQUEST';
        errorMessage = 'Inavlid XML Request ';
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }

    var responseObject = utils.serviceCall(deleteTokenReq, null, preferences, null);
    let responseResult = validateResponse(responseObject);
    if (responseResult && responseResult.error) {
        return responseResult;
    }
    var result = responseObject.object;
    Logger.getLogger('worldpay').debug('CCAuthorizeRequestService Response string : ' + result);
    var response = utils.parseResponse(result);
    // checks if any error occurs
    if (response.isError()) {
        errorCode = response.getErrorCode();
        errorMessage = utils.getErrorMessage(errorCode);
        if (currentSite.getCustomPreferenceValue('enableErrorMailService')) {
            utils.sendErrorNotification('', worldpayConstants.DELETE_TOKEN_FAILED, '');
        }
        return { error: true, errorCode: errorCode, errorMessage: errorMessage };
    }
    return { success: true, serviceresponse: response, responseObject: responseObject };
}

/**
 * Function to create request for getting response for device data collection
 * @param {string} bin - Card Number
 * @param {string} JWT - JWT
 * @return {Object} returns an JSON object
 */
function getDDCResponse(bin, JWT) {
    var responseObject = utils.serviceCalldDC(bin, JWT);
    let responseResult = validateResponse(responseObject);
    if (responseResult && responseResult.error) {
        return responseResult;
    }
    return { success: true, responseObject: responseObject.object };
}
module.exports.initiateCancelOrderService = initiateCancelOrderService;
module.exports.authorizeOrderService = authorizeOrderService;
module.exports.orderInquiryRequestService = orderInquiryRequestService;
module.exports.secondAuthorizeRequestService = secondAuthorizeRequestService;
module.exports.secondAuthorizeRequestService2 = secondAuthorizeRequestService2;
module.exports.apmLookupService = apmLookupService;
module.exports.ccAuthorizeRequestService = ccAuthorizeRequestService;
module.exports.createCaptureService = createCaptureService;
module.exports.confirmationRequestKlarnaService = confirmationRequestKlarnaService;
module.exports.voidSaleService = voidSaleService;
module.exports.createTokenWOP = createTokenWOP;
module.exports.deleteToken = deleteToken;
module.exports.updateTokenWOP = updateTokenWOP;
module.exports.cscPartialCapture = cscPartialCapture;
module.exports.getDDCResponse = getDDCResponse;
module.exports.cscPartialRefund = cscPartialRefund;
module.exports.cscCancel = cscCancel;
module.exports.secondAuthenticate3DRequestService = secondAuthenticate3DRequestService;
