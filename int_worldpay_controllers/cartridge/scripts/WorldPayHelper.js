/* API Includes */
var app = require('app_storefront_controllers/cartridge/scripts/app');
var Order = app.getModel('Order');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var PaymentInstrumentUtils = require('int_worldpay/cartridge/scripts/common/PaymentInstrumentUtils');
var WorldPayConstants = require('int_worldpay/cartridge/scripts/common/WorldPayConstants');
var Logger = require('dw/system/Logger');
var Utils = require("int_worldpay/cartridge/scripts/common/Utils");
/**
 * This controller implements the billing logic. It is used by both the single shipping and the multi shipping
 * scenario and is responsible for providing the payment method selection as well as entering a billing address.
 *
 * @module scripts/WorldPayHelper
 */
 /**
 * Replace token from old to new card
 */
function ReplaceToken(newCreditCard, creditcard){
	if (Site.getCurrent().getCustomPreferenceValue("WorldPayEnableTokenization") && !empty(creditcard.getCreditCardToken())) {
			newCreditCard.setCreditCardToken(creditcard.getCreditCardToken());
			//return true;
	}
}
/**
 * Retrive order based on order_id from session
 */
function GetOrder(order){
	if (empty(order)) {
		if (!empty(session.custom.order_id)) {
			var orderObj = Order.get(session.custom.order_id);
			 if (orderObj.object && (request.httpParameterMap.order_token.stringValue == orderObj.getOrderToken())) {
				 return {success : true, Order : orderObj};
			 }
			 return {error : true, Order : null};
		}
		return {error : true, Order : null};
	} 
	return {success : true, Order : order};
}




/**
 * Handle credit card
 */
function HandleCreditCard(cart){


	 var tokenId :String="";

	if(dw.system.Site.getCurrent().getCustomPreferenceValue("WorldPayEnableTokenization") && customer.authenticated){		
		 var wallet = customer.getProfile().getWallet();
		
    	 var paymentInstruments = wallet.getPaymentInstruments(dw.order.PaymentInstrument.METHOD_CREDIT_CARD);
    	 var matchedPaymentInstrument= require("int_worldpay/cartridge/scripts/common/PaymentInstrumentUtils").getTokenPaymentInstrument(paymentInstruments,session.forms.billing.paymentMethods.creditCard.number.value,session.forms.billing.paymentMethods.creditCard.type.value);
	     	if(!empty(matchedPaymentInstrument) && !empty(matchedPaymentInstrument.getCreditCardToken())){
	     		tokenId = matchedPaymentInstrument.getCreditCardToken();
	     	}
	
	}
	if(empty(tokenId)){
		var PaymentMgr = require('dw/order/PaymentMgr');
		var paymentCard = PaymentMgr.getPaymentCard(session.forms.billing.paymentMethods.creditCard.type.value);
		var CreditCardStatus = paymentCard.verify(session.forms.billing.paymentMethods.creditCard.expiration.month.value, 
				session.forms.billing.paymentMethods.creditCard.expiration.year.value, session.forms.billing.paymentMethods.creditCard.number.value,
				session.forms.billing.paymentMethods.creditCard.cvn.value);
	
		var creditCardForm = session.forms.billing.paymentMethods.creditCard;
		if( CreditCardStatus == null || !creditCardForm.valid) {
		return {error : true};
		}
		if(CreditCardStatus.status !== dw.system.Status.OK )
		{
			// invalidate the payment card form elements
			var items : Iterator = CreditCardStatus.items.iterator();
			while( items.hasNext() )
			{
				var item : dw.system.StatusItem = items.next();
				
				switch( item.code )
				{
					case dw.order.PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER:
						creditCardForm.number.setValue(creditCardForm.number.htmlValue);
						creditCardForm.number.invalidateFormElement();
						creditCardForm.encryptedData.setValue("");
						continue;
		
					case dw.order.PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE:
						creditCardForm.expiration.month.invalidateFormElement();
						creditCardForm.expiration.year.invalidateFormElement();
						creditCardForm.encryptedData.setValue("");
						continue;
		
					case dw.order.PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE:
						creditCardForm.cvn.invalidateFormElement();
						creditCardForm.encryptedData.setValue("");
				}
			}
			return {error : true};
		}	
   }
		Transaction.wrap(function () {
			PaymentInstrumentUtils.removeExistingPaymentInstruments(cart);
			var paymentInstrument = cart.createPaymentInstrument(dw.order.PaymentInstrument.METHOD_CREDIT_CARD, cart.getNonGiftCertificateAmount());
	
			paymentInstrument.creditCardHolder = session.forms.billing.paymentMethods.creditCard.owner.value;
			paymentInstrument.creditCardNumber = session.forms.billing.paymentMethods.creditCard.number.value;
			paymentInstrument.creditCardType = session.forms.billing.paymentMethods.creditCard.type.value;
			paymentInstrument.creditCardExpirationMonth = session.forms.billing.paymentMethods.creditCard.expiration.month.value;
			paymentInstrument.creditCardExpirationYear = session.forms.billing.paymentMethods.creditCard.expiration.year.value;
			paymentInstrument.custom.WorldPayMID = dw.system.Site.getCurrent().getCustomPreferenceValue('WorldPayMerchantCode');
			if(!empty(tokenId)){
				paymentInstrument.creditCardToken= tokenId;
			} else if(session.forms.billing.paymentMethods.creditCard.saveCard.value && dw.system.Site.getCurrent().getCustomPreferenceValue("WorldPayEnableTokenization")){
				paymentInstrument.custom.wpTokenRequested =true;
			}
		});
		
		return {success : true};
	
	
}

