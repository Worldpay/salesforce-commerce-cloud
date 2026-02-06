/* global session */

'use strict';

const page = module.superModule;
const server = require('server');
const BasketMgr = require('dw/order/BasketMgr');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');
const awpConstants = require('*/cartridge/scripts/common/awpConstants');
const Logger = require('dw/system/Logger');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const Resource = require('dw/web/Resource');
const OrderMgr = require('dw/order/OrderMgr');
const PaymentMgr = require('dw/order/PaymentMgr');

server.extend(page);

/**
 * Helper function to submit payment and build response models.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Object} currentBasket - The current basket.
 * @param {Function} OrderModel - The order model constructor.
 * @param {Function} AccountModel - The account model constructor.
 * @param {Object} rawBillingData - The raw billing data.
 * @param {Object} billingForm - The billing form.
 * @returns {Object} The response object containing customer, order, form, and error status.
 */
function submitPaymentHelper(req, res, currentBasket, OrderModel, AccountModel, rawBillingData, billingForm) {
    const billingData = rawBillingData;
    let usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');

    if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
        req.session.privacyCache.set('usingMultiShipping', false);
        usingMultiShipping = false;
    }

    const countryCodeVal = billingData.address && billingData.address.countryCode && billingData.address.countryCode.value;

    const basketModel = new OrderModel(currentBasket, {
        usingMultiShipping: usingMultiShipping,
        countryCode: countryCodeVal,
        containerView: 'basket'
    });

    const accountModel = new AccountModel(req.currentCustomer);

    return {
        customer: accountModel,
        order: basketModel,
        form: billingForm,
        error: false
    };
}

/**
 * Checks if the payment method value matches the expected value, using .equals if available.
 * @param {*} pmVal - The payment method value to check.
 * @param {*} expected - The expected payment method value.
 * @returns {boolean} True if the payment method matches the expected value, false otherwise.
 */
function isPaymentMethod(pmVal, expected) {
    return pmVal && typeof pmVal.equals === 'function' ? pmVal.equals(expected) : pmVal === expected;
}

/**
 * Builds the view data object from the payment form and payment method value.
 * @param {Object} paymentForm - The payment form object.
 * @param {string} pmVal - The payment method value.
 * @returns {Object} The view data object for rendering or processing.
 */
function buildViewDataFromForm(paymentForm, pmVal) {
    const addressFields = paymentForm && paymentForm.addressFields ? paymentForm.addressFields : null;
    const billingUserFields = paymentForm && paymentForm.billingUserFields ? paymentForm.billingUserFields : null;
    const contactInfoFields = paymentForm && paymentForm.contactInfoFields ? paymentForm.contactInfoFields : null;

    const viewData = {
        address: {
            firstName: { value: addressFields ? addressFields.firstName.value : '' },
            lastName: { value: addressFields ? addressFields.lastName.value : '' },
            address1: { value: addressFields ? addressFields.address1.value : '' },
            address2: { value: addressFields ? addressFields.address2.value : '' },
            city: { value: addressFields ? addressFields.city.value : '' },
            postalCode: { value: addressFields ? addressFields.postalCode.value : '' },
            countryCode: { value: addressFields ? addressFields.country.value : '' }
        },
        paymentMethod: { value: pmVal, htmlName: pmVal },
        paymentInformation: {}
    };

    if (addressFields && Object.prototype.hasOwnProperty.call(addressFields, 'states')) {
        viewData.address.stateCode = { value: addressFields.states.stateCode.value };
    }

    let phoneVal = null;
    if (billingUserFields && billingUserFields.phone) {
        phoneVal = billingUserFields.phone.value;
    } else if (contactInfoFields && contactInfoFields.phone) {
        phoneVal = contactInfoFields.phone.value;
    }
    if (phoneVal != null) {
        viewData.phone = { value: phoneVal };
    }

    return viewData;
}

/**
 * Persists the billing address fields to the current basket's billing address.
 * @param {dw.order.Basket} currentBasket - The current basket object.
 * @param {Object} addressFields - The address fields from the billing form.
 */
