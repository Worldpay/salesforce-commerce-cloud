/** *******************************************************************************
*
* Description: Contains the functions that helps in the request object creation.
*
*
/*********************************************************************************/
var Site = require('dw/system/Site');
var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
var Utils = require('*/cartridge/scripts/common/Utils');
/**
 * Hook function for order content. This function is called during the xml order
 * creation. This function can be modified if other data or format is desired.
 * @param {dw.order.Basket} basket - The current basket
 * @return {string} return CDATA
 */
function createOrderContent(basket) {
    var Utils = require('*/cartridge/scripts/common/Utils');
    var rows = Utils.tr(Utils.th('Product ID') + Utils.th('Product Name')
    + Utils.th('Quantity') + Utils.th('Price'));
    var productLineItems = basket.getAllProductLineItems().iterator();
    while (productLineItems.hasNext()) {
        var pli = productLineItems.next();
        rows += Utils.tr(Utils.td(pli.getProductID()) + Utils.td(pli.getProductName())
       + Utils.td(pli.getQuantity()) + Utils.td(pli.getAdjustedPrice().toString()));
    }
    rows += Utils.tr('<td colspan="4">Your payment will be handled by  Worldpay Payments Services'
      + '<br/>This name may appear on your bank statement<br/>http://www.worldpay.com'
      + '</td>');
    return Utils.convert2cdata(Utils.table(rows));
}

/**
 * Hook function for order description. This function is called during the xml order
 * creation. This function can be modified if other data or format is desired.
 * @param {string} data - data
 * @return {string} return the data
 */