/**
 * Handle special APMs
 */
function HandleSpecialAPM(cart,paymentMethod){
	Transaction.wrap(function () {
		PaymentInstrumentUtils.removeExistingPaymentInstruments(cart);
		var paymentInstrument = cart.createPaymentInstrument(paymentMethod, cart.getNonGiftCertificateAmount());
		
		if(paymentMethod.equals(WorldPayConstants.IDEAL)){
			paymentInstrument.custom.bank = session.forms.billing.paymentMethods.bank.value;
		}
		
		//
		if(paymentMethod.equals(WorldPayConstants.BOLETO)){
			paymentInstrument.custom.cpf =  session.forms.billing.paymentMethods.creditCard.cpf.value;
		}
		if(paymentMethod.equals(WorldPayConstants.GIROPAY)){
			paymentInstrument.custom.bankCode =  session.forms.billing.paymentMethods.bankCode.value;
		}
		
	});	
	return {success : true};
}
/**
 * Handle redirection for redirect credit card response or APM
 */
function HandleRedirectOrAPM(cart,paymentMethod){
	var paymentInstrument;
	if (paymentMethod==WorldPayConstants.WORLDPAY && Site.getCurrent().getCustomPreferenceValue("WorldPayEnableTokenization") && customer.authenticated 
		&& !empty(session.forms.billing.paymentMethods.creditCard.number.value)) {
		session.forms.billing.paymentMethods.selectedPaymentMethodID.value=WorldPayConstants.CREDITCARD;
		var wallet = customer.getProfile().getWallet();
		var paymentInstruments = wallet.getPaymentInstruments(dw.order.PaymentInstrument.METHOD_CREDIT_CARD);
    	var matchedPaymentInstrument= require("int_worldpay/cartridge/scripts/common/PaymentInstrumentUtils").getTokenPaymentInstrument(paymentInstruments,session.forms.billing.paymentMethods.creditCard.number.value,session.forms.billing.paymentMethods.creditCard.type.value);
     	if(!empty(matchedPaymentInstrument) && !empty(matchedPaymentInstrument.getCreditCardToken())){
     		var tokenId = matchedPaymentInstrument.getCreditCardToken();

			Transaction.wrap(function () {
				paymentInstrument = cart.createPaymentInstrument(dw.order.PaymentInstrument.METHOD_CREDIT_CARD, cart.getNonGiftCertificateAmount());
		
				paymentInstrument.creditCardHolder = session.forms.billing.paymentMethods.creditCard.owner.value;
				paymentInstrument.creditCardNumber = session.forms.billing.paymentMethods.creditCard.number.value;
				paymentInstrument.creditCardType = session.forms.billing.paymentMethods.creditCard.type.value;
				paymentInstrument.creditCardExpirationMonth = session.forms.billing.paymentMethods.creditCard.expiration.month.value;
				paymentInstrument.creditCardExpirationYear = session.forms.billing.paymentMethods.creditCard.expiration.year.value;
				paymentInstrument.custom.WorldPayMID = dw.system.Site.getCurrent().getCustomPreferenceValue('WorldPayMerchantCode');
				if(!empty(tokenId)){
					paymentInstrument.creditCardToken= tokenId;
				} else if(session.forms.billing.paymentMethods.creditCard.saveCard.value && dw.system.Site.getCurrent().getCustomPreferenceValue("WorldPayEnableTokenization")){
					paymentInstrument.custom.wpTokenRequested =true;
				}
			});
			var ccCvn = session.forms.billing.paymentMethods.creditCard.cvn.value;
			return {success : true, ccCvn : ccCvn, PaymentInstrument : paymentInstrument};
     	}
	}
	Transaction.wrap(function () {
		paymentInstrument = cart.createPaymentInstrument(paymentMethod, cart.getNonGiftCertificateAmount());
		if(paymentMethod==WorldPayConstants.WORLDPAY && session.forms.billing.paymentMethods.creditCard.saveCard.value
				&& dw.system.Site.getCurrent().getCustomPreferenceValue("WorldPayEnableTokenization") 
				&& customer.authenticated){
			paymentInstrument.custom.wpTokenRequested =true;
		}
	});
	
	return {success : true};
}

