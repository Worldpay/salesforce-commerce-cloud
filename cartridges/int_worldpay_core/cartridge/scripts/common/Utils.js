/**
 * This script provides utility functions shared across other
 * related scripts. Reused script components for request creation,
 * while this script is imported into the
 * requiring script.
 */

var Logger = require('dw/system/Logger');
var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
var Resource = require('dw/web/Resource');

/**
 * Fail the order.
 * @param {Object} order - order object
 * @param {string} errorMessage - message for failure
 * @return {Object} returns an json object
 */
function failImpl(order, errorMessage) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var orderstatus;
    Transaction.wrap(function () {
        if (order instanceof dw.order.Order) {
            orderstatus = OrderMgr.failOrder(order, true);
        } else {
            orderstatus = OrderMgr.failOrder(order.object, true);
        }
    });
    if (orderstatus && !orderstatus.isError()) {
        return { error: false };
    }
    return { error: true, errorMessage: errorMessage };
}

/**
 * get value of configured label
 * @param {string} labelName - label name
 * @param {string} typeOfLabel - type of Label
 * @return {string} returns label value
 */
function getConfiguredLabel(labelName, typeOfLabel) {
    var Site = require('dw/system/Site');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var isConfigurationLableEnabled = Site.getCurrent().getCustomPreferenceValue('EnableConfigurableLabels');
    if (isConfigurationLableEnabled) {
        var labelNameValuePairCustomObject = CustomObjectMgr.getCustomObject('ConfiguredLabels', labelName);
        if (labelNameValuePairCustomObject && labelNameValuePairCustomObject.custom.labelValue) {
            return labelNameValuePairCustomObject.custom.labelValue;
        }
    }
    return Resource.msg(labelName, typeOfLabel, null);
}

/**
 * Check device as desktop, mobile or tablet based on request useragent.
 * @return {boolean} returns an boolean object
 */
function isDesktopDevice() {
    var userAgent = request.getHttpUserAgent();
    if (userAgent && (/Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/i.test(userAgent))) {
        return false;
    }
    return true;
}

/**
 * Check for HPP custom uption JSON if available return its type else null
 * @param {Object} paymentMthd - payment Method object
 * @return {boolean} returns an boolean object
 */
function isValidCustomOptionsHPP(paymentMthd) {
    var o = null;
    if (paymentMthd.custom.wordlpayHPPCustomOptionsJSON) {
        try {
            o = JSON.parse(paymentMthd.custom.wordlpayHPPCustomOptionsJSON);
            if (!(o.type) || o.type.equalsIgnoreCase(WorldpayConstants.LIGHTBOX)) {
                if (!isDesktopDevice()) {
                    return null;
                }
            }
        } catch (ex) {
            Logger.getLogger('worldpay').error('getCustomOptionsHPP : JSON Parsing exception ' + ex);
            return null;
        }
    }
    return o == null ? null : o.type.toLowerCase();
}

/**
 * Retrieve JSON string to render HPP iframe or lighbox
 * @param {Object} paymentMthd - payment Method object
 * @param {string} worldPayRedirectURL - world Pay Redirect URL
 * @param {string} orderNo - order number
 * @param {string} token - token
 * @param {string} preferedCard - prefered card
 * @return {JSON} returns an JSON object
 */
