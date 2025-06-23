'use strict';
var page = module.superModule;
var server = require('server');
var BasketMgr = require('dw/order/BasketMgr');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Resource = require('dw/web/Resource');
var utils = require('*/cartridge/scripts/common/utils');
server.extend(page);

/**
 * This function returns the paymentInformation object
 * @param {Object} paymentForm - current paymentForm Object
 * @param {Object} paramMap - current paramMap Object
 * @returns {Object} paymentInformation
 */
function getPaymentInformationObject(paymentForm, paramMap) {
    return {
        selectedPaymentMethodID: {
            value: paymentForm.paymentMethod.value,
            htmlName: paymentForm.paymentMethod.value
        },
        disclaimerCcDirect: {
            value: paramMap.disclaimer.rawValue
        },
        disclaimerCcRedirect: {
            value: paramMap.disclaimercc.rawValue
        },
        cardType: {
            value: paymentForm.creditCardFields.cardType.value,
            htmlName: paymentForm.creditCardFields.cardType.htmlName
        },
        schemeSelected: {
            value: paymentForm.creditCardFields.schemeSelected.value,
            htmlName: paymentForm.creditCardFields.schemeSelected.htmlName
        },
        cardOwner: {
            value: paymentForm.creditCardFields.cardOwner.value,
            htmlName: paymentForm.creditCardFields.cardOwner.htmlName
        },
        cardNumber: {
            value: paymentForm.creditCardFields.cardNumber.value,
            htmlName: paymentForm.creditCardFields.cardNumber.htmlName
        },
        securityCode: {
            value: paymentForm.creditCardFields.securityCode.value,
            htmlName: paymentForm.creditCardFields.securityCode.htmlName
        },
        expirationMonth: {
            value: parseInt(
                paymentForm.creditCardFields.expirationMonth.selectedOption,
                10
            ),
            htmlName: paymentForm.creditCardFields.expirationMonth.htmlName
        },
        expirationYear: {
            value: parseInt(paymentForm.creditCardFields.expirationYear.value, 10),
            htmlName: paymentForm.creditCardFields.expirationYear.htmlName
        },
        encryptedData: {
            value: paymentForm.creditCardFields.encryptedData.value,
            htmlName: paymentForm.creditCardFields.encryptedData.htmlName
        },
        preferredCard: {
            value: paymentForm.creditCardFields.cards.value,
            htmlName: paymentForm.creditCardFields.cards.htmlName
        },
        idealFields: {
            bank: {
                value: paymentForm.idealFields.bank.value,
                htmlName: paymentForm.idealFields.bank.htmlName
            }
        },
        brazilFields: {
            cpf: {
                value: paymentForm.creditCardFields.cpf.value,
                htmlName: paymentForm.creditCardFields.cpf.htmlName
            }
        },
        latAmfieldsCCDirect: {
            installments: {
                value: paramMap.creditcardDirectInstalment.rawValue
            }
        },
        latAmfieldsCCReDirect: {
            installments: {
                value: paramMap.creditcardRedirectInstalment.rawValue

            }
        },
        elvFields: {
            elvMandateType: {
                value: paymentForm.elvFields.elvMandateType.value,
                htmlName: paymentForm.elvFields.elvMandateType.htmlName
            },
            elvMandateID: {
                value: paymentForm.elvFields.elvMandateID.value,
                htmlName: paymentForm.elvFields.elvMandateID.htmlName
            },
            iban: {
                value: paymentForm.elvFields.iban.value,
                htmlName: paymentForm.elvFields.iban.htmlName
            },
            accountHolderName: {
                value: paymentForm.elvFields.accountHolderName.value,
                htmlName: paymentForm.elvFields.accountHolderName.htmlName
            },
            elvConsent: {
                value: paymentForm.elvFields.elvConsent.value,
                htmlName: paymentForm.elvFields.elvConsent.htmlName
            }
        },
        klarnaFields: {
            klarnaPaymentMethod: {
                value: paymentForm.klarnaFields.klarnaPaymentMethod.htmlValue
            }
        },
        achFields: {
            achAccountType: {
                value: paymentForm.achFields.accountType.value,
                htmlName: paymentForm.achFields.accountType.htmlName
            },
            achAccountNumber: {
                value: paymentForm.achFields.accountNumber.value,
                htmlName: paymentForm.achFields.accountNumber.htmlName
            },
            achRoutingNumber: {
                value: paymentForm.achFields.routingNumber.value,
                htmlName: paymentForm.achFields.routingNumber.htmlName
            },
            achCheckNumber: {
                value: paymentForm.achFields.checkNumber.value,
                htmlName: paymentForm.achFields.checkNumber.htmlName
            }
        }
    };
}
/**
 * This function returns the creditCardErrors object
 * @param {Object} paymentForm - current paymentForm Object
 * @returns {Object} creditCardErrors
 */