/**
 * Update Token details in customer payment cards
 */
function AddOrUpdateToken(responseData , CustomerObj : dw.customer.Customer){
	if(!empty(CustomerObj) && responseData.authenticatedShopperID.valueOf().toString()==CustomerObj.profile.customerNo && !empty(responseData.cardNumber)){
		var wallet = CustomerObj.getProfile().getWallet();
		var paymentInstruments = wallet.getPaymentInstruments(dw.order.PaymentInstrument.METHOD_CREDIT_CARD);
		var matchedPaymentInstrument= require("int_worldpay/cartridge/scripts/common/PaymentInstrumentUtils").getTokenPaymentInstrument(paymentInstruments,session.forms.billing.paymentMethods.creditCard.number.value,session.forms.billing.paymentMethods.creditCard.type.value);
		
		if(empty(matchedPaymentInstrument)){
			   Transaction.begin();
       			 var paymentInstrument = wallet.createPaymentInstrument(dw.order.PaymentInstrument.METHOD_CREDIT_CARD);
				   paymentInstrument=require("int_worldpay/cartridge/scripts/common/PaymentInstrumentUtils").copyPaymentCardToInstrument(paymentInstrument,responseData.cardNumber.valueOf().toString(),
					responseData.cardBrand.valueOf().toString(),new Number(responseData.cardExpiryMonth.valueOf()),new Number(responseData.cardExpiryYear.valueOf()),
					responseData.cardHolderName.valueOf().toString(),responseData.paymentTokenID.valueOf().toString());
			      if(empty(paymentInstrument)){
			      	Transaction.rollback();
			      }
		      Transaction.commit();
		} else if(empty(matchedPaymentInstrument.getCreditCardToken())){
			Transaction.wrap(function () {
				matchedPaymentInstrument= require("int_worldpay/cartridge/scripts/common/PaymentInstrumentUtils").copyPaymentCardToInstrument(matchedPaymentInstrument,null,null,null,null,null,responseData.paymentTokenID.valueOf().toString());
			});
		}
	}
	return {success:true};
}