function getCustomOptionsHPP(paymentMthd, worldPayRedirectURL, orderNo, token, preferedCard) {
    var o = null;
    if (paymentMthd.custom.wordlpayHPPCustomOptionsJSON) {
        try {
            o = JSON.parse(paymentMthd.custom.wordlpayHPPCustomOptionsJSON);
            if (!o.type) {
                return null;
            }
            if (o.type && o.type.equalsIgnoreCase(WorldpayConstants.LIGHTBOX) && !isDesktopDevice()) {
                return null;
            }
            var Locale = require('dw/util/Locale');
            var URLUtils = require('dw/web/URLUtils');
            o.type = o.type.toLowerCase();
            o.iframeIntegrationId = 'libraryObject';
            o.iframeHelperURL = URLUtils.https('Page-Show', 'cid', 'worldpayhelper').toString();
            o.iframeBaseURL = 'https://' + request.httpHost;
            o.url = worldPayRedirectURL;
            o.inject = 'immediate';
            o.target = 'custom-html';
            o.trigger = 'custom-trigger';
            o.accessibility = true;
            o.language = Locale.getLocale(request.getLocale()).language;
            o.country = Locale.getLocale(request.getLocale()).country.toLowerCase();
            if (preferedCard) {
                o.preferredPaymentMethod = preferedCard;
            } else {
                o.preferredPaymentMethod = '';
            }
            o.successURL = URLUtils.https('COPlaceOrder-Submit', WorldpayConstants.ORDERID, orderNo, WorldpayConstants.ORDERTOKEN, token, WorldpayConstants.PAYMENTSTATUS, WorldpayConstants.AUTHORIZED).toString();
            o.cancelURL = URLUtils.https('COPlaceOrder-Submit', WorldpayConstants.ORDERID, orderNo, WorldpayConstants.ORDERTOKEN, token).toString();
            o.failureURL = URLUtils.https('COPlaceOrder-Submit', WorldpayConstants.ORDERID, orderNo, WorldpayConstants.ORDERTOKEN, token).toString();
            o.pendingURL = URLUtils.https('COPlaceOrder-Submit', WorldpayConstants.ORDERID, orderNo, WorldpayConstants.ORDERTOKEN, token, WorldpayConstants.PAYMENTSTATUS, WorldpayConstants.PENDING).toString();
            o.errorURL = URLUtils.https('COPlaceOrder-Submit', WorldpayConstants.ORDERID, orderNo, WorldpayConstants.ORDERTOKEN, token).toString();
        } catch (ex) {
            Logger.getLogger('worldpay').error('getCustomOptionsHPP : JSON Parsing exception ' + ex);
            return null;
        }
    }
    return o == null ? null : JSON.stringify(o);
}


/**
 * Calculates the amount to be payed by a non-gift certificate payment instrument based
 * on the given order. The method subtracts the amount of all redeemed gift certificates
 * from the order total and returns this value.
 * @param {Object} order - order object
 * @return {number} return the amount
 */
function calculateNonGiftCertificateAmount(order) {
    var Money = require('dw/value/Money');
  // the total redemption amount of all gift certificate payment instruments in the order
    var giftCertTotal = new Money(0.0, order.currencyCode);

  // get the list of all gift certificate payment instruments
    var gcPaymentInstrs = order.getGiftCertificatePaymentInstruments();
    var iter = gcPaymentInstrs.iterator();
    var orderPI = null;

  // sum the total redemption amount
    while (iter.hasNext()) {
        orderPI = iter.next();
        giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
    }

  // get the order total
    var orderTotal = order.totalGrossPrice;

  // calculate the amount to charge for the payment instrument
  // this is the remaining open order total which has to be paid
    var amountOpen = orderTotal.subtract(giftCertTotal);

  // return the open amount
    return amountOpen;
}

/**
 * Sends the order XML/request XML to the server via service call and returns the answer or null if not successfull
 * @param {XML} requestXML - Request XML
 * @param {Object} requestHeader - request header
 * @param {Object} preferences - preferences object
 * @param {string} merchantID - merchantID configured in preference
 * @return {Object} return the result
 */
