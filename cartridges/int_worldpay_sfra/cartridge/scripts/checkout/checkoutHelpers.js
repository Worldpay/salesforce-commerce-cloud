'use strict';

var base = module.superModule;
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var PaymentMgr = require('dw/order/PaymentMgr');

/**
 * @param {order} order object
 * @returns {result} order status error
 */
function placeOrder(order) {
    var result = {
        error: false
    };

    try {
        Transaction.begin();
        var placeOrderStatus = OrderMgr.placeOrder(order);
        if (placeOrderStatus === Status.ERROR) {
            throw new Error();
        }
        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
        Transaction.commit();
    } catch (e) {
        Transaction.wrap(function () {
            OrderMgr.failOrder(order, true);
        });
        result.error = true;
    }
    return result;
}

/**
 * renders the user's stored payment Instruments
 * @param {Object} req - The request object
 * @param {Object} accountModel - The account model for the current customer
 * @returns {string|null} newly stored payment Instrument
 */
function getRenderedPaymentInstrumentsForRedirect(req, accountModel) {
    var result;
    if (req.currentCustomer.raw.authenticated
        && req.currentCustomer.raw.registered
        && req.currentCustomer.raw.profile.wallet.paymentInstruments.getLength()
    ) {
        var context;
        var template = 'checkout/billing/storedRedirectCards';

        context = { customer: accountModel };
        result = renderTemplateHelper.getRenderedHtml(
            context,
            template
        );
    }
    return result || null;
}

/**
 * this method Checks whether payment card is still applicable.
 * @param {Object} card - card details
 * @param {Object} applicablePaymentCards - shows applicable payment methods
 * @param {boolean} invalid - invalid value
 * @returns {boolean} - returns card status
 */
function getCardStatus(card, applicablePaymentCards, invalid) {
    var invalidObj = invalid;
    if (card && applicablePaymentCards.contains(card)) {
        invalidObj = false;
    }
    return invalidObj;
}

/**
 * Validates payment
 * @param {Object} req - The local instance of the request object
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an object that has error information
 */