/**
 * Return applicable cards based on tokenization and encryption setting in WorldPay
 */
function AvailableCreditCards(ApplicableCreditCards){
	if(!empty(ApplicableCreditCards)){
		var cseEnabled = Site.getCurrent().getCustomPreferenceValue('WorldpayEnableClientSideEncryption');
		var tokenEnabled = Site.getCurrent().getCustomPreferenceValue('WorldPayEnableTokenization');
		if (!tokenEnabled && cseEnabled) {
			return new dw.util.ArrayList();
		} else if (tokenEnabled) {
			var NewApplicableCreditCards = new dw.util.ArrayList();
		    for (var i = 0; i < ApplicableCreditCards.length; i++) {
				var ApplicableCreditCard = ApplicableCreditCards[i];
				if (!empty(ApplicableCreditCard.getCreditCardToken())) {
					NewApplicableCreditCards.add(ApplicableCreditCard);
				}
			}
			return NewApplicableCreditCards;
		}
	}
	return ApplicableCreditCards;
}



function CreateCCAuthorizeRequest(cart){
	
	
	

}


/**
 * Verifies a credit card against a valid card number and expiration date and possibly invalidates invalid form fields.
 * If the verification was successful a credit card payment instrument is created.
 */
function Handle(args) {
	var cart = app.getModel('Cart').get(args.Basket);

    var paymentMethod :String = session.forms.billing.paymentMethods.selectedPaymentMethodID.value;
	Transaction.wrap(function () {
		PaymentInstrumentUtils.removeExistingPaymentInstruments(cart);
	});
    if(!empty(paymentMethod) && paymentMethod.equals(dw.order.PaymentInstrument.METHOD_CREDIT_CARD)){
    	return	HandleCreditCard(cart);
	} else if(!empty(paymentMethod) && (paymentMethod.equals(WorldPayConstants.IDEAL) || paymentMethod.equals(WorldPayConstants.BOLETO))){
		return HandleSpecialAPM(cart,paymentMethod);
	} else if (!empty(paymentMethod)){
		return	HandleRedirectOrAPM(cart,paymentMethod);
	}
}


/**
 * Authorizes a payment using a credit card. The payment is authorized by using the BASIC_CREDIT processor
 * only and setting the order no as the transaction ID. Customizations may use other processors and custom
 * logic to authorize credit card payment.
 */