function persistBasketBillingAddress(currentBasket, addressFields) {
    Transaction.wrap(function () {
        const ba = currentBasket.billingAddress || currentBasket.createBillingAddress();
        ba.setFirstName(addressFields.firstName.value);
        ba.setLastName(addressFields.lastName.value);
        ba.setAddress1(addressFields.address1.value);
        ba.setAddress2(addressFields.address2.value);
        ba.setCity(addressFields.city.value);
        ba.setPostalCode(addressFields.postalCode.value);
        if (Object.prototype.hasOwnProperty.call(addressFields, 'states')) {
            ba.setStateCode(addressFields.states.stateCode.value);
        }
        ba.setCountryCode(addressFields.country.value);
    });
}

/**
 * Persists the billing address fields to the session's privacy object as a JSON string.
 * @param {Object} addressFields - The address fields from the billing form.
 */
function persistBillingDataToSession(addressFields) {
    session.privacy.billingData = JSON.stringify({
        address: {
            firstName: { value: addressFields.firstName.value },
            lastName: { value: addressFields.lastName.value },
            address1: { value: addressFields.address1.value },
            address2: { value: addressFields.address2.value },
            city: { value: addressFields.city.value },
            postalCode: { value: addressFields.postalCode.value },
            countryCode: { value: addressFields.country.value },
            stateCode: addressFields.states ? { value: addressFields.states.stateCode.value } : null
        }
    });
}

/**
 * Persists the selected payment instrument UUID to the session's privacy object.
 * @param {Object} req - The request object containing form or httpParameterMap data.
 */
function persistSelectedUUIDToSession(req) {
    let selectedUUID = null;
    if (req.form && Object.prototype.hasOwnProperty.call(req.form, 'awpSavedPIUUID')) {
        selectedUUID = req.form.awpSavedPIUUID;
    } else if (req.httpParameterMap && req.httpParameterMap.awpSavedPIUUID && req.httpParameterMap.awpSavedPIUUID.value) {
        selectedUUID = req.httpParameterMap.awpSavedPIUUID.stringValue;
    }
    session.privacy.awpSavedPIUUID = (selectedUUID !== null && selectedUUID !== undefined) ? String(selectedUUID) : '';
}

/**
 * Merges two objects containing field errors into a single object.
 * @param {Object} a - The first field errors object.
 * @param {Object} b - The second field errors object.
 * @returns {Object} The merged field errors object.
 */
function mergeFieldErrors(a, b) {
    const out = {};
    Object.keys(a).forEach(function (k) {
        if (Object.hasOwn(a, k)) out[k] = a[k];
    });
    Object.keys(b).forEach(function (k) {
        if (Object.hasOwn(b, k)) out[k] = b[k];
    });
    return out;
}

