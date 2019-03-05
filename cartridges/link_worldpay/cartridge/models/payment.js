'use strict';
var Resource = require('dw/web/Resource');

var ArrayList = require('dw/util/ArrayList');
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var array = require('*/cartridge/scripts/util/array');
var collections = require('*/cartridge/scripts/util/collections');
var WorldpayPreferences = require('*/cartridge/scripts/object/WorldpayPreferences');
var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');

var RESOURCES = {
    addPaymentButton: Resource.msg('button.add.payment', 'checkout', null),
    backToStoredPaymentButton: Resource.msg('button.back.to.stored.payments', 'checkout', null),
    cardOwnerLabel: Resource.msg('label.input.creditcard.owner', 'forms', null),
    cardNumberLabel: Resource.msg('field.credit.card.number', 'creditCard', null),
    worldpayCardsLabel: Resource.msg('label.worldpay.cards', 'forms', null),
    expirationMonthLabel: Resource.msg('field.credit.card.expiration.month', 'creditCard', null),
    expirationYearLabel: Resource.msg('field.credit.card.expiration.year', 'creditCard', null),
    securityCodeLabel: Resource.msg('field.credit.card.security.code', 'creditCard', null),
    emailLabel: Resource.msg('field.customer.email', 'checkout', null),
    phoneLabel: Resource.msg('field.customer.phone.number', 'checkout', null),
    creditorIdentifierLabel: Resource.msg('forms.elv.creditoridentifier', 'forms', null),
    worldpayCardsToolTip: Resource.msg('tooltip.worldpay.cards', 'forms', null),
    emailToolTip: Resource.msg('tooltip.email', 'creditCard', null),
    phoneToolTip: Resource.msg('tooltip.phone.number', 'creditCard', null),
    securityCodeToolTip: Resource.msg('tooltip.security.code', 'creditCard', null),
    cpfToolTip: Resource.msg('tooltip.cpf', 'forms', null),
    cpfLabel: Resource.msg('label.cpf', 'forms', null),
    installmentsToolTip: Resource.msg('tooltip.installments', 'forms', null),
    installmentsLabel: Resource.msg('label.installments', 'forms', null),
    ibanToolTip: Resource.msg('tooltip.iban', 'forms', null),
    ibanLabel: Resource.msg('label.iban', 'forms', null),
    accountHolderNameToolTip: Resource.msg('tooltip.accountHolderName', 'forms', null),
    accountHolderNameLabel: Resource.msg('label.accountHolderName', 'forms', null),
    bankNameToolTip: Resource.msg('tooltip.bankName', 'forms', null),
    bankNameLabel: Resource.msg('label.bankName', 'forms', null),
    bankLocationToolTip: Resource.msg('tooltip.bankLocation', 'forms', null),
    bankLocationLabel: Resource.msg('label.bankLocation', 'forms', null),
    bankCodeToolTip: Resource.msg('tooltip.bankCode', 'forms', null),
    bankCodeLabel: Resource.msg('label.bankCode', 'forms', null),
    bankToolTip: Resource.msg('tooltip.bank', 'forms', null),
    bankLabel: Resource.msg('label.bank', 'forms', null),
    termsConditionLabel: Resource.msg('label.termsCondition', 'forms', null),
    paymentByLabel: Resource.msg('worldpay.payment.type.selectedmethod', 'worldpay', null),
    amountLabel: Resource.msg('worldpay.payment.amount', 'worldpay', null),
    makePaymentAtLabel: Resource.msg('worldpay.konbini.payment.reference', 'worldpay', null),
    clickHereLinkLabel: Resource.msg('worldpay.payment.clickhere', 'worldpay', null),
    cardOwnerToolTip: Resource.msg('tooltip.cardOwner', 'forms', null),
    cardNumberToolTip: Resource.msg('tooltip.cardNumber', 'forms', null),
    expirationMonthToolTip: Resource.msg('tooltip.expirationMonth', 'forms', null),
    expirationYearToolTip: Resource.msg('tooltip.expirationYear', 'forms', null),
    selectpreferedcreditcard: Resource.msg('billing.selectpreferedcreditcard', 'worldpay', null),
    worldpayortext: Resource.msg('worldpay.or', 'worldpay', null),
    mandateTypeLabel: Resource.msg('label.mandateType', 'forms', null),
    mandateTypeToolTip: Resource.msg('tooltip.mandateTypeToolTip', 'forms', null)
};

/**
 * Creates an array of objects containing applicable credit cards
 * @param {dw.util.Collection<dw.order.PaymentCard>} paymentCards - An ArrayList of applicable
 *      payment cards that the user could use for the current basket.
 * @returns {Array} Array of objects that contain information about applicable payment cards for
 *      current basket.
 */
function applicablePaymentCards(paymentCards) {
    return collections.map(paymentCards, function (card) {
        return {
            cardType: card.cardType,
            name: card.name,
            value: card.custom.worldPayCardType,
            displayValue: card.name
        };
    });
}

