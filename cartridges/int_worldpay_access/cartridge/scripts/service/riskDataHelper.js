/* eslint-disable no-param-reassign */

'use strict';

/**
 * Cleans empty fields from the given object.
 * Removes properties that are null, undefined, or empty strings,
 * as well as empty objects.
 *
 * @param {Object} data - The object to clean.
 * @returns {Object} The cleaned object.
 */
function cleanEmptyFields(data) {
    if (!data || typeof data !== 'object') return data;

    Object.keys(data).forEach(function (key) {
        const value = data[key];

        if (value && typeof value === 'object' && !Array.isArray(value)) {
            cleanEmptyFields(value);
            if (Object.keys(value).length === 0) {
                delete data[key];
            }
        } else if (value === null || value === undefined || value === '') {
            delete data[key];
        }
    });

    return data;
}

/**
 * Sanitizes a phone number by removing all non-digit characters.
 *
 * @param {string|null} phone - The phone number to sanitize.
 * @returns {string|null} The sanitized phone number or null if the input is invalid.
 */
function sanitizePhoneDigitsOnly(phone) {
    if (!phone) return null;
    const digits = String(phone).replace(/\D+/g, '');
    return digits.length ? digits : null;
}

/**
 * Converts a Date object to an ISO date string (YYYY-MM-DD).
 *
 * @param {Date} date - The date to convert.
 * @returns {string|null} The ISO date string or null if the date is invalid.
 */
function toISODate(date) {
    try { return date ? date.toISOString().slice(0, 10) : null; } catch (e) { return null; }
}

/**
 * Picks the first shipment from an order or basket.
 *
 * @param {Object} orderOrBasket - The order or basket object.
 * @returns {Object|null} The first shipment object or null if none exists.
 */
function pickFirstShipment(orderOrBasket) {
    try {
        const list = orderOrBasket.getShipments ? orderOrBasket.getShipments() : orderOrBasket.shipments;
        return (list && list.length ? list[0] : null) || null;
    } catch (e) { return null; }
}


/**
 * Maps the shipping method category based on the shipment details.
 *
 * @param {Object} shipment - The shipment object.
 * @param {Object} billingAddress - The billing address object.
 * @param {Object} customerProfile - The customer profile object.
 * @returns {string} The shipping method category.
 */
function mapShippingMethodCategory(shipment, billingAddress, customerProfile) {
    try {
        if (!shipment) return 'digital';
    
        const sm = shipment.getShippingMethod && shipment.getShippingMethod();
        const smId = sm && sm.ID ? String(sm.ID).toLowerCase() : '';
        const isStorePickup = (shipment.custom && shipment.custom.fromStoreId) || smId.indexOf('storepickup') >= 0;
        if (isStorePickup) return 'store';
    
        const sa = shipment.shippingAddress;
        if (!sa) return 'digital';
  
        const sameAsBilling =
            billingAddress &&
            String(sa.firstName).toLowerCase() === String(billingAddress.firstName).toLowerCase() &&
            String(sa.lastName).toLowerCase() === String(billingAddress.lastName).toLowerCase() &&
            String(sa.address1).toLowerCase() === String(billingAddress.address1).toLowerCase() &&
            String(sa.postalCode).toLowerCase() === String(billingAddress.postalCode).toLowerCase() &&
            String(sa.countryCode && sa.countryCode.value).toLowerCase() ===
            String(billingAddress.countryCode && billingAddress.countryCode.value).toLowerCase();
  
        if (sameAsBilling) return 'billingAddress';
  
        if (customerProfile && customerProfile.getAddressBook) {
            const book = customerProfile.getAddressBook();
            if (book) {
                const it = book.getAddresses().iterator();
                while (it.hasNext()) {
                    const addr = it.next();
                    const sameAsBook =
                    String(sa.firstName).toLowerCase() === String(addr.firstName).toLowerCase() &&
                    String(sa.lastName).toLowerCase() === String(addr.lastName).toLowerCase() &&
                    String(sa.address1).toLowerCase() === String(addr.address1).toLowerCase() &&
                    String(sa.postalCode).toLowerCase() === String(addr.postalCode).toLowerCase() &&
                    String(sa.countryCode && sa.countryCode.value).toLowerCase() ===
                        String(addr.countryCode && addr.countryCode.value).toLowerCase();
                    if (sameAsBook) return 'verifiedAddress';
                }
            }
        }
  
        return 'otherAddress';
    } catch (e) {
        return 'other';
    }
}

/**
 * Compares the first and last names of two objects for equality.
 *
 * @param {Object} a - The first object containing firstName and lastName.
 * @param {Object} b - The second object containing firstName and lastName.
 * @returns {boolean} True if the names match, false otherwise.
 */
