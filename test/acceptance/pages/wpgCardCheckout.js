
const { I, testData } = inject();

module.exports = {
	locators:
	{
		loginbtn: '.btn.btn-block.btn-primary',
		searchField: 'input.form-control.search-field',
		searchedImage: 'a>img.swatch-circle',
		selectSize1: '.select-size',
		selectQuantity: '.quantity-select',
		addToCartButton: '.add-to-cart.btn.btn-primary',
		miniCartIcon: '.minicart-link',
		cartHeader: '.cart-header',
		checkoutBtn: '.btn.btn-primary.btn-block.checkout-btn',
		checkoutAsGuest: '.btn.btn-block.btn-primary.checkout-as-guest',
		color: '.color-value.swatch-circle',
		nextPaymentButton: '.btn.btn-primary.btn-block.submit-shipping',
		addPaymentButton: '.btn.btn-block.add-payment.btn-outline-primary',
		placeOrderButton: '.btn.btn-primary.btn-block.place-order',
		nextPlaceOrderButton: '.btn.btn-primary.btn-block.submit-payment',
		/*logo: '.logo-home'*/
		accountPaymentXButton: '.remove-btn.remove-payment.btn-light',
		accountPaymentXConfirmButton: '.btn.btn-primary.delete-confirmation-btn',
		savedCardCVVTextbox: '.form-control.saved-payment-security-code',
		accountPaymentSaveButton: '.btn.btn-save.btn-block.btn-primary',
		webPayNow: '.submit.wsdkpaynow',
		webCardNumber: '.field.is-empty.is-invalid',
		//accountCardName: '.card-header name'
		// country: '#shippingCountry',
		// state: '#shippingState',
		//firstName: '#shippingFirstName',


	},

	accept() {
		I.waitForElement({ xpath: '//*[@id="consent-tracking"]/div/div/div[3]/div/button[1]' }, 5);
		I.click({ xpath: '//*[@id="consent-tracking"]/div/div/div[3]/div/button[1]' });
	},

	Search(product) {
		I.fillField(this.locators.searchField, product);
		I.waitForElement(this.locators.searchedImage, 10);
		I.click(this.locators.searchedImage);
	},

	addToCart() {
		I.waitForElement({ xpath: "//button[@class='add-to-cart btn btn-primary']" }, 10);
		I.waitForEnabled({ xpath: "//button[@class='add-to-cart btn btn-primary']" }, 10);
		I.wait(2);
		I.click({ xpath: "//button[@class='add-to-cart btn btn-primary']" });
		I.wait(3);
	},

	viewCart() {
		I.scrollPageToTop();
		I.waitForElement(this.locators.miniCartIcon, 5);
		I.click(this.locators.miniCartIcon);
		I.waitForElement(this.locators.cartHeader, 5);
	},

	clickCheckout() {
		I.waitForElement(this.locators.checkoutBtn, 5);
		I.click(this.locators.checkoutBtn);
	},

	clickCheckoutAsGuest() {
		I.waitForElement(this.locators.checkoutAsGuest, 10);
		I.click(this.locators.checkoutAsGuest);
	},

	fillShippingAddress(country) {
		I.waitForElement({ xpath: "//select[@id='shippingCountrydefault']" }, 10);
		I.selectOption({ xpath: "//select[@id='shippingCountrydefault']" }, country);
		I.waitForElement({ xpath: "//select[@id='shippingStatedefault']" }, 5);
		I.selectOption({ xpath: "//select[@id='shippingStatedefault']" }, testData.Test.state);
		I.wait(3);
		I.waitForElement({ xpath: "//input[@id='shippingFirstNamedefault']" }, 5);
		I.fillField({ xpath: "//input[@id='shippingFirstNamedefault']" }, testData.Test.firstName);
		//I.wait(1);
		I.waitForElement({ xpath: "//input[@id='shippingLastNamedefault']" }, 5);
		I.fillField({ xpath: "//input[@id='shippingLastNamedefault']" }, testData.Test.lastName);
		//I.wait(1);
		I.waitForElement('#shippingAddressOnedefault', 5);
		I.fillField('#shippingAddressOnedefault', testData.Test.streetAddress1);
		I.waitForElement('#shippingAddressTwodefault', 5);
		I.fillField('#shippingAddressTwodefault', testData.Test.streetAddress2);
		I.waitForElement('#shippingAddressCitydefault', 5);
		I.fillField('#shippingAddressCitydefault', testData.Test.city);
		I.waitForElement('#shippingZipCodedefault', 5);
		I.fillField('#shippingZipCodedefault', testData.Test.postalCode);
		I.waitForElement('#shippingPhoneNumberdefault', 5);
		I.fillField('#shippingPhoneNumberdefault', testData.Test.phoneNumber);
		I.wait(5);
	},

	clickNextPaymentButton() {
		I.waitForElement(this.locators.nextPaymentButton, 5);
		I.waitForEnabled(this.locators.nextPaymentButton, 5);
		I.click(this.locators.nextPaymentButton);
		I.wait(2);
	},

	fillBillingAddress(country) {
		I.waitForElement({ xpath: "//a[contains(text(),'Update Address')]" }, 5);
		I.wait(1);
		I.click({ xpath: "//a[contains(text(),'Update Address')]" });
		I.waitForElement({ xpath: "//select[@id='billingCountry']" }, 5);
		I.selectOption({ xpath: "//select[@id='billingCountry']" }, country);
		I.wait(2);
	},

	fillEmailIDandPhoneNumber(emailID, PhoneNo) {
		I.waitForElement('#email', 2);
		I.fillField('#email', emailID);
		I.waitForElement('#phoneNumber', 2);
		I.fillField('#phoneNumber', PhoneNo);
	},

	fillWebsdkPaymentDetails(cardHolderName, cardNumber, expiry, cvv) {
		I.waitForElement('#websdkname', 5);
		I.fillField('#websdkname', cardHolderName);
		within({ frame: "#card-pan > iframe" }, () => {
			I.fillField('#pan', cardNumber);
		});
		I.wait(1);
		within({ frame: "#card-expiry > iframe" }, () => {
			I.fillField('#expiry', expiry);
		});
		within({ frame: "#card-cvv > iframe" }, () => {
			I.fillField('#cvv', cvv);
		});
		I.waitForElement({ xpath: "//button[normalize-space()='Verify Card']" }, 5);
		I.waitForEnabled({ xpath: "//button[normalize-space()='Verify Card']" }, 5);
		I.wait(2);
		I.click({ xpath: "//button[normalize-space()='Verify Card']" });
		I.wait(7);
	},

	fillDirectCardPaymentDetails(cardHolderName, cardNumber, expMonth, expYear, securityCode) {
		I.waitForElement('#cardOwner', 5)
		I.fillField('#cardOwner', cardHolderName);
		I.waitForElement('#cardNumber', 5);
		I.fillField('#cardNumber', cardNumber);
		I.wait(2);
		I.waitForElement('#expirationMonth', 5);
		I.selectOption('#expirationMonth', expMonth);
		I.waitForElement('#expirationYear', 5);
		I.selectOption('#expirationYear', expYear);
		I.waitForElement('#securityCode', 5);
		I.fillField('#securityCode', securityCode);
		I.wait(1);
	},

	fillAccountCardPaymentDetails(cardHolderName, cardNumber, expMonth, expYear) {
		I.waitForElement({ css: "a[aria-label='Add New Payment']" }, 5);
		I.waitForEnabled({ css: "a[aria-label='Add New Payment']" }, 5);
		I.click({ css: "a[aria-label='Add New Payment']" });
		I.wait(2);
		I.waitForElement('#cardnamemyaccount', 10)
		I.fillField('#cardnamemyaccount', cardHolderName);
		I.waitForElement('#cardNumber', 5);
		I.fillField('#cardNumber', cardNumber);
		I.wait(2);
		I.waitForElement('#month', 5);
		I.selectOption('#month', expMonth);
		I.waitForElement('#year', 5);
		I.selectOption('#year', expYear);
		I.wait(1);
		I.waitForEnabled({ css: "button[name='save']" }, 10)
		I.click({ css: "button[name='save']" })
		I.wait(2);
		I.waitForElement({ xpath: "//button[@aria-label='Delete Payment']" }, 15);
	},


	ClickOnNextReviewOrderButton() {
		I.scrollPageToBottom();
		I.waitForEnabled(this.locators.nextPlaceOrderButton, 10);
		I.wait(1);
		I.click(this.locators.nextPlaceOrderButton);
		I.wait(1);
	},

	PlaceOrderButton() {
		I.scrollPageToBottom();
		I.waitForElement(this.locators.placeOrderButton, 5);
		I.waitForEnabled(this.locators.placeOrderButton, 8);
		I.wait(3);
		I.click(this.locators.placeOrderButton);
		I.wait(3);
	},

	PlaceOrderButtonError() {
		I.scrollPageToBottom();
		I.waitForElement(this.locators.placeOrderButton, 5);
		I.waitForEnabled(this.locators.placeOrderButton, 8);
		I.wait(3);
		I.click(this.locators.placeOrderButton);
		I.wait(5);
		I.waitForElement({ css: "div[class='card payment-summary'] span[class='edit-button pull-right']" }, 15);
		I.waitForEnabled({ css: "div[class='card payment-summary'] span[class='edit-button pull-right']" }, 15);
		I.click({ css: "div[class='card payment-summary'] span[class='edit-button pull-right']" });
		I.wait(2);
	},

	editButtonError() {
		I.waitForElement({ css: "button[aria-label='Edit Payment']" }, 15);
		I.waitForEnabled({ css: "button[aria-label='Edit Payment']" }, 15);
		I.click({ css: "button[aria-label='Edit Payment']" });
		I.wait(2);
	},

	clickOnChallengeOkButton() {
		I.waitForElement({ xpath: "//input[@value='OK']" }, 15);
		I.waitForEnabled({ xpath: "//input[@value='OK']" }, 15);
		I.wait(1);
		I.click({ xpath: "//input[@value='OK']" });
		I.wait(3);

	},

	clickOnChallengeOkButtonError() {
		I.waitForElement({ xpath: "//input[@value='OK']" }, 15);
		I.waitForEnabled({ xpath: "//input[@value='OK']" }, 15);
		I.wait(1);
		I.click({ xpath: "//input[@value='OK']" });
		I.wait(3);
		I.waitForElement({ css: "div[class='card payment-summary'] span[class='edit-button pull-right']" }, 15);
		I.waitForEnabled({ css: "div[class='card payment-summary'] span[class='edit-button pull-right']" }, 15);
		I.click({ css: "div[class='card payment-summary'] span[class='edit-button pull-right']" });
		I.wait(2);
	},

	clickonLoginButton() {
		I.click({ xpath: "//span[contains(text(),'Login')]" });
	},

	loginByLoginButtonHomePage(email, password) {
		I.waitForElement('#login-form-email', 5);
		I.waitForElement('#login-form-password', 5);
		I.fillField({ name: 'loginEmail' }, email);
		I.fillField({ name: 'loginPassword' }, password);
		I.waitForEnabled({ xpath: "//button[contains(text(),'Login')]" }, 5);
		I.click({ xpath: "//button[contains(text(),'Login')]" });
		I.wait(2);
		I.waitForElement({ css: "span[class='user-message btn dropdown-toggle']" }, 5);
		I.seeElement({ css: "span[class='user-message btn dropdown-toggle']" });
	},

	disclaimerNoWeb() {
		I.waitForElement({ xpath: '//*[@id="disclaimer"]' }, 10);
		I.waitForEnabled({ xpath: '//*[@id="disclaimer"]' }, 10);
		I.click({ xpath: '//*[@id="disclaimer"]' });
		I.waitForElement({ xpath: "//div[@id='disclaimerModal']//input[2]" }, 10);
		I.click({ xpath: "//div[@id='disclaimerModal']//input[2]" });
		I.wait(2);
		I.waitForElement({ css: "button[class='btn btn-default cldis']" }, 5);
		I.click({ css: "button[class='btn btn-default cldis']" });
		I.wait(2);
	},

	disclaimerNoWebHpp() {
		I.waitForElement({ xpath: "//div[@class='dis_idredirect']//a[@id='disclaimer']" }, 10);
		I.waitForEnabled({ xpath: "//div[@class='dis_idredirect']//a[@id='disclaimer']" }, 10);
		I.click({ xpath: "//div[@class='dis_idredirect']//a[@id='disclaimer']" });
		I.waitForElement({ xpath: "//div[@id='disclaimerModalRedirect']//input[2]" }, 10);
		I.click({ xpath: "//div[@id='disclaimerModalRedirect']//input[2]" });
		I.wait(2);
		I.waitForElement({ xpath: "//button[@class='btn btn-default cldisccredirect']" }, 5);
		I.click({ xpath: "//button[@class='btn btn-default cldisccredirect']" });
		I.wait(2);
	},

	disclaimerYesWeb() {
		I.waitForElement({ xpath: '//*[@id="disclaimer"]' }, 10);
		I.waitForEnabled({ xpath: '//*[@id="disclaimer"]' }, 10);
		I.click({ xpath: '//*[@id="disclaimer"]' });
		I.waitForElement({ xpath: "//div[@id='disclaimerModal']//input[1]" }, 10);
		I.click({ xpath: "//div[@id='disclaimerModal']//input[1]" });
		I.wait(2);
		I.waitForElement({ css: "button[class='btn btn-default cldis']" }, 5);
		I.click({ css: "button[class='btn btn-default cldis']" });
		I.wait(2);
	},

	disclaimerYesWebHpp() {
		I.waitForElement({ xpath: "//div[@class='dis_idredirect']//a[@id='disclaimer']" }, 10);
		I.waitForEnabled({ xpath: "//div[@class='dis_idredirect']//a[@id='disclaimer']" }, 10);
		I.click({ xpath: "//div[@class='dis_idredirect']//a[@id='disclaimer']" });
		I.waitForElement({ xpath: "//div[@id='disclaimerModalRedirect']//input[1]" }, 10);
		I.click({ xpath: "//div[@id='disclaimerModalRedirect']//input[1]" });
		I.wait(2);
		I.waitForElement({ xpath: "//button[@class='btn btn-default cldisccredirect']" }, 5);
		I.click({ xpath: "//button[@class='btn btn-default cldisccredirect']" });
		I.wait(2);
	},

	disclaimerUnCheckWeb() {
		I.waitForElement('.form-check-input.check', 10);
		I.wait(2);
		I.uncheckOption('.form-check-input.check');
		I.wait(1);
	},

	disclaimerUnCheckWebHpp() {
		I.waitForElement('.form-check-input.checkccredirect', 10);
		I.wait(2);
		I.uncheckOption('.form-check-input.checkccredirect');
		I.wait(1);
	},



	clickOnPaymentView() {
		I.waitForElement({ xpath: "//a[@aria-label='View saved payment methods']" }, 10);
		I.click({ xpath: "//a[@aria-label='View saved payment methods']" });
	},

	NoDisclaimerPresent() {
		I.dontSeeElement('.form-check-input.check');
		I.dontSeeElement({ xpath: '//*[@id="disclaimer"]' });
	},


	removeSavedPayment() {
		I.waitForElement({ xpath: "//button[@aria-label='Delete Payment']" }, 5);
		I.click({ xpath: "//button[@aria-label='Delete Payment']" });
		I.waitForElement({ xpath: "//button[normalize-space()='Yes']" }, 5);
		I.click({ xpath: "//button[normalize-space()='Yes']" });
		I.wait(3);
		I.dontSee({ xpath: "//div[@class='card-body card-body-positioning']" });
	},

	/*verifySavedCard(name, cardExpiry)
	{
	  I.waitForElement({xpath :"//button[@aria-label='Delete Payment']"}, 5); 
	  I.wait(5);
	  I.see(name, {xpath :"//h2[normalize-space()='name']"});
	  I.see(cardExpiry, {xpath :"//div[@class='card-body card-body-positioning']"});
	  I.wait(5);
	  let ccName = await I.grabTextFrom({xpath :"//h2[normalize-space()='cardHolderName']"});
	  let ccExpiry = await I.grabTextFrom({xpath :"//div[@class='card-body card-body-positioning']"});
	  I.wait(5);
	  console.log(ccName);
	  console.log(ccExpiry);
	  I.wait(5);
	},*/


	//////////////////////////////////////////////////////////////////////////


	enterCvv(cvv) {

		I.seeElement('#saved-payment-security-code');
		I.fillField('#saved-payment-security-code', cvv);
		I.wait(1);
	},

	fillNegativeCardDetailswebsdk(email, PhonenNo, cardHolderName, cardNumber, expiry, cvv) {
		I.waitForElement('#email');
		I.fillField('#email', email);
		I.fillField('#phoneNumber', PhonenNo);
		I.fillField('#websdkname', cardHolderName);
		within({ frame: "#card-pan > iframe" }, () => {
			I.fillField('#pan', cardNumber);
		});
		I.wait(2);
		within({ frame: "#card-expiry > iframe" }, () => {
			I.fillField('#expiry', expiry);
		});
		within({ frame: "#card-cvv > iframe" }, () => {
			I.fillField('#cvv', cvv);
		});
		I.waitForEnabled(this.locators.webPayNow);
		I.click(this.locators.webPayNow);
		I.wait(6);
	},

	confirmPaymentMethod(paymentMethod) {
		I.waitForElement({ css: "div[class='payment-details']" }, 25);
		I.see(paymentMethod, { css: "div[class='payment-details']" });
	},

	clickOn3DSubmitButton(magicValue) {
		I.waitForElement({ xpath: "//input[@type='submit']" });
		I.selectOption('paResMagicValues', magicValue);
		I.click({ xpath: "//input[@type='submit']" });
		I.wait(3);
	},

	selectPreferredCardHPP(preferredCard) {
		I.wait(1);
		I.waitForElement('#worldpayCards', 10);
		I.selectOption('#worldpayCards', preferredCard)
		I.wait(1);
	},

	fillHPPCardPaymentDetails(cardNumber, cardName, expMonth, expYear, securityCode) {
		I.waitForEnabled('#cardNumber', 5);
		I.fillField('#cardNumber', cardNumber);
		I.waitForEnabled('#cardholderName', 5);
		I.fillField('#cardholderName', cardName);
		I.waitForEnabled('#expiryMonth', 5);
		I.fillField('#expiryMonth', expMonth);
		I.waitForEnabled('#expiryYear', 5);
		I.fillField('#expiryYear', expYear);
		I.waitForEnabled('#securityCode', 5);
		I.fillField('#securityCode', securityCode);
		I.wait(1);
	},

	clickOnHPP3DSubmitButton(threeDMagicValue) {
		within({ frame: ".iframe-container > iframe" }, () => {
			I.waitForElement({ xpath: "/html/body/div/form/ul/li[6]/span/select" }, 25);
			I.selectOption('paResMagicValues', threeDMagicValue);
			I.waitForElement({ xpath: "/html/body/div/form/ul/li[8]/span/input" }, 5);
			I.click({ xpath: "/html/body/div/form/ul/li[8]/span/input" });
		});
		I.wait(2);
	},

	clickOnHPPOkButton() {
		within({ frame: ".iframe-container > iframe" }, () => {
			I.waitForElement({ xpath: "/html/body/form/input[4]" }, 25);
			I.click({ xpath: "/html/body/form/input[4]" });
		});
		I.wait(2);
	},



	//////////////////Quick Checkout//////////////////////

	fillAccountShippingAddress(country, addressid) {
		I.waitForElement({ css: "a[aria-label='Add New Address']" }, 5);
		I.waitForEnabled({ css: "a[aria-label='Add New Address']" }, 5);
		I.click({ css: "a[aria-label='Add New Address']" });
		I.wait(2);
		I.waitForElement({ css: "#country" }, 10);
		I.selectOption({ css: "#country" }, country);
		I.waitForElement({ css: "#state" }, 5);
		I.selectOption({ css: "#state" }, testData.Test.state);
		I.wait(3);
		I.waitForElement({ css: "#addressId" }, 5);
		I.fillField({ css: "#addressId" }, addressid);
		I.waitForElement({ css: "#firstName" }, 5);
		I.fillField({ css: "#firstName" }, testData.Test.firstName);
		//I.wait(1);
		I.waitForElement({ css: "#lastName" }, 5);
		I.fillField({ css: "#lastName" }, testData.Test.lastName);
		//I.wait(1);
		I.waitForElement({ css: "#address1" }, 5);
		I.fillField({ css: "#address1" }, testData.Test.streetAddress1);
		I.waitForElement({ css: "#address2" }, 5);
		I.fillField({ css: "#address2" }, testData.Test.streetAddress2);
		I.waitForElement({ css: "#city" }, 5);
		I.fillField({ css: "#city" }, testData.Test.city);
		I.waitForElement({ css: "#zipCode" }, 5);
		I.fillField({ css: "#zipCode" }, testData.Test.postalCode);
		I.waitForElement({ css: "#phone" }, 5);
		I.fillField({ css: "#phone" }, testData.Test.phoneNumber);
		I.wait(1);
		I.waitForElement({ css: "button[name='save']" }, 5);
		I.click({ css: "button[name='save']" });
		I.wait(2);
		I.waitForElement({ xpath: "//button[contains(text(),'×')]" }, 15)
		I.wait(1);
	},

	enterCvvQc(cvv) {
		I.waitForElement('#saved-payment-security-code', 5);
		I.fillField('#saved-payment-security-code', cvv);
		I.wait(1);
	},

	//SFRA 6.0

	fillPhoneNumber(PhoneNo) {
		I.waitForElement('#phoneNumber', 2);
		I.fillField('#phoneNumber', PhoneNo);
	},

	loginByLoginButtonCustomerSection(email, password) {
		I.waitForElement({ css: "button[class='btn btn-link js-login-customer']" }, 5);
		I.click({ css: "button[class='btn btn-link js-login-customer']" });
		I.wait(1);
		I.waitForElement('#email', 5);
		I.waitForElement('#password', 5);
		I.fillField('#email', email);
		I.fillField('#password', password);
		I.waitForEnabled({ css: "button[value='submit-login']" }, 5);
		I.click({ css: "button[value='submit-login']" });
		I.wait(2);
		I.waitForElement({ xpath: "//button[normalize-space()='Next: Payment']" }, 10);
		I.seeElement({ xpath: "//button[normalize-space()='Next: Payment']" });
	},

}