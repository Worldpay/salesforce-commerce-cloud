'use strict';
var page = module.superModule;
var server = require('server');
var BasketMgr = require('dw/order/BasketMgr');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Resource = require('dw/web/Resource');
var StringUtils = require('dw/util/StringUtils');
var OrderMgr = require('dw/order/OrderMgr');
server.extend(page);

/**
 * saves payment instruemnt to customers wallet
 * @param {Object} billingData - billing information entered by the user
 * @param {dw.order.Basket} currentBasket - The current basket
 * @param {dw.customer.Customer} customer - The current customer
 * @returns {dw.customer.CustomerPaymentInstrument} newly stored payment Instrument
 */
function savePaymentInstrumentToWallet(billingData, currentBasket, customer) {
    var Transaction = require('dw/system/Transaction');
    var wallet = customer.getProfile().getWallet();

    return Transaction.wrap(function () {
        var storedPaymentInstrument = wallet.createPaymentInstrument('CREDIT_CARD');

        storedPaymentInstrument.setCreditCardHolder(
            billingData.paymentInformation.cardOwner.value
        );
        storedPaymentInstrument.setCreditCardNumber(
            billingData.paymentInformation.cardNumber.value
        );
        storedPaymentInstrument.setCreditCardType(
            billingData.paymentInformation.cardType.value
        );
        storedPaymentInstrument.setCreditCardExpirationMonth(
            billingData.paymentInformation.expirationMonth.value
        );
        storedPaymentInstrument.setCreditCardExpirationYear(
            billingData.paymentInformation.expirationYear.value
        );

        return storedPaymentInstrument;
    });
}

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {string} orderNumber - The order number for the order
 * @returns {Object} an error object
 */