function serviceCall(requestXML, requestHeader, preferences, merchantID) {
	var ServiceRegistry = require('dw/svc/LocalServiceRegistry');
    var Encoding = require('dw/crypto/Encoding');
    var Bytes = require('dw/util/Bytes');
    var orderXMLstring = WorldpayConstants.XMLVERSION + WorldpayConstants.DTDINFO + requestXML.toXMLString();
    var service;
    var result;
    try {
        if (preferences.missingPreferences()) {
            Logger.getLogger('worldpay').error('Request Creation : Worldpay preferences are not properly set.');
            return null;
        }
        service = ServiceRegistry.createService("int_worldpay.http.worldpay.payment.post",
        		{
        	createRequest: function (svc, message) {

        		 if (merchantID) {
        	            svc.setCredentialID(merchantID);
        	        } else {
        	            svc.setCredentialID(preferences.merchantCode);
        	        }
        	        if (requestHeader && !merchantID) {
        	            svc.addHeader('Cookie', requestHeader);
        	        }
        	        if (preferences.userName && preferences.XMLPassword && !merchantID) {
        	            var bytedata = preferences.userName + ':' + preferences.XMLPassword;
        	            var encodedAuth = Encoding.toBase64(new Bytes(bytedata));
        	            svc.addHeader('Authorization', 'BASIC ' + encodedAuth);
        	        }

            return message;
        },
            parseResponse: function (svc, client) {
                var responseHeaders = client.getResponseHeaders();
                if(!empty(responseHeaders.get('Set-Cookie') && !empty(responseHeaders.get('Set-Cookie').length))){
                    session.privacy.serviceCookie = responseHeaders.get('Set-Cookie')[0];
                }
                return client.text;
            },
            filterLogMessage : function (message){
                var messgaeString = JSON.stringify(message);
                var mapObj = [{regex:/<cardNumber>.*<\/cardNumber>/, val:"<cardNumber>*******</cardNumber>"},
                            {regex:/<cvc>.*<\/cvc>/, val:"<cvc>***</cvc>"},
                            {regex:/<accountNumber>.*<\/accountNumber>/, val: "<accountNumber>******</accountNumber>"},
                            {regex:/<routingNumber>.*<\/routingNumber>/, val: "<routingNumber>******</routingNumber>"},
                            {regex:/<iban>.*<\/iban>/, val: "<iban>******</iban>"},
                            {regex:/<checkNumber>.*<\/checkNumber>/, val: "<checkNumber>******</checkNumber>"},
                            {regex:/<shopperEmailAddress>.*<\/shopperEmailAddress>/, val:"<shopperEmailAddress>******</shopperEmailAddress>"},
                            {regex:/<cpf>.*<\/cpf>/, val:"<cpf>******</cpf>"}];
                for each(regex in mapObj) {
                    messgaeString = messgaeString.replace(regex.regex, regex.val);
                }

                var parsedmessgaeString = JSON.parse(messgaeString);
                return parsedmessgaeString;

            },
            mockCall: function() {
                return {
                    statusCode: 200,
                    statusMessage: "Form post successful",
                    text: "MOCK RESPONSE (" + svc.URL + ")"
                    };
    }

    }

);
        Logger.getLogger('worldpay').debug('Request: ' + getLoggableRequest(orderXMLstring));

    // Make the service call here
        result = service.call(orderXMLstring);
        if (result == null || service == null || result.getStatus().equals('SERVICE_UNAVAILABLE')) {
            Logger.getLogger('worldpay').error('WORLDPAY RESULT IS EMPTY ' + result + ' OR SERVICE IS EMPTY ' + service);
            return result;
        }
        return result;
    } catch (ex) {
        Logger.getLogger('worldpay').error('WORLDPAY SERVICE EXCEPTION: ' + ex);
        return null;
    }
}

/**
 * Method identifies the sensitive data and prevents logging them.
 * @param {XML} requestXML - Request XML
 * @return {XML} return the XML
 */
function getLoggableRequest (requestXML) {
	var messgaeString = JSON.stringify(requestXML);
	var mapObj = [{regex:/<cardNumber>.*<\/cardNumber>/, val:"<cardNumber>*******</cardNumber>"},
	              {regex:/<cvc>.*<\/cvc>/, val:"<cvc>***</cvc>"},
	              {regex:/<accountNumber>.*<\/accountNumber>/, val: "<accountNumber>******</accountNumber>"},
	              {regex:/<routingNumber>.*<\/routingNumber>/, val: "<routingNumber>******</routingNumber>"},
	              {regex:/<iban>.*<\/iban>/, val: "<iban>******</iban>"},
	              {regex:/<checkNumber>.*<\/checkNumber>/, val: "<checkNumber>******</checkNumber>"},
	              {regex:/<shopperEmailAddress>.*<\/shopperEmailAddress>/, val:"<shopperEmailAddress>******</shopperEmailAddress>"},
	              {regex:/<cpf>.*<\/cpf>/, val:"<cpf>******</cpf>"}];
	for each(regex in mapObj) {
		messgaeString = messgaeString.replace(regex.regex, regex.val);
	}

	var parsedmessgaeString= JSON.parse(messgaeString);
	return parsedmessgaeString;
}


