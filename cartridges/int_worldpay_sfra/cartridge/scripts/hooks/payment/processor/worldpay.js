'use strict';

var server = require('server');
var Site = require('dw/system/Site');
var Status = require('dw/system/Status');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
var WorldpayPayment = require('*/cartridge/scripts/order/WorldpayPayment');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
/**
 * Verifies a credit card against a valid card number and expiration date and possibly invalidates invalid form fields.
 * If the verification was successful a credit card payment instrument is created.
 */
/**
 * Verifies that entered payment information is a valid. If the information is valid payment instrument is created
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an error object
 */
function handle(basket, paymentInformation) {
    var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var Resource = require('dw/web/Resource');
    var paymentforms;
    var cardErrors = {};
    var paymentMethod = paymentInformation.selectedPaymentMethodID.value;
    paymentInformation.paymentPrice = basket.totalGrossPrice;// eslint-disable-line
    if (paymentMethod && paymentMethod.equals(PaymentInstrument.METHOD_CREDIT_CARD)) {
        paymentforms = server.forms.getForm('billing').creditCardFields;
        if (paymentforms.saveCard && paymentforms.saveCard.value) {
            paymentInformation.saveCard = {// eslint-disable-line
                value: paymentforms.saveCard.value,
                htmlName: paymentforms.saveCard.htmlName
            };
        }
        if (!paymentInformation.cardOwner.value) {
            paymentInformation.cardOwner.value = paymentforms.cardOwner.value;// eslint-disable-line
        }
        var cardNumber = paymentInformation.cardNumber.value;
        var cardSecurityCode = paymentInformation.securityCode.value;
        var expirationMonth = paymentInformation.expirationMonth.value;
        var expirationYear = paymentInformation.expirationYear.value;
        var encryptedData = paymentInformation.encryptedData.value;

        var serverErrors = [];
        var creditCardStatus = {};
        var cvvDisabled = Boolean(Site.getCurrent().getCustomPreferenceValue('WorldpayDisableCVV'));
        var cardType = paymentInformation.cardType.value;
        var paymentCard = PaymentMgr.getPaymentCard(cardType);
        var regex = /^([0-9]{3})$/;
        var regexAmex = /^([0-9]{4})$/;

        if (paymentCard) {
            if (!paymentInformation.creditCardToken && !encryptedData) {
                if (cvvDisabled != null && cvvDisabled === false) {
                    creditCardStatus = paymentCard.verify(
                    expirationMonth,
                    expirationYear,
                    cardNumber,
                    cardSecurityCode
                    );
                }
                if (cvvDisabled != null && cvvDisabled === true) {
                    creditCardStatus = paymentCard.verify(
                         expirationMonth,
                         expirationYear,
                         cardNumber
                         );
                }
            } else if (paymentInformation.creditCardToken && cvvDisabled != null && cvvDisabled === false) {
                if (!regex.test(cardSecurityCode) && !cardType.equalsIgnoreCase('AMEX')) {
                    creditCardStatus = new Status(Status.ERROR, PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE);
                }
                if (!regexAmex.test(cardSecurityCode) && cardType.equalsIgnoreCase('AMEX')) {
                    creditCardStatus = new Status(Status.ERROR, PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE);
                }
            }
        } else {
            creditCardStatus = {
                error: true,
                cardUnknown: true
            };
        }

        if (!creditCardStatus.error && cvvDisabled != null && cvvDisabled === false) {
            if (!regex.test(cardSecurityCode) && !cardType.equalsIgnoreCase('AMEX')) {
                creditCardStatus = new Status(Status.ERROR, PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE);
            }
            if (!regexAmex.test(cardSecurityCode) && cardType.equalsIgnoreCase('AMEX')) {
                creditCardStatus = new Status(Status.ERROR, PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE);
            }
        }
        if (creditCardStatus.error) {
            if (!(creditCardStatus instanceof Status) && creditCardStatus.cardUnknown) {
                cardErrors[paymentInformation.cardNumber.htmlName] =
                    Resource.msg('error.invalid.card.number', 'creditCard', null);
            } else if (creditCardStatus.items) {
                var item;
                for (var k = 0; k < creditCardStatus.items.length; k++) {
                    item = creditCardStatus.items[k];
                    switch (item.code) {
                        case PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER:
                            cardErrors[paymentInformation.cardNumber.htmlName] =
                                Resource.msg('error.invalid.card.number', 'creditCard', null);
                            break;

                        case PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE:
                            cardErrors[paymentInformation.expirationMonth.htmlName] =
                                Resource.msg('error.expired.credit.card', 'creditCard', null);
                            cardErrors[paymentInformation.expirationYear.htmlName] =
                                Resource.msg('error.expired.credit.card', 'creditCard', null);
                            break;

                        case PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE:
                            cardErrors[paymentInformation.securityCode.htmlName] =
                                Resource.msg('error.invalid.security.code', 'creditCard', null);
                            break;
                        default:
                            serverErrors.push(
                                Resource.msg('error.card.information.error', 'creditCard', null)
                            );
                    }
                }
            }
            return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: true };
        }

        var cardHandleResult = WorldpayPayment.handleCreditCard(basket, paymentInformation);
        if (cardHandleResult.error) {
            paymentforms.encryptedData = '';
        }
    } else if (paymentMethod && (paymentMethod.equals(WorldpayConstants.WORLDPAY))) {
        // start
        paymentforms = server.forms.getForm('billing').creditCardFields;
        if (paymentforms.saveCard && paymentforms.saveCard.value) {
            paymentInformation.saveCard = {// eslint-disable-line
                value: paymentforms.saveCard.value,
                htmlName: paymentforms.saveCard.htmlName
            };
        }
        // end
        var billingform = server.forms.getForm('billing');
        if (paymentMethod.equals(WorldpayConstants.WORLDPAY) && Site.getCurrent().getCustomPreferenceValue('WorldpayEnableTokenization') && basket.getCustomer().authenticated
            && paymentInformation.cardNumber.value) {
            billingform.paymentMethod.value = WorldpayConstants.CREDITCARD;
        }
        return WorldpayPayment.handleCardRedirect(basket, paymentInformation);
    } else if (paymentMethod != null) {
        return WorldpayPayment.handleAPM(basket, paymentInformation);
    }
    return '';
}


