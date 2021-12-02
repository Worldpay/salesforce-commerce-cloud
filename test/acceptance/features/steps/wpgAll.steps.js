const { I, wpgCardCheckout, uriUtils } = inject();
var product;
var orderReviewPaymentDetails;
var orderConfirmationPaymentDetails;
var orderNumber;
var cartTotal;
var qcTotal;

When('Shopper is on home page and selects yes for tracking consent', () => {
    I.amOnPage(uriUtils.uri.homePage);
    wpgCardCheckout.accept();
});

When('Shopper searches for {string} and naviagtes to PDP', (inputProduct) => {
    product = inputProduct;
    wpgCardCheckout.Search(product);
});

When('Shopper add the product to cart and click to Checkout', async () => {
    wpgCardCheckout.addToCart();
    wpgCardCheckout.viewCart();
    wpgCardCheckout.clickCheckout();
});

When('Shopper clicks on checkout as guest and navigates to shipping page', async () => {
    wpgCardCheckout.clickCheckoutAsGuest();
});

When('Shopper enters {string} shipping address', (country) => {
    wpgCardCheckout.fillShippingAddress(country);
});

When('clicks on NextPayment button to navigate to payment section', () => {
    wpgCardCheckout.clickNextPaymentButton();
});

When('Shopper enters {string} billing address', (country) => {
    wpgCardCheckout.fillBillingAddress(country);
});

When('Shopper fills email and phone number on payment section', (table) => {
    for (const id in table.rows) {
        console.log(table.rows);
        if (id < 1) {
            continue; // skip a header of a table
        }

    // go by row cells
        const cells = table.rows[id].cells;

    // take values
        const emailID = cells[0].value;
        const PhoneNo = cells[1].value;

        wpgCardCheckout.fillEmailIDandPhoneNumber(emailID, PhoneNo);
    }
});

When('Shopper adds payment details on websdk payment form', (table) => {
    for (const id in table.rows) {
        console.log(table.rows);
        if (id < 1) {
            continue; // skip a header of a table
        }

    // go by row cells
        const cells = table.rows[id].cells;

    // take values
    // const email  = cells[0].value;
    // const PhonenNo = cells[1].value;
        const cardHolderName = cells[0].value;
        const cardNumber = cells[1].value;
        const expiry = cells[2].value;
        const cvv = cells[3].value;
        wpgCardCheckout.fillWebsdkPaymentDetails(cardHolderName, cardNumber, expiry, cvv);
    // I.wait(5);
    }
});

When('Shopper adds payment details on direct card payment form', (table) => {
    for (const id in table.rows) {
        console.log(table.rows);
        if (id < 1) {
            continue; // skip a header of a table
        }

    // go by row cells
        const cells = table.rows[id].cells;

    // take values
    // const email  = cells[0].value;
    // const PhonenNo = cells[1].value;
        const cardHolderName = cells[0].value;
        const cardNumber = cells[1].value;
        const expMonth = cells[2].value;
        const expYear = cells[3].value;
        const securityCode = cells[4].value;
        wpgCardCheckout.fillDirectCardPaymentDetails(cardHolderName, cardNumber, expMonth, expYear, securityCode);
    // I.wait(5);
    }
});

When('Shopper clicks on Next Review Order Button to navigate to order review page', () => {
    wpgCardCheckout.ClickOnNextReviewOrderButton();
});

/* When('Shopper review payment details on order review page', async () =>
{
  I.waitForElement({css: "div[class='payment-details']"}, 10);
  orderReviewPaymentDetails = await I.grabTextFrom({css: "div[class='payment-details']"});
});*/

When('Shopper clicks on Place Order Button', async () => {
    wpgCardCheckout.PlaceOrderButton();
});

When('Shopper clicks on Place Order Button and views the error message', async () => {
    wpgCardCheckout.PlaceOrderButtonError();
});

When('Shopper edits payment section', async () => {
    wpgCardCheckout.editButtonError();
});