function handleCreditCardErrors(paymentForm) {
    var Site = require('dw/system/Site');

    var creditCardErrors = {};
    var cvvDisabled = Site.getCurrent().getCustomPreferenceValue('WorldpayDisableCVV');

    if (!paymentForm.creditCardFields.encryptedData || !paymentForm.creditCardFields.encryptedData.value) {
        creditCardErrors = COHelpers.validateFields(paymentForm.creditCardFields);
        if (!paymentForm.paymentMethod.value) {
            if (BasketMgr.getCurrentBasket().totalGrossPrice.value > 0) {
                creditCardErrors[paymentForm.paymentMethod.htmlName] = Resource.msg('error.no.selected.payment.method', 'creditCard', null);
            }
        }
    }
    if (cvvDisabled && paymentForm.creditCardFields.securityCode.value === null) {
        creditCardErrors[paymentForm.creditCardFields.securityCode.htmlName] = Resource.msg('error.card.info.invalid.cvv', 'forms', null);
    }

    return creditCardErrors;
}

/**
 * Submit Payment helper
 * @param {Object} req - request
 * @param {Object} res - response
 * @param {Object} currentBasket - currentBasket
 * @param {Object} OrderModel - OrderModel
 * @param {Object} AccountModel - AccountModel
 * @param {Object} rawBillingData - rawBillingData
 * @param {Object} billingForm - billingForm
 * @return {Object} - response
 */
function submitPaymentHelper(req, res, currentBasket, OrderModel, AccountModel, rawBillingData, billingForm) {
    var billingData = rawBillingData;
    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
    if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
        req.session.privacyCache.set('usingMultiShipping', false);
        usingMultiShipping = false;
    }
    var basketModel = new OrderModel(
            currentBasket,
            { usingMultiShipping: usingMultiShipping, countryCode: billingData.address.countryCode.value, containerView: 'basket' }
    );
    var accountModel = new AccountModel(req.currentCustomer);
    var renderedStoredPaymentInstrument = COHelpers.getRenderedPaymentInstruments(
            req,
            accountModel
    );
    var renderedStoredRedirectPaymentInstrument = COHelpers.getRenderedPaymentInstrumentsForRedirect(
        req,
        accountModel
    );
    delete billingData.paymentInformation;

    if (basketModel.billing.payment.selectedPaymentInstruments &&
        basketModel.billing.payment.selectedPaymentInstruments.length > 0 &&
        !basketModel.billing.payment.selectedPaymentInstruments[0].type) {
        basketModel.resources.cardType = Resource.msg('worldpay.payment.type.selectedmethod', 'worldpay', null) +
            ' ' + basketModel.billing.payment.selectedPaymentInstruments[0].paymentMethodName;
        basketModel.billing.payment.selectedPaymentInstruments[0].type = '';
    }
    if (basketModel.billing.payment.selectedPaymentInstruments
                && basketModel.billing.payment.selectedPaymentInstruments.length > 0 &&
        !basketModel.billing.payment.selectedPaymentInstruments[0].maskedCreditCardNumber) {
        basketModel.billing.payment.selectedPaymentInstruments[0].maskedCreditCardNumber = '';
    }
    if (basketModel.billing.payment.selectedPaymentInstruments
                && basketModel.billing.payment.selectedPaymentInstruments.length > 0 &&
        !basketModel.billing.payment.selectedPaymentInstruments[0].expirationMonth) {
        basketModel.resources.cardEnding = Resource.msg('worldpay.payment.amount', 'worldpay', null) + ' ' +
            basketModel.billing.payment.selectedPaymentInstruments[0].amountFormatted;
        basketModel.billing.payment.selectedPaymentInstruments[0].expirationMonth = '';
        basketModel.billing.payment.selectedPaymentInstruments[0].expirationYear = '';
    }
    return {
        renderedPaymentInstruments: renderedStoredPaymentInstrument,
        renderedPaymentInstrumentsRedirect: renderedStoredRedirectPaymentInstrument,
        customer: accountModel,
        order: basketModel,
        form: billingForm,
        error: false
    };
}

