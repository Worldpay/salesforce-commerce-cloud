'use strict';
/**
 * Controller that creates an order from the current basket. It's a pure processing controller and does
 * no page rendering. The controller is used by checkout and is called upon the triggered place order action.
 * It contains the actual logic to authorize the payment and create the order. The controller communicates the result
 * of the order creation process and uses a status object PlaceOrderError to set proper error states.
 * The calling controller is must handle the results of the order creation and evaluate any errors returned by it.
 *
 * @module controllers/WorldPay
 */


var app = require('app_storefront_controllers/cartridge/scripts/app');
var guard = require('app_storefront_controllers/cartridge/scripts/guard');
var Order = app.getModel('Order');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');

/**
 * Verifies a credit card against a valid card number and expiration date and possibly invalidates invalid form fields.
 * If the verification was successful a credit card payment instrument is created.
 */

function Handle(args) {
	var WorldPayHelper = require('~/cartridge/scripts/WorldPayHelper');
	 var result= WorldPayHelper.Handle(args);
	 return result;
}

/**
 * Authorize call for worldpay processor
 */
function Authorize(args) {
	var WorldPayHelper = require('~/cartridge/scripts/WorldPayHelper');
	var result= WorldPayHelper.Authorize(args);
	return result;
}

/**
 * APM lookup for worldpay processor
 */
function APMLookupService(){
	if(request.httpParameterMap.billingCountry.value){
		var ServiceFacade = require('int_worldpay/cartridge/scripts/service/ServiceFacade');
		var APMLookUp = ServiceFacade.APMLookupService(request.httpParameterMap.billingCountry.value); 
		if(APMLookUp.error){
	   		Logger.getLogger("worldpay").error("APM LookUp Service :Error code "+APMLookUp.errorCode+ " errorMessage "+APMLookUp.errorMessage);
		} else {
			 app.getView({
					 APMList : APMLookUp.apmList
						}).render('apmlookupjson');
		}
	}
}


/**
 * Handle 3D response for worldpay processor
 */
