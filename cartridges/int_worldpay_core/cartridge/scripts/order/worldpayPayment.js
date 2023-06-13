'use strict';

var ArrayList = require('dw/util/ArrayList');
var Logger = require('dw/system/Logger');
var URLUtils = require('dw/web/URLUtils');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var paymentInstrumentUtils = require('*/cartridge/scripts/common/paymentInstrumentUtils');
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
var StringUtils = require('dw/util/StringUtils');
var serviceFacade = require('*/cartridge/scripts/service/serviceFacade');
var utils = require('*/cartridge/scripts/common/utils');
var checkoutHelper = require('*/cartridge/scripts/checkout/checkoutHelpers');
/**
 * Fetches MerchantCode From CO when MultiMerchant feature enabled
 * @param {paymentMethodID} paymentMethodID - paymentMethodID
 * @returns {string} worldpayMerchCode
 */
function getMerchantCodeForMultiMerchant(paymentMethodID) {
    var globalHelper = require('*/cartridge/scripts/multimerchant/globalMultiMerchantHelper');
    var worldpayMerchCode;
    var paymentMethd = PaymentMgr.getPaymentMethod(paymentMethodID);
    var config = globalHelper.getMultiMerchantConfiguration(paymentMethd);
    if (config && config.MerchantID) {
        worldpayMerchCode = config.MerchantID;
    }
    return worldpayMerchCode;
}

/**
 * this method returns paymentInstrument
 * @param {Object} basket - the  current basket Object
 * @param {Object} paymentInformation - The curent paymentInformation object.
 * @param {Object} paymentMethod - The curent paymentMethod object.
 * @param {string} tokenId - The curent tokenId
 * @returns {Object} returns a paymentInstrument object.
 */
function checkingPI(basket, paymentInformation, paymentMethod, tokenId) {
    var paymentInstrument;
    var Site = require('dw/system/Site');
    var isMultiMerchantSupportEnabled = Site.current.getCustomPreferenceValue('enableMultiMerchantSupport');

    var expirationMonth = paymentInformation.expirationMonth.value;
    var expirationYear = paymentInformation.expirationYear.value;
    var holderName = paymentInformation.cardOwner.value;
    var cardNumber = paymentInformation.cardNumber.value;
    var cardType = paymentInformation.cardType.value;
    var worldpayMerchCode;
    paymentInstrument = basket.createPaymentInstrument(
        tokenId ? worldpayConstants.WORLDPAY : paymentMethod, paymentInformation.paymentPrice
    );
    paymentInstrument.setCreditCardHolder(holderName);
    paymentInstrument.setCreditCardNumber(cardNumber);
    paymentInstrument.setCreditCardType(cardType);
    paymentInstrument.setCreditCardExpirationMonth(expirationMonth);
    paymentInstrument.setCreditCardExpirationYear(expirationYear);

    if (isMultiMerchantSupportEnabled) {
        worldpayMerchCode = getMerchantCodeForMultiMerchant(paymentMethod);
    }
    if (worldpayMerchCode) {
        paymentInstrument.custom.WorldpayMID = worldpayMerchCode;
    } else {
        paymentInstrument.custom.WorldpayMID = Site.getCurrent().getCustomPreferenceValue('WorldpayMerchantCode');
    }

    return paymentInstrument;
}
/**
 * this method returns paymentInstrument
 * @param {string} tokenId - The curent tokenId
 * @param {Object} paymentInformation - The curent paymentInformation object.
 * @param {Object} transactionIdentifier - the  current transactionIdentifier Object
 * @param {string} tokenScope - The curent tokenScope value.
 * @param {string} bin - The curent bin value.
 * @param {Object} paymentInstr - The curent paymentInstrument object.
 * @returns {Object} returns a paymentInstrument object.
 */
function setPaymentInstrument(tokenId, paymentInformation, transactionIdentifier, tokenScope, bin, paymentInstr) {
    var Site = require('dw/system/Site');
    var paymentInstrument = paymentInstr;
    if (tokenId) {
        paymentInstrument.creditCardToken = tokenId;
    } else if (paymentInformation.saveCard.value && Site.getCurrent().getCustomPreferenceValue('WorldpayEnableTokenization')) {
        paymentInstrument.custom.wpTokenRequested = true;
    }
    if (paymentInformation.creditCardToken && !paymentInformation.creditCardToken.empty) {
        paymentInstrument.custom.transactionIdentifier = transactionIdentifier;
        paymentInstrument.custom.tokenScope = tokenScope;
        paymentInstrument.custom.binToken = bin;
    }
    paymentInstrument.custom.cpf = paymentInformation.brazilFields.cpf.value;
    if (paymentInformation.latAmfieldsCCReDirect && paymentInformation.latAmfieldsCCReDirect.installments &&
        paymentInformation.latAmfieldsCCReDirect.installments.value) {
        paymentInstrument.custom.installments = paymentInformation.latAmfieldsCCReDirect.installments.value;
    }
    return paymentInstrument;
}
/**
 * This function return the tokenScope/bin object.
 * @param {Object} matchedPaymentInstrument - current matchedPaymentInstrument Object
 * @param {Object} basket - current basket Object
 *  @return {Object} returns an tokenScope/bin object
 */
function processMatchedPI(matchedPaymentInstrument, basket) {
    var transactionIdentifier;
    var tokenScope = null;
    var bin = null;
    if (matchedPaymentInstrument && basket.customer.authenticated) {
        transactionIdentifier = matchedPaymentInstrument.custom.transactionIdentifier;
        if (matchedPaymentInstrument.custom.tokenScope) {
            tokenScope = matchedPaymentInstrument.custom.tokenScope;
        }
        if (matchedPaymentInstrument.custom.binToken) {
            bin = matchedPaymentInstrument.custom.binToken;
        }
    } else {
        transactionIdentifier = null;
    }

    return {
        tokenScope: tokenScope,
        bin: bin,
        transactionIdentifier: transactionIdentifier
    };
}
/**
 * Verifies selected payment card redirect form fields information is a valid. If the information is valid payment instrument is created.
 * @param {dw.order.Basket} basket - Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an error object
 */
