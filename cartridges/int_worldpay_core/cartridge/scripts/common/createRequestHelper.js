/** *******************************************************************************
*
* Description: Contains the functions that helps in the request object creation.
*
*
/*********************************************************************************/
var Site = require('dw/system/Site');
var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
var utils = require('*/cartridge/scripts/common/utils');

/**
 * Hook function for order content. This function is called during the xml order
 * creation. This function can be modified if other data or format is desired.
 * @param {dw.order.Basket} basket - The current basket
 * @return {string} return CDATA
 */
function createOrderContent(basket) {
    var utils = require('*/cartridge/scripts/common/utils');
    var rows = utils.tr(utils.th('Product ID') + utils.th('Product Name')
    + utils.th('Quantity') + utils.th('Price'));
    var productLineItems = basket.getAllProductLineItems().iterator();
    while (productLineItems.hasNext()) {
        var pli = productLineItems.next();
        rows += utils.tr(utils.td(pli.getProductID()) + utils.td(pli.getProductName())
       + utils.td(pli.getQuantity()) + utils.td(pli.getAdjustedPrice().toString()));
    }
    rows += utils.tr('<td colspan="4">Your payment will be handled by  Worldpay Payments Services'
      + '<br/>This name may appear on your bank statement<br/>http://www.worldpay.com'
      + '</td>');
    return utils.convert2cdata(utils.table(rows));
}

/**
 * This function is responsible for sending Plugin Tracker details in order content tag. 
 * @param {dw.order.Basket} basket - The current basket
 * @return {string} return CDATA
 */
function sendPluginTrackerDetails(basket) {
    var system = require('dw/system/System');
    var Resource = require('dw/web/Resource');
    var utils = require('*/cartridge/scripts/common/utils');
    var Site = require('dw/system/Site');
    var previousCartridgeVersion = Site.getCurrent().getCustomPreferenceValue('previousCartridgeVersion');
    var upgradeDates = Site.getCurrent().getCustomPreferenceValue('previousPluginUpgradeDates');
    var MERCHANT_ENTITY_REF = Site.getCurrent().getCustomPreferenceValue('merchantEntity');
    var MERCHANT_ID = Site.getCurrent().getCustomPreferenceValue('WorldpayMerchantCode');
    var SFRA_VERSION = Resource.msg('global.version.number', 'version', null);
    var CURRENT_WORLDPAY_CARTRIDGE_VERSION = Resource.msg('Worldpay.version', 'version', null);
    var WORLDPAY_CARTRIDGE_VERSION_USED_TILL_DATE; var UPGRADE_DATES;
    if (previousCartridgeVersion) {
        WORLDPAY_CARTRIDGE_VERSION_USED_TILL_DATE = previousCartridgeVersion.join(',');
    }
    if (upgradeDates) {
        UPGRADE_DATES = upgradeDates.join(',');
    }
    var modeSupported = system.getCompatibilityMode();
    var compMode = parseFloat(modeSupported) / 100;
    var SFRA_COMPATIBILITY_VERSION = compMode.toString();
    var rows = utils.dl(utils.dt('MERCHANT_ENTITY_REF') + utils.dt('MERCHANT_ID') + utils.dt('SFRA_VERSION') + utils.dt('SFRA_COMPATIBILITY_VERSION') + utils.dt('CURRENT_WORLDPAY_CARTRIDGE_VERSION') + utils.dt('UPGRADE_DATES') + utils.dt('WORLDPAY_CARTRIDGE_VERSION_USED_TILL_DATE'));
    rows += utils.dl(utils.dd(MERCHANT_ENTITY_REF) + utils.dd(MERCHANT_ID) + utils.dd(SFRA_VERSION) + utils.dd(SFRA_COMPATIBILITY_VERSION) + utils.dd(CURRENT_WORLDPAY_CARTRIDGE_VERSION) + utils.dd(WORLDPAY_CARTRIDGE_VERSION_USED_TILL_DATE) + utils.dd(UPGRADE_DATES));
    return utils.convert2cdata(utils.dl(rows));
}

/**
 * Hook function for order description. This function is called during the xml order
 * creation. This function can be modified if other data or format is desired.
 * @param {string} data - data
 * @return {string} return the data
 */
function createOrderDescription(data) {
    return worldpayConstants.ORDERDESCRIPTION + data;
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
 * Hook function for Payment Details. This function is called during the xml order
 * creation. This function can be modified if other data or format is desired.
 * @param {XML} requestXml - request Xml
 * @param {Object} includedPaymentMethods - included Payment Methods
 * @param {Object} excludedPaymentMethods - excluded Payment Methods
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment instrument object
 * @return {XML} returns request xml
 */
function addIncludedPaymentMethods(requestXml, includedPaymentMethods, excludedPaymentMethods, paymentInstrument) {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var worldPayPreferences = new WorldpayPreferences();
    var apmName = paymentInstrument.getPaymentMethod();
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    var preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd);
    var paymentMethodMask = new XML('<paymentMethodMask/>');
    var preferedCards = ((typeof paymentInstrument === 'undefined') || (undefined === paymentInstrument.custom.worldpayPreferredCard)) ? null : paymentInstrument.custom.worldpayPreferredCard;
    var storedCredentials = new XML('<storedCredentials usage="FIRST"/>');
    var enableStoredCredentials = preferences.enableStoredCredentials;
    if (enableStoredCredentials != null &&
        (enableStoredCredentials && paymentInstrument.custom.wpTokenRequested)) {
            paymentMethodMask.appendChild(storedCredentials);
    }
    if (!preferedCards && includedPaymentMethods && includedPaymentMethods.length > 0) {
        for (var i = 0; i < includedPaymentMethods.length; i++) {
            paymentMethodMask.appendChild(new XML('<include code="' + includedPaymentMethods[i] + '" />'));
        }
    } else if (preferedCards) {
        paymentMethodMask.appendChild(new XML('<include code="' + preferedCards + '" />'));
    } else {
        paymentMethodMask.appendChild(new XML('<include code="ALL" />'));
    }
    if (excludedPaymentMethods && excludedPaymentMethods.length > 0) {
        for (var j = 0; j < excludedPaymentMethods.length; j++) {
            paymentMethodMask.appendChild(new XML('<exclude code="' + excludedPaymentMethods[j] + '" />'));
        }
    }
    requestXml.submit.order.paymentMethodMask = paymentMethodMask;
    return requestXml;
}

/**
 * Hook function for Shipping Address details. This function is called during the xml order
 * creation. This function can be modified if other data or format is desired.
 * It supprts the Address Format-1 i.e. First Name, Last Name, Street, State, Postal Code, City, Country Code,Telephone Number.
 * @param {XML} requestXml - request Xml
 * @param {Object} shippingAddress - shipping Address
 * @return {XML} returns request xml
 */