/**
 * Handle billing data
 * @param {Object} paymentMethodID - paymentMethodID
 * @param {Object} req - request
 * @param {Object} rawBillingData - rawBillingData
 * @param {Object} array - array
 * @returns {Object} - billingData
 */
function handleCCBillingData(paymentMethodID, req, rawBillingData, array) {
    let billingData = rawBillingData;
    if ((paymentMethodID === 'CREDIT_CARD' || paymentMethodID === 'Worldpay') && billingData.storedPaymentUUID
        && req.currentCustomer.raw.authenticated
        && req.currentCustomer.raw.registered) {
        var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
        var paymentInstrument = array.find(paymentInstruments, function (item) {
            return billingData.storedPaymentUUID === item.UUID;
        });

        billingData.paymentInformation.cardOwner.value = paymentInstrument.creditCardHolder;
        billingData.paymentInformation.cardNumber.value = paymentInstrument.creditCardNumber;
        billingData.paymentInformation.cardType.value = paymentInstrument.creditCardType;
        billingData.paymentInformation.securityCode.value = (req.form.securityCode && req.form.securityCode !== 'undefined') ? req.form.securityCode : '';
        billingData.paymentInformation.expirationMonth.value = paymentInstrument.creditCardExpirationMonth;
        billingData.paymentInformation.expirationYear.value = paymentInstrument.creditCardExpirationYear;
        billingData.paymentInformation.creditCardToken = paymentInstrument.raw.creditCardToken;
    }
    return billingData;
}

/**
 *  Handle Ajax payment (and billing) form submit
 */