function handleCardRedirect(basket, paymentInformation) {
    var Site = require('dw/system/Site');
    var paymentInstrument;
    var paymentMethod = paymentInformation.selectedPaymentMethodID.value;
    var cardNumber = paymentInformation.cardNumber.value;
    var creditCardToken = paymentInformation.creditCardToken;
    if (creditCardToken && paymentMethod.equals(worldpayConstants.WORLDPAY) && Site.getCurrent().getCustomPreferenceValue('WorldpayEnableTokenization') &&
        basket.getCustomer().authenticated) {
        var expirationMonth = paymentInformation.expirationMonth.value;
        var expirationYear = paymentInformation.expirationYear.value;
        var cardType = paymentInformation.cardType.value;
        var wallet = basket.getCustomer().getProfile().getWallet();
        var paymentInstruments = wallet.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
        var matchedPaymentInstrument =
            require('*/cartridge/scripts/common/paymentInstrumentUtils').getTokenPaymentInstrument(paymentInstruments, cardNumber, cardType, expirationMonth, expirationYear);
        var matchedPIObj = null;

        matchedPIObj = processMatchedPI(matchedPaymentInstrument, basket);
        if (matchedPaymentInstrument && matchedPaymentInstrument.getCreditCardToken()) {
            var tokenId = matchedPaymentInstrument.getCreditCardToken();
            Transaction.wrap(function () {
                paymentInstrumentUtils.removeExistingPaymentInstruments(basket);
                paymentInstrument = checkingPI(basket, paymentInformation, paymentMethod, tokenId);
                paymentInstrument = setPaymentInstrument(tokenId, paymentInformation, matchedPIObj.transactionIdentifier,
                     matchedPIObj.tokenScope, matchedPIObj.bin, paymentInstrument);
            });
            return { fieldErrors: {}, serverErrors: {}, error: false, success: true, ccCvn: paymentInformation.securityCode.value, PaymentInstrument: paymentInstrument };
        }
    }
    Transaction.wrap(function () {
        paymentInstrumentUtils.removeExistingPaymentInstruments(basket);
        paymentInstrument = basket.createPaymentInstrument(paymentMethod, paymentInformation.paymentPrice);
        if (paymentMethod.equals(worldpayConstants.WORLDPAY) && paymentInformation.saveCard &&
            paymentInformation.saveCard.value &&
            Site.getCurrent().getCustomPreferenceValue('WorldpayEnableTokenization') &&
            basket.getCustomer().authenticated) {
            paymentInstrument.custom.wpTokenRequested = true;
        }
        if (paymentInformation.preferredCard.value) {
            paymentInstrument.custom.worldpayPreferredCard = paymentInformation.preferredCard.value;
        }
        paymentInstrument.custom.cpf = paymentInformation.brazilFields.cpf.value;
        if (paymentInformation.latAmfieldsCCReDirect && paymentInformation.latAmfieldsCCReDirect.installments && paymentInformation.latAmfieldsCCReDirect.installments.value) {
            paymentInstrument.custom.installments = paymentInformation.latAmfieldsCCReDirect.installments.value;
        }
    });
    return { fieldErrors: {}, serverErrors: {}, error: false, success: true, ccCvn: '', PaymentInstrument: paymentInstrument };
}

/**
 * Verifies selected payment APM with their form fields information is a valid. If the information is valid payment instrument is created.
 * @param {dw.order.Basket} basket - Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an error object
 */
function handleAPM(basket, paymentInformation) {
    var Site = require('dw/system/Site');
    var isMultiMerchantSupportEnabled = Site.current.getCustomPreferenceValue('enableMultiMerchantSupport');
    var paramMap = request.httpParameterMap;
    var paymentInstrument;
    var fieldErrors = {};
    var serverErrors = [];
    var paymentMethod = paymentInformation.selectedPaymentMethodID.value;
    var worldpayMerchCode;
    Transaction.wrap(function () {
        paymentInstrumentUtils.removeExistingPaymentInstruments(basket);
        paymentInstrument = basket.createPaymentInstrument(
            paymentMethod, paymentInformation.paymentPrice
        );
        if (paymentMethod.equals(worldpayConstants.IDEAL)) {
            paymentInstrument.custom.bank = paymentInformation.idealFields.bank.value;
        } else if (paymentMethod.equals(worldpayConstants.GOOGLEPAY)) {
            paymentInstrument.custom.gpaySignature = paramMap.signature;
            paymentInstrument.custom.gpayprotocolVersion = paramMap.protocolVersion;
            paymentInstrument.custom.gpaysignedMessage = paramMap.signedMessage;
        } else if (paymentMethod.equals(worldpayConstants.GIROPAY)) {
            paymentInstrument.custom.bankCode = paymentInformation.giropayFields.bankCode.value;
        } else if (paymentMethod.equals(worldpayConstants.ELV)) {
            paymentInstrument.custom.elvMandateType = paymentInformation.elvFields.elvMandateType.value;
            paymentInstrument.custom.elvMandateID = paymentInformation.elvFields.elvMandateID.value;
            paymentInstrument.custom.iban = paymentInformation.elvFields.iban.value;
            paymentInstrument.custom.accountHolderName = paymentInformation.elvFields.accountHolderName.value;
        } else if (paymentMethod.equals(worldpayConstants.ACHPAY)) {
            paymentInstrument.custom.achAccountType = paymentInformation.achFields.achAccountType.value;
            paymentInstrument.setBankAccountNumber(paymentInformation.achFields.achAccountNumber.value);
            paymentInstrument.setBankRoutingNumber(paymentInformation.achFields.achRoutingNumber.value);
            paymentInstrument.custom.achCheckNumber = paymentInformation.achFields.achCheckNumber.value;
        } else if (paymentMethod.equals(worldpayConstants.KLARNASLICEIT) || paymentMethod.equals(worldpayConstants.KLARNAPAYLATER) ||
            paymentMethod.equals(worldpayConstants.KLARNAPAYNOW)) {
            paymentInstrument.custom.wpKlarnaPaymentMethod = paymentMethod;
        }
        if (isMultiMerchantSupportEnabled) {
            worldpayMerchCode = getMerchantCodeForMultiMerchant(paymentMethod);
        }
        if (worldpayMerchCode) {
            paymentInstrument.custom.WorldpayMID = worldpayMerchCode;
        } else {
            paymentInstrument.custom.WorldpayMID = Site.getCurrent().getCustomPreferenceValue('WorldpayMerchantCode');
        }
    });
    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: false, success: true };
}

