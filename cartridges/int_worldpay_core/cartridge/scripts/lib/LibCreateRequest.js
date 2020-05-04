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

    var shopperBrowser = new XML('<browser><acceptHeader></acceptHeader><userAgentHeader></userAgentHeader></browser>'); // eslint-disable-line
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
    var schemeTransactionIdentifier = new XML('<schemeTransactionIdentifier></schemeTransactionIdentifier>'); //eslint-disable-line
    var transid = paymentIntrument.custom.transactionIdentifier;
    var storedCredentials;
    if (paymentIntrument.custom.transactionIdentifier && (!EnableTokenizationPref || paymentIntrument.creditCardToken)) {
        if (!(orderObj.createdBy.equals(WorldpayConstants.CUSTOMERORDER)) && session.isUserAuthenticated()) { //eslint-disable-line
        storedCredentials = new XML('<storedCredentials usage="USED" merchantInitiatedReason="' + Resource.msg('worldpay.storedcred.mi.UNSCHEDULED', 'worldpay', null) + '"></storedCredentials>'); //eslint-disable-line
        } else {
        storedCredentials = new XML('<storedCredentials usage="USED"></storedCredentials>'); //eslint-disable-line
        }
        schemeTransactionIdentifier.appendChild(transid);
        storedCredentials.appendChild(schemeTransactionIdentifier);
    } else {
        if (!paymentIntrument.creditCardToken) { //eslint-disable-line
           storedCredentials = new XML('<storedCredentials usage="FIRST"/>'); //eslint-disable-line
        } else {
    storedCredentials = new XML('<storedCredentials usage="USED"></storedCredentials>'); //eslint-disable-line
        }
    }


    var sessionXML = new XML('<session shopperIPAddress="' + request.httpRemoteAddress + '" id="' + CreateRequestHelper.createSessionID(orderNo) + '" />'); // eslint-disable-line
    var orderpaymentService = new XML('<?xml version="1.0"?><paymentService version="' + preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>'); // eslint-disable-line
    // sumbit container
    var ordersubmit = new XML('<submit></submit>'); // eslint-disable-line
    // order container
    var orderorder = new XML('<order orderCode="' + orderNo + '"></order>'); // eslint-disable-line
    // description container
    var orderdescription = new XML('<description></description>'); // eslint-disable-line
    orderdescription.appendChild(CreateRequestHelper.createOrderDescription(orderNo));
    // amount container
    var orderamount = new XML('<amount currencyCode="' + currency + '" exponent="' + preferences.currencyExponent + '" value="' + amount + '"/>'); // eslint-disable-line
    // orderContent container
    var orderorderContent = new XML('<orderContent></orderContent>'); // eslint-disable-line
    orderorderContent.appendChild(CreateRequestHelper.createOrderContent(orderObj).toString());
    // paymentDetails container
    var enableSalesrequest = preferences.enableSalesrequest;
    var orderpaymentDetails;
    if (enableSalesrequest != null && enableSalesrequest) {
        if (orderObj.billingAddress.countryCode.value === 'US') {
          orderpaymentDetails = new XML('<paymentDetails action="SALE"></paymentDetails>'); // eslint-disable-line
        } else {
          orderpaymentDetails = new XML('<paymentDetails></paymentDetails>'); // eslint-disable-line
        }
    } else {
         orderpaymentDetails = new XML('<paymentDetails></paymentDetails>'); // eslint-disable-line
    }
    // shopper container
    var ordershopper = new XML('<shopper></shopper>'); // eslint-disable-line
    // shopper email address contaioner
    var ordershopperEmailAddress = new XML('<shopperEmailAddress></shopperEmailAddress>'); // eslint-disable-line
    ordershopperEmailAddress.appendChild(orderObj.getCustomerEmail());
    // associate respective conatiners inside shopper container
    ordershopper.appendChild(ordershopperEmailAddress);
    // prime routing
    var primeRoutingRequest = new XML('<primeRoutingRequest></primeRoutingRequest>'); // eslint-disable-line
    var routingPreference = new XML ('<routingPreference></routingPreference>'); // eslint-disable-line
    routingPreference.appendChild(preferences.routingPreference);
    var preferredNetworks =new XML('<preferredNetworks> </preferredNetworks>'); // eslint-disable-line
    var availableNetworks = preferences.debitNetworks;
    for (var i=0; i<availableNetworks.length; i++) { // eslint-disable-line
    	var networkName = new XML ('<networkName> </networkName>'); // eslint-disable-line
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
    var ordershippingAddress = new XML('<shippingAddress></shippingAddress>'); // eslint-disable-line
    // address container
    var orderaddress = new XML('<address></address>'); // eslint-disable-line
    // first name container
    var orderfirstName = new XML('<firstName></firstName>'); // eslint-disable-line
    orderfirstName.appendChild(shippingAddress.firstName);
    // last name container
    var orderlastName = new XML('<lastName></lastName>'); // eslint-disable-line
    orderlastName.appendChild(shippingAddress.lastName);
    // address1 container
    var orderaddress1 = new XML('<address1></address1>'); // eslint-disable-line
    orderaddress1.appendChild(shippingAddress.address1);
    // address2 container
    var orderaddress2 = new XML('<address2></address2>'); // eslint-disable-line
    orderaddress2.appendChild((shippingAddress.address2 != null) ? shippingAddress.address2 : '');
    // post code container
    var orderpostalCode = new XML('<postalCode></postalCode>'); // eslint-disable-line
    orderpostalCode.appendChild(shippingAddress.postalCode);
    // city container
    var ordercity = new XML('<city></city>'); // eslint-disable-line
    ordercity.appendChild(shippingAddress.city);
    // state container
    var orderstate = new XML('<state></state>'); // eslint-disable-line
    orderstate.appendChild(shippingAddress.stateCode);
    // countrycode container
    var ordercountryCode = new XML('<countryCode></countryCode>'); // eslint-disable-line
    ordercountryCode.appendChild(shippingAddress.countryCode.value.toString().toUpperCase());
    // tel container
    var ordertelephoneNumber = new XML('<telephoneNumber></telephoneNumber>'); // eslint-disable-line
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
    if (orderObj.getCustomerNo() != null && (EnableTokenizationPref || paymentIntrument.creditCardToken) && ((preferences.tokenType == null) || (paymentIntrument.custom.tokenScope == null && !preferences.tokenType.toString().equals(WorldpayConstants.merchanttokenType)) || (paymentIntrument.custom.tokenScope != null && !paymentIntrument.custom.tokenScope.equals(WorldpayConstants.merchanttokenType)))) { // eslint-disable-line
        order.submit.order.shopper.appendChild(new XML('<authenticatedShopperID>' + orderObj.getCustomerNo() + '</authenticatedShopperID>')); // eslint-disable-line
    }
    order.submit.order.shopper.appendChild(shopperBrowser);

    if (echoData) {
        var echoDataXML = new XML('<echoData>' + echoData + '</echoData>'); // eslint-disable-line
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
    if (!(orderObj.createdBy.equals(WorldpayConstants.CUSTOMERORDER)) && session.isUserAuthenticated()) { // eslint-disable-line
        var dynamicmoto = new XML('<dynamicInteractionType type="MOTO"/>'); // eslint-disable-line
        order.submit.order.appendChild(dynamicmoto);
    }
    if (preferences.enableStoredCredentials != null && ((preferences.enableStoredCredentials && paymentIntrument.custom.saveCard) || (paymentIntrument.creditCardToken && paymentIntrument.custom.transactionIdentifier != null))) {
        order.submit.order.paymentDetails.appendChild(storedCredentials);
    }

    order.submit.order.paymentDetails.appendChild(sessionXML);
    if (enableSalesrequest != null && enableSalesrequest) {
        if (orderObj.billingAddress.countryCode.value === 'US') {
            order.submit.order.appendChild(primeRoutingRequest);
        }
    }
    if (preferences.dstype != null && preferences.dstype == 'two3d') { // eslint-disable-line
        if (preferences.riskData != null && preferences.riskData) {
        var riskdata = new XML('<riskData> </riskData>'); // eslint-disable-line
            if (preferences.authenticationMethod.value != null && preferences.authenticationMethod) {
                var authMethod = preferences.authenticationMethod.value;
            }
        var authenticationRiskData = new XML('<authenticationRiskData authenticationMethod ="' + authMethod + '"></authenticationRiskData>'); // eslint-disable-line
            var authenticationTimestamp = new XML('<authenticationTimestamp> </authenticationTimestamp>'); // eslint-disable-line
            authenticationTimestamp.appendChild(CreateRequestHelper.createTimeStamp());
            authenticationRiskData.appendChild(authenticationTimestamp);
            var shopperAccountRiskData = new XML('<shopperAccountRiskData></shopperAccountRiskData>');// eslint-disable-line
            if (orderObj.customer.authenticated) {
            var shopperAccountCreationDate= new XML('<shopperAccountCreationDate> </shopperAccountCreationDate>'); // eslint-disable-line
            var shopperAccountModificationDate= new XML('<shopperAccountModificationDate></shopperAccountModificationDate>'); // eslint-disable-line
                shopperAccountCreationDate.appendChild(CreateRequestHelper.createSRD(orderObj.customer.profile.getCreationDate()));
                shopperAccountModificationDate.appendChild(CreateRequestHelper.createSRD(orderObj.customer.profile.getLastModified()));
                shopperAccountRiskData.appendChild(shopperAccountCreationDate);
                shopperAccountRiskData.appendChild(shopperAccountModificationDate);
            }
        var transactionRiskDataGiftCardAmount = new XML('<transactionRiskDataGiftCardAmount> </transactionRiskDataGiftCardAmount>'); // eslint-disable-line
            transactionRiskDataGiftCardAmount.appendChild(CreateRequestHelper.createAmt());
            var transactionRiskData = new XML ('<transactionRiskData></transactionRiskData>'); // eslint-disable-line
            transactionRiskData.appendChild(transactionRiskDataGiftCardAmount);
            riskdata.appendChild(authenticationRiskData);
            riskdata.appendChild(shopperAccountRiskData);
            riskdata.appendChild(transactionRiskData);
            order.submit.order.appendChild(riskdata);
        }
        if (preferences.challengePreference.value != null && preferences.challengePreference) {
            var challengePref = preferences.challengePreference.value;
        }
        if (preferences.challengeWindowSize.value != null && preferences.challengeWindowSize) {
            var challengeWindowSize = preferences.challengeWindowSize.value;
        }
        var additional3DSData = new XML('<additional3DSData dfReferenceId ="' + orderObj.custom.dataSessionID + '" challengeWindowSize="' + challengeWindowSize + '" challengePreference = "' + challengePref + '" />'); // eslint-disable-line
        order.submit.order.appendChild(additional3DSData);
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
	var order = new XML('<?xml version="1.0"?><paymentService version="' + preferences.XMLVersion + '" merchantCode="' + merchantCode + '"><submit> <order orderCode="' + orderNo + '"><info3DSecure><completedAuthentication/></info3DSecure><session id="' + orderNo + '"/></order> </submit></paymentService>'); // eslint-disable-line
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
    var order = new XML('<?xml version="1.0"?><paymentService version="' + preferences.XMLVersion + '" merchantCode="' + merchantCode + '"><modify>        <orderModification orderCode="' + orderNo + '"><cancelOrRefund/></orderModification></modify></paymentService>'); // eslint-disable-line
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
    var order = new XML('<?xml version="1.0"?><paymentService version="' + preferences.XMLVersion + '" merchantCode="' + merchantCode + '"><inquiry>        <klarnaConfirmationInquiry  orderCode="' + orderNo + '"></klarnaConfirmationInquiry></inquiry></paymentService>'); // eslint-disable-line
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

    var requestXml = new XML('<?xml version="1.0"?><paymentService version="' + preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>'); // eslint-disable-line
    var modifyXml = new XML('<modify/>'); // eslint-disable-line
    var orderModificationXml = new XML('<orderModification orderCode="' + orderCode + '"/>'); // eslint-disable-line
    var captureXml = new XML('<capture/>'); // eslint-disable-line
    var amountXml = new XML('<amount value="' + captureamount + '" currencyCode="' + currencyCode + '" exponent="' + preferences.currencyExponent + '" debitCreditIndicator="' + debitCreditIndicator + '"/>'); // eslint-disable-line
    var shippingXml = new XML('<shipping/>'); // eslint-disable-line
    var shippingInfoXml = new XML('<shippingInfo trackingId=""/>'); // eslint-disable-line

    if (!preferences.captureServiceTrackingId) { // Capture without tracking ID
        shippingXml.appendChild(shippingInfoXml); // eslint-disable-line
    } else { // Capture with tracking ID
        for (var i = 0; i < shipmentUUIDs.length; i++) {
            shippingXml.appendChild(new XML('<shippingInfo trackingId="' + shipmentUUIDs[i] + '"/>')); // eslint-disable-line
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
    var order = new XML('<?xml version="1.0"?><paymentService version="' + preferences.XMLVersion + '" merchantCode="' + merchantCode + '"><inquiry><orderInquiry orderCode="' + orderNo + '"/></inquiry></paymentService>'); // eslint-disable-line
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

    var info3d = new XML('<info3DSecure><paResponse>' + paRes + '</paResponse></info3DSecure>'); // eslint-disable-line
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
    var requestXml = new XML('<paymentService version="' + preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>'); // eslint-disable-line
    var includePaymentMethods = preferences.paymentMethodsIncludes;
    var excludePaymentMethods = preferences.paymentMethodsExcludes;

    var statementNarrative = new XML(WorldpayConstants.STATEMENTNARRATIVE); // eslint-disable-line
    var configurablePaymentMethods = preferences.configurablePaymentMethods;
    var CreateRequestHelper = require('*/cartridge/scripts/common/CreateRequestHelper');
    var statementNarrativeText = paymentMthd.custom.statementNarrative;
    if (statementNarrativeText) {
        statementNarrative.appendChild(statementNarrativeText);
    }
    requestXml = CreateRequestHelper.addGeneralDetails(requestXml, orderObj, preferences);
    requestXml = CreateRequestHelper.addShipmentAmountDetails(apmName, requestXml, paymentAmount, preferences);
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
                requestXml = CreateRequestHelper.addInstallationDetails(requestXml, installationID);
                requestXml = CreateRequestHelper.addContactDetails(requestXml);
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
            } else {
                // Add code to support PAYPAL-EXPRESS REDIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;
        case WorldpayConstants.GOOGLEPAY:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
            } else {
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;
        case WorldpayConstants.KLARNA:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                requestXml = CreateRequestHelper.addShippingAddressDetails(requestXml, shippingAddress);
                requestXml = CreateRequestHelper.addBillingAddressDetails(requestXml, billingAddress);
                requestXml = CreateRequestHelper.getOrderDetails(requestXml, orderObj);
            } else {
                // Add code to support PAYPAL-EXPRESS REDIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;

        case WorldpayConstants.SOFORT:
        case WorldpayConstants.SOFORT_SWITZERLAND:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                requestXml.submit.order.appendChild(statementNarrative);
            } else {
                // Add code to support SOFORT-SSL REDIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }

            break;

        case WorldpayConstants.IDEAL:

            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml.submit.order.appendChild(statementNarrative);
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
                requestXml.submit.order.appendChild(statementNarrative);
            } else {
                // Add code to support ALIPAY-SSL REDIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;

        case WorldpayConstants.QIWI:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                requestXml = CreateRequestHelper.addShippingAddressDetailsFormat2(requestXml, shippingAddress);
                requestXml.submit.order.appendChild(statementNarrative);
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
                requestXml.submit.order.appendChild(statementNarrative);
            }
            break;

        case WorldpayConstants.MISTERCASH:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                requestXml = CreateRequestHelper.addShippingAddressDetailsFormat2(requestXml, shippingAddress);
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
            } else {
                // Add code to support CASHU-SSL REDIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;


        case WorldpayConstants.WORLDPAY:
            requestXml = CreateRequestHelper.addIncludedPaymentMethods(requestXml, includePaymentMethods, excludePaymentMethods, paymentInstrument);
            if ((preferences.tokenType == null) || !preferences.tokenType.toString().equals(WorldpayConstants.merchanttokenType)) { // eslint-disable-line
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, paymentInstrument.custom.wpTokenRequested);
            }
            requestXml = CreateRequestHelper.addShippingAddressDetails(requestXml, shippingAddress);
            requestXml = CreateRequestHelper.addBillingAddressDetails(requestXml, billingAddress);

            if (paymentInstrument.custom.wpTokenRequested) {
                requestXml = CreateRequestHelper.addTokenDetails(requestXml, orderObj, orderObj.orderNo);
            }

            if (apmType.equals(WorldpayConstants.REDIRECT) && !orderObj.createdBy.equals(WorldpayConstants.CUSTOMERORDER) && session.isUserAuthenticated()) { // eslint-disable-line
                requestXml = CreateRequestHelper.addDynamicInteractionType(requestXml);
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
            break;

        case WorldpayConstants.GIROPAY:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
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
            } else {
                // Add code to support P24 REDIRECT method.
            }
            break;

        case WorldpayConstants.ELV:
            if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
                requestXml = CreateRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
                requestXml = CreateRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
                requestXml = CreateRequestHelper.addBillingAddressDetailsFormat2(requestXml, billingAddress);
                requestXml.submit.order.appendChild(statementNarrative);
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
            } else {
                // Add code to support EBETANLING-SSL DIRECT method.
                Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
                return null;
            }
            break;
            // Add Custom Logic to support additional APM's here.
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
	var requestXml = new XML('<paymentService version="' + preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>'); // eslint-disable-line
	var modify = new XML('<modify></modify>'); // eslint-disable-line
	var ordermodification = new XML('<orderModification orderCode="'+orderObj.orderNo+'"></orderModification>'); // eslint-disable-line
	var voidsale = new XML('<voidSale/>'); // eslint-disable-line
    ordermodification.appendChild(voidsale);
    modify.appendChild(ordermodification);
    requestXml.appendChild(modify);
    return requestXml;
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
    var paymentService = new XML('<?xml version="1.0"?><paymentService version="' + preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>'); // eslint-disable-line
    // modify container
    var modify = new XML('<modify></modify>'); // eslint-disable-line
	var paymentTokenID = new XML('<paymentTokenID></paymentTokenID>'); // eslint-disable-line
	var authenticatedShopperID = new XML('<authenticatedShopperID></authenticatedShopperID>'); // eslint-disable-line
	var tokenEventReference = new XML('<tokenEventReference></tokenEventReference>'); // eslint-disable-line
	var tokenReason = new XML('<tokenReason></tokenReason>'); // eslint-disable-line
    var tokenType = Site.getCurrent().getCustomPreferenceValue('tokenType');
    var token;
    if (tokenType != null) {
        if (payment.raw.custom.tokenScope) {
            token = new XML('<paymentTokenDelete tokenScope="'+ payment.raw.custom.tokenScope.toLowerCase() +'"> </paymentTokenDelete>'); //eslint-disable-line
        }
    } else {
    	token = new XML('<paymentTokenDelete tokenScope="shopper"> </paymentTokenDelete>'); // eslint-disable-line
    }
    var ccToken = payment.raw.creditCardToken;
    paymentTokenID.appendChild(ccToken);
    authenticatedShopperID.appendChild(customerNo);
    tokenEventReference.appendChild(ccToken);
    tokenReason.appendChild(ccToken);
    token.appendChild(paymentTokenID);
    if (!payment.raw.custom.tokenScope.equals(WorldpayConstants.merchanttokenType)) { // eslint-disable-line
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
    var cardService = new XML('<?xml version="1.0"?><paymentService version="' + preferences.XMLVersion + '" merchantCode="' + preferences.merchantCode + '"></paymentService>'); // eslint-disable-line
    // submit container
    var submit = new XML('<submit></submit>'); // eslint-disable-line
    var tstamp = new Date().getTime();
    var description = CreateRequestHelper.createOrderDescription(tstamp);
    // order container
    var orderorder = new XML('<order orderCode="' + tstamp + '"></order>'); // eslint-disable-line
    var orderdescription = new XML('<description></description>'); // eslint-disable-line
    orderdescription.appendChild(description);
    var orderamount = new XML('<amount currencyCode="'+ session.getCurrency().getCurrencyCode()+ '" exponent="' + preferences.currencyExponent + '" value="0"/>'); // eslint-disable-line
    var orderpaymentDetails = new XML('<paymentDetails></paymentDetails>'); // eslint-disable-line
    var PaymentMgr = require('dw/order/PaymentMgr');
    var paymentCard = PaymentMgr.getPaymentCard(paymentInstrument.creditCardType);
    var wpPaymentCard = paymentCard.custom.worldPayCardType;
    var cardtype = new XML('<'+ wpPaymentCard +'/>'); // eslint-disable-line
    var cardno = new XML('<cardNumber></cardNumber>'); // eslint-disable-line
    cardno.appendChild(cardNumber);
    var expiryDate = new XML('<expiryDate></expiryDate>'); // eslint-disable-line
    var dateExp = new XML('<date month="' + expirationMonth + '" year="' + expirationYear + '" />'); // eslint-disable-line
    expiryDate.appendChild(dateExp);
    var cardholdername = new XML('<cardHolderName></cardHolderName>'); // eslint-disable-line
    cardholdername.appendChild(paymentInstrument.creditCardHolder);
    cardtype.appendChild(cardno);
    cardtype.appendChild(expiryDate);
    cardtype.appendChild(cardholdername);
    var storedCredentials = new XML('<storedCredentials usage="FIRST"/>'); //eslint-disable-line
    orderpaymentDetails.appendChild(cardtype);
    if (preferences.enableStoredCredentials && preferences.enableStoredCredentials != null) {
        orderpaymentDetails.appendChild(storedCredentials);
    }
    var ordershopper = new XML('<shopper></shopper>'); // eslint-disable-line
    var authenticatedShopperID = new XML('<authenticatedShopperID></authenticatedShopperID>'); // eslint-disable-line
    authenticatedShopperID.appendChild(customerObj.profile.customerNo);
    var shopperBrowser = new XML('<browser><acceptHeader></acceptHeader><userAgentHeader></userAgentHeader></browser>'); // eslint-disable-line
    if (customerObj.profile.customerNo != null && (EnableTokenizationPref) && ((preferences.tokenType == null) || !preferences.tokenType.toString().equals(WorldpayConstants.merchanttokenType))) { // eslint-disable-line
        ordershopper.appendChild(authenticatedShopperID);
    }
    ordershopper.appendChild(shopperBrowser);
    var token = new XML('<createToken tokenScope="' + preferences.tokenType.value.toLowerCase() +'"></createToken>'); // eslint-disable-line
    var tokenEventReference = new XML('<tokenEventReference></tokenEventReference>'); // eslint-disable-line
    var tokenReason = new XML('<tokenReason></tokenReason>'); // eslint-disable-line
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
    if (preferences.dstype != null && preferences.dstype == 'two3d') { // eslint-disable-line
        if (preferences.riskData != null && preferences.riskData) {
        var riskdata = new XML('<riskData> </riskData>'); // eslint-disable-line
            if (preferences.authenticationMethod.value != null && preferences.authenticationMethod) {
                var authMethod = preferences.authenticationMethod.value;
            }
        var authenticationRiskData = new XML('<authenticationRiskData authenticationMethod ="' + authMethod + '"></authenticationRiskData>'); // eslint-disable-line
            var authenticationTimestamp = new XML('<authenticationTimestamp> </authenticationTimestamp>'); // eslint-disable-line
            authenticationTimestamp.appendChild(CreateRequestHelper.createTimeStamp());
            authenticationRiskData.appendChild(authenticationTimestamp);
            var shopperAccountRiskData = new XML('<shopperAccountRiskData></shopperAccountRiskData>');// eslint-disable-line
            if (customerObj.authenticated) {
            var shopperAccountCreationDate= new XML('<shopperAccountCreationDate> </shopperAccountCreationDate>'); // eslint-disable-line
            var shopperAccountModificationDate= new XML('<shopperAccountModificationDate></shopperAccountModificationDate>'); // eslint-disable-line
                shopperAccountCreationDate.appendChild(CreateRequestHelper.createSRD(customerObj.profile.getCreationDate()));
                shopperAccountModificationDate.appendChild(CreateRequestHelper.createSRD(customerObj.profile.getLastModified()));
                shopperAccountRiskData.appendChild(shopperAccountCreationDate);
                shopperAccountRiskData.appendChild(shopperAccountModificationDate);
            }
        var transactionRiskDataGiftCardAmount = new XML('<transactionRiskDataGiftCardAmount> </transactionRiskDataGiftCardAmount>'); // eslint-disable-line
            transactionRiskDataGiftCardAmount.appendChild(CreateRequestHelper.createAmt());
            var transactionRiskData = new XML ('<transactionRiskData></transactionRiskData>'); // eslint-disable-line
            transactionRiskData.appendChild(transactionRiskDataGiftCardAmount);
            riskdata.appendChild(authenticationRiskData);
            riskdata.appendChild(shopperAccountRiskData);
            riskdata.appendChild(transactionRiskData);
            orderorder.appendChild(riskdata);
        }
        if (preferences.challengePreference.value != null && preferences.challengePreference) {
            var challengePref = preferences.challengePreference.value;
        }
        if (preferences.challengeWindowSize.value != null && preferences.challengeWindowSize) {
            var challengeWindowSize = preferences.challengeWindowSize.value;
        }
        var additional3DSData = new XML('<additional3DSData dfReferenceId ="' + session.custom.sessionID + '" challengeWindowSize="' + challengeWindowSize + '" challengePreference = "' + challengePref + '" />'); // eslint-disable-line
        orderorder.appendChild(additional3DSData);
    }
    submit.appendChild(orderorder);
    cardService.appendChild(submit);
    return cardService;
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
    createTokenRequestWOP: createTokenRequestWOP
};
