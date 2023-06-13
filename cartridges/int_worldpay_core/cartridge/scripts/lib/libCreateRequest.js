/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/** *******************************************************************************
*
* Description: Contains the functions to construct the request object for the
* various Worldpay Authorize request.
*
*
/*********************************************************************************/
var Logger = require('dw/system/Logger');
var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
var Resource = require('dw/web/Resource');
var requestObject = request;

/**
 * This method creates and update request
 * @param {Object} availableNetworks - availableNetworks object
 *  @param {Object} preferredNetworks - preferredNetworks object
 *  @param {Object} preferences - preferences object
 *  @param {Object} primeRoutingRequest - primeRoutingRequest object
 *  @param {Object} routingPreference - routingPreference object
 */
function getAvailableNetworks(availableNetworks, preferredNetworks, preferences, primeRoutingRequest, routingPreference) {
    for (var i = 0; i < availableNetworks.length; i++) {
        var networkName = new XML('<networkName> </networkName>');
        networkName.appendChild(availableNetworks[i].value);
        preferredNetworks.appendChild(networkName);
    }
    if (preferences.routingPreference.value != null && preferences.routingPreference) {
        primeRoutingRequest.appendChild(routingPreference);
    }
    if (preferences.debitNetworks.length !== 0 && preferences.debitNetworks) {
        primeRoutingRequest.appendChild(preferredNetworks);
    }
}
/**
 *This method creates and update request
 *  @param {Object} orderReq - current order request object
 *  @param {Object} orderObj - orderObj object
 *  @param {Object} paymentIntrument - paymentIntrument object
 *  @param {Object} preferences - preferences object
 *  @param {Object} echoData - echoData object
 *  @param {Object} payment - payment object
 *  @param {Object} shopperBrowser - shopperBrowser object
 * @return {XML} returns an order in XML object
 */
function getOrderObj(orderReq, orderObj, paymentIntrument, preferences, echoData, payment, shopperBrowser) {
    let createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    var enableTokenizationPref = createRequestHelper.getTokenPref(preferences);
    var order = orderReq;
    order.submit.order.paymentDetails.appendChild(payment);
    if (orderObj.getCustomerNo() != null && (enableTokenizationPref || paymentIntrument.creditCardToken) &&
        ((preferences.tokenType == null) || (paymentIntrument.custom.tokenScope == null &&
            !preferences.tokenType.toString().equals(worldpayConstants.merchanttokenType)) || (paymentIntrument.custom.tokenScope != null &&
            !paymentIntrument.custom.tokenScope.equals(worldpayConstants.merchanttokenType)))) {
        order.submit.order.shopper.appendChild(new XML('<authenticatedShopperID>' + orderObj.getCustomerNo() + '</authenticatedShopperID>'));
    }
    order.submit.order.shopper.appendChild(shopperBrowser);

    if (echoData) {
        var echoDataXML = new XML('<echoData>' + echoData + '</echoData>');
        order.submit.order.appendChild(echoDataXML);
    }
    var installments;
    createRequestHelper.addStatementNarrative(order);
    installments = paymentIntrument.custom.installments;
    if (installments) {
        order.submit.order.thirdPartyData.instalments = installments;
    }
    return order;
}

/**
 * This function to create the initial request xml for Credit card Authorization.
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {Object} req - Request
 * @param {dw.order.PaymentInstrument} paymentIntrument - payment intrument object
 * @param {Object} preferences - preferences object
 * @param {string} echoData - authorization response echoData string
 * @param {string} encryptedData - encryptedData
 * @param {Object} cardOrderObj - cardOrderObj
 * @return {XML} returns an order in XML object
 */