function addShippingAddressDetails(requestXml, shippingAddress) {
    requestXml.submit.order.shippingAddress.address.firstName = shippingAddress.firstName;
    requestXml.submit.order.shippingAddress.address.lastName = shippingAddress.lastName;
    requestXml.submit.order.shippingAddress.address.street = shippingAddress.address1;
    requestXml.submit.order.shippingAddress.address.postalCode = shippingAddress.postalCode;
    requestXml.submit.order.shippingAddress.address.city = shippingAddress.city;
    requestXml.submit.order.shippingAddress.address.state = shippingAddress.stateCode;
    requestXml.submit.order.shippingAddress.address.countryCode = shippingAddress.countryCode.value.toString().toUpperCase();
    requestXml.submit.order.shippingAddress.address.telephoneNumber = shippingAddress.phone;
    return requestXml;
}

/**
 * Hook function for Shipping Address details. This function is called during the xml order
 * creation. This function can be modified if other data or format is desired.
 * It supprts the Address Format - 2  i.e. First Name, Last Name, Address1, Postal Code, City, Country Code,Telephone Number.
 * @param {XML} requestXml - request Xml
 * @param {Object} shippingAddress - shipping Address
 * @return {XML} returns request xml
 */
function addShippingAddressDetailsFormat2(requestXml, shippingAddress) {
    requestXml.submit.order.shippingAddress.address.firstName = shippingAddress.firstName;
    requestXml.submit.order.shippingAddress.address.lastName = shippingAddress.lastName;
    requestXml.submit.order.shippingAddress.address.address1 = shippingAddress.address1;
    requestXml.submit.order.shippingAddress.address.postalCode = shippingAddress.postalCode;
    requestXml.submit.order.shippingAddress.address.city = shippingAddress.city;
    requestXml.submit.order.shippingAddress.address.countryCode = shippingAddress.countryCode.value.toString().toUpperCase();
    requestXml.submit.order.shippingAddress.address.telephoneNumber = shippingAddress.phone;
    return requestXml;
}

/**
 * Hook function for Billing Address details. This function is called during the xml order
 * creation. This function can be modified if other data or format is desired.
 * It supprts the Address Format-1 i.e. First Name, Last Name, Address1, Postal Code, City, State, Country Code,Telephone Number.
 * @param {XML} requestXml - request Xml
 * @param {Object} billingAddress - billing Address
 * @return {XML} returns request xml
 */
function addBillingAddressDetails(requestXml, billingAddress) {
    requestXml.submit.order.billingAddress.address.firstName = billingAddress.firstName;
    requestXml.submit.order.billingAddress.address.lastName = billingAddress.lastName;
    requestXml.submit.order.billingAddress.address.street = billingAddress.address1;
    requestXml.submit.order.billingAddress.address.postalCode = billingAddress.postalCode;
    requestXml.submit.order.billingAddress.address.city = billingAddress.city;
    requestXml.submit.order.billingAddress.address.state = billingAddress.stateCode;
    requestXml.submit.order.billingAddress.address.countryCode = billingAddress.countryCode.value.toString().toUpperCase();
    requestXml.submit.order.billingAddress.address.telephoneNumber = billingAddress.phone;
    return requestXml;
}

/**
 * Hook function for Billing Address details. This function is called during the xml order
 * creation. This function can be modified if other data or format is desired.
 * It supprts the Address Format-1 i.e. First Name, Last Name, Address1, Postal Code, City, State, Country Code,Telephone Number.
 * @param {XML} requestXml - request Xml
 * @param {Object} billingAddress - billing Address
 * @return {XML} returns request xml
 */
function addBillingAddressDetailsFormat2(requestXml, billingAddress) {
    requestXml.submit.order.billingAddress.address.firstName = billingAddress.firstName;
    requestXml.submit.order.billingAddress.address.lastName = billingAddress.lastName;
    requestXml.submit.order.billingAddress.address.address1 = billingAddress.address1;
    requestXml.submit.order.billingAddress.address.postalCode = billingAddress.postalCode;
    requestXml.submit.order.billingAddress.address.city = billingAddress.city;
    requestXml.submit.order.billingAddress.address.state = billingAddress.stateCode;
    requestXml.submit.order.billingAddress.address.countryCode = billingAddress.countryCode.value.toString().toUpperCase();
    requestXml.submit.order.billingAddress.address.telephoneNumber = billingAddress.phone;
    return requestXml;
}

/**
 * Hook function to add Shopper details. This function is called during the xml order
 * creation. This is primarily required for all apms other that iDEAL and PAYPAL.
 * This function can be modified if other data or format is desired.
 * @param {string} apmName - apm Name
 * @param {XML} requestXml - request Xml
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {string} apmType - apm Type
 * @param {dw.customer.Customer} currentCustomer - the associated Customer object
 * @param {string} includeShopperId - shopper ID
 * @return {XML} returns request xml
 */
function addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, includeShopperId) {
    if (apmName.equals(worldpayConstants.GIROPAY) || apmName.equals(worldpayConstants.GOOGLEPAY)) {
        var shopperXML = new XML('<shopper><shopperEmailAddress>' + orderObj.getCustomerEmail() + '</shopperEmailAddress><browser><acceptHeader>' +
            request.getHttpHeaders().get(worldpayConstants.ACCEPT) + '</acceptHeader><userAgentHeader>' +
            request.getHttpUserAgent() + '</userAgentHeader></browser></shopper>');
        requestXml.submit.order.appendChild(shopperXML);
    } else if (apmName.equals(worldpayConstants.WECHATPAY) && apmType.equalsIgnoreCase(worldpayConstants.DIRECT)) {
        requestXml.submit.order.shopper.shopperEmailAddress = orderObj.getCustomerEmail();
        if (utils.isDesktopDevice()) {
            var browserXML = new XML('<browser deviceType="0" />');
            requestXml.submit.order.shopper.appendChild(browserXML);
        }
    } else {
        requestXml.submit.order.shopper.shopperEmailAddress = orderObj.getCustomerEmail();
        if (currentCustomer.registered && apmName.equals(worldpayConstants.WORLDPAY) && includeShopperId) {
            requestXml.submit.order.shopper.authenticatedShopperID = currentCustomer.profile.customerNo;
        }
    }

  // The result of request.getSession().getSessionID() in Demandware is not NMTOKEN.
  // use the createSessionID() function to cutomize the session ID
    if (apmType.equalsIgnoreCase(worldpayConstants.DIRECT) && !apmName.equals(worldpayConstants.KLARNA) && !apmName.equals(worldpayConstants.WECHATPAY)) {
        var sessionXML = new XML('<session shopperIPAddress="' + request.getHttpRemoteAddress() + '" id="' + createSessionID(orderObj.orderNo) + '" />');
        requestXml.submit.order.shopper.appendChild(sessionXML);
    }
    return requestXml;
}

