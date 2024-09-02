/* API Includes */
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var paymentInstrumentUtils = require('*/cartridge/scripts/common/paymentInstrumentUtils');
var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
var Logger = require('dw/system/Logger');
var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');
var Status = require('dw/system/Status');
var worldpayPayment = require('*/cartridge/scripts/order/worldpayPayment');
var OrderMgr = require('dw/order/OrderMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var ArrayList = require('dw/util/ArrayList');
var Resource = require('dw/web/Resource');
var PaymentMgr = require('dw/order/PaymentMgr');
var sessionObject = session;
var requestObject = request;
var customerObject = customer;
var utils = require('*/cartridge/scripts/common/utils');
/**
 * This controller implements the billing logic. It is used by both the single shipping and the multi shipping
 * scenario and is responsible for providing the payment method selection as well as entering a billing address.
 *
 * @module scripts/worldpayHelper
 */
/**
* Replace token from old to new card
* @param {Object} newCreditCard - newCreditCard
* @param {Object} creditcard - old creditcard
*/
function replaceToken(newCreditCard, creditcard) {
    if (Site.getCurrent().getCustomPreferenceValue('WorldpayEnableTokenization')
            && creditcard.getCreditCardToken() && !newCreditCard.getCreditCardToken()) {
        newCreditCard.setCreditCardToken(creditcard.getCreditCardToken());
        Transaction.wrap(function () {
            if (creditcard.custom.tokenScope && !(newCreditCard.custom.tokenScope)) {
                newCreditCard.custom.tokenScope = creditcard.custom.tokenScope; // eslint-disable-line
            }
        });
    }
    if (Site.getCurrent().getCustomPreferenceValue('enableStoredCredentials') && creditcard.custom.transactionIdentifier && !(newCreditCard.custom.transactionIdentifier)) {
        Transaction.wrap(function () {
            newCreditCard.custom.transactionIdentifier = creditcard.custom.transactionIdentifier; // eslint-disable-line
        });
    }
}
/**
 * Retrive order based on order_id from session
 * @param {Object} order - Order Object
 * @return {Object} returns an object
 */
function getOrder(order) {
    if (!order) {
        if (requestObject.httpParameterMap.order_id.stringValue) {
            var orderObj = OrderMgr.getOrder(requestObject.httpParameterMap.order_id.stringValue);
            if (orderObj && (requestObject.httpParameterMap.order_token.stringValue === orderObj.getOrderToken())) {
                return {
                    success: true,
                    Order: orderObj
                };
            }
            return {
                error: true,
                Order: null
            };
        }
        return {
            error: true,
            Order: null
        };
    }
    return {
        success: true,
        Order: order
    };
}

/**
 * Return applicable cards based on tokenization and encryption setting in Worldpay
 * @param {Object} ApplicableCreditCards - ApplicableCreditCards
 * @return {Object} ApplicableCreditCards - ApplicableCreditCards
 */
function availableCreditCards(ApplicableCreditCards) {
    var NewApplicableCreditCards = new ArrayList();
    if (ApplicableCreditCards) {
        for (const ApplicableCreditCard of ApplicableCreditCards) {
            NewApplicableCreditCards.add(ApplicableCreditCard);
        }
    }
    return NewApplicableCreditCards;
}

/**
 * get form errors and add them to an object
 * @param {Object} form - the target product line item
 * @returns {Object} - an object that contain the error in the form
 */
function getFormErrors(form) {
    var results = {};
    if (!form) {
        return {};
    }
    Object.keys(form).forEach(function (key) {
        if (form[key]) {
            if (form[key].toString().indexOf('FormField') > -1 && !form[key].valid) {
                results[form[key].htmlName] = form[key].error;
                form[key].invalidateFormElement(form[key].error);
            }
            if (form[key].toString().indexOf('FormGroup') > -1) {
                var innerFormResult = getFormErrors(form[key]);
                Object.keys(innerFormResult).forEach(function (innerKey) {
                    results[innerKey] = innerFormResult[innerKey];
                });
            }
        }
    });
    return results;
}

/**
 * Verifies a credit card against a valid card number and expiration date and possibly invalidates invalid form fields.
 * If the verification was successful a credit card payment instrument is created.
 *  @param {Object} args - Arguments
 *  @return {JSON} returns an JSON object
 */
function handle(args) {
    var BasketMgr = require('dw/order/BasketMgr');
    var tokenId = '';
    var paymentFieldErrors = {};
    var paymentForm = sessionObject.forms.billing.paymentMethods;
    var basket = args.Basket;
    // object formation based on form fields
    var paymentInformation = {
        selectedPaymentMethodID: {
            value: paymentForm.selectedPaymentMethodID ? paymentForm.selectedPaymentMethodID.value : '',
            htmlName: paymentForm.selectedPaymentMethodID.value
        },
        cardType: {
            value: paymentForm.creditCard.type ? paymentForm.creditCard.type.value : '',
            htmlName: paymentForm.creditCard.type.htmlName
        },
        cardOwner: {
            value: paymentForm.creditCard.owner ? paymentForm.creditCard.owner.value : '',
            htmlName: paymentForm.creditCard.owner.htmlName
        },
        cardNumber: {
            value: paymentForm.creditCard.number ? paymentForm.creditCard.number.value : '',
            htmlName: paymentForm.creditCard.number.htmlName
        },
        securityCode: {
            value: paymentForm.creditCard.cvn ? paymentForm.creditCard.cvn.value : '',
            htmlName: paymentForm.creditCard.cvn.htmlName
        },
        expirationMonth: {
            value: paymentForm.creditCard.expiration.month.selectedOption ? parseInt(
                    paymentForm.creditCard.expiration.month.selectedOption.htmlValue, 10) : '',
            htmlName: paymentForm.creditCard.expiration.month.htmlName
        },
        expirationYear: {
            value: paymentForm.creditCard.expiration.year ? parseInt(paymentForm.creditCard.expiration.year.value, 10)
                    : '',
            htmlName: paymentForm.creditCard.expiration.year.htmlName
        },
        encryptedData: {
            value: paymentForm.creditCard.encryptedData ? paymentForm.creditCard.encryptedData.value : '',
            htmlName: paymentForm.creditCard.encryptedData.htmlName
        },
        preferredCard: {
            value: paymentForm.creditCard.cards ? paymentForm.creditCard.cards.value : '',
            htmlName: paymentForm.creditCard.cards.htmlName
        },
        idealFields: {
            bank: {
                value: paymentForm.idealFields.bank ? paymentForm.idealFields.bank.value : '',
                htmlName: paymentForm.idealFields.bank.htmlName
            }
        },
        brazilFields: {
            cpf: {
                value: paymentForm.creditCard.cpf ? paymentForm.creditCard.cpf.value : '',
                htmlName: paymentForm.creditCard.cpf.htmlName
            },
            installments: {
                value: paymentForm.creditCard.installments ? paymentForm.creditCard.installments.value : '',
                htmlName: paymentForm.creditCard.installments.htmlName
            }
        },
        elvFields: {
            elvMandateType: {
                value: paymentForm.elvFields.elvMandateType ? paymentForm.elvFields.elvMandateType.value : '',
                htmlName: paymentForm.elvFields.elvMandateType.htmlName
            },
            elvMandateID: {
                value: paymentForm.elvFields.elvMandateID ? paymentForm.elvFields.elvMandateID.value : '',
                htmlName: paymentForm.elvFields.elvMandateID.htmlName
            },
            iban: {
                value: paymentForm.elvFields.iban ? paymentForm.elvFields.iban.value : '',
                htmlName: paymentForm.elvFields.iban.htmlName
            },
            accountHolderName: {
                value: paymentForm.elvFields.accountHolderName ? paymentForm.elvFields.accountHolderName.value : '',
                htmlName: paymentForm.elvFields.accountHolderName.htmlName
            },
            elvConsent: {
                value: paymentForm.elvFields.elvConsent ? paymentForm.elvFields.elvConsent.value : false,
                htmlName: paymentForm.elvFields.elvConsent.htmlName
            }
        }
    };
    // remove existing payment instruments
    var paymentMethod = paymentInformation.selectedPaymentMethodID.value;
    paymentInformation.paymentPrice = basket.totalGrossPrice;
    Transaction.wrap(function () {
        paymentInstrumentUtils.removeExistingPaymentInstruments(basket);
    });
    var matchedPaymentInstrument;
    // retrieve saved card token for creditcard or redirect
    if (paymentForm.selectedPaymentMethodID.value.equals('CREDIT_CARD')
            || paymentForm.selectedPaymentMethodID.value.equals(worldpayConstants.WORLDPAY)) {
        if (customerObject.authenticated) {
            var wallet = customerObject.getProfile().getWallet();

            var paymentInstruments = wallet.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
            matchedPaymentInstrument = paymentInstrumentUtils.getTokenPaymentInstrument(paymentInstruments,
                    sessionObject.forms.billing.paymentMethods.creditCard.number.value,
                    sessionObject.forms.billing.paymentMethods.creditCard.type.value, paymentInformation.expirationMonth.value,
                    paymentInformation.expirationYear.value);
            if (matchedPaymentInstrument && matchedPaymentInstrument.getCreditCardToken()) {
                tokenId = matchedPaymentInstrument.getCreditCardToken();
            }
        }
    }
    // when saved card has token
    if (matchedPaymentInstrument && tokenId) {
        paymentInformation.cardOwner.value = matchedPaymentInstrument.creditCardHolder;
        paymentInformation.cardNumber.value = matchedPaymentInstrument.creditCardNumber;
        paymentInformation.cardType.value = matchedPaymentInstrument.creditCardType;
        paymentInformation.securityCode.value = paymentInformation.securityCode.value ? paymentInformation.securityCode.value
                : '';
        paymentInformation.expirationMonth.value = matchedPaymentInstrument.creditCardExpirationMonth;
        paymentInformation.expirationYear.value = matchedPaymentInstrument.creditCardExpirationYear;
        paymentInformation.creditCardToken = matchedPaymentInstrument.getCreditCardToken();
    }
    // when token not available for credit card then perform basic field vaildation
    if (!tokenId && paymentForm.selectedPaymentMethodID.value.equals('CREDIT_CARD')) {
        // verify credit card form data
        if (!paymentForm.creditCard.encryptedData || !paymentForm.creditCard.encryptedData.value) {
            paymentFieldErrors = getFormErrors(paymentForm.creditCard);
            if (!paymentForm.selectedPaymentMethodID.value) {
                if (BasketMgr.getCurrentBasket().totalGrossPrice.value > 0) {
                    paymentFieldErrors[paymentForm.selectedPaymentMethodID.htmlName] = Resource.msg(
                            'error.no.selected.payment.method', 'creditCard', null);
                    paymentForm.selectedPaymentMethodID.invalidateFormElement(Resource.msg(
                            'error.no.selected.payment.method', 'creditCard', null));
                }
            }
        }
    }
    if (Object.keys(paymentFieldErrors).length > 0) {
        return {
            fieldErrors: [paymentFieldErrors],
            serverErrors: {},
            error: true
        };
    }
    var regex = /^(\d{3})$/;
    var regexAmex = /^(\d{4})$/;
    // credit card complete validation flow
    if (paymentMethod && paymentMethod.equals(PaymentInstrument.METHOD_CREDIT_CARD)) {
        // save card opted by user
        if (paymentForm.creditCard.saveCard && paymentForm.creditCard.saveCard.value) {
            paymentInformation.saveCard = {
                value: paymentForm.creditCard.saveCard.value,
                htmlName: paymentForm.creditCard.saveCard.htmlName
            };
        }
        var cardNumber = paymentInformation.cardNumber.value;
        var cardSecurityCode = paymentInformation.securityCode.value;
        var expirationMonth = paymentInformation.expirationMonth.value;
        var expirationYear = paymentInformation.expirationYear.value;

        var serverErrors = [];
        var creditCardStatus = {};
        var cvvDisabled = Site.getCurrent().getCustomPreferenceValue('WorldpayDisableCVV');
        var cardType = paymentInformation.cardType.value;
        var paymentCard = PaymentMgr.getPaymentCard(cardType);

        if (paymentCard) {
            if (!paymentInformation.creditCardToken) {
                creditCardStatus = paymentCard.verify(expirationMonth, expirationYear, cardNumber, cardSecurityCode);
            } else if (paymentInformation.creditCardToken && !cvvDisabled) {
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

        if (!creditCardStatus.error && !cvvDisabled) {
            if (!regex.test(cardSecurityCode) && !cardType.equalsIgnoreCase('AMEX')) {
                creditCardStatus = new Status(Status.ERROR, PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE);
            }
            if (!regexAmex.test(cardSecurityCode) && cardType.equalsIgnoreCase('AMEX')) {
                creditCardStatus = new Status(Status.ERROR, PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE);
            }
        }
        if (creditCardStatus.error) {
            if (!(creditCardStatus instanceof Status) && creditCardStatus.cardUnknown) {
                paymentFieldErrors[paymentInformation.cardNumber.htmlName] = utils.getConfiguredLabel('error.invalid.card.number', 'creditCard');
                paymentForm.creditCard.number.invalidateFormElement(utils.getConfiguredLabel('error.invalid.card.number', 'creditCard'));
            } else if (creditCardStatus.items) {
                var item;
                for (var k = 0; k < creditCardStatus.items.size(); k++) {
                    item = creditCardStatus.items[k];
                    switch (item.code) {
                        case PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER:
                            paymentFieldErrors[paymentInformation.cardNumber.htmlName] = utils.getConfiguredLabel('error.invalid.card.number', 'creditCard');
                            paymentForm.creditCard.number.invalidateFormElement(utils.getConfiguredLabel('error.invalid.card.number', 'creditCard'));
                            break;

                        case PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE:
                            paymentFieldErrors[paymentInformation.expirationMonth.htmlName] = utils.getConfiguredLabel('error.expired.credit.card', 'creditCard');
                            paymentForm.creditCard.expiration.month.invalidateFormElement(utils.getConfiguredLabel('error.expired.credit.card', 'creditCard'));
                            paymentFieldErrors[paymentInformation.expirationYear.htmlName] = utils.getConfiguredLabel('error.expired.credit.card', 'creditCard');
                            paymentForm.creditCard.expiration.year.invalidateFormElement(utils.getConfiguredLabel('error.expired.credit.card', 'creditCard'));
                            break;

                        case PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE:
                            paymentFieldErrors[paymentInformation.securityCode.htmlName] = utils.getConfiguredLabel('error.invalid.security.code', 'creditCard');
                            paymentForm.creditCard.cvn.invalidateFormElement(utils.getConfiguredLabel('error.invalid.security.code', 'creditCard'));
                            break;
                        default:
                            serverErrors.push(Resource.msg('error.card.information.error', 'creditCard', null));
                    }
                }
            }
            return {
                fieldErrors: [paymentFieldErrors],
                serverErrors: serverErrors,
                error: true
            };
        }
        // payment instrument creation for credit card
        var cardHandleResult = worldpayPayment.handleCreditCard(basket, paymentInformation);
        if (cardHandleResult.error) {
            sessionObject.forms.billing.paymentMethods.creditCard.encryptedData.value = '';
        }
    } else if (paymentMethod && (paymentMethod.equals(worldpayConstants.WORLDPAY))) {
        // save card opted by user
        if (paymentForm.creditCard.saveCard && paymentForm.creditCard.saveCard.value) {
            paymentInformation.saveCard = {
                value: paymentForm.creditCard.saveCard.value,
                htmlName: paymentForm.creditCard.saveCard.htmlName
            };
        }
        // saved card handling for redirect
        if (paymentMethod.equals(worldpayConstants.WORLDPAY)
                && Site.getCurrent().getCustomPreferenceValue('WorldpayEnableTokenization')
                && basket.getCustomer().authenticated && paymentInformation.cardNumber.value) {
            if (paymentInformation.creditCardToken && !Site.getCurrent().getCustomPreferenceValue('WorldpayDisableCVV')) {
                if (!regex.test(paymentInformation.securityCode.value) && !paymentInformation.cardType.value.equalsIgnoreCase('AMEX')) {
                    paymentForm.creditCard.cvn.invalidateFormElement(utils.getConfiguredLabel('error.invalid.security.code', 'creditCard'));
                    return { fieldErrors: {}, serverErrors: {}, error: true, success: false };
                }
                if (!regexAmex.test(paymentInformation.securityCode.value) && paymentInformation.cardType.value.equalsIgnoreCase('AMEX')) {
                    paymentForm.creditCard.cvn.invalidateFormElement(utils.getConfiguredLabel('error.invalid.security.code', 'creditCard'));
                    return { fieldErrors: {}, serverErrors: {}, error: true, success: false };
                }
            }
            sessionObject.forms.billing.paymentMethods.selectedPaymentMethodID.value = worldpayConstants.CREDITCARD;
        }
        // payment instrument handling redirect
        return worldpayPayment.handleCardRedirect(basket, paymentInformation);
    } else if (paymentMethod) {
        // payment instrument handling for APM
        var handleAPMResult = worldpayPayment.handleAPM(basket, paymentInformation);
        if (handleAPMResult.success) {
            if (paymentForm.selectedPaymentMethodID.value.equals(worldpayConstants.IDEAL)) {
                paymentFieldErrors = getFormErrors(paymentForm.idealFields);
            } else if (paymentForm.selectedPaymentMethodID.value.equals(worldpayConstants.ELV)) {
                if (!paymentInformation.elvFields.elvConsent.value) {
                    paymentFieldErrors[paymentForm.elvFields.elvConsent.htmlName] = utils.getConfiguredLabel('error.message.required', 'forms');
                    paymentForm.elvFields.elvConsent.invalidateFormElement(utils.getConfiguredLabel('error.message.required', 'forms'));
                }
                paymentFieldErrors = getFormErrors(paymentForm.elvFields);
            }
            if (Object.keys(paymentFieldErrors).length > 0) {
                return {
                    fieldErrors: [paymentFieldErrors],
                    serverErrors: {},
                    error: true
                };
            }
        }
    }
    return {
        fieldErrors: {},
        serverErrors: {},
        error: false,
        success: true
    };
}

/**
 * Authorizes a payment using a credit card. The payment is authorized by using the BASIC_CREDIT processor
 * only and setting the order no as the transaction ID. Customizations may use other processors and custom
 * logic to authorize credit card payment.
 * @param {Object} args - Arguments
 * @return {Object} returns an object
 */
function authorize(args) {
    var orderNo = args.OrderNo;
    var paymentforms = sessionObject.forms.billing.paymentMethods.creditCard;
    var cardNumber = paymentforms.number ? paymentforms.number.value : '';
    var encryptedData = paymentforms.encryptedData ? paymentforms.encryptedData.value : '';
    var cvn = paymentforms.cvn ? paymentforms.cvn.value : '';

    var order = OrderMgr.getOrder(orderNo);
    sessionObject.privacy.order_id = order.orderNo;
    var authResponse = worldpayPayment.authorize(orderNo, cardNumber, encryptedData, cvn);
    if (authResponse.is3D) {
        sessionObject.privacy.echoData = authResponse.echoData;
    } else if (authResponse.worldpayredirect) {
        sessionObject.privacy.worldpayRedirectURL = authResponse.redirectUrl;
    }
    return authResponse;
}

/**
 * Replace the Payment Instrument with matching Customer Payment Instrument along with card token. Match criteria:- last 4 digits of crad number and card type
 * @param {PaymentInstrument} paymentInstrument -  The payment instrument
 * @param {PaymentInstrument} customerPaymentInstruments -  Customer payment instrument
 * @return {Object} returns an object
 */
function replacePaymentInstrument(paymentInstrument, customerPaymentInstruments) {
    var cardNumber = sessionObject.forms.paymentinstruments.creditcards.newcreditcard.number.value;
    var cardType = sessionObject.forms.paymentinstruments.creditcards.newcreditcard.type.value;
    try {
        var creditCardInstrument = null;
        // find credit card in payment instruments
        creditCardInstrument = paymentInstrumentUtils.getTokenPaymentInstrument(customerPaymentInstruments, cardNumber,
                cardType);
        if (creditCardInstrument) {
            var wallet = customerObject.getProfile().getWallet();
            wallet.removePaymentInstrument(creditCardInstrument);
            if (creditCardInstrument.getCreditCardToken()) {
                paymentInstrument.setCreditCardToken(creditCardInstrument.getCreditCardToken());
            }
        }
    } catch (ex) {
        Logger.getLogger('worldpay').error('worldpayHelper-ReplacePaymentInstrument error recieved : ' + ex.message);
    }
    return {};
}

/**
 * Clear worldpay form elements
 */
function worldPayClearFormElement() {
    sessionObject.forms.singleshipping.clearFormElement();
    sessionObject.forms.multishipping.clearFormElement();
    sessionObject.forms.billing.clearFormElement();
    sessionObject.privacy.order_id = '';
}

exports.handle = handle;
exports.authorize = authorize;
exports.ReplaceToken = replaceToken;
exports.AvailableCreditCards = availableCreditCards;
exports.GetOrder = getOrder;
exports.ReplacePaymentInstrument = replacePaymentInstrument;
exports.worldPayClearFormElement = worldPayClearFormElement;