When('Shopper clicks on Challenge OK Button', async () => {
    wpgCardCheckout.clickOnChallengeOkButton();
});

When('Shopper clicks on Challenge OK Button and views the error message', async () => {
    wpgCardCheckout.clickOnChallengeOkButtonError();
});

/* When('Shopper review payment details on order confirmation page', async () =>
{
  I.waitForElement({css: "div[class='payment-details']"}, 15);
  orderConfirmationPaymentDetails = await I.grabTextFrom({css: "div[class='payment-details']"});
});*/

When('Shopper confirms the payment method is {string} on the Order Confirmation page', (paymentMethod) => {
    wpgCardCheckout.confirmPaymentMethod(paymentMethod);
});

When('log the order and payment details', async (table) => {
    const scenario = table.rows[0].cells[0].value;
    I.waitForElement('.summary-details.order-number', 20);
    I.waitForElement({ xpath: "//span[@class='grand-total-sum']" }, 15);
    orderNumber = await I.grabTextFrom('.summary-details.order-number');
    let orderTotal = await I.grabTextFrom({ xpath: "//span[@class='grand-total-sum']" });
    console.log(orderNumber);
    I.waitForElement({ css: "div[class='payment-details']" }, 15);
    orderConfirmationPaymentDetails = await I.grabTextFrom({ css: "div[class='payment-details']" });
    orderConfirmationPaymentDetails = orderConfirmationPaymentDetails.replace(/\n/g, ' ');
  // let paymentConfirm = (orderConfirmationPaymentDetails == orderReviewPaymentDetails) ? "PaymentDetailsMatch":"PaymentDetailsMis-Match";
    I.writeToFile('DUIMobileFirstResult.log', '\n' + scenario + ': ' + orderNumber + ': ' + orderTotal + ' - ' + orderConfirmationPaymentDetails + '\n');
  // wpgCardCheckout.getOrderNumber(orderNumber);
});

When('log the order and payment details of NUI', async (table) => {
    const scenario = table.rows[0].cells[0].value;
    I.waitForElement('.summary-details.order-number', 20);
    I.waitForElement({ xpath: "//span[@class='grand-total-sum']" }, 15);
    orderNumber = await I.grabTextFrom('.summary-details.order-number');
    let orderTotal = await I.grabTextFrom({ xpath: "//span[@class='grand-total-sum']" });
    console.log(orderNumber);
    I.waitForElement({ css: "div[class='payment-details']" }, 15);
    orderConfirmationPaymentDetails = await I.grabTextFrom({ css: "div[class='payment-details']" });
    orderConfirmationPaymentDetails = orderConfirmationPaymentDetails.replace(/\n/g, ' ');
  // let paymentConfirm = (orderConfirmationPaymentDetails == orderReviewPaymentDetails) ? "PaymentDetailsMatch":"PaymentDetailsMis-Match";
    I.writeToFile('NUIRefArchResult.log', '\n' + scenario + ': ' + orderNumber + ': ' + orderTotal + ' - ' + orderConfirmationPaymentDetails + '\n');
  // wpgCardCheckout.getOrderNumber(orderNumber);
});

When('Shopper views the error message and logs it', async (table) => {
    const scenario = table.rows[0].cells[0].value;
    I.waitForElement({ xpath: "//p[@class='error-message-text']" }, 20);
    let errorMessage = await I.grabTextFrom({ xpath: "//p[@class='error-message-text']" });
    console.log(errorMessage);
    paymentDetails = await I.grabTextFrom({ css: "div[class='payment-details']" });
    paymentDetails = paymentDetails.replace(/\n/g, ' ');
    I.writeToFile('DUIMobileFirstResult.log', '\n' + scenario + ': ' + errorMessage + paymentDetails + '\n');
});