function HandleAuthenticationResponse(args){
	
	var Utils = require("int_worldpay/cartridge/scripts/common/Utils");
	var params  = request.getHttpParameters();
	var error = null;
	var OrderObj: dw.order.Order;
	//md - merchant supplied data contains the OrderNo
	var md = (params.containsKey("MD"))? params.get("MD")[0] : null;
	var orderNo = md;

	if(empty(orderNo)){
		Logger.getLogger("worldpay").error("Worldpay.ds HandleAuthenticationResponse :  Order no. not present in parameters");	
		error = Utils.WorldpayErrorMessage();
		FailOrder(OrderObj, error.errorMessage);
		return {error : true, success : false, errorMessage : error.errorMessage};
	}
	
	
	try{
	 	OrderObj = dw.order.OrderMgr.getOrder(orderNo);
	}
	catch(ex){
		Logger.getLogger("worldpay").error("Worldpay.ds HandleAuthenticationResponse :  Invalid Order ");	
		error = Utils.WorldpayErrorMessage();
		FailOrder(OrderObj, error.errorMessage);
		return {error : true, success : false, errorMessage : error.errorMessage};
	}
	
    // Fetch the APM Name from the Payment isntrument.
	var paymentIntrument = Utils.getPaymentInstrument(OrderObj);
	var apmName : String = paymentIntrument.getPaymentMethod();
	// Fetch the APM Type from the Payment Method i.e. if the Payment Methoid is of DIRECT or REDIRECT type.
	var paymentMthd= dw.order.PaymentMgr.getPaymentMethod(apmName);
	var WorldPayPreferences = require('int_worldpay/cartridge/scripts/object/WorldPayPreferences');
		WorldPayPreferences = new WorldPayPreferences();
	var preferences = WorldPayPreferences.WorldPayPreferencesInit(paymentMthd);
		
    if (preferences.missingPreferences()){
		Logger.getLogger("worldpay").error("Worldpay.ds HandleAuthenticationResponse : WorldPay preferences are not properly set.");
		error = Utils.WorldpayErrorMessage();
		FailImpl(OrderObj, error.errorMessage);
		return {error : true, success : false, errorMessage : error.errorMessage, orderNo: OrderObj.orderNo, orderToken: OrderObj.orderToken};
	}	
	
    var paRes = (params.containsKey("PaRes"))? params.get("PaRes")[0] : null;
	var issuerErrorResponseCodes = preferences.IssuerErrorResponseCodes;
 	
 	// Checks if paRes is exist in error codes (Issuer Response fro 3D check)
    var WorldPayConstants = require('int_worldpay/cartridge/scripts/common/WorldPayConstants');
 	if(paRes == null || paRes == WorldPayConstants.UNKNOWN_ENTITY || paRes == WorldPayConstants.CANCELLEDBYSHOPPER
		 || paRes == WorldPayConstants._3DERROR || paRes == WorldPayConstants._3DSINVALIDERROR ||  paRes == WorldPayConstants.NOT_IDENTIFIED_NOID ){
 		    var Utils = require('int_worldpay/cartridge/scripts/common/Utils');
			var errorMessage = Utils.getErrorMessage(paRes);
			Logger.getLogger("worldpay").error("Worldpay.ds HandleAuthenticationResponse : issuerResponse Error Message : " + errorMessage );
			FailImpl(OrderObj, errorMessage);
			return {error : true, success : false, errorMessage : errorMessage, issuerResponse : errorMessage, orderNo: OrderObj.orderNo, orderToken: OrderObj.orderToken};
		}
		//Capturing Issuer Response 
	var paymentforms = session.forms.billing.paymentMethods.creditCard;
	var SecondAuthorizeRequestResult = require('int_worldpay/cartridge/scripts/service/ServiceFacade').SecondAuthorizeRequestService(OrderObj,request,paymentforms,paymentIntrument,preferences);

	if(SecondAuthorizeRequestResult.error){
		Logger.getLogger("worldpay").error("Worldpay.ds HandleAuthenticationResponse : ErrorCode : "+ SecondAuthorizeRequestResult.errorCode + " : Error Message : " + SecondAuthorizeRequestResult.errorMessage );
		return {error : true, success : false, errorCode: SecondAuthorizeRequestResult.errorCode, errorMessage : SecondAuthorizeRequestResult.errorMessage, orderNo: OrderObj.orderNo, orderToken: OrderObj.orderToken};
  	}
	
	//success handling
	if (!empty(session.custom.order_id)) {
		OrderObj = Order.get(session.custom.order_id);
	} 
	
	 if (OrderObj==null || !OrderObj.object) {
		 app.getController('Cart').Show();
		return;
	}
	if (OrderObj.getStatus().value===dw.order.Order.ORDER_STATUS_FAILED) {
		Transaction.wrap(function () {
			if (OrderObj.object) {
			OrderObj.object.custom.worldpayMACMissingVal = true;
			} else {
				OrderObj.custom.worldpayMACMissingVal = true;
			}
		});
		error = Utils.WorldpayErrorMessage();
		app.getController('COBilling').Start({'errorMessage':error.errorMessage});
		return {error : true, success : false, errorMessage : error.errorMessage};
	}
	
	var WorldPayHelper = require('~/cartridge/scripts/WorldPayHelper');
 	var resultCheckAuthorization = WorldPayHelper.CheckAuthorization(SecondAuthorizeRequestResult.response, null);
	if(resultCheckAuthorization.error){
		FailImpl(OrderObj, resultCheckAuthorization.errorMessage);
		return {error : true, success : false, errorMessage : resultCheckAuthorization.lastEvent};
	} else {
		if (app.getController('COPlaceOrder').SubmitImpl(OrderObj.object).error) {
      	  app.getController('COSummary').Start();
       	  return;
    	}
		app.getController('COSummary').ShowConfirmation(OrderObj.object);
  		return;
	}
}

function FailOrder() {
	var order;
	if (!empty(session.custom.order_id)) {
		order = Order.get(session.custom.order_id);
	}
	if (order!=null) {
	     if (FailImpl(order.object, "").error) {
		   return app.getController('COSummary').Start();
		 }
	} else {
		app.getController('Cart').Show();
		return {success : false};
	}
}

function FailImpl(order, errorMessage) {
	var OrderMgr = require('dw/order/OrderMgr');
	var orderstatus;
    Transaction.wrap(function(){
    	 if (order instanceof dw.order.Order) {
    		 orderstatus = OrderMgr.failOrder(order);
    	 } else {
    		 orderstatus = OrderMgr.failOrder(order.object);
    	 }
	 });
	 if (!empty(orderstatus) && !orderstatus.isError()) {
	     app.getController('COBilling').Start({'errorMessage':errorMessage});
	     return {error: false};
	 } 
	 return {error: true, errorMessage : errorMessage};
}

/**
 * Notification for worldpay processor
 */