/**
 * this method returns paymentInstrument
 * @param {Object} paymentInstr - the  current paymentInstrument Object.
 * @param {Object} paymentInformation  - The curent paymentInformation object.
 * @param {Object} paymentMethod - The curent paymentMethod object.
 * @returns {Object} returns a paymentInstrument object
 */
function getPaymentInstrumentObj(paymentInstr, paymentInformation, paymentMethod) {
    var Site = require('dw/system/Site');
    var isMultiMerchantSupportEnabled = Site.current.getCustomPreferenceValue('enableMultiMerchantSupport');
    var EnableTokenizationPref = Site.getCurrent().getCustomPreferenceValue('WorldpayEnableTokenization');
    var paymentInstrument = paymentInstr;
    if (Site.getCurrent().getCustomPreferenceValue('enableStoredCredentials')) {
        EnableTokenizationPref = true;
    }
    var worldpayMerchCode;
    if (isMultiMerchantSupportEnabled) {
        worldpayMerchCode = getMerchantCodeForMultiMerchant(paymentMethod);
    }
    if (worldpayMerchCode) {
        paymentInstrument.custom.WorldpayMID = worldpayMerchCode;
    } else {
        paymentInstrument.custom.WorldpayMID = Site.getCurrent().getCustomPreferenceValue('WorldpayMerchantCode');
    }
    if (paymentInformation.creditCardToken && !paymentInformation.creditCardToken.empty) {
        paymentInstrument.creditCardToken = paymentInformation.creditCardToken;
    } else if (paymentInformation.saveCard && paymentInformation.saveCard.value && EnableTokenizationPref) {
        paymentInstrument.custom.wpTokenRequested = true;
    }
    return paymentInstrument;
}
/**
 * this method returns paymentInstrument
 * @param {Object} paymentInformation - the  current paymentInformation Object.
 * @param {Object} pi  - The curent paymentInstrument object.
 * @param {string} transactionIdentifier - The curent transactionIdentifier value
 * @param {string} tokenScope - The curent tokenScope value
 * @param {string} bin - The curent bin value.
 * @returns {Object} returns a paymentInstrument object
 */
function processPaymentInstrument(paymentInformation, pi, transactionIdentifier, tokenScope, bin) {
    var Site = require('dw/system/Site');
    var paymentInstrument = pi;
    if (paymentInformation.saveCard && paymentInformation.saveCard.value && Site.getCurrent().getCustomPreferenceValue('enableStoredCredentials')) {
        paymentInstrument.custom.saveCard = true;
    }
    if (paymentInformation.creditCardToken && !paymentInformation.creditCardToken.empty) {
        paymentInstrument.custom.transactionIdentifier = transactionIdentifier;
        paymentInstrument.custom.tokenScope = tokenScope;
        paymentInstrument.custom.binToken = bin;
    }
    if (Object.prototype.hasOwnProperty.call(paymentInformation, 'brazilFields')) {
        paymentInstrument.custom.cpf = paymentInformation.brazilFields.cpf.value;
    }
    if (Object.prototype.hasOwnProperty.call(paymentInformation, 'latAmfieldsCCDirect')) {
        if (paymentInformation.latAmfieldsCCDirect && paymentInformation.latAmfieldsCCDirect.installments && paymentInformation.latAmfieldsCCDirect.installments.value) {
            paymentInstrument.custom.installments = paymentInformation.latAmfieldsCCDirect.installments.value;
        }
    }
    return paymentInstrument;
}
/**
 * Verifies that entered credit card information is a valid card. If the information is valid a
 * credit card payment instrument is created
 * @param {dw.order.Basket} basket - Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an error object
 */
function handleCreditCard(basket, paymentInformation) {
    var currentBasket = basket;
    var paymentMethod = paymentInformation.selectedPaymentMethodID.value;
    var matchedPaymentInstrument;
    Transaction.wrap(function () {
        paymentInstrumentUtils.removeExistingPaymentInstruments(currentBasket);

        var paymentInstrument = currentBasket.createPaymentInstrument(
            PaymentInstrument.METHOD_CREDIT_CARD, paymentInformation.paymentPrice
        );
        var cardNumber = paymentInformation.cardNumber.value;
        var expirationMonth = paymentInformation.expirationMonth.value;
        var expirationYear = paymentInformation.expirationYear.value;
        var holderName = paymentInformation.cardOwner.value;
        var cardType = paymentInformation.cardType.value;
        paymentInstrument.setCreditCardHolder(holderName);
        paymentInstrument.setCreditCardNumber(cardNumber);
        paymentInstrument.setCreditCardType(cardType);
        paymentInstrument.setCreditCardExpirationMonth(expirationMonth);
        paymentInstrument.setCreditCardExpirationYear(expirationYear);
        if (currentBasket.customer.authenticated) {
            var wallet = currentBasket.customer.getProfile().getWallet();
            var paymentInstruments = wallet.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
            matchedPaymentInstrument = require('*/cartridge/scripts/common/paymentInstrumentUtils').getTokenPaymentInstrument(paymentInstruments,
                paymentInstrument.creditCardNumber,
                paymentInstrument.creditCardType,
                paymentInstrument.creditCardExpirationMonth,
                paymentInstrument.creditCardExpirationYear);
        }
        paymentInstrument = getPaymentInstrumentObj(paymentInstrument, paymentInformation, paymentMethod);
        var transactionIdentifier;
        var tokenScope = null;
        var bin = null;
        if (matchedPaymentInstrument && currentBasket.customer.authenticated) {
            transactionIdentifier = matchedPaymentInstrument.custom.transactionIdentifier;
            if (matchedPaymentInstrument.custom.tokenScope) {
                tokenScope = matchedPaymentInstrument.custom.tokenScope;
            }
            if (matchedPaymentInstrument.custom.binToken) {
                bin = matchedPaymentInstrument.custom.binToken;
            }
        } else {
            transactionIdentifier = null;
        }
        processPaymentInstrument(paymentInformation, paymentInstrument, transactionIdentifier, tokenScope, bin);
    });

    return { fieldErrors: {}, serverErrors: {}, error: false, success: true };
}
/**
 * This function return the PI.
 * @param {Object} order - current order Object
 * @param {Object} transactionIdentifier - current transactionIdentifier Object
 * @param {Object} orderNumber -  orderNumber Object
 * @param {Object} worldPayPreferences - worldPayPreferencesobject
 *  @return {Object} returns an PI object
 */
