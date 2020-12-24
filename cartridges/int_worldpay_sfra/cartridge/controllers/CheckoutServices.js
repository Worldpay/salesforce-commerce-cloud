'use strict';
var page = module.superModule;
var server = require('server');
var BasketMgr = require('dw/order/BasketMgr');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Resource = require('dw/web/Resource');
var StringUtils = require('dw/util/StringUtils');
var utils = require('*/cartridge/scripts/common/Utils');
server.extend(page);

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
        var billingFormErrors = {};
        var creditCardErrors = {};
        var paymentFieldErrors = {};
        var brazilFieldErrors = {};
        var paramMap = request.httpParameterMap;
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
        } else if (paymentForm.paymentMethod.value.equals('CREDIT_CARD') &&
            paymentForm.addressFields.country.value &&
            paymentForm.addressFields.country.value.equalsIgnoreCase('BR')) {
            if (!paymentForm.creditCardFields.cpf.value) {
                paymentFieldErrors[paymentForm.creditCardFields.cpf.htmlName] = utils.getConfiguredLabel('error.message.required', 'forms');
            } else if (paymentForm.creditCardFields.cpf.value.length > 25) {
                paymentFieldErrors[paymentForm.creditCardFields.cpf.htmlName] = Resource.msg('error.brazil.info.invalid.cpf', 'forms', null);
            }
        } else if (paymentForm.paymentMethod.value.equals(WorldpayConstants.IDEAL)) {
            paymentFieldErrors = COHelpers.validateFields(paymentForm.idealFields);
        } else if (paymentForm.paymentMethod.value.equals(WorldpayConstants.BOLETO)) {
            if (!paymentForm.creditCardFields.cpf.value) {
                paymentFieldErrors[paymentForm.creditCardFields.cpf.htmlName] = utils.getConfiguredLabel('error.message.required', 'forms');
            } else if (paymentForm.creditCardFields.cpf.value.length > 25) {
                paymentFieldErrors[paymentForm.creditCardFields.cpf.htmlName] = Resource.msg('error.brazil.info.invalid.cpf', 'forms', null);
            }
        } else if (paymentForm.paymentMethod.value.equals(WorldpayConstants.GIROPAY)) {
            paymentFieldErrors = COHelpers.validateFields(paymentForm.giropayFields);
        } else if (paymentForm.paymentMethod.value.equals(WorldpayConstants.ELV)) {
            paymentFieldErrors = COHelpers.validateFields(paymentForm.elvFields);
            if (!paymentForm.elvFields.elvConsent.value) {
                paymentFieldErrors[paymentForm.elvFields.elvConsent.htmlName] = utils.getConfiguredLabel('error.message.required', 'forms');
            }
        } else if (paymentForm.paymentMethod.value.equals(WorldpayConstants.ACHPAY)) {
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

            viewData.paymentInformation = {
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
                billingData.paymentInformation.securityCode.value = req.form.securityCode;
                billingData.paymentInformation.expirationMonth.value = paymentInstrument.creditCardExpirationMonth;
                billingData.paymentInformation.expirationYear.value = paymentInstrument.creditCardExpirationYear;
                billingData.paymentInformation.creditCardToken = paymentInstrument.raw.creditCardToken;
            }

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
            res.json({
                renderedPaymentInstruments: renderedStoredPaymentInstrument,
                renderedPaymentInstrumentsRedirect: renderedStoredRedirectPaymentInstrument,
                customer: accountModel,
                order: basketModel,
                form: billingForm,
                error: false
            });
        }
        this.emit('route:Complete', req, res);
    }
);


// eslint-disable-next-line no-unused-vars
server.prepend('PlaceOrder', server.middleware.https, function (req, res, next) {
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
    var validationBasketStatus = hooksHelper('app.validate.basket', 'validateBasket',
        currentBasket,
        false,
        require('*/cartridge/scripts/hooks/validateBasket').validateBasket);
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
    var validPayment = COHelpers.validatePayment(req, currentBasket);
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

    session.privacy.currentOrderNo = order.orderNo;
    var basketSessionId = currentBasket.custom.dataSessionID;
    var isInstantPurchaseBasket = session.privacy.isInstantPurchaseBasket;
    if (basketSessionId) {
        Transaction.wrap(function () {
            order.custom.dataSessionID = basketSessionId;
        });
    }
    if (isInstantPurchaseBasket) {
        Transaction.wrap(function () {
            order.custom.isInstantPurchaseOrder = true;
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
    var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo);
    var billingForm = server.forms.getForm('billing');
    if (handlePaymentResult.error) {
        res.json({
            error: true,
            form: billingForm,
            fieldErrors: handlePaymentResult.fieldErrors,
            serverErrors: handlePaymentResult.serverErrors,
            errorMessage: handlePaymentResult.serverErrors ? handlePaymentResult.serverErrors : handlePaymentResult.errorMessage
        });
        if (!empty(session.privacy.currentOrderNo)) {
            delete session.privacy.currentOrderNo;
        }
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
            libraryObjectSetup: '<script type="text/javascript">var libraryObject = new WPCL.Library();libraryObject.setup(' +
                StringUtils.decodeString(handlePaymentResult.customOptionsHPPJSON, StringUtils.ENCODE_TYPE_HTML) + ');</script>'
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
            continueUrl: URLUtils.url('Worldpay-Worldpay3D', 'IssuerURL',
                handlePaymentResult.redirectUrl,
                'PaRequest',
                handlePaymentResult.paRequest,
                'TermURL',
                handlePaymentResult.termUrl,
                'MD',
                handlePaymentResult.orderNo).toString()
        });
        this.emit('route:Complete', req, res);
        return;
    } else if (handlePaymentResult.threeDSVersion) {
        res.json({
            error: false,
            orderID: order.orderNo,
            orderToken: order.orderToken,
            continueUrl: URLUtils.url('Worldpay-Worldpay3DS2', 'acsURL',
                handlePaymentResult.acsURL,
                'payload',
                handlePaymentResult.payload,
                'threeDSVersion',
                handlePaymentResult.threeDSVersion,
                'transactionId3DS', handlePaymentResult.transactionId3DS).toString()
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


    if (!empty(session.privacy.currentOrderNo)) {
        delete session.privacy.currentOrderNo;
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