function namesMatch(a, b) {
    if (!a || !b) return false;
    const fnA = (a.firstName || '').trim().toLowerCase();
    const lnA = (a.lastName || '').trim().toLowerCase();
    const fnB = (b.firstName || '').trim().toLowerCase();
    const lnB = (b.lastName || '').trim().toLowerCase();
    return fnA && lnA && fnA === fnB && lnA === lnB;
}

/**
 * Retrieves the full name of the customer from their profile.
 *
 * @param {Object} profile - The customer profile object.
 * @returns {Object|null} An object containing firstName and lastName, or null if the profile is invalid.
 */
function customerFullName(profile) {
    return profile ? { firstName: profile.getFirstName(), lastName: profile.getLastName() } : null;
}

/**
 * Maps the account type based on the profile's existence.
 *
 * @param {Object} profile - The customer profile object.
 * @returns {string} The account type, either 'registeredUser' or 'guestUser'.
 */
function mapAccountType(profile) {
    return profile ? 'registeredUser' : 'guestUser';
}

/**
 * Builds risk data from the given order or basket.
 *
 * @param {Object} orderOrBasket - The order or basket object.
 * @returns {Object} The risk data object.
 */
function buildRiskData(orderOrBasket) {
    const Logger = require('dw/system/Logger');

    const customer = orderOrBasket.getCustomer && orderOrBasket.getCustomer();
    const profile = customer && customer.getProfile ? customer.getProfile() : null;

    const billing = orderOrBasket.getBillingAddress ? orderOrBasket.getBillingAddress() : orderOrBasket.billingAddress;
    const shipment = pickFirstShipment(orderOrBasket);
    const shipAddr = shipment && shipment.shippingAddress;

    const accountEmail = (profile && profile.getEmail && profile.getEmail())
        || (orderOrBasket.getCustomerEmail ? orderOrBasket.getCustomerEmail() : null);

    const shippingEmail = accountEmail;

    const shippingPhoneRaw =
        (shipAddr && (shipAddr.phone || (shipAddr.getPhone && shipAddr.getPhone()))) ||
        (billing && (billing.phone || (billing.getPhone && billing.getPhone()))) ||
        null;
    const shippingPhone = sanitizePhoneDigitsOnly(shippingPhoneRaw);

    const accountName = customerFullName(profile);

    let reorder = false;
    try {
        if (profile) {
            const OrderMgr = require('dw/order/OrderMgr');
            const it = OrderMgr.searchOrders('customerNo = {0}', 'creationDate desc', profile.getCustomerNo());
            try { reorder = it.hasNext(); } finally { if (it) it.close(); }
        }
    } catch (e) { Logger.getLogger('awp').error('Error checking order history: {0}', e); }

    const createdAt = profile && profile.getCreationDate && profile.getCreationDate();
    const modifiedAt = profile && profile.getLastModified && profile.getLastModified();
    const paymentAccountEnrolledAt = createdAt;

    const riskData = {
        shipping: {
            firstName: shipAddr && shipAddr.firstName,
            lastName: shipAddr && shipAddr.lastName,
            address: shipAddr ? {
                city: shipAddr.city,
                address1: shipAddr.address1,
                address2: shipAddr.address2,
                state: shipAddr.stateCode,
                countryCode: shipAddr.countryCode && shipAddr.countryCode.value,
                postalCode: shipAddr.postalCode,
                phoneNumber: shippingPhone
            } : null,
            method: mapShippingMethodCategory(shipment, billing, profile),
            nameMatchesAccountName: namesMatch(shipAddr, accountName || billing),
            email: shippingEmail
        },

        account: {
            shopperId: profile && profile.getCustomerNo && profile.getCustomerNo(),
            dateOfBirth: null,
            history: {
                createdAt: toISODate(createdAt),
                modifiedAt: toISODate(modifiedAt),
                paymentAccountEnrolledAt: toISODate(paymentAccountEnrolledAt)
            },
            type: mapAccountType(profile),
            email: accountEmail
        },

        transaction: {
            firstName: (shipAddr && shipAddr.firstName) || (billing && billing.firstName) || (accountName && accountName.firstName),
            lastName: (shipAddr && shipAddr.lastName) || (billing && billing.lastName) || (accountName && accountName.lastName),
            phoneNumber: shippingPhone,
            reorder: reorder
        }
    };

    return cleanEmptyFields(riskData);
}

module.exports = {
    buildRiskData: buildRiskData,
    cleanEmptyFields: cleanEmptyFields
};