/* eslint-disable consistent-return */
server.prepend(
    'SubmitPayment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        const paymentForm = server.forms.getForm('billing');
        const pmVal = paymentForm && paymentForm.paymentMethod ? paymentForm.paymentMethod.value : null;

        if (!isPaymentMethod(pmVal, awpConstants.WORLDPAY) || isPaymentMethod(pmVal, awpConstants.GOOGLEPAY)) {
            return next();
        }

        const addressFields = paymentForm && paymentForm.addressFields ? paymentForm.addressFields : null;
        const billingFormErrors = COHelpers.validateBillingForm(addressFields);
        const genericFieldErrors = COHelpers.validateFields(
            (paymentForm && paymentForm.billingUserFields) || (paymentForm && paymentForm.contactInfoFields) || {}
        );
        const fieldErrors = mergeFieldErrors(billingFormErrors, genericFieldErrors);

        if (Object.keys(fieldErrors).length) {
            res.json({
                form: paymentForm,
                fieldErrors: [fieldErrors],
                serverErrors: [],
                error: true
            });
            this.emit('route:Complete', req, res);
            return null;
        }

        const viewData = buildViewDataFromForm(paymentForm, pmVal);
        persistSelectedUUIDToSession(req);
        res.setViewData(viewData);

        const currentBasket = BasketMgr.getCurrentBasket();
        if (!currentBasket) {
            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            this.emit('route:Complete', req, res);
            return null;
        }

        if (paymentForm && paymentForm.creditCardFields) {
            paymentForm.creditCardFields.cardNumber.htmlValue = '';
            paymentForm.creditCardFields.securityCode.htmlValue = '';
        }

        persistBasketBillingAddress(currentBasket, paymentForm.addressFields);

        persistBillingDataToSession(paymentForm.addressFields);

        const paymentMethodID = viewData.paymentMethod.value;
        const method = PaymentMgr.getPaymentMethod(paymentMethodID);
        if (!method || !method.paymentProcessor) {
            throw new Error(Resource.msg('error.payment.processor.missing', 'checkout', null));
        }

        const HookMgr = require('dw/system/HookMgr');
        const processor = method.getPaymentProcessor();
        let result;

        if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
            result = HookMgr.callHook(
                'app.payment.processor.' + processor.ID.toLowerCase(),
                'Handle',
                currentBasket,
                viewData.paymentInformation,
                paymentMethodID,
                req
            );
        } else {
            result = (function () {
                try {
                    Transaction.wrap(function () {
                        currentBasket.removeAllPaymentInstruments();
                        currentBasket.createPaymentInstrument(paymentMethodID, currentBasket.totalGrossPrice);
                    });
                    return { error: false, fieldErrors: [], serverErrors: [] };
                } catch (e) {
                    return { error: true, fieldErrors: [], serverErrors: [Resource.msg('error.technical', 'checkout', null)] };
                }
            }());
        }

        if (result.error) {
            res.json({
                form: paymentForm,
                fieldErrors: result.fieldErrors || [],
                serverErrors: result.serverErrors || [],
                error: true
            });
            this.emit('route:Complete', req, res);
            return null;
        }

        const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });

        const calculatedPaymentTransaction = COHelpers.calculatePaymentTransaction(currentBasket);
        if (calculatedPaymentTransaction.error) {
            res.json({
                form: paymentForm,
                fieldErrors: [],
                serverErrors: [Resource.msg('error.technical', 'checkout', null)],
                error: true
            });
            this.emit('route:Complete', req, res);
            return null;
        }

        const AccountModel = require('*/cartridge/models/account');
        const OrderModel = require('*/cartridge/models/order');

        const submitResponse = submitPaymentHelper(
            req,
            res,
            currentBasket,
            OrderModel,
            AccountModel,
            viewData,
            paymentForm
        );


        if (submitResponse &&
            submitResponse.order &&
            submitResponse.order.billing &&
            submitResponse.order.billing.payment &&
            Object.prototype.hasOwnProperty.call(submitResponse.order.billing.payment, 'selectedPaymentInstruments') &&
            submitResponse.order.billing.payment.selectedPaymentInstruments &&
            submitResponse.order.billing.payment.selectedPaymentInstruments.splice
        ) {
            submitResponse.order.billing.payment.selectedPaymentMethodName = pmVal;
            submitResponse.order.billing.payment.selectedPaymentInstruments = [];
        }

        res.json(submitResponse);
        this.emit('route:Complete', req, res);
    }
);

/**
 * Gets the payment method ID from the current basket.
 * @param {Object} basket - The current basket.
 * @return {string|null} - The payment method ID or null if not found.
 */
function getBasketPaymentMethodID(basket) {
    if (!basket) return null;
    const it = basket.getPaymentInstruments().iterator();
    if (!it.hasNext()) return null;
    const pi = it.next();
    return pi.getPaymentMethod ? pi.getPaymentMethod() : pi.paymentMethod;
}

/**
 * Validates the current basket to ensure it meets the requirements for checkout.
 * @param {Object} basket - The current basket to validate.
 * @return {Object} - An object containing error status, field errors, and server errors.
 */