function processPaymentInstruments(order, transactionIdentifier, orderNumber, worldPayPreferences) {
    var pi;
    var apmName;
    var paymentMthd;
    var preferences;
    var paymentInstruments = order.getPaymentInstruments();
    if (paymentInstruments.length > 0) {
        Transaction.wrap(function () {
            for (var i = 0; i < paymentInstruments.length; i++) {
                pi = paymentInstruments[i];
                var payProcessor = PaymentMgr.getPaymentMethod(pi.getPaymentMethod()).getPaymentProcessor();
                if (payProcessor != null && payProcessor.getID().equalsIgnoreCase(worldpayConstants.WORLDPAY)) {
                    // update payment instrument with transaction basic attrubutes
                    apmName = pi.getPaymentMethod();
                    paymentMthd = PaymentMgr.getPaymentMethod(apmName);
                    preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd, order);
                    pi.paymentTransaction.transactionID = orderNumber;
                    pi.paymentTransaction.paymentProcessor = payProcessor;
                    pi.custom.WorldpayMID = preferences.merchantCode;
                    pi.custom.transactionIdentifier = transactionIdentifier;
                    break;
                }
            }
        });
    }
    return {
        pi: pi,
        apmName: apmName,
        paymentMthd: paymentMthd,
        preferences: preferences
    };
}

/**
 * Initiates Credit Card DIRECT request
 * @param {number} orderNumber - The current order's number
 * @param {Object} pi - The curent paymentInstrument object.
 * @param {Object} preferences - Worldpay preferences
 * @param {string} cardNumber -  cardNumber.
 * @param {string} encryptedData - encryptedData
 * @param {string} cvn - cvn
 * @returns {boolean} - returns authorization result as true or false
 */
function ccAuthRequest(orderNumber, pi, preferences, cardNumber, encryptedData, cvn) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');
    var order = OrderMgr.getOrder(orderNumber);
    var errorMessage;
    var serverErrors = [];
    var fieldErrors = {};
    var serviceResponse;
    if (cvn === null) {
        Logger.getLogger('worldpay').error('Worldpyay helper SendCCAuthorizeRequest : CVV is null');
        errorMessage = Resource.msg('error.card.info.enter.cvv', 'forms', null);
        serverErrors.push(errorMessage);
        return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: true, errorMessage: errorMessage };
    }
    var CCAuthorizeRequestResult = serviceFacade.ccAuthorizeRequestService(order, request, pi, preferences, cardNumber, encryptedData, cvn);
    serviceResponse = CCAuthorizeRequestResult.serviceresponse;
    if (CCAuthorizeRequestResult.error) {
        Logger.getLogger('worldpay').error('Worldpyay helper SendCCAuthorizeRequest : ErrorCode : ' + CCAuthorizeRequestResult.errorCode + ' : Error Message : ' +
            CCAuthorizeRequestResult.errorMessage);
        serverErrors.push(CCAuthorizeRequestResult.errorMessage);
        if (Site.getCurrent().getCustomPreferenceValue('enableErrorMailService')) {
            utils.sendErrorNotification(orderNumber, worldpayConstants.AUTHENTICATION_FAILED, pi.paymentMethod);
        }
        return { fieldErrors: fieldErrors,
            serverErrors: serverErrors,
            error: true,
            errorCode: CCAuthorizeRequestResult.errorCode,
            errorMessage: CCAuthorizeRequestResult.errorMessage };
    }
    return checkoutHelper.getAuthorizationResult(serviceResponse, order, preferences, pi, paymentInstrumentUtils);
}

/**
 * Creates direct or redirect URL
 * @param {Object} responsePaymentMethod - responsePaymentMethod
 * @param {Object} redirectUrl - redirectUrl
 * @param {Object} paymentInstrument - paymentInstrument
 * @param {Object} apmType - apmType
 * @param {Object} isValidCustomOptionsHPP - isValidCustomOptionsHPP
 * @param {Object} order - current order object
 * @param {Object} countryCode - country code
 * @param {Object} apmName - APM Name
 * @returns {Object} - Redirect URL
 */
