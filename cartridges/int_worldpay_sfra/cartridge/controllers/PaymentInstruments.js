'use strict';
var page = module.superModule;
var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var utils = require('*/cartridge/scripts/common/utils');
var accountHelpers = require('*/cartridge/scripts/account/accountHelpers');

server.extend(page);
/**
 * checking Update TokenResult.
 * @param {Object} updateTokenResult updateTokenResult object
 * @param {res} res - The response object
 */
function processUpdateTokenResult(updateTokenResult, res) {
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var URLUtils = require('dw/web/URLUtils');
    if (updateTokenResult.error) {
        if (updateTokenResult.nominalerror) {
            res.json({
                success: false,
                nominalerror: true
            });
        } else if (updateTokenResult.errorCode.equals(worldpayConstants.MAXUPDATELIMITERRORCODE)) {
            res.json({
                success: false,
                maxUpdateLimitError: true
            });
        } else {
            res.json({
                success: false,
                gatewayerror: true
            });
        }
    } else {
        res.json({
            success: true,
            redirectUrl: URLUtils.url('PaymentInstruments-List').toString()
        });
    }
}

/**
 * PaymentInstruments-SavePayment : The PaymentInstruments-SavePayment endpoint is the endpoit responsible for saving a shopper's payment to their account
 * @name Base/PaymentInstruments-SavePayment
 * @function
 * @memberof PaymentInstruments
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {querystringparameter} - UUID - the universally unique identifier of the payment instrument
 * @param {httpparameter} - dwfrm_creditCard_cardType - Input field credit card type (example visa)
 * @param {httpparameter} - paymentOption-Credit - Radio button, They payment instrument type (credit card is the only one subborted OOB with SFRA)
 * @param {httpparameter} - dwfrm_creditCard_cardOwner -  Input field, the name on the credit card
 * @param {httpparameter} - dwfrm_creditCard_cardNumber -  Input field, the credit card number
 * @param {httpparameter} - dwfrm_creditCard_expirationMonth -  Input field, the credit card's expiration month
 * @param {httpparameter} - dwfrm_creditCard_expirationYear -  Input field, the credit card's expiration year
 * @param {httpparameter} -
 *     makeDefaultPayment - Checkbox for whether or not a shopper wants to enbale the payment instrument as the default (This feature does not exist in SFRA OOB)
 * @param {httpparameter} - csrf_token - hidden input field CSRF token
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.prepend('SavePayment', csrfProtection.validateAjaxRequest, function (req, res) {
    var formErrors = require('*/cartridge/scripts/formErrors');
    var HookMgr = require('dw/system/HookMgr');
    var paymentForm = server.forms.getForm('creditCard');
    var result = accountHelpers.getDetailsObject(paymentForm);
    var URLUtils = require('dw/web/URLUtils');
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit();
    var updateTokenResult;
    if (paymentForm.valid && !accountHelpers.verifyCard(result, paymentForm)) {
        res.setViewData(result);
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
        var pi = JSON.stringify(paymentInstrument);
        var PaymentMgr = require('dw/order/PaymentMgr');
        var PaymentInstrument = require('dw/order/PaymentInstrument');
        var paymentProcessor = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD).paymentProcessor;
        if (HookMgr.hasHook('app.payment.processor.' +
            paymentProcessor.ID.toLowerCase())) {
            updateTokenResult = HookMgr.callHook(
                'app.payment.processor.' + paymentProcessor.ID.toLowerCase(),
                'UpdateToken',
                paymentInstrument,
                customer
            );
            processUpdateTokenResult(updateTokenResult, res);
        }
        if (preferences.dstype !== null && preferences.dstype.value === 'two3d') {
            if (updateTokenResult && updateTokenResult.threeDSVersion) {
                res.json({
                    success: true,
                    orderID: updateTokenResult.orderCode,
                    paymentInstrument: paymentInstrument,
                    continueUrl: URLUtils.url('Worldpay-Worldpay3DS2', 'acsURL',
                    updateTokenResult.acsURL,
                    'pi',
                    pi,
                    'payload',
                    updateTokenResult.payload,
                    'threeDSVersion',
                    updateTokenResult.threeDSVersion,
                    'transactionId3DS',
                    updateTokenResult.transactionId3DS).toString()
                });
                this.emit('route:Complete', req, res);
                return;
            } else if (updateTokenResult && updateTokenResult.is3DSecure) {
                var termUrlNew = URLUtils.https('Worldpay-HandleSaveCardResponse', 'paymentInstrument', pi).toString();
                res.json({
                    success: true,
                    orderID: updateTokenResult.orderCode,
                    paymentInstrument: paymentInstrument,
                    continueUrl: URLUtils.url('Worldpay-WorldpaySave3DCard', 'IssuerURL',
                    updateTokenResult.issuerURL,
                    'PaRequest',
                    updateTokenResult.paRequest,
                    'TermURL',
                    termUrlNew,
                    'MD',
                    updateTokenResult.orderCode).toString()
                });
                this.emit('route:Complete', req, res);
                return;
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


/**
 * PaymentInstruments-DeletePayment : The PaymentInstruments-DeletePayment is the endpoint responsible for deleting a shopper's saved payment instrument from their account
 * @name Base/PaymentInstruments-DeletePayment
 * @function
 * @memberof PaymentInstruments
 * @param {middleware} - userLoggedIn.validateLoggedInAjax
 * @param {querystringparameter} - UUID - the universally unique identifier of the payment instrument to be removed from the shopper's account
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.prepend('DeletePayment', userLoggedIn.validateLoggedInAjax, function (req, res) {
    var array = require('*/cartridge/scripts/util/array');
    var serviceFacade = require('*/cartridge/scripts/service/serviceFacade');
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
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
        serviceFacade.deleteToken(payment, customerNo, preferences);
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
