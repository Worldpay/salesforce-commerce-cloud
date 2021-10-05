'use strict';

import { assert } from 'chai';
import { config } from '../../webdriver/wdio.conf';
import * as homePage from '../../../mocks/testDataMgr/pageObjects/home';
import * as login from '../../../mocks/testDataMgr/helpers/forms/login';
import * as productDetailPage from '../../../mocks/testDataMgr/pageObjects/productDetail';
import * as cartPage from '../../../mocks/testDataMgr/pageObjects/cart';
import * as checkoutPage from '../../../mocks/testDataMgr/pageObjects/checkout';
import * as checkoutInterceptPage from '../../../mocks/testDataMgr/pageObjects/CheckoutLoginIntercept';
import * as orderConfPage from '../../../mocks/testDataMgr/pageObjects/orderConfirmation.js';
import * as testDataMgr from '../../../mocks/testDataMgr/main';
import * as common from '../../../mocks/testDataMgr/helpers/common';
import * as Resource from '../../../mocks/dw/web/Resource';
import * as pricingHelpers from '../../../mocks/testDataMgr/helpers/pricing';
import * as testData from '../../../mocks/testDataMgr/worldpay_main';

/*
Verify the order confirmation page having the correct information.
 */

describe('Checkout - Order confirmation page for MisterCash Payment Method', () => {
    const locale = config.locale;
    const userEmail = testData.loginUserEmail;
    const password = testData.loginPassword;

    let shippingData = {};
    let billingData = {}; // eslint-disable-line
    let paymentData = {};

    const productVariantId1 = testData.variantProduct1;
    let productVariant1;

    const prodIdUnitPricesMap = {};

    const groundShipMethodIndex = 0;
    const TwoDayExpressShipMethodIndex = 1; // eslint-disable-line

    const shipCostMap = {
        'x_default': '$7.99',
        'en_GB': '£7.99',
        'fr_FR': '7,99 €',
        'it_IT': '€ 7,99',
        'ja_JP': '¥ 22',
        'zh_CN': '¥21.99'
    };

    const totalTaxMap = {
        'x_default': '$6.30',
        'en_GB': '£5.64',
        'fr_FR': '5,64 €',
        'it_IT': '€ 5,64',
        'ja_JP': '¥ 14',
        'zh_CN': '¥20.00'
    };

    // in before block:
    // - prepare shipping and payment data
    // - add product to cart
    // - navigate to cart
    // - proceed to checkout
    // - place the order
    before(() => {
        return testDataMgr.load()
            .then(() => {
                const customer = testDataMgr.getCustomerByLogin(userEmail);

                shippingData = common.createShippingData(customer, locale);
                billingData = common.createBillingDataForMisterCash(locale);
                paymentData = common.createwechatdirectPaymentData(customer, locale);

                prodIdUnitPricesMap[productVariantId1] = testDataMgr.getPricesByProductId(productVariantId1, locale);

                productVariant1 = testDataMgr.getProductById(productVariantId1);
            })
            .then(() => browser.url(config.baseUrl + productVariant1.getUrlResourcePath()))
            .then(() => browser.waitForExist('#consent-tracking'))
            .then(() => browser.click('#consent-tracking .affirm'))
            .then(() => browser.pause(500))
            .then(() => productDetailPage.clickAddToCartButton())
            .then(() => browser.pause(500))
            .then(() => cartPage.navigateTo())
            .then(() => browser.waitForVisible(cartPage.SHIPPING_METHODS))
            .then(() => browser.selectByIndex(cartPage.SHIPPING_METHODS, groundShipMethodIndex))
            .then(() => browser.waitForVisible(cartPage.BTN_CHECKOUT))
            .then(() => browser.waitForEnabled(cartPage.BTN_CHECKOUT))
            .then(() => browser.click(cartPage.BTN_CHECKOUT))
            .then(() => browser.waitForVisible(checkoutInterceptPage.BTN_CHECKOUT_AS_GUEST))
            .then(() => login.loginAs(userEmail, password))
            .then(() => browser.waitForExist(checkoutPage.BTN_NEXT_PAYMENT))
            .then(() => browser.click(checkoutPage.BTN_NEXT_PAYMENT))
            .then(() => browser.waitForExist(checkoutPage.BTN_NEXT_PLACE_ORDER))
            .then(() => browser.waitForVisible(checkoutPage.PAYMENT_FORM))
            .then(() => browser.waitForExist(checkoutPage.BTN_NEXT_PLACE_ORDER))
            .then(() => browser.waitForExist(checkoutPage.BTN_ADD_NEW))
            .then(() => browser.waitForVisible(checkoutPage.BTN_ADD_NEW))
            .then(() => browser.click(checkoutPage.BTN_ADD_NEW))
            .then(() => browser.waitForVisible(checkoutPage.BILLING_ADDRESS_FORM))
            .then(() => checkoutPage.fillOutBillingForm(billingData, locale))
            .then(() => browser.pause(500))
            .then(() => browser.click('#MISTERCASH-SSL'))
            .then(() => browser.pause(500))
            .then(() => browser.waitForVisible(checkoutPage.PAYMENT_FORM))
            .then(() => checkoutPage.fillOutPaymentForm(paymentData))
            .then(() => browser.click(checkoutPage.BTN_NEXT_PLACE_ORDER))
            .then(() => browser.waitForExist(checkoutPage.BTN_PLACE_ORDER))
            .then(() => browser.waitForVisible(checkoutPage.PAYMENT_SUMMARY))
            .then(() => browser.click(checkoutPage.BTN_PLACE_ORDER))
            .then(() => browser.waitForVisible('.container .containercell'))
            .then(() => browser.selectByValue('select', 'CANCELLED'))
            .then(() => browser.getText('.test')
                .then((paymentMethod) => {
                    console.log(paymentMethod[0] + ' ' + paymentMethod[1]); // eslint-disable-line
                }))
            .then(() => browser.pause(500))
            .then(() => browser.click('#jsEnabled a'))
            .then(() => browser.waitForExist(checkoutPage.BTN_PLACE_ORDER));
    });

    after(() => {
        return browser.waitForExist(checkoutPage.BTN_PLACE_ORDER)
            .then(() => browser.waitForVisible(checkoutPage.PAYMENT_SUMMARY))
            .then(() => browser.click(checkoutPage.BTN_PLACE_ORDER))
            .then(() => browser.waitForVisible('.container .containercell'))
            .then(() => browser.selectByValue('select', 'AUTHORISED'))
            .then(() => browser.click('#jsEnabled a'))
            .then(() => browser.waitForVisible(orderConfPage.RECEIPT_CONTAINER))
            .then(() => browser.pause(500))
            .then(() => browser.getText(orderConfPage.ORDER_NUMBER)
                .then((orderNumber) => {
                    console.log('Required Order Number using MisterCash Payment Method is : ' + orderNumber); // eslint-disable-line
                }))
            // in case order submission failed, clean up the cart
            .then(() => homePage.navigateTo())
            .then(() => cartPage.emptyCart());
    });

    describe('Error Message', () => {
        it('should display error message', () => {
            return browser.getText('.error-message-text')
                .then((errorMsg) => {
                    const expectedErrorMsg = 'Please choose a different Payment Method or try again later.';
                    return assert.equal(errorMsg, expectedErrorMsg, 'Expected to have error message = ' + expectedErrorMsg);
                });
        });
    });

    describe('Shipping address details', () => {
        it('should display address label', () => {
            return browser.getText(orderConfPage.SHIPPING_ADDR_LABEL)
                .then((shipAddrLabel) => {
                    const expectedShipAddrLabel = Resource.msgf('label.order.shipping.address', 'confirmation', null);
                    return assert.equal(shipAddrLabel, expectedShipAddrLabel, 'Expected shipping address label to be = ' + expectedShipAddrLabel);
                });
        });

        it('should display name', () => {
            return browser.getText(orderConfPage.SHIPPING_ADDR_FIRST_NAME)
                .then((firstName) => {
                    const expectedFirstName = shippingData[checkoutPage.SHIPPING_FIRST_NAME];
                    return assert.equal(firstName, expectedFirstName, 'Expected shipping first name to be = ' + expectedFirstName);
                })
                .then(() => browser.getText(orderConfPage.SHIPPING_ADDR_LAST_NAME))
                .then((lastName) => {
                    const expectedLastName = shippingData[checkoutPage.SHIPPING_LAST_NAME];
                    return assert.equal(lastName, expectedLastName, 'Expected shipping last name to be = ' + expectedLastName);
                });
        });

        it('should display street name', () => {
            return browser.getText(orderConfPage.SHIPPING_ADDR_ADDRESS1)
                .then((address1) => {
                    const expectedAddress1 = shippingData[checkoutPage.SHIPPING_ADDRESS_ONE];
                    return assert.equal(address1, expectedAddress1, 'Expected shipping address1 to be = ' + expectedAddress1);
                });
        });

        it('should display city name', () => {
            return browser.getText(orderConfPage.SHIPPING_ADDR_CITY)
                .then((city) => {
                    const expectedCity = shippingData[checkoutPage.SHIPPING_ADDRESS_CITY] + ',';
                    return assert.equal(city, expectedCity, 'Expected shipping city to be = ' + expectedCity);
                });
        });

        it('should display state code', () => {
            if (locale && locale === 'x_default') {
                return browser.getText(orderConfPage.SHIPPING_ADDR_STATE_CODE)
                    .then((stateCode) => {
                        const expectedStateCode = shippingData[checkoutPage.SHIPPING_STATE];
                        return assert.equal(stateCode, expectedStateCode, 'Expected shipping state code to be = ' + expectedStateCode);
                    });
            }
            return Promise.resolve();
        });

        it('should display postal code', () => {
            return browser.getText(orderConfPage.SHIPPING_ADDR_POSTAL_CODE)
                .then((zipCode) => {
                    const expectedZipCode = shippingData[checkoutPage.SHIPPING_ZIP_CODE];
                    return assert.equal(zipCode, expectedZipCode, 'Expected shipping zip code to be = ' + expectedZipCode);
                })
                .then(() => browser.getText(orderConfPage.SHIPPING_ADDR_SHIPPING_PHONE))
                .then((shippingPhone) => {
                    const expectedShippingPhone = shippingData[checkoutPage.SHIPPING_PHONE_NUMBER];
                    return assert.equal(shippingPhone, expectedShippingPhone, 'Expected shipping phone to be = ' + expectedShippingPhone);
                });
        });

        it('should display phone number', () => {
            return browser.getText(orderConfPage.SHIPPING_ADDR_SHIPPING_PHONE)
                .then((shippingPhone) => {
                    const expectedShippingPhone = shippingData[checkoutPage.SHIPPING_PHONE_NUMBER];
                    return assert.equal(shippingPhone, expectedShippingPhone, 'Expected shipping phone to be = ' + expectedShippingPhone);
                });
        });
    });

    describe('Shipping method information', () => {
        it('should display method label', () => {
            return browser.getText(orderConfPage.SHIPPING_METHOD_LABEL)
                .then((shipMethodLabel) => {
                    const expectedShipMethodLabel = Resource.msgf('label.order.shipping.method', 'confirmation', null);
                    return assert.equal(shipMethodLabel, expectedShipMethodLabel, 'Expected shipping method label = ' + expectedShipMethodLabel);
                });
        });

        it('should display method title', () => {
            return browser.getText(orderConfPage.SHIPPING_METHOD_TITLE)
                .then((shipMethodName) => {
                    const expectedShipMethodName = 'Ground';
                    return assert.equal(shipMethodName, expectedShipMethodName, 'Expected shipping method name = ' + expectedShipMethodName);
                });
        });

        it('should display method arrival time', () => {
            return browser.getText(orderConfPage.SHIPPING_METHOD_ARRIVAL_TIME)
                .then((shipMethodArrivalTime) => {
                    const expectedShipMethodArrivalTime = '( 7-10 Business Days )';
                    return assert.equal(shipMethodArrivalTime, expectedShipMethodArrivalTime, 'Expected shipping method arrival time = ' + expectedShipMethodArrivalTime);
                });
        });

        it('should display method price', () => {
            return browser.getText(orderConfPage.SHIPPING_METHOD_PRICE)
                .then((shipMethodPrice) => {
                    const expectedShipMethodPrice = '$7.99';
                    return assert.equal(shipMethodPrice, expectedShipMethodPrice, 'Expected shipping method price = ' + expectedShipMethodPrice);
                });
        });
    });

    describe('Payment information:', () => {
        it('should display payment label', () => {
            return browser.getText(orderConfPage.PAYMENT_LABEL)
                .then((paymentLabel) => {
                    const expectedPaymentLabel = Resource.msgf('label.order.payment.info', 'confirmation', null);
                    return assert.equal(paymentLabel, expectedPaymentLabel, 'Expected payment label = ' + expectedPaymentLabel);
                });
        });

        it('should display payment method', () => {
            return browser.getText(orderConfPage.PAYMENT_DETAILS)
                .then((paymentDetails) => {
                    const expectedpaymentDetails = 'Payment By MisterCash\nAmount $132.29';
                    return assert.equal(paymentDetails, expectedpaymentDetails, 'Expected payment method = ' + expectedpaymentDetails);
                });
        });
    });

    describe('Billing information:', () => {
        it('should display address label', () => {
            return browser.getText(orderConfPage.BILLING_ADDR_LABEL)
                .then((addrLabel) => {
                    const expectedBillingAddrLabel = Resource.msgf('label.order.billing.address', 'confirmation', null);
                    return assert.equal(addrLabel, expectedBillingAddrLabel, 'Expected billing address label to be = ' + expectedBillingAddrLabel);
                });
        });

        it('should display name', () => {
            return browser.getText(orderConfPage.BILLING_ADDR_FIRST_NAME)
                .then((firstName) => {
                    const expectedFirstName = billingData[checkoutPage.BILLING_FIRST_NAME];
                    return assert.equal(firstName, expectedFirstName, 'Expected billing first name to be = ' + expectedFirstName);
                })
                .then(() => browser.getText(orderConfPage.BILLING_ADDR_LAST_NAME))
                .then((lastName) => {
                    const expectedLastName = billingData[checkoutPage.BILLING_LAST_NAME];
                    return assert.equal(lastName, expectedLastName, 'Expected billing last name to be = ' + expectedLastName);
                });
        });

        it('should display street name', () => {
            return browser.getText(orderConfPage.BILLING_ADDR_ADDRESS1)
                .then((address1) => {
                    const expectedAddress1 = billingData[checkoutPage.BILLING_ADDRESS_ONE];
                    return assert.equal(address1, expectedAddress1, 'Expected billing address1 to be = ' + expectedAddress1);
                });
        });

        it('should display city name', () => {
            return browser.getText(orderConfPage.BILLING_ADDR_CITY)
                .then((city) => {
                    const expectedCity = billingData[checkoutPage.BILLING_ADDRESS_CITY] + ',';
                    return assert.equal(city, expectedCity, 'Expected billing city to be = ' + expectedCity);
                });
        });

        it('should display state code', () => {
            if (locale && locale === 'x_default') {
                return browser.getText(orderConfPage.BILLING_ADDR_STATE_CODE)
                    .then((stateCode) => {
                        const expectedStateCode = billingData[checkoutPage.BILLING_STATE];
                        return assert.equal(stateCode, expectedStateCode, 'Expected billing state code to be = ' + expectedStateCode);
                    });
            }
            return Promise.resolve();
        });

        it('should display zip code', () => {
            return browser.getText(orderConfPage.BILLING_ADDR_POSTAL_CODE)
                .then((zipCode) => {
                    const expectedZipCode = billingData[checkoutPage.BILLING_ZIP_CODE];
                    return assert.equal(zipCode, expectedZipCode, 'Expected billing zip code to be = ' + expectedZipCode);
                });
        });

        it('should display email', () => {
            return browser.getText(orderConfPage.ORDER_SUMMARY_EMAIL)
                .then((emailAddr) => {
                    const expectedPaymentEmail = paymentData[checkoutPage.PAYMENT_EMAIL];
                    return assert.equal(emailAddr, expectedPaymentEmail, 'Expected payment email to be = ' + expectedPaymentEmail);
                });
        });

        it('should display phone', () => {
            return browser.getText(orderConfPage.ORDER_SUMMARY_PHONE)
                .then((phone) => {
                    const expectedPaymentPhone = paymentData[checkoutPage.PAYMENT_PHONE_NUMBER];
                    return assert.equal(phone, expectedPaymentPhone, 'Expected payment phone to be = ' + expectedPaymentPhone);
                });
        });
    });

    describe('Product summary information:', () => {
        it('should display grand total', () => {
            const itemTotalQuantity = 1;
            const expectTotalLabel = Resource.msgf('label.number.items.in.cart', 'cart', null, itemTotalQuantity);

            const expectTotalPrice = prodIdUnitPricesMap[productVariantId1].sale;

            return browser.getText(orderConfPage.GRAND_TOTAL_LABEL)
                .then((grandTotalLabel) => assert.equal(grandTotalLabel[1], expectTotalLabel, 'Expected grand total label to be = ' + expectTotalLabel))
                .then(() => browser.getText(orderConfPage.GRAND_TOTAL_PRICE))
                .then((grandTotalPrice) => assert.equal(grandTotalPrice[1], expectTotalPrice, 'Expected grand total price to be = ' + expectTotalPrice));
        });

        it('should display quantity', () => {
            return browser.getText(orderConfPage.CARD_QUANTITY_LABEL)
                .then((quantityLabel) => {
                    const expectedQuantityLabel = Resource.msgf('field.selectquantity', 'cart', null);
                    return assert.equal(quantityLabel, expectedQuantityLabel, 'Expected quantity label to be = ' + expectedQuantityLabel);
                })
                .then(() => browser.getText(orderConfPage.CARD_QUANTITY_COUNT))
                .then((quantity) => {
                    const expectQuantity = 1;
                    return assert.equal(quantity, expectQuantity, 'Expected quantity to be = ' + expectQuantity);
                });
        });

        it('should display total price', () => {
            const expectTotalPrice = prodIdUnitPricesMap[productVariantId1].sale;

            return browser.getText(orderConfPage.CARD_TOTAL_PRICE_LABEL)
                .then((totalPriceLabel) => {
                    const expectedTotalPriceLabel = Resource.msgf('label.total.price', 'cart', null);
                    return assert.equal(totalPriceLabel, expectedTotalPriceLabel, 'Expected total price label to be = ' + expectedTotalPriceLabel);
                })
                .then(() => browser.getText(orderConfPage.CARD_TOTAL_PRICE_AMOUNT))
                .then((totalPrice) => {
                    return assert.equal(totalPrice, expectTotalPrice, 'Expected total price to be = ' + expectTotalPrice);
                });
        });
    });

    describe('Total summary information:', () => {
        it('should display sub-total', () => {
            return browser.getText(orderConfPage.ORDER_SUBTOTAL_LABEL)
                .then((subTotalLabel) => {
                    const expectSubTotalLabel = Resource.msgf('label.order.subtotal', 'confirmation', null);
                    return assert.equal(subTotalLabel, expectSubTotalLabel, 'Expected sub total label to be = ' + expectSubTotalLabel);
                })
                .then(() => browser.getText(orderConfPage.ORDER_SUBTOTAL))
                .then((subTotal) => {
                    const expectSubTotal = prodIdUnitPricesMap[productVariantId1].sale;
                    return assert.equal(subTotal, expectSubTotal, 'Expected sub total to be = ' + expectSubTotal);
                });
        });

        it('should display shipping cost', () => {
            return browser.getText(orderConfPage.ORDER_SHIPPING_LABEL)
                .then((shippingCostLabel) => {
                    const expectShippingCostLabel = Resource.msgf('label.order.shipping.cost', 'confirmation', null);
                    return assert.equal(shippingCostLabel, expectShippingCostLabel, 'Expected shipping cost label to be = ' + expectShippingCostLabel);
                })
                .then(() => browser.getText(orderConfPage.ORDER_SHIPPING_COST))
                .then((shippingCost) => {
                    const expectShippingCost = shipCostMap[locale];
                    return assert.equal(shippingCost, expectShippingCost, 'Expected shipping cost to be = ' + expectShippingCost);
                });
        });

        it('should display sales tax', () => {
            return browser.getText(orderConfPage.ORDER_SALES_TAX_LABEL)
                .then((salesTaxLabel) => {
                    const expectSalesTaxLabel = Resource.msgf('label.order.sales.tax', 'confirmation', null);
                    return assert.equal(salesTaxLabel, expectSalesTaxLabel, 'Expected sales tax label to be = ' + expectSalesTaxLabel);
                })
                .then(() => browser.getText(orderConfPage.ORDER_SALES_TAX))
                .then((salesTax) => {
                    const expectSalesTax = totalTaxMap[locale];
                    return assert.equal(salesTax, expectSalesTax, 'Expected sales tax to be = ' + expectSalesTax);
                });
        });

        it('should display grand total', () => {
            return browser.getText(orderConfPage.ORDER_GRAND_TOTAL_LABEL)
                .then((grandTotalLabel) => {
                    const expectGrandTotalLabel = Resource.msgf('label.order.grand.total', 'confirmation', null);
                    return assert.equal(grandTotalLabel, expectGrandTotalLabel, 'Expected grand total label to be = ' + expectGrandTotalLabel);
                })
                .then(() => browser.getText(orderConfPage.ORDER_GRAND_TOTAL))
                .then((grandTotal) => {
                    const expectedUnitPrice1 = prodIdUnitPricesMap[productVariantId1].sale;
                    const listPriceValue1 = pricingHelpers.getCurrencyValue(expectedUnitPrice1, locale);
                    const shipCostValue = pricingHelpers.getCurrencyValue(shipCostMap[locale], locale);
                    const totalTaxValue = pricingHelpers.getCurrencyValue(totalTaxMap[locale], locale);

                    const totalPrice = listPriceValue1 + shipCostValue + totalTaxValue;
                    const expectGrandTotal = pricingHelpers.getFormattedPrice(totalPrice.toString(), locale);

                    return assert.equal(grandTotal, expectGrandTotal, 'Expected grand total to be = ' + expectGrandTotal);
                });
        });
    });
});