function createURL(responsePaymentMethod, redirectUrl, paymentInstrument, apmType, isValidCustomOptionsHPP, order, countryCode) {
    var pi = paymentInstrument;
    var apmName = pi.getPaymentMethod();
    var redirectURL = redirectUrl;
    if (responsePaymentMethod && !responsePaymentMethod.equals(worldpayConstants.KLARNAPAYLATER) && !responsePaymentMethod.equals(worldpayConstants.KLARNASLICEIT) &&
        !responsePaymentMethod.equals(worldpayConstants.KLARNAPAYNOW) && redirectURL.includes('&amp;') > 0) {
        redirectURL = redirectURL.replace('&amp;', '&');
    }
    if (undefined === responsePaymentMethod || !responsePaymentMethod.equals(worldpayConstants.KLARNASLICEIT) ||
        !responsePaymentMethod.equals(worldpayConstants.KLARNAPAYLATER) || !responsePaymentMethod.equals(worldpayConstants.KLARNAPAYNOW)) {
        if (!isValidCustomOptionsHPP) {
            if (apmType.equalsIgnoreCase(worldpayConstants.DIRECT)) {
                redirectURL = utils.createDirectURL(redirectURL, order.orderNo, countryCode);
            } else {
                redirectURL = utils.createRedirectURL(apmName, redirectURL, order.orderNo, countryCode, order.orderToken);
            }
        } else {
            Transaction.wrap(function () {
                pi.custom.worldpayRedirectURL = redirectURL;
            });
        }
    }
    return redirectURL;
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {string} cardNumber -  cardNumber.
 * @param {string} encryptedData - encryptedData
 * @param {string} cvn - cvn
 * @return {Object} returns an error object
 */
function authorize(orderNumber, cardNumber, encryptedData, cvn) {
    var OrderMgr = require('dw/order/OrderMgr');
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');
    var enableErrorMailService = Site.getCurrent().getCustomPreferenceValue('enableErrorMailService');
    var serverErrors = [];
    var fieldErrors = {};
    // fetch order object
    var order = OrderMgr.getOrder(orderNumber);
    var currentpaymentinstrument = order.paymentInstruments[0];
    var transactionIdentifier;
    if (currentpaymentinstrument.custom.transactionIdentifier) {
        transactionIdentifier = currentpaymentinstrument.custom.transactionIdentifier;
    } else {
        transactionIdentifier = null;
    }
    // initialize worldpay preferences
    var worldPayPreferences = new WorldpayPreferences();
    // order not found
    if (!order) {
        Logger.getLogger('worldpay').error('authorize : Invalid Order');
        serverErrors.push(Resource.msg('error.technical', 'checkout', null));
        return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: true };
    }
    var piObj = processPaymentInstruments(order, transactionIdentifier, orderNumber, worldPayPreferences);
     // fetch the APM Name or payment method name from the Payment instrument.
    var apmName = piObj.apmName;
    var paymentMthd = piObj.paymentMthd;
    var preferences = piObj.preferences;
    var pi = piObj.pi;
    var serviceResponse;
    var paymentMethod = pi.paymentMethod;
    var shipments = order.shipments.length;
    var errorMessage;
    if (!(paymentMethod.equals('CREDIT_CARD') || paymentMethod.equals('PAYWITHGOOGLE-SSL') || paymentMethod.equals('Worldpay') ||
    paymentMethod.equals('PAYPAL-EXPRESS') || paymentMethod.equals('DW_APPLE_PAY')) && shipments > 1) {
        errorMessage = Resource.msg('worldpay.error.multishipping', 'worldpayerror', null);
        Logger.getLogger('worldpay').error('Worldpyay MultiShipping : Error Message : ' + errorMessage);
        serverErrors.push(errorMessage);
        return { fieldErrors: fieldErrors,
            serverErrors: serverErrors,
            error: true,
            errorMessage: errorMessage };
    }
    // credit card direct APM authorization flow
    if (pi.paymentMethod.equals(PaymentInstrument.METHOD_CREDIT_CARD)) {
        // Auth service call
        return ccAuthRequest(orderNumber, pi, preferences, cardNumber, encryptedData, cvn);
    }
    if ((!order.createdBy.equals('Customer') && order.paymentInstrument.paymentMethod.equals(worldpayConstants.WORLDPAY)) ||
    (request.httpParameterMap.payByLink && request.httpParameterMap.payByLink.value)) {
        Transaction.begin();
        order.custom.isPayByLinkOrder = true;
        Transaction.commit();
        Transaction.begin();
        preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd, order);
        pi.custom.WorldpayMID = preferences.merchantCode;
        Transaction.commit();
    }

    var countryCode = order.getBillingAddress().countryCode;
    var apmType = paymentMthd.custom.type.toString();
    var isValidCustomOptionsHPP = false;
    var responsePaymentMethod;
    var redirectURL = '';
    var orderamount = utils.calculateNonGiftCertificateAmount(order);

    // if Klarna then adjustedMerchandizeTotalPrice
    if (apmName.equals(worldpayConstants.KLARNASLICEIT) || apmName.equals(worldpayConstants.KLARNAPAYLATER) || apmName.equals(worldpayConstants.KLARNAPAYNOW)) {
        orderamount = order.adjustedMerchandizeTotalGrossPrice.add(order.adjustedShippingTotalGrossPrice);
    }
    var authorizeOrderResult = serviceFacade.authorizeOrderService(orderamount, order, pi, order.customer, paymentMthd);
    if (authorizeOrderResult.error) {
        Logger.getLogger('worldpay').error('AuthorizeOrder.js : ErrorCode : ' + authorizeOrderResult.errorCode + ' : Error Message : ' + authorizeOrderResult.errorMessage);
        serverErrors.push(authorizeOrderResult.errorMessage);
        if (enableErrorMailService) {
            utils.sendErrorNotification(orderNumber, worldpayConstants.AUTHORIZATION_FAILED, apmName);
        }
        return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: true, errorCode: authorizeOrderResult.errorCode, errorMessage: authorizeOrderResult.errorMessage };
    }
    if (apmName.equals(worldpayConstants.ELV)) {
        Transaction.wrap(function () {
            order.custom.mandateID = pi.custom.elvMandateID;
        });
        redirectURL = URLUtils.https('COPlaceOrder-Submit', 'order_id', order.orderNo, worldpayConstants.ORDERTOKEN, order.orderToken, worldpayConstants.PAYMENTSTATUS,
            worldpayConstants.PENDING, worldpayConstants.APMNAME, apmName).toString();
    } else if (apmName.equals(worldpayConstants.WECHATPAY) && apmType.equalsIgnoreCase(worldpayConstants.DIRECT)) {
        Transaction.wrap(function () {
            pi.custom.wpWechatQRCode = authorizeOrderResult.response.qrCode;
        });
        redirectURL = URLUtils.https('COPlaceOrder-Submit', 'order_id', order.orderNo, worldpayConstants.ORDERTOKEN, order.orderToken, worldpayConstants.PAYMENTSTATUS,
            worldpayConstants.PENDING, worldpayConstants.APMNAME, apmName).toString();
    } else if (apmName.equals(worldpayConstants.GOOGLEPAY) && apmType.equalsIgnoreCase(worldpayConstants.DIRECT)) {
        var GpayserviceResponse = authorizeOrderResult.response;
        if (GpayserviceResponse.threeDSVersion) {
            Transaction.wrap(function () {
                if (GpayserviceResponse.content) {
                    pi.custom.resHeader = GpayserviceResponse.content;
                }
            });
            return {
                acsURL: GpayserviceResponse.acsURL,
                threeDSVersion: GpayserviceResponse.threeDSVersion,
                payload: GpayserviceResponse.payload,
                transactionId3DS: GpayserviceResponse.transactionId3DS
            };
        }
        redirectURL = URLUtils.https('COPlaceOrder-Submit', 'order_id', order.orderNo, worldpayConstants.ORDERTOKEN, order.orderToken, worldpayConstants.PAYMENTSTATUS,
            worldpayConstants.PENDING, worldpayConstants.APMNAME, apmName).toString();
    } else if (apmName.equals(worldpayConstants.ACHPAY) && apmType.equalsIgnoreCase(worldpayConstants.DIRECT)) {
        if (authorizeOrderResult && authorizeOrderResult.success && authorizeOrderResult.response && !authorizeOrderResult.response.error) {
            if (authorizeOrderResult.response.lastEvent.toString() === worldpayConstants.CAPTURED &&
                authorizeOrderResult.response.paymentMethod.toString() === worldpayConstants.ACHPAY) {
                Transaction.wrap(function () {
                    order.custom.usDomesticOrder = true;
                    order.custom.WorldpayLastEvent = authorizeOrderResult.response.lastEvent;
                });
            }
            return { error: false, isAchPay: true };
        }
        return { error: true, isAchPay: true };
    } else if (authorizeOrderResult.response.reference) {
        redirectURL = authorizeOrderResult.response.reference.toString();
        if (paymentMthd.custom.wordlpayHPPCustomOptionsJSON && utils.isValidCustomOptionsHPP(paymentMthd)) {
            isValidCustomOptionsHPP = true;
        }
        responsePaymentMethod = authorizeOrderResult.response.paymentMethod.toString();
        redirectURL = createURL(responsePaymentMethod, redirectURL, pi, apmType, isValidCustomOptionsHPP, order, countryCode);
    } else if (authorizeOrderResult.response) {
        serviceResponse = authorizeOrderResult.response;
        if (authorizeOrderResult.error) {
            Logger.getLogger('worldpay').error('Worldpyay helper SendCCAuthorizeRequest : ErrorCode : ' + authorizeOrderResult.errorCode + ' : Error Message : ' +
            authorizeOrderResult.errorMessage);
            serverErrors.push(authorizeOrderResult.errorMessage);
            if (enableErrorMailService) {
                utils.sendErrorNotification(order.orderNo, worldpayConstants.SECOND_AUTHORIZATION_FAILED, apmName);
            }
            return { fieldErrors: fieldErrors,
                serverErrors: serverErrors,
                error: true,
                errorCode: authorizeOrderResult.errorCode,
                errorMessage: authorizeOrderResult.errorMessage };
        }
        return checkoutHelper.getAuthorizationResult(serviceResponse, order, preferences, pi, paymentInstrumentUtils);
    } else if (undefined === authorizeOrderResult.response.reference) {
        Logger.getLogger('worldpay').error('AuthorizeOrder.js : ErrorCode : ' + authorizeOrderResult.errorCode + ' : Last Event : ' + authorizeOrderResult.response.lastEvent);
        serverErrors.push(utils.getErrorMessage());
        if (enableErrorMailService) {
            utils.sendErrorNotification(order.orderNo, worldpayConstants.AUTHORIZATION_FAILED, apmName);
        }
        return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: true };
    }
    if (pi.paymentMethod.equals(worldpayConstants.KONBINI)) {
        Transaction.wrap(function () {
            pi.custom.wpKonbiniPaymentReference = redirectURL;
        });
        return { fieldErrors: fieldErrors,
            serverErrors: serverErrors,
            error: false,
            redirectUrlKonbini: redirectURL,
            authorized: true,
            isPaymentKonbini: true,
            redirectUrl: redirectURL };
    } else if (isValidCustomOptionsHPP) {
        return {
            redirect: true,
            redirectUrl: redirectURL,
            isValidCustomOptionsHPP: isValidCustomOptionsHPP,
            returnToPage: true,
            customOptionsHPPJSON: utils.getCustomOptionsHPP(paymentMthd, redirectURL, order.orderNo, order.getOrderToken(), null)
        };
    } else if (responsePaymentMethod && (responsePaymentMethod.equals(worldpayConstants.KLARNASLICEIT) || responsePaymentMethod.equals(worldpayConstants.KLARNAPAYLATER) ||
        responsePaymentMethod.equals(worldpayConstants.KLARNAPAYNOW))) {
        redirectURL = StringUtils.decodeString(StringUtils.decodeBase64(redirectURL), StringUtils.ENCODE_TYPE_HTML);
        redirectURL = redirectURL.replace('window.location.href', 'window.top.location.href');
        return {
            redirect: true,
            redirectUrl: '',
            isKlarna: true,
            klarnasnippet: redirectURL,
            returnToPage: true
        };
    }
    if (apmName.equals(worldpayConstants.WORLDPAY) || apmName.equals(worldpayConstants.CHINAUNIONPAY)) {
        return {
            worldpayredirect: true,
            redirectUrl: redirectURL
        };
    }
    if ((apmName.equals(worldpayConstants.WECHATPAY) && apmType.equalsIgnoreCase(worldpayConstants.DIRECT)) || apmName.equals(worldpayConstants.ELV) ||
        apmName.equals(worldpayConstants.GOOGLEPAY)) {
        return {
            worldpayredirect: true,
            redirectUrl: redirectURL
        };
    }
    return {
        redirect: true,
        redirectUrl: redirectURL
    };
}