/**
 * Hook function to add Installation details. This function is called during the xml order
 * creation. This is primarily required for all APM's and CC redirect .
 * @param {XML} requestXml - request Xml
 * @param {string} installationID - installationID
 * @return {XML} returns request xml
 */
function addInstallationDetails(requestXml, installationID) {
    requestXml.submit.order.@installationId = installationID;
    return requestXml;
}

/**
 * Hook function to add contact details
 * @param {XML} requestXml - request Xml
 * @return {XML} returns request xml
 */
function addContactDetails(requestXml) {
    var Site = require('dw/system/Site');
    requestXml.submit.order.@fixContact = Site.getCurrent().getCustomPreferenceValue("WorldpayFixContact");
    requestXml.submit.order.@hideContact = Site.getCurrent().getCustomPreferenceValue("WorldpayHideContact");
    return requestXml;
}

/**
 * Hook function to add General Order details. This function is called during the xml order
 * creation. This is primarily required for all APM's and CC redirect .
 * @param {XML} requestXml - request Xml
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {Object} preferences - the associated worldpay preferences
 * @return {XML} returns request xml
 */
function addGeneralDetails(requestXml, orderObj, preferences, apmName) {
    requestXml.@merchantCode = preferences.merchantCode;
    requestXml.submit.order.@orderCode = orderObj.orderNo;
    var isStatementNarrativeEnabled = Site.current.getCustomPreferenceValue('EnableStatementNarrative');
    if (apmName.equals(worldpayConstants.IDEAL) && isStatementNarrativeEnabled) {
        addStatementNarrativeForIdeal(requestXml, orderObj.orderNo)
    } else if (apmName.equals(worldpayConstants.GOOGLEPAY) && preferences.dstype && preferences.dstype.value === 'two3d' && preferences.googlePayEnvironment.toUpperCase() === 'TEST') {
        if (Site.getCurrent().getCustomPreferenceValue("googlePayTest3DSMagicValue")) {
            requestXml.submit.order.description = Site.getCurrent().getCustomPreferenceValue("googlePayTest3DSMagicValue");
        } else {
            requestXml.submit.order.description = createOrderDescription(orderObj.orderNo);
        }
    } else {
        requestXml.submit.order.description = createOrderDescription(orderObj.orderNo);
    }
    return requestXml;
}

/**
 * Adding statement narrative as part of the description tag for IDEAL
 * @param {requestXml} requestXml - requestXml
 * @param {orderNumber} orderNumber - order Number
 */
function addStatementNarrativeForIdeal(requestXml, orderNumber) {
    var server = require('server');
    var paymentForm = server.forms.getForm('billing');
    var statementNarrativeValue = paymentForm.billingUserFields.statementNarrative && !empty(paymentForm.billingUserFields.statementNarrative.value) ? paymentForm.billingUserFields.statementNarrative.value : createOrderDescription(orderNumber);
    var description = new XML('<description></description>');
    description.appendChild(statementNarrativeValue);
    if (statementNarrativeValue) {
        requestXml.submit.order.appendChild(description);
    }
}

/**
 * Hook function to add Shipment Amount details. This function is called during the xml order
 * creation. This is primarily required for all APM's and CC redirect .
 * @param {XML} requestXml - request Xml
 * @param {number} paymentAmount - payment Amount
 * @param {Object} preferences - the associated worldpay preferences
 * @return {XML} returns request xml
 */
function addShipmentAmountDetails(apmName, requestXml, paymentAmount, preferences) {
    var totalprice = paymentAmount;

    if (totalprice.available) {
    // Multiply price with 10 power exponent in order to remove the decimal digits or add if not existing
        var tempPrice = totalprice.getValue();
        tempPrice =
        (tempPrice.toFixed(2) * (Math.pow(10, preferences.currencyExponent))).toFixed(0);
        requestXml.submit.order.amount.@value = tempPrice.toString();

    // ISO 4217
        requestXml.submit.order.amount.@currencyCode = totalprice.getCurrencyCode();
        requestXml.submit.order.amount.@exponent = preferences.currencyExponent;
    } else {
        return null;
    }
    return requestXml;
}

/**
 * Hook function to add Shipment Amount details. This function is called during the xml order
 * creation. This is primarily required for all APM's and CC redirect .
 * @param {XML} requestXml - request Xml
 * @param {number} paymentAmount - payment Amount
 * @param {Object} preferences - the associated worldpay preferences
 * @return {XML} returns request xml
 */
function addShipmentAmountDetailsForKlarna(klarnabillingCountry, requestXml, paymentAmount, preferences) {
    var totalprice = paymentAmount;

    if (totalprice.available) {
    // Multiply price with 10 power exponent in order to remove the decimal digits or add if not existing
        var tempPrice = totalprice.getValue();
        tempPrice =
      (tempPrice.toFixed(2) * (Math.pow(10, preferences.currencyExponent))).toFixed(0);
    requestXml.submit.order.amount.@value = tempPrice.toString();

    // ISO 4217
        var klarnaCountries = require('*/cartridge/config/klarnaCountries.json');
        requestXml.submit.order.amount.@currencyCode = klarnaCountries[klarnabillingCountry].currency;
        requestXml.submit.order.amount.@exponent = preferences.currencyExponent;
    } else {
        return null;
      }
    return requestXml;
}

/**
 * Hook function to add Token details. This function is called during the xml order
 * creation. This is primarily required for all APM's and CC redirect .
 * @param {XML} requestXml - request Xml
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {string} tokenReason - token Reason
 * @return {XML} returns request xml
 */
function addTokenDetails(requestXml, orderObj, tokenReason) {
    var tokenType = Site.getCurrent().getCustomPreferenceValue('tokenType');
    if (tokenType!=null && tokenType.toString().equals(worldpayConstants.merchanttokenType)) {
        var token = new XML('<createToken tokenScope="merchant"></createToken>');
    } else {
         var token = new XML('<createToken tokenScope="shopper"></createToken>');
      }
        requestXml.submit.order.createToken = token;
        requestXml.submit.order.createToken.tokenEventReference = orderObj.orderNo;
        requestXml.submit.order.createToken.tokenReason = tokenReason;
        return requestXml;
}

