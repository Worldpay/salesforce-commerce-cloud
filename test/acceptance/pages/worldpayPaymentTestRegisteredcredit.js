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
		nextPlaceOrderButton: '.btn.btn-primary.btn-block.submit-payment'
		// country: '#shippingCountry',
		// state: '#shippingState',
		//firstName: '#shippingFirstName',

	},

	clickonLoginButton()
	{
		I.click({xpath: "//span[contains(text(),'Login')]"});
		I.wait(2);
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

		I.click({xpath :"//button[@class='add-to-cart btn btn-primary']"});
		I.wait(2);
	
		//Product added to basket
	},
	viewCart() {
        I.scrollPageToTop();
        I.wait(2);
        I.click(this.locators.miniCartIcon);
        I.waitForElement(this.locators.cartHeader);
        
    },
    
    clickCheckout(){
        I.waitForElement(this.locators.checkoutBtn);
		I.click(this.locators.checkoutBtn);
		I.wait(2);
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
	
		I.seeElement('.credit-card-option');
		
		I.fillField('#email',emailID);
		I.fillField('#phoneNumber',PhoneNo);
		I.wait(2);
	},

	fillCardDetailsRedirectAmex(cardNumber1,expMonth1,expYear1,securityCode1)
	{
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
	},


selectCardRedirectMode(Card) {
	I.waitForElement('#worldpayCards');
	I.selectOption('#worldpayCards', Card);
	I.waitForElement({xpath :'//*[@id="credit-card-content"]/fieldset/div[7]/div/div/label/input'});
		I.click({xpath :'//*[@id="credit-card-content"]/fieldset/div[7]/div/div/label/input'});
		I.wait(1);

},

}