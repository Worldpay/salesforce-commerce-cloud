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
function sendPluginTrackerDetails(orderObj, worldpayAPMType) {
    var system = require('dw/system/System');
    var Resource = require('dw/web/Resource');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var utils = require('*/cartridge/scripts/common/utils');
    var Site = require('dw/system/Site');
    var paymentIntrument = orderObj.getPaymentInstrument();
    var apmName = paymentIntrument.getPaymentMethod();
    //var amount = paymentIntrument.getPaymentTransaction().getAmount().value;
    // Fetch the APM Type from the Payment Method i.e. if the Payment Methoid is of DIRECT or REDIRECT type.
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    WorldpayPreferences = new WorldpayPreferences();
    var preferences = WorldpayPreferences.worldPayPreferencesInit(paymentMthd, orderObj);
    var previousCartridgeVersion = Site.getCurrent().getCustomPreferenceValue('previousCartridgeVersion');
    var upgradeDates = Site.getCurrent().getCustomPreferenceValue('previousPluginUpgradeDates');
    var MERCHANT_ENTITY_REF = Site.getCurrent().getCustomPreferenceValue('merchantEntity');
    var MERCHANT_ID = preferences.merchantCode;
    var SFRA_VERSION = Resource.msg('global.version.number', 'version', null);
    var CURRENT_WORLDPAY_CARTRIDGE_VERSION = Resource.msg('Worldpay.version', 'version', null);
    var WORLDPAY_CARTRIDGE_VERSION_USED_TILL_DATE; var UPGRADE_DATES;
    var NODE_VERSION = Site.getCurrent().getCustomPreferenceValue('pluginTrackerNodeVersion');
    if (previousCartridgeVersion) {
        WORLDPAY_CARTRIDGE_VERSION_USED_TILL_DATE = previousCartridgeVersion.join(',');
    }
    if (upgradeDates) {
        UPGRADE_DATES = upgradeDates.join(',');
    }
    var str = worldpayAPMType;
    if (worldpayAPMType.equalsIgnoreCase(worldpayConstants.ELV)) {
        str = 'SEPA_DIRECT_DEBIT-SSL';
    } else if(worldpayAPMType.equals(worldpayConstants.KLARNA)) {
        str = paymentIntrument.custom.wpKlarnaPaymentMethod;
    } else if (paymentMthd && paymentMthd.ID === 'CREDIT_CARD' && Site.current.getCustomPreferenceValue('enableEFTPOS')) {
        str = 'EFTPOS_AU-SSL';
    }
    var modeSupported = system.getCompatibilityMode();
    var compMode = parseFloat(modeSupported) / 100;
    var SFRA_COMPATIBILITY_VERSION = compMode.toString();
    var rows = utils.dl(utils.dt('MERCHANT_ENTITY_REF') + utils.dt('MERCHANT_ID') + utils.dt('SFRA_VERSION') + utils.dt('SFRA_COMPATIBILITY_VERSION') + utils.dt('CURRENT_WORLDPAY_CARTRIDGE_VERSION') + utils.dt('UPGRADE_DATES') + utils.dt('WORLDPAY_CARTRIDGE_VERSION_USED_TILL_DATE'));
    rows += utils.dl(utils.dd(MERCHANT_ENTITY_REF) + utils.dd(MERCHANT_ID) + utils.dd(SFRA_VERSION) + utils.dd(SFRA_COMPATIBILITY_VERSION) + utils.dd(CURRENT_WORLDPAY_CARTRIDGE_VERSION) + utils.dd(WORLDPAY_CARTRIDGE_VERSION_USED_TILL_DATE) + utils.dd(UPGRADE_DATES));
    var upgradeDatesNewFormat = []
    for( let i=0; i<upgradeDates.length; i++) {
        upgradeDatesNewFormat.push(upgradeDates[i] + ' - (' + previousCartridgeVersion[i] + ' to ' + previousCartridgeVersion[i+1] + ')')
    }
    var newPluginTrackerData = {
        'ecommerce_platform':'Salesforce Commerce Cloud B2C',
        'ecommerce_platform_version': SFRA_COMPATIBILITY_VERSION,
        'ecommerce_plugin_data': {
            'ecommerce_platform_edition': SFRA_VERSION,
            'integration_version': CURRENT_WORLDPAY_CARTRIDGE_VERSION,
            'historic_integration_versions': upgradeDatesNewFormat.join(','),
            'additional_details': {
                //'node_version': NODE_VERSION,
                'payment_method': str,
                'currency': session.getCurrency().getCurrencyCode()
                //'amount': amount
            }
        },
        'merchant_id': MERCHANT_ID
    };
    return utils.convert2cdata('<p>' + JSON.stringify(newPluginTrackerData) + '</p>');
}