/**
 * Provide Ideal bank key value pairs.
 * @param {dw.util.Collection<dw.value.EnumValue>} worldPayIdealBankList - An ArrayList of bank enumValue in custom preference.
 * @returns {Array} Array of objects that contain information about ideal bank.
 */
function getIdealBankList(worldPayIdealBankList) {
    var bankArray = worldPayIdealBankList;
    if (bankArray && bankArray.length > 0) {
        return bankArray.map(function (bank) {
            return {
                value: bank.value,
                displayValue: bank.displayValue
            };
        });
    }
    return null;
}

/**
 * Provide Preferred Cards list.
 * @param {Object} preferences - the associated worldpay preferences
 * @param {Object} paymentCards - the associated active PaymentCards as per customer country
 * @returns {Array} Array of objects that contain information about Preferred Cards.
 */
function getPreferredCards(preferences, paymentCards) {
    var preferredCardsMap = {};
    if (preferences.worldPayEnableCardSelection) {
        var cardsArray = preferences.worldPayPaymentMethodMaskIncludes;
        if (cardsArray && cardsArray.valueOf()) {
            preferredCardsMap = cardsArray.map(function (card) {
                return {
                    value: card.valueOf() || '',
                    displayValue: card.valueOf() || ''
                };
            });
        }
        if (paymentCards) {
            var activeCardsMap = paymentCards.map(function (card) {
                return {
                    value: card.value,
                    displayValue: card.displayValue
                };
            });
            var tempArray = [];
            if (preferredCardsMap && activeCardsMap) {
                tempArray = tempArray.concat(preferredCardsMap).concat(activeCardsMap);
                preferredCardsMap = tempArray;
            } else if (activeCardsMap) {
                preferredCardsMap = activeCardsMap;
            }
        }
    }
    return preferredCardsMap;
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
    var applicablePMResult = require('*/cartridge/scripts/order/WorldpayPayment').applicablePaymentMethods(paymentMethods, countryCode, preferences);
    var applicableAPMs = applicablePMResult.applicableAPMs;
    return collections.map(applicableAPMs, function (method) {
        return {
            ID: method.ID,
            name: method.name,
            apmImagePath: (method.image != null) ? method.image.absURL.toString() : null
        };
    });
}

/**
 * Provide the ELV form content.
 * @param {dw.util.ArrayList<dw.order.dw.order.PaymentMethod>} paymentMethods - An ArrayList of
 *      applicable payment methods that the user could use for the current basket.
 * @param {string} countryCode - the associated apm countryCode
 * @param {Object} preferences - the associated worldpay preferences
 * @returns {Array} of json key value pairs that contain information about the ELV form field and content to display.
 */
function getELVFormContent(paymentMethods, countryCode, preferences) {
    var paymentMethod = PaymentMgr.getPaymentMethod('ELV-SSL');
    if (paymentMethod && paymentMethod.active) {
        var elvMandateTypeList = new ArrayList();
        elvMandateTypeList.add('ONE-OFF');
        elvMandateTypeList.add('RECURRING');

        var elvMerchantNumber = '';

        if ((paymentMethod.custom.mandateNumber != null) && (paymentMethod.custom.merchantID != null)) {
            elvMerchantNumber = paymentMethod.custom.mandateNumber;
        } else {
            elvMerchantNumber = preferences.worldPayMerchantNumber;
        }
        var System = require('dw/system/System');
        var date = System.calendar.time;
        var uniqueId = date.getFullYear().toString() + date.getMonth() + date.getDate() + date.getHours() + date.getMinutes() + date.getSeconds() + date.getMilliseconds();
        var mandateID = 'M-' + elvMerchantNumber + '-' + uniqueId;
        var ContentMgr = require('dw/content/ContentMgr');
        return {
            elvMandateTypeList: elvMandateTypeList,
            mandateID: mandateID,
            worldPayMerchantNumber: elvMerchantNumber,
            worldPayELVMandateType: preferences.worldPayELVMandateType,
            worldPayELVCreditorIdentifier: preferences.worldPayELVCreditorIdentifier,
            worldPayELVCreditorName: preferences.worldPayELVCreditorName,
            worldPayELVCreditorAddress: preferences.worldPayELVCreditorAddress,
            worldPayELVConsent: ContentMgr.getContent('worldpay-elv-consent')
        };
    }
    return null;
}

/**
 * Creates an array of objects containing selected payment information
 * @param {dw.util.ArrayList<dw.order.PaymentInstrument>} selectedPaymentInstruments - ArrayList
 *      of payment instruments that the user is using to pay for the current basket
 * @param {string} countryCode - the associated apm countryCode
 * @param {List} applicablePayMethods - applicable payment methods
 * @returns {Array} Array of objects that contain information about the selected payment instruments
 */