function Notify(args)
{
	var isValidateIPAddress  = Boolean(dw.system.Site.getCurrent().getCustomPreferenceValue('ValidateIPAddress'));
	
	var Utils = require("int_worldpay/cartridge/scripts/common/Utils");
	if(isValidateIPAddress){
		var validateIPStatus = Utils.ValidateIP();
		if (validateIPStatus.error) {
			return {error : true, success : false};
		}
	}
	var xmlString;
	xmlString = request.httpParameterMap.requestBodyAsString;
	if (xmlString==null) {
		Logger.getLogger("worldpay").error("Worldpay-Notify : Add Custom Object : xmlString IS NULL");
		return{error: true};
	}
	Transaction.wrap(function () {
	if (Utils.AddNotifyCustomObject(xmlString).error) {
		return{error: true};
    }
	});
	//ISML.renderTemplate('notifyResponsejson');
    app.getView().render('notifyResponsejson');
    return {error: false};
	
}

/**
* Service to get Notification updates (latest update and all updates) based on parameter "allupdates"
*/
function GetNotificationUpdates(args)
{
	var Utils = require('int_worldpay/cartridge/scripts/common/Utils');
	var WorldPayConstants = require('int_worldpay/cartridge/scripts/common/WorldPayConstants');
	var params = request.getHttpParameters();
	var orderNo = (params.containsKey("orderNo"))? params.get("orderNo")[0] : null;
	var allupdates = (params.containsKey("allupdates"))? params.get("allupdates")[0] : "";
	var ErrorCode;
	var ErrorMessage;
	var orderObj;
	if (!empty(orderNo)) {
		try{
			var OrderMgr = require('dw/order/OrderMgr');
			orderObj = OrderMgr.getOrder(orderNo);
		}catch(ex){
		 	ErrorCode = dw.web.Resource.msg("notify.error.code120","worldpayerror",null);
		 	ErrorMessage  = Utils.getErrorMessage(ErrorCode);
			app.getView({
			       		ErrorCode : ErrorCode,
			       		ErrorMessage : ErrorMessage
			    		}).render('errorjson');
			return;							 
		}		
	if (orderObj!=null) {
	   try{ 
		   	 var statusHist= orderObj.custom.transactionStatus;
		  	 var statusList = new dw.util.ArrayList(statusHist);
		  	 var latestStatus="";
		     if(statusList==null || statusList.length<=0)
			 { 	
			 	if (allupdates.equalsIgnoreCase("true")) {
			 	ErrorCode = WorldPayConstants.NOTIFYERRORCODE118;
			 	} else {
			 	ErrorCode = WorldPayConstants.NOTIFYERRORCODE119;
			 	}
				ErrorMessage  = Utils.getErrorMessage(ErrorCode);
				app.getView({
				       		ErrorCode : ErrorCode,
				       		ErrorMessage : ErrorMessage
				    		}).render('errorjson');
			 }
			 else if (allupdates.equalsIgnoreCase("true")) {
				app.getView({
				       		statusList : statusList
				    		}).render('allstatusjson');
			 } else {	
				app.getView({
				       		status : statusList.get(0)
				    		}).render('lateststatusjson');
			  }	
	    }  
	    catch(ex){
	    	 var errorCode=WorldPayConstants.NOTIFYERRORCODE115;
			 var errorMessage = Utils.getErrorMessage(errorCode);
	     	 Logger.getLogger("worldpay").error("Order Notification : Get All Status Update Notifications recieved : " +errorCode+ " : " +errorMessage+" : " +ex);
				app.getView({
				       		ErrorCode : errorCode,
				       		ErrorMessage : errorMessage
				    		}).render('errorjson');
	    }   
		return;							 
 	}
	}
 	ErrorCode = dw.web.Resource.msg("notify.error.code120","worldpayerror",null);
 	ErrorMessage  = Utils.getErrorMessage(ErrorCode);
	app.getView({
	       		ErrorCode : ErrorCode,
	       		ErrorMessage : ErrorMessage
	    		}).render('errorjson');
	return;							 
}
/**
 * Handle redirection for redirect credit card response or APM where Mac is compared for Authorized and Refused
 */

