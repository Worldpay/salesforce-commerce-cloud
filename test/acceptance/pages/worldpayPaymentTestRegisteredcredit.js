const I = actor();

module.exports = {
	locators: 
	{
		loginbtn:'.btn.btn-block.btn-primary',
		searchField: 'input.form-control.search-field',
		searchedImage: 'a>img.swatch-circle',
		selectSize1: '.select-size',
		selectQuantity: '.quantity-select',
		addToCartButton: '.add-to-cart.btn.btn-primary',
		miniCartIcon: '.minicart-quantity',
		cartHeader: '.cart-header',
		checkoutBtn: '.btn.btn-primary.btn-block.checkout-btn',
		checkoutAsGuest: '.btn.btn-block.btn-primary.checkout-as-guest',
		color: '.color-value.swatch-circle',
		nextLoginButton: '.btn.btn-primary.btn-block.submit-shipping',
		addPaymentButton: '.btn.btn-block.add-payment.btn-outline-primary',
		placeOrderButton: '.btn.btn-primary.btn-block.place-order',
		nextPlaceOrderButton: '.btn.btn-primary.btn-block.submit-payment',
		/*logo: '.logo-home'*/
		accountPaymentXButton: '.remove-btn.remove-payment.btn-light',
		accountPaymentXConfirmButton: '.btn.btn-primary.delete-confirmation-btn',
		savedCardCVVTextbox: '.form-control.saved-payment-security-code',
		accountPaymentSaveButton: '.btn.btn-save.btn-block.btn-primary',
		narrativeTextBox: '.form-control.statementNarrative'
		// country: '#shippingCountry',
		// state: '#shippingState',
		//firstName: '#shippingFirstName',

	},

	clickonLoginButton()
	{
		I.click({xpath: "//span[contains(text(),'Login')]"});
		I.wait(5);
	},
	loginByLoginButtonHomePage(email, password){
    	I.waitForElement('#login-form-email');
   		I.waitForElement('#login-form-password'); 
		I.fillField({name: 'loginEmail'}, email);
		I.fillField({name: 'loginPassword'}, password);
		I.waitForEnabled({xpath: "//button[contains(text(),'Login')]"});	
		I.click({xpath: "//button[contains(text(),'Login')]"});  
		I.wait(5);
	},

	Search(product)
	{
		I.fillField(this.locators.searchField, product);
		I.wait(3);
		I.waitForElement(this.locators.searchedImage);
		I.click(this.locators.searchedImage);
		I.wait(2);
	},

	selectSizeSmall(size) {
		I.waitForElement(this.locators.color);
		I.click(this.locators.color);
		I.waitForElement({xpath: "//select[@class='custom-select form-control select-size']"})	
		I.click({xpath: "//select[@class='custom-select form-control select-size']"});
		I.wait(2);
		I.selectOption({xpath: "//select[@class='custom-select form-control select-size']"},size);
	},
	selectQuantity(quantity) {
		I.waitForElement(this.locators.selectQuantity);
		I.selectOption(this.locators.selectQuantity, quantity);
	
	},
	addToCart() {

		//I.click({xpath :"//button[@class='add-to-cart btn btn-primary']"});
		//I.click('.add-to-cart.btn.btn-primary');
		I.click(this.locators.addToCartButton)
		I.wait(3);
		I.click(this.locators.addToCartButton)
		I.wait(2);
	
		//Product added to basket
	},
	viewCart() {
        I.scrollPageToTop();
        I.wait(2);
        I.click(this.locators.miniCartIcon);
		I.waitForElement(this.locators.cartHeader);
		I.wait(3);
        
    },
    
    clickCheckout(){
        I.waitForElement(this.locators.checkoutBtn);
		I.click(this.locators.checkoutBtn);
		I.wait(5);
	},

	clickCheckoutAsGuest(){
		I.waitForElement(this.locators.checkoutAsGuest);
		I.click(this.locators.checkoutAsGuest);
		I.wait(2);
		
	},
	selectCountry(country)
	{
		I.waitForElement({xpath :"//select[@id='shippingCountrydefault']"});
		I.selectOption({xpath :"//select[@id='shippingCountrydefault']"},country);
		
	},
	selectState(state)
	{
		I.waitForElement({xpath :"//select[@id='shippingStatedefault']"});
		I.selectOption({xpath :"//select[@id='shippingStatedefault']"},state);
		I.wait(5);
	},
	filladdress(firstName,lastName,streetAddress1,streetAddress2,city,postalCode,phoneNumber)
	{
		I.waitForElement({xpath :"//input[@id='shippingFirstNamedefault']"});

		I.fillField({xpath :"//input[@id='shippingFirstNamedefault']"},firstName);
	
		I.fillField({xpath :"//input[@id='shippingLastNamedefault']"},lastName);
		
		//I.fillField('#shippingLastName',lastName);
		I.fillField('#shippingAddressOnedefault',streetAddress1);
		
		I.fillField('#shippingAddressTwodefault',streetAddress2);
	
		I.fillField('#shippingAddressCitydefault',city);
		
		I.fillField('#shippingZipCodedefault',postalCode);
		I.fillField('#shippingPhoneNumberdefault',phoneNumber);
		I.wait(2);

		I.click(this.locators.nextLoginButton);
		I.wait(5);
	},
	fillEmailIDandPhoneNo(emailID,PhoneNo)
	{
	
		I.seeElement('.credit-card-option');
		
		I.fillField('#email',emailID);
		I.fillField('#phoneNumber',PhoneNo);
		I.wait(5);
		I.click(this.locators.addPaymentButton);
	},

	fillEmailIDandPhoneNoReDirect(emailID,PhoneNo)
	{
		//I.seeElement({xpath :'//*[@id="CREDIT_CARD"]/a'});
		//I.click({xpath :'//*[@id="CREDIT_CARD"]/a'});
		I.fillField('#email',emailID);
		I.fillField('#phoneNumber',PhoneNo);
		I.wait(2);
	},

	fillEmailIDandPhoneNoDirect(emailID,PhoneNo,cvv)
	{
		let ccField;
		if (ccField = I.seeElement('#saved-payment-security-code')) {
		I.fillField('#email',emailID);
		I.fillField('#phoneNumber',PhoneNo);
		I.fillField('#saved-payment-security-code',cvv);
		I.wait(1);
		} else {
		I.click({xpath :'//*[@id="CREDIT_CARD"]/a'});
		I.wait(1);
		I.fillField('#email',emailID);
		I.fillField('#phoneNumber',PhoneNo);
		I.fillField('#saved-payment-security-code',cvv);
		I.wait(1);
		}
		
	},

	fillCardDetailsRedirect(name,cardNumber1,expMonth1,expYear1,securityCode1)
	{
		I.waitForEnabled('#cardholderName');
		I.fillField('#cardholderName',name);
		I.waitForEnabled('.textbox.required.cardNumber.UNKNOWN');
		I.fillField('.textbox.required.cardNumber.UNKNOWN',cardNumber1);
		I.waitForElement({name: 'expiryDate.expiryMonth'});
		I.fillField({name: 'expiryDate.expiryMonth'}, expMonth1);	
		I.fillField({name: 'expiryDate.expiryYear'}, expYear1);
		I.fillField( {xpath :"//input[@id='securityCode']"},securityCode1);
		I.wait(2);
		
	},
	fillCardDetails(email,PhonenNo,cardHolderName,cardNumber,expMonth,expYear,securityCode)
	{
		I.waitForElement('#email');
		I.fillField('#email',email);
		I.fillField('#phoneNumber',PhonenNo);
		I.fillField('#cardOwner',cardHolderName)
		I.fillField('#cardNumber',cardNumber);
		I.wait(2);
		I.selectOption('#expirationMonth',expMonth);
		I.selectOption('#expirationYear',expYear);
		I.fillField('#securityCode',securityCode);
		I.waitForElement({xpath :'//*[@id="credit-card-content"]/fieldset/div[7]/div/div/label/input'});
		I.click({xpath :'//*[@id="credit-card-content"]/fieldset/div[7]/div/div/label/input'});
		I.wait(1);
	},


	fillCardDetailsGuest(email,PhonenNo,cardHolderName,cardNumber,expMonth,expYear,securityCode)
	{
		I.waitForElement('#email');
		I.fillField('#email',email);
		I.fillField('#phoneNumber',PhonenNo);
		I.fillField('#cardOwner',cardHolderName)
		I.fillField('#cardNumber',cardNumber);
		I.wait(2);
		I.selectOption('#expirationMonth',expMonth);
		I.selectOption('#expirationYear',expYear);
		I.fillField('#securityCode',securityCode);
		I.wait(1);
	},
	ClickOnNextPlaceOrderButton()
	{
		I.scrollPageToBottom();
		I.waitForElement(this.locators.nextPlaceOrderButton);
		I.click(this.locators.nextPlaceOrderButton);
		I.wait(5);
	},
	clickOnPlaceOrder()
	{
		I.scrollPageToBottom();
		I.click(this.locators.placeOrderButton);
		I.wait(2);
	},

	PlaceOrder()
	{
		I.scrollPageToBottom();
		I.click(this.locators.placeOrderButton);
		I.wait(10);
	},

	clickOnSubmitButton()
	{
		I.waitForElement({xpath :"//input[@type='submit']"});
		I.click({xpath :"//input[@type='submit']"});
		I.wait(3);
	},

	clickOn3DSubmitButton(magicValue)
	{
		I.waitForElement({xpath :"//input[@type='submit']"});
		I.selectOption('paResMagicValues', magicValue);
		I.click({xpath :"//input[@type='submit']"});
		I.wait(3);
	},

		clickOnPlaceOrdererror()
	{
		I.scrollPageToBottom();
		I.click(this.locators.placeOrderButton);
		I.wait(2);
		

	},
	clickOnSubmitButton()
	{
		I.waitForElement({xpath :"//input[@type='submit']"});
		I.click({xpath :"//input[@type='submit']"});
	},

SelectRedirectMode()
	{
		I.waitForElement({xpath :"//a[contains(text(),'Credit Card - Redirect')]"});	
		I.click({xpath :"//a[contains(text(),'Credit Card - Redirect')]"});
		I.wait(5);
	},


selectCardRedirectMode(Card) {
	I.waitForElement('#worldpayCards');
	I.selectOption('#worldpayCards', Card);
	//I.waitForElement({xpath :'//*[@id="disclaimer"]'});
	//I.click({xpath :'//*[@id="disclaimer"]'});
	//I.waitForElement({xpath :'//*[@id="disclaimer-agree"]/input[2]'});
	//I.click({xpath :'//*[@id="disclaimer-agree"]/input[2]'}); 
	//I.wait(1);
	//I.click({xpath :'//*[@id="disclaimerModal"]/div/div/div[3]/button'});
	//I.wait(1);
	I.waitForElement({xpath :'//*[@id="credit-card-content-redirect"]/fieldset/div[2]/div/div[1]/label/input'});
	I.click({xpath :'//*[@id="credit-card-content-redirect"]/fieldset/div[2]/div/div[1]/label/input'});
	I.wait(1);

},

selectGuestCardRedirectMode(Card) {
	I.waitForElement('#worldpayCards');
	I.selectOption('#worldpayCards', Card);
	I.wait(1);

},



//sanjay

clickOnChallengeOkButton()
	{
		I.waitForElement({xpath :'//*[@id="challengeForm"]/input[4]'});
        I.click({xpath :'//*[@id="challengeForm"]/input[4]'});
        
	},

fillCardDetailsSave(email,PhonenNo,cardHolderName,cardNumber,expMonth,expYear,securityCode)
	{
		I.waitForElement('#email');
		I.fillField('#email',email);
		I.fillField('#phoneNumber',PhonenNo);
		I.fillField('#cardOwner',cardHolderName)
		I.fillField('#cardNumber',cardNumber);
		I.wait(2);
		I.selectOption('#expirationMonth',expMonth);
		I.selectOption('#expirationYear',expYear);
		I.fillField('#securityCode',securityCode);
		I.waitForElement({xpath :'//*[@id="disclaimer"]'});
		I.click({xpath :'//*[@id="disclaimer"]'});
		I.waitForElement({xpath :'//*[@id="disclaimer-agree"]/input[1]'});
		I.click({xpath :'//*[@id="disclaimer-agree"]/input[1]'});
		I.wait(1);
		I.click({xpath :'//*[@id="disclaimerModal"]/div/div/div[3]/button'});
		I.wait(1);
	},

ClickOnPaymentView()
	{
		I.waitForElement({xpath :'//*[@id="maincontent"]/div[2]/div[2]/div[2]/div[2]/div[1]/a'});
		I.click({xpath :'//*[@id="maincontent"]/div[2]/div[2]/div[2]/div[2]/div[1]/a'});
		I.wait(7);
	},
RemoveSavedPayment()	
	{
		I.waitForElement(this.locators.accountPaymentXButton);
		I.click(this.locators.accountPaymentXButton);
		I.waitForElement(this.locators.accountPaymentXConfirmButton);
		I.click(this.locators.accountPaymentXConfirmButton);
		I.wait(2);
		
	},

	fillCvv(cvv)
	{
		I.seeElement('#saved-payment-security-code');
		I.fillField('#saved-payment-security-code',cvv);
		I.wait(1);
	},


	addNewPayment()
	{
		I.waitForElement('~Add New Payment');
		I.click('~Add New Payment');
	},

	fillCardDetailsAccount(cardHolderName,cardNumber,expMonth,expYear)

	{
		I.waitForElement('#cardnamemyaccount');
		I.fillField('#cardnamemyaccount',cardHolderName);
		I.fillField('#cardNumber',cardNumber);
		I.selectOption('#month',expMonth);
		I.selectOption('#year',expYear);
		I.waitForElement(this.locators.accountPaymentSaveButton);
		I.click(this.locators.accountPaymentSaveButton);
		I.wait(2);
	},
	
	fillCardDetailsNoSave(email,PhonenNo,cardHolderName,cardNumber,expMonth,expYear,securityCode)
	{
		I.waitForElement('#email');
		I.fillField('#email',email);
		I.fillField('#phoneNumber',PhonenNo);
		I.fillField('#cardOwner',cardHolderName)
		I.fillField('#cardNumber',cardNumber);
		I.wait(2);
		I.selectOption('#expirationMonth',expMonth);
		I.selectOption('#expirationYear',expYear);
		I.fillField('#securityCode',securityCode);
		I.waitForElement({xpath :'//*[@id="disclaimer"]'});
		I.click({xpath :'//*[@id="disclaimer"]'});
		I.waitForElement({xpath :'//*[@id="disclaimer-agree"]/input[2]'});
		I.click({xpath :'//*[@id="disclaimer-agree"]/input[2]'}); 
		I.wait(1);
		I.click({xpath :'//*[@id="disclaimerModal"]/div/div/div[3]/button'});
		I.wait(1);
	},


	fillCvvHpp(cvv)
	{
	
		I.seeElement({xpath :'//*[@id="securityCode"]'});
		I.fillField({xpath :'//*[@id="securityCode"]'}, cvv);
		I.wait(1);
		I.seeElement({xpath :'//*[@id="submitButton"]'});
		I.click({xpath :'//*[@id="submitButton"]'});
		I.wait(5);
	},


	

//HPP HPP HPP

fillEmailIDandPhoneNoReDirect(emailID,PhoneNo,preferredCard)
	{
		I.seeElement({xpath :'//*[@id="Worldpay"]/a'});
		I.click({xpath :'//*[@id="Worldpay"]/a'});
		I.fillField('#email',emailID);
		I.fillField('#phoneNumber',PhoneNo);
		I.wait(1);
		I.selectOption('#worldpayCards',preferredCard)
		I.wait(1);
		I.waitForElement(this.locators.nextPlaceOrderButton);
		I.click(this.locators.nextPlaceOrderButton);
		I.wait(4);
		I.click(this.locators.placeOrderButton);
		I.wait(9);

	},

	fillEmailIDandPhoneNoReDirectNUI(emailID,PhoneNo,preferredCard)
	{
		I.wait(1);
		I.click('Hosted Payment Page')
		I.wait(1);
		I.fillField('#email',emailID);
		I.fillField('#phoneNumber',PhoneNo);
		I.wait(1);
		I.selectOption('#worldpayCards',preferredCard)
		I.wait(1);
		I.waitForElement(this.locators.nextPlaceOrderButton);
		I.click(this.locators.nextPlaceOrderButton);
		I.wait(4);
		I.click(this.locators.placeOrderButton);
		I.wait(9);

	},



fillCardDetailsHPP(cardNumber,cardName,expMonth,expYear,securityCode)
	{
		I.waitForEnabled('#cardNumber');
		I.fillField('#cardNumber',cardNumber);
		I.waitForEnabled('#cardholderName');
		I.fillField('#cardholderName',cardName);
		I.waitForEnabled('#expiryMonth');
		I.fillField('#expiryMonth',expMonth);
		I.waitForEnabled('#expiryYear');
		I.fillField('#expiryYear',expYear);
		I.waitForEnabled('#securityCode');
		I.fillField('#securityCode',securityCode);
		I.wait(1);
		I.waitForEnabled('#submitButton');
		I.click('#submitButton');
		I.wait(9);
	},

clickOnHPP3DSubmitButton(threeDMagicValue)
	{
		within({frame: ".iframe-container > iframe"}, () => {
		I.selectOption('paResMagicValues', threeDMagicValue);
		I.waitForElement({xpath :"/html/body/div/form/ul/li[8]/span/input"});
		I.click({xpath :"/html/body/div/form/ul/li[8]/span/input"});
		});
		I.wait(9);
		
	},

	clickOkHPP3DS()
	{
		within({frame: ".iframe-container > iframe"}, () => {
		I.waitForElement({xpath :"/html/body/form/input[4]"});
		I.click({xpath :"/html/body/form/input[4]"});
		});
		I.wait(9);
	},

	
		
}

		