/**
 * Method identifies the error message based upon the error code received in the response.
 * @param {string} errorCode - error Code
 * @return {string} return the error message
 */
function getErrorMessage(errorCode) {
	var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');

    var errorMessage = null;
    var errorProperty = 'worldpay.error.code' + errorCode;
    errorMessage = getConfiguredLabel(errorProperty, 'worldpayerror');
    var EnableCustomExtendedResponseMessages = Site.getCurrent().getCustomPreferenceValue('EnableCustomExtendedResponseMessages');

    // Generic Error Message set when ErrorCode is empty or ErrorCode is not valid.
    if (!errorCode) {
        errorMessage = getConfiguredLabel('worldpay.error.generalerror', 'worldpayerror');
    }

    if (errorCode) {
        if (EnableCustomExtendedResponseMessages && errorCode.length > 0 && parseInt(errorCode) !== 'NaN' && parseInt(errorCode) > 0) {
            var extendedResponseObj = CustomObjectMgr.getCustomObject('CustomExtendedResponseMessages', errorCode);
            if (extendedResponseObj && 'errorMessage' in extendedResponseObj.custom && extendedResponseObj.custom.errorMessage) {
                errorMessage = extendedResponseObj.custom.errorMessage;
            }

        } else {
            errorMessage = getConfiguredLabel(errorProperty, 'worldpayerror');
        }
    }
    return errorMessage;
}

/**
 * Hook function for generating session id. This function is called during the xml order
 * creation. This function can be modified if other session ID format desired.
 * @param {string} data - data
 * @return {string} return the data
 */
function createSessionID(data) {
    return data;
}

/**
 * Hook function for order description. This function is called during the xml order
 * creation. This function can be modified if other data or format is desired.
 * @param {string} data - data
 * @return {string} return the data
 */
function createOrderDescription(data) {
    return 'Merchant Order No ' + data;
}


/**
 * Parses the server response
 * @param {string} inputString - input
 * @return {Object} return the response
 */
function parseResponse(inputString) {
    var ResponseData = require('*/cartridge/scripts/object/ResponseData');
    var responseData = new ResponseData();
    var response = responseData.parseXML(inputString);
    if (response.status || response.error || response.errorCode || response.errorMessage== "Token does not exist" || response.threeDSVersion) {
        return response;
    }
    Logger.getLogger('worldpay')
      .error('Error occured on parsing the XML response:\n ' + response.toString());
    return null;
}

/**
 * convert to CDATA
 * @param {string} data - data
 * @return {string} return the data
 */
function convert2cdata(data) {
   return new XML('<![CDATA[' + data + ']]\>');
}

/**
 * Create html table
 * @param {string} data - data
 * @return {string} return the data
 */
function table(data) {
    return '<center><table border="1">' + data + '</table></center>';
}


/**
 * Create html table header
 * @param {string} data - data
 * @return {string} return the data
 */
function th(data) {
    return '<th>' + data + '</th>';
}


/**
 * Create html table data
 * @param {string} data - data
 * @return {string} return the data
 */
function td(data) {
    return '<td>' + data + '</td>';
}


/**
 * Create html table row
 * @param {string} data - data
 * @return {string} return the data
 */
function tr(data) {
    return '<tr>' + data + '</tr>';
}