function addCurrencyAndAmount(pluginTrackerData, currency, amount) {
    pluginTrackerData.ecommerce_plugin_data.additional_details.currency = currency;
    pluginTrackerData.ecommerce_plugin_data.additional_details.amount = amount;

    return pluginTrackerData;
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
    var enablePaypalSmartbuttonHPP = preferences.enablePaypalSmartbuttonHPP;
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

    if(preferences.enablePaypalSmartbuttonHPP && preferedCards === 'ONLINE') {
        paymentMethodMask.appendChild(new XML('<include code="PAYPAL-SSL" />'));
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
    var Site = require('dw/system/Site');
    if (apmName.equals(worldpayConstants.GOOGLEPAY)) {
        var shopperXML = new XML('<shopper><shopperEmailAddress>' + orderObj.getCustomerEmail() + '</shopperEmailAddress><browser><acceptHeader>' +
            request.getHttpHeaders().get(worldpayConstants.ACCEPT) + '</acceptHeader><userAgentHeader>' +
            request.getHttpUserAgent() + '</userAgentHeader></browser></shopper>');
            shopperXML.browser.browserScreenHeight = request.httpParameterMap.browserScreenHeight.value;
            shopperXML.browser.browserScreenWidth = request.httpParameterMap.browserScreenWidth.value;
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
    if (apmType.equalsIgnoreCase(worldpayConstants.DIRECT) && !apmName.equals(worldpayConstants.KLARNA) && !apmName.equals(worldpayConstants.WECHATPAY) && Site.getCurrent().getCustomPreferenceValue("enableEFTPOSDebugging")) {
        var sessionXML = new XML('<session' + ' id="' + createSessionID(orderObj.orderNo) + '" />');
        requestXml.submit.order.shopper.appendChild(sessionXML);
    } else if (apmType.equalsIgnoreCase(worldpayConstants.DIRECT) && !apmName.equals(worldpayConstants.KLARNA) && !apmName.equals(worldpayConstants.WECHATPAY)) {
        var sessionXML = new XML('<session shopperIPAddress="' + request.getHttpRemoteAddress() + '" id="' + createSessionID(orderObj.orderNo) + '" />');
        requestXml.submit.order.shopper.appendChild(sessionXML);
    }

    return requestXml;
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
                    reqXml.submit.order.@installationId = installationID;
                } else {
                    reqXml.submit.order.@installationId = installationID;
                    reqXml = addContactDetails(reqXml);
                }
            }
        });
    }
    return reqXml;
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
        requestXml.submit.order.amount.@currencyCode = 'EUR';
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
    var Site = require('dw/system/Site');
    var str = '<' + apmName + '/>';
    if (apmName.equalsIgnoreCase(worldpayConstants.ELV)) {
        str = '<SEPA_DIRECT_DEBIT-SSL/>';
    } else if(apmName.equals(worldpayConstants.KLARNA)) {
        str = '<KLARNA_V2-SSL/>';
    }
    var orderNo = orderObj.orderNo;
    var token = orderObj.orderToken;
    var payment = new XML(str);
    if (!apmName.equals(worldpayConstants.IDEAL) && !apmName.equals(worldpayConstants.PAYPAL) && !apmName.equals(worldpayConstants.PAYPAL_SSL) && !apmName.equals(worldpayConstants.GOOGLEPAY) && !apmName.equalsIgnoreCase(worldpayConstants.ELV) && !apmName.equalsIgnoreCase(worldpayConstants.WECHATPAY)) {
        payment.@shopperCountryCode = orderObj.getBillingAddress().countryCode.value.toString().toUpperCase();
    }

    if (apmName.equals(worldpayConstants.KLARNA) || apmName.equals(worldpayConstants.KLARNASLICEIT) || apmName.equals(worldpayConstants.KLARNAPAYLATER) || apmName.equals(worldpayConstants.KLARNAPAYNOW)) {
        var klarnaCountries = require('*/cartridge/config/klarnaCountries.json');
        payment.@locale = klarnaCountries[orderObj.getBillingAddress().countryCode.value.toString().toUpperCase()].shopperLocale;
    }
    
    if (!apmName.equalsIgnoreCase(worldpayConstants.ELV) && !apmName.equals(worldpayConstants.GOOGLEPAY) && !apmName.equalsIgnoreCase(worldpayConstants.WECHATPAY)) {
        payment.successURL = URLUtils.https('COPlaceOrder-Submit', worldpayConstants.ORDERID, orderNo, worldpayConstants.ORDERTOKEN, token, worldpayConstants.PAYMENTSTATUS,
            worldpayConstants.AUTHORIZED).toString();
    }
    if (apmName.equals(worldpayConstants.IDEAL) || apmName.equals(worldpayConstants.PAYPAL)) {
        payment.successURL = URLUtils.https('COPlaceOrder-Submit', worldpayConstants.ORDERID, orderNo, worldpayConstants.ORDERTOKEN, token, worldpayConstants.PAYMENTSTATUS,
            worldpayConstants.AUTHORIZED).toString();
        payment.failureURL = URLUtils.https('COPlaceOrder-Submit', worldpayConstants.ORDERID, orderNo, worldpayConstants.ORDERTOKEN, token).toString();
    }
    if (apmName.equals(worldpayConstants.PAYPAL_SSL)) {
        payment.successURL = URLUtils.https('COPlaceOrder-Submit', worldpayConstants.ORDERID, orderNo, worldpayConstants.ORDERTOKEN, token, worldpayConstants.PAYMENTSTATUS,
            worldpayConstants.AUTHORIZED).toString();
        payment.cancelURL = URLUtils.https('COPlaceOrder-Submit', worldpayConstants.ORDERID, orderNo, worldpayConstants.ORDERTOKEN, token).toString();
        payment.pendingURL = URLUtils.https('COPlaceOrder-Submit', worldpayConstants.ORDERID, orderNo, worldpayConstants.ORDERTOKEN, token, worldpayConstants.PAYMENTSTATUS,
            worldpayConstants.PENDING).toString();
        payment.failureURL = URLUtils.https('COPlaceOrder-Submit', worldpayConstants.ORDERID, orderNo, worldpayConstants.ORDERTOKEN, token).toString();
    }
    if (!apmName.equalsIgnoreCase(worldpayConstants.ELV) && !apmName.equalsIgnoreCase(worldpayConstants.WECHATPAY) && !apmName.equals(worldpayConstants.GOOGLEPAY)) {
        payment.cancelURL = URLUtils.https('COPlaceOrder-Submit', worldpayConstants.ORDERID, orderNo, worldpayConstants.ORDERTOKEN, token).toString();
    }
    if (!apmName.equalsIgnoreCase(worldpayConstants.PAYPAL) && !apmName.equalsIgnoreCase(worldpayConstants.PAYPAL_SSL) && !apmName.equalsIgnoreCase(worldpayConstants.ELV) &&
        !apmName.equalsIgnoreCase(worldpayConstants.WECHATPAY) && !apmName.equals(worldpayConstants.GOOGLEPAY)) {
        payment.pendingURL = URLUtils.https('COPlaceOrder-Submit', worldpayConstants.ORDERID, orderNo, worldpayConstants.ORDERTOKEN, token, worldpayConstants.PAYMENTSTATUS,
            worldpayConstants.PENDING).toString();
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

    if (apmName.equals(worldpayConstants.KLARNA) || apmName.equals(worldpayConstants.KLARNASLICEIT) || apmName.equals(worldpayConstants.KLARNAPAYLATER) || apmName.equals(worldpayConstants.KLARNAPAYNOW)) {
        payment.failureURL = URLUtils.https('COPlaceOrder-Submit', worldpayConstants.ORDERID, orderNo, worldpayConstants.ORDERTOKEN, token).toString();
    }

    var paymentDetails = new XML(worldpayConstants.XMLPAYMENTDETAILS);
    paymentDetails.appendChild(payment);

    if ((apmName.equals(worldpayConstants.GOOGLEPAY) && preferences.dstype && preferences.dstype.value ==='two3d')) {
        var sessionXML = new XML('<session shopperIPAddress="' + request.getHttpRemoteAddress() + '" id="' + createSessionID(orderNo) + '" />');
        paymentDetails.appendChild(sessionXML);
        if (preferences.enableEFTPOS) {
            var routingMID = Site.getCurrent().getCustomPreferenceValue('EFTPOSRoutingMID');
            var eftposRoutingMID = new XML('<routingMID>' + routingMID + '</routingMID>');
            paymentDetails.appendChild(eftposRoutingMID);
        }
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
function createAmt(orderObj) {
    var format;
    if(orderObj) {
        var giftCertificateTotalPrice = orderObj.getGiftCertificateTotalPrice()
        format= new XML('<amount value="'+ giftCertificateTotalPrice.getValue().toString() + '" currencyCode="' + giftCertificateTotalPrice.getCurrencyCode() + '" exponent="2"/>');
    } else {
        format= new XML('<amount value="1" currencyCode="EUR" exponent="2"/>');
    }
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
    var preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd, orderObj);
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
            transactionRiskDataGiftCardAmount.appendChild(createAmt(orderObj));
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
        var dfReferenceId = '';
        if (orderObj.custom.dataSessionID) {
            dfReferenceId = orderObj.custom.dataSessionID;
        }
        if ((orderObj.createdBy.equals(worldpayConstants.CUSTOMERORDER)) || orderObj.customerNo) {
            var additional3DSData = new XML('<additional3DSData dfReferenceId ="' + dfReferenceId + '" challengeWindowSize="'
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

/**
 * This method returns stored credentials
 * @param {dw.order.PaymentInstrument} paymentIntrument - payment intrument object
 * @param {boolean} enableTokenizationPref tokenization preference value
 * @param {dw.order.Order} orderObj - Current users's Order
 * @param {Object} transid - trans id value
 * @returns {XML} storedCredentials
 */
function getStoredCredentials(paymentIntrument, enableTokenizationPref, orderObj, transid) {
    var storedCredentials;
    var schemeTransactionIdentifier = new XML('<schemeTransactionIdentifier></schemeTransactionIdentifier>');
    if (paymentIntrument.custom.transactionIdentifier && (!enableTokenizationPref || paymentIntrument.creditCardToken)) {
        if (!(orderObj.createdBy.equals(worldpayConstants.CUSTOMERORDER)) && session.isUserAuthenticated()) {
            storedCredentials = new XML('<storedCredentials usage="USED" merchantInitiatedReason="' +
            Resource.msg('worldpay.storedcred.mi.UNSCHEDULED', 'worldpay', null) + '"></storedCredentials>');
            schemeTransactionIdentifier.appendChild(transid);
            storedCredentials.appendChild(schemeTransactionIdentifier);
        } else {
            storedCredentials = new XML('<storedCredentials usage="USED"></storedCredentials>');
        }
    } else if (!paymentIntrument.creditCardToken) {
        storedCredentials = new XML('<storedCredentials usage="FIRST"/>');
    } else {
        storedCredentials = new XML('<storedCredentials usage="USED"></storedCredentials>');
    }
    return storedCredentials;
}

/**
 * This method returns orderpaymentDetails
 * @param {Object} enableSalesrequest - enableSalesrequest value
 * @param {dw.order.Order} orderObj - Current users's Order
 * @returns {XML} - returns order payment Details
 */
function getOrderPayment(enableSalesrequest, orderObj) {
    var orderPaymentDetails;
    if (enableSalesrequest != null && enableSalesrequest) {
        if (orderObj.billingAddress.countryCode.value === 'US') {
            orderPaymentDetails = new XML('<paymentDetails action="SALE"></paymentDetails>');
        } else {
            orderPaymentDetails = new XML('<paymentDetails></paymentDetails>');
        }
    } else {
        orderPaymentDetails = new XML('<paymentDetails></paymentDetails>');
    }
    return orderPaymentDetails;
}

/**
 * This method get TokenizationPref value
 * @param {Object} preferences - worldpay preferences
 * @return {boolean} boolean representation for EnableTokenizationPref
 */
function getTokenPref(preferences) {
    var enableTokenizationPref = preferences.worldPayEnableTokenization;
    if (preferences.enableStoredCredentials) {
        enableTokenizationPref = true;
    }
    return enableTokenizationPref;
}

/**
 * This method returns additional3DSData for MyAccount
 * @param {Object} preferences - worldpay preferences
 * @param {Object} requestObject - requestObject Object
 * @return {XML} retuns additional3Ds url
 */
function creatAddional3DSData(preferences, requestObject) {
    var challengePref;
    var challengeWindowSize;
    if (preferences.challengePreference.value != null && preferences.challengePreference) {
        challengePref = preferences.challengePreference.value;
    }
    if (preferences.challengeWindowSize.value != null && preferences.challengeWindowSize) {
        challengeWindowSize = preferences.challengeWindowSize.value;
    }
    return new XML('<additional3DSData dfReferenceId ="' + requestObject.session.sessionID +
    '" challengeWindowSize="' + challengeWindowSize + '" challengePreference = "' + challengePref + '" />');
}

/**
 * This method returns authMethod
 * @param {Object} preferences - worldpay preferences
 * @returns {Object} - ruturns authMethod value
 */
function getAuthMethod(preferences) {
    var authMethod;
    if (preferences.authenticationMethod.value != null && preferences.authenticationMethod) {
        authMethod = preferences.authenticationMethod.value;
    }
    return authMethod;
}

/**
 * This method returns nominal card amount
 * @param {Object} nominalCardAmount nominal card amount
 * @param {Object} preferences - worldpay preferences
 * @returns {number} returns amount
 */
function getNominalAmount(nominalCardAmount, preferences) {
    var amount;
    if (nominalCardAmount) {
        amount = (nominalCardAmount.toFixed(2) * (Math.pow(10, preferences.currencyExponent))).toFixed(0);
    }
    return amount;
}

/**
 * this method returns order amount
 * @param {number} nominalCardAmount nominal card amount
 * @param {boolean} isNominalAuthCard get auth status of nominal card
 * @param {Object} preferences - worldpay preferences
 * @param {number} amount amount value
 * @returns {XML} order amount
 */
function getOrderamount(nominalCardAmount, isNominalAuthCard, preferences, amount) {
    var orderamount;
    if (nominalCardAmount > 0 && isNominalAuthCard) {
        orderamount = new XML('<amount currencyCode="' + session.getCurrency().getCurrencyCode() + '" exponent="' +
            preferences.currencyExponent + '" value="' + amount + '"/>');
    } else {
        orderamount = new XML('<amount currencyCode="' + session.getCurrency().getCurrencyCode() + '" exponent="' +
            preferences.currencyExponent + '" value="0"/>');
    }
    return orderamount;
}

/**
 * This method returns payment details of order
 * @param {boolean} isNominalAuthCard get auth status of nominal card
 * @returns {XML} order payment Details
 */
function getOrderPaymentDetails(isNominalAuthCard) {
    var orderPaymentDetails;
    if (!isNominalAuthCard) {
        orderPaymentDetails = new XML('<paymentDetails action="ACCOUNTVERIFICATION"></paymentDetails>');
    } else {
        orderPaymentDetails = new XML('<paymentDetails></paymentDetails>');
    }
    return orderPaymentDetails;
}

/**
 * Add CPF details
 * @param {Object} billingAddress - billing address used for current order
 * @param {Object} paymentIntrument - payment instrument used for current order
 * @param {XML} requestXml - Request XML object
 * @param {Object} orderObj - current order object
 * @returns {Object} Request XML object
 */
function addCpfDetails(billingAddress, paymentIntrument, requestXml, orderObj) {
    var order = requestXml;
    let createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    if (billingAddress.countryCode.value.equalsIgnoreCase(worldpayConstants.BRAZILCOUNTRYCODE)) {
        var cpf = paymentIntrument.custom.cpf;
        if (cpf) {
            order.submit.order.thirdPartyData.cpf = cpf;
        }
    }
    if (paymentIntrument.custom.wpTokenRequested) {
        order = createRequestHelper.addTokenDetails(order, orderObj, orderObj.orderNo);
    }
    return order;
}

/**
 * Adds dynamic interaction tag for moto orders and adds stored credentials tag if enabled in preferences
 * @param {XML} requestXml - Request XML object
 * @param {Object} orderObj - current order object
 * @param {Object} session - current session
 * @param {Object} preferences - worldpay BM preferences
 * @param {Object} paymentIntrument - payment instrument
 * @param {Object} storedCredentials - storedCredentials
 * @returns {XML} Request XML object
 */
function addMotoAndStoredCredentialsDetails(requestXml, orderObj, session, preferences, paymentIntrument, storedCredentials) {
    var order = requestXml;
    if (!(orderObj.createdBy.equals(worldpayConstants.CUSTOMERORDER)) && session.isUserAuthenticated()) {
        var dynamicmoto = new XML('<dynamicInteractionType type="MOTO"/>');
        order.submit.order.appendChild(dynamicmoto);
    }
    if (preferences.enableStoredCredentials != null &&
        ((preferences.enableStoredCredentials && paymentIntrument.custom.saveCard) ||
            (paymentIntrument.creditCardToken && paymentIntrument.custom.transactionIdentifier != null)
        )) {
        order.submit.order.paymentDetails.appendChild(storedCredentials);
    }
    return order;
}

/**
 * Adds Paypal details to the service request
 * @param {Object} reqXml - Service request object
 * @param {string} apmType - Type of APM
 * @param {Object} preferences - Worldpay preferences
 * @param {dw.order.Order} orderObj - Current order object
 * @param {dw.order.PaymentInstrument} paymentInstrument - Payment instrument associated with the order object
 * @param {Object} shippingAddress - Shipping address
 * @param {Object} billingAddress - Billing address
 * @returns {XML} - Service request or null in case of error
 */
function addPayPalDetails(reqXml, apmType, preferences, orderObj, paymentInstrument, shippingAddress, billingAddress) {
    var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    var requestXml = reqXml;
    var apmName = paymentInstrument.getPaymentMethod();
    if (apmType.equalsIgnoreCase(worldpayConstants.DIRECT)) {
        requestXml = createRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
        requestXml = createRequestHelper.addShippingAddressDetails(requestXml, shippingAddress);
        requestXml = createRequestHelper.addBillingAddressDetails(requestXml, billingAddress);

        createRequestHelper.addStatementNarrative(requestXml);
    } else {
        // Add code to support PAYPAL-EXPRESS REDIRECT method.
        Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
        return null;
    }
    return requestXml;
}

/**
 * Adds Paypal-SSL details to the service request
 * @param {Object} reqXml - Service request object
 * @param {string} apmType - Type of APM
 * @param {Object} preferences - Worldpay preferences
 * @param {dw.order.Order} orderObj - Current order object
 * @param {dw.order.PaymentInstrument} paymentInstrument - Payment instrument associated with the order object
 * @param {Object} shippingAddress - Shipping address
 * @param {Object} billingAddress - Billing address
 * @returns {XML} - Service request or null in case of error
 */
function addPayPalDetailsSSL(reqXml, apmType, preferences, orderObj, paymentInstrument, shippingAddress, billingAddress) {
    var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    var requestXml = reqXml;
    var apmName = paymentInstrument.getPaymentMethod();
    if (apmType.equalsIgnoreCase(worldpayConstants.DIRECT)) {
        requestXml = createRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
        requestXml = createRequestHelper.addShippingAddressDetails(requestXml, shippingAddress);
        requestXml = createRequestHelper.addBillingAddressDetails(requestXml, billingAddress);

        createRequestHelper.addStatementNarrative(requestXml);
    } else {
        // Add code to support PAYPAL-EXPRESS REDIRECT method.
        Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
        return null;
    }
    return requestXml;
}

/**
 * Adds Google Pay details to the service request
 * @param {Object} reqXml - Service request object
 * @param {string} apmType - Type of APM
 * @param {string} apmName - APM name
 * @param {Object} preferences - Worldpay preferences
 * @param {dw.order.Order} orderObj - Current order object
 * @param {dw.order.PaymentInstrument} paymentInstrument - Payment instrument associated with the order object
 * @param {dw.customer.Customer} currentCustomer - Current customer object
 * @returns {XML} - Service request or null in case of error
 */
function addGPayDetails(reqXml, apmType, apmName, preferences, orderObj, paymentInstrument, currentCustomer) {
    var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    var requestXml = reqXml;
    if (apmType.equalsIgnoreCase(worldpayConstants.DIRECT)) {
        requestXml = createRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
        requestXml = createRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
        if (preferences.dstype !== null && preferences.dstype.value === 'two3d') {
            requestXml = createRequestHelper.addTo3dsFexRequest(preferences, orderObj, requestXml);
        }
    } else {
        Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
        return null;
    }
    return requestXml;
}

/**
 * Adds Klarna details to the service request
 * @param {Object} reqXml - Service request object
 * @param {Object} preferences - Worldpay preferences
 * @param {dw.order.Order} orderObj - Current order object
 * @param {dw.order.PaymentInstrument} paymentInstrument - Payment instrument associated with the order object
 * @param {dw.customer.Customer} currentCustomer - Current customer object
 * @param {Object} shippingAddress - Shipping address
 * @param {Object} billingAddress - Billing address
 * @returns {XML} - Service request or null in case of error
 */
function addKlarnaDetails(reqXml, preferences, orderObj, paymentInstrument, currentCustomer, shippingAddress, billingAddress) {
    var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var apmName = paymentInstrument.getPaymentMethod();
    var paymentMthd = PaymentMgr.getPaymentMethod(apmName);
    var apmType = paymentMthd.custom.type.value;
    var requestXml = reqXml;
    if (apmType.equalsIgnoreCase(worldpayConstants.DIRECT)) {
        requestXml = createRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
        requestXml = createRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
        requestXml = createRequestHelper.addShippingAddressDetails(requestXml, shippingAddress);
        requestXml = createRequestHelper.addBillingAddressDetails(requestXml, billingAddress);
        createRequestHelper.addStatementNarrative(requestXml);
        requestXml = createRequestHelper.getOrderDetails(requestXml, orderObj);
    } else {
        Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
        return null;
    }
    return requestXml;
}

/**
 * Adds Ideal details to the service request
 * @param {Object} reqXml - Service request object
 * @param {string} apmType - Type of APM
 * @param {string} apmName - APM name
 * @param {Object} preferences - Worldpay preferences
 * @param {dw.order.Order} orderObj - Current order object
 * @param {dw.order.PaymentInstrument} paymentInstrument - Payment instrument associated with the order object
 * @returns {XML} - Service request or null in case of error
 */
function addIdealDetails(reqXml, apmType, apmName, preferences, orderObj, paymentInstrument) {
    var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    var requestXml = reqXml;
    if (apmType.equalsIgnoreCase(worldpayConstants.DIRECT)) {
        requestXml = createRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
    } else {
        // Add code to support IDEAL-SSL REDIRECT method.
        Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
        return null;
    }
    return requestXml;
}

/**
 * Adds China Union Pay details to the service request
 * @param {Object} reqXml - Service request object
 * @param {string} apmType - Type of APM
 * @param {dw.order.PaymentInstrument} paymentInstrument - Payment instrument associated with the order object
 * @param {string} apmName - APM name
 * @param {dw.order.Order} orderObj - Current order object
 * @param {dw.customer.Customer} currentCustomer - Current customer object
 * @param {Object} shippingAddress - Shipping address
 * @returns {XML} - Service request
 */
function addChinaUnionPayDetails(reqXml, apmType, paymentInstrument, apmName, orderObj, currentCustomer, shippingAddress) {
    var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    var payMethod;
    var ArrayList = require('dw/util/ArrayList');
    var requestXml = reqXml;
    if (apmType.equalsIgnoreCase(worldpayConstants.REDIRECT)) {
        payMethod = new ArrayList();
        payMethod.push(worldpayConstants.CHINAUNIONPAY);
        requestXml = createRequestHelper.addIncludedPaymentMethods(requestXml, payMethod, null, paymentInstrument);
        requestXml = createRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
        requestXml = createRequestHelper.addShippingAddressDetails(requestXml, shippingAddress);
        createRequestHelper.addStatementNarrative(requestXml);
    }
    return requestXml;
}

/**
 * Adds Mister Cash details to the service request
 * @param {Object} reqXml - Service request object
 * @param {string} apmType - Type of APM
 * @param {dw.order.PaymentInstrument} paymentInstrument - Payment instrument associated with the order object
 * @param {dw.order.Order} orderObj - Current order object
 * @param {dw.customer.Customer} currentCustomer - Current customer object
 * @param {Object} shippingAddress - Shipping address
 * @param {Object} preferences - Worldpay preferences
 * @returns {XML} - Service request
 */
function addMisterCashDetails(reqXml, apmType, paymentInstrument, orderObj, currentCustomer, shippingAddress, preferences) {
    var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    var requestXml = reqXml;
    var apmName = paymentInstrument.getPaymentMethod();
    if (apmType.equalsIgnoreCase(worldpayConstants.DIRECT)) {
        requestXml = createRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
        requestXml = createRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
        requestXml = createRequestHelper.addShippingAddressDetailsFormat2(requestXml, shippingAddress);
        createRequestHelper.addStatementNarrative(requestXml);
    } else {
        // Add code to support MISTERCASH-SSL REDIRECT method.
        Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
        return null;
    }
    return requestXml;
}

/**
 * Adds Konbini details to the service request
 * @param {Object} reqXml - Service request object
 * @param {string} apmType - Type of APM
 * @param {dw.order.PaymentInstrument} paymentInstrument - Payment instrument associated with the order object
 * @param {dw.order.Order} orderObj - Current order object
 * @param {dw.customer.Customer} currentCustomer - Current customer object
 * @param {Object} shippingAddress - Shipping address
 * @param {Object} preferences - Worldpay preferences
 * @returns {XML} - Service request
 */
function addKonbiniDetails(reqXml, apmType, paymentInstrument, orderObj, currentCustomer, shippingAddress, preferences) {
    var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    var requestXml = reqXml;
    var apmName = paymentInstrument.getPaymentMethod();
    if (apmType.equalsIgnoreCase(worldpayConstants.DIRECT)) {
        requestXml = createRequestHelper.getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
        requestXml = createRequestHelper.addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
        requestXml = createRequestHelper.addShippingAddressDetails(requestXml, shippingAddress);
        createRequestHelper.addStatementNarrative(requestXml);
    } else {
        // Add code to support KONBINI-SSL REDIRECT method.
        Logger.getLogger('worldpay').error('ORDER XML REQUEST : Unsupported Payment Method');
        return null;
    }
    return requestXml;
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
    var enableTokenizationPref = getTokenPref(preferences);
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
    addStatementNarrative(order);
    installments = paymentIntrument.custom.installments;
    if (installments) {
        order.submit.order.thirdPartyData.instalments = installments;
    }
    return order;
}

function addELVDetails(requestXml, apmType, paymentInstrument, apmName, orderObj, currentCustomer, billingAddress, preferences) {
    if (apmType.equalsIgnoreCase(worldpayConstants.DIRECT)) {
        requestXml = getPaymentDetails(apmName, preferences, requestXml, orderObj, paymentInstrument);
        requestXml = addShopperDetails(apmName, requestXml, orderObj, apmType, currentCustomer, false);
        requestXml = addBillingAddressDetailsFormat2(requestXml, billingAddress);
        addStatementNarrative(requestXml);
        requestXml = appendMandateInfo(requestXml, paymentInstrument);
    } else {
        // Add code to support ELV REDIRECT method.
    }
    return requestXml;
}

function addNordEafiDetails(requestXml, apmType, apmName, orderObj, currentCustomer, shippingAddress) {
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
    return requestXml;
}

function addRiskData(preferences, customerObj, orderorder, orderObj) {
    if (preferences.riskData != null && preferences.riskData) {
        var riskdata = new XML('<riskData> </riskData>');
        var authMethod = getAuthMethod(preferences);
        var authenticationRiskData = new XML('<authenticationRiskData authenticationMethod ="' + authMethod + '"></authenticationRiskData>');
        var authenticationTimestamp = new XML('<authenticationTimestamp> </authenticationTimestamp>');
        authenticationTimestamp.appendChild(createTimeStamp());
        authenticationRiskData.appendChild(authenticationTimestamp);
        var shopperAccountRiskData = new XML('<shopperAccountRiskData></shopperAccountRiskData>');
        if (customerObj.authenticated) {
            var shopperAccountCreationDate = new XML('<shopperAccountCreationDate> </shopperAccountCreationDate>');
            var shopperAccountModificationDate = new XML('<shopperAccountModificationDate></shopperAccountModificationDate>');
            shopperAccountCreationDate.appendChild(createSRD(customerObj.profile.getCreationDate()));
            shopperAccountModificationDate.appendChild(createSRD(customerObj.profile.getLastModified()));
            shopperAccountRiskData.appendChild(shopperAccountCreationDate);
            shopperAccountRiskData.appendChild(shopperAccountModificationDate);
        }
        var transactionRiskDataGiftCardAmount = new XML('<transactionRiskDataGiftCardAmount> </transactionRiskDataGiftCardAmount>');
        transactionRiskDataGiftCardAmount.appendChild(createAmt(orderObj));
        var transactionRiskData = new XML('<transactionRiskData></transactionRiskData>');
        transactionRiskData.appendChild(transactionRiskDataGiftCardAmount);
        riskdata.appendChild(authenticationRiskData);
        riskdata.appendChild(shopperAccountRiskData);
        riskdata.appendChild(transactionRiskData);
        orderorder.appendChild(riskdata);
        return orderorder;
    }
}

function addPrimeRoutingRequest(enableSalesrequest, orderObj, order, primeRoutingRequest){
    if (enableSalesrequest) {
        if (orderObj.billingAddress.countryCode.value === 'US') {
            order.submit.order.appendChild(primeRoutingRequest);
        }
    }
    return order;
}

function isTwo3D(preferences) {
    return preferences.dstype !== null && preferences.dstype.value === 'two3d';
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
    sendPluginTrackerDetails: sendPluginTrackerDetails,
    getStoredCredentials: getStoredCredentials,
    getOrderPayment: getOrderPayment,
    getTokenPref: getTokenPref,
    creatAddional3DSData: creatAddional3DSData,
    getAuthMethod: getAuthMethod,
    getNominalAmount: getNominalAmount,
    getOrderamount: getOrderamount,
    getOrderPaymentDetails: getOrderPaymentDetails,
    addCpfDetails: addCpfDetails,
    addMotoAndStoredCredentialsDetails: addMotoAndStoredCredentialsDetails,
    addPayPalDetails: addPayPalDetails,
    addPayPalDetailsSSL: addPayPalDetailsSSL,
    addGPayDetails: addGPayDetails,
    addKlarnaDetails: addKlarnaDetails,
    addIdealDetails: addIdealDetails,
    addChinaUnionPayDetails: addChinaUnionPayDetails,
    addMisterCashDetails: addMisterCashDetails,
    addKonbiniDetails: addKonbiniDetails,
    addP24Details: addP24Details,
    addELVDetails: addELVDetails,
    getOrderObj: getOrderObj,
    addRiskData: addRiskData,
    addPrimeRoutingRequest: addPrimeRoutingRequest,
    isTwo3D: isTwo3D
    
};