function Authorize(args) {
	var orderNo = args.OrderNo;
	var OrderMgr = require('dw/order/OrderMgr');
	var order : dw.order.Order = OrderMgr.getOrder(orderNo);
	var paymentInstrument = args.PaymentInstrument;
	var PaymentMgr = require('dw/order/PaymentMgr');
	var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
	// Fetch the APM Name from the Payment isntrument.
	var apmName : String = paymentInstrument.getPaymentMethod();
	// Fetch the APM Type from the Payment Method i.e. if the Payment Methoid is of DIRECT or REDIRECT type.
	var paymentMthd : dw.order.PaymentMethod = PaymentMgr.getPaymentMethod(apmName);
	var apmType : String = paymentMthd.custom.type.toString();
	var WorldPayPreferences = require('int_worldpay/cartridge/scripts/object/WorldPayPreferences');
	var worldPayPreferences = new WorldPayPreferences();
	var preferences = worldPayPreferences.WorldPayPreferencesInit(paymentMthd);
	
	Transaction.wrap(function () {
		paymentInstrument.paymentTransaction.transactionID = orderNo;
		paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
	    paymentInstrument.custom.WorldPayMID = preferences.merchantCode;
	});
	
	if(paymentInstrument.paymentMethod.equals(dw.order.PaymentInstrument.METHOD_CREDIT_CARD)){

	    if(empty(order)){
	  	  Logger.getLogger("worldpay").error("SendCCAuthorizeRequest : Invalid Order");	
			return {error : true};
	    } 
		session.custom.order_id = order.orderNo;
    	var paymentforms = session.forms.billing.paymentMethods.creditCard;
        
    	var ServiceFacade = require('int_worldpay/cartridge/scripts/service/ServiceFacade');
	    var CCAuthorizeRequestResult = ServiceFacade.CCAuthorizeRequestService(order,request,paymentforms,paymentInstrument,preferences);
			 
		if(CCAuthorizeRequestResult.error){
			Logger.getLogger("worldpay").error("Worldpyay helper SendCCAuthorizeRequest : ErrorCode : "+ CCAuthorizeRequestResult.errorCode + " : Error Message : " + CCAuthorizeRequestResult.errorMessage );
			return {error : true, errorCode: CCAuthorizeRequestResult.errorCode, errorMessage: CCAuthorizeRequestResult.errorMessage};
		}  
    
	    var response = CCAuthorizeRequestResult.serviceresponse;
  		//save token details in order object 
  		Transaction.wrap(function () {
		  	PaymentInstrumentUtils.updatePaymentInstrumentToken(response, paymentInstrument);
		});
		
  		if(response.is3DSecure){
  	   		session.custom.echoData = response.echoData;
			Transaction.wrap(function () {
		  	   		paymentInstrument.custom.resHeader= CCAuthorizeRequestResult.responseObject.responseHeader;
			});
  	   		return {
	 			is3D : true,
	         	redirectUrl : response.issuerURL,
	         	paRequest : response.paRequest,
	         	termUrl   : preferences.getTermURL().toString()
	        };
  		}else{
  			var serviceResponse = response;
			return CheckAuthorization(serviceResponse, paymentInstrument);
  		}
	}else{
		var paymentforms = session.forms.billing;
		var countryCode : String = order.getBillingAddress().countryCode;
		session.custom.order_id = orderNo;
 		var isValidCustomOptionsHPP = false;
 		var isLightBox = false;
 		var redirectURL ="";
 		var orderamount = Utils.calculateNonGiftCertificateAmount( order );
 		var ServiceFacade = require('int_worldpay/cartridge/scripts/service/ServiceFacade');
		var authorizeOrderResult = ServiceFacade.AuthorizeOrderService(orderamount,order, paymentInstrument , paymentforms,customer,paymentMthd);
		if(authorizeOrderResult.error){
		 	Logger.getLogger("worldpay").error("AuthorizeOrder.ds : ErrorCode : "+ authorizeOrderResult.errorCode + " : Error Message : " + authorizeOrderResult.errorMessage );
			return {error : true, errorCode: authorizeOrderResult.errorCode, errorMessage: authorizeOrderResult.errorMessage};
	  	} 
	
		if(apmName.equals(WorldPayConstants.ELV)){
			Transaction.wrap(function () {
				order.custom.mandateID = paymentforms.paymentMethods.elvMandateID.value;
			});
			var URLUtils = require('dw/web/URLUtils');
			redirectURL = URLUtils.https("COPlaceOrder-Submit",WorldPayConstants.ORDERTOKEN,order.orderToken,WorldPayConstants.PAYMENTSTATUS, WorldPayConstants.PENDING,WorldPayConstants.APMNAME,apmName).toString();
		} else {
			redirectURL = authorizeOrderResult.response.reference.toString();
			
			if(redirectURL.indexOf("&amp;") > 0){
					redirectURL = redirectURL.replace('&amp;', '&');
			 }
					
			if (!empty(paymentMthd.custom.wordlpayHPPCustomOptionsJSON) && !empty(Utils.isValidCustomOptionsHPP(paymentMthd))) {
						isValidCustomOptionsHPP = true;
				if (!empty(paymentforms.paymentMethods.cards.value)) {
				 	session.custom.preferedCard = paymentforms.paymentMethods.cards.value;
				}
			}
			if (!isValidCustomOptionsHPP) {
				if(apmType.equalsIgnoreCase(WorldPayConstants.DIRECT)){ 
					redirectURL = Utils.createDirectURL(redirectURL, orderNo, countryCode);
				}else{
					redirectURL = Utils.createRedirectURL(apmName,redirectURL, orderNo, countryCode, order.orderToken);
				}
			} else {
				session.custom.worldpayRedirectURL = redirectURL;
				var o = JSON.parse(paymentMthd.custom.wordlpayHPPCustomOptionsJSON);
				if (empty(o.type) || o.type.equalsIgnoreCase(WorldPayConstants.LIGHTBOX)) {
					isLightBox = true; 
				}
			}
		}
		if(paymentInstrument.paymentMethod.equals(WorldPayConstants.KONBINI)){
		       return  {authorized : true, isPaymentKonbini : true, redirectUrl : redirectURL};
		   } else if (isValidCustomOptionsHPP) {
			   Logger.getLogger("worldpay").debug("session.custom.worldpayRedirectURL : "+ session.custom.worldpayRedirectURL + " : lightbox : " + isLightBox +" order id : "+session.custom.order_id);
			   return {
	   	 			returnToPage : true
	   	 		}; 
		   } else {
		   	 	return {
		   	 			redirect : true,
		   	 			redirectUrl : redirectURL
		   	 	};
		   }
	}
}
/**
 * Check Authozation response as last event from worldpay
 */