/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function authorize(orderNumber, paymentInstrument, paymentProcessor) {
    if (!paymentProcessor || !paymentProcessor.getID().equalsIgnoreCase(WorldpayConstants.WORLDPAY) || !paymentInstrument) {
        var errors = [];
        var Resource = require('dw/web/Resource');
        errors.push(Resource.msg('error.payment.processor.not.supported', 'checkout', null));
        return { fieldErrors: [], serverErrors: errors, error: true };
    }
    var paymentforms = server.forms.getForm('billing').creditCardFields;
    var cardNumber = paymentforms.cardNumber ? paymentforms.cardNumber.value : '';
    var encryptedData = paymentforms.encryptedData ? paymentforms.encryptedData.value : '';
    var cvn = paymentforms.securityCode ? paymentforms.securityCode.value : '';
    return WorldpayPayment.authorize(orderNumber, cardNumber, encryptedData, cvn);
}

/**
 * Update Token in payment Instrument for customer save payent instrument
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to update token
 * @param {dw.customer.Customer} customer -  The customer where the token value to preseve in saved cards
 * @return {Object} returns an error object
 */
function updateToken(paymentInstrument, customer) {
    return WorldpayPayment.updateToken(paymentInstrument, customer);
}

/**
 * Initiate processor hook manager for worldpay order
 * @param {dw.order.Order} order - order object
 * @param {string} orderNumber - order number
 * @param {int} cvn - cvv number
 * @return {Object} returns a result object after the service call
 */