When('Shopper views the error message of NUI and logs it', async (table) => {
    const scenario = table.rows[0].cells[0].value;
    I.waitForElement({ xpath: "//p[@class='error-message-text']" }, 20);
    let errorMessage = await I.grabTextFrom({ xpath: "//p[@class='error-message-text']" });
    console.log(errorMessage);
    paymentDetails = await I.grabTextFrom({ css: "div[class='payment-details']" });
    paymentDetails = paymentDetails.replace(/\n/g, ' ');
    I.writeToFile('NUIRefArchResult.log', '\n' + scenario + ': ' + errorMessage + paymentDetails + '\n');
});

When('Verify saved card details', async (table) => {
    for (const id in table.rows) {
        console.log(table.rows);
        if (id < 1) {
            continue; // skip a header of a table
        }

    // go by row cells
        const cells = table.rows[id].cells;

    // take values
        const name = cells[0].value;
        const cardExpiry = cells[1].value;
        I.waitForElement({ xpath: "//button[@aria-label='Delete Payment']" }, 8);
        I.waitForEnabled({ xpath: "//button[@aria-label='Delete Payment']" }, 8);
        I.waitForElement({ css: "div[class='card-header']" }, 10);
        I.see(name, { css: "div[class='card-header']" });
        I.waitForElement({ xpath: "//div[@class='card-body card-body-positioning']" }, 8);
        I.see(cardExpiry, { xpath: "//div[@class='card-body card-body-positioning']" });
    /* I.wait(5);
    let ccName = await I.grabTextFrom({css :"h2[class='pull-left']"});
    let ccExpiry = await I.grabTextFrom({xpath :"//div[@class='card-body card-body-positioning']"});
    I.wait(5);
    console.log(ccName);
    console.log(ccExpiry);
    I.wait(5);
   wpgCardCheckout.verifySavedCard(name, cardExpiry);*/
    }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////

When('Shopper clicks on login button and navigates to login page', async () => {
    wpgCardCheckout.clickonLoginButton();
});

When('Shopper enters the login credentials and clicks on Login Button', (table) => {
    for (const id in table.rows) {
        console.log(table.rows);
        if (id < 1) {
            continue; // skip a header of a table
        }

    // go by row cells
        const cells = table.rows[id].cells;

    // take values
        const email = cells[0].value;
        const password = cells[1].value;
        wpgCardCheckout.loginByLoginButtonHomePage(email, password);
    }
});

When('Go to MyAccount Page', () => {
    I.amOnPage(uriUtils.uri.accountPage);
    I.wait(2);
    I.waitForElement({ css: "a[aria-label='Add New Payment']" }, 5);
});

When('Go to MyAccount Page on refarch', () => {
    I.amOnPage(uriUtils.uri.accountPageRefArch);
    I.wait(2);
    I.waitForElement({ css: "a[aria-label='Add New Payment']" }, 5);
});

When('selects Disclaimer No Option web', () => {
    wpgCardCheckout.disclaimerNoWeb();
});

When('selects Disclaimer Yes Option web', () => {
    wpgCardCheckout.disclaimerYesWeb();
});

When('selects Disclaimer No Option hpp', () => {
    wpgCardCheckout.disclaimerNoWebHpp();
});

When('selects Disclaimer Yes Option hpp', () => {
    wpgCardCheckout.disclaimerYesWebHpp();
});


When('unchecks save card option', () => {
    wpgCardCheckout.disclaimerUnCheckWeb();
});

When('unchecks save card option hpp', () => {
    wpgCardCheckout.disclaimerUnCheckWebHpp();
});

When('make sure that no disclaimer is present', () => {
    I.wait(1);
    I.dontSeeElement({ xpath: '//*[@id="disclaimer"]' });
});

When('Shopper is displayed with a disclaimer error message', () => {
    I.wait(1);
    I.waitForElement('#disclaimer-error', 10);
    I.see('Please click on the disclaimer button to continue, and choose yes to save your card', '#disclaimer-error');
});

When('Shopper is displayed with a disclaimer message', () => {
    I.wait(1);
    I.waitForElement('#chose-to-save', 10);
    I.see('Your Card will be saved only when you choose yes option from disclaimer, else your card will not be saved', '#chose-to-save');
});

When('Click on Payment View', () => {
    wpgCardCheckout.clickOnPaymentView();
});

When('Remove the Saved Payment', () => {
    wpgCardCheckout.removeSavedPayment();
});

When('Shopper does a checkout with saved card', () => {
    I.amOnPage(uriUtils.uri.pdpPage);
    wpgCardCheckout.addToCart();
    wpgCardCheckout.viewCart();
    wpgCardCheckout.clickCheckout();
});


Then('Shopper enters cvv for the Saved card', table => {
    for (const id in table.rows) {
        console.log(table.rows);
        if (id < 1) {
            continue; // skip a header of a table
        }

    // go by row cells
        const cells = table.rows[id].cells;

    // take values
        const cvv = cells[0].value;

        wpgCardCheckout.enterCvv(cvv);
    }
});

Then('verify that no Disclaimer is present', () => {
    wpgCardCheckout.NoDisclaimerPresent();
});


When('Shopper adds new card details on websdk with -ve magic value', (table) => {
    for (const id in table.rows) {
        console.log(table.rows);
        if (id < 1) {
            continue; // skip a header of a table
        }

    // go by row cells
        const cells = table.rows[id].cells;

    // take values
        const email = cells[0].value;
        const PhonenNo = cells[1].value;
        const cardHolderName = cells[2].value;
        const cardNumber = cells[3].value;
        const expiry = cells[4].value;
        const cvv = cells[5].value;
        wpgCardCheckout.fillNegativeCardDetailswebsdk(email, PhonenNo, cardHolderName, cardNumber, expiry, cvv);
        I.wait(5);
    }
});

When('Refused error message is displayed', async () => {
    I.see('Error while verifying your card with the bank. Please fill in correct details.', '#novtokenerror');
    let pin = await I.grabTextFrom('#novtokenerror');
    console.log(pin);
});

When('Error message is displayed', async () => {
    I.see('Server is Unavailable', '#wpservererror');
    let pin = await I.grabTextFrom('#wpservererror');
    console.log(pin);
});

Then('Verify no Payment Saved', () => {
    I.waitForElement({ css: "a[aria-label='Add New Payment']" });
    I.dontSeeElement({ xpath: "//a[@aria-label='View saved payment methods']" });
});

Then('make sure no address is saved', () => {
    I.wait(1);
    tryTo(() => I.waitForElement({ xpath: "//a[@aria-label='View Address Book']" }, 5));
    tryTo(() => I.click({ xpath: "//a[@aria-label='View Address Book']" }));
    I.wait(1);
    tryTo(() => I.waitForElement({ xpath: "//button[contains(text(),'×')]" }, 5));
    tryTo(() => I.click({ xpath: "//button[contains(text(),'×')]" }));
    I.wait(1);
    tryTo(() => I.waitForElement({ xpath: "//button[contains(text(),'Yes')]" }, 5));
    tryTo(() => I.click({ xpath: "//button[contains(text(),'Yes')]" }));
    I.wait(1);
});

Then('make sure no payment is saved', () => {
    I.wait(1);
    tryTo(() => I.waitForElement({ xpath: "//a[@aria-label='View saved payment methods']" }, 5));
    tryTo(() => I.click({ xpath: "//a[@aria-label='View saved payment methods']" }));
    I.wait(1);
    tryTo(() => I.waitForElement({ xpath: "//button[contains(text(),'×')]" }, 5));
    tryTo(() => I.click({ xpath: "//button[contains(text(),'×')]" }));
    I.wait(1);
    tryTo(() => I.waitForElement({ xpath: "//button[contains(text(),'Yes')]" }, 5));
    tryTo(() => I.click({ xpath: "//button[contains(text(),'Yes')]" }));
    I.wait(1);
});

When('Shopper adds payment details on account payment form', (table) => {
    for (const id in table.rows) {
        console.log(table.rows);
        if (id < 1) {
            continue; // skip a header of a table
        }

    // go by row cells
        const cells = table.rows[id].cells;

    // take values
    // const email  = cells[0].value;
    // const PhonenNo = cells[1].value;
        const cardHolderName = cells[0].value;
        const cardNumber = cells[1].value;
        const expMonth = cells[2].value;
        const expYear = cells[3].value;
        wpgCardCheckout.fillAccountCardPaymentDetails(cardHolderName, cardNumber, expMonth, expYear);
    // I.wait(5);
    }
});

When('Shopper Click on Submit Button in 3D page', async (table) => {
    for (const id in table.rows) {
        console.log(table.rows);
        if (id < 1) {
            continue; // skip a header of a table
        }

    // go by row cells
        const cells = table.rows[id].cells;

    // take values
        const magicValue = cells[0].value;
        wpgCardCheckout.clickOn3DSubmitButton(magicValue);
    }
});

Then('Shopper selects CreditCard Redirect', () => {
    I.wait(1);
    tryTo(() => I.waitForElement({ xpath: '//*[@id="Worldpay"]/a' }, 5));
    tryTo(() => I.click({ xpath: '//*[@id="Worldpay"]/a' }));
    I.wait(1);
});

Then('Shopper selects CreditCard Direct', () => {
    I.wait(1);
    tryTo(() => I.waitForElement({ xpath: '///*[@id="CREDIT_CARD"]/a' }, 5));
    tryTo(() => I.click({ xpath: '//*[@id="CREDIT_CARD"]/a' }));
    I.wait(1);
});

When('Shopper selects preferred card for HPP', table => {
    for (const id in table.rows) {
        console.log(table.rows);
        if (id < 1) {
            continue; // skip a header of a table
        }

    // go by row cells
        const cells = table.rows[id].cells;

    // take values
        const preferredCard = cells[0].value;

        wpgCardCheckout.selectPreferredCardHPP(preferredCard);
    }
});

Then('Shopper selects Visa Card on HPP', () => {
    I.waitForElement({ xpath: '//*[@id="pmitem_0"]/a/div[1]/img' }, 10);
    I.click({ xpath: '//*[@id="pmitem_0"]/a/div[1]/img' });
    I.wait(2);
});

Then('Shopper selects Master Card on HPP', () => {
    I.waitForElement({ xpath: '//*[@id="pmitem_1"]/a/div[1]/img' }, 10);
    I.click({ xpath: '//*[@id="pmitem_1"]/a/div[1]/img' });
    I.wait(2);
});

Then('Shopper selects Amex Card on HPP', () => {
    I.waitForElement({ xpath: '//*[@id="pmitem_3"]/a/div[1]/img' }, 10);
    I.click({ xpath: '//*[@id="pmitem_3"]/a/div[1]/img' });
    I.wait(2);
});

When('Shopper adds payment details on HPP card payment form', table => {
    for (const id in table.rows) {
        console.log(table.rows);
        if (id < 1) {
            continue; // skip a header of a table
        }

    // go by row cells
        const cells = table.rows[id].cells;

    // take values
        const cardNumber = cells[0].value;
        const cardName = cells[1].value;
        const expMonth = cells[2].value;
        const expYear = cells[3].value;
        const securityCode = cells[4].value;
        wpgCardCheckout.fillHPPCardPaymentDetails(cardNumber, cardName, expMonth, expYear, securityCode);
    }
});

Then('Shopper clicks on Submit Button on HPP', () => {
    I.waitForEnabled('#submitButton', 5);
    I.click('#submitButton');
    I.wait(2);
});

When('Shopper selects 3d magic value {string} and Submits on HPP 3D page', (inputThreeDMagicValue) => {
    threeDMagicValue = inputThreeDMagicValue;
    wpgCardCheckout.clickOnHPP3DSubmitButton(threeDMagicValue);
});

When('Shopper clicks on Ok button on HPP', () => {
    wpgCardCheckout.clickOnHPPOkButton();
});


//////Quick Checkout////////

When('Shopper adds address details on account address form', (table) => {
    for (const id in table.rows) {
        console.log(table.rows);
        if (id < 1) {
            continue; // skip a header of a table
        }

    // go by row cells
        const cells = table.rows[id].cells;

    // take values
    // const email  = cells[0].value;
    // const PhonenNo = cells[1].value;
        const country = cells[0].value;
        const addressid = cells[1].value;
        wpgCardCheckout.fillAccountShippingAddress(country, addressid);
    }
});

When('Shopper adds the product to cart', () => {
    wpgCardCheckout.addToCart();
});


When('Shopper hovers on minicart and click on quick checkout', () => {
    I.waitForElement('.minicart-total.hide-link-med', 5);
    I.wait(3);
    I.scrollTo('.minicart-total.hide-link-med');
    I.wait(2);
    I.moveCursorTo('.minicart-total.hide-link-med');
    I.wait(2);
    I.waitForElement('#quick-pay-now', 5);
    I.click('#quick-pay-now');
    I.wait(1);
});

When('Shopper selects 2dayexpress shipping method on quick checkout', () => {
    I.waitForElement({ xpath: "//span[normalize-space()='2-Day Express']" }, 5);
    I.click({ xpath: "//span[normalize-space()='2-Day Express']" });
    I.wait(1);
});

When('Shopper selects overnight shipping method on quick checkout', () => {
    I.waitForElement({ xpath: "//span[normalize-space()='Overnight']" }, 5);
    I.click({ xpath: "//span[normalize-space()='Overnight']" });
    I.wait(1);
});

When('Shopper selects ground shipping method on quick checkout', () => {
    I.waitForElement({ xpath: "//span[normalize-space()='Ground']" }, 5);
    I.click({ xpath: "//span[normalize-space()='Ground']" });
    I.wait(1);
});


Then('Shopper enters cvv on quick checkout', table => {
    for (const id in table.rows) {
        console.log(table.rows);
        if (id < 1) {
            continue; // skip a header of a table
        }

    // go by row cells
        const cells = table.rows[id].cells;

    // take values
        const cvv = cells[0].value;

        wpgCardCheckout.enterCvvQc(cvv);
    }
});

Then('Shopper see error message on quick checkout', () => {
    I.seeElement('#savedPaymentSecurityCodeInvalidMessage', 5);
});

Then('Shopper clicks on place order on quick checkout', () => {
    I.waitForElement('#complete-checkout', 5);
    I.waitForEnabled('#complete-checkout', 5);
    I.click('#complete-checkout');
    I.wait(2);
});

Then('delete the saved address', () => {
    I.wait(1);
    I.waitForElement({ xpath: "//a[@aria-label='View Address Book']" }, 5);
    I.click({ xpath: "//a[@aria-label='View Address Book']" });
    I.wait(1);
    I.waitForElement({ xpath: "//button[contains(text(),'×')]" }, 5);
    I.click({ xpath: "//button[contains(text(),'×')]" });
    I.wait(1);
    I.waitForElement({ xpath: "//button[contains(text(),'Yes')]" }, 5);
    I.click({ xpath: "//button[contains(text(),'Yes')]" });
    I.wait(1);
});

Then('delete the saved payment', () => {
    I.wait(1);
    I.waitForElement({ xpath: "//a[@aria-label='View saved payment methods']" }, 5);
    I.click({ xpath: "//a[@aria-label='View saved payment methods']" });
    I.wait(1);
    I.waitForElement({ xpath: "//button[contains(text(),'×')]" }, 5);
    I.click({ xpath: "//button[contains(text(),'×')]" });
    I.wait(1);
    I.waitForElement({ xpath: "//button[contains(text(),'Yes')]" }, 5);
    I.click({ xpath: "//button[contains(text(),'Yes')]" });
    I.wait(1);
});

When('Shopper hovers on minicart and do not see quick checkout option', () => {
    I.waitForElement('.minicart-total.hide-link-med', 5);
    I.wait(3);
    I.scrollTo('.minicart-total.hide-link-med');
    I.wait(2);
    I.moveCursorTo('.minicart-total.hide-link-med');
    I.wait(2);
    I.dontSeeElement('#quick-pay-now', 3);
    I.wait(1);
});

When('Shopper adds the product and navigates to cart page', async () => {
    wpgCardCheckout.addToCart();
    wpgCardCheckout.viewCart();
    I.waitForElement({ xpath: "//p[@class='text-right grand-total']" });
    cartTotal = await I.grabTextFrom({ xpath: "//p[@class='text-right grand-total']" });
});

When('Shopper clicks on quick checkout', () => {
    I.waitForElement('#quick-pay-now', 5);
    I.click('#quick-pay-now');
    I.wait(1);
});

When('Shopper verfies the cart total and quick checkout total are same', async () => {
    I.waitForElement({ xpath: "//span[@class='text-right grand-total']" });
    I.see(cartTotal, { xpath: "//span[@class='text-right grand-total']" });
});

When('Shopper do not see quick checkout option on cart', () => {
    I.dontSeeElement('#quick-pay-now', 3);
    I.wait(1);
});

// SFRA 6.0

When('Shopper fills phone number on payment section', (table) => {
    for (const id in table.rows) {
        console.log(table.rows);
        if (id < 1) {
            continue; // skip a header of a table
        }

    // go by row cells
        const cells = table.rows[id].cells;

    // take values
        const PhoneNo = cells[0].value;

        wpgCardCheckout.fillPhoneNumber(PhoneNo);
  }
});

When('Shopper submits email {string} on customer section', (email) => {
    I.waitForElement('#email-guest', 15);
    I.fillField('#email-guest', email);
    I.wait(1);
    I.waitForElement({ css: "button[value='submit-customer']" }, 5);
    I.click({ css: "button[value='submit-customer']" });
    // I.see('codeceptguest@yopmail.com', '.customer-summary-email');
});


When('logs out', async () => {
    I.waitForElement({ css: ".user-message.btn.dropdown-toggle" }, 5);
    I.scrollTo({ css: ".user-message.btn.dropdown-toggle" });
    I.wait(2);
    I.moveCursorTo({ css: ".user-message.btn.dropdown-toggle" });
    I.wait(2);
    I.waitForElement({ xpath: "//a[@role='menuitem'][normalize-space()='Logout']" }, 10);
    I.click({ xpath: "//a[@role='menuitem'][normalize-space()='Logout']" });
    I.wait(2);
    I.waitForElement({ css: ".affirm.btn.btn-primary" }, 15);
});


When('Shopper enters the login credentials and logs in from customer section', (table) => {
    for (const id in table.rows) {
        console.log(table.rows);
        if (id < 1) {
            continue; // skip a header of a table
        }

    // go by row cells
        const cells = table.rows[id].cells;

    // take values
        const email = cells[0].value;
        const password = cells[1].value;
        wpgCardCheckout.loginByLoginButtonCustomerSection(email, password);
    }
});

Then('Shopper selects CreditCard Re-Direct', () => {
    I.wait(1);
    I.waitForElement({ xpath: '//*[@id="Worldpay"]/a' }, 5);
    I.click({ xpath: '//*[@id="Worldpay"]/a' });
    I.wait(1);
});

When('log the order number', async (table) => {
    I.waitForElement('.summary-details.order-number', 20);
    orderNumber = await I.grabTextFrom('.summary-details.order-number');
    console.log(orderNumber);
});