/**
 *  Adds credit card details in the token update request .
 * @param {string} expirationMonth - card expiry month
 * @param {string} expirationYear - card expiry year
 * @param {string} cardHolderName - name on card
 * @param {XML} address - returns card details as XML
 * @returns 
 */
 function addCardDetails(expirationMonth, expirationYear, cardHolderName, address) {
    var cardDetails = new XML('<cardDetails></cardDetails>');
    cardDetails.expiryDate.date = new XML('<date month="'+expirationMonth+'" year="'+expirationYear+'"/>');
    cardDetails.cardHolderName = cardHolderName;
    if (address) {
        cardDetails.cardAddress.address.firstName = address.firstName;
        cardDetails.cardAddress.address.address1 = address.address1;
        cardDetails.cardAddress.address.address2 = address.address2;
        cardDetails.cardAddress.address.address3 = address.address3;
        cardDetails.cardAddress.address.postalCode = address.postalCode;
        cardDetails.cardAddress.address.city = address.city;
        cardDetails.cardAddress.address.countryCode = address.countryCode;
    }
    return cardDetails;
}


/**
 * Hook function to add Payment details. This function is called during the xml order
 * creation. This is primarily required for all APM's and CC redirect .
 * @param {string} apmName - apm Name
 * @param {Object} preferences - preferences object
 * @param {XML} requestXml - request Xml
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment instrument object
 * @return {XML} returns request xml
 */
function getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument) {
    var URLUtils = require('dw/web/URLUtils');
    var str = '<' + apmName + '/>';
    if (apmName.equalsIgnoreCase(worldpayConstants.ELV)) {
        str = '<SEPA_DIRECT_DEBIT-SSL/>';
    } else if(apmName.equals(worldpayConstants.KLARNA)) {
        str = '<' + paymentInstrument.custom.wpKlarnaPaymentMethod + '/>';
    }
    var orderNo = orderObj.orderNo;
    var token = orderObj.orderToken;
    var payment = new XML(str);
    if (apmName.equals(worldpayConstants.IDEAL)) {
        payment.@shopperBankCode = paymentInstrument.custom.bank;
    } else if (!apmName.equals(worldpayConstants.PAYPAL) && !apmName.equals(worldpayConstants.GOOGLEPAY) && !apmName.equals(worldpayConstants.GIROPAY) && !apmName.equalsIgnoreCase(worldpayConstants.ELV) && !apmName.equalsIgnoreCase(worldpayConstants.WECHATPAY)) {
        payment.@shopperCountryCode = orderObj.getBillingAddress().countryCode.value.toString().toUpperCase();
    }

    if (apmName.equals(worldpayConstants.KLARNASLICEIT) || apmName.equals(worldpayConstants.KLARNAPAYLATER) || apmName.equals(worldpayConstants.KLARNAPAYNOW)) {
        var klarnaCountries = require('*/cartridge/config/klarnaCountries.json');
        payment.@locale = klarnaCountries[orderObj.getBillingAddress().countryCode.value.toString().toUpperCase()].shopperLocale;
    }
    
    if (!apmName.equalsIgnoreCase(worldpayConstants.ELV) && !apmName.equals(worldpayConstants.GOOGLEPAY) && !apmName.equalsIgnoreCase(worldpayConstants.WECHATPAY)) {
        payment.successURL = URLUtils.https('COPlaceOrder-Submit', worldpayConstants.ORDERID, orderNo, worldpayConstants.ORDERTOKEN, token, worldpayConstants.PAYMENTSTATUS,
            worldpayConstants.AUTHORIZED).toString();
    }
    if (apmName.equals(worldpayConstants.IDEAL) || apmName.equals(worldpayConstants.PAYPAL) || apmName.equals(worldpayConstants.GIROPAY)) {
        payment.successURL = URLUtils.https('COPlaceOrder-Submit', worldpayConstants.ORDERID, orderNo, worldpayConstants.ORDERTOKEN, token, worldpayConstants.PAYMENTSTATUS,
            worldpayConstants.AUTHORIZED).toString();
        payment.failureURL = URLUtils.https('COPlaceOrder-Submit', worldpayConstants.ORDERID, orderNo, worldpayConstants.ORDERTOKEN, token).toString();
    }
    if (!apmName.equalsIgnoreCase(worldpayConstants.ELV) && !apmName.equalsIgnoreCase(worldpayConstants.WECHATPAY) && !apmName.equals(worldpayConstants.GOOGLEPAY)) {
        payment.cancelURL = URLUtils.https('COPlaceOrder-Submit', worldpayConstants.ORDERID, orderNo, worldpayConstants.ORDERTOKEN, token).toString();
    }
    if (!apmName.equalsIgnoreCase(worldpayConstants.PAYPAL) && !apmName.equalsIgnoreCase(worldpayConstants.GIROPAY) && !apmName.equalsIgnoreCase(worldpayConstants.ELV) &&
        !apmName.equalsIgnoreCase(worldpayConstants.WECHATPAY) && !apmName.equals(worldpayConstants.GOOGLEPAY)) {
        payment.pendingURL = URLUtils.https('COPlaceOrder-Submit', worldpayConstants.ORDERID, orderNo, worldpayConstants.ORDERTOKEN, token, worldpayConstants.PAYMENTSTATUS,
            worldpayConstants.PENDING).toString();
    }

  // CODE FOR GIROPAY
    if (apmName.equals(worldpayConstants.GIROPAY)) {
        payment.swiftCode = paymentInstrument.custom.bankCode;
    }
    if (apmName.equals(worldpayConstants.GOOGLEPAY)) {
        payment.protocolVersion = paymentInstrument.custom.gpayprotocolVersion;
        payment.signature = paymentInstrument.custom.gpaySignature;
        payment.signedMessage = paymentInstrument.custom.gpaysignedMessage;

    }

    if (apmName.equals(worldpayConstants.ELV)) {
        var Iban = paymentInstrument.custom.iban;
        var accountHolderName = paymentInstrument.custom.accountHolderName;
        var bankAccountSEPA = new XML('<bankAccount-SEPA/>');
        bankAccountSEPA.iban = Iban;
        bankAccountSEPA.accountHolderName = accountHolderName;
        payment.bankAccountSEPA = bankAccountSEPA;
    }

    if (apmName.equals(worldpayConstants.KLARNASLICEIT) || apmName.equals(worldpayConstants.KLARNAPAYLATER) || apmName.equals(worldpayConstants.KLARNAPAYNOW)) {
        payment.failureURL = URLUtils.https('COPlaceOrder-Submit', worldpayConstants.ORDERID, orderNo, worldpayConstants.ORDERTOKEN, token).toString();
    }

    var paymentDetails = new XML(worldpayConstants.XMLPAYMENTDETAILS);
    paymentDetails.appendChild(payment);

    if (apmName.equals(worldpayConstants.GIROPAY) || (apmName.equals(worldpayConstants.GOOGLEPAY) && preferences.dstype && preferences.dstype.value ==='two3d')) {
        var sessionXML = new XML('<session shopperIPAddress="' + request.getHttpRemoteAddress() + '" id="' + createSessionID(orderNo) + '" />');
        paymentDetails.appendChild(sessionXML);
    }
     
    requestXml.submit.order.appendChild(paymentDetails);
    return requestXml;
}