/**
 * This method set creditcard token under paymentInstrument
 * @param {Object} creditCardInstrument - token for paymentInstrument
 * @param {Object} wallet - custome wallet
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to update token
 */
function setCardToken(creditCardInstrument, wallet, paymentInstrument) {
    if (!creditCardInstrument.empty) {
        Transaction.wrap(function () {
            wallet.removePaymentInstrument(creditCardInstrument);
            if (!creditCardInstrument.getCreditCardToken().empty) {
                paymentInstrument.setCreditCardToken(creditCardInstrument.getCreditCardToken());
            }
        });
    }
}

 /**
 * This method updates card Token
 * @param {*} enableTokenizationPref - value of EnableTokenizationPref
 * @param {*} serviceResponses - serviceResponses to create Token Result
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to update token
 * @param {*} Site - Site
 * @return {Object} - Result
 */
function getTokenProcessUtils(enableTokenizationPref, serviceResponses, paymentInstrument, Site) {
    var tokenProcessUtils = require('*/cartridge/scripts/common/tokenProcessUtils');
    var tokenaddorUpdate;
    var tokenaddorUpdateIdentifier;
    if (enableTokenizationPref && (serviceResponses.paymentTokenID)) {
        tokenaddorUpdate = tokenProcessUtils.addOrUpdateToken(serviceResponses, customer, paymentInstrument);
        if (tokenaddorUpdate.error) {
            return tokenaddorUpdate;
        }
    }
    if (Site.getCurrent().getCustomPreferenceValue('enableStoredCredentials')) {
        tokenaddorUpdateIdentifier = tokenProcessUtils.addOrUpdateIdentifier(serviceResponses, customer, paymentInstrument);
        return tokenaddorUpdateIdentifier;
    }
    return tokenaddorUpdate;
}
/**
 * This method responsible for sending cancel order modification request for Nominal cards
 * @param {string} creditcardtype - Card type
 * @param {number} nominalCardAmount - nominalValue entered in preferences
 * @param {boolean} isNominalAuthCard - Boolean true or false
 * @param {number} orderNo - The current order's number
 * @return {Object} - Result
 */
