'use strict';

var ArrayList = require('dw/util/ArrayList');
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var array = require('*/cartridge/scripts/util/array');
var collections = require('*/cartridge/scripts/util/collections');
var WorldpayPreferences = require('*/cartridge/scripts/object/WorldpayPreferences');
var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
var utils = require('*/cartridge/scripts/common/Utils');

var RESOURCES = {
    addPaymentButton: utils.getConfiguredLabel('button.add.payment', 'checkout'),
    backToStoredPaymentButton: utils.getConfiguredLabel('button.back.to.stored.payments', 'checkout'),
    cardOwnerLabel: utils.getConfiguredLabel('label.input.creditcard.owner', 'forms'),
    cardNumberLabel: utils.getConfiguredLabel('field.credit.card.number', 'creditCard'),
    worldpayCardsLabel: utils.getConfiguredLabel('label.worldpay.cards', 'forms'),
    expirationMonthLabel: utils.getConfiguredLabel('field.credit.card.expiration.month', 'creditCard'),
    expirationYearLabel: utils.getConfiguredLabel('field.credit.card.expiration.year', 'creditCard'),
    securityCodeLabel: utils.getConfiguredLabel('field.credit.card.security.code', 'creditCard'),
    emailLabel: utils.getConfiguredLabel('field.customer.email', 'checkout'),
    phoneLabel: utils.getConfiguredLabel('field.customer.phone.number', 'checkout'),
    statementNarrativeLabel: utils.getConfiguredLabel('label.profile.statement.narrative', 'forms'),
    statementNarrativeDisclaimerText: utils.getConfiguredLabel('statement.narrative.disclaimer.text', 'forms'),
    creditorIdentifierLabel: utils.getConfiguredLabel('forms.elv.creditoridentifier', 'forms'),
    worldpayCardsToolTip: utils.getConfiguredLabel('tooltip.worldpay.cards', 'forms'),
    emailToolTip: utils.getConfiguredLabel('tooltip.email', 'creditCard'),
    phoneToolTip: utils.getConfiguredLabel('tooltip.phone.number', 'creditCard'),
    securityCodeToolTip: utils.getConfiguredLabel('tooltip.security.code', 'creditCard'),
    cpfToolTip: utils.getConfiguredLabel('tooltip.cpf', 'forms'),
    cpfLabel: utils.getConfiguredLabel('label.cpf', 'forms'),
    installmentsToolTip: utils.getConfiguredLabel('tooltip.installments', 'forms'),
    installmentsLabel: utils.getConfiguredLabel('label.installments', 'forms'),
    ibanToolTip: utils.getConfiguredLabel('tooltip.iban', 'forms'),
    ibanLabel: utils.getConfiguredLabel('label.iban', 'forms'),
    accountHolderNameToolTip: utils.getConfiguredLabel('tooltip.accountHolderName', 'forms'),
    accountHolderNameLabel: utils.getConfiguredLabel('label.accountHolderName', 'forms'),
    bankNameToolTip: utils.getConfiguredLabel('tooltip.bankName', 'forms'),
    bankNameLabel: utils.getConfiguredLabel('label.bankName', 'forms'),
    bankLocationToolTip: utils.getConfiguredLabel('tooltip.bankLocation', 'forms'),
    bankLocationLabel: utils.getConfiguredLabel('label.bankLocation', 'forms'),
    bankCodeToolTip: utils.getConfiguredLabel('tooltip.bankCode', 'forms'),
    bankCodeLabel: utils.getConfiguredLabel('label.bankCode', 'forms'),
    bankToolTip: utils.getConfiguredLabel('tooltip.bank', 'forms'),
    bankLabel: utils.getConfiguredLabel('label.bank', 'forms'),
    klarnaPaymentMethodLabel: utils.getConfiguredLabel('label.klarnaPaymentMethod', 'forms'),
    termsConditionLabel: utils.getConfiguredLabel('label.termsCondition', 'forms'),
    paymentByLabel: utils.getConfiguredLabel('worldpay.payment.type.selectedmethod', 'worldpay'),
    amountLabel: utils.getConfiguredLabel('worldpay.payment.amount', 'worldpay'),
    makePaymentAtLabel: utils.getConfiguredLabel('worldpay.konbini.payment.reference', 'worldpay'),
    clickHereLinkLabel: utils.getConfiguredLabel('worldpay.payment.clickhere', 'worldpay'),
    cardOwnerToolTip: utils.getConfiguredLabel('tooltip.cardOwner', 'forms'),
    cardNumberToolTip: utils.getConfiguredLabel('tooltip.cardNumber', 'forms'),
    expirationMonthToolTip: utils.getConfiguredLabel('tooltip.expirationMonth', 'forms'),
    expirationYearToolTip: utils.getConfiguredLabel('tooltip.expirationYear', 'forms'),
    selectpreferedcreditcard: utils.getConfiguredLabel('billing.selectpreferedcreditcard', 'worldpay'),
    worldpayortext: utils.getConfiguredLabel('worldpay.or', 'worldpay'),
    mandateTypeLabel: utils.getConfiguredLabel('label.mandateType', 'forms'),
    mandateTypeToolTip: utils.getConfiguredLabel('tooltip.mandateTypeToolTip', 'forms'),
    achAccountNumber: utils.getConfiguredLabel('label.ach.account.number', 'forms'),
    achRoutingNumber: utils.getConfiguredLabel('label.ach.routing.number', 'forms'),
    achAccountType: utils.getConfiguredLabel('label.ach.account.type', 'forms'),
    achCheckNumber: utils.getConfiguredLabel('label.ach.check.number', 'forms')
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
            apmImagePath: (method.image != null) ? method.image.absURL.toString() : null,
            formattedName: method.name.split(' ').join('-')
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
    var Site = require('dw/system/Site');
    var isMultiMerchantSupportEnabled = Site.current.getCustomPreferenceValue('enableMultiMerchantSupport');
    var GlobalHelper = require('*/cartridge/scripts/multimerchant/GlobalMultiMerchantHelper');

    var paymentMethod = PaymentMgr.getPaymentMethod('SEPA_DIRECT_DEBIT-SSL');
    if (paymentMethod && paymentMethod.active) {
        var elvMandateTypeList = new ArrayList();
        elvMandateTypeList.add('ONE-OFF');
        elvMandateTypeList.add('RECURRING');

        var elvMerchantNumber = '';

        if ((paymentMethod.custom.mandateNumber != null) && (paymentMethod.custom.merchantID != null)) {
            elvMerchantNumber = paymentMethod.custom.mandateNumber;
        } else if (isMultiMerchantSupportEnabled) {
            var config = GlobalHelper.getMultiMerchantConfiguration(paymentMethod);
            if (config && config.WorldpayMerchantNumber) {
                elvMerchantNumber = config.WorldpayMerchantNumber;
            } else {
                elvMerchantNumber = preferences.worldPayMerchantNumber;
            }
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
                if (method.ID === paymentInstrument.paymentMethod) {
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
            paymentMethodName: PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod) ?
                PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).name : paymentInstrument.paymentMethod,
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
            if (paymentInstrument.custom.binToken) {
                results.ccnum = paymentInstrument.custom.binToken;
            } else {
                var truncatedCardNumber = (paymentInstrument.creditCardNumber).slice(0, 6);
                results.ccnum = truncatedCardNumber;
            }
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
        } else if (paymentInstrument.paymentMethod === WorldpayConstants.ACHPAY) {
            results.achAccountType = paymentInstrument.custom.achAccountType;
            results.achAccountNumber = paymentInstrument.custom.achAccountNumber;
            results.achRoutingNumber = paymentInstrument.custom.achRoutingNumber;
            results.achCheckNumber = paymentInstrument.custom.achCheckNumber;
        }
        if ((paymentInstrument.paymentMethod === WorldpayConstants.BOLETO) ||
            (countryCode === 'BR' &&
                (paymentInstrument.paymentMethod === WorldpayConstants.CREDITCARD || paymentInstrument.paymentMethod === WorldpayConstants.WORLDPAY)
            )) {
            results.cpf = paymentInstrument.custom.cpf;
            results.installments = paymentInstrument.custom.installments;
        }

        return results;
    });
}