/**
 * Appends the mandate info
 * @param {XML} requestXml - request Xml
 * @param {dw.order.PaymentInstrument} paymentInstrument - payment instrument object
 * @return {XML} returns request xml
 */
function appendMandateInfo(requestXml, paymentInstrument) {
    var mandateType = paymentInstrument.custom.elvMandateType;
    var mandateID = paymentInstrument.custom.elvMandateID;
    var mandate = new XML('<mandate><mandateType>' + mandateType + '</mandateType><mandateId>' + mandateID + '</mandateId></mandate>');
    requestXml.submit.order.appendChild(mandate);
    return requestXml;
}

/**
 * Appends the order details
 * @param {XML} requestXml - request Xml
 * @param {dw.order.Order} orderObj - Current users's Order
 * @return {XML} returns request xml
 */
function getOrderDetails(requestXml,orderObj) {
    var orderLines = new XML(<orderLines/>);
    var orderTaxAmount = 0;
    var URLUtils = require('dw/web/URLUtils');
    orderLines.orderTaxAmount = (orderObj.totalTax.value*Math.pow(10,2)).toFixed();
    orderLines.termsURL = URLUtils.https('Page-Show', 'cid', 'ca-klarna-terms-and-conditions').toString();

    //Construction of lineitem tags
    var lineItems = orderObj.getAllLineItems();
    var lineItemItr = lineItems.iterator();
    while (lineItemItr.hasNext()) {
        var ali = lineItemItr.next();
            var lineItem = new XML('<lineItem/>');
            if (ali instanceof dw.order.ShippingLineItem || ali instanceof dw.order.ProductShippingLineItem) {
                var shippingFee = new XML(<shippingFee/>);
                lineItem.appendChild(shippingFee);

                var reference = new XML('<reference></reference>');
                reference.appendChild('Shipping Fee');
                lineItem.appendChild(reference);

                var name = new XML('<name></name>');
                name.appendChild('Shipping Fee');
                lineItem.appendChild(name);

                var quantity = new XML('<quantity></quantity>');
                quantity.appendChild('1');
                lineItem.appendChild(quantity);

                var quantityUnit = new XML('<quantityUnit></quantityUnit>');//'length check of 10';
                quantityUnit.appendChild('Shipping');
                lineItem.appendChild(quantityUnit);

                var unitPrice = new XML('<unitPrice></unitPrice>'); //2 to be site prefernce
                unitPrice.appendChild((Math.pow(10,2)*ali.adjustedPrice.value).toFixed());// total amount = adujusted price
                lineItem.appendChild(unitPrice);

                var taxRate = new XML('<taxRate></taxRate>');
                taxRate.appendChild((Math.pow(10,4)*ali.getTaxRate()).toFixed());
                lineItem.appendChild(taxRate);

                var totalAmount = new XML('<totalAmount></totalAmount>');
                totalAmount.appendChild((Math.pow(10,2)*ali.getGrossPrice().value).toFixed());
                lineItem.appendChild(totalAmount);

                var totalTaxAmount = new XML('<totalTaxAmount></totalTaxAmount>');
                totalTaxAmount.appendChild((Math.pow(10,2)*ali.getTax().value).toFixed());
                lineItem.appendChild(totalTaxAmount);

            } else {
                var lineItemQuantityValue;
                    if (ali instanceof dw.order.GiftCertificateLineItem) {
                        var physical = new XML(<physical/>);
                        lineItem.appendChild(physical);

                        var reference = new XML('<reference></reference>');
                        reference.appendChild(ali.giftCertificateID);
                        lineItem.appendChild(reference);

                        var name = new XML('<name></name>');
                        name.appendChild('Gift Certificate');
                        lineItem.appendChild(name);

                        var quantity = new XML('<quantity></quantity>');
                        quantity.appendChild('1');
                        lineItem.appendChild(quantity);

                        var quantityUnit = new XML('<quantityUnit></quantityUnit>'); //'length check of 10';
                        quantityUnit.appendChild('GiftCert');
                        lineItem.appendChild(quantityUnit);
                        lineItemQuantityValue = 1;
                    }else if (ali instanceof dw.order.PriceAdjustment) {
                        var discount = new XML(<discount/>);
                        lineItem.appendChild(discount);

                        var reference = new XML('<reference></reference>');
                        reference.appendChild('Discount');
                        lineItem.appendChild(reference);

                        var name = new XML('<name></name>');
                        name.appendChild('Discount');
                        lineItem.appendChild(name);

                        var quantity = new XML('<quantity></quantity>');
                        quantity.appendChild('1');
                        lineItem.appendChild(quantity);

                        var quantityUnit = new XML('<quantityUnit></quantityUnit>'); //'length check of 10';
                        quantityUnit.appendChild('Discount');
                        lineItem.appendChild(quantityUnit);
                        lineItemQuantityValue = 1;
                    } else {//ProductLineItem
                        var physical = new XML(<physical/>);
                        lineItem.appendChild(physical);

                        var reference = new XML('<reference></reference>');
                        reference.appendChild(ali.productID);// length of 255 characters
                        lineItem.appendChild(reference);

                        var name = new XML('<name></name>');
                        name.appendChild(ali.productName);// length of 255 characters
                        lineItem.appendChild(name);

                        var quantity = new XML('<quantity></quantity>');
                        quantity.appendChild((ali.quantityValue).toFixed());
                        lineItem.appendChild(quantity);

                        var quantityUnit = new XML('<quantityUnit></quantityUnit>'); //'length check of 10';
                        quantityUnit.appendChild(ali.getQuantity().getUnit()?ali.getQuantity().getUnit():'unit');
                        lineItem.appendChild(quantityUnit);
                        lineItemQuantityValue = ali.quantityValue;
                    }
                var unitPrice = new XML('<unitPrice></unitPrice>'); //2 to be site prefernce
                unitPrice.appendChild((Math.pow(10,2)*(ali.getPriceValue()/lineItemQuantityValue)).toFixed());
                lineItem.appendChild(unitPrice);

                var taxRate = new XML('<taxRate></taxRate>');
                taxRate.appendChild((Math.pow(10,4)*ali.getTaxRate()).toFixed());
                lineItem.appendChild(taxRate);

                var totalAmount = new XML('<totalAmount></totalAmount>');
                totalAmount.appendChild((Math.pow(10,2)*ali.getGrossPrice().value).toFixed());
                lineItem.appendChild(totalAmount);

                var totalTaxAmount = new XML('<totalTaxAmount></totalTaxAmount>');
                totalTaxAmount.appendChild((Math.pow(10,2)*ali.getTax().value).toFixed());
                lineItem.appendChild(totalTaxAmount);

                if (ali instanceof dw.order.ProductLineItem) {
                    var totalDiscount = 0;
                    for each (var priceAdjustment in ali.getPriceAdjustments()) {
                        totalDiscount += priceAdjustment.grossPrice.value;
                    }

                    var totalDiscountAmount = new XML('<totalDiscountAmount></totalDiscountAmount>');
                    totalDiscountAmount.appendChild((Math.pow(10,2)*totalDiscount*-1).toFixed());
                    lineItem.appendChild(totalDiscountAmount);

                    var productURL = new XML('<productURL></productURL>');
                    productURL.appendChild(URLUtils.url('Product-Show', 'pid', ali.productID).abs());
                    lineItem.appendChild(productURL);

                    var ProductImages = require('*/cartridge/models/product/productImages.js');
                    var productImage = new ProductImages(ali.product, {"types" : ["large"], "quantity" : "single"});
                    if (!empty(productImage) && productImage.large && productImage.large.length) {
                        var imageURL = new XML('<imageURL></imageURL>');
                        imageURL.appendChild(productImage.large[0].absURL);
                        lineItem.appendChild(imageURL);
                    }
                }
            }
            orderLines.appendChild(lineItem);
    }//Outer while loop
    requestXml.submit.order.orderLines = orderLines;
    return requestXml;
}