function nominalValueCancelrequest(creditcardtype, nominalCardAmount, isNominalAuthCard, orderNo) {
    var Site = require('dw/system/Site');
    var paymentMthd = PaymentMgr.getPaymentMethod('CREDIT_CARD');
    var enableErrorMailService = Site.getCurrent().getCustomPreferenceValue('enableErrorMailService');
    var Resource = require('dw/web/Resource');
    var errorMessage;
    var result = {};
    if (nominalCardAmount > 0 && isNominalAuthCard) {
        result = serviceFacade.cscCancel(orderNo);
        if (result && result.error) {
            errorMessage = Resource.msg('worldpay.iavreversalfail.message', 'worldpay', null);
            if (enableErrorMailService) {
                utils.sendErrorNotification(orderNo, worldpayConstants.NOMINAL_VALUE_CHECK_FAILED, paymentMthd);
            }
            Logger.getLogger('worldpay').debug('worldpay-cscCancel error recieved: ErrorCode : ' + result.errorCode +
                ' : Error Message : ' + errorMessage);
            return { error: true };
        }
    }
    return result;
}
/**
 * handles the ServiceResponse
 * @param {Object} serviceResponses - The curent serviceResponses object.
 * @param {string} creditcardtype - the  current creditcardtype value.
 * @param {Object} nominalCardAmount - The curent nominalCardAmount object.
 * @param {Object} isNominalAuthCard - The curent isNominalAuthCard object.
 * @returns {Object} an error object
 */
function handlingServiceResponse(serviceResponses, creditcardtype, nominalCardAmount, isNominalAuthCard) {
    if (serviceResponses && !serviceResponses.error && serviceResponses.paymentTokenID) {
        var result = nominalValueCancelrequest(creditcardtype, nominalCardAmount, isNominalAuthCard, serviceResponses.orderCode);
        if (result && result.error) {
            return {
                error: true,
                nominalerror: true
            };
        }
    }
    return null;
}
/**
 * Update Token in payment Instrument for customer save payent instrument
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to update token
 * @param {dw.customer.Customer} customer -  The customer where the token value to preseve in saved cards
 * @return {Object} returns an error object
 */
function updateToken(paymentInstrument, customer) {
    var createRequestHelper = require('*/cartridge/scripts/common/createRequestHelper');
    var Site = require('dw/system/Site');
    var serverErrors = [];
    var enableTokenizationPref = Site.getCurrent().getCustomPreferenceValue('WorldpayEnableTokenization');
    if (Site.getCurrent().getCustomPreferenceValue('enableStoredCredentials')) {
        enableTokenizationPref = true;
    }
    var cardNumber = paymentInstrument.creditCardNumber;
    var cardType = paymentInstrument.creditCardType;
    var expirationMonth = paymentInstrument.creditCardExpirationMonth;
    var expirationYear = paymentInstrument.creditCardExpirationYear;
    var serviceResponses;
    if (customer && customer.authenticated) {
        var wallet = customer.getProfile().getWallet();
        var customerPaymentInstruments = wallet.paymentInstruments;
        var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
        var worldPayPreferences = new WorldpayPreferences();
        var paymentMthd = PaymentMgr.getPaymentMethod('CREDIT_CARD');
        var preferences = worldPayPreferences.worldPayPreferencesInit(paymentMthd);
        try {
            var creditCardInstrument = paymentInstrumentUtils.getTokenPaymentInstrument(customerPaymentInstruments, cardNumber, cardType, expirationMonth, expirationYear);
            var CreateTokenResult;
            if (Site.getCurrent().getCustomPreferenceValue('enableStoredCredentials') || enableTokenizationPref) {
                CreateTokenResult = serviceFacade.createTokenWOP(customer, paymentInstrument, preferences, cardNumber, expirationMonth, expirationYear);
                serviceResponses = CreateTokenResult.serviceresponse;
                if (CreateTokenResult.error) {
                    Logger.getLogger('worldpay').error('Update Token CreateTokenResult : ErrorCode : ' + CreateTokenResult.errorCode + ' : Error Message : ' +
                    CreateTokenResult.errorMessage);
                    serverErrors.push(CreateTokenResult.errorMessage);
                    return {
                        error: true,
                        serverErrors: serverErrors
                    };
                }
                var creditcardtype = paymentInstrument.creditCardType;
                var isNominalAuthCard = createRequestHelper.isNominalAuthCard(creditcardtype);
                var nominalCardAmount = Site.current.getCustomPreferenceValue('nominalValue');
                handlingServiceResponse(serviceResponses, creditcardtype, nominalCardAmount, isNominalAuthCard);
                var tokenProcessResult = getTokenProcessUtils(enableTokenizationPref, serviceResponses, paymentInstrument, Site);
                if (tokenProcessResult.error) {
                    return tokenProcessResult;
                }
            }
            setCardToken(creditCardInstrument, wallet, paymentInstrument);
        } catch (ex) {
            Logger.getLogger('worldpay').error('worldpay-UpdateToken error recieved : ' + ex.message);
        }
    }
    return serviceResponses;
}