function handlemotoorder(order, orderNumber, cvn) {
    var result = {};
    var HookMgr = require('dw/system/HookMgr');
    var Transaction = require('dw/system/Transaction');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var OrderMgr = require('dw/order/OrderMgr');

    if (order.totalNetPrice !== 0.00) {
        var paymentInstruments = order.paymentInstruments;

        if (paymentInstruments.length === 0) {
            Transaction.wrap(function () { OrderMgr.failOrder(order); });
            result.error = true;
        }

        if (!result.error) {
            for (var i = 0; i < paymentInstruments.length; i++) {
                var paymentInstrument = paymentInstruments[i];
                var paymentProcessor = PaymentMgr
                    .getPaymentMethod(paymentInstrument.paymentMethod)
                    .paymentProcessor;
                var authorizationResult;
                if (paymentProcessor === null) {
                    Transaction.begin();
                    paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
                    Transaction.commit();
                } else {
                    delete session.custom.motocvn; // eslint-disable-line
                    session.custom.motocvn = cvn; // eslint-disable-line
                    if (HookMgr.hasHook('app.payment.processor.' +
                            paymentProcessor.ID.toLowerCase())) {
                        authorizationResult = HookMgr.callHook(
                            'app.payment.processor.' + paymentProcessor.ID.toLowerCase(),
                            'Authorize',
                            orderNumber,
                            paymentInstrument,
                            paymentProcessor
                        );
                    } else {
                        authorizationResult = HookMgr.callHook(
                            'app.payment.processor.default',
                            'Authorize'
                        );
                    }
                    result = authorizationResult;
                    if (authorizationResult.error) {
                        Transaction.wrap(function () { OrderMgr.failOrder(order); });
                        result.error = true;
                        break;
                    }
                }
            }
        }
    }

    return result;
}

/**
 * Authorizes a payment using a credit card.
 * @param {Object} order - The current order
 * @param {Object} paymentDetails -  The payment paymentDetails to authorize
 * @param {number} cvn - cvn
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns a Status object
 */
function authorizeCreditCard(order, paymentDetails, cvn) {// eslint-disable-line
    var result = handlemotoorder(order, order.currentOrderNo, cvn);
    var paymentProcessor = paymentDetails.paymentTransaction.paymentProcessor.ID;
    if (result.error) {
        var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');
        return new Status(Status.ERROR, PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE, result.errorMessage);
    }
    var req = request; // eslint-disable-line
    var localeid = (req.locale.id) ? req.locale.id : 'default';
    if (paymentProcessor === 'Worldpay') {
        COHelpers.sendConfirmationEmail(order, localeid);
    }
    return new Status(Status.OK);
}


/**
 * if PaymentMethod has a custom property 'csc_payment' the filter works automatically
 * @return {Object} returns a Status object
 * @param {string} paymentMethodResultResponse - paymentMethod Result
 */
function modifyGETResponse(paymentMethodResultResponse) {
    var hideApmForMoto = Boolean(Site.getCurrent().getCustomPreferenceValue('hideApmForMoto'));
    if (request.clientId === "dw.csc" && hideApmForMoto != null && hideApmForMoto) { // eslint-disable-line
        var applicablePaymentMethods = [];
        for (var index in paymentMethodResultResponse.applicablePaymentMethods) {// eslint-disable-line
            var paymentMethod = paymentMethodResultResponse.applicablePaymentMethods[index];
            if (paymentMethod.id == 'CREDIT_CARD') { // eslint-disable-line
                applicablePaymentMethods.push(paymentMethod);
            }
        }
        paymentMethodResultResponse.applicablePaymentMethods = applicablePaymentMethods; // eslint-disable-line
    }
    return new Status(Status.OK);
}

exports.modifyGETResponse = modifyGETResponse;
exports.UpdateToken = updateToken;
exports.Handle = handle;
exports.Authorize = authorize;
exports.authorizeCreditCard = authorizeCreditCard;