/**
 * Appends the order details
 * @param {XML} requestXml - request Xml
 * @param {dw.order.Order} orderObj - Current users's Order
 * @return {XML} returns request xml
 */
function getKlarnaOrderDetails(requestXml, orderObj) {
    var orderLines = new XML(<orderLines/>);
    var orderTaxAmount = 0;
    var URLUtils = require('dw/web/URLUtils');
    orderLines.orderTaxAmount = (orderObj.totalTax.value*Math.pow(10,2)).toFixed();
    orderLines.termsURL = URLUtils.https('Page-Show', 'cid', 'ca-klarna-terms-and-conditions').toString();

    //Construction of lineitem tags
    var lineItems = orderObj.getAllLineItems();
    var lineItemItr = lineItems.iterator();
    while (lineItemItr.hasNext()) {
        var ali = lineItemItr.next();
        var lineItem = new XML('<lineItem/>');
        if (ali instanceof dw.order.ShippingLineItem || ali instanceof dw.order.ProductShippingLineItem) {
            var shippingFee = new XML(<shippingFee/>);
            lineItem.appendChild(shippingFee);

            var reference = new XML('<reference></reference>');
            reference.appendChild('Shipping Fee');
            lineItem.appendChild(reference);

            var name = new XML('<name></name>');
            name.appendChild('Shipping Fee');
            lineItem.appendChild(name);

            var quantity = new XML('<quantity></quantity>');
            quantity.appendChild('1');
            lineItem.appendChild(quantity);

            var quantityUnit = new XML('<quantityUnit></quantityUnit>');
            quantityUnit.appendChild('Shipping');
            lineItem.appendChild(quantityUnit);

            var unitPrice = new XML('<unitPrice></unitPrice>');
            unitPrice.appendChild((Math.pow(10,2)*ali.adjustedPrice.value).toFixed());
            lineItem.appendChild(unitPrice);

            var taxRate = new XML('<taxRate></taxRate>');
            taxRate.appendChild((Math.pow(10,4)*ali.getTaxRate()).toFixed());
            lineItem.appendChild(taxRate);

            var totalAmount = new XML('<totalAmount></totalAmount>');
            totalAmount.appendChild((Math.pow(10,2)*ali.getGrossPrice().value).toFixed());
            lineItem.appendChild(totalAmount);

            var totalTaxAmount = new XML('<totalTaxAmount></totalTaxAmount>');
            totalTaxAmount.appendChild((Math.pow(10,2)*ali.getTax().value).toFixed());
            lineItem.appendChild(totalTaxAmount);

        } else {
            var lineItemQuantityValue;
            if (ali instanceof dw.order.GiftCertificateLineItem) {
                var physical = new XML(<physical/>);
                lineItem.appendChild(physical);

                var reference = new XML('<reference></reference>');
                reference.appendChild(ali.giftCertificateID);
                lineItem.appendChild(reference);

                var name = new XML('<name></name>');
                name.appendChild('Gift Certificate');
                lineItem.appendChild(name);

                var quantity = new XML('<quantity></quantity>');
                quantity.appendChild('1');
                lineItem.appendChild(quantity);

                var quantityUnit = new XML('<quantityUnit></quantityUnit>');
                quantityUnit.appendChild('GiftCert');
                lineItem.appendChild(quantityUnit);
                lineItemQuantityValue = 1;
            } else if (ali instanceof dw.order.PriceAdjustment) {
                var discount = new XML(<discount/>);
                lineItem.appendChild(discount);

                var reference = new XML('<reference></reference>');
                reference.appendChild('Discount');
                lineItem.appendChild(reference);

                var name = new XML('<name></name>');
                name.appendChild('Discount');
                lineItem.appendChild(name);

                var quantity = new XML('<quantity></quantity>');
                quantity.appendChild('1');
                lineItem.appendChild(quantity);

                var quantityUnit = new XML('<quantityUnit></quantityUnit>');
                quantityUnit.appendChild('Discount');
                lineItem.appendChild(quantityUnit);
                lineItemQuantityValue = 1;
            } else {
                var physical = new XML(<physical/>);
                lineItem.appendChild(physical);

                var reference = new XML('<reference></reference>');
                reference.appendChild(ali.productID);
                lineItem.appendChild(reference);

                var name = new XML('<name></name>');
                name.appendChild(ali.productName);
                lineItem.appendChild(name);

                var quantity = new XML('<quantity></quantity>');
                quantity.appendChild((ali.quantityValue).toFixed());
                lineItem.appendChild(quantity);

                var quantityUnit = new XML('<quantityUnit></quantityUnit>');
                quantityUnit.appendChild(ali.getQuantity().getUnit()?ali.getQuantity().getUnit():'unit');
                lineItem.appendChild(quantityUnit);
                lineItemQuantityValue = ali.quantityValue;
            }
            var unitPrice = new XML('<unitPrice></unitPrice>');
            unitPrice.appendChild((Math.pow(10,2)*(ali.getPriceValue()/lineItemQuantityValue)).toFixed());
            lineItem.appendChild(unitPrice);

            var taxRate = new XML('<taxRate></taxRate>');
            taxRate.appendChild((Math.pow(10,4)*ali.getTaxRate()).toFixed());
            lineItem.appendChild(taxRate);

            var totalAmount = new XML('<totalAmount></totalAmount>');
            totalAmount.appendChild((Math.pow(10,2)*ali.getGrossPrice().value).toFixed());
            lineItem.appendChild(totalAmount);

            var totalTaxAmount = new XML('<totalTaxAmount></totalTaxAmount>');
            totalTaxAmount.appendChild((Math.pow(10,2)*ali.getTax().value).toFixed());
            lineItem.appendChild(totalTaxAmount);

            if (ali instanceof dw.order.ProductLineItem) {
                var totalDiscount = 0;
                for each (var priceAdjustment in ali.getPriceAdjustments()) {
                    totalDiscount += priceAdjustment.grossPrice.value;
                }

                var totalDiscountAmount = new XML('<totalDiscountAmount></totalDiscountAmount>');
                totalDiscountAmount.appendChild((Math.pow(10,2)*totalDiscount*-1).toFixed());
                lineItem.appendChild(totalDiscountAmount);

            }
        }
        orderLines.appendChild(lineItem);
    }
    return orderLines;
}