function handlePayments(order, orderNumber) {
    var result = {};
    var HookMgr = require('dw/system/HookMgr');
    var Transaction = require('dw/system/Transaction');
    var PaymentMgr = require('dw/order/PaymentMgr');

    if (order.totalNetPrice !== 0.00) {
        var paymentInstruments = order.paymentInstruments;

        if (paymentInstruments.length === 0) {
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
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
                        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
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
 * Validates payment
 * @param {Object} req - The local instance of the request object
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an object that has error information
 */
function validatePayment(req, currentBasket) {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var applicablePaymentCards;
    var applicablePaymentMethods;
    var creditCardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
    var paymentAmount = currentBasket.totalGrossPrice.value;
    var countryCode = currentBasket.billingAddress.countryCode;
    var currentCustomer = req.currentCustomer.raw;
    var paymentInstruments = currentBasket.paymentInstruments;
    var result = {};

    applicablePaymentMethods = PaymentMgr.getApplicablePaymentMethods(
        currentCustomer,
        countryCode,
        paymentAmount
    );
    applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
        currentCustomer,
        countryCode,
        paymentAmount
    );

    var invalid = true;

    for (var i = 0; i < paymentInstruments.length; i++) {
        var paymentInstrument = paymentInstruments[i];

        if (PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(paymentInstrument.paymentMethod)) {
            invalid = false;
        }

        var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());

        if (paymentMethod && applicablePaymentMethods.contains(paymentMethod)) {
            if (PaymentInstrument.METHOD_CREDIT_CARD.equals(paymentInstrument.paymentMethod)) {
                var card = PaymentMgr.getPaymentCard(paymentInstrument.creditCardType);

                // Checks whether payment card is still applicable.
                if (card && applicablePaymentCards.contains(card)) {
                    invalid = false;
                }
            } else {
                invalid = false;
            }
        }

        if (invalid) {
            break; // there is an invalid payment instrument
        }
    }

    result.error = invalid;
    return result;
}

/**
 *  Handle Ajax payment (and billing) form submit
 */
server.prepend(
    'SubmitPayment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) { //eslint-disable-line
        var paymentForm = server.forms.getForm('billing');
        var billingFormErrors = {};
        var creditCardErrors = {};
        var paymentFieldErrors = {};
        var brazilFieldErrors = {};
        var paramMap = request.httpParameterMap; //eslint-disable-line
        var billingUserFieldErrors = {};
        var viewData = {};
        // verify billing form data
        billingFormErrors = COHelpers.validateBillingForm(paymentForm.addressFields);
        var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
        if (!req.form.storedPaymentUUID && paymentForm.paymentMethod.value.equals('CREDIT_CARD')) {
            // verify credit card form data
            if (!paymentForm.creditCardFields.encryptedData || !paymentForm.creditCardFields.encryptedData.value) {
                creditCardErrors = COHelpers.validateFields(paymentForm.creditCardFields);
                if (!paymentForm.paymentMethod.value) {
                    if (BasketMgr.getCurrentBasket().totalGrossPrice.value > 0) {
                        creditCardErrors[paymentForm.paymentMethod.htmlName] = Resource.msg('error.no.selected.payment.method', 'creditCard', null);
                    }
                }
            }
        } else if (paymentForm.paymentMethod.value.equals('CREDIT_CARD') && paymentForm.addressFields.country.value && paymentForm.addressFields.country.value.equalsIgnoreCase('BR')) {
            if (!paymentForm.creditCardFields.cpf.value) {
                paymentFieldErrors[paymentForm.creditCardFields.cpf.htmlName] = Resource.msg('error.message.required', 'forms', null);
            } else if (paymentForm.creditCardFields.cpf.value.length > 25) {
                paymentFieldErrors[paymentForm.creditCardFields.cpf.htmlName] = Resource.msg('error.brazil.info.invalid.cpf', 'forms', null);
            }
        } else if (paymentForm.paymentMethod.value.equals(WorldpayConstants.IDEAL)) {
            paymentFieldErrors = COHelpers.validateFields(paymentForm.idealFields);
        } else if (paymentForm.paymentMethod.value.equals(WorldpayConstants.BOLETO)) {
            if (!paymentForm.creditCardFields.cpf.value) {
                paymentFieldErrors[paymentForm.creditCardFields.cpf.htmlName] = Resource.msg('error.message.required', 'forms', null);
            } else if (paymentForm.creditCardFields.cpf.value.length > 25) {
                paymentFieldErrors[paymentForm.creditCardFields.cpf.htmlName] = Resource.msg('error.brazil.info.invalid.cpf', 'forms', null);
            }
        } else if (paymentForm.paymentMethod.value.equals(WorldpayConstants.GIROPAY)) {
            paymentFieldErrors = COHelpers.validateFields(paymentForm.giropayFields);
        } else if (paymentForm.paymentMethod.value.equals(WorldpayConstants.ELV)) {
            paymentFieldErrors = COHelpers.validateFields(paymentForm.elvFields);
            if (!paymentForm.elvFields.elvConsent.value) {
                paymentFieldErrors[paymentForm.elvFields.elvConsent.htmlName] = Resource.msg('error.message.required', 'forms', null);
            }
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

            viewData.paymentInformation = {
                selectedPaymentMethodID: {
                    value: paymentForm.paymentMethod.value,
                    htmlName: paymentForm.paymentMethod.value
                },
                cardType: {
                    value: paymentForm.creditCardFields.cardType.value,
                    htmlName: paymentForm.creditCardFields.cardType.htmlName
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
                giropayFields: {
                    bankCode: {
                        value: paymentForm.giropayFields.bankCode.value,
                        htmlName: paymentForm.giropayFields.bankCode.htmlName
                    }
                },
                brazilFields: {
                    cpf: {
                        value: paymentForm.creditCardFields.cpf.value,
                        htmlName: paymentForm.creditCardFields.cpf.htmlName
                    },
                    installments: {
                        value: paymentForm.creditCardFields.installments.value,
                        htmlName: paymentForm.creditCardFields.installments.htmlName
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
                }
            };

            if (req.form.storedPaymentUUID) {
                viewData.storedPaymentUUID = req.form.storedPaymentUUID;
            }

            if (req.form.securityCode) {
                paymentForm.creditCardFields.securityCode.value = req.form.securityCode;
            }

            viewData.email = {
                value: paymentForm.billingUserFields.email.value
            };

            viewData.phone = { value: paymentForm.billingUserFields.phone.value };

            viewData.saveCard = paymentForm.creditCardFields.saveCard.checked;

            res.setViewData(viewData);
            var CustomerMgr = require('dw/customer/CustomerMgr');
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

                if (billingData.storedPaymentUUID) {
                    billingAddress.setPhone(req.currentCustomer.profile.phone);
                    currentBasket.setCustomerEmail(req.currentCustomer.profile.email);
                } else {
                    billingAddress.setPhone(billingData.phone.value);
                    currentBasket.setCustomerEmail(billingData.email.value);
                }
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

            if (billingData.storedPaymentUUID
                && req.currentCustomer.raw.authenticated
                && req.currentCustomer.raw.registered) {
                var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
                var paymentInstrument = array.find(paymentInstruments, function (item) {
                    return billingData.storedPaymentUUID === item.UUID;
                });

                billingData.paymentInformation.cardOwner.value = paymentInstrument.creditCardHolder;
                billingData.paymentInformation.cardNumber.value = paymentInstrument.creditCardNumber;
                billingData.paymentInformation.cardType.value = paymentInstrument.creditCardType;
                billingData.paymentInformation.securityCode.value = req.form.securityCode;
                billingData.paymentInformation.expirationMonth.value = paymentInstrument.creditCardExpirationMonth;
                billingData.paymentInformation.expirationYear.value = paymentInstrument.creditCardExpirationYear;
                billingData.paymentInformation.creditCardToken = paymentInstrument.raw.creditCardToken;
            }

            if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
                result = HookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(),
                    'Handle',
                    currentBasket,
                    billingData.paymentInformation
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

            if (!billingData.storedPaymentUUID
                    && req.currentCustomer.raw.authenticated
                    && req.currentCustomer.raw.registered
                    && billingData.saveCard
                    && (paymentMethodID === 'CREDIT_CARD')
                ) {
                var customer = CustomerMgr.getCustomerByCustomerNumber(
                        req.currentCustomer.profile.customerNo
                    );

                var saveCardResult = savePaymentInstrumentToWallet(
                        billingData,
                        currentBasket,
                        customer
                    );

                req.currentCustomer.wallet.paymentInstruments.push({
                    creditCardHolder: saveCardResult.creditCardHolder,
                    maskedCreditCardNumber: saveCardResult.maskedCreditCardNumber,
                    creditCardType: saveCardResult.creditCardType,
                    creditCardExpirationMonth: saveCardResult.creditCardExpirationMonth,
                    creditCardExpirationYear: saveCardResult.creditCardExpirationYear,
                    UUID: saveCardResult.UUID,
                    creditCardNumber: Object.hasOwnProperty.call(
                            saveCardResult,
                            'creditCardNumber'
                        )
                        ? saveCardResult.creditCardNumber
                        : null,
                    raw: saveCardResult
                });
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

            delete billingData.paymentInformation;
            if (basketModel.billing.payment.selectedPaymentInstruments
                        && basketModel.billing.payment.selectedPaymentInstruments.length > 0 && !basketModel.billing.payment.selectedPaymentInstruments[0].type) {
                basketModel.resources.cardType = Resource.msg('worldpay.payment.type.selectedmethod', 'worldpay', null) + ' ' + basketModel.billing.payment.selectedPaymentInstruments[0].paymentMethodName;
                basketModel.billing.payment.selectedPaymentInstruments[0].type = '';
            }
            if (basketModel.billing.payment.selectedPaymentInstruments
                        && basketModel.billing.payment.selectedPaymentInstruments.length > 0 && !basketModel.billing.payment.selectedPaymentInstruments[0].maskedCreditCardNumber) {
                basketModel.billing.payment.selectedPaymentInstruments[0].maskedCreditCardNumber = '';
            }
            if (basketModel.billing.payment.selectedPaymentInstruments
                        && basketModel.billing.payment.selectedPaymentInstruments.length > 0 && !basketModel.billing.payment.selectedPaymentInstruments[0].expirationMonth) {
                basketModel.resources.cardEnding = Resource.msg('worldpay.payment.amount', 'worldpay', null) + ' ' + basketModel.billing.payment.selectedPaymentInstruments[0].amountFormatted;
                basketModel.billing.payment.selectedPaymentInstruments[0].expirationMonth = '';
                basketModel.billing.payment.selectedPaymentInstruments[0].expirationYear = '';
            }
            res.json({
                renderedPaymentInstruments: renderedStoredPaymentInstrument,
                customer: accountModel,
                order: basketModel,
                form: billingForm,
                error: false
            });
        }
        this.emit('route:Complete', req, res);
    }
);


server.prepend('PlaceOrder', server.middleware.https, function (req, res, next) { //eslint-disable-line
    var HookMgr = require('dw/system/HookMgr');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
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
    var validationBasketStatus = hooksHelper('app.validate.basket', 'validateBasket', currentBasket, false, require('*/cartridge/scripts/hooks/validateBasket').validateBasket);
    if (validationBasketStatus.error) {
        res.json({
            error: true,
            errorMessage: validationBasketStatus.message
        });
        this.emit('route:Complete', req, res);
        return;
    }

    // Check to make sure there is a shipping address
    if (currentBasket.defaultShipment.shippingAddress === null) {
        res.json({
            error: true,
            errorStage: {
                stage: 'shipping',
                step: 'address'
            },
            errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    // Check to make sure billing address exists
    if (!currentBasket.billingAddress) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'billingAddress'
            },
            errorMessage: Resource.msg('error.no.billing.address', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    // Calculate the basket
    Transaction.wrap(function () {
        HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
    });

    // Re-validates existing payment instruments
    var validPayment = validatePayment(req, currentBasket);
    if (validPayment.error) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'paymentInstrument'
            },
            errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    // Re-calculate the payments.
    var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
    if (calculatedPaymentTransactionTotal.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    // Creates a new order.
    var order = COHelpers.createOrder(currentBasket);
    var basketSessionId = currentBasket.custom.dataSessionID;
    if (basketSessionId) {
        Transaction.wrap(function () {
            order.custom.dataSessionID = basketSessionId;
        });
    }
    if (!order) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    // Handles payment authorization
  // set the privacy attribute in session for order number
    var handlePaymentResult = handlePayments(order, order.orderNo);
    var billingForm = server.forms.getForm('billing');
    if (handlePaymentResult.error) {
        res.json({
            error: true,
            form: billingForm,
            fieldErrors: handlePaymentResult.fieldErrors,
            serverErrors: handlePaymentResult.serverErrors,
            errorMessage: handlePaymentResult.serverErrors ? handlePaymentResult.serverErrors : handlePaymentResult.errorMessage
        });
        this.emit('route:Complete', req, res);
        return;
    } else if (handlePaymentResult.redirect && handlePaymentResult.isValidCustomOptionsHPP) {
        res.json({
            error: true,
            orderID: order.orderNo,
            orderToken: order.orderToken,
            continueUrl: handlePaymentResult.redirectUrl,
            isValidCustomOptionsHPP: handlePaymentResult.isValidCustomOptionsHPP,
            customOptionsHPPJSON: StringUtils.decodeString(handlePaymentResult.customOptionsHPPJSON, StringUtils.ENCODE_TYPE_HTML),
            libraryObjectSetup: '<script type="text/javascript">var libraryObject = new WPCL.Library();libraryObject.setup(' + StringUtils.decodeString(handlePaymentResult.customOptionsHPPJSON, StringUtils.ENCODE_TYPE_HTML) + ');</script>'
        });

        this.emit('route:Complete', req, res);
        return;
    } else if (handlePaymentResult.redirect && handlePaymentResult.isKlarna) {
        res.json({
            error: true,
            orderID: order.orderNo,
            orderToken: order.orderToken,
            continueUrl: handlePaymentResult.redirectUrl,
            isKlarna: handlePaymentResult.isKlarna,
            klarnasnippet: handlePaymentResult.klarnasnippet
        });

        this.emit('route:Complete', req, res);
        return;
    } else if (handlePaymentResult.worldpayredirect) {
        res.json({
            error: true,
            cartError: true,
            redirectUrl: handlePaymentResult.redirectUrl
        });

        this.emit('route:Complete', req, res);
        return;
    } else if (handlePaymentResult.redirect) {
        res.json({
            error: false,
            orderID: order.orderNo,
            orderToken: order.orderToken,
            continueUrl: handlePaymentResult.redirectUrl
        });

        this.emit('route:Complete', req, res);
        return;
    } else if (handlePaymentResult.is3D) {
        req.session.privacyCache.set('echoData', handlePaymentResult.echoData);
        res.json({
            error: false,
            orderID: order.orderNo,
            orderToken: order.orderToken,
            continueUrl: URLUtils.url('Worldpay-Worldpay3D', 'IssuerURL', handlePaymentResult.redirectUrl, 'PaRequest', handlePaymentResult.paRequest, 'TermURL', handlePaymentResult.termUrl, 'MD', handlePaymentResult.orderNo).toString()
        });
        this.emit('route:Complete', req, res);
        return;
    } else if (handlePaymentResult.threeDSVersion) {
        res.json({
            error: false,
            orderID: order.orderNo,
            orderToken: order.orderToken,
            continueUrl: URLUtils.url('Worldpay-Worldpay3DS2', 'acsURL', handlePaymentResult.acsURL, 'payload', handlePaymentResult.payload, 'threeDSVersion', handlePaymentResult.threeDSVersion, 'transactionId3DS', handlePaymentResult.transactionId3DS).toString()
        });
        this.emit('route:Complete', req, res);
        return;
    } else if (!handlePaymentResult.redirectUrlKonbini) {
		// Places the order
        var placeOrderResult = COHelpers.placeOrder(order);
        if (placeOrderResult.error) {
            res.json({
                error: true,
                form: billingForm,
                fieldErrors: placeOrderResult.fieldErrors,
                serverErrors: placeOrderResult.serverErrors,
                errorMessage: placeOrderResult.serverErrors
            });
            this.emit('route:Complete', req, res);
            return;
        }
    }

    COHelpers.sendConfirmationEmail(order, req.locale.id);

    // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set('usingMultiShipping', false);

    res.json({
        error: false,
        orderID: order.orderNo,
        orderToken: order.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString()
    });
    this.emit('route:Complete', req, res);
});

module.exports = server.exports();
