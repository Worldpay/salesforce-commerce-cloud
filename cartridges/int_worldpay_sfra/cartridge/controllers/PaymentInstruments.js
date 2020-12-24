'use strict';
var page = module.superModule;
var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var utils = require('*/cartridge/scripts/common/Utils');
server.extend(page);

/**
 * Checks if a credit card is valid or not
 * @param {Object} card - plain object with card details
 * @param {Object} form - form object
 * @returns {boolean} a boolean representing card validation
 */
function verifyCard(card, form) {
    var collections = require('*/cartridge/scripts/util/collections');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');

    var paymentCard = PaymentMgr.getPaymentCard(card.cardType);
    var error = false;
    var cardNumber = card.cardNumber;
    var creditCardStatus;
    var formCardNumber = form.cardNumber;

    if (paymentCard) {
        creditCardStatus = paymentCard.verify(
            card.expirationMonth,
            card.expirationYear,
            cardNumber
        );
    } else {
        formCardNumber.valid = false;
        formCardNumber.error = utils.getConfiguredLabel('error.message.creditnumber.invalid', 'forms');
        error = true;
    }

    if (creditCardStatus && creditCardStatus.error) {
        collections.forEach(creditCardStatus.items, function (item) {
            switch (item.code) {
                case PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER:
                    formCardNumber.valid = false;
                    formCardNumber.error = utils.getConfiguredLabel('error.message.creditnumber.invalid', 'forms');
                    error = true;
                    break;

                case PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE:
                    var expirationMonth = form.expirationMonth;
                    var expirationYear = form.expirationYear;
                    expirationMonth.valid = false;
                    expirationMonth.error = utils.getConfiguredLabel('error.message.creditexpiration.expired', 'forms');
                    expirationYear.valid = false;
                    error = true;
                    break;
                default:
                    error = true;
            }
        });
    }
    return error;
}

/**
 * Creates an object from form values
 * @param {Object} paymentForm - form object
 * @returns {Object} a plain object of payment instrument
 */
function getDetailsObject(paymentForm) {
    return {
        name: paymentForm.cardOwner.value,
        cardNumber: paymentForm.cardNumber.value,
        cardType: paymentForm.cardType.value,
        expirationMonth: paymentForm.expirationMonth.value,
        expirationYear: paymentForm.expirationYear.value,
        paymentForm: paymentForm
    };
}

server.prepend('SavePayment', csrfProtection.validateAjaxRequest, function (req, res) {
    var formErrors = require('*/cartridge/scripts/formErrors');
    var HookMgr = require('dw/system/HookMgr');

    var paymentForm = server.forms.getForm('creditCard');
    var result = getDetailsObject(paymentForm);

    if (paymentForm.valid && !verifyCard(result, paymentForm)) {
        res.setViewData(result);
        var URLUtils = require('dw/web/URLUtils');
        var CustomerMgr = require('dw/customer/CustomerMgr');

        var formInfo = res.getViewData();
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );

        var paymentInstrument = {
            creditCardHolder: formInfo.name,
            creditCardNumber: formInfo.cardNumber,
            creditCardType: formInfo.cardType,
            creditCardExpirationMonth: formInfo.expirationMonth,
            creditCardExpirationYear: formInfo.expirationYear
        };
        var PaymentMgr = require('dw/order/PaymentMgr');
        var PaymentInstrument = require('dw/order/PaymentInstrument');
        var paymentProcessor = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD).paymentProcessor;
        if (HookMgr.hasHook('app.payment.processor.' +
                paymentProcessor.ID.toLowerCase())) {
            var updateTokenResult = HookMgr.callHook(
                    'app.payment.processor.' + paymentProcessor.ID.toLowerCase(),
                    'UpdateToken',
                    paymentInstrument,
                    customer
                );
            if (updateTokenResult.error) {
                res.json({
                    success: false,
                    gatewayerror: true
                });
            } else {
                res.json({
                    success: true,
                    redirectUrl: URLUtils.url('PaymentInstruments-List').toString()
                });
            }
        }
    } else {
        res.json({
            success: false,
            fields: formErrors.getFormErrors(paymentForm)
        });
    }
    this.emit('route:Complete', req, res);
});

server.prepend('DeletePayment', userLoggedIn.validateLoggedInAjax, function (req, res) {
    var array = require('*/cartridge/scripts/util/array');
    var ServiceFacade = require('*/cartridge/scripts/service/ServiceFacade');
    var WorldpayPreferences = require('*/cartridge/scripts/object/WorldpayPreferences');

    var data = res.getViewData();
    if (data && !data.loggedin) {
        res.json();
        this.emit('route:Complete', req, res);
        return;
    }

    var UUID = req.querystring.UUID;
    var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
    var paymentToDelete = array.find(paymentInstruments, function (item) {
        return UUID === item.UUID;
    });
    res.setViewData(paymentToDelete);
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var payment = res.getViewData();
    var customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo
    );
    var wallet = customer.getProfile().getWallet();
    var customerNo = req.currentCustomer.profile.customerNo;
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit();
    var cToken = payment.raw.creditCardToken;
    if (cToken && cToken !== 'undefined') {
        ServiceFacade.deleteToken(payment, customerNo, preferences);
    }
    Transaction.wrap(function () {
        wallet.removePaymentInstrument(payment.raw);
    });
    if (wallet.getPaymentInstruments().length === 0) {
        res.json({
            UUID: UUID,
            message: utils.getConfiguredLabel('msg.no.saved.payments', 'payment')
        });
    } else {
        res.json({ UUID: UUID });
    }
    this.emit('route:Complete', req, res);
});

module.exports = server.exports();