function HandleRedirection(order){
	var Utils = require("int_worldpay/cartridge/scripts/common/Utils");
	if (empty(order)) {
		app.getController('Cart').Show();
		return {success : false};
	} else {
		var paymentStatus = request.httpParameterMap.paymentStatus.value;
		var error="";
		var selectedPayment  = session.forms.billing.paymentMethods.selectedPaymentMethodID.value.toString();
		var WorldPayConstants = require('int_worldpay/cartridge/scripts/common/WorldPayConstants');
		
		if (!empty(paymentStatus) && paymentStatus==WorldPayConstants.AUTHORIZED) {
			if(selectedPayment != WorldPayConstants.IDEAL && selectedPayment != WorldPayConstants.PAYPAL) {
				var orderInfo = Utils.getWorldPayOrderInfo(paymentStatus);
				var macstatus = Utils.VerifyMac(orderInfo.mac, orderInfo.orderKey, orderInfo.orderAmount, orderInfo.orderCurrency, orderInfo.orderStatus);
				if (macstatus.error) {
					Transaction.wrap(function () {
						order.custom.worldpayMACMissingVal = true;
					});
					error = Utils.WorldpayErrorMessage();
					FailImpl(order, error.errorMessage);
					Logger.getLogger("worldpay").error(" mac issue " );
					return {error : true, success : false, errorMessage : error.errorMessage};
				}
			}
			session.custom.order_id="";
			if (order.status.value == dw.order.Order.ORDER_STATUS_FAILED) {
				Transaction.wrap(function () {
					order.custom.worldpayMACMissingVal = true;
				});
				error = Utils.WorldpayErrorMessage();
				app.getController('COBilling').Start({'errorMessage':error.errorMessage});
				return {success : false};
			}
			return {success : true};			
		} else if (!empty(paymentStatus) && paymentStatus==WorldPayConstants.PENDING) {
			var PendingStatus = request.httpParameterMap.status.value;
			if (empty(PendingStatus) || PendingStatus.equals(WorldPayConstants.OPEN)) {
				if (order.status.value == dw.order.Order.ORDER_STATUS_FAILED) {
					error = Utils.WorldpayErrorMessage();
					app.getController('COBilling').Start({'errorMessage':error.errorMessage});
					return {success : false};
				}
				// Send order confirmation and clear used forms within the checkout process.
				Utils.sendEmailNotification(order);
			    // Clears all forms used in the checkout process.
			    Utils.worldPayClearFormElement();
			    app.getController('COSummary').ShowConfirmation(order);
			    return {success : false};
			} else {
				error = Utils.WorldpayErrorMessage();
				FailImpl(order, error.errorMessage);
				return {error: true, success : false, errorMessage : error.errorMessage};
			}
		} else {
			var orderInfo = Utils.getWorldPayOrderInfo(paymentStatus);
			if(selectedPayment != WorldPayConstants.IDEAL && selectedPayment != WorldPayConstants.PAYPAL) {
				if (!empty(paymentStatus) && (paymentStatus==WorldPayConstants.CANCELLEDSTATUS || paymentStatus==WorldPayConstants.REFUSED)) {
					if (require("int_worldpay/cartridge/scripts/common/Utils").VerifyMac(orderInfo.mac, orderInfo.orderKey, orderInfo.orderAmount, orderInfo.orderCurrency, orderInfo.orderStatus).error) {
						app.getController('Cart').Show();
						return {success : false};
					};
					if (!empty(paymentStatus) && paymentStatus==WorldPayConstants.CANCELLEDSTATUS) {
						Transaction.wrap(function () {
							order.custom.transactionStatus = new dw.util.ArrayList("POST_AUTH_CANCELLED");
							return {success : false};
						});
					}
				}
			}
			error = Utils.WorldpayErrorMessage();
			if (FailImpl(order, error.errorMessage).error) {
		        app.getController('COBilling').Start({'errorMessage':error.errorMessage});
				return {error : true, success : false, errorMessage : error.errorMessage};
			}
			return {error : true, success : false};
		}
		
	}
}

/**
 * Load payment methods on billing page
 */
function LoadPaymentMethods(){
	var cart;
	cart = app.getModel('Cart').get();
	var applicableCreditCards= app.getController('COBilling').InitCreditCardList(cart).ApplicableCreditCards;
	 
	app.getView({
	       		ApplicableCreditCards : applicableCreditCards,
	       		Basket : cart.object,
	       		selectedPaymentID: request.httpParameterMap.selectedPaymentMethodId.value
	    		}).render('worldpaypaymentmethods');
}
/*
 * Module exports
 */

/*
 * Local methods
 */
exports.Handle = Handle;
exports.Authorize = Authorize;
exports.HandleRedirection = HandleRedirection; 
exports.Notify =guard.ensure(['https', 'post'],  Notify);
exports.GetNotificationUpdates =guard.ensure(['https'],  GetNotificationUpdates);
exports.LoadPaymentMethods =guard.ensure(['https', 'post'], LoadPaymentMethods);  
exports.HandleAuthenticationResponse =guard.ensure(['https', 'post'],  HandleAuthenticationResponse);
exports.APMLookupService =guard.ensure(['https', 'post'], APMLookupService); 