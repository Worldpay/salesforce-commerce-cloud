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
var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
var Resource = require('dw/web/Resource');

/**
 * This function to create the initial request xml for Credit card Authorization.
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {Object} req - Request
 * @param {string} ccCVN - ccCVN
 * @param {dw.order.PaymentInstrument} paymentIntrument - payment intrument object
 * @param {Object} preferences - preferences object
 * @param {string} echoData - authorization response echoData string
 * @param {string} cardNumber -  cardNumber.
 * @param {string} encryptedData - encryptedData
 * @return {XML} returns an order in XML object
 */
function createInitialRequest3D(orderObj, req, ccCVN, paymentIntrument, preferences, echoData, cardNumber, encryptedData) {
    if (preferences.missingPreferences()) {
        Logger.getLogger('worldpay').error('Request Creation : Worldpay preferences are not properly set.');
        return null;
    }

    var EnableTokenizationPref = preferences.worldPayEnableTokenization;
    if (preferences.enableStoredCredentials) {
        EnableTokenizationPref = true;
    }

    var orderNo = orderObj.orderNo;
    var PaymentInstrumentUtils = require('*/cartridge/scripts/common/PaymentInstrumentUtils');
    var payment;
    var billingAddress = orderObj.billingAddress;
    if (paymentIntrument.creditCardToken) {
        payment = PaymentInstrumentUtils.getCardPaymentMethodToken(billingAddress, paymentIntrument, ccCVN);
    } else {
        var PaymentMgr = require('dw/order/PaymentMgr');
        var paymentCard = PaymentMgr.getPaymentCard(paymentIntrument.creditCardType);
        payment = PaymentInstrumentUtils.getCardPaymentMethod(orderObj, paymentCard.custom.worldPayCardType, billingAddress, paymentIntrument, ccCVN, encryptedData, cardNumber);
    }

    var shopperBrowser = new XML('<browser><acceptHeader></acceptHeader><userAgentHeader></userAgentHeader></browser>');
    shopperBrowser.acceptHeader = req.httpHeaders.get(WorldpayConstants.ACCEPT);
    shopperBrowser.userAgentHeader = req.httpHeaders.get('user-agent');

    // The result of request.getSession().getSessionID() in Demandware is not NMTOKEN.
    // use the createSessionID() function to cutomize the session ID
    var CreateRequestHelper = require('*/cartridge/scripts/common/CreateRequestHelper');
    var Utils = require('*/cartridge/scripts/common/Utils');
    var totalprice = Utils.calculateNonGiftCertificateAmount(orderObj);
    var amount = totalprice.getValue();
    amount = (amount.toFixed(2) * (Math.pow(10, preferences.currencyExponent))).toFixed(0);


    var currency = totalprice.getCurrencyCode();
    var shippingAddress = orderObj.defaultShipment.shippingAddress;
    var schemeTransactionIdentifier = new XML('<schemeTransactionIdentifier></schemeTransactionIdentifier>');
    var transid = paymentIntrument.custom.transactionIdentifier;
    var storedCredentials;
    if (paymentIntrument.custom.transactionIdentifier && (!EnableTokenizationPref || paymentIntrument.creditCardToken)) {
        if (!(orderObj.createdBy.equals(WorldpayConstants.CUSTOMERORDER)) && session.isUserAuthenticated()) {
            storedCredentials = new XML('<storedCredentials usage="USED" merchantInitiatedReason="' +
            Resource.msg('worldpay.storedcred.mi.UNSCHEDULED', 'worldpay', null) + '"></storedCredentials>');
        } else {
            storedCredentials = new XML('<storedCredentials usage="USED"></storedCredentials>');
        }
        schemeTransactionIdentifier.appendChild(transid);
        storedCredentials.appendChild(schemeTransactionIdentifier);
    } else if (!paymentIntrument.creditCardToken) {
        storedCredentials = new XML('<storedCredentials usage="FIRST"/>');
    } else {
        storedCredentials = new XML('<storedCredentials usage="USED"></storedCredentials>');
    }


    var sessionXML = new XML('<session shopperIPAddress="' + request.httpRemoteAddress + '" id="' +
        CreateRequestHelper.createSessionID(orderNo) + '" />');
    var orderpaymentService = new XML('<?xml version="1.0"?><paymentService version="' +
        preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>');
    var ordersubmit = new XML('<submit></submit>');
    var orderorder = new XML('<order orderCode="' + orderNo + '"></order>');
    var orderdescription = new XML('<description></description>');
    orderdescription.appendChild(CreateRequestHelper.createOrderDescription(orderNo));
    var orderamount = new XML('<amount currencyCode="' + currency + '" exponent="' +
        preferences.currencyExponent + '" value="' + amount + '"/>');
    var orderorderContent = new XML('<orderContent></orderContent>');
    orderorderContent.appendChild(CreateRequestHelper.createOrderContent(orderObj).toString());
    var enableSalesrequest = preferences.enableSalesrequest;
    var orderpaymentDetails;
    if (enableSalesrequest != null && enableSalesrequest) {
        if (orderObj.billingAddress.countryCode.value === 'US') {
            orderpaymentDetails = new XML('<paymentDetails action="SALE"></paymentDetails>');
        } else {
            orderpaymentDetails = new XML('<paymentDetails></paymentDetails>');
        }
    } else {
        orderpaymentDetails = new XML('<paymentDetails></paymentDetails>');
    }
    var ordershopper = new XML('<shopper></shopper>');
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
    var ordershippingAddress = new XML('<shippingAddress></shippingAddress>');
    var orderaddress = new XML('<address></address>');
    var orderfirstName = new XML('<firstName></firstName>');
    orderfirstName.appendChild(shippingAddress.firstName);
    var orderlastName = new XML('<lastName></lastName>');
    orderlastName.appendChild(shippingAddress.lastName);
    var orderaddress1 = new XML('<address1></address1>');
    orderaddress1.appendChild(shippingAddress.address1);
    var orderaddress2 = new XML('<address2></address2>');
    orderaddress2.appendChild((shippingAddress.address2 != null) ? shippingAddress.address2 : '');
    var orderpostalCode = new XML('<postalCode></postalCode>');
    orderpostalCode.appendChild(shippingAddress.postalCode);
    var ordercity = new XML('<city></city>');
    ordercity.appendChild(shippingAddress.city);
    var orderstate = new XML('<state></state>');
    orderstate.appendChild(shippingAddress.stateCode);
    var ordercountryCode = new XML('<countryCode></countryCode>');
    ordercountryCode.appendChild(shippingAddress.countryCode.value.toString().toUpperCase());
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
    orderorder.appendChild(orderorderContent);
    orderorder.appendChild(orderpaymentDetails);
    orderorder.appendChild(ordershopper);
    orderorder.appendChild(ordershippingAddress);

    // associate respective conatiners inside submit container
    ordersubmit.appendChild(orderorder);

    // associate respective conatiners inside paymentService container
    orderpaymentService.appendChild(ordersubmit);

    var order = orderpaymentService;
    order.submit.order.paymentDetails.appendChild(payment);
    if (orderObj.getCustomerNo() != null && (EnableTokenizationPref || paymentIntrument.creditCardToken) &&
        ((preferences.tokenType == null) || (paymentIntrument.custom.tokenScope == null &&
            !preferences.tokenType.toString().equals(WorldpayConstants.merchanttokenType)) || (paymentIntrument.custom.tokenScope != null &&
            !paymentIntrument.custom.tokenScope.equals(WorldpayConstants.merchanttokenType)))) {
        order.submit.order.shopper.appendChild(new XML('<authenticatedShopperID>' + orderObj.getCustomerNo() + '</authenticatedShopperID>'));
    }
    order.submit.order.shopper.appendChild(shopperBrowser);

    if (echoData) {
        var echoDataXML = new XML('<echoData>' + echoData + '</echoData>');
        order.submit.order.appendChild(echoDataXML);
    }
    var installments;
    CreateRequestHelper.addStatementNarrative(order);
    installments = paymentIntrument.custom.installments;
    if (installments) {
        order.submit.order.thirdPartyData.instalments = installments;
    }
    // Check if country code is Brazil(BR), then append CPF in request XML.
    if (billingAddress.countryCode.value.equalsIgnoreCase(WorldpayConstants.BRAZILCOUNTRYCODE)) {
        var cpf = paymentIntrument.custom.cpf;
        if (cpf) {
            order.submit.order.thirdPartyData.cpf = cpf;
        }
    }
    if (paymentIntrument.custom.wpTokenRequested) {
        order = CreateRequestHelper.addTokenDetails(order, orderObj, orderObj.orderNo);
    }
    // moto order
    if (!(orderObj.createdBy.equals(WorldpayConstants.CUSTOMERORDER)) && session.isUserAuthenticated()) {
        var dynamicmoto = new XML('<dynamicInteractionType type="MOTO"/>');
        order.submit.order.appendChild(dynamicmoto);
    }
    if (preferences.enableStoredCredentials != null &&
        ((preferences.enableStoredCredentials && paymentIntrument.custom.saveCard) ||
            (paymentIntrument.creditCardToken && paymentIntrument.custom.transactionIdentifier != null)
        )) {
        order.submit.order.paymentDetails.appendChild(storedCredentials);
    }

    order.submit.order.paymentDetails.appendChild(sessionXML);
    if (enableSalesrequest != null && enableSalesrequest) {
        if (orderObj.billingAddress.countryCode.value === 'US') {
            order.submit.order.appendChild(primeRoutingRequest);
        }
    }
    if (preferences.dstype !== null && preferences.dstype.value === 'two3d') { // eslint-disable-line
        order = CreateRequestHelper.addTo3dsFexRequest(preferences, orderObj, order);
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
    var order = new XML('<?xml version="1.0"?><paymentService version="' + preferences.XMLVersion + '" merchantCode="' + merchantCode + '"><submit> <order orderCode="' + orderNo + '"><info3DSecure><completedAuthentication/></info3DSecure><session id="' + orderNo + '"/></order> </submit></paymentService>');
    order = new XML('<?xml version="1.0"?><paymentService version="' + preferences.XMLVersion + '" merchantCode="' +
        merchantCode + '"><submit> <order orderCode="' + orderNo + '"><info3DSecure><completedAuthentication/></info3DSecure><session id="' +
        orderNo + '"/></order> </submit></paymentService>');
    return order;
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
    var WorldpayPreferences = require('*/cartridge/scripts/object/WorldpayPreferences');
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd);
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

    var statementNarrative = new XML(WorldpayConstants.STATEMENTNARRATIVE);
    var configurablePaymentMethods = preferences.configurablePaymentMethods;
    var CreateRequestHelper = require('*/cartridge/scripts/common/CreateRequestHelper');
    var statementNarrativeText = paymentMthd.custom.statementNarrative;
    if (statementNarrativeText) {
        statementNarrative.appendChild(statementNarrativeText);
    }
    requestXml = CreateRequestHelper.addGeneralDetails(requestXml, orderObj, preferences, apmName);
    if (apmName.equals(WorldpayConstants.KLARNASLICEIT) || apmName.equals(WorldpayConstants.KLARNAPAYLATER) || apmName.equals(WorldpayConstants.KLARNAPAYNOW)) {
        var klarnabillingCountry = orderObj.getBillingAddress().countryCode.value.toString().toUpperCase();
        requestXml = CreateRequestHelper.addShipmentAmountDetailsForKlarna(klarnabillingCountry, requestXml, paymentAmount, preferences);
    } else {
        requestXml = CreateRequestHelper.addShipmentAmountDetails(apmName, requestXml, paymentAmount, preferences);
    }
    requestXml.submit.order.orderContent = CreateRequestHelper.createOrderContent(orderObj).toString();
    if (!apmType) {
        Logger.getLogger('worldpay').error('APM type is missing for this payment method. Please define APM(DIRECT/REDIRECT) in Payment methods in Business Manager)');
        return null;
    }

    // Adding Installation Id for Hosted Payment Pages
    var installationID = preferences.worldPayInstallationId;
    if (installationID) {
        configurablePaymentMethods.forEach(function (configurableAPM) {
            if (configurableAPM.equalsIgnoreCase(apmName)) {
                if (paymentMthd.ID === WorldpayConstants.WORLDPAY && paymentInstrument.getCreditCardToken()) {
                    requestXml = CreateRequestHelper.addInstallationDetails(requestXml, installationID);
                } else {
                    requestXml = CreateRequestHelper.addInstallationDetails(requestXml, installationID);
                    requestXml = CreateRequestHelper.addContactDetails(requestXml);
                }
            }
        });
    }
    var ArrayList = require('dw/util/ArrayList');
    // Add APM specfic details only. Custom logic can be implemented in this ection to add on details
    var payMethod;
    switch (apmName) {
        case WorldpayConstants.PAYPAL:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShippingAddressDetails(requestXml, shippingAddress);
                requestXml = CreateRequestHelper.addBillingAddressDetails(requestXml, billingAddress);
                CreateRequestHelper.addStatementNarrative(requestXml);
            } else {
                // Add code to support PAYPAL-EXPRESS REDIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;
        case WorldpayConstants.GOOGLEPAY:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);

                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                if (preferences.dstype !== null && preferences.dstype.value === 'two3d') { // eslint-disable-line

                    requestXml = CreateRequestHelper.addTo3dsFexRequest(preferences, orderObj, requestXml);
                }

                CreateRequestHelper.addStatementNarrative(requestXml);
            } else {
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;
        case WorldpayConstants.KLARNASLICEIT:
        case WorldpayConstants.KLARNAPAYNOW:
        case WorldpayConstants.KLARNAPAYLATER:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                requestXml = CreateRequestHelper.addShippingAddressDetails(requestXml, shippingAddress);
                requestXml = CreateRequestHelper.addBillingAddressDetails(requestXml, billingAddress);
                CreateRequestHelper.addStatementNarrative(requestXml);
                requestXml = CreateRequestHelper.getOrderDetails(requestXml, orderObj);
            } else {
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;

        case WorldpayConstants.SOFORT:
        case WorldpayConstants.SOFORT_SWITZERLAND:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                CreateRequestHelper.addStatementNarrative(requestXml);
            } else {
                // Add code to support SOFORT-SSL REDIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }

            break;

        case WorldpayConstants.IDEAL:

            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
            } else {
                // Add code to support IDEAL-SSL REDIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;

        case WorldpayConstants.BOLETO:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                requestXml = CreateRequestHelper.addShippingAddressDetails(requestXml, shippingAddress);
                CreateRequestHelper.addStatementNarrative(requestXml);
            } else {
                // Add code to support BOLETO-SSL REDIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;

        case WorldpayConstants.ALIPAY:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                CreateRequestHelper.addStatementNarrative(requestXml);
            } else {
                // Add code to support ALIPAY-SSL REDIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;

        case WorldpayConstants.ALIPAYMOBILE:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                CreateRequestHelper.addStatementNarrative(requestXml);
            } else {
                // Add code to support ALIPAYMOBILE-SSL REDIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;
        case WorldpayConstants.QIWI:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                requestXml = CreateRequestHelper.addShippingAddressDetailsFormat2(requestXml, shippingAddress);
                CreateRequestHelper.addStatementNarrative(requestXml);
            } else {
                // Add code to support QIWI-SSL REDIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;

        case WorldpayConstants.CHINAUNIONPAY:
            if (apmType.equalsIgnoreCase(WorldpayConstants.REDIRECT)) {
                payMethod = new ArrayList();
                payMethod.push(WorldpayConstants.CHINAUNIONPAY);
                requestXml = CreateRequestHelper.addIncludedPaymentMethods(requestXml, payMethod);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                requestXml = CreateRequestHelper.addShippingAddressDetails(requestXml, shippingAddress);
                CreateRequestHelper.addStatementNarrative(requestXml);
            }
            break;

        case WorldpayConstants.MISTERCASH:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                requestXml = CreateRequestHelper.addShippingAddressDetailsFormat2(requestXml, shippingAddress);
                CreateRequestHelper.addStatementNarrative(requestXml);
            } else {
                // Add code to support MISTERCASH-SSL REDIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;

        case WorldpayConstants.ENETSSSL:
            if (apmType.equalsIgnoreCase(WorldpayConstants.REDIRECT)) {
                payMethod = new ArrayList();
                payMethod.push(WorldpayConstants.ENETSSSL);
                requestXml = CreateRequestHelper.addIncludedPaymentMethods(requestXml, payMethod);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                requestXml = CreateRequestHelper.addShippingAddressDetails(requestXml, shippingAddress);
                CreateRequestHelper.addStatementNarrative(requestXml);
            } else {
                // Add code to support ENETs-SSL DIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;

        case WorldpayConstants.YANDEXMONEY:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                CreateRequestHelper.addStatementNarrative(requestXml);
            } else {
                // Add code to support QIWI-SSL REDIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;


        case WorldpayConstants.CASHU:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                CreateRequestHelper.addStatementNarrative(requestXml);
            } else {
                // Add code to support CASHU-SSL REDIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;


        case WorldpayConstants.WORLDPAY:
            var cpf;
            var installments;
            if (paymentInstrument.getCreditCardToken()) {
                var paymentDetails = CreateRequestHelper.getPaymentDetailsForSavedRedirectCC(paymentInstrument, orderObj);
                requestXml.submit.order.appendChild(paymentDetails);
                if ((preferences.tokenType == null) || !preferences.tokenType.toString().equals(WorldpayConstants.merchanttokenType)) {
                    requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, paymentInstrument.custom.wpTokenRequested);
                }
                // Add authenticatedShopperID, shopperEmailAddress only if the card was saved as shopper
                if (paymentInstrument.custom.tokenScope.toLowerCase() === WorldpayConstants.SHOPPER_TOKEN_SCOPE) {
                    requestXml.submit.order.shopper.shopperEmailAddress = orderObj.getCustomerEmail();
                    requestXml.submit.order.shopper.authenticatedShopperID = currentCustomer.profile.customerNo;
                }
                CreateRequestHelper.addStatementNarrative(requestXml);
                installments = paymentInstrument.custom.installments;
                if (installments) {
                    requestXml.submit.order.thirdPartyData.instalments = installments;
                }
                if (billingAddress.countryCode.value.equalsIgnoreCase(WorldpayConstants.BRAZILCOUNTRYCODE)) {
                    cpf = paymentInstrument.custom.cpf;

                    if (cpf) {
                        requestXml.submit.order.thirdPartyData.cpf = cpf;
                    }
                }
                delete requestXml.submit.order.orderContent;
            } else {
                requestXml = CreateRequestHelper.addIncludedPaymentMethods(requestXml, includePaymentMethods, excludePaymentMethods, paymentInstrument);
                if ((preferences.tokenType == null) || !preferences.tokenType.toString().equals(WorldpayConstants.merchanttokenType)) {
                    requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, paymentInstrument.custom.wpTokenRequested);
                }
                requestXml = CreateRequestHelper.addShippingAddressDetails(requestXml, shippingAddress);
                requestXml = CreateRequestHelper.addBillingAddressDetails(requestXml, billingAddress);


                if (apmType.equals(WorldpayConstants.REDIRECT) && !orderObj.createdBy.equals(WorldpayConstants.CUSTOMERORDER) && session.isUserAuthenticated()) {
                    requestXml = CreateRequestHelper.addDynamicInteractionType(requestXml);
                }
                CreateRequestHelper.addStatementNarrative(requestXml);
                installments = paymentInstrument.custom.installments;
                if (installments) {
                    requestXml.submit.order.thirdPartyData.instalments = installments;
                }
                if (billingAddress.countryCode.value.equalsIgnoreCase(WorldpayConstants.BRAZILCOUNTRYCODE)) {
                    cpf = paymentInstrument.custom.cpf;

                    if (cpf) {
                        requestXml.submit.order.thirdPartyData.cpf = cpf;
                    }
                }
                if (paymentInstrument.custom.wpTokenRequested) {
                    requestXml = CreateRequestHelper.addTokenDetails(requestXml, orderObj, orderObj.orderNo);
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
                    if (item.paymentProcessor && WorldpayConstants.WORLDPAY.equals(item.paymentProcessor.ID) && itemId.equalsIgnoreCase(WorldpayConstants.KLARNA)) {
                        requestXml = CreateRequestHelper.getOrderDetails(requestXml, orderObj);
                        break;
                    }
                }
            }
            break;

        case WorldpayConstants.GIROPAY:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                CreateRequestHelper.addStatementNarrative(requestXml);
            } else {
                // Add code to support GIROPAY-SSL DIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;


        case WorldpayConstants.KONBINI:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                requestXml = CreateRequestHelper.addShippingAddressDetails(requestXml, shippingAddress);
                CreateRequestHelper.addStatementNarrative(requestXml);
            } else {
                // Add code to support KONBINI-SSL REDIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;

        case WorldpayConstants.POLI:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                CreateRequestHelper.addStatementNarrative(requestXml);
            } else {
                // Add code to support POLI-SSL REDIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;

        case WorldpayConstants.POLINZ:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                CreateRequestHelper.addStatementNarrative(requestXml);
            } else {
                // Add code to support POLINZ-SSL REDIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;

        case WorldpayConstants.P24:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                CreateRequestHelper.addStatementNarrative(requestXml);
            } else {
                // Add code to support P24 REDIRECT method.
            }
            break;

        case WorldpayConstants.ELV:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                requestXml = CreateRequestHelper.addBillingAddressDetailsFormat2(requestXml, billingAddress);
                CreateRequestHelper.addStatementNarrative(requestXml);
                requestXml = CreateRequestHelper.appendMandateInfo(requestXml, paymentInstrument);
            } else {
                // Add code to support ELV REDIRECT method.
            }
            break;


        case WorldpayConstants.NORDEAFI:
            if (apmType.equalsIgnoreCase(WorldpayConstants.REDIRECT)) {
                payMethod = new ArrayList();
                payMethod.push(WorldpayConstants.NORDEAFI);
                requestXml = CreateRequestHelper.addIncludedPaymentMethods(requestXml, payMethod);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                requestXml = CreateRequestHelper.addShippingAddressDetails(requestXml, shippingAddress);
            } else {
                // Add code to support SOLO-SSL DIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;


        case WorldpayConstants.NORDEASE:
            if (apmType.equalsIgnoreCase(WorldpayConstants.REDIRECT)) {
                payMethod = new ArrayList();
                payMethod.push(WorldpayConstants.NORDEASE);
                requestXml = CreateRequestHelper.addIncludedPaymentMethods(requestXml, payMethod);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                requestXml = CreateRequestHelper.addShippingAddressDetails(requestXml, shippingAddress);
            } else {
                // Add code to support EBETANLING-SSL DIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;


        case WorldpayConstants.WECHATPAY:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                CreateRequestHelper.addStatementNarrative(requestXml);
            } else {
                // Add code to support EBETANLING-SSL DIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;
            // Add Custom Logic to support additional APM's here.

        case WorldpayConstants.ACHPAY:
            requestXml = CreateRequestHelper.getACHPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
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
    var WorldpayPreferences = require('*/cartridge/scripts/object/WorldpayPreferences');
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd);
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
 * @return {XML} returns a XML
 */
function createPartialCaptureRequest(orderID, settleAmount, currency) {
    var WorldpayPreferences = require('*/cartridge/scripts/object/WorldpayPreferences');
    WorldpayPreferences = new WorldpayPreferences();
    var preferences = WorldpayPreferences.worldPayPreferencesInit();
    var captureRequest = new XML('<paymentService version="' + preferences.XMLVersion + '" merchantCode="' +
        preferences.merchantCode + '"></paymentService>');
    var modify = new XML('<modify></modify>');
    var ordermodification = new XML('<orderModification orderCode="' + orderID + '"></orderModification>');
    var capture = new XML('<capture></capture>');
    var amount = new XML('<amount value="' + settleAmount + '" currencyCode="' + currency +
        '" exponent="' + preferences.currencyExponent + '"/>');
    capture.appendChild(amount);
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
 * @return {XML} returns a XML
 */
function createPartialRefundRequest(orderID, settleAmount, currency) {
    var WorldpayPreferences = require('*/cartridge/scripts/object/WorldpayPreferences');
    WorldpayPreferences = new WorldpayPreferences();
    var preferences = WorldpayPreferences.worldPayPreferencesInit();
    var refundRequest = new XML('<paymentService version="' + preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>');
    var modify = new XML('<modify></modify>');
    var ordermodification = new XML('<orderModification orderCode="' + orderID + '"></orderModification>');
    var refund = new XML('<refund></refund>');
    var amount = new XML('<amount value="' + settleAmount + '" currencyCode="' + currency + '" exponent="' + preferences.currencyExponent + '"/>');
    refund.appendChild(amount);
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
    var WorldpayPreferences = require('*/cartridge/scripts/object/WorldpayPreferences');
    WorldpayPreferences = new WorldpayPreferences();
    var preferences = WorldpayPreferences.worldPayPreferencesInit();
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
    if (!payment.raw.custom.tokenScope.equals(WorldpayConstants.merchanttokenType)) {
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
    var CreateRequestHelper = require('*/cartridge/scripts/common/CreateRequestHelper');
    var EnableTokenizationPref = preferences.worldPayEnableTokenization;
    if (preferences.enableStoredCredentials) {
        EnableTokenizationPref = true;
    }
    var cardService = new XML('<?xml version="1.0"?><paymentService version="' +
        preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>');
    // submit container
    var submit = new XML('<submit></submit>');
    var tstamp = new Date().getTime();
    var description = CreateRequestHelper.createOrderDescription(tstamp);
    // order container
    var orderorder = new XML('<order orderCode="' + tstamp + '"></order>');
    var orderdescription = new XML('<description></description>');
    orderdescription.appendChild(description);
    var orderamount = new XML('<amount currencyCode="' + session.getCurrency().getCurrencyCode() + '" exponent="' +
        preferences.currencyExponent + '" value="0"/>');
    var orderpaymentDetails = new XML('<paymentDetails></paymentDetails>');
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
    orderpaymentDetails.appendChild(cardtype);
    if (preferences.enableStoredCredentials && preferences.enableStoredCredentials != null) {
        orderpaymentDetails.appendChild(storedCredentials);
    }
    var ordershopper = new XML('<shopper></shopper>');
    var authenticatedShopperID = new XML('<authenticatedShopperID></authenticatedShopperID>');
    authenticatedShopperID.appendChild(customerObj.profile.customerNo);
    var shopperBrowser = new XML('<browser><acceptHeader></acceptHeader><userAgentHeader></userAgentHeader></browser>');
    if (customerObj.profile.customerNo != null && (EnableTokenizationPref) &&
        ((preferences.tokenType == null) || !preferences.tokenType.toString().equals(WorldpayConstants.merchanttokenType))) {
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
    orderorder.appendChild(orderpaymentDetails);
    orderorder.appendChild(ordershopper);
    if (EnableTokenizationPref && EnableTokenizationPref != null) {
        orderorder.appendChild(token);
    }
    if (preferences.dstype !== null && preferences.dstype.value === 'two3d') {
        if (preferences.riskData != null && preferences.riskData) {
            var riskdata = new XML('<riskData> </riskData>');
            var authMethod;
            if (preferences.authenticationMethod.value != null && preferences.authenticationMethod) {
                authMethod = preferences.authenticationMethod.value;
            }
            var authenticationRiskData = new XML('<authenticationRiskData authenticationMethod ="' + authMethod + '"></authenticationRiskData>');
            var authenticationTimestamp = new XML('<authenticationTimestamp> </authenticationTimestamp>');
            authenticationTimestamp.appendChild(CreateRequestHelper.createTimeStamp());
            authenticationRiskData.appendChild(authenticationTimestamp);
            var shopperAccountRiskData = new XML('<shopperAccountRiskData></shopperAccountRiskData>');
            if (customerObj.authenticated) {
                var shopperAccountCreationDate = new XML('<shopperAccountCreationDate> </shopperAccountCreationDate>');
                var shopperAccountModificationDate = new XML('<shopperAccountModificationDate></shopperAccountModificationDate>');
                shopperAccountCreationDate.appendChild(CreateRequestHelper.createSRD(customerObj.profile.getCreationDate()));
                shopperAccountModificationDate.appendChild(CreateRequestHelper.createSRD(customerObj.profile.getLastModified()));
                shopperAccountRiskData.appendChild(shopperAccountCreationDate);
                shopperAccountRiskData.appendChild(shopperAccountModificationDate);
            }
            var transactionRiskDataGiftCardAmount = new XML('<transactionRiskDataGiftCardAmount> </transactionRiskDataGiftCardAmount>');
            transactionRiskDataGiftCardAmount.appendChild(CreateRequestHelper.createAmt());
            var transactionRiskData = new XML('<transactionRiskData></transactionRiskData>');
            transactionRiskData.appendChild(transactionRiskDataGiftCardAmount);
            riskdata.appendChild(authenticationRiskData);
            riskdata.appendChild(shopperAccountRiskData);
            riskdata.appendChild(transactionRiskData);
            orderorder.appendChild(riskdata);
        }
        var challengePref;
        var challengeWindowSize;
        if (preferences.challengePreference.value != null && preferences.challengePreference) {
            challengePref = preferences.challengePreference.value;
        }
        if (preferences.challengeWindowSize.value != null && preferences.challengeWindowSize) {
            challengeWindowSize = preferences.challengeWindowSize.value;
        }
        var additional3DSData = new XML('<additional3DSData dfReferenceId ="' + session.custom.sessionID +
            '" challengeWindowSize="' + challengeWindowSize + '" challengePreference = "' + challengePref + '" />');
        orderorder.appendChild(additional3DSData);
    }
    submit.appendChild(orderorder);
    cardService.appendChild(submit);
    return cardService;
}

// eslint-disable-next-line valid-jsdoc
/**
 * Creating Request for saved card
 * @param {Object} orderObj - Order Object
 * @param {Object} req - request
 * @param {number} ccCVN - CVV
 * @param {Object} paymentIntrument - Payment Insrument
 * @param {Object} preferences - Preferences for Worldpay
 * @param {Object} echoData - echo data
 * @param {number} cardNumber - Credit Card Number
 * @param {Object} encryptedData - encryptedData
 * @returns Order
 */
function createSavedCardAuthRequest(orderObj, req, ccCVN, paymentIntrument, preferences, echoData, cardNumber, encryptedData) {
    var payment;
    var orderNo = orderObj.orderNo;
    var billingAddress = orderObj.billingAddress;
    var PaymentInstrumentUtils = require('*/cartridge/scripts/common/PaymentInstrumentUtils');
    if (preferences.missingPreferences()) {
        Logger.getLogger('worldpay').error('Request Creation : Worldpay preferences are not properly set.');
        return null;
    }

    if (paymentIntrument.creditCardToken) {
        payment = PaymentInstrumentUtils.getPaymentTokenForSavedCard(billingAddress, paymentIntrument, ccCVN);
    }

    var EnableTokenizationPref = preferences.worldPayEnableTokenization;
    if (preferences.enableStoredCredentials) {
        EnableTokenizationPref = true;
    }

    var shopperBrowser = new XML('<browser><acceptHeader></acceptHeader><userAgentHeader></userAgentHeader></browser>');
    shopperBrowser.acceptHeader = req.httpHeaders.get(WorldpayConstants.ACCEPT);
    shopperBrowser.userAgentHeader = req.httpHeaders.get('user-agent');

    // The result of request.getSession().getSessionID() in Demandware is not NMTOKEN.
    // use the createSessionID() function to cutomize the session ID
    var CreateRequestHelper = require('*/cartridge/scripts/common/CreateRequestHelper');
    var Utils = require('*/cartridge/scripts/common/Utils');
    var totalprice = Utils.calculateNonGiftCertificateAmount(orderObj);
    var amount = totalprice.getValue();
    amount = (amount.toFixed(2) * (Math.pow(10, preferences.currencyExponent))).toFixed(0);

    var currency = totalprice.getCurrencyCode();
    var shippingAddress = orderObj.defaultShipment.shippingAddress;
    var schemeTransactionIdentifier = new XML('<schemeTransactionIdentifier></schemeTransactionIdentifier>');
    var transid = paymentIntrument.custom.transactionIdentifier;

    var isSavedRedirectCard;
    var PaymentMgr = require('dw/order/PaymentMgr');
    var apmName = paymentIntrument.getPaymentMethod();
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);

    if (paymentMthd.ID === WorldpayConstants.WORLDPAY && paymentIntrument.creditCardToken) {
        isSavedRedirectCard = true;
    }
    var storedCredentials;

    storedCredentials = new XML('<storedCredentials></storedCredentials>');

    var sessionXML = new XML('<session shopperIPAddress="' + request.httpRemoteAddress + '" id="' + CreateRequestHelper.createSessionID(orderNo) + '" />');
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
    orderdescription.appendChild(CreateRequestHelper.createOrderDescription(orderNo));
    // amount container
    var orderamount = new XML('<amount currencyCode="' + currency + '" exponent="' + preferences.currencyExponent + '" value="' + amount + '"/>');

    // paymentDetails container
    var orderpaymentDetails = new XML('<paymentDetails></paymentDetails>');

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
    orderorder.appendChild(orderpaymentDetails);
    orderorder.appendChild(ordershopper);
    orderorder.appendChild(ordershippingAddress);

    // associate respective conatiners inside submit container
    ordersubmit.appendChild(orderorder);

    // associate respective conatiners inside paymentService container
    orderpaymentService.appendChild(ordersubmit);

    var order = orderpaymentService;
    if (orderObj.getCustomerNo() != null && (EnableTokenizationPref || paymentIntrument.creditCardToken) &&
        ((preferences.tokenType == null) ||
            (paymentIntrument.custom.tokenScope == null && !preferences.tokenType.toString().equals(WorldpayConstants.merchanttokenType))
            || (paymentIntrument.custom.tokenScope != null && !paymentIntrument.custom.tokenScope.equals(WorldpayConstants.merchanttokenType))
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
    if (billingAddress.countryCode.value.equalsIgnoreCase(WorldpayConstants.BRAZILCOUNTRYCODE)) {
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
        order = CreateRequestHelper.addTokenDetails(order, orderObj, orderObj.orderNo);
    }
    // moto order
    if (!(orderObj.createdBy.equals(WorldpayConstants.CUSTOMERORDER)) && session.isUserAuthenticated()) {
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
            authenticationTimestamp.appendChild(CreateRequestHelper.createTimeStamp());
            authenticationRiskData.appendChild(authenticationTimestamp);
            var shopperAccountRiskData = new XML('<shopperAccountRiskData></shopperAccountRiskData>');
            if (orderObj.customer.authenticated) {
                var shopperAccountCreationDate = new XML('<shopperAccountCreationDate> </shopperAccountCreationDate>');
                var shopperAccountModificationDate = new XML('<shopperAccountModificationDate></shopperAccountModificationDate>');
                shopperAccountCreationDate.appendChild(CreateRequestHelper.createSRD(orderObj.customer.profile.getCreationDate()));
                shopperAccountModificationDate.appendChild(CreateRequestHelper.createSRD(orderObj.customer.profile.getLastModified()));
                shopperAccountRiskData.appendChild(shopperAccountCreationDate);
                shopperAccountRiskData.appendChild(shopperAccountModificationDate);
            }
            var transactionRiskDataGiftCardAmount = new XML('<transactionRiskDataGiftCardAmount> </transactionRiskDataGiftCardAmount>');
            transactionRiskDataGiftCardAmount.appendChild(CreateRequestHelper.createAmt());
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
    var Utils = require('*/cartridge/scripts/common/Utils');
    var language = Utils.getLanguage();
    var WorldpayPreferences = require('*/cartridge/scripts/object/WorldpayPreferences');
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit();
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
    createApplePayAuthRequest: createApplePayAuthRequest,
    createSavedCardAuthRequest: createSavedCardAuthRequest,
    addExemptionAttributes: addExemptionAttributes,
    createPartialCaptureRequest: createPartialCaptureRequest,
    createPartialRefundRequest: createPartialRefundRequest,
    createCancelRequest: createCancelRequest
};