/**
 * Creates the REDIRECT notification URL for Worldpay. Depending on your payment status
 * Worldpay redirects the shopper to one of this URL.
 * @param {string} apmName - apm Name
 * @param {string} reference - transaction reference
 * @param {string} orderNo - transaction merchant number
 * @param {string} countryCode - countryCode
 * @param {string} token - transaction payment token
 * @return {string} returns an xml string formed for service request
*/
function createRedirectURL(apmName, reference, orderNo, countryCode, token) {
    var URLUtils = require('dw/web/URLUtils');
    var WorldpayPreferences = require('*/cartridge/scripts/object/WorldpayPreferences');
    var result = '';
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit();
    if ((apmName.equalsIgnoreCase(WorldpayConstants.CHINAUNIONPAY)) || (apmName.equalsIgnoreCase(WorldpayConstants.ENETSSSL))) {
        result = '&preferredPaymentMethod=' + apmName;
    }
    result = reference + result + '&language=' + preferences.language + '&country=' + countryCode

    + '&successURL=' + encodeURIComponent(URLUtils.https('COPlaceOrder-Submit', WorldpayConstants.ORDERID, orderNo, WorldpayConstants.ORDERTOKEN, token, WorldpayConstants.PAYMENTSTATUS, WorldpayConstants.AUTHORIZED).toString())    // order number is needed for the order ceation. this param. is mandatory
    + '&pendingURL=' + encodeURIComponent(URLUtils.https('COPlaceOrder-Submit', WorldpayConstants.ORDERID, orderNo, WorldpayConstants.ORDERTOKEN, token, WorldpayConstants.PAYMENTSTATUS, WorldpayConstants.PENDING).toString());
    if (apmName.equalsIgnoreCase(WorldpayConstants.CHINAUNIONPAY)) {
        result += encodeURIComponent('&status=FAILURE');
    }
    result = result + '&failureURL=' + encodeURIComponent(URLUtils.https('COPlaceOrder-Submit', WorldpayConstants.ORDERID, orderNo, WorldpayConstants.ORDERTOKEN, token).toString())
    + '&cancelURL=' + encodeURIComponent(URLUtils.https('COPlaceOrder-Submit', WorldpayConstants.ORDERID, orderNo, WorldpayConstants.ORDERTOKEN, token).toString());

    return result;
}


/**
 * Creates the DIRECT notification URL for Worldpay. Depending on your payment status
 * Worldpay redirects the shopper to one of this URL.
 * @param {string} reference - transaction reference
 * @param {string} orderNo - transaction merchant number
 * @param {string} countryCode - countryCode
 * @return {string} return the reference
 */
function createDirectURL(reference, orderNo, countryCode) {
    var result = '';
    result = reference
    + '&country=' + countryCode
    // order number is needed for the order ceation. this param. is mandatory
    + '&orderNo=' + orderNo;

    return result;
}


/**
 * Update transaction status in order custom attribute
 * @param {dw.order.LineItemCtnr} order - order object
 * @param {string} updatedStatus - updated status
 * @return {Object} returns an arraylist for status history object
*/
function updateTransactionStatus(order, updatedStatus) {
    var ArrayList = require('dw/util/ArrayList');
    var statusHist = order.custom.transactionStatus;
    var COtimeStamp = new Date();
    var statusList;
    if (statusHist == null && statusHist.length < 0) {
        statusList = new ArrayList();
    } else {
        statusList = new ArrayList(statusHist);
    }

    statusList.addAt(0, updatedStatus + ':' + COtimeStamp);
    return statusList;
}

/**
 * get Worldpay general error message
 * @param {string} errCode - error code
 * @param {string} errMessage - error message
 * @return {Object} returns an json object
*/
function worldpayErrorMessage(errCode, errMessage) {
    var Resource = require('dw/web/Resource');
    var errorCode = !errCode ? 'UNKOWN' : errCode;
    var errorMessage = !errMessage ? getConfiguredLabel('worldpay.error.generalerror', 'worldpayerror') : errMessage;

    return { code: errorCode, errorMessage: errorMessage };
}

/**
 * Get credit card payment instrument
 * @param {dw.order.LineItemCtnr} order - order object
 * @return {dw.order.OrderPaymentInstrument} returns an paymentIntrument object
 */