/**
 * add dynamic interaction type for moto
 * @param {XML} requestXml - request Xml
 * @return {XML} returns complete xml
 */
function addDynamicInteractionType(requestXml) {
    var dynamicmoto = new XML('<dynamicInteractionType type="MOTO"/>');
    requestXml.submit.order.appendChild(dynamicmoto);
    return requestXml;
}

/**
 * get complete XML
 * @param {XML} requestXml - request Xml
 * @return {XML} returns complete xml
 */
function getCompleteXML(requestXml) {
    var output = worldpayConstants.XMLHEADER + requestXml;
    return output;
}

function createTimeStamp() {
    var currentDate = new Date();
    var date = currentDate.getDate();
    var month = currentDate.getMonth();
    var monthr=(month+1);
    var year = currentDate.getFullYear();
    var hour=currentDate.getHours();
    var min=currentDate.getHours();
    var sec=currentDate.getSeconds();
    var format= new XML('<date second ="'+sec+'" minute="'+min+'" hour ="'+hour+'" dayOfMonth ="'+date+'" month ="'+monthr+'"  year ="'+year+'"/>');
    return format;
}

function createSRD(currentDate) {
    if (customer.isAuthenticated()) {
    var date = currentDate.getDate();
    var month = currentDate.getMonth();
    var monthr=(month+1);
    var year = currentDate.getFullYear();
    var format= new XML('<date dayOfMonth ="'+date+'" month ="'+monthr+'"  year ="'+year+'"/>');
    return format;
    }
}
function createAmt() {
    var format= new XML('<amount value="1" currencyCode="EUR" exponent="2"/>');
    return format;
}
function getACHPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument) {
    var paymentDetails = new XML(worldpayConstants.XMLPAYMENTDETAILS);
    var str = '<ACH_DIRECT_DEBIT-SSL></ACH_DIRECT_DEBIT-SSL>';

    paymentDetails.appendChild(str);

    var echeckSale = new XML(worldpayConstants.ECHECKSALE);
    paymentDetails.appendChild(echeckSale);
    var billingAddress = orderObj.billingAddress;
    billingAddress = addACHBillingAddressDetails(echeckSale, billingAddress,paymentInstrument);
    requestXml.submit.order.paymentDetails["ACH_DIRECT_DEBIT-SSL"].billingAddress =  billingAddress;
    requestXml.submit.order.paymentDetails["ACH_DIRECT_DEBIT-SSL"].echeckSale.bankAccountType = paymentInstrument.custom.achAccountType;
    requestXml.submit.order.paymentDetails["ACH_DIRECT_DEBIT-SSL"].echeckSale.accountNumber = paymentInstrument.bankAccountNumber;;
    //achRoutingNumber min 8 & max 9
    requestXml.submit.order.paymentDetails["ACH_DIRECT_DEBIT-SSL"].echeckSale.routingNumber = paymentInstrument.bankRoutingNumber;
    if (paymentInstrument.custom.achCheckNumber) {
    requestXml.submit.order.paymentDetails["ACH_DIRECT_DEBIT-SSL"].echeckSale.checkNumber = paymentInstrument.custom.achCheckNumber;
    }
    addStatementNarrative(requestXml);
    return requestXml;
}

/**
 * This is generic method attaches billing address to desired tag
 * @param {string} element
 * @param {Object} billingAddress
 * @return {object} returns decorated object
 */
