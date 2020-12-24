/* eslint-disable */
var Logger = require('dw/system/Logger');

function ResponseData(){}

ResponseData.prototype =
{
  parseXML : function (responseXML)
  {
    this.status = false;
    this.error = false;
    this.errorMessage = "";
    this.is3DSecure =false;
    this.errorCode="0";
    this.declineCode="";
    this.authID="";
    this.cardNumber="";
    this.cvcResultCode="";
    this.avsResultCode="";
    this.transactionIdentifier="";
    this.aaVPostcodeResultCode="";
    this.aaVAddressResultCode="";
    this.authenticatedShopperID="";
    this.tokenEvent="";
    this.paymentTokenID="";
    this.paymentTokenExpiryDay="";
    this.paymentTokenExpiryMonth="";
    this.paymentTokenExpiryYear="";
    this.tokenEventReference="";
    this.tokenReason="";
    this.cardExpiryMonth="";
    this.cardExpiryYear="";
    this.cardHolderName="";
    this.cardBrand="";
    this.lastEvent="";
    this.bin= "";
    this.isCancelReceived=false;
    this.isELV=false;
    this.orderCode="";
    this.currencyCode="";
    this.debitCreditIndicator="";
    this.amount;
    this.paymentMethod='';
    this.primeRoutingResponse='';
    this.threeDSVersion = '';
	this.transactionId3DS = '';
    this.acsURL = '';
    this.payload = '';
    this.ThreeDSecureResult= '';
    this.exemptionResult = '';
    this.exemptionReason = '';
    this.sourceType = '';
    this.availableBalance = '';
    this.prepaidCardType = '';
    this.reloadable = '';
    this.virtualAccountNumber = '';
    this.cardProductType = '';
    this.accountRangeId = '';
    this.issuerCountry = '';
    this.affluence = '';
    this.captureAmount = '';
    this.fraudSightScore = '';
    this.fraudSightMessage = '';
    this.fraudSightReason = '';
    this.riskFinalScore = '';
    this.riskMessage = '';
    this.riskProvider = '';
    try {
      this.content = new XML(responseXML);
    } catch ( ex ){
      this.status = false;
      Logger.getLogger("worldpay").error("Exception occured while parsing xml:" + responseXML + 'exception-' + ex);
      return;
    }
    var c = this.content;
    try {
      if (this.content.localName() == "paymentService"){
        var temp = this.content;
        this.merchantCode = temp.attribute('merchantCode').toString();


        if (('reply' in temp) && ('error' in temp['reply'])){
          this.error = true;
          temp = temp.reply.error.valueOf();
          this.errorMessage = temp;
          this.errorCode = temp.attribute('code').toString();
          Logger.getLogger("worldpay").error("Payment service error response, code {1} : {2} ",
            temp.attribute('code').toString(), temp);
        }

      //Capture Service XML Data Parsing
        if (('reply' in temp) && ('ok' in temp['reply']) && ('captureReceived' in temp.reply.ok)){
			temp = temp.reply.ok.valueOf();
			this.orderCode = temp.captureReceived.attribute('orderCode').toString()
			this.currencyCode = temp.captureReceived.amount.attribute('currencyCode').toString();
			this.debitCreditIndicator = temp.captureReceived.amount.attribute('debitCreditIndicator').toString();
			this.amount = Number(temp.captureReceived.amount.attribute('value').toString())/Math.pow(10,Number(temp.captureReceived.amount.attribute('exponent').toString()));
			this.status = true;
    }

        if (('reply' in temp) && ('orderStatus' in temp['reply'])){
          temp = temp.reply.orderStatus.valueOf();
          this.orderCode = temp.attribute('orderCode').toString();
          if ('challengeRequired' in temp){
        	  if('threeDSChallengeDetails' in temp.challengeRequired){
        		  this.threeDSVersion = temp.challengeRequired.threeDSChallengeDetails.threeDSVersion;
        		  this.transactionId3DS =temp.challengeRequired.threeDSChallengeDetails.transactionId3DS;
        		  this.acsURL =temp.challengeRequired.threeDSChallengeDetails.acsURL;
        		  this.payload = temp.challengeRequired.threeDSChallengeDetails.payload;
        	  }

          }
          if ('ThreeDSecureResult' in temp){
        	  this.ThreeDSecureResult = 'authenticated';
          }
          if('exemptionResponse' in temp){
        	  this.exemptionResult = temp.exemptionResponse.attribute('result');
        	  this.exemptionReason = temp.exemptionResponse.attribute('reason');
          }
          if('error' in temp){
            temp = temp.error.valueOf();
            this.errorMessage = temp;
            this.errorCode = temp.attribute('code').toString();
            this.error =true;
          }
          if ('payment' in temp) {
          if('schemeResponse' in temp.payment){
        	  this.transactionIdentifier =temp.payment.schemeResponse.transactionIdentifier;
            }
          }
          if ('payment' in temp) {
          if ('primeRoutingResponse' in temp.payment) {
            	  this.primeRoutingResponse =temp.payment.primeRoutingResponse;
                }
        }



          if ('payment' in temp) {
            this.lastEvent = temp.payment.lastEvent;
            if(empty(temp.payment.IssuerResponseCode.attribute('code').toString()) && temp.payment.lastEvent.equals('REFUSED')){
              if(!empty(temp.payment.ISO8583ReturnCode.attribute('code').toString())){
                this.errorCode = temp.payment.ISO8583ReturnCode.attribute('code').toString();
                this.declineCode= temp.payment.ISO8583ReturnCode.attribute('code').toString();
              }
            }
            this.paymentMethod = !empty(temp.payment.paymentMethod) ? temp.payment.paymentMethod : '';
            var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
            if((!empty(temp.payment.paymentMethod) && temp.payment.paymentMethod == WorldpayConstants.ELV )){
             this.isELV=true;
            }

               if(!empty(temp.payment.AuthorisationId.attribute('id').toString())){
              this.authID=temp.payment.AuthorisationId.attribute('id').toString();
            }
            if(!empty(temp.payment.IssuerResponseCode.attribute('code').toString())){
              this.errorCode  = temp.payment.IssuerResponseCode.attribute('code').toString().toString();
              this.declineCode= temp.payment.IssuerResponseCode.attribute('code').toString().toString();
            }
            if(empty(temp.payment.IssuerResponseCode.attribute('code').toString().toString()) && temp.payment.lastEvent.equals('REFUSED')){
              if(!empty(temp.payment.ISO8583ReturnCode.attribute('code').toString())){
                this.errorCode = temp.payment.ISO8583ReturnCode.attribute('code').toString().toString();
                this.declineCode= temp.payment.ISO8583ReturnCode.attribute('code').toString().toString();
              }
            }

            if(!empty(temp.payment.CVCResultCode.attribute('description').toString())){
            this.cvcResultCode=temp.payment.CVCResultCode.attribute('description').toString();
            }

            if(!empty(temp.payment.AVSResultCode.attribute('description').toString())){
            this.avsResultCode=temp.payment.AVSResultCode.attribute('description').toString();
            }

            if(!empty(temp.payment.AAVAddressResultCode.attribute('description').toString())){
             this.aaVAddressResultCode=temp.payment.AAVAddressResultCode.attribute('description').toString();
            }

            if(!empty(temp.payment.AAVPostcodeResultCode.attribute('description').toString())){
             this.aaVPostcodeResultCode=temp.payment.AAVPostcodeResultCode.attribute('description').toString();
            }

            if(!empty(temp.payment.ThreeDSecureResult.attribute('description').toString())){
             this.threeDSecureResult=temp.payment.ThreeDSecureResult.attribute('description').toString();
            }

            if(!empty( temp.payment.riskScore)){
              this.riskScore  = temp.payment.riskScore.toXMLString();
            }

            this.status = true;
          }
          if ('reference' in temp) {
              temp = temp.reference.valueOf();
              this.referenceID = temp.attribute('id').toString();
              this.reference = temp;
              this.status = true;
          }
          if ('token' in temp) {
            if ('authenticatedShopperID' in temp.token){
              this.authenticatedShopperID = temp.token.authenticatedShopperID;
            }
            if ('tokenEventReference' in temp.token){
              this.tokenEventReference = temp.token.tokenEventReference;
            }
            if ('tokenReason' in temp.token){
              this.tokenReason = temp.token.tokenReason;
            }

            if ('tokenDetails' in temp.token) {
              this.tokenEvent = temp.token.tokenDetails.attribute('tokenEvent').toString();
              this.paymentTokenID = temp.token.tokenDetails.paymentTokenID;
              this.paymentTokenExpiryYear=temp.token.tokenDetails.paymentTokenExpiry.date.attribute('year').toString();
              this.paymentTokenExpiryMonth=temp.token.tokenDetails.paymentTokenExpiry.date.attribute('month').toString();
              this.paymentTokenExpiryDay=temp.token.tokenDetails.paymentTokenExpiry.date.attribute('dayOfMonth').toString();
            }

            if ('paymentInstrument' in temp.token && ('cardDetails' in temp.token.paymentInstrument)) {
              this.cardHolderName = temp.token.paymentInstrument.cardDetails.cardHolderName.valueOf();
              this.cardExpiryYear=temp.token.paymentInstrument.cardDetails.expiryDate.date.attribute('year').toString();
              this.cardExpiryMonth=temp.token.paymentInstrument.cardDetails.expiryDate.date.attribute('month').toString();
              this.cardBrand = temp.payment.paymentMethod.valueOf();
              this.bin = temp.token.paymentInstrument.cardDetails.derived.bin.toString();
              if(!empty(temp.payment.cardNumber)){
                this.cardNumber=temp.payment.cardNumber;
              }
            }

            if ('paymentMethodDetail' in temp.payment) {
              this.cardHolderName = temp.payment.cardHolderName.valueOf();
              if(!empty(temp.payment.paymentMethodDetail) && 'expiryDate' in temp.payment.paymentMethodDetail.card){
              this.cardExpiryYear=temp.payment.paymentMethodDetail.card.expiryDate.date.attribute('year').toString();
              this.cardExpiryMonth=temp.payment.paymentMethodDetail.card.expiryDate.date.attribute('month').toString();
              }
              this.cardBrand = temp.payment.paymentMethod.valueOf();
              if(!empty(temp.payment.paymentMethodDetail)){
                this.cardNumber=temp.payment.paymentMethodDetail.card.attribute('number').toString();
              }
            }
          }

          if ('qrCode' in temp) {
        	  this.qrCode = temp.qrCode.toString();
          }

        }

        if (('reply' in temp) && ('ok' in temp['reply'])){
        	this.isCancelReceived=true;
            this.status = true;
        	if('voidSaleReceived' in temp.reply.ok){
        		this.lastEvent = 'VOIDED';
        	}
        }

        if(('notify' in temp) &&('orderStatusEvent' in temp.notify)){
           temp=temp.notify.orderStatusEvent.valueOf();
           if('payment' in temp){
              this.lastEvent = temp.payment.lastEvent;
              if(!empty(temp.payment.paymentMethodDetail.card.attribute('number').toString())){
              this.cardNumber=temp.payment.paymentMethodDetail.card.attribute('number').toString();
            }
              if(!empty(temp.payment.AuthorisationId.attribute('id').toString())){
              this.authID=temp.payment.AuthorisationId.attribute('id').toString();
            }
            if(!empty(temp.payment.IssuerResponseCode.attribute('code').toString())){
              this.errorCode  = temp.payment.IssuerResponseCode.attribute('code').toString().toString();
              this.declineCode= temp.payment.IssuerResponseCode.attribute('code').toString().toString();
            }
            if(empty(temp.payment.IssuerResponseCode.attribute('code').toString().toString()) && temp.payment.lastEvent.equals('REFUSED')){
              if(!empty(temp.payment.ISO8583ReturnCode.attribute('code').toString())){
                this.errorCode = temp.payment.ISO8583ReturnCode.attribute('code').toString().toString();
                this.declineCode= temp.payment.ISO8583ReturnCode.attribute('code').toString().toString();
              }
            }

            if(!empty(temp.payment.CVCResultCode.attribute('description').toString())){
            this.cvcResultCode=temp.payment.CVCResultCode.attribute('description').toString();
            }

            if(!empty(temp.payment.AVSResultCode.attribute('description').toString())){
            this.avsResultCode=temp.payment.AVSResultCode.attribute('description').toString();
            }

            if(!empty(temp.payment.AAVAddressResultCode.attribute('description').toString())){
             this.aaVAddressResultCode=temp.payment.AAVAddressResultCode.attribute('description').toString();
            }

            if(!empty(temp.payment.AAVPostcodeResultCode.attribute('description').toString())){
             this.aaVPostcodeResultCode=temp.payment.AAVPostcodeResultCode.attribute('description').toString();
            }

            if(!empty(temp.payment.ThreeDSecureResult.attribute('description').toString())){
             this.threeDSecureResult=temp.payment.ThreeDSecureResult.attribute('description').toString();
            }

            if(!empty( temp.payment.riskScore)){
              this.riskScore  = temp.payment.riskScore.toXMLString();
            }

            if (!empty(temp.payment.riskScore) && !empty(temp.payment.riskScore.attribute('Provider').toString())) {
                var risk = temp.payment.riskScore;
                this.riskFinalScore = risk.attribute('finalScore');
                this.riskMessage = risk.attribute('message').toString();
                this.riskProvider = risk.attribute('Provider');
            }
            var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
            if (temp.payment.lastEvent && (temp.payment.lastEvent.equals(WorldpayConstants.AUTHORIZED) || temp.payment.lastEvent.equals(WorldpayConstants.CAPTURED))) {
                if (temp.payment.FraudSight && !empty(temp.payment.FraudSight.attribute('message').toString())) {
                    var fraudSight = temp.payment.FraudSight;
                    this.fraudSightScore = temp.payment.FraudSight.attribute('score');
                    this.fraudSightMessage = temp.payment.FraudSight.attribute('message').toString();
                    if (fraudSight.reasonCodes) {
                        var reasonCodes = '';
                        var reasCodes = fraudSight.reasonCodes.elements();
                        for (var i = 0; i < reasCodes.length(); i++) {
                            reasonCodes += reasCodes[i] + ',';
                        }
                        this.fraudSightReason = reasonCodes.substring(0, reasonCodes.length - 1);
                    }
                }
            }
            if('enhancedAuthResponse' in temp.payment){
                if(temp.payment.enhancedAuthResponse.accountRangeId) {
                  this.accountRangeId = temp.payment.enhancedAuthResponse.accountRangeId;
                }
                if(temp.payment.enhancedAuthResponse.virtualAccountNumber) {
                  this.virtualAccountNumber = temp.payment.enhancedAuthResponse.virtualAccountNumber;
                }
                if(temp.payment.enhancedAuthResponse.cardProductType) {
                  this.cardProductType = temp.payment.enhancedAuthResponse.cardProductType;
                }
                if(temp.payment.enhancedAuthResponse.issuerCountry) {
                  this.issuerCountry = temp.payment.enhancedAuthResponse.issuerCountry;
                }
                if(temp.payment.enhancedAuthResponse.affluence) {
                  this.affluence = temp.payment.enhancedAuthResponse.affluence;
                }
                if('fundingSource' in temp.payment.enhancedAuthResponse) {
                  if(temp.payment.enhancedAuthResponse.fundingSource.sourceType) {
                    this.sourceType = temp.payment.enhancedAuthResponse.fundingSource.sourceType;
                  }
                  if(temp.payment.enhancedAuthResponse.fundingSource.availableBalance) {
                    this.availableBalance = temp.payment.enhancedAuthResponse.fundingSource.availableBalance;
                  }
                  if(temp.payment.enhancedAuthResponse.fundingSource.prepaidCardType) {
                    this.prepaidCardType = temp.payment.enhancedAuthResponse.fundingSource.prepaidCardType;
                  }
                  if(temp.payment.enhancedAuthResponse.fundingSource.reloadable) {
                    this.reloadable = temp.payment.enhancedAuthResponse.fundingSource.reloadable;
                  }
                }
              }
            if('journal' in temp ) {
            	if('accountTx' in temp.journal && temp.journal.accountTx[0] && temp.journal.accountTx[0].attribute('accountType').toString() === 'IN_PROCESS_CAPTURED'){
            		this.captureAmount = temp.journal.accountTx[0].amount.attribute('value').toString();
            	}
            	if('accountTx' in temp.journal && temp.journal.accountTx[1] && temp.journal.accountTx[1].attribute('accountType').toString() === 'IN_PROCESS_CAPTURED'){
            		this.captureAmount = temp.journal.accountTx[1].amount.attribute('value').toString();
            	}
            }
            
            this.status = true;
           }
          if ('token' in temp) {
            if ('authenticatedShopperID' in temp.token){
              this.authenticatedShopperID = temp.token.authenticatedShopperID;
            }
            if ('tokenEventReference' in temp.token){
              this.tokenEventReference = temp.token.tokenEventReference;
            }
            if ('tokenReason' in temp.token){
              this.tokenReason = temp.token.tokenReason;
            }

            if ('tokenDetails' in temp.token) {
              this.tokenEvent = temp.token.tokenDetails.attribute('tokenEvent').toString();
              this.paymentTokenID = temp.token.tokenDetails.paymentTokenID;
              this.paymentTokenExpiryYear=temp.token.tokenDetails.paymentTokenExpiry.date.attribute('year').toString();
              this.paymentTokenExpiryMonth=temp.token.tokenDetails.paymentTokenExpiry.date.attribute('month').toString();
              this.paymentTokenExpiryDay=temp.token.tokenDetails.paymentTokenExpiry.date.attribute('dayOfMonth').toString();
            }

            if ('paymentInstrument' in temp.token && ('cardDetails' in temp.token.paymentInstrument)) {
              this.cardHolderName = temp.token.paymentInstrument.cardDetails.cardHolderName.valueOf();
              this.cardExpiryYear=temp.token.paymentInstrument.cardDetails.expiryDate.date.attribute('year').toString();
              this.cardExpiryMonth=temp.token.paymentInstrument.cardDetails.expiryDate.date.attribute('month').toString();
              this.cardBrand = temp.payment.paymentMethod.valueOf();
              if(!empty(temp.payment.cardNumber)){
                this.cardNumber=temp.payment.cardNumber;
              }
            }

            if ('paymentMethodDetail' in temp.payment) {
              this.cardHolderName = temp.payment.cardHolderName.valueOf();
              if(!empty(temp.payment.paymentMethodDetail) && 'expiryDate' in temp.payment.paymentMethodDetail.card){
              this.cardExpiryYear=temp.payment.paymentMethodDetail.card.expiryDate.date.attribute('year').toString();
              this.cardExpiryMonth=temp.payment.paymentMethodDetail.card.expiryDate.date.attribute('month').toString();
              }
              this.cardBrand = temp.payment.paymentMethod.valueOf();
              if(!empty(temp.payment.paymentMethodDetail)){
                this.cardNumber=temp.payment.paymentMethodDetail.card.attribute('number').toString();
              }
            }
          }
        }
        if ('request3DSecure' in temp.requestInfo) {
            this.issuerURL = temp.requestInfo.request3DSecure
              .issuerURL.valueOf().toString();
            this.paRequest = temp.requestInfo.request3DSecure
              .paRequest.toString();
            this.echoData = temp.echoData.toString();
            this.status = true;
            this.is3DSecure=true;
        }

      }
    } catch ( ex ){
      this.status = false;
      this.error = true;
      Logger.getLogger("worldpay").error("Exception occured parsing xml response: " + ex);
      return;
    }
     return this;
  },

  setStatus : function (status) {
    this.status = status;
  },

  getStatus : function() {
    return this.status;
  },

  toString : function() {
    return this.content.toString();
  },

  getErrorCode : function() {
    return this.errorCode;
  },

  isError : function() {
	  return (this.errorCode && this.errorCode!="0") ? true : this.error;
  },

  getErrorMessage : function() {
    return this.errorMessage;
  }
}
module.exports = ResponseData;