function getPaymentInstrument(order) {
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var paymentInstruments = order.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
    var paymentIterator = paymentInstruments.iterator();
    var paymentIntrument;
    while (paymentIterator.hasNext()) {
        var pi = paymentIterator.next();
        if (pi.paymentMethod.equals(PaymentInstrument.METHOD_CREDIT_CARD)) {
            paymentIntrument = pi;
        }
    }

    return paymentIntrument;
}

/**
 * Get Worldpay Order attributes
 * @param {string} paymentStatus - transaction payment status
 * @return {Object} returns an json object
 */
function getWorldpayOrderInfo(paymentStatus) {
    var orderKey;
    var mac;
    var orderAmount;
    var orderCurrency;
    var orderStatus = null;
    if (paymentStatus && paymentStatus.equalsIgnoreCase(WorldpayConstants.AUTHORIZED)) {
        orderKey = request.httpParameterMap.orderKey.value;
        mac = request.httpParameterMap.mac.value;
        orderAmount = request.httpParameterMap.paymentAmount.value;
        orderCurrency = request.httpParameterMap.paymentCurrency.value;
        orderStatus = request.httpParameterMap.paymentStatus.value;
    } else if (paymentStatus && !paymentStatus.equalsIgnoreCase(WorldpayConstants.AUTHORIZED) && !paymentStatus.equalsIgnoreCase(WorldpayConstants.PENDING)) {
        orderKey = request.httpParameterMap.orderKey.value;
        mac = request.httpParameterMap.mac.value;
        orderAmount = request.httpParameterMap.orderAmount.value != null ? request.httpParameterMap.orderAmount.value : request.httpParameterMap.paymentAmount.value;
        orderCurrency = request.httpParameterMap.orderCurrency.value != null ? request.httpParameterMap.orderCurrency.value : request.httpParameterMap.paymentCurrency.value;
        orderStatus = request.httpParameterMap.orderStatus.value != null ? request.httpParameterMap.orderStatus.value : request.httpParameterMap.paymentStatus.value;
    }
    return { orderKey: orderKey, mac: mac, orderAmount: orderAmount, orderCurrency: orderCurrency, orderStatus: orderStatus };
}

/**
  * Send order confirmation and clear used forms within the checkout process.
  * @param {dw.order.LineItemCtnr} order - order object
 */
function sendEmailNotification(order) {
	var Site = require('dw/system/Site');
	var siteController = Site.getCurrent().getCustomPreferenceValue('siteController');
    var Email = require(siteController + '/cartridge/scripts/models/EmailModel');
	Email.get('mail/orderconfirmation', order.getCustomerEmail())
              .setSubject('Your order with Demandware online store')
              .send({
                  Order: order
              });
}

/**
 * Add custom object entry for order notification recieved
 * @param {string} xmlString - xml arrived for custom object notification
 * @return {Object} returns an json object
 */