server.prepend(
    'SubmitPayment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    // eslint-disable-next-line no-unused-vars
    function (req, res, next) {
        var paymentForm = server.forms.getForm('billing');
        var selectedScheme = req.form.schemeSelected;
        paymentForm.creditCardFields.schemeSelected.value = selectedScheme;

        var billingFormErrors = {};
        var creditCardErrors = {};
        var paymentFieldErrors = {};
        var brazilFieldErrors = {};
        var paramMap = request.httpParameterMap;
        var billingUserFieldErrors = {};
        var viewData = {};
        // verify billing form data
        billingFormErrors = COHelpers.validateBillingForm(paymentForm.addressFields);
        var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
        if (!req.form.storedPaymentUUID && paymentForm.paymentMethod.value.equals('CREDIT_CARD')) {
            // verify credit card form data
            creditCardErrors = handleCreditCardErrors(paymentForm);
        } else if (paymentForm.paymentMethod.value.equals('CREDIT_CARD') &&
            paymentForm.addressFields.country.value &&
            paymentForm.addressFields.country.value.equalsIgnoreCase('BR')) {
            if (!paymentForm.creditCardFields.cpf.value) {
                paymentFieldErrors[paymentForm.creditCardFields.cpf.htmlName] = utils.getConfiguredLabel('error.message.required', 'forms');
            } else if (paymentForm.creditCardFields.cpf.value.length > 25) {
                paymentFieldErrors[paymentForm.creditCardFields.cpf.htmlName] = Resource.msg('error.brazil.info.invalid.cpf', 'forms', null);
            }
        } else if (paymentForm.paymentMethod.value.equals(worldpayConstants.IDEAL)) {
            paymentFieldErrors = COHelpers.validateFields(paymentForm.idealFields);
        } else if (paymentForm.paymentMethod.value.equals(worldpayConstants.ELV)) {
            paymentFieldErrors = COHelpers.validateFields(paymentForm.elvFields);
            if (!paymentForm.elvFields.elvConsent.value) {
                paymentFieldErrors[paymentForm.elvFields.elvConsent.htmlName] = utils.getConfiguredLabel('error.message.required', 'forms');
            }
        } else if (paymentForm.paymentMethod.value.equals(worldpayConstants.ACHPAY)) {
            paymentFieldErrors = COHelpers.validateFields(paymentForm.achFields);
        }
        billingUserFieldErrors = COHelpers.validateFields(paymentForm.billingUserFields);

        if (Object.keys(billingUserFieldErrors).length) {
            Object.keys(billingUserFieldErrors).forEach(function (innerKey) {
                creditCardErrors[innerKey] = billingUserFieldErrors[innerKey];
            });
        }
        if (Object.keys(paymentFieldErrors).length) {
            Object.keys(paymentFieldErrors).forEach(function (innerKey) {
                creditCardErrors[innerKey] = paymentFieldErrors[innerKey];
            });
        }
        if (Object.keys(brazilFieldErrors).length) {
            Object.keys(brazilFieldErrors).forEach(function (innerKey) {
                creditCardErrors[innerKey] = brazilFieldErrors[innerKey];
            });
        }
        if (Object.keys(billingFormErrors).length || Object.keys(creditCardErrors).length) {
             // respond with form data and errors
            res.json({
                form: paymentForm,
                fieldErrors: [billingFormErrors, creditCardErrors],
                serverErrors: [],
                error: true
            });
        } else {
            viewData.address = {
                firstName: { value: paymentForm.addressFields.firstName.value },
                lastName: { value: paymentForm.addressFields.lastName.value },
                address1: { value: paymentForm.addressFields.address1.value },
                address2: { value: paymentForm.addressFields.address2.value },
                city: { value: paymentForm.addressFields.city.value },
                postalCode: { value: paymentForm.addressFields.postalCode.value },
                countryCode: { value: paymentForm.addressFields.country.value }
            };

            if (Object.prototype.hasOwnProperty.call(paymentForm.addressFields, 'states')) {
                viewData.address.stateCode = {
                    value: paymentForm.addressFields.states.stateCode.value
                };
            }

            viewData.paymentMethod = {
                value: paymentForm.paymentMethod.value,
                htmlName: paymentForm.paymentMethod.value
            };

            viewData.paymentInformation = getPaymentInformationObject(paymentForm, paramMap);
            if (req.form.storedPaymentUUID) {
                viewData.storedPaymentUUID = req.form.storedPaymentUUID;
            }

            if (req.form.securityCode && req.form.securityCode !== 'undefined') {
                paymentForm.creditCardFields.securityCode.value = req.form.securityCode;
            }
            viewData.phone = { value: paymentForm.billingUserFields.phone.value };

            viewData.saveCard = paymentForm.creditCardFields.saveCard.checked;
            viewData.schemeSelected = paymentForm.creditCardFields.schemeSelected.value;

            res.setViewData(viewData);
            var HookMgr = require('dw/system/HookMgr');
            var PaymentMgr = require('dw/order/PaymentMgr');
            var Transaction = require('dw/system/Transaction');
            var AccountModel = require('*/cartridge/models/account');
            var OrderModel = require('*/cartridge/models/order');
            var URLUtils = require('dw/web/URLUtils');
            var array = require('*/cartridge/scripts/util/array');
            var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
            var currentBasket = BasketMgr.getCurrentBasket();
            var billingData = res.getViewData();

            if (!currentBasket) {
                delete billingData.paymentInformation;
                res.json({
                    error: true,
                    cartError: true,
                    fieldErrors: [],
                    serverErrors: [],
                    redirectUrl: URLUtils.url('Cart-Show').toString()
                });
                this.emit('route:Complete', req, res);
                return;
            }
            var billingAddress = currentBasket.billingAddress;
            var billingForm = server.forms.getForm('billing');
            var paymentMethodID = billingData.paymentMethod.value;
            var result;
            billingForm.creditCardFields.cardNumber.htmlValue = '';
            billingForm.creditCardFields.securityCode.htmlValue = '';

            Transaction.wrap(function () {
                if (!billingAddress) {
                    billingAddress = currentBasket.createBillingAddress();
                }

                billingAddress.setFirstName(billingData.address.firstName.value);
                billingAddress.setLastName(billingData.address.lastName.value);
                billingAddress.setAddress1(billingData.address.address1.value);
                billingAddress.setAddress2(billingData.address.address2.value);
                billingAddress.setCity(billingData.address.city.value);
                billingAddress.setPostalCode(billingData.address.postalCode.value);
                if (Object.prototype.hasOwnProperty.call(billingData.address, 'stateCode')) {
                    billingAddress.setStateCode(billingData.address.stateCode.value);
                }
                billingAddress.setCountryCode(billingData.address.countryCode.value);

                billingAddress.setPhone(billingData.phone.value);
            });

                // if there is no selected payment option and balance is greater than zero
            if (!paymentMethodID && currentBasket.totalGrossPrice.value > 0) {
                var noPaymentMethod = {};

                noPaymentMethod[billingData.paymentMethod.htmlName] = Resource.msg('error.no.selected.payment.method', 'creditCard', null);

                delete billingData.paymentInformation;

                res.json({
                    form: billingForm,
                    fieldErrors: [noPaymentMethod],
                    serverErrors: [],
                    error: true
                });
                this.emit('route:Complete', req, res);
                return;
            }

                // check to make sure there is a payment processor
            if (!PaymentMgr.getPaymentMethod(paymentMethodID).paymentProcessor) {
                throw new Error(Resource.msg(
                    'error.payment.processor.missing',
                    'checkout',
                    null
                ));
            }

            var processor = PaymentMgr.getPaymentMethod(paymentMethodID).getPaymentProcessor();

            billingData = handleCCBillingData(paymentMethodID, req, billingData, array);

            if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
                result = HookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(),
                    'Handle',
                    currentBasket,
                    billingData.paymentInformation,
                    paymentMethodID,
                    req
                );
            } else {
                result = HookMgr.callHook('app.payment.processor.default', 'Handle');
            }

                // need to invalidate credit card fields
            if (result.error) {
                delete billingData.paymentInformation;

                res.json({
                    form: billingForm,
                    fieldErrors: result.fieldErrors,
                    serverErrors: result.serverErrors,
                    error: true
                });
                this.emit('route:Complete', req, res);
                return;
            }

            // Calculate the basket
            Transaction.wrap(function () {
                basketCalculationHelpers.calculateTotals(currentBasket);
            });
                // Re-calculate the payments.
            var calculatedPaymentTransaction = COHelpers.calculatePaymentTransaction(
                    currentBasket
                );

            if (calculatedPaymentTransaction.error) {
                res.json({
                    form: paymentForm,
                    fieldErrors: [],
                    serverErrors: [Resource.msg('error.technical', 'checkout', null)],
                    error: true
                });
                this.emit('route:Complete', req, res);
                return;
            }
            res.json(submitPaymentHelper(req, res, currentBasket, OrderModel, AccountModel, billingData, billingForm));
        }
        this.emit('route:Complete', req, res);
    }
);