/**
 * Creates an array of objects containing the value and display value for applicable installments
 * @param {Array} installmentType - installmentType
 * @returns {List} array of objects containing the value and display value for applicable installments
 */
function getTenuresForInstallment(installmentType) {
    var installmentArray = installmentType;
    if (installmentArray && installmentArray.length > 0) {
        return installmentArray.map(function (Itype) {
            return {
                value: Itype.value,
                displayValue: Itype.displayValue
            };
        });
    }
    return null;
}


/**
 * Creates an array of objects containing the value and display value for applicable installments
 * @param {Object} preferences - the associated worldpay preferences
 * @param {string} type - the type configured
 * @returns {List} array of objects containing the value and display value for applicable installments
 */
function getInstallmentArray(preferences, type) {
    var Resource = require('dw/web/Resource');
    var tenures;
    if (type.equalsIgnoreCase(Resource.msg('latem.installment.type1', 'worldpay', null))) {
        tenures = getTenuresForInstallment(preferences.installmentType1);
        return tenures;
    } else if (type.equalsIgnoreCase(Resource.msg('latem.installment.type2', 'worldpay', null))) {
        tenures = getTenuresForInstallment(preferences.installmentType2);
        return tenures;
    } else if (type.equalsIgnoreCase(Resource.msg('latem.installment.type3', 'worldpay', null))) {
        tenures = getTenuresForInstallment(preferences.installmentType3);
        return tenures;
    } else if (type.equalsIgnoreCase(Resource.msg('latem.installment.type4', 'worldpay', null))) {
        tenures = getTenuresForInstallment(preferences.installmentType4);
        return tenures;
    }
    return tenures;
}