function addNotifyCustomObject(xmlString) {
    var content;
    var errorCode;
    var errorMessage;
    try {
        content = new XML(xmlString);
    } catch (ex) {
        errorCode = WorldpayConstants.NOTIFYERRORCODE111;
        errorMessage = getErrorMessage(errorCode);
        Logger.getLogger('worldpay').error('Order Notification : Add Custom Object : ' + errorCode + ' : ' + errorMessage + '  : ' + xmlString + '  : ' + ex);
        return { error: true, errorCode: errorCode, errorMessage: errorMessage, xmlString: xmlString };
    }


    var orderCode;
    try {
        if (content.localName().equalsIgnoreCase(WorldpayConstants.XMLPAYMENTSERVICE)) {
            var temp = content;
            if ('orderStatusEvent' in temp.notify) {
                orderCode = temp.notify.orderStatusEvent.attribute('orderCode').toString();
            } else {
                errorCode = WorldpayConstants.NOTIFYERRORCODE112;
                errorMessage = getErrorMessage(errorCode);
                Logger.getLogger('worldpay').error('Order Notification : Add Custom Object : ' + errorCode + ' : ' + errorMessage + '  : ' + xmlString);
            }
        } else {
            errorCode = WorldpayConstants.NOTIFYERRORCODE112;
            errorMessage = getErrorMessage(errorCode);
            Logger.getLogger('worldpay').error('Order Notification : Add Custom Object : ' + errorCode + ' : ' + errorMessage + '  : ' + xmlString);
        }
    } catch (ex) {
        errorCode = WorldpayConstants.NOTIFYERRORCODE111;
        errorMessage = getErrorMessage(errorCode);
        Logger.getLogger('worldpay').error('Order Notification : Add Custom Object : ' + errorCode + ' : ' + errorMessage + '  : ' + xmlString + '  : ' + ex);
        return { error: true, errorCode: errorCode, errorMessage: errorMessage, xmlString: xmlString };
    }

    try {
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var CO;
        var UUIDUtils = require('dw/util/UUIDUtils');
        var uuid = UUIDUtils.createUUID();
        var Transaction = require('dw/system/Transaction');
        Transaction.wrap(function () {
            CO = CustomObjectMgr.createCustomObject('OrderNotifyUpdates', uuid);
            CO.custom.xmlString = xmlString;
            CO.custom.timeStamp = new Date();
            CO.custom.orderNo = orderCode;
        });
        return { success: true };
    } catch (e) {
        errorCode = WorldpayConstants.NOTIFYERRORCODE111;
        errorMessage = getErrorMessage(errorCode);
        Logger.getLogger('worldpay').error('Order Notification : Add Custom Object : ' + errorCode + ' : ' + errorMessage + '  : ' + xmlString + '  : ' + e);
        return { error: true, errorCode: errorCode, errorMessage: errorMessage, xmlString: xmlString };
    }
}

/**
 * Validate IP Address range
 * @param {string} requestRemoteAddress - remote IP address of request
 * @return {Object} returns an json object
 */
function validateIP(requestRemoteAddress) {
    var Site = require('dw/system/Site');
    if (Site.getCurrent().preferences.custom.WorldpayNotificationIPAddressesStart
      && Site.getCurrent().preferences.custom.WorldpayNotificationIPAddressesEnd) {
        var currentIPAddress = requestRemoteAddress;
        while (currentIPAddress.indexOf('.') > -1) {
            currentIPAddress = currentIPAddress.replace('.', '');
        }
        var start = Number(Site.getCurrent().getCustomPreferenceValue('WorldpayNotificationIPAddressesStart'));
        var end = Number(Site.getCurrent().getCustomPreferenceValue('WorldpayNotificationIPAddressesEnd'));
        if (Number(currentIPAddress) >= start &&
        Number(currentIPAddress) <= end) {
            return { success: true, error: false };
        }
        Logger.getLogger('worldpay').error('ValidateIP : start : ' + start + ' end: ' + end + ' currentIPAddress: ' + currentIPAddress);
    }
    return { error: true };
}

/**
 * Validate mac value
 * @param {string} MACValue - mac value configured
 * @param {string} OrderKey - order key arrived
 * @param {string} PaymentAmount - transaction amount
 * @param {string} PaymentCurrency - transaction currency
 * @param {string} PaymentStatus - transaction payment status
 * @return {Object} returns an json object
 */
function verifyMac(MACValue, OrderKey, PaymentAmount, PaymentCurrency, PaymentStatus) {
    var WorldpayPreferences = require('*/cartridge/scripts/object/WorldpayPreferences');
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit();
  // return {success : true};
    if (!preferences.MACSecretCode) {
        return { error: true };// mac is not set.Kindly Set MAC password at worldpay Console and set same password in Site pref
    }
    var value = OrderKey + PaymentAmount
    + PaymentCurrency + (PaymentStatus || '')
    + preferences.MACSecretCode;
    var MessageDigest = require('dw/crypto/MessageDigest');
    var md5 = new MessageDigest(WorldpayConstants.MESSAGEDIGEST);
    var calculatedMAC = md5.digest(value);
    if (calculatedMAC.equals(MACValue)) {
        return { success: true }; // mac is valid
    }
    return { error: true }; // mac is invalid
}