function validatePayment(req, currentBasket) {
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

                invalid = getCardStatus(card, applicablePaymentCards, invalid);
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
 * Get Authorization result
 * @param {Object} serviceResponse - The local instance of the response object
 * @param {dw.order.Order} orderObj - The current user's order
 * @param {Object} preferences - Worldpay preferences
 * @param {dw.order.PaymentInstrument} pi - payment instrument object
 * @param {Object} paymentInstrumentUtils - Selected payment Instrument
 * @returns {boolean} - returns authorization result as true or false
 */
function getAuthorizationResult(serviceResponse, orderObj, preferences, pi, paymentInstrumentUtils) {
    var customerObj;
    var order = orderObj;
    var tokenProcessUtils = require('*/cartridge/scripts/common/tokenProcessUtils');
    Transaction.wrap(function () {
        order.custom.WorldpayLastEvent = serviceResponse.lastEvent;
    });
    if (serviceResponse.primeRoutingResponse !== '') {
        Transaction.wrap(function () {
            order.custom.usDomesticOrder = true;
            order.custom.WorldpayLastEvent = serviceResponse.lastEvent;
        });
    }
    // save token details in order object
    Transaction.wrap(function () {
        paymentInstrumentUtils.updatePaymentInstrumentToken(serviceResponse, pi);
    });
    if (serviceResponse.is3DSecure) {
        return {
            is3D: true,
            redirectUrl: serviceResponse.issuerURL,
            paRequest: serviceResponse.paRequest,
            termUrl: preferences.getTermURL().toString(),
            echoData: serviceResponse.echoData
        };
    }
    if (serviceResponse.threeDSVersion) {
        return {
            acsURL: serviceResponse.acsURL,
            threeDSVersion: serviceResponse.threeDSVersion,
            payload: serviceResponse.payload,
            transactionId3DS: serviceResponse.transactionId3DS
        };
    }
    customerObj = order.customer.authenticated ? order.customer : null;
    return tokenProcessUtils.checkAuthorization(serviceResponse, pi, customerObj);
}
/**
 * this method returns authorizationResult
 * @param {dw.order.PaymentProcessor} paymentProcessor - the paymentProcessor of the current payment
 * @param {string} orderNumber - The order number for the order
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to handle payment authorization
 * @returns {Object} returns a result object after the service call
 */
function getAuthResult(paymentProcessor, orderNumber, paymentInstrument) {
    var HookMgr = require('dw/system/HookMgr');
    var authorizationResult;
    if (HookMgr.hasHook('app.payment.processor.' + paymentProcessor.ID.toLowerCase())) {
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
    return authorizationResult;
}
/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {string} orderNumber - The order number for the order
 * @returns {Object} an error object
 */
function handlePayments(order, orderNumber) {
    var result = {};
    if (order.totalNetPrice !== 0.00) {
        var paymentInstruments = order.paymentInstruments;

        if (paymentInstruments.length === 0) {
            Transaction.wrap(function () {
                OrderMgr.failOrder(order, true);
            });
            result.error = true;
        }

        if (!result.error) {
            for (var i = 0; i < paymentInstruments.length; i++) {
                var paymentInstrument = paymentInstruments[i];
                var paymentProcessor = PaymentMgr
                    .getPaymentMethod(paymentInstrument.paymentMethod)
                    .paymentProcessor;
                if (paymentProcessor === null) {
                    Transaction.begin();
                    paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
                    Transaction.commit();
                } else {
                    var authorizationResult = getAuthResult(paymentProcessor, orderNumber, paymentInstrument);
                    result = authorizationResult;
                    if (authorizationResult.error) {
                        Transaction.wrap(function () {
                            OrderMgr.failOrder(order, true);
                        });
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
 * Attempts to create an order from the current basket
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {dw.order.Order} The order object created from the current basket
 */
function createOrder(currentBasket) {
    var order;
    order = base.createOrder(currentBasket);
    // Using the session attribute to handle browser back scenarios in 3ds
    session.privacy.currentOrderNo = order.orderNo;

    // to support Chrome Pay feature
    var basketSessionId = currentBasket.custom.dataSessionID;
    if (basketSessionId) {
        Transaction.wrap(function () {
            order.custom.dataSessionID = basketSessionId;
        });
    }
    // to support instant checkout feature
    var isInstantPurchaseBasket = session.privacy.isInstantPurchaseBasket;
    if (isInstantPurchaseBasket) {
        Transaction.wrap(function () {
            order.custom.isInstantPurchaseOrder = true;
        });
    }
    return order;
}

/**
 * Sends a confirmation to the current user
 * @param {dw.order.Order} order - The current user's order
 * @param {string} locale - the current request's locale id
 * @returns {void}
 */
function sendConfirmationEmail(order, locale) {
    base.sendConfirmationEmail(order, locale);
    // Clearing off the session attr as soon as the order process completes.
    if (!empty(session.privacy.currentOrderNo)) {
        delete session.privacy.currentOrderNo;
    }
}

/**
* Helper function for paymentInstruments
* @param {string} order - order object
* @return {Object} returns an paymentMthd object
*/
function getPaypaymentInstruments(order) {
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var pi;
    var apmName;
    var paymentMthd;
    var paymentInstruments = order.getPaymentInstruments();
    if (paymentInstruments.length > 0) {
        for (var i = 0; i < paymentInstruments.length; i++) {
            pi = paymentInstruments[i];
            var payProcessor = PaymentMgr.getPaymentMethod(pi.getPaymentMethod()).getPaymentProcessor();
            if (payProcessor != null && payProcessor.getID().equalsIgnoreCase(worldpayConstants.WORLDPAY)) {
                    // update payment instrument with transaction basic attributes
                apmName = pi.getPaymentMethod();
                paymentMthd = PaymentMgr.getPaymentMethod(apmName);
                break;
            }
        }
    }
    return {
        paymentMthd: paymentMthd,
        apmName: apmName,
        pi: pi
    };
}
module.exports = {
    getFirstNonDefaultShipmentWithProductLineItems: base.getFirstNonDefaultShipmentWithProductLineItems,
    ensureNoEmptyShipments: base.ensureNoEmptyShipments,
    getProductLineItem: base.getProductLineItem,
    isShippingAddressInitialized: base.isShippingAddressInitialized,
    prepareCustomerForm: base.prepareCustomerForm,
    prepareShippingForm: base.prepareShippingForm,
    prepareBillingForm: base.prepareBillingForm,
    copyCustomerAddressToShipment: base.copyCustomerAddressToShipment,
    copyCustomerAddressToBilling: base.copyCustomerAddressToBilling,
    copyShippingAddressToShipment: base.copyShippingAddressToShipment,
    copyBillingAddressToBasket: base.copyBillingAddressToBasket,
    validateFields: base.validateFields,
    validateShippingForm: base.validateShippingForm,
    validateBillingForm: base.validateBillingForm,
    validatePayment: validatePayment,
    validateCreditCard: base.validateCreditCard,
    calculatePaymentTransaction: base.calculatePaymentTransaction,
    recalculateBasket: base.recalculateBasket,
    handlePayments: handlePayments,
    createOrder: createOrder,
    placeOrder: placeOrder,
    savePaymentInstrumentToWallet: base.savePaymentInstrumentToWallet,
    getRenderedPaymentInstruments: base.getRenderedPaymentInstruments,
    sendConfirmationEmail: sendConfirmationEmail,
    ensureValidShipments: base.ensureValidShipments,
    setGift: base.setGift,
    getRenderedPaymentInstrumentsForRedirect: getRenderedPaymentInstrumentsForRedirect,
    validateCustomerForm: base.validateCustomerForm,
    getPaypaymentInstruments: getPaypaymentInstruments,
    getAuthorizationResult: getAuthorizationResult
};