function validateBasketSafe(basket) {
    try {
        const basketValidationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
        if (basketValidationHelpers && typeof basketValidationHelpers.validateBasket === 'function') {
            return basketValidationHelpers.validateBasket(basket);
        }
    } catch (e) {  
        Logger.getLogger('awp').error('Error validating basket: {0}', e);
    }
  
    if (!basket) {
        return { error: true, fieldErrors: [], serverErrors: [Resource.msg('error.cart.missing', 'checkout', null)] };
    }
    if (basket.productLineItems.empty) {
        return { error: true, fieldErrors: [], serverErrors: [Resource.msg('error.no.products', 'checkout', null)] };
    }
    const shipments = basket.getShipments();
    const sIt = shipments.iterator();
    while (sIt.hasNext()) {
        let s = sIt.next();
        if (!s.shippingAddress) {
            return { error: true, fieldErrors: [], serverErrors: [Resource.msg('error.no.shipping.address', 'checkout', null)],
                redirectUrl: URLUtils.url('Checkout-Begin', 'stage', 'shipping') };
        }
        if (!s.shippingMethod) {
            return { error: true, fieldErrors: [], serverErrors: [Resource.msg('error.no.shipping.method', 'checkout', null)],
                redirectUrl: URLUtils.url('Checkout-Begin', 'stage', 'shipping') };
        }
    }
    return { error: false, fieldErrors: [], serverErrors: [] };
}
  
server.prepend('PlaceOrder', server.middleware.https, function (req, res, next) {
    try {
        const currentBasket = BasketMgr.getCurrentBasket();
        if (!currentBasket) {
            res.json({
                error: true, cartError: true, fieldErrors: [], serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            this.emit('route:Complete', req, res);
            return;
        }
  
        const pmId = getBasketPaymentMethodID(currentBasket);
        if (!pmId) {
            res.json({
                error: true, fieldErrors: [], serverErrors: [Resource.msg('error.payment.not.valid', 'checkout', null)]
            });
            this.emit('route:Complete', req, res);
            return;
        }


        const isWorldpay = String(pmId) === String(awpConstants.WORLDPAY) || String(pmId) === String(awpConstants.GOOGLEPAY);
        if (!isWorldpay) {
            return next();
        }

        const validation = validateBasketSafe(currentBasket);
        if (validation.error) {
            res.json({
                error: true,
                fieldErrors: validation.fieldErrors || [],
                serverErrors: validation.serverErrors || [],
                redirectUrl: validation.redirectUrl ? validation.redirectUrl.toString() : null
            });
            this.emit('route:Complete', req, res);
            return;
        }
  
        let order = null;
        Transaction.wrap(function () {
            order = OrderMgr.createOrder(currentBasket);
        });
    
        if (!order) {
            res.json({
                error: true, fieldErrors: [], serverErrors: [Resource.msg('error.technical', 'checkout', null)]
            });
            this.emit('route:Complete', req, res);
            return;
        }

        try {
            const pm = PaymentMgr.getPaymentMethod(pmId);
            const processor = pm && pm.getPaymentProcessor ? pm.getPaymentProcessor() : null;

            const piIter = order.getPaymentInstruments(pmId).iterator();
            if (piIter.hasNext()) {
                const pi = piIter.next();
                const pt = pi.getPaymentTransaction();
                Transaction.wrap(function () {
                    if (processor) pt.setPaymentProcessor(processor);
                    if (!pt.getTransactionID()) pt.setTransactionID(order.orderNo);
                });
            }
        } catch (e) {
            Logger.getLogger('awp').warn('Could not preset paymentTransaction: {0}', e);
        }

        const redirectUrl = URLUtils.url('AWPCheckoutServices-Redirect', 'orderNo', order.orderNo).toString();

        res.json({
            error: false,
            orderID: order.orderNo,
            orderToken: order.orderToken,
            continueUrl: redirectUrl
        });
  
        this.emit('route:Complete', req, res);
    } catch (e) {
        Logger.getLogger('awp').error('PlaceOrder prepend error: {0}', e);
        res.json({
            error: true, fieldErrors: [], serverErrors: [Resource.msg('error.technical', 'checkout', null)]
        });
        this.emit('route:Complete', req, res);
    }
});

module.exports = server.exports();