function calculateNonGiftCertificateAmountFromBasket(lineItemCtnr) {
    var totalAmount;
    var Money = require('dw/value/Money');
    if (lineItemCtnr.totalGrossPrice.available) {
        totalAmount = lineItemCtnr.totalGrossPrice;
    } else {
        totalAmount = lineItemCtnr.adjustedMerchandizeTotalPrice;
    }
    var giftCertTotal = new Money(0.0, lineItemCtnr.currencyCode);
    var gcPaymentInstrs = lineItemCtnr.getGiftCertificatePaymentInstruments();
    var iter = gcPaymentInstrs.iterator();
    var orderPI = null;
    while (iter.hasNext()) {
        orderPI = iter.next();
        giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
    }
    var orderTotal = totalAmount;
    var amountOpen = orderTotal.subtract(giftCertTotal);
    return amountOpen;
}


function serviceCalldDC(bin, JWT) {
	var ServiceRegistry = require('dw/svc/LocalServiceRegistry');
    var Encoding = require('dw/crypto/Encoding');
    var Bytes = require('dw/util/Bytes');
    var Site = require('dw/system/Site');
    var service;
    var result;
    try {
        service = ServiceRegistry.createService("ddc.post", {
        	createRequest: function (svc, params) {
            svc.addParam('Bin', bin);
            svc.addParam('JWT',JWT);
            return params;
        },
            parseResponse: function (svc, client) {
                var responseHeaders = client.getResponseHeaders();
                if(!empty(responseHeaders.get('Set-Cookie') && !empty(responseHeaders.get('Set-Cookie').length))){
                    session.privacy.serviceCookie = responseHeaders.get('Set-Cookie')[0];
                }
                return client.text;
            },

            mockCall: function() {
                return {
                    statusCode: 200,
                    statusMessage: "Form post successful",
                    text: "MOCK RESPONSE (" + svc.URL + ")"
                    };
            }

        });
        // Make the service call here
        result = service.call();
        if (result == null || service == null || result.getStatus().equals('SERVICE_UNAVAILABLE')) {
            Logger.getLogger('worldpay').error('WORLDPAY RESULT IS EMPTY ' + result + ' OR SERVICE IS EMPTY ' + service);
            return result;
        }
        return result;
    } catch (ex) {
        Logger.getLogger('worldpay').error('WORLDPAY SERVICE EXCEPTION: ' + ex);
        return null;
    }
}



function getLanguage() {
	var Locale = require('dw/util/Locale');
	return Locale.getLocale(request.getLocale()).language;
}

/** Exported functions **/
module.exports = {
    failImpl: failImpl,
    validateIP: validateIP,
    verifyMac: verifyMac,
    isValidCustomOptionsHPP: isValidCustomOptionsHPP,
    getCustomOptionsHPP: getCustomOptionsHPP,
    calculateNonGiftCertificateAmount: calculateNonGiftCertificateAmount,
    calculateNonGiftCertificateAmountFromBasket : calculateNonGiftCertificateAmountFromBasket,
    serviceCall: serviceCall,
    getErrorMessage: getErrorMessage,
    createSessionID: createSessionID,
    createOrderDescription: createOrderDescription,
    parseResponse: parseResponse,
    convert2cdata: convert2cdata,
    table: table,
    th: th,
    td: td,
    tr: tr,
    createRedirectURL: createRedirectURL,
    createDirectURL: createDirectURL,
    updateTransactionStatus: updateTransactionStatus,
    addNotifyCustomObject: addNotifyCustomObject,
    worldpayErrorMessage: worldpayErrorMessage,
    sendEmailNotification: sendEmailNotification,
    getWorldpayOrderInfo: getWorldpayOrderInfo,
    getPaymentInstrument: getPaymentInstrument,
    isDesktopDevice: isDesktopDevice,
    getLoggableRequest: getLoggableRequest,
    isDesktopDevice: isDesktopDevice,
    getConfiguredLabel: getConfiguredLabel,
    serviceCalldDC: serviceCalldDC,
    getLanguage: getLanguage
};