/**
 * Change the payment instrument to Worldpay Redirect
 */
server.post(
    'PayByLinkSubmit', function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
        var currentBasket = BasketMgr.getCurrentBasket();
        var paymentPrice = currentBasket.totalGrossPrice;
        var Transaction = require('dw/system/Transaction');
        Transaction.wrap(function () {
            currentBasket.removeAllPaymentInstruments();
            var paymentInstrument = currentBasket.createPaymentInstrument(worldpayConstants.WORLDPAY, paymentPrice);
            paymentInstrument.custom.worldpayPreferredCard = worldpayConstants.PREFERRED_CARDS_REDIRECT = 'ALL';
        });
        res.json({ redirectURL: URLUtils.url('CheckoutServices-PlaceOrder').toString() });
        return next();
    });

/**
 * Method is used to proceed user to payment page after user clicks on Customlink sent to their mail ID
 */
server.get(
    'PayByLinkPostSubmit', function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var Site = require('dw/system/Site');
        var Logger = require('dw/system/Logger');
        var URLUtils = require('dw/web/URLUtils');
        var Order = require('dw/order/Order');
        var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
        var serviceFacade = require('*/cartridge/scripts/service/serviceFacade');
        var enableErrorMailService = Site.getCurrent().getCustomPreferenceValue('enableErrorMailService');
        var checkoutHelper = require('*/cartridge/scripts/checkout/checkoutHelpers');
        // fetch order object
        var orderNumber = req.httpParameterMap.orderNumber;
        var order = OrderMgr.getOrder(orderNumber);
        // fetch the APM Name or payment method name from the Payment instrument.
        var paymentLink;
        // order not found
        if (!order) {
            Logger.getLogger('worldpay').error('PayByLink : Invalid Order');
            res.redirect(URLUtils.url('Cart-Show', 'placeerror', 'Order does not exist'));
            return next();
        } else if (order.status.value === Order.ORDER_STATUS_FAILED) {
            Logger.getLogger('worldpay').error('PayByLink : Order Expired');
            res.redirect(URLUtils.url('Cart-Show', 'placeerror', utils.getConfiguredLabel('pay.by.link.order.expired', 'worldpay')));
            return next();
        }
        var piObject = checkoutHelper.getPaypaymentInstruments(order);
        var orderamount = utils.calculateNonGiftCertificateAmount(order);
        var countryCode = order.getBillingAddress().countryCode;
        var authorizeOrderResult = serviceFacade.authorizeOrderService(orderamount, order, piObject.pi, order.customer, piObject.paymentMthd);
        if (authorizeOrderResult.error) {
            Logger.getLogger('worldpay').error('CheckoutServices - PayByLinkPostSubmit : ErrorCode : ' +
            authorizeOrderResult.errorCode + ' : Error Message : ' + authorizeOrderResult.errorMessage);
            if (enableErrorMailService) {
                utils.sendErrorNotification(orderNumber, worldpayConstants.AUTHORIZATION_FAILED, piObject.apmName);
            }
            res.redirect(URLUtils.url('Cart-Show', 'placeerror', authorizeOrderResult.errorMessage));
            return next();
        }
        if (authorizeOrderResult.response.reference) {
            paymentLink = utils.createRedirectURL(piObject.apmName, authorizeOrderResult.response.reference.toString(), order.orderNo, countryCode, order.orderToken);
        } else {
            Logger.getLogger('worldpay').error('CheckoutServices - PayByLinkPostSubmit : ' + Resource.msg('worldpay.error.code8', 'worldpayerror', null));
            if (enableErrorMailService) {
                utils.sendErrorNotification(orderNumber, worldpayConstants.AUTHORIZATION_FAILED, piObject.apmName);
            }
            res.redirect(URLUtils.url('Cart-Show', 'placeerror', Resource.msg('worldpay.error.code8', 'worldpayerror', null)));
            return next();
        }
        res.redirect(paymentLink);
        return next();
    });

module.exports = server.exports();