/**
 * Creates an array of objects containing applicable payment methods
 * @param {dw.util.ArrayList<dw.order.dw.order.PaymentMethod>} paymentMethods - An ArrayList of
 *      applicable payment methods that the user could use for the current basket.
 * @param {string} countryCode - the associated apm countryCode
 * @param {Object} preferences - the associated worldpay preferences
 * @returns {Array} of object that contain information about the applicable payment methods for the
 *      current cart
 */
function applicablePaymentMethods(paymentMethods, countryCode, preferences) {
    var APMLookupServiceResult;
    var enableAPMLookUpService = preferences.enableAPMLookUpService;
    var applicableAPMs = new ArrayList();
    var APMLookupServicePmtMtds;
    // get page url action
    var pageaction;
    var req = request;
    var requestpath = req.getHttpPath();
    if (requestpath) {
        var action = requestpath.split('/');
        pageaction = action[action.length - 1];
    }
    if (enableAPMLookUpService && pageaction !== 'Order-History') {
        var showKlarna = false;
        var siteCountry = req.locale.toUpperCase().substr(3, 2);
        if (siteCountry.equalsIgnoreCase(countryCode.toUpperCase())) {
            showKlarna = true;
        }
        APMLookupServiceResult = serviceFacade.apmLookupService(countryCode);
        APMLookupServicePmtMtds = (undefined !== APMLookupServiceResult && undefined !== APMLookupServiceResult.apmList) ? APMLookupServiceResult.apmList : new ArrayList();
        var iterator = paymentMethods.iterator();
        var item = null;
        while (iterator.hasNext()) {
            item = iterator.next();
            var itemId = item.ID;
            if ((item.paymentProcessor && !worldpayConstants.WORLDPAY.equals(item.paymentProcessor.ID))
                || (item.custom.merchantID && !item.custom.merchantID.equalsIgnoreCase(preferences.merchantCode))
				|| (APMLookupServicePmtMtds.contains(itemId) && itemId.equalsIgnoreCase(worldpayConstants.IDEAL) && preferences.worldPayIdealBankList)
				|| (APMLookupServicePmtMtds.contains(itemId) && itemId.equalsIgnoreCase(worldpayConstants.KLARNA) && showKlarna)
				|| (APMLookupServicePmtMtds.contains(itemId) && ((itemId.equalsIgnoreCase(worldpayConstants.WECHATPAY)
                      || (itemId.equalsIgnoreCase(worldpayConstants.ALIPAY))) && (utils.isDesktopDevice())))
				|| (APMLookupServicePmtMtds.contains(itemId) && (itemId.equalsIgnoreCase(worldpayConstants.ALIPAYMOBILE) && !(utils.isDesktopDevice())))
				|| (APMLookupServicePmtMtds.contains(itemId) && !itemId.equalsIgnoreCase(worldpayConstants.NORDEAFI) && !itemId.equalsIgnoreCase(worldpayConstants.KLARNA) &&
                      !itemId.equalsIgnoreCase(worldpayConstants.NORDEASE) && !itemId.equalsIgnoreCase(worldpayConstants.IDEAL) &&
                      !itemId.equalsIgnoreCase(worldpayConstants.WECHATPAY) &&
                      !itemId.equalsIgnoreCase(worldpayConstants.ALIPAY) && !itemId.equalsIgnoreCase(worldpayConstants.ALIPAYMOBILE))) {
                applicableAPMs.push(item);
            }
            if ((itemId.equalsIgnoreCase(worldpayConstants.KLARNASLICEIT) || itemId.equalsIgnoreCase(worldpayConstants.KLARNAPAYLATER) ||
                itemId.equalsIgnoreCase(worldpayConstants.KLARNAPAYNOW)) && siteCountry.equalsIgnoreCase(countryCode.toUpperCase())) {
                applicableAPMs.push(item);
            }
        }

        var creditCardPmtMtd = PaymentMgr.getPaymentMethod(worldpayConstants.CREDITCARD);
        if (creditCardPmtMtd != null && creditCardPmtMtd.active && creditCardPmtMtd.paymentProcessor && worldpayConstants.WORLDPAY.equals(creditCardPmtMtd.paymentProcessor.ID)) {
            applicableAPMs.push(creditCardPmtMtd);
        }
        var googlepay = PaymentMgr.getPaymentMethod(worldpayConstants.GOOGLEPAY);
        if (googlepay != null && googlepay.active && googlepay.paymentProcessor && worldpayConstants.WORLDPAY.equals(googlepay.paymentProcessor.ID)) {
            applicableAPMs.push(googlepay);
        }
        var creditCardPmtMtdWorldpay = PaymentMgr.getPaymentMethod(worldpayConstants.WORLDPAY);
        if (creditCardPmtMtdWorldpay != null && creditCardPmtMtdWorldpay.active && creditCardPmtMtdWorldpay.paymentProcessor &&
            worldpayConstants.WORLDPAY.equals(creditCardPmtMtdWorldpay.paymentProcessor.ID)) {
            applicableAPMs.push(creditCardPmtMtdWorldpay);
        }
        var applePayWorldPay = PaymentMgr.getPaymentMethod(worldpayConstants.APPLEPAY);
        if (applePayWorldPay != null && applePayWorldPay.active && applePayWorldPay.paymentProcessor && worldpayConstants.WORLDPAY.equals(applePayWorldPay.paymentProcessor.ID)) {
            applicableAPMs.push(applePayWorldPay);
        }
    }
    return {
        applicableAPMs: applicableAPMs
    };
}

exports.updateToken = updateToken;
exports.handleAPM = handleAPM;
exports.handleCardRedirect = handleCardRedirect;
exports.handleCreditCard = handleCreditCard;
exports.authorize = authorize;
exports.applicablePaymentMethods = applicablePaymentMethods;
exports.getMerchantCodeForMultiMerchant = getMerchantCodeForMultiMerchant;
exports.getTokenProcessUtils = getTokenProcessUtils;
exports.nominalValueCancelrequest = nominalValueCancelrequest;