function createInitialRequest3D(orderObj, req, paymentIntrument, preferences, echoData, encryptedData, cardOrderObj) {
    var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    if (preferences.missingPreferences()) {
        Logger.getLogger('worldpay').error('Request Creation : Worldpay preferences are not properly set.');
        return null;
    }
    var enableTokenizationPref = createRequestHelper.getTokenPref(preferences);
    var orderNo = orderObj.orderNo;
    var paymentInstrumentUtils = require('*/cartridge/scripts/common/paymentInstrumentUtils');
    var payment;
    var billingAddress = orderObj.billingAddress;
    if (paymentIntrument.creditCardToken) {
        payment = paymentInstrumentUtils.getCardPaymentMethodToken(billingAddress, paymentIntrument, cardOrderObj.cvn);
    } else {
        var PaymentMgr = require('dw/order/PaymentMgr');
        var paymentCard = PaymentMgr.getPaymentCard(paymentIntrument.creditCardType);
        payment = paymentInstrumentUtils.getCardPaymentMethod(orderObj, paymentCard.custom.worldPayCardType, billingAddress, paymentIntrument, cardOrderObj, encryptedData);
    }

    let shopperBrowser = new XML('<browser><acceptHeader></acceptHeader><userAgentHeader></userAgentHeader></browser>');
    shopperBrowser.acceptHeader = req.httpHeaders.get(worldpayConstants.ACCEPT);
    shopperBrowser.userAgentHeader = req.httpHeaders.get('user-agent');

    // The result of request.getSession().getSessionID() in Demandware is not NMTOKEN.
    // use the createSessionID() function to cutomize the session ID
    let utils = require('*/cartridge/scripts/common/utils');
    let totalprice = utils.calculateNonGiftCertificateAmount(orderObj);
    let amount = totalprice.getValue();
    amount = (amount.toFixed(2) * (Math.pow(10, preferences.currencyExponent))).toFixed(0);

    let currency = totalprice.getCurrencyCode();
    let shippingAddress = orderObj.defaultShipment.shippingAddress;
    var transid = paymentIntrument.custom.transactionIdentifier;
    var storedCredentials = createRequestHelper.getStoredCredentials(paymentIntrument, enableTokenizationPref, orderObj, transid);

    var sessionXML = new XML('<session shopperIPAddress="' + request.httpRemoteAddress + '" id="' +
        createRequestHelper.createSessionID(orderNo) + '" />');
    var orderpaymentService = new XML('<?xml version="1.0"?><paymentService version="' +
        preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>');
    var ordersubmit = new XML('<submit></submit>');
    var orderorder = new XML('<order orderCode="' + orderNo + '"></order>');
    var orderdescription = new XML('<description></description>');
    orderdescription.appendChild(createRequestHelper.createOrderDescription(orderNo));
    var orderamount = new XML('<amount currencyCode="' + currency + '" exponent="' +
        preferences.currencyExponent + '" value="' + amount + '"/>');
    var orderorderContent = new XML('<orderContent></orderContent>');
    var Site = require('dw/system/Site');
    var sendOrderContentProductDetails = Site.getCurrent().getCustomPreferenceValue('sendOrderContentProductDetails');
    if (sendOrderContentProductDetails) {
        orderorderContent.appendChild(createRequestHelper.createOrderContent(orderObj).toString());
    }
    orderorderContent.appendChild(createRequestHelper.sendPluginTrackerDetails(orderObj).toString());
    var enableSalesrequest = preferences.enableSalesrequest;
    var orderPaymentDetails = createRequestHelper.getOrderPayment(enableSalesrequest, orderObj);
    let ordershopper = new XML('<shopper></shopper>');
    let ordershopperEmailAddress = new XML('<shopperEmailAddress></shopperEmailAddress>');
    ordershopperEmailAddress.appendChild(orderObj.getCustomerEmail());
    // associate respective conatiners inside shopper container
    ordershopper.appendChild(ordershopperEmailAddress);
    // prime routing
    let primeRoutingRequest = new XML('<primeRoutingRequest></primeRoutingRequest>');
    let routingPreference = new XML('<routingPreference></routingPreference>');
    routingPreference.appendChild(preferences.routingPreference);
    let preferredNetworks = new XML('<preferredNetworks> </preferredNetworks>');
    let availableNetworks = preferences.debitNetworks;

    getAvailableNetworks(availableNetworks, preferredNetworks, preferences, primeRoutingRequest, routingPreference);
    let ordershippingAddress = new XML('<shippingAddress></shippingAddress>');
    let orderaddress = new XML('<address></address>');
    let orderfirstName = new XML('<firstName></firstName>');
    orderfirstName.appendChild(shippingAddress.firstName);
    let orderlastName = new XML('<lastName></lastName>');
    orderlastName.appendChild(shippingAddress.lastName);
    let orderaddress1 = new XML('<address1></address1>');
    orderaddress1.appendChild(shippingAddress.address1);
    let orderaddress2 = new XML('<address2></address2>');
    orderaddress2.appendChild((shippingAddress.address2 != null) ? shippingAddress.address2 : '');
    let orderpostalCode = new XML('<postalCode></postalCode>');
    orderpostalCode.appendChild(shippingAddress.postalCode);
    let ordercity = new XML('<city></city>');
    ordercity.appendChild(shippingAddress.city);
    let orderstate = new XML('<state></state>');
    orderstate.appendChild(shippingAddress.stateCode);
    let ordercountryCode = new XML('<countryCode></countryCode>');
    ordercountryCode.appendChild(shippingAddress.countryCode.value.toString().toUpperCase());
    let ordertelephoneNumber = new XML('<telephoneNumber></telephoneNumber>');
    ordertelephoneNumber.appendChild(shippingAddress.phone);

    // associate all address fields inside address container
    orderaddress.appendChild(orderfirstName);
    orderaddress.appendChild(orderlastName);
    orderaddress.appendChild(orderaddress1);
    orderaddress.appendChild(orderaddress2);
    orderaddress.appendChild(orderpostalCode);
    orderaddress.appendChild(ordercity);
    orderaddress.appendChild(orderstate);
    orderaddress.appendChild(ordercountryCode);
    orderaddress.appendChild(ordertelephoneNumber);

    // associate address inside shippingaddress container
    ordershippingAddress.appendChild(orderaddress);

    // associate respective conatiners inside order container
    orderorder.appendChild(orderdescription);
    orderorder.appendChild(orderamount);
    orderorder.appendChild(orderorderContent);
    orderorder.appendChild(orderPaymentDetails);
    orderorder.appendChild(ordershopper);
    orderorder.appendChild(ordershippingAddress);

    // associate respective conatiners inside submit container
    ordersubmit.appendChild(orderorder);

    // associate respective conatiners inside paymentService container
    orderpaymentService.appendChild(ordersubmit);

    var order = orderpaymentService;
    getOrderObj(order, orderObj, paymentIntrument, preferences, echoData, payment, shopperBrowser);
    // Check if country code is Brazil(BR), then append CPF in request XML.
    order = createRequestHelper.addCpfDetails(billingAddress, paymentIntrument, order, orderObj);

    // moto order
    order = createRequestHelper.addMotoAndStoredCredentialsDetails(order, orderObj, session, preferences, paymentIntrument, storedCredentials);

    order.submit.order.paymentDetails.appendChild(sessionXML);
    if (enableSalesrequest != null && enableSalesrequest) {
        if (orderObj.billingAddress.countryCode.value === 'US') {
            order.submit.order.appendChild(primeRoutingRequest);
        }
    }
    if (preferences.dstype !== null && preferences.dstype.value === 'two3d') {
        order = createRequestHelper.addTo3dsFexRequest(preferences, orderObj, order);
    }

    return order;
}

/**
 * Function to create Initial Request 3d version2
 * @param {string} orderNo - order number
 * @param {Object} request - Request
 * @param {Object} preferences - worldpay preferences
 * @return {XML} returns a XML
 */
function createInitialRequest3D2(orderNo, request, preferences) {
    var merchantCode = preferences.merchantCode;
    return new XML('<?xml version="1.0"?><paymentService version="' + preferences.XMLVersion + '" merchantCode="' +
        merchantCode + '"><submit> <order orderCode="' + orderNo + '"><info3DSecure><completedAuthentication/></info3DSecure><session id="' +
        orderNo + '"/></order> </submit></paymentService>');
}

/**
 * Function to create request for Cancelling an order based on Order number
 * @param {string} orderNo - order number
 * @param {Object} preferences - worldpay preferences
 * @param {string} merchantID - merchantID configured in preference
 * @return {XML} returns a XML
 */
function createCancelOrderRequest(orderNo, preferences, merchantID) {
    var order;
    if (preferences.missingPreferences()) {
        Logger.getLogger('worldpay').error('Cancel Order Request Creation : Worldpay preferences are not properly set.');
        return null;
    }
    if (!orderNo) {
        Logger.getLogger('worldpay').error('Cancel Order Request Creation : Worldpay order number is blank.');
        return null;
    }

    var merchantCode = preferences.merchantCode;
    if (merchantID) {
        merchantCode = merchantID;
    }
    order = new XML('<?xml version="1.0"?><paymentService version="' + preferences.XMLVersion + '" merchantCode="' + merchantCode +
        '"><modify>        <orderModification orderCode="' + orderNo +
        '"><cancelOrRefund/></orderModification></modify></paymentService>');
    return order;
}

/**
 * Function to create request for confirmation snippet of klarna.
 * @param {string} orderNo - order number
 * @param {Object} preferences - worldpay preferences
 * @param {string} merchantCode - merchantCode
 * @return {XML} returns a XML
 */
function createConfirmationRequestKlarna(orderNo, preferences, merchantCode) {
    var order;
    order = new XML('<?xml version="1.0"?><paymentService version="' + preferences.XMLVersion
        + '" merchantCode="' + merchantCode + '"><inquiry>        <klarnaConfirmationInquiry  orderCode="'
        + orderNo + '"></klarnaConfirmationInquiry></inquiry></paymentService>');
    return order;
}

/**
 * Function to create request for Capture Service an order based on Order number
 * @param {Object} preferences - worldpay preferences
 * @param {string} orderCode - order number
 * @param {number} amount - amount
 * @param {string} currencyCode - currency
 * @param {string} debitCreditIndicator - debitCreditIndicator
 * @param {string} shipmentUUIDs - shipment UUID
 * @return {XML} returns a XML
 */
function createCaptureServiceRequest(preferences, orderCode, amount, currencyCode, debitCreditIndicator, shipmentUUIDs) {
    var captureamount = (amount * (Math.pow(10, preferences.currencyExponent)));
    var requestXml = new XML('<?xml version="1.0"?><paymentService version="' +
        preferences.XMLVersion + '" merchantCode="' +
        preferences.merchantCode + '"></paymentService>');
    var modifyXml = new XML('<modify/>');
    var orderModificationXml = new XML('<orderModification orderCode="' + orderCode + '"/>');
    var captureXml = new XML('<capture/>');
    var amountXml = new XML('<amount value="' + captureamount + '" currencyCode="' + currencyCode + '" exponent="' +
        preferences.currencyExponent + '" debitCreditIndicator="' + debitCreditIndicator + '"/>');
    var shippingXml = new XML('<shipping/>');
    var shippingInfoXml = new XML('<shippingInfo trackingId=""/>');

    if (!preferences.captureServiceTrackingId) { // Capture without tracking ID
        shippingXml.appendChild(shippingInfoXml);
    } else { // Capture with tracking ID
        for (var i = 0; i < shipmentUUIDs.length; i++) {
            shippingXml.appendChild(new XML('<shippingInfo trackingId="' + shipmentUUIDs[i] + '"/>'));
        }
    }
    captureXml.appendChild(amountXml);
    captureXml.appendChild(shippingXml);
    orderModificationXml.appendChild(captureXml);
    modifyXml.appendChild(orderModificationXml);
    requestXml.appendChild(modifyXml);
    return requestXml;
}
/**
 * Function to create the order inquiries request xml for payment status and token enquiry of an order
 * @param {string} orderNo - order number
 * @param {Object} preferences - worldpatransactionIdentifierreferences
 * @param {string} merchantID - merchantID configured in preference
 * @return {XML} returns a XML
 */
function createOrderInquiriesRequest(orderNo, preferences, merchantID) {
    var order;
    if (preferences.missingPreferences()) {
        Logger.getLogger('worldpay').error('Order inquiries Request Creation : Worldpay preferences are not properly set.');
        return null;
    }

    if (!orderNo) {
        Logger.getLogger('worldpay').error('Order inquiries Request Creation : Worldpay order number is blank.');
        return null;
    }
    var merchantCode = preferences.merchantCode;
    if (merchantID) {
        merchantCode = merchantID;
    }
    order = new XML('<?xml version="1.0"?><paymentService version="' +
        preferences.XMLVersion + '" merchantCode="' + merchantCode + '"><inquiry><orderInquiry orderCode="' +
        orderNo + '"/></inquiry></paymentService>');
    return order;
}

/**
 * Creates the second order message for 3D Secure integration. It adds additional informations to the initial order messge.
 * @param {dw.order.Order} order - Current users's Order
 * @param {string} paRes - error code
 * @param {string} md - MD
 * @return {XML} returns a XML
 */
function createSecondOrderMessage(order, paRes, md) {
    if (paRes == null && md == null) {
        return null;
    }

    var info3d = new XML('<info3DSecure><paResponse>' + paRes + '</paResponse></info3DSecure>');
    order.submit.order.paymentDetails.appendChild(info3d);

    return order;
}

/**
 * Creates the second order message for 3D Secure integration for MyAccount
 * @param {string} paRes - error code
 * @param {string} md - MD
 * @param {Object} preferences - worldpay preferences
 * @return {XML} returns a XML
 */
function createSaveCardAuthenticateRequest(paRes, md, preferences) {
    if (paRes == null && md == null) {
        return null;
    }
    var cardService = new XML('<?xml version="1.0"?><paymentService version="' +
        preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>');
    var submit = new XML('<submit></submit>');
    var orderorder = new XML('<order orderCode="' + md + '"></order>');
    var info3d = new XML('<info3DSecure><paResponse>' + paRes + '</paResponse></info3DSecure>');
    var sessionXML = new XML('<session id="' + md + '" />');
    orderorder.appendChild(info3d);
    orderorder.appendChild(sessionXML);
    submit.appendChild(orderorder);
    cardService.appendChild(submit);

    return cardService;
}

/**
 * Adds Worldpay installation ID to the request
 * @param {Object} preferences - Worldpay preferences
 * @param {Object} requestXml - request Object
 * @param {string} apmName - APM name
 * @param {Object} paymentMthd - Payment method object
 * @param {dw.order.PaymentInstrument} paymentInstrument - Payment instrument associated with the order object
 * @returns {XML} - request Object
 */
function addInstallationDetails(preferences, requestXml, apmName, paymentMthd, paymentInstrument) {
    var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    var configurablePaymentMethods = preferences.configurablePaymentMethods;
    var installationID = preferences.worldPayInstallationId;
    var reqXml = requestXml;
    if (installationID) {
        configurablePaymentMethods.forEach(function (configurableAPM) {
            if (configurableAPM.equalsIgnoreCase(apmName)) {
                if (paymentMthd.ID === worldpayConstants.WORLDPAY && paymentInstrument.getCreditCardToken()) {
                    reqXml = createRequestHelper.addInstallationDetails(reqXml, installationID);
                } else {
                    reqXml = createRequestHelper.addInstallationDetails(reqXml, installationID);
                    reqXml = createRequestHelper.addContactDetails(reqXml);
                }
            }
        });
    }
    return reqXml;
}

/**
 * Adds P24 details to the service request
 * @param {Object} reqXml - Service request object
 * @param {string} apmType - Type of APM
 * @param {dw.order.PaymentInstrument} paymentInstrument - Payment instrument associated with the order object
 * @param {string} apmName - APM name
 * @param {dw.order.Order} orderObj - Current order object
 * @param {dw.customer.Customer} currentCustomer - Current customer object
 * @param {Object} preferences - Worldpay preferences
 * @returns {XML} - Service request
 */
function addP24Details(reqXml, apmType, paymentInstrument, apmName, orderObj, currentCustomer, preferences) {
    var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    var requestXml = reqXml;
    if (apmType.equalsIgnoreCase(worldpayConstants.DIRECT)) {
        requestXml = createRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
        requestXml = createRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
        createRequestHelper.addStatementNarrative(requestXml);
    } else {
        // Add code to support P24 REDIRECT method.
    }
    return requestXml;
}

/**
 * Creates the XML Order Request object.
 * @param {dw.value.Money} paymentAmount - Payment amount
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment instrument object
 * @param {dw.customer.Customer} currentCustomer - Current customer
 * @return {XML} returns request xml
 */
function createRequest(paymentAmount, orderObj, paymentInstrument, currentCustomer) {
    // Fetch the APM Name from the Payment isntrument.
    var apmName = paymentInstrument.getPaymentMethod();

    // Fetch the APM Type from the Payment Method i.e. if the Payment Methoid is of DIRECT or REDIRECT type.
    var PaymentMgr = require('dw/order/PaymentMgr');
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd, orderObj);
    if (preferences.missingRedirectPreferences()) {
        Logger.getLogger('worldpay').error('Redirect Request Creation : Worldpay preferences are not properly set.');
        return null;
    }
    var apmType = paymentMthd.custom.type.value;

    // Fetch the Shipping and Billing details from Order object.
    var shippingAddress = orderObj.defaultShipment.shippingAddress;
    var billingAddress = orderObj.billingAddress;

    // Fetch the Worldpay Order Request XML based upon apmType.
    var requestXml = new XML('<paymentService version="' + preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>');
    var includePaymentMethods = preferences.paymentMethodsIncludes;
    var excludePaymentMethods = preferences.paymentMethodsExcludes;
    var statementNarrative = new XML(worldpayConstants.STATEMENTNARRATIVE);
    var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    var statementNarrativeText = paymentMthd.custom.statementNarrative;
    if (statementNarrativeText) {
        statementNarrative.appendChild(statementNarrativeText);
    }
    requestXml = createRequestHelper.addGeneralDetails(requestXml, orderObj, preferences, apmName);
    if (apmName.equals(worldpayConstants.KLARNASLICEIT) || apmName.equals(worldpayConstants.KLARNAPAYLATER) || apmName.equals(worldpayConstants.KLARNAPAYNOW)) {
        var klarnabillingCountry = orderObj.getBillingAddress().countryCode.value.toString().toUpperCase();
        requestXml = createRequestHelper.addShipmentAmountDetailsForKlarna(klarnabillingCountry, requestXml, paymentAmount, preferences);
    } else {
        requestXml = createRequestHelper.addShipmentAmountDetails(apmName, requestXml, paymentAmount, preferences);
    }
    var Site = require('dw/system/Site');
    var sendOrderContentProductDetails = Site.getCurrent().getCustomPreferenceValue('sendOrderContentProductDetails');
    if (sendOrderContentProductDetails) {
        requestXml.submit.order.orderContent = createRequestHelper.createOrderContent(orderObj).toString();
    }
    requestXml.submit.order.orderContent += createRequestHelper.sendPluginTrackerDetails(orderObj).toString();
    if (!apmType) {
        Logger.getLogger('worldpay').error('APM type is missing for this payment method. Please define APM(DIRECT/REDIRECT) in Payment methods in Business Manager)');
        return null;
    }
    // Adding Installation Id for Hosted Payment Pages
    requestXml = addInstallationDetails(preferences, requestXml, apmName, paymentMthd, paymentInstrument);

    var ArrayList = require('dw/util/ArrayList');
    // Add APM specfic details only. Custom logic can be implemented in this ection to add on details
    var payMethod;
    switch (apmName) {
        case worldpayConstants.PAYPAL:
            return createRequestHelper.addPayPalDetails(requestXml, apmType, preferences, orderObj, paymentInstrument, shippingAddress, billingAddress);
        case worldpayConstants.GOOGLEPAY:
            return createRequestHelper.addGPayDetails(requestXml, apmType, apmName, preferences, orderObj, paymentInstrument, currentCustomer);
        case worldpayConstants.KLARNASLICEIT:
        case worldpayConstants.KLARNAPAYNOW:
        case worldpayConstants.KLARNAPAYLATER:
            return createRequestHelper.addKlarnaDetails(requestXml, preferences, orderObj, paymentInstrument, currentCustomer, shippingAddress, billingAddress);
        case worldpayConstants.SOFORT:
        case worldpayConstants.SOFORT_SWITZERLAND:
        case worldpayConstants.ALIPAYMOBILE:
        case worldpayConstants.GIROPAY:
        case worldpayConstants.POLI:
        case worldpayConstants.ALIPAY:
        case worldpayConstants.WECHATPAY:
            if (apmType.equalsIgnoreCase(worldpayConstants.DIRECT)) {
                requestXml = createRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = createRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                createRequestHelper.addStatementNarrative(requestXml);
            } else {
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;

        case worldpayConstants.IDEAL:
            return createRequestHelper.addIdealDetails(requestXml, apmType, apmName, preferences, orderObj, paymentInstrument);
        case worldpayConstants.CHINAUNIONPAY:
            return createRequestHelper.addChinaUnionPayDetails(requestXml, apmType, paymentInstrument, apmName, orderObj, currentCustomer, shippingAddress);
        case worldpayConstants.MISTERCASH:
            return createRequestHelper.addMisterCashDetails(requestXml, apmType, paymentInstrument, orderObj, currentCustomer, shippingAddress, preferences);
        case worldpayConstants.WORLDPAY:
            var cpf;
            var installments;
            if (paymentInstrument.getCreditCardToken()) {
                var paymentDetails = createRequestHelper.getPaymentDetailsForSavedRedirectCC(paymentInstrument, orderObj);
                requestXml.submit.order.appendChild(paymentDetails);
                if ((preferences.tokenType == null) || !preferences.tokenType.toString().equals(worldpayConstants.merchanttokenType)) {
                    requestXml = createRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, paymentInstrument.custom.wpTokenRequested);
                }
                // Add authenticatedShopperID, shopperEmailAddress only if the card was saved as shopper
                if (paymentInstrument.custom.tokenScope.toLowerCase() === worldpayConstants.SHOPPER_TOKEN_SCOPE) {
                    requestXml.submit.order.shopper.shopperEmailAddress = orderObj.getCustomerEmail();
                    requestXml.submit.order.shopper.authenticatedShopperID = currentCustomer.profile.customerNo;
                }
                createRequestHelper.addStatementNarrative(requestXml);
                installments = paymentInstrument.custom.installments;
                if (installments) {
                    requestXml.submit.order.thirdPartyData.instalments = installments;
                }
                if (billingAddress.countryCode.value.equalsIgnoreCase(worldpayConstants.BRAZILCOUNTRYCODE)) {
                    cpf = paymentInstrument.custom.cpf;

                    if (cpf) {
                        requestXml.submit.order.thirdPartyData.cpf = cpf;
                    }
                }
                var browserXML = new XML('<browser><acceptHeader></acceptHeader><userAgentHeader></userAgentHeader></browser>');
                browserXML.acceptHeader = requestObject.httpHeaders.get(worldpayConstants.ACCEPT);
                browserXML.userAgentHeader = requestObject.httpHeaders.get('user-agent');
                if (!(orderObj.createdBy.equals(worldpayConstants.CUSTOMERORDER)) && session.isUserAuthenticated()) {
                    requestXml.submit.order.shopper.appendChild(browserXML);
                }
                delete requestXml.submit.order.orderContent;
            } else {
                requestXml = createRequestHelper.addIncludedPaymentMethods(requestXml, includePaymentMethods, excludePaymentMethods, paymentInstrument);
                if ((preferences.tokenType == null) || !preferences.tokenType.toString().equals(worldpayConstants.merchanttokenType)) {
                    requestXml = createRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, paymentInstrument.custom.wpTokenRequested);
                }
                requestXml = createRequestHelper.addShippingAddressDetails(requestXml, shippingAddress);
                requestXml = createRequestHelper.addBillingAddressDetails(requestXml, billingAddress);

                createRequestHelper.addStatementNarrative(requestXml);
                installments = paymentInstrument.custom.installments;
                if (installments) {
                    requestXml.submit.order.thirdPartyData.instalments = installments;
                }
                if (billingAddress.countryCode.value.equalsIgnoreCase(worldpayConstants.BRAZILCOUNTRYCODE)) {
                    cpf = paymentInstrument.custom.cpf;

                    if (cpf) {
                        requestXml.submit.order.thirdPartyData.cpf = cpf;
                    }
                }
                if (paymentInstrument.custom.wpTokenRequested) {
                    requestXml = createRequestHelper.addTokenDetails(requestXml, orderObj, orderObj.orderNo);
                }

                var paymentCountryCode = billingAddress.countryCode.value;
                var orderAmt = orderObj.totalGrossPrice;
                var paymentMethods = PaymentMgr.getApplicablePaymentMethods(
                currentCustomer,
                paymentCountryCode,
                orderAmt.value
            );
                var iterator = paymentMethods.iterator();
                var item;
                while (iterator.hasNext()) {
                    item = iterator.next();
                    var itemId = item.ID;
                    if (item.paymentProcessor && worldpayConstants.WORLDPAY.equals(item.paymentProcessor.ID) && (itemId.equalsIgnoreCase(worldpayConstants.KLARNAPAYLATER)
                    || itemId.equalsIgnoreCase(worldpayConstants.KLARNASLICEIT) || itemId.equalsIgnoreCase(worldpayConstants.KLARNAPAYNOW)
                    || itemId.equalsIgnoreCase(worldpayConstants.KLARNA))) {
                        requestXml = createRequestHelper.getOrderDetails(requestXml, orderObj);
                        break;
                    }
                }
            }
            break;

        case worldpayConstants.KONBINI:
            return createRequestHelper.addKonbiniDetails(requestXml, apmType, paymentInstrument, orderObj, currentCustomer, shippingAddress, preferences);

        case worldpayConstants.P24:
            return addP24Details(requestXml, apmType, paymentInstrument, apmName, orderObj, currentCustomer, preferences);

        case worldpayConstants.ELV:
            if (apmType.equalsIgnoreCase(worldpayConstants.DIRECT)) {
                requestXml = createRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = createRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                requestXml = createRequestHelper.addBillingAddressDetailsFormat2(requestXml, billingAddress);
                createRequestHelper.addStatementNarrative(requestXml);
                requestXml = createRequestHelper.appendMandateInfo(requestXml, paymentInstrument);
            } else {
                // Add code to support ELV REDIRECT method.
            }
            break;

        case worldpayConstants.NORDEAFI:
            if (apmType.equalsIgnoreCase(worldpayConstants.REDIRECT)) {
                payMethod = new ArrayList();
                payMethod.push(worldpayConstants.NORDEAFI);
                requestXml = createRequestHelper.addIncludedPaymentMethods(requestXml, payMethod);
                requestXml = createRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                requestXml = createRequestHelper.addShippingAddressDetails(requestXml, shippingAddress);
            } else {
                // Add code to support SOLO-SSL DIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;

        case worldpayConstants.NORDEASE:
            if (apmType.equalsIgnoreCase(worldpayConstants.REDIRECT)) {
                payMethod = new ArrayList();
                payMethod.push(worldpayConstants.NORDEASE);
                requestXml = createRequestHelper.addIncludedPaymentMethods(requestXml, payMethod);
                requestXml = createRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                requestXml = createRequestHelper.addShippingAddressDetails(requestXml, shippingAddress);
            } else {
                // Add code to support EBETANLING-SSL DIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;

            // Add Custom Logic to support additional APM's here.

        case worldpayConstants.ACHPAY:
            requestXml = createRequestHelper.getACHPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
            break;

        default:
            Logger.getLogger('worldpay').error('ORDER XML REQUEST :  Payment Method' + apmName);
            return null;
    }
    return requestXml;
}
/**
 * This function to create the initial request xml for Credit card Authorization.
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param{Object} paymentMthd - Payment Method
 * @return {XML} returns an order in XML object
 */
function createVoidRequest(orderObj, paymentMthd) {
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd, orderObj);
    var requestXml = new XML('<paymentService version="' + preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>');
    var modify = new XML('<modify></modify>');
    var ordermodification = new XML('<orderModification orderCode="' + orderObj.orderNo + '"></orderModification>');
    var voidsale = new XML('<voidSale/>');
    ordermodification.appendChild(voidsale);
    modify.appendChild(ordermodification);
    requestXml.appendChild(modify);
    return requestXml;
}

/**
 * Function to create request for partial caputure in csc
 * @param {Object} orderID - orderid
 * @param {string} settleAmount - amount to be captured
 * @param {Object} currency - currency
 * @param {Object} shipmentNo - shipmentNo
 * @return {XML} returns a XML
 */
function createPartialCaptureRequest(orderID, settleAmount, currency, shipmentNo) {
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderID);
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    WorldpayPreferences = new WorldpayPreferences();
    var preferences = WorldpayPreferences.worldPayPreferencesInit(null, order);
    var capture;
    var captureRequest = new XML('<paymentService version="' + preferences.XMLVersion + '" merchantCode="' +
        preferences.merchantCode + '"></paymentService>');
    var modify = new XML('<modify></modify>');
    var ordermodification = new XML('<orderModification orderCode="' + orderID + '"></orderModification>');
    if (shipmentNo) {
        capture = new XML('<capture reference="' + shipmentNo + '"></capture>');
    } else {
        capture = new XML('<capture></capture>');
    }
    var amount = new XML('<amount value="' + settleAmount + '" currencyCode="' + currency +
        '" exponent="' + preferences.currencyExponent + '"/>');
    capture.appendChild(amount);
    ordermodification.appendChild(capture);
    modify.appendChild(ordermodification);
    captureRequest.appendChild(modify);
    return captureRequest;
}

/**
 * Method that creates Klarna capture request
 * @param {Object} orderID - orderid
 * @param {string} settleAmount - amount to be captured
 * @param {Object} currency - currency
 * @param {string} trackingID - trackingID
 * @return {XML} returns a XML
 */
function createKlarnaCaptureRequest(orderID, settleAmount, currency, trackingID) {
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderID);
    WorldpayPreferences = new WorldpayPreferences();
    var preferences = WorldpayPreferences.worldPayPreferencesInit(null, order);
    var captureRequest = new XML('<paymentService version="' + preferences.XMLVersion + '" merchantCode="' +
        preferences.merchantCode + '"></paymentService>');
    var modify = new XML('<modify></modify>');
    var ordermodification = new XML('<orderModification orderCode="' + orderID + '"></orderModification>');
    var capture = new XML('<capture ></capture>');
    var amount = new XML('<amount value="' + settleAmount + '" currencyCode="' + currency + '" exponent="' +
            preferences.currencyExponent + '" debitCreditIndicator="' + worldpayConstants.DEBITCREDITINDICATOR + '"/>');
    capture.appendChild(amount);

    var shipping = new XML('<shipping></shipping>');
    var shippingInfo;
    if (trackingID.indexOf(',') > -1) {
        var trackingIdList = trackingID.split(',');
        trackingIdList.forEach(function (tackId) {
            shippingInfo = new XML('<shippingInfo trackingId="' + tackId + '"></shippingInfo>');
            shipping.appendChild(shippingInfo);
        });
    } else {
        shippingInfo = new XML('<shippingInfo trackingId="' + trackingID + '"></shippingInfo>');
        shipping.appendChild(shippingInfo);
    }
    capture.appendChild(shipping);

    var orderLines = createRequestHelper.getKlarnaOrderDetails(captureRequest, order);
    capture.appendChild(orderLines);
    ordermodification.appendChild(capture);
    modify.appendChild(ordermodification);
    captureRequest.appendChild(modify);

    return captureRequest;
}

/**
 * Function to create request for partial caputure in csc
 * @param {Object} orderID - orderid
 * @param {string} settleAmount - amount to be refunded
 * @param {Object} currency - currency
 * @param {Object} shipmentNo - shipmentNo
 * @return {XML} returns a XML
 */
function createPartialRefundRequest(orderID, settleAmount, currency, shipmentNo) {
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderID);
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    WorldpayPreferences = new WorldpayPreferences();
    var preferences = WorldpayPreferences.worldPayPreferencesInit(null, order);
    var refund;
    var refundRequest = new XML('<paymentService version="' + preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>');
    var modify = new XML('<modify></modify>');
    var ordermodification = new XML('<orderModification orderCode="' + orderID + '"></orderModification>');
    if (shipmentNo) {
        refund = new XML('<refund reference="' + shipmentNo + '"></refund>');
    } else {
        refund = new XML('<refund></refund>');
    }
    var amount = new XML('<amount value="' + settleAmount + '" currencyCode="' + currency + '" exponent="' + preferences.currencyExponent + '"/>');
    refund.appendChild(amount);
    ordermodification.appendChild(refund);
    modify.appendChild(ordermodification);
    refundRequest.appendChild(modify);
    return refundRequest;
}

/**
 * Method that creates Klarna refund request
 * @param {Object} orderID - orderid
 * @param {string} settleAmount - amount to be refunded
 * @param {Object} currency - currency
 * @return {XML} returns a XML
 */
function createKlarnaRefundRequest(orderID, settleAmount, currency) {
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderID);
    WorldpayPreferences = new WorldpayPreferences();
    var preferences = WorldpayPreferences.worldPayPreferencesInit(null, order);
    var refundRequest = new XML('<paymentService version="' + preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>');
    var modify = new XML('<modify></modify>');
    var ordermodification = new XML('<orderModification orderCode="' + orderID + '"></orderModification>');
    var refund = new XML('<refund></refund>');
    var amount = new XML('<amount value="' + settleAmount + '" currencyCode="' + currency + '" exponent="' +
            preferences.currencyExponent + '" debitCreditIndicator="' + worldpayConstants.DEBITCREDITINDICATOR + '"/>');
    refund.appendChild(amount);
    var orderLines = createRequestHelper.getKlarnaOrderDetails(refundRequest, order);
    refund.appendChild(orderLines);
    ordermodification.appendChild(refund);
    modify.appendChild(ordermodification);
    refundRequest.appendChild(modify);
    return refundRequest;
}


/**
 * Function to create request for partial caputure in csc
 * @param {Object} orderID - orderid
 * @return {XML} returns a XML
 */
function createCancelRequest(orderID) {
    var OrderMgr = require('dw/order/OrderMgr');
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    WorldpayPreferences = new WorldpayPreferences();
    var order = OrderMgr.getOrder(orderID);
    var preferences = WorldpayPreferences.worldPayPreferencesInit(null, order);
    var cancelRequest = new XML('<paymentService version="' + preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>');
    var modify = new XML('<modify></modify>');
    var ordermodification = new XML('<orderModification orderCode="' + orderID + '"></orderModification>');
    var cancel = new XML('<cancel></cancel>');
    ordermodification.appendChild(cancel);
    modify.appendChild(ordermodification);
    cancelRequest.appendChild(modify);
    return cancelRequest;
}

/**
 * Function to create request for deleting payment token from Account dashboard
 * @param {Object} payment - PaymentInstrument
 * @param {string} customerNo - Customer Number
 * @param {Object} preferences - worldpay preferences
 * @return {XML} returns a XML
 */
function deletePaymentToken(payment, customerNo, preferences) {
    var Site = require('dw/system/Site');
    var paymentService = new XML('<?xml version="1.0"?><paymentService version="' +
        preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>');
    // modify container
    var modify = new XML('<modify></modify>');
    var paymentTokenID = new XML('<paymentTokenID></paymentTokenID>');
    var authenticatedShopperID = new XML('<authenticatedShopperID></authenticatedShopperID>');
    var tokenEventReference = new XML('<tokenEventReference></tokenEventReference>');
    var tokenReason = new XML('<tokenReason></tokenReason>');
    var tokenType = Site.getCurrent().getCustomPreferenceValue('tokenType');
    var token;
    if (tokenType != null && payment.raw.custom.tokenScope) {
        token = new XML('<paymentTokenDelete tokenScope="' + payment.raw.custom.tokenScope.toLowerCase() + '"> </paymentTokenDelete>');
    } else {
        token = new XML('<paymentTokenDelete tokenScope="shopper"> </paymentTokenDelete>');
    }
    var ccToken = payment.raw.creditCardToken;
    paymentTokenID.appendChild(ccToken);
    authenticatedShopperID.appendChild(customerNo);
    tokenEventReference.appendChild(ccToken);
    tokenReason.appendChild(ccToken);
    token.appendChild(paymentTokenID);
    if (!payment.raw.custom.tokenScope.equals(worldpayConstants.merchanttokenType)) {
        token.appendChild(authenticatedShopperID);
    }
    token.appendChild(tokenEventReference);
    token.appendChild(tokenReason);
    modify.appendChild(token);
    paymentService.appendChild(modify);
    return paymentService;
}

/**
 * Function to create request for creating payment token from Account Dashboard
 * @param {Object} customerObj - customerObj
 * @param {Object} paymentInstrument - PaymentInstrument
 * @param {Object} preferences - worldpay preferences
 * @param {number} cardNumber - Card Number
 * @param {number} expirationMonth - Expiration Month
 * @param {number} expirationYear - Expiration Year
 * @return {XML} returns a XML
 */
function createTokenRequestWOP(customerObj, paymentInstrument, preferences, cardNumber, expirationMonth, expirationYear) {
    var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    var enableTokenizationPref = createRequestHelper.getTokenPref(preferences);
    var Site = require('dw/system/Site');
    var nominalCardAmount = Site.current.getCustomPreferenceValue('nominalValue');
    var amount = createRequestHelper.getNominalAmount(nominalCardAmount, preferences);
    var cardService = new XML('<?xml version="1.0"?><paymentService version="' +
        preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>');
    // submit container
    var submit = new XML('<submit></submit>');
    var tstamp = new Date().getTime();
    var description = createRequestHelper.createOrderDescription(tstamp);
    // order container
    var orderorder = new XML('<order orderCode="' + tstamp + '"></order>');
    var orderdescription = new XML('<description></description>');
    orderdescription.appendChild(description);
    var creditcardtype = paymentInstrument.creditCardType;
    var isNominalAuthCard = createRequestHelper.isNominalAuthCard(creditcardtype);
    var orderamount = createRequestHelper.getOrderamount(nominalCardAmount, isNominalAuthCard, preferences, amount);
    var orderPaymentDetails = createRequestHelper.getOrderPaymentDetails(isNominalAuthCard);
    var PaymentMgr = require('dw/order/PaymentMgr');
    var paymentCard = PaymentMgr.getPaymentCard(paymentInstrument.creditCardType);
    var wpPaymentCard = paymentCard.custom.worldPayCardType;
    var cardtype = new XML('<' + wpPaymentCard + '/>');
    var cardno = new XML('<cardNumber></cardNumber>');
    cardno.appendChild(cardNumber);
    var expiryDate = new XML('<expiryDate></expiryDate>');
    var dateExp = new XML('<date month="' + expirationMonth + '" year="' + expirationYear + '" />');
    expiryDate.appendChild(dateExp);
    var cardholdername = new XML('<cardHolderName></cardHolderName>');
    cardholdername.appendChild(paymentInstrument.creditCardHolder);
    cardtype.appendChild(cardno);
    cardtype.appendChild(expiryDate);
    cardtype.appendChild(cardholdername);
    var storedCredentials = new XML('<storedCredentials usage="FIRST"/>');
    orderPaymentDetails.appendChild(cardtype);
    if (preferences.enableStoredCredentials && preferences.enableStoredCredentials != null) {
        orderPaymentDetails.appendChild(storedCredentials);
    }
    var sessionXML = new XML('<session shopperIPAddress="' + requestObject.httpRemoteAddress + '" id="' + tstamp + '" />');
    orderPaymentDetails.appendChild(sessionXML);
    var ordershopper = new XML('<shopper></shopper>');
    var authenticatedShopperID = new XML('<authenticatedShopperID></authenticatedShopperID>');
    authenticatedShopperID.appendChild(customerObj.profile.customerNo);
    var shopperBrowser = new XML('<browser><acceptHeader></acceptHeader><userAgentHeader></userAgentHeader></browser>');
    shopperBrowser.acceptHeader = requestObject.httpHeaders.get(worldpayConstants.ACCEPT);
    shopperBrowser.userAgentHeader = requestObject.httpHeaders.get('user-agent');
    if (customerObj.profile.customerNo != null && (enableTokenizationPref) &&
        ((preferences.tokenType == null) || !preferences.tokenType.toString().equals(worldpayConstants.merchanttokenType))) {
        ordershopper.appendChild(authenticatedShopperID);
    }
    ordershopper.appendChild(shopperBrowser);
    var token = new XML('<createToken tokenScope="' + preferences.tokenType.value.toLowerCase() + '"></createToken>');
    var tokenEventReference = new XML('<tokenEventReference></tokenEventReference>');
    var tokenReason = new XML('<tokenReason></tokenReason>');
    tokenEventReference.appendChild(tstamp);
    tokenReason.appendChild(tstamp);
    token.appendChild(tokenEventReference);
    token.appendChild(tokenReason);
    orderorder.appendChild(orderdescription);
    orderorder.appendChild(orderamount);
    orderorder.appendChild(orderPaymentDetails);
    orderorder.appendChild(ordershopper);
    if (enableTokenizationPref && enableTokenizationPref != null) {
        orderorder.appendChild(token);
    }
    if (preferences.dstype !== null && preferences.dstype.value === 'two3d') {
        if (preferences.riskData != null && preferences.riskData) {
            var riskdata = new XML('<riskData> </riskData>');
            var authMethod = createRequestHelper.getAuthMethod(preferences);
            var authenticationRiskData = new XML('<authenticationRiskData authenticationMethod ="' + authMethod + '"></authenticationRiskData>');
            var authenticationTimestamp = new XML('<authenticationTimestamp> </authenticationTimestamp>');
            authenticationTimestamp.appendChild(createRequestHelper.createTimeStamp());
            authenticationRiskData.appendChild(authenticationTimestamp);
            var shopperAccountRiskData = new XML('<shopperAccountRiskData></shopperAccountRiskData>');
            if (customerObj.authenticated) {
                var shopperAccountCreationDate = new XML('<shopperAccountCreationDate> </shopperAccountCreationDate>');
                var shopperAccountModificationDate = new XML('<shopperAccountModificationDate></shopperAccountModificationDate>');
                shopperAccountCreationDate.appendChild(createRequestHelper.createSRD(customerObj.profile.getCreationDate()));
                shopperAccountModificationDate.appendChild(createRequestHelper.createSRD(customerObj.profile.getLastModified()));
                shopperAccountRiskData.appendChild(shopperAccountCreationDate);
                shopperAccountRiskData.appendChild(shopperAccountModificationDate);
            }
            var transactionRiskDataGiftCardAmount = new XML('<transactionRiskDataGiftCardAmount> </transactionRiskDataGiftCardAmount>');
            transactionRiskDataGiftCardAmount.appendChild(createRequestHelper.createAmt());
            var transactionRiskData = new XML('<transactionRiskData></transactionRiskData>');
            transactionRiskData.appendChild(transactionRiskDataGiftCardAmount);
            riskdata.appendChild(authenticationRiskData);
            riskdata.appendChild(shopperAccountRiskData);
            riskdata.appendChild(transactionRiskData);
            orderorder.appendChild(riskdata);
        }
        var additional3DSData = createRequestHelper.creatAddional3DSData(preferences, requestObject);
        orderorder.appendChild(additional3DSData);
    }
    submit.appendChild(orderorder);
    cardService.appendChild(submit);
    return cardService;
}

/**
 * creates and returns update token request
 * @param {Object} customerObj - current customer object
 * @param {Object} preferences - worldpay preferences
 * @param {Object} responseData - response data from Worldpay
 * @param {sting} expirationMonth - card expiry month
 * @param {string} expirationYear - card expiry year
 * @returns {XML} returns update token request XML
 */
function updateTokenRequestWOP(customerObj, preferences, responseData, expirationMonth, expirationYear) {
    var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    var cardService = new XML('<?xml version="1.0"?><paymentService version="' +
        preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>');
    var address = responseData.content.reply.orderStatus.token.paymentInstrument.cardDetails.cardAddress.address;
    if (address.toString().equals('')) {
        address = null;
    }
    var modify = new XML('<modify></modify>');
    var paymentTokenUpdate = new XML('<paymentTokenUpdate></paymentTokenUpdate>');
    paymentTokenUpdate.paymentTokenID = responseData.paymentTokenID;
    paymentTokenUpdate.authenticatedShopperID = responseData.authenticatedShopperID;
    paymentTokenUpdate.paymentInstrument.cardDetails = createRequestHelper.addCardDetails(expirationMonth,
        expirationYear, responseData.cardHolderName.valueOf().toString(), address);
    paymentTokenUpdate.tokenEventReference = responseData.tokenEventReference;
    paymentTokenUpdate.tokenReason = responseData.tokenReason;
    modify.appendChild(paymentTokenUpdate);
    cardService.appendChild(modify);
    return cardService;
}

/**
 * Creating Request for saved card
 * @param {Object} orderObj - Order Object
 * @param {Object} req - request
 * @param {Object} paymentIntrument - Payment Insrument
 * @param {Object} preferences - Preferences for Worldpay
 * @param {Object} echoData - echo data
 * @param {Object} encryptedData - encryptedData
 * @param {Object} cardObj - cardObj
 * @returns {Object} - Order
 */
function createSavedCardAuthRequest(orderObj, req, paymentIntrument, preferences, echoData, encryptedData, cardObj) {
    var payment;
    var orderNo = orderObj.orderNo;
    var billingAddress = orderObj.billingAddress;
    var paymentInstrumentUtils = require('*/cartridge/scripts/common/paymentInstrumentUtils');
    if (preferences.missingPreferences()) {
        Logger.getLogger('worldpay').error('Request Creation : Worldpay preferences are not properly set.');
        return null;
    }

    if (paymentIntrument.creditCardToken) {
        payment = paymentInstrumentUtils.getPaymentTokenForSavedCard(billingAddress, paymentIntrument, cardObj.cvn);
    }

    var EnableTokenizationPref = preferences.worldPayEnableTokenization;
    if (preferences.enableStoredCredentials) {
        EnableTokenizationPref = true;
    }

    let shopperBrowser = new XML('<browser><acceptHeader></acceptHeader><userAgentHeader></userAgentHeader></browser>');
    shopperBrowser.acceptHeader = req.httpHeaders.get(worldpayConstants.ACCEPT);
    shopperBrowser.userAgentHeader = req.httpHeaders.get('user-agent');

    // The result of request.getSession().getSessionID() in Demandware is not NMTOKEN.
    // use the createSessionID() function to cutomize the session ID
    var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    var utils = require('*/cartridge/scripts/common/utils');
    var totalprice = utils.calculateNonGiftCertificateAmount(orderObj);
    var amount = totalprice.getValue();
    amount = (amount.toFixed(2) * (Math.pow(10, preferences.currencyExponent))).toFixed(0);

    var currency = totalprice.getCurrencyCode();
    var shippingAddress = orderObj.defaultShipment.shippingAddress;
    var isSavedRedirectCard;
    var PaymentMgr = require('dw/order/PaymentMgr');
    var apmName = paymentIntrument.getPaymentMethod();
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);

    if (paymentMthd.ID === worldpayConstants.WORLDPAY && paymentIntrument.creditCardToken) {
        isSavedRedirectCard = true;
    }

    var sessionXML = new XML('<session shopperIPAddress="' + request.httpRemoteAddress + '" id="' + createRequestHelper.createSessionID(orderNo) + '" />');
    var orderpaymentService = new XML('<?xml version="1.0"?><paymentService version="' +
        preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>');
    // sumbit container
    var ordersubmit = new XML('<submit></submit>');
    // order container
    var orderorder;
    var installationID = preferences.worldPayInstallationId;

    if (isSavedRedirectCard) {
        orderorder = new XML('<order orderCode="' + orderNo + '" installationId="' + installationID + '"></order>');
    } else {
        orderorder = new XML('<order orderCode="' + orderNo + '"></order>');
    }

    // description container
    var orderdescription = new XML('<description></description>');
    orderdescription.appendChild(createRequestHelper.createOrderDescription(orderNo));
    // amount container
    var orderamount = new XML('<amount currencyCode="' + currency + '" exponent="' + preferences.currencyExponent + '" value="' + amount + '"/>');

    // paymentDetails container
    var orderPaymentDetails = new XML('<paymentDetails></paymentDetails>');

    // shopper container
    var ordershopper = new XML('<shopper></shopper>');
    // shopper email address contaioner
    var ordershopperEmailAddress = new XML('<shopperEmailAddress></shopperEmailAddress>');
    ordershopperEmailAddress.appendChild(orderObj.getCustomerEmail());
    // associate respective conatiners inside shopper container
    ordershopper.appendChild(ordershopperEmailAddress);
    // prime routing
    var primeRoutingRequest = new XML('<primeRoutingRequest></primeRoutingRequest>');
    var routingPreference = new XML('<routingPreference></routingPreference>');
    routingPreference.appendChild(preferences.routingPreference);
    var preferredNetworks = new XML('<preferredNetworks> </preferredNetworks>');
    var availableNetworks = preferences.debitNetworks;
    for (var i = 0; i < availableNetworks.length; i++) {
        var networkName = new XML('<networkName> </networkName>');
        networkName.appendChild(availableNetworks[i].value);
        preferredNetworks.appendChild(networkName);
    }
    if (preferences.routingPreference.value != null && preferences.routingPreference) {
        primeRoutingRequest.appendChild(routingPreference);
    }
    if (preferences.debitNetworks.length !== 0 && preferences.debitNetworks) {
        primeRoutingRequest.appendChild(preferredNetworks);
    }
    // shipping address container
    var ordershippingAddress = new XML('<shippingAddress></shippingAddress>');
    // address container
    var orderaddress = new XML('<address></address>');
    // first name container
    var orderfirstName = new XML('<firstName></firstName>');
    orderfirstName.appendChild(shippingAddress.firstName);
    // last name container
    var orderlastName = new XML('<lastName></lastName>');
    orderlastName.appendChild(shippingAddress.lastName);
    // address1 container
    var orderaddress1 = new XML('<address1></address1>');
    orderaddress1.appendChild(shippingAddress.address1);
    // address2 container
    var orderaddress2 = new XML('<address2></address2>');
    orderaddress2.appendChild((shippingAddress.address2 != null) ? shippingAddress.address2 : '');
    var orderaddress3 = new XML('<address3></address3>');
    if (shippingAddress.address2 != null) {
        orderaddress3.appendChild((shippingAddress.address2 != null) ? shippingAddress.address2 : '');
    }
    // post code container
    var orderpostalCode = new XML('<postalCode></postalCode>');
    orderpostalCode.appendChild(shippingAddress.postalCode);
    // city container
    var ordercity = new XML('<city></city>');
    ordercity.appendChild(shippingAddress.city);
    // state container
    var orderstate = new XML('<state></state>');
    orderstate.appendChild(shippingAddress.stateCode);
    // countrycode container
    var ordercountryCode = new XML('<countryCode></countryCode>');
    ordercountryCode.appendChild(shippingAddress.countryCode.value.toString().toUpperCase());
    // tel container
    var ordertelephoneNumber = new XML('<telephoneNumber></telephoneNumber>');
    ordertelephoneNumber.appendChild(shippingAddress.phone);

    // associate all address fields inside address container
    orderaddress.appendChild(orderfirstName);
    orderaddress.appendChild(orderlastName);
    orderaddress.appendChild(orderaddress1);
    orderaddress.appendChild(orderaddress2);
    orderaddress.appendChild(orderpostalCode);
    orderaddress.appendChild(ordercity);
    orderaddress.appendChild(orderstate);
    orderaddress.appendChild(ordercountryCode);
    orderaddress.appendChild(ordertelephoneNumber);

    // associate address inside shippingaddress container
    ordershippingAddress.appendChild(orderaddress);

    // associate respective conatiners inside order container
    orderorder.appendChild(orderdescription);
    orderorder.appendChild(orderamount);
    orderorder.appendChild(orderPaymentDetails);
    orderorder.appendChild(ordershopper);
    orderorder.appendChild(ordershippingAddress);

    // associate respective conatiners inside submit container
    ordersubmit.appendChild(orderorder);

    // associate respective conatiners inside paymentService container
    orderpaymentService.appendChild(ordersubmit);

    var order = orderpaymentService;
    if (orderObj.getCustomerNo() != null && (EnableTokenizationPref || paymentIntrument.creditCardToken) &&
        ((preferences.tokenType == null) ||
            (paymentIntrument.custom.tokenScope == null && !preferences.tokenType.toString().equals(worldpayConstants.merchanttokenType))
            || (paymentIntrument.custom.tokenScope != null && !paymentIntrument.custom.tokenScope.equals(worldpayConstants.merchanttokenType))
        )) {
        order.submit.order.shopper.appendChild(new XML('<authenticatedShopperID>' + orderObj.getCustomerNo() + '</authenticatedShopperID>'));
    }
    order.submit.order.shopper.appendChild(shopperBrowser);
    order.submit.order.paymentDetails.appendChild(payment);

    if (echoData) {
        var echoDataXML = new XML('<echoData>' + echoData + '</echoData>');
        order.submit.order.appendChild(echoDataXML);
    }

    // Check if country code is Brazil(BR), then append CPF and Installments in request XML.
    if (billingAddress.countryCode.value.equalsIgnoreCase(worldpayConstants.BRAZILCOUNTRYCODE)) {
        var cpf = paymentIntrument.custom.cpf;
        var installments = paymentIntrument.custom.installments;
        if (installments) {
            order.submit.order.thirdPartyData.instalments = installments;
        }
        if (cpf) {
            order.submit.order.thirdPartyData.cpf = cpf;
        }
    }
    if (paymentIntrument.custom.wpTokenRequested) {
        order = createRequestHelper.addTokenDetails(order, orderObj, orderObj.orderNo);
    }
    // moto order
    if (!(orderObj.createdBy.equals(worldpayConstants.CUSTOMERORDER)) && session.isUserAuthenticated()) {
        var dynamicmoto = new XML('<dynamicInteractionType type="MOTO"/>');
        order.submit.order.appendChild(dynamicmoto);
    }
    order.submit.order.paymentDetails.appendChild(sessionXML);

    if (preferences.dstype !== null && preferences.dstype.value === 'two3d') {
        if (preferences.riskData != null && preferences.riskData) {
            var riskdata = new XML('<riskData> </riskData>');
            var authMethod;
            if (preferences.authenticationMethod.value != null && preferences.authenticationMethod) {
                authMethod = preferences.authenticationMethod.value;
            }
            var authenticationRiskData = new XML('<authenticationRiskData authenticationMethod ="' + authMethod + '"></authenticationRiskData>');
            var authenticationTimestamp = new XML('<authenticationTimestamp> </authenticationTimestamp>');
            authenticationTimestamp.appendChild(createRequestHelper.createTimeStamp());
            authenticationRiskData.appendChild(authenticationTimestamp);
            var shopperAccountRiskData = new XML('<shopperAccountRiskData></shopperAccountRiskData>');
            if (orderObj.customer.authenticated) {
                var shopperAccountCreationDate = new XML('<shopperAccountCreationDate> </shopperAccountCreationDate>');
                var shopperAccountModificationDate = new XML('<shopperAccountModificationDate></shopperAccountModificationDate>');
                shopperAccountCreationDate.appendChild(createRequestHelper.createSRD(orderObj.customer.profile.getCreationDate()));
                shopperAccountModificationDate.appendChild(createRequestHelper.createSRD(orderObj.customer.profile.getLastModified()));
                shopperAccountRiskData.appendChild(shopperAccountCreationDate);
                shopperAccountRiskData.appendChild(shopperAccountModificationDate);
            }
            var transactionRiskDataGiftCardAmount = new XML('<transactionRiskDataGiftCardAmount> </transactionRiskDataGiftCardAmount>');
            transactionRiskDataGiftCardAmount.appendChild(createRequestHelper.createAmt());
            var transactionRiskData = new XML('<transactionRiskData></transactionRiskData>');
            transactionRiskData.appendChild(transactionRiskDataGiftCardAmount);
            riskdata.appendChild(authenticationRiskData);
            riskdata.appendChild(shopperAccountRiskData);
            riskdata.appendChild(transactionRiskData);
            order.submit.order.appendChild(riskdata);
        }
        var challengePref;
        var challengeWindowSize;
        if (preferences.challengePreference.value != null && preferences.challengePreference) {
            challengePref = preferences.challengePreference.value;
        }
        if (preferences.challengeWindowSize.value != null && preferences.challengeWindowSize) {
            challengeWindowSize = preferences.challengeWindowSize.value;
        }
        var additional3DSData = new XML('<additional3DSData dfReferenceId ="' + orderObj.custom.dataSessionID +
            '" challengeWindowSize="' + challengeWindowSize + '" challengePreference = "' + challengePref + '" />');
        order.submit.order.appendChild(additional3DSData);
    }

    return order;
}

/**
 *
 * @param {XML} order - current order XML
 * @param {Object} preferences - Worldpay site preferences
 * @returns {XML} order XML
 */
function addExemptionAttributes(order, preferences) {
    var exemptionData = new XML('<exemption type="' + preferences.exemptionType + '" placement="' + preferences.exemptionPlacement + '"/>');
    order.submit.order.appendChild(exemptionData);
    return order;
}

/**
 *
 * @param {Order} order - Order Object
 * @param {Object} event - Encrypted Payment Bundle
 * @returns {Object} requestXML - auth request XML
 */
function createApplePayAuthRequest(order, event) {
    var utils = require('*/cartridge/scripts/common/utils');
    var language = utils.getLanguage();
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit(null, order);
    var orderNo = order.orderNo;
    var requestXML = new XML('<paymentService version="' + preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>');
    var submit = new XML('<submit></submit>');
    var orderData = new XML('<order orderCode="' + orderNo + '" shopperLanguageCode="' + language + '"></order>');
    submit.appendChild(orderData);
    var description = new XML('<description></description>');
    description.appendChild('ApplePay Order : ' + orderNo);
    submit.order.appendChild(description);
    var amount = order.totalGrossPrice.value;
    amount = (amount.toFixed(2) * (Math.pow(10, preferences.currencyExponent))).toFixed(0);
    var amountXml = new XML('<amount value="' + amount + '" currencyCode="' + order.currencyCode + '" exponent="' + preferences.currencyExponent + '"/>');
    submit.order.appendChild(amountXml);
    var orderContent = new XML('<orderContent></orderContent>');
    orderContent.appendChild(order.orderNo);
    submit.order.appendChild(orderContent);
    var paymentDetails = new XML('<paymentDetails></paymentDetails>');
    submit.order.appendChild(paymentDetails);
    var applePayDetails = new XML('<APPLEPAY-SSL></APPLEPAY-SSL>');
    var header = new XML('<header></header>');
    var ephemeralPublicKey = new XML('<ephemeralPublicKey></ephemeralPublicKey>');
    var publicKeyHash = new XML('<publicKeyHash></publicKeyHash>');
    var transactionId = new XML('<transactionId></transactionId>');
    header.appendChild(ephemeralPublicKey);
    header.appendChild(publicKeyHash);
    header.appendChild(transactionId);

    header.ephemeralPublicKey.appendChild(event.payment.token.paymentData.header.ephemeralPublicKey);
    header.publicKeyHash.appendChild(event.payment.token.paymentData.header.publicKeyHash);
    header.transactionId.appendChild(event.payment.token.paymentData.header.transactionId);
    applePayDetails.appendChild(header);

    var signature = new XML('<signature></signature>');
    var version = new XML('<version></version>');
    var data = new XML('<data></data>');
    signature.appendChild(event.payment.token.paymentData.signature);
    version.appendChild(event.payment.token.paymentData.version);
    data.appendChild(event.payment.token.paymentData.data);

    applePayDetails.appendChild(signature);
    applePayDetails.appendChild(version);
    applePayDetails.appendChild(data);
    submit.order.paymentDetails.appendChild(applePayDetails);

    var ordershopper = new XML('<shopper></shopper>');
    var ordershopperEmailAddress = new XML('<shopperEmailAddress></shopperEmailAddress>');
    ordershopperEmailAddress.appendChild(order.getCustomerEmail());
    ordershopper.appendChild(ordershopperEmailAddress);

    submit.order.appendChild(ordershopper);
    requestXML.appendChild(submit);
    return requestXML;
}

/** Exported functions **/
module.exports = {
    createInitialRequest3D: createInitialRequest3D,
    createCancelOrderRequest: createCancelOrderRequest,
    createInitialRequest3D2: createInitialRequest3D2,
    createOrderInquiriesRequest: createOrderInquiriesRequest,
    createSecondOrderMessage: createSecondOrderMessage,
    createCaptureServiceRequest: createCaptureServiceRequest,
    createRequest: createRequest,
    createConfirmationRequestKlarna: createConfirmationRequestKlarna,
    createVoidRequest: createVoidRequest,
    deletePaymentToken: deletePaymentToken,
    createTokenRequestWOP: createTokenRequestWOP,
    updateTokenRequestWOP: updateTokenRequestWOP,
    createApplePayAuthRequest: createApplePayAuthRequest,
    createSavedCardAuthRequest: createSavedCardAuthRequest,
    addExemptionAttributes: addExemptionAttributes,
    createPartialCaptureRequest: createPartialCaptureRequest,
    createPartialRefundRequest: createPartialRefundRequest,
    createCancelRequest: createCancelRequest,
    createKlarnaCaptureRequest: createKlarnaCaptureRequest,
    createKlarnaRefundRequest: createKlarnaRefundRequest,
    createSaveCardAuthenticateRequest: createSaveCardAuthenticateRequest
};