function createOrderDescription(data) {
    return WorldpayConstants.ORDERDESCRIPTION + data;
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
    var paymentMethodMask = new XML('<paymentMethodMask/>');// eslint-disable-line

    var preferedCards = ((typeof paymentInstrument === 'undefined') || (undefined === paymentInstrument.custom.worldpayPreferredCard)) ? null : paymentInstrument.custom.worldpayPreferredCard;
    if (!preferedCards && includedPaymentMethods && includedPaymentMethods.length > 0) {
        for (var i = 0; i < includedPaymentMethods.length; i++) {
            paymentMethodMask.appendChild(new XML('<include code="' + includedPaymentMethods[i] + '" />'));// eslint-disable-line
        }
    } else if (preferedCards) {
        paymentMethodMask.appendChild(new XML('<include code="' + preferedCards + '" />'));// eslint-disable-line
    } else {
        paymentMethodMask.appendChild(new XML('<include code="ALL" />'));// eslint-disable-line
    }
    if (excludedPaymentMethods && excludedPaymentMethods.length > 0) {
        for (var j = 0; j < excludedPaymentMethods.length; j++) {
            paymentMethodMask.appendChild(new XML('<exclude code="' + excludedPaymentMethods[j] + '" />'));// eslint-disable-line
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
    requestXml.submit.order.billingAddress.address.firstName = billingAddress.firstName;// eslint-disable-line
    requestXml.submit.order.billingAddress.address.lastName = billingAddress.lastName;// eslint-disable-line
    requestXml.submit.order.billingAddress.address.street = billingAddress.address1;// eslint-disable-line
    requestXml.submit.order.billingAddress.address.postalCode = billingAddress.postalCode;// eslint-disable-line
    requestXml.submit.order.billingAddress.address.city = billingAddress.city;// eslint-disable-line
    requestXml.submit.order.billingAddress.address.state = billingAddress.stateCode;// eslint-disable-line
    requestXml.submit.order.billingAddress.address.countryCode = billingAddress.countryCode.value.toString().toUpperCase();// eslint-disable-line
    requestXml.submit.order.billingAddress.address.telephoneNumber = billingAddress.phone;// eslint-disable-line
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
    requestXml.submit.order.billingAddress.address.firstName = billingAddress.firstName;// eslint-disable-line
    requestXml.submit.order.billingAddress.address.lastName = billingAddress.lastName;// eslint-disable-line
    requestXml.submit.order.billingAddress.address.address1 = billingAddress.address1;// eslint-disable-line
    requestXml.submit.order.billingAddress.address.postalCode = billingAddress.postalCode;// eslint-disable-line
    requestXml.submit.order.billingAddress.address.city = billingAddress.city;// eslint-disable-line
    requestXml.submit.order.billingAddress.address.state = billingAddress.stateCode;// eslint-disable-line
    requestXml.submit.order.billingAddress.address.countryCode = billingAddress.countryCode.value.toString().toUpperCase();// eslint-disable-line
    requestXml.submit.order.billingAddress.address.telephoneNumber = billingAddress.phone;// eslint-disable-line
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
    if (apmName.equals(WorldpayConstants.GIROPAY)) {
        var shopperXML = new XML('<shopper><shopperEmailAddress>' + orderObj.getCustomerEmail() + '</shopperEmailAddress><browser><acceptHeader>' + request.getHttpHeaders().get(WorldpayConstants.ACCEPT) + '</acceptHeader><userAgentHeader>' + request.getHttpUserAgent() + '</userAgentHeader></browser></shopper>');// eslint-disable-line
        requestXml.submit.order.appendChild(shopperXML);
    } else if (apmName.equals(WorldpayConstants.WECHATPAY) && apmType.equalsIgnoreCase(WorldpayConstants.DIRECT)) {
    	requestXml.submit.order.shopper.shopperEmailAddress = orderObj.getCustomerEmail();
    	if(Utils.isDesktopDevice()) {
    		var browserXML = new XML('<browser deviceType="0" />');// eslint-disable-line
    		requestXml.submit.order.shopper.appendChild(browserXML);
    	}
    } else {
        requestXml.submit.order.shopper.shopperEmailAddress = orderObj.getCustomerEmail();
        if (currentCustomer.registered && apmName.equals(WorldpayConstants.WORLDPAY) && includeShopperId) {
            requestXml.submit.order.shopper.authenticatedShopperID = currentCustomer.profile.customerNo;
        }
    }

  // The result of request.getSession().getSessionID() in Demandware is not NMTOKEN.
  // use the createSessionID() function to cutomize the session ID
    if (apmType.equalsIgnoreCase(WorldpayConstants.DIRECT) && !apmName.equals(WorldpayConstants.KLARNA) && !apmName.equals(WorldpayConstants.WECHATPAY)) {
        var sessionXML = new XML('<session shopperIPAddress="' + request.getHttpRemoteAddress() + '" id="' + createSessionID(orderObj.orderNo) + '" />');// eslint-disable-line
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
    requestXml.submit.order.@installationId = installationID;// eslint-disable-line
    return requestXml;
}

/**
 * Hook function to add contact details
 * @param {XML} requestXml - request Xml
 * @return {XML} returns request xml
 */
function addContactDetails(requestXml) {
    var Site = require('dw/system/Site');
    requestXml.submit.order.@fixContact = Site.getCurrent().getCustomPreferenceValue("WorldpayFixContact");// eslint-disable-line
    requestXml.submit.order.@hideContact = Site.getCurrent().getCustomPreferenceValue("WorldpayHideContact");// eslint-disable-line
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
function addGeneralDetails(requestXml, orderObj, preferences) {
    requestXml.@merchantCode = preferences.merchantCode;// eslint-disable-line
    requestXml.submit.order.@orderCode = orderObj.orderNo;// eslint-disable-line
    requestXml.submit.order.description =
    createOrderDescription(orderObj.orderNo);
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
function addShipmentAmountDetails(apmName, requestXml, paymentAmount, preferences) {
    var totalprice = paymentAmount;

    if (totalprice.available) {
    // Multiply price with 10 power exponent in order to remove the decimal digits or add if not existing
        var tempPrice = totalprice.getValue();
        tempPrice =
      (tempPrice.toFixed(2) * (Math.pow(10, preferences.currencyExponent))).toFixed(0);
    requestXml.submit.order.amount.@value = tempPrice.toString();// eslint-disable-line

    // ISO 4217
    if (apmName.equals(WorldpayConstants.KLARNA)) {
    	//requestXml.submit.order.amount.@value = 2495;// eslint-disable-line////Added for testing the MobileFirst Global
    	requestXml.submit.order.amount.@currencyCode = 'GBP';// eslint-disable-line
    } else { 
    	requestXml.submit.order.amount.@currencyCode = totalprice.getCurrencyCode();// eslint-disable-line
    }
    requestXml.submit.order.amount.@exponent = preferences.currencyExponent;// eslint-disable-line
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
	if(tokenType!=null && tokenType.toString().equals(WorldpayConstants.merchanttokenType)){
		var token = new XML('<createToken tokenScope="merchant"></createToken>');// eslint-disable-line
	}
	else{
		 var token = new XML('<createToken tokenScope="shopper"></createToken>');// eslint-disable-line
	}

		    requestXml.submit.order.createToken = token;// eslint-disable-line
		    requestXml.submit.order.createToken.tokenEventReference = orderObj.orderNo;// eslint-disable-line
		    requestXml.submit.order.createToken.tokenReason = tokenReason;// eslint-disable-line
		    return requestXml;
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
    if (apmName.equalsIgnoreCase(WorldpayConstants.ELV)) {
        str = '<SEPA_DIRECT_DEBIT-SSL/>';
    }

    var orderNo = orderObj.orderNo;
    var token = orderObj.orderToken;
    var payment = new XML(str);// eslint-disable-line
    if (apmName.equals(WorldpayConstants.IDEAL)) {
        payment.@shopperBankCode = paymentInstrument.custom.bank;// eslint-disable-line
    } else if (!apmName.equals(WorldpayConstants.PAYPAL) && !apmName.equals(WorldpayConstants.GOOGLEPAY) && !apmName.equals(WorldpayConstants.GIROPAY) && !apmName.equalsIgnoreCase(WorldpayConstants.ELV) && !apmName.equalsIgnoreCase(WorldpayConstants.KLARNA) && !apmName.equalsIgnoreCase(WorldpayConstants.WECHATPAY)) {
        payment.@shopperCountryCode = orderObj.getBillingAddress().countryCode.value.toString().toUpperCase();// eslint-disable-line
    }

    if (apmName.equals(WorldpayConstants.BOLETO)) {
        payment.cpf = paymentInstrument.custom.cpf;
    }
    if (!apmName.equalsIgnoreCase(WorldpayConstants.ELV) && !apmName.equalsIgnoreCase(WorldpayConstants.KLARNA) && !apmName.equals(WorldpayConstants.GOOGLEPAY) && !apmName.equalsIgnoreCase(WorldpayConstants.WECHATPAY)) {
        payment.successURL = URLUtils.https('COPlaceOrder-Submit', WorldpayConstants.ORDERID, orderNo, WorldpayConstants.ORDERTOKEN, token, WorldpayConstants.PAYMENTSTATUS, WorldpayConstants.AUTHORIZED).toString();
    }
    if (apmName.equals(WorldpayConstants.IDEAL) || apmName.equals(WorldpayConstants.PAYPAL) || apmName.equals(WorldpayConstants.GIROPAY)) {
        payment.successURL = URLUtils.https('COPlaceOrder-Submit', WorldpayConstants.ORDERID, orderNo, WorldpayConstants.ORDERTOKEN, token, WorldpayConstants.PAYMENTSTATUS, WorldpayConstants.AUTHORIZED).toString();
        payment.failureURL = URLUtils.https('COPlaceOrder-Submit', WorldpayConstants.ORDERID, orderNo, WorldpayConstants.ORDERTOKEN, token).toString();
    }
    if (!apmName.equalsIgnoreCase(WorldpayConstants.ELV) && !apmName.equalsIgnoreCase(WorldpayConstants.KLARNA) && !apmName.equalsIgnoreCase(WorldpayConstants.WECHATPAY) && !apmName.equals(WorldpayConstants.GOOGLEPAY)) {
        payment.cancelURL = URLUtils.https('COPlaceOrder-Submit', WorldpayConstants.ORDERID, orderNo, WorldpayConstants.ORDERTOKEN, token).toString();
    }
    if (!apmName.equalsIgnoreCase(WorldpayConstants.PAYPAL) && !apmName.equalsIgnoreCase(WorldpayConstants.GIROPAY) && !apmName.equalsIgnoreCase(WorldpayConstants.ELV) && !apmName.equalsIgnoreCase(WorldpayConstants.KLARNA) && !apmName.equalsIgnoreCase(WorldpayConstants.WECHATPAY) && !apmName.equals(WorldpayConstants.GOOGLEPAY)) {
        payment.pendingURL = URLUtils.https('COPlaceOrder-Submit', WorldpayConstants.ORDERID, orderNo, WorldpayConstants.ORDERTOKEN, token, WorldpayConstants.PAYMENTSTATUS, WorldpayConstants.PENDING).toString();
    }

  // CODE FOR GIROPAY
    if (apmName.equals(WorldpayConstants.GIROPAY)) {
        payment.swiftCode = paymentInstrument.custom.bankCode;
    }
    if (apmName.equals(WorldpayConstants.GOOGLEPAY)) {
        payment.protocolVersion = paymentInstrument.custom.gpayprotocolVersion;
        payment.signature = paymentInstrument.custom.gpaySignature;
        payment.signedMessage = paymentInstrument.custom.gpaysignedMessage;
    }

    if (apmName.equals(WorldpayConstants.ELV)) {
        var Iban = paymentInstrument.custom.iban;
        var accountHolderName = paymentInstrument.custom.accountHolderName;
        var bankAccountSEPA = new XML('<bankAccount-SEPA/>');// eslint-disable-line
        bankAccountSEPA.iban = Iban;
        bankAccountSEPA.accountHolderName = accountHolderName;
        payment.bankAccountSEPA = bankAccountSEPA;
    }

    if (apmName.equals(WorldpayConstants.KLARNA)) {
        payment.purchaseCountry = 'gb';
        payment.shopperLocale = 'en-gb';        
        var merchantUrls = new XML('<merchantUrls/>');
        merchantUrls.checkoutURL = URLUtils.https('COPlaceOrder-Submit', WorldpayConstants.ORDERID, orderNo, WorldpayConstants.ORDERTOKEN, token).toString();
        merchantUrls.confirmationURL = URLUtils.https('COPlaceOrder-Submit', WorldpayConstants.ORDERID, orderNo, WorldpayConstants.ORDERTOKEN, token, WorldpayConstants.PAYMENTSTATUS, WorldpayConstants.AUTHORIZED).toString();
        payment.merchantUrls = merchantUrls;
    }
   
    var paymentDetails = new XML(WorldpayConstants.XMLPAYMENTDETAILS);// eslint-disable-line
    paymentDetails.appendChild(payment);

    if (apmName.equals(WorldpayConstants.GIROPAY)) {
        var sessionXML = new XML('<session shopperIPAddress="' + request.getHttpRemoteAddress() + '" id="' + createSessionID(orderNo) + '" />');// eslint-disable-line
        paymentDetails.appendChild(sessionXML);
    }
   
    
    requestXml.submit.order.appendChild(paymentDetails);// eslint-disable-line

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

    var mandate = new XML('<mandate><mandateType>' + mandateType + '</mandateType><mandateId>' + mandateID + '</mandateId></mandate>');// eslint-disable-line
    requestXml.submit.order.appendChild(mandate);// eslint-disable-line
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
	var shipments = orderObj.getShipments();
	var shipmentsItr = shipments.iterator();
	while (shipmentsItr.hasNext()) {
        var shipment = shipmentsItr.next();
        var allLineItems = shipment.getAllLineItems();
        var allLineItemsItr = allLineItems.iterator();
        while(allLineItemsItr.hasNext()){
        	var ali = allLineItemsItr.next();
        	var lineItem = new XML('<lineItem/>');
        	if(ali instanceof dw.order.ShippingLineItem || ali instanceof dw.order.ProductShippingLineItem){
        		var shippingFee = new XML(<shippingFee/>);
                lineItem.appendChild(shippingFee);
                
        		var reference = new XML('<reference></reference>');// eslint-disable-line
                reference.appendChild('Shipping Fee');
                lineItem.appendChild(reference);
                
                var name = new XML('<name></name>');// eslint-disable-line
                name.appendChild('Shipping Fee');
                lineItem.appendChild(name);
                
                var quantity = new XML('<quantity></quantity>');// eslint-disable-line
                quantity.appendChild('1');
                lineItem.appendChild(quantity);
                	
                var quantityUnit = new XML('<quantityUnit></quantityUnit>');// eslint-disable-line//'length check of 10';
                quantityUnit.appendChild('Shipping');
                lineItem.appendChild(quantityUnit);
                
        		var unitPrice = new XML('<unitPrice></unitPrice>');// eslint-disable-line //2 to be site prefernce
        		unitPrice.appendChild((Math.pow(10,2)*ali.adjustedPrice.value).toFixed());// total amount = adujusted price
        		lineItem.appendChild(unitPrice);
        		
        		var taxRate = new XML('<taxRate></taxRate>');// eslint-disable-line
        		taxRate.appendChild((Math.pow(10,4)*ali.getTaxRate()).toFixed());
        		lineItem.appendChild(taxRate);
            	
            	var totalAmount = new XML('<totalAmount></totalAmount>');// eslint-disable-line
        		totalAmount.appendChild((Math.pow(10,2)*ali.adjustedPrice.value).toFixed());
        		lineItem.appendChild(totalAmount);
        		
        		var totalTaxAmount = new XML('<totalTaxAmount></totalTaxAmount>');// eslint-disable-line
        		totalTaxAmount.appendChild((Math.pow(10,2)*ali.adjustedTax.value).toFixed());
        		lineItem.appendChild(totalTaxAmount);

        	} else {
				var lineItemQuantityValue;
	        		if(ali instanceof dw.order.GiftCertificateLineItem){
		            	var physical = new XML(<physical/>);
		        		lineItem.appendChild(physical);
		        		
		        		var reference = new XML('<reference></reference>');// eslint-disable-line
		        		reference.appendChild(ali.giftCertificateID);
		        		lineItem.appendChild(reference);
		        		
		        		var name = new XML('<name></name>');// eslint-disable-line
		        		name.appendChild('Gift Certificate');
		        		lineItem.appendChild(name);
		            	
		            	var quantity = new XML('<quantity></quantity>');// eslint-disable-line
		        		quantity.appendChild('1');
		        		lineItem.appendChild(quantity);
		        		
		        		var quantityUnit = new XML('<quantityUnit></quantityUnit>');// eslint-disable-line //'length check of 10';
		        		quantityUnit.appendChild('GiftCert');
		        		lineItem.appendChild(quantityUnit);
						lineItemQuantityValue = 1;
	        		}else if(ali instanceof dw.order.PriceAdjustment){
		            	var discount = new XML(<discount/>);
		        		lineItem.appendChild(discount);
		        		
		        		var reference = new XML('<reference></reference>');// eslint-disable-line
		        		reference.appendChild('Discount');
		        		lineItem.appendChild(reference);
		        		
		        		var name = new XML('<name></name>');// eslint-disable-line
		        		name.appendChild('Discount');
		        		lineItem.appendChild(name);
		            	
		            	var quantity = new XML('<quantity></quantity>');// eslint-disable-line
		        		quantity.appendChild('1');
		        		lineItem.appendChild(quantity);
		        		
		        		var quantityUnit = new XML('<quantityUnit></quantityUnit>');// eslint-disable-line //'length check of 10';
		        		quantityUnit.appendChild('Discount');
		        		lineItem.appendChild(quantityUnit);
						lineItemQuantityValue = 1;
	        		} else {//ProductLineItem
		            	var physical = new XML(<physical/>);
		        		lineItem.appendChild(physical);
		        		
		        		var reference = new XML('<reference></reference>');// eslint-disable-line
		        		reference.appendChild(ali.productID);// length of 255 characters
		        		lineItem.appendChild(reference);
		        		
		        		var name = new XML('<name></name>');// eslint-disable-line
		        		name.appendChild(ali.productName);// length of 255 characters
		        		lineItem.appendChild(name);
		            	
		            	var quantity = new XML('<quantity></quantity>');// eslint-disable-line
		        		quantity.appendChild((ali.quantityValue).toFixed());
		        		lineItem.appendChild(quantity);
		        		
		        		var quantityUnit = new XML('<quantityUnit></quantityUnit>');// eslint-disable-line //'length check of 10';
		        		quantityUnit.appendChild(ali.getQuantity().getUnit()?ali.getQuantity().getUnit():'unit');
		        		lineItem.appendChild(quantityUnit);
						lineItemQuantityValue = ali.quantityValue;
	        		}
	    		var unitPrice = new XML('<unitPrice></unitPrice>');// eslint-disable-line //2 to be site prefernce
	    		unitPrice.appendChild((Math.pow(10,2)*(ali.getPriceValue()/lineItemQuantityValue)).toFixed());
	    		lineItem.appendChild(unitPrice);
	    		
	    		var taxRate = new XML('<taxRate></taxRate>');// eslint-disable-line
	    		taxRate.appendChild((Math.pow(10,4)*ali.getTaxRate()).toFixed());
	    		lineItem.appendChild(taxRate);
	        	
	        	var totalAmount = new XML('<totalAmount></totalAmount>');// eslint-disable-line
	    		totalAmount.appendChild((Math.pow(10,2)*ali.getPrice().value).toFixed());
	    		lineItem.appendChild(totalAmount);
	    		
	    		var totalTaxAmount = new XML('<totalTaxAmount></totalTaxAmount>');// eslint-disable-line
	    		totalTaxAmount.appendChild((Math.pow(10,2)*ali.getTax().value).toFixed());
	    		lineItem.appendChild(totalTaxAmount);
        	}
        	orderLines.appendChild(lineItem);
        }//Inner while loop
	}//Outer while loop        
	
	requestXml.submit.order.orderLines = orderLines;
	return requestXml;
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
    var output = WorldpayConstants.XMLHEADER + requestXml;
    return output;
}

function createTimeStamp(){
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

function createSRD(currentDate){
	if(customer.isAuthenticated()){
	var date = currentDate.getDate();
	var month = currentDate.getMonth();
	var monthr=(month+1);
	var year = currentDate.getFullYear();
	var format= new XML('<date dayOfMonth ="'+date+'" month ="'+monthr+'"  year ="'+year+'"/>');
	return format;
	}
}
function createAmt(){
	var format= new XML('<amount value="1" currencyCode="EUR" exponent="2"/>');
	return format;
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
    addBillingAddressDetails: addBillingAddressDetails,
    addBillingAddressDetailsFormat2: addBillingAddressDetailsFormat2,
    addShopperDetails: addShopperDetails,
    addInstallationDetails: addInstallationDetails,
    addContactDetails: addContactDetails,
    addGeneralDetails: addGeneralDetails,
    addShipmentAmountDetails: addShipmentAmountDetails,
    addTokenDetails: addTokenDetails,
    getPaymentDetails: getPaymentDetails,
    appendMandateInfo: appendMandateInfo,
    getOrderDetails: getOrderDetails,
    getCompleteXML: getCompleteXML,
    addDynamicInteractionType: addDynamicInteractionType
};