function CheckAuthorization(serviceResponse, paymentInstrument) {
	if(serviceResponse.lastEvent ==WorldPayConstants.AUTHORIZED){
		if (paymentInstrument!=null && paymentInstrument.paymentMethod.equals(WorldPayConstants.ELV)) {
			return {authorized : true};
		}
		if (Site.getCurrent().getCustomPreferenceValue("WorldPayEnableTokenization") && customer.authenticated && !empty(serviceResponse.paymentTokenID)) {
			AddOrUpdateToken(serviceResponse, customer);
		}
		return {authorized : true};
	} else if (serviceResponse.lastEvent==WorldPayConstants.CANCELLEDSTATUS) {
		return {error : true, errorMessage : dw.web.Resource.msg('worldpay.error.codecancelled','worldpayerror',null)};
	} else {
		return {error : true, errorkey : "worldpay.error.code"+serviceResponse.errorCode, errorMessage : dw.web.Resource.msg("worldpay.error.code"+serviceResponse.errorCode,'worldpayerror',null)};
	}
}



/**
 * Replace the Payment Instrument with matching Customer Payment Instrument along with card token. Match criteria:- last 4 digits of crad number and card type
 */
function ReplacePaymentInstrument(paymentInstrument, customerPaymentInstruments){
	var cardNumber = session.forms.paymentinstruments.creditcards.newcreditcard.number.value;
	var cardType = session.forms.paymentinstruments.creditcards.newcreditcard.type.value;
	try {
   		 var creditCardInstrument : dw.customer.CustomerPaymentInstrument = null;
   	 	// find credit card in payment instruments
   	 	creditCardInstrument = PaymentInstrumentUtils.getTokenPaymentInstrument(customerPaymentInstruments, cardNumber, cardType);
	   	 if (!empty(creditCardInstrument)) {
	   	 	var wallet = customer.getProfile().getWallet();
	   	 	wallet.removePaymentInstrument(creditCardInstrument);
			if(!empty(creditCardInstrument.getCreditCardToken())){
	     		paymentInstrument.setCreditCardToken(creditCardInstrument.getCreditCardToken());
	     	}
	   	 }
    }  
    catch(ex){
     	 Logger.getLogger("worldpay").error("WorldPayHelper-ReplacePaymentInstrument error recieved : " +ex.message);
    }   
	return {};		
}
exports.Handle = Handle;
exports.Authorize = Authorize;
exports.ReplaceToken = ReplaceToken;
exports.CheckAuthorization = CheckAuthorization;
exports.AddOrUpdateToken = AddOrUpdateToken;
exports.AvailableCreditCards = AvailableCreditCards;
exports.GetOrder = GetOrder;
exports.ReplacePaymentInstrument = ReplacePaymentInstrument;