function addACHBillingAddressDetails (element, billingAddress, paymentInstrument) {
    element.billingAddress.address.firstName = billingAddress.firstName;
    element.billingAddress.address.lastName = billingAddress.lastName;
    element.billingAddress.address.address1 = billingAddress.address1;
    element.billingAddress.address.address2 = billingAddress.address2;
    element.billingAddress.address.postalCode = billingAddress.postalCode;
    element.billingAddress.address.city = billingAddress.city;
    element.billingAddress.address.countryCode = billingAddress.countryCode.value.toString().toUpperCase();
    return element;
}
function getPaymentDetailsForSavedRedirectCC(paymentInstrument, orderObj) {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var Resource = require('dw/web/Resource');
    var worldPayPreferences = new WorldpayPreferences();
    var apmName = paymentInstrument.getPaymentMethod();
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    var preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd);
    var paymentDetails = new XML(worldpayConstants.XMLPAYMENTDETAILS);
    var EnableTokenizationPref = preferences.worldPayEnableTokenization;
    var enableStoredCredentials = preferences.enableStoredCredentials
    if (enableStoredCredentials) {
        EnableTokenizationPref = true;
    }
    var schemeTransactionIdentifier = new XML('<schemeTransactionIdentifier></schemeTransactionIdentifier>');
    var transid = paymentInstrument.custom.transactionIdentifier;
    var payment= new XML('<TOKEN-SSL tokenScope="'+ paymentInstrument.custom.tokenScope.toLowerCase() + '" captureCvc="true"></TOKEN-SSL>');
    var sessionXML = new XML('<session shopperIPAddress="' + request.getHttpRemoteAddress() + '" id="' + createSessionID(orderObj.orderNo) + '" />');
    var storedCredentials;
    if (paymentInstrument.custom.transactionIdentifier && (!EnableTokenizationPref || paymentInstrument.creditCardToken)) {
        if (!(orderObj.createdBy.equals(worldpayConstants.CUSTOMERORDER)) && session.isUserAuthenticated()) {
            storedCredentials = new XML('<storedCredentials usage="USED" merchantInitiatedReason="' +
            Resource.msg('worldpay.storedcred.mi.UNSCHEDULED', 'worldpay', null) + '"></storedCredentials>');
            schemeTransactionIdentifier.appendChild(transid);
            storedCredentials.appendChild(schemeTransactionIdentifier);
            payment= new XML('<TOKEN-SSL tokenScope="'+ paymentInstrument.custom.tokenScope.toLowerCase() + '" ></TOKEN-SSL>');
        } else {
            storedCredentials = new XML('<storedCredentials usage="USED"></storedCredentials>');
        }
    } else if (!(orderObj.createdBy.equals(worldpayConstants.CUSTOMERORDER)) && session.isUserAuthenticated()) {
        payment= new XML('<TOKEN-SSL tokenScope="'+ paymentInstrument.custom.tokenScope.toLowerCase() + '" ></TOKEN-SSL>');
    } else {
        storedCredentials = new XML('<storedCredentials usage="USED"></storedCredentials>');
    }
    payment.paymentTokenID = paymentInstrument.creditCardToken;
    paymentDetails.appendChild(payment);
    if (enableStoredCredentials != null &&
        ((enableStoredCredentials && paymentInstrument.custom.wpTokenRequested) ||
            (paymentInstrument.creditCardToken && paymentInstrument.custom.transactionIdentifier != null)
        )) {
        paymentDetails.appendChild(storedCredentials);
    }
    paymentDetails.appendChild(sessionXML);
    return paymentDetails;
}
function addStatementNarrative(requestXml) {
    var isStatementNarrativeEnabled = Site.current.getCustomPreferenceValue('EnableStatementNarrative');
    if (isStatementNarrativeEnabled) {
        var server = require('server');
        var paymentForm = server.forms.getForm('billing');
        var statementNarrativeValue = paymentForm.billingUserFields.statementNarrative ? paymentForm.billingUserFields.statementNarrative.value : '';
        var statementNarrative = new XML('<statementNarrative></statementNarrative>');
        statementNarrative.appendChild(statementNarrativeValue);
        if (statementNarrativeValue) {
            requestXml.submit.order.appendChild(statementNarrative);
       }
    }
}

function addTo3dsFexRequest(preferences, orderObj, order) {
        if (preferences.riskData != null && preferences.riskData) {
        var riskdata = new XML('<riskData> </riskData>');
            if (preferences.authenticationMethod.value != null && preferences.authenticationMethod) {
                var authMethod = preferences.authenticationMethod.value;
            }
        var authenticationRiskData = new XML('<authenticationRiskData authenticationMethod ="' + authMethod + '"></authenticationRiskData>');
            var authenticationTimestamp = new XML('<authenticationTimestamp> </authenticationTimestamp>');
            authenticationTimestamp.appendChild(createTimeStamp());
            authenticationRiskData.appendChild(authenticationTimestamp);
            var shopperAccountRiskData = new XML('<shopperAccountRiskData></shopperAccountRiskData>');
            if (orderObj.customer.authenticated) {
            var shopperAccountCreationDate= new XML('<shopperAccountCreationDate> </shopperAccountCreationDate>');
            var shopperAccountModificationDate= new XML('<shopperAccountModificationDate></shopperAccountModificationDate>');
                shopperAccountCreationDate.appendChild(createSRD(orderObj.customer.profile.getCreationDate()));
                shopperAccountModificationDate.appendChild(createSRD(orderObj.customer.profile.getLastModified()));
                shopperAccountRiskData.appendChild(shopperAccountCreationDate);
                shopperAccountRiskData.appendChild(shopperAccountModificationDate);
            }
        var transactionRiskDataGiftCardAmount = new XML('<transactionRiskDataGiftCardAmount> </transactionRiskDataGiftCardAmount>');
            transactionRiskDataGiftCardAmount.appendChild(createAmt());
            var transactionRiskData = new XML ('<transactionRiskData></transactionRiskData>');
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
        if ((orderObj.createdBy.equals(worldpayConstants.CUSTOMERORDER)) || orderObj.customerNo) {
            var additional3DSData = new XML('<additional3DSData dfReferenceId ="' + orderObj.custom.dataSessionID + '" challengeWindowSize="'
                + challengeWindowSize + '" challengePreference = "' + challengePref + '" />');
            order.submit.order.appendChild(additional3DSData);
        }
        return order;
}
/**
 * function isNominalAuthCard returns false for Visa,MasterCard,Amex,Maestro and remaining cards true
 * @param{string} creditcardtype - selected creditcard type
 * @return {boolean} returns an boolean
 */
function isNominalAuthCard(creditcardtype) {
    switch (creditcardtype) {
        case 'Visa':
        case 'MasterCard':
        case 'Amex':
        case 'Maestro':
        case 'Discover':  
            return false;
        default:
            return true;
    }
}

/** Exported functions **/
module.exports = {
    createAmt:createAmt,
    createSRD:createSRD,
    createTimeStamp:createTimeStamp,
    createOrderContent: createOrderContent,
    createOrderDescription: createOrderDescription,
    createSessionID: createSessionID,
    addIncludedPaymentMethods: addIncludedPaymentMethods,
    addShippingAddressDetails: addShippingAddressDetails,
    addShippingAddressDetailsFormat2: addShippingAddressDetailsFormat2,
    addShipmentAmountDetailsForKlarna:addShipmentAmountDetailsForKlarna,
    addBillingAddressDetails: addBillingAddressDetails,
    addBillingAddressDetailsFormat2: addBillingAddressDetailsFormat2,
    addShopperDetails: addShopperDetails,
    addInstallationDetails: addInstallationDetails,
    addContactDetails: addContactDetails,
    addGeneralDetails: addGeneralDetails,
    addShipmentAmountDetails: addShipmentAmountDetails,
    addTokenDetails: addTokenDetails,
    addCardDetails: addCardDetails,
    getPaymentDetails: getPaymentDetails,
    appendMandateInfo: appendMandateInfo,
    getOrderDetails: getOrderDetails,
    getCompleteXML: getCompleteXML,
    addDynamicInteractionType: addDynamicInteractionType,
    getACHPaymentDetails : getACHPaymentDetails,
    addACHBillingAddressDetails : addACHBillingAddressDetails,
    getPaymentDetailsForSavedRedirectCC: getPaymentDetailsForSavedRedirectCC,
    addStatementNarrative: addStatementNarrative,
    addTo3dsFexRequest : addTo3dsFexRequest,
    getKlarnaOrderDetails: getKlarnaOrderDetails,
    isNominalAuthCard: isNominalAuthCard,
    sendPluginTrackerDetails: sendPluginTrackerDetails
};