function getSelectedPaymentInstruments(selectedPaymentInstruments, countryCode, applicablePayMethods) {
    var formatMoney = require('dw/util/StringUtils').formatMoney;
    return collections.map(selectedPaymentInstruments, function (paymentInstrument) {
        var matchPaymentInstrument = null;
        if (applicablePayMethods) {
            matchPaymentInstrument = array.find(applicablePayMethods, function (method) {
                if (method.ID.equals(paymentInstrument.paymentMethod)) {
                    return true;
                }
                return false;
            });
        }
        if (undefined === matchPaymentInstrument || !matchPaymentInstrument) {
            return {};
        }
        var results = {
            paymentMethod: paymentInstrument.paymentMethod,
            paymentMethodName: PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod) ? PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).name : paymentInstrument.paymentMethod,
            amount: paymentInstrument.paymentTransaction.amount.value,
            amountFormatted: formatMoney(paymentInstrument.paymentTransaction.amount)
        };
        if (paymentInstrument.paymentMethod === WorldpayConstants.CREDITCARD) {
            results.lastFour = paymentInstrument.creditCardNumberLastDigits;
            results.owner = paymentInstrument.creditCardHolder;
            results.expirationYear = paymentInstrument.creditCardExpirationYear;
            results.type = paymentInstrument.creditCardType;
            results.maskedCreditCardNumber = paymentInstrument.maskedCreditCardNumber;
            results.expirationMonth = paymentInstrument.creditCardExpirationMonth;
        } else if (paymentInstrument.paymentMethod === 'GIFT_CERTIFICATE') {
            results.giftCertificateCode = paymentInstrument.giftCertificateCode;
            results.maskedGiftCertificateCode = paymentInstrument.maskedGiftCertificateCode;
        } else if (paymentInstrument.paymentMethod === WorldpayConstants.KONBINI) {
            results.konbiniPaymentReference = paymentInstrument.custom.wpKonbiniPaymentReference;
        } else if (paymentInstrument.paymentMethod === WorldpayConstants.WECHATPAY) {
            results.wechatQRCode = paymentInstrument.custom.wpWechatQRCode;
        } else if (paymentInstrument.paymentMethod === WorldpayConstants.GIROPAY) {
            results.bankCode = paymentInstrument.custom.bankCode;
        } else if (paymentInstrument.paymentMethod === WorldpayConstants.IDEAL) {
            results.bank = paymentInstrument.custom.bank;
        } else if (paymentInstrument.paymentMethod === WorldpayConstants.ELV) {
            results.iban = paymentInstrument.custom.iban;
            results.accountHolderName = paymentInstrument.custom.accountHolderName;
            results.bankName = paymentInstrument.custom.bankName;
            results.bankLocation = paymentInstrument.custom.bankLocation;
        }
        if ((paymentInstrument.paymentMethod === WorldpayConstants.BOLETO) || (countryCode === 'BR' && (paymentInstrument.paymentMethod === WorldpayConstants.CREDITCARD || paymentInstrument.paymentMethod === WorldpayConstants.WORLDPAY))) {
            results.cpf = paymentInstrument.custom.cpf;
            results.installments = paymentInstrument.custom.installments;
        }

        return results;
    });
}

/**
 * Payment class that represents payment information for the current basket
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {dw.customer.Customer} currentCustomer - the associated Customer object
 * @param {string} countryCode - the associated Site countryCode
 * @constructor
 */
function Payment(currentBasket, currentCustomer, countryCode) {
    var paymentCountryCode = currentBasket.billingAddress ? currentBasket.billingAddress.countryCode.value : countryCode;
    var paymentAmount = currentBasket.totalGrossPrice;
    var paymentMethods = PaymentMgr.getApplicablePaymentMethods(
        currentCustomer,
        paymentCountryCode,
        paymentAmount.value
    );
    var paymentCards = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD)
        .getApplicablePaymentCards(currentCustomer, paymentCountryCode, paymentAmount.value);
    var paymentInstruments = currentBasket.paymentInstruments;

    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit();

    this.worldPayIdealBankList = getIdealBankList(preferences.worldPayIdealBankList);

    // TODO: Should compare currentBasket and currentCustomer and countryCode to see
    //     if we need them or not
    this.applicablePaymentMethods =
        paymentMethods ? applicablePaymentMethods(paymentMethods, paymentCountryCode, preferences) : null;

    this.resources = RESOURCES;

    this.applicablePaymentCards =
        paymentCards ? applicablePaymentCards(paymentCards) : null;

    this.selectedPaymentInstruments = paymentInstruments ?
        getSelectedPaymentInstruments(paymentInstruments, paymentCountryCode, this.applicablePaymentMethods) : null;

    this.elv =
            paymentMethods ? getELVFormContent(paymentMethods, paymentCountryCode, preferences) : null;
    this.worldPayPreferredCards = getPreferredCards(preferences, this.applicablePaymentCards);

    this.apmlookupCountry = paymentCountryCode;

    this.worldpayEnableTokenization = preferences.worldPayEnableTokenization;
}

module.exports = Payment;