/**
 * Creates an array of objects containing the applicable countries for installment
 * @param {string} paymentCountryCode - the associated worldpay preferences
 * @param {Object} preferences - the associated worldpay preferences
 * @returns {Object} object with eligibility and type associated
 */
function getLatemCountries(paymentCountryCode, preferences) {
    var latAmCountriesForInstallment = preferences.latAmCountriesForInstallment;
    for (var i = 0; i < latAmCountriesForInstallment.length; i++) {
        var latAmCountriesForInstallmentAndType = latAmCountriesForInstallment[i];
        var splitLatAmCountriesForInstallmentAndType = latAmCountriesForInstallmentAndType.split(':');
        var country = splitLatAmCountriesForInstallmentAndType[0];
        if (country === paymentCountryCode) {
            var type = splitLatAmCountriesForInstallmentAndType[1];
            return {
                applicable: true,
                type: type
            };
        }
    }
    return {
        applicable: false,
        type: null
    };
}

/**
 * Prepare the PaymentMethods array in an order for UI purposes.
 * @param {Object} allPaymentsCount - all applicable payments
 * @returns {Object} sortedPayments based on selection in custom preferences
 */
function getSortedPaymentMethods(allPaymentsCount) {
    var Site = require('dw/system/Site');
    var CCPaymentOrder = Site.getCurrent().getCustomPreferenceValue('CreditCardPaymentOrder') || 1;
    var WalletPaymentOrder = Site.getCurrent().getCustomPreferenceValue('WalletPaymentOrder') || 2;
    var APMPaymentOrder = Site.getCurrent().getCustomPreferenceValue('APMPaymentOrder') || 3;
    var WPPaymentOrder = Site.getCurrent().getCustomPreferenceValue('WorldPayPaymentOrder') || 4;

    var CCmethodAvailable = 0;
    var WalletmethodAvailable = 0;
    var APMPAvailable = 0;
    var WPmethodAvailable = 0;

    allPaymentsCount.forEach(function (payment) {
        if (payment.ID === 'CREDIT_CARD') {
            CCmethodAvailable++;
        } else if (payment.ID === 'PAYWITHGOOGLE-SSL' || payment.ID === 'DW_APPLE_PAY') {
            WalletmethodAvailable++;
        } else if (payment.ID === 'Worldpay') {
            WPmethodAvailable++;
        } else {
            APMPAvailable++;
        }
    });
    var paymentDataObj = [
        {
            payName: 'CC',
            order: Number(CCPaymentOrder),
            count: Number(CCmethodAvailable)
        }, {
            payName: 'WALLET',
            order: Number(WalletPaymentOrder),
            count: Number(WalletmethodAvailable)
        }, {
            payName: 'APM',
            order: Number(APMPaymentOrder),
            count: Number(APMPAvailable)
        }, {
            payName: 'WP',
            order: Number(WPPaymentOrder),
            count: Number(WPmethodAvailable)
        }
    ];
    paymentDataObj.sort(function (a, b) {
        return a.order - b.order;
    });
    return paymentDataObj;
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
    var latemCountriesApplicableForInstallments = getLatemCountries(paymentCountryCode, preferences);
    this.latemCountries = latemCountriesApplicableForInstallments;
    var installmentArray = latemCountriesApplicableForInstallments.type ? getInstallmentArray(preferences, latemCountriesApplicableForInstallments.type) : null;
    this.installmentTenureArray = installmentArray;
    this.worldpayEnableTokenization = preferences.worldPayEnableTokenization;
    this.sortedPaymentMethods = getSortedPaymentMethods(this.applicablePaymentMethods);
}

module.exports = Payment;
