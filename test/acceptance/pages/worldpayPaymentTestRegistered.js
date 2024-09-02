const I = actor();

module.exports = {
  locators: {
    selectSize: '.select-size',
    selectQuantity: '.quantity-select',
    selectColor: '.color-value',
    addToCartButton: '.add-to-cart',
    addToCartButtonEnabled: '.add-to-cart:not(:disabled)',
    miniCartIcon: '.minicart',
    cartHeader: '.cart-header',
    productImage: '.carousel-item.active > img',
    navigationCrumbs: '.product-breadcrumb:not(.d-md-none) .breadcrumb-item a',
    productName: '.product-name',
    productId: '.product-id',
    ratings: '.ratings',
    quantitySelect: '.quantity-select',
    productAvailability: '.availability-msg',
    productPrice: '.prices .price .value',
    socialShare: 'ul.social-icons a',
    pinterest: '.fa-pinterest',
    facebook: '.fa-facebook-official',
    twitter: '.fa-twitter',
    copyLink: '.fa-link',
    //checkoutBtn: '.checkout-btn',
    checkoutBtn: '.btn.btn-primary.btn-block.checkout-btn',
    loginbtn: '.mylogin',
    productDescription: '.description-and-detail .description .content',
    productDetails: '.description-and-detail .details .content',
    copyLinkMsgVisible: '.copy-link-message:not(.d-none)',
    miniCartQuantity: '.minicart-quantity',
    addToCartSuccess: '.add-to-cart-messages .alert-success',
    addToCartFailure: '.add-to-cart-messages .alert-danger',
    narrativeTextBox: '.form-control.statementNarrative'
  },
  selectSize(size) {
    I.waitForElement(this.locators.selectSize);
    I.selectOption(this.locators.selectSize, size);
    I.wiat(2);
  },
  googlePay() {
    I.wait(5);
    I.click({ xpath: '//*[@id="PAYWITHGOOGLE-SSL"]/a' });
  },
  emailAndPhoneGooglePay(Email, Phonenumber) {
    I.wait(5);
    I.click({ xpath: '//*[@id="email"]' });
    I.fillField({ xpath: '//*[@id="email"]' }, Email);
    I.wait(5);
    I.click({ xpath: '//*[@id="phoneNumber"]' });
    I.fillField({ xpath: '//*[@id="phoneNumber"]' }, Phonenumber);
    I.wait(5);
  },
  gmailId(gId, gPwd) {
    I.say('reached in window1')
    // I.click('//*[@id="identifierId"]');
    I.fillField({ xpath: '//*[@id="identifierId"]' }, gId);
    I.click({ xpath: '//*[@id="identifierNext"]/div/span/span' });
    I.wait(5);
    // I.click({xpath: '//*[@id="password"]/div[1]/div/div[1]/input'});
    I.fillField({ xpath: '//*[@id="password"]/div[1]/div/div[1]/input' }, gPwd);
    I.click({ xpath: '//*[@id="passwordNext"]/div/span/span' });
    I.wait(5);
    I.switchTo({ xpath: '//*[@id="sM432dIframe"]' });
    I.click({ xpath: '//*[@id="iframeBody"]/div[2]/div/div/div/div[3]/div/div' });
    I.wait(3);
    // I.switchTo();

    I.say('Finished GPay')
  },

  clickOnBuyWithGpay() {
    I.waitForEnabled({ xpath: '//*[@id="containergpay"]/div/button' });
    I.click({ xpath: '//*[@id="containergpay"]/div/button' });
    I.wait(5);
  },
  selectQuantity(quantity) {
    I.waitForElement(this.locators.selectQuantity);
    I.selectOption(this.locators.selectQuantity, quantity);
  },
  addToCart() {
    I.waitForEnabled(this.locators.addToCartButton);
    I.click(this.locators.addToCartButton);
  },
  viewCart() {
    I.scrollPageToTop();
    I.wait(2);
    I.click(this.locators.miniCartIcon);
    //I.waitForElement(this.locators.cartHeader);

  },

  clickCheckout() {
    //I.waitForElement(this.locators.checkoutBtn);
    I.click(this.locators.checkoutBtn);

  },
  selectColor() {
    I.waitForElement(this.locators.selectColor);
    I.click(this.locators.selectColor);
    I.wait(2);
  },

  loginAsRegisteredUser(email, password) {
    I.waitForElement('#login-form-email');
    I.waitForElement('#login-form-password');
    I.fillField('#login-form-email', email);
    I.fillField('#login-form-password', password);
    I.waitForEnabled({ xpath: '//*[@id="maincontent"]/div/div[2]/div/div[2]/div[2]/form[1]/button' });
    I.click({ xpath: '//*[@id="maincontent"]/div/div[2]/div/div[2]/div[2]/form[1]/button' });
    I.wait(2);

  },
  paypalRegistered(email, phone, country, response) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.submit-payment');
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#PAYPAL-EXPRESS');
    I.waitForElement(locate('a').withAttr({ alt: 'Pay Pal' }).inside(locate('li').withAttr({ id: 'PAYPAL-EXPRESS' })));
    I.wait(5);
    I.click(locate('a').withAttr({ alt: 'Pay Pal' }).inside(locate('li').withAttr({ id: 'PAYPAL-EXPRESS' })));
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.waitForElement('#simulatedAuth');
    I.selectOption('#simulatedAuth', response);
    I.wait(1);
    I.click('#PMMakePayment');
    I.wait(3);
    //I.waitForElement('.card.confirm-details');
  },

  paypalRegisteredNarrative(email, phone, country, narrative) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.submit-payment');
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#PAYPAL-EXPRESS');
    I.waitForElement(locate('a').withAttr({ alt: 'Pay Pal' }).inside(locate('li').withAttr({ id: 'PAYPAL-EXPRESS' })));
    I.wait(5);
    I.click(locate('a').withAttr({ alt: 'Pay Pal' }).inside(locate('li').withAttr({ id: 'PAYPAL-EXPRESS' })));
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.waitForElement('.form-control.statementNarrative');
    I.fillField('.form-control.statementNarrative', narrative);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.wait(3);
    I.waitForElement('#PMMakePayment');
    I.wait(2);
    I.click('#PMMakePayment');
    I.wait(2);
    I.waitForElement('.card.confirm-details');
  },

  idealRegistered(email, phone, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.submit-payment');
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#IDEAL-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'IDEAL-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'IDEAL-SSL' })));
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.waitForElement({ xpath: '//*[@id="op-Auth"]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="op-Auth"]' });
    I.wait(5);
    I.waitForElement('.card.confirm-details');
  },

  idealRegisteredCancel(email, phone, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.submit-payment');
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#IDEAL-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'IDEAL-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'IDEAL-SSL' })));
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.waitForElement({ xpath: '//*[@id="op-Cancel"]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="op-Cancel"]' });
    I.wait(5);
    //I.waitForElement('.card.confirm-details');
  },

  idealRegisteredRefuse(email, phone, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.submit-payment');
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#IDEAL-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'IDEAL-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'IDEAL-SSL' })));
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.waitForElement({ xpath: '//*[@id="op-Reject"]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="op-Reject"]' });
    I.wait(5);
    //I.waitForElement('.card.confirm-details');
  },

  idealRegisteredNarrative(email, phone, country, narrative) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.submit-payment');
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#IDEAL-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'IDEAL-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'IDEAL-SSL' })));
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.waitForElement('.form-control.statementNarrative');
    I.fillField('.form-control.statementNarrative', narrative);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.waitForElement({ xpath: '//*[@id="op-Auth"]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="op-Auth"]' });
    I.wait(2);
    I.waitForElement('.card.confirm-details');
  },


  fillShipping(firstName, lastName, addressOne, addressTwo, country, state, city, zipCode, phone) {
    I.waitForEnabled('#shippingFirstNamedefault');
    I.waitForEnabled('#shippingLastNamedefault');
    I.waitForEnabled('#shippingAddressOnedefault');
    I.waitForEnabled('#shippingAddressTwodefault');
    I.waitForEnabled('#shippingCountrydefault');
    I.waitForEnabled('#shippingStatedefault');
    I.waitForEnabled('#shippingAddressCitydefault');
    I.waitForEnabled('#shippingZipCodedefault');
    I.waitForEnabled('#shippingPhoneNumberdefault');
    I.waitForEnabled('.submit-shipping');
    I.fillField('#shippingFirstNamedefault', firstName);
    I.fillField('#shippingLastNamedefault', lastName);
    I.fillField('#shippingAddressOnedefault', addressOne);
    I.fillField('#shippingAddressTwodefault', addressTwo);
    I.selectOption('#shippingCountrydefault', country);
    I.selectOption('#shippingStatedefault', state);
    I.fillField('#shippingAddressCitydefault', city);
    I.wait(1);
    I.fillField('#shippingZipCodedefault', zipCode);
    I.wait(1);
    I.fillField('#shippingPhoneNumberdefault', phone);
    I.wait(1);
    I.click('.submit-shipping');
    I.wait(3);
  },

  sofortRegistered(email, phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.submit-payment');
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#SOFORT-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'SOFORT-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'SOFORT-SSL' })));
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement({ xpath: '//*[@id="jsEnabled"]/a/img' });
    I.wait(2);
    I.click({ xpath: '//*[@id="jsEnabled"]/a/img' });
    I.wait(2);

  },

  alipayRegistered(email, phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#ALIPAY-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'ALIPAY-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'ALIPAY-SSL' })));
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  chinaunionpayRegistered(email, phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#CHINAUNIONPAY-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'CHINAUNIONPAY-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'CHINAUNIONPAY-SSL' })));
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForElement({ xpath: '/html/body/form/center/input' });
    I.click({ xpath: '/html/body/form/center/input' });
    I.wait(3);
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  mistercashRegistered(email, phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#MISTERCASH-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'MISTERCASH-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'MISTERCASH-SSL' })));
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  przelewy24Registered(email, phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#PRZELEWY-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'PRZELEWY-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'PRZELEWY-SSL' })));
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  poliRegistered(email, phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#POLI-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'POLI-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'POLI-SSL' })));
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },



  fillUkShipping(firstName, lastName, addressOne, addressTwo, country, county, city, zipCode, phone) {
    I.waitForEnabled('#shippingFirstNamedefault');
    I.waitForEnabled('#shippingLastNamedefault');
    I.waitForEnabled('#shippingAddressOnedefault');
    I.waitForEnabled('#shippingAddressTwodefault');
    I.waitForEnabled('#shippingCountrydefault');
    I.waitForEnabled('#shippingAddressCitydefault');
    I.waitForEnabled('#shippingStatedefault');
    I.waitForEnabled('#shippingZipCodedefault');
    I.waitForEnabled('#shippingPhoneNumberdefault');
    I.waitForEnabled('.submit-shipping');
    I.fillField('#shippingFirstNamedefault', firstName);
    I.fillField('#shippingLastNamedefault', lastName);
    I.fillField('#shippingAddressOnedefault', addressOne);
    I.fillField('#shippingAddressTwodefault', addressTwo);
    I.selectOption('#shippingCountrydefault', country);
    I.fillField('#shippingAddressCitydefault', city);
    I.fillField('#shippingStatedefault', county);
    I.wait(5);
    I.fillField('#shippingZipCodedefault', zipCode);
    I.wait(5);
    I.fillField('#shippingPhoneNumberdefault', phone);
    I.wait(2);
    I.click('.submit-shipping');
    I.wait(5);
  },

  klarnaPayNow(email, phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#KLARNA_PAYNOW-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'KLARNA_PAYNOW-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'KLARNA_PAYNOW-SSL' })));
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  klarnaPayLater(email, phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#KLARNA_PAYLATER-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'KLARNA_PAYLATER-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'KLARNA_PAYLATER-SSL' })));
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  klarnaSliceIt(email, phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#KLARNA_SLICEIT-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'KLARNA_SLICEIT-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'KLARNA_SLICEIT-SSL' })));
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  //NEWUI NEWUI NEWUI

  paypalRegisteredNUI(email, phone, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="PAYPAL-EXPRESS"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.wait(3);
    I.waitForElement('#PMMakePayment');
    I.wait(2);
    I.click('#PMMakePayment');
    I.wait(2);
    I.waitForElement('.card.confirm-details');
  },

  paypalRegisteredNarrativeNUI(email, phone, country, narrative) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="PAYPAL-EXPRESS"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.waitForElement('.form-control.statementNarrative');
    I.fillField('.form-control.statementNarrative', narrative);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.wait(3);
    I.waitForElement('#PMMakePayment');
    I.wait(2);
    I.click('#PMMakePayment');
    I.wait(2);
    I.waitForElement('.card.confirm-details');
  },

  idealRegisteredNUI(email, phone, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="IDEAL-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.waitForElement({ xpath: '//*[@id="op-Auth"]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="op-Auth"]' });
    I.wait(2);
    I.waitForElement('.card.confirm-details');
  },

  sofortRegisteredNUI(email, phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="SOFORT-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement({ xpath: '//*[@id="jsEnabled"]/a/img' });
    I.wait(2);
    I.click({ xpath: '//*[@id="jsEnabled"]/a/img' });
    I.wait(2);

  },
  wechatpayRegisteredNUI(email, phone) {
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="WECHATPAY-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
  },

  alipayRegisteredNUI(email, phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="ALIPAY-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  achRegisteredNUI(email, phone, country, accounttype, routingnumber, accountnumber, checknumber) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="ACH_DIRECT_DEBIT-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.selectOption('.form-control.accountType.custom-select', accounttype);
    I.fillField('.form-control.routingNumber', routingnumber);
    I.fillField('.form-control.accountnumber', accountnumber);
    I.fillField('.form-control.checkNumber', checknumber);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');

  },

  chinaunionpayRegisteredNUI(email, phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="CHINAUNIONPAY-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    //I.waitForElement({xpath: '/html/body/form/center/input'});
    //I.click({xpath: '/html/body/form/center/input'});
    //I.wait(2);
    I.waitForEnabled('.container', 5);
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled', 5);
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  konbiniRegisteredNUI(email, phone) {
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="KONBINI-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
  },

  mistercashRegisteredNUI(email, phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="MISTERCASH-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  przelewy24RegisteredNUI(email, phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="PRZELEWY-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  poliRegisteredNUI(email, phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="POLI-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },


  sepaRegisteredNUI(email, phone, iban, accountname, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="SEPA_DIRECT_DEBIT-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.waitForEnabled('.form-control.iban');
    I.waitForEnabled('.form-control.accountHolderName');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.fillField('.form-control.iban', iban);
    I.fillField('.form-control.accountHolderName', accountname);
    I.waitForElement({ xpath: '//*[@id="elvConsent"]' });
    I.click({ xpath: '//*[@id="elvConsent"]' });
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');

  },

  wechatpayRegistered(email, phone) {
    I.waitForEnabled('.submit-payment');
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#WECHATPAY-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'WECHATPAY-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'WECHATPAY-SSL' })));
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
  },

  achRegistered(email, phone, country, accounttype, routingnumber, accountnumber, checknumber) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#ACH_DIRECT_DEBIT-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'ACH_DIRECT_DEBIT-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'ACH_DIRECT_DEBIT-SSL' })));
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.selectOption('.form-control.accountType.custom-select', accounttype);
    I.fillField('.form-control.routingNumber', routingnumber);
    I.fillField('.form-control.accountnumber', accountnumber);
    I.fillField('.form-control.checkNumber', checknumber);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');

  },

  konbiniRegistered(email, phone) {
    I.waitForEnabled('.submit-payment');
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#KONBINI-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'KONBINI-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'KONBINI-SSL' })));
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
  },

  sepaRegistered(email, phone, iban, accountname, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#SEPA_DIRECT_DEBIT-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'SEPA_DIRECT_DEBIT-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'SEPA_DIRECT_DEBIT-SSL' })));
    I.waitForEnabled('.form-control.email');
    I.waitForEnabled('.form-control.phone');
    I.waitForEnabled('.form-control.iban');
    I.waitForEnabled('.form-control.accountHolderName');
    I.fillField('.form-control.email', email);
    I.fillField('.form-control.phone', phone);
    I.fillField('.form-control.iban', iban);
    I.fillField('.form-control.accountHolderName', accountname);
    I.waitForElement({ xpath: '//*[@id="elvConsent"]' });
    I.click({ xpath: '//*[@id="elvConsent"]' });
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');

  },

  //SFRA 6.0

  wechatpayRegistered(phone) {
    I.waitForEnabled('.submit-payment');
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#WECHATPAY-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'WECHATPAY-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'WECHATPAY-SSL' })));
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
  },

  achRegistered(phone, country, accounttype, routingnumber, accountnumber, checknumber) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#ACH_DIRECT_DEBIT-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'ACH_DIRECT_DEBIT-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'ACH_DIRECT_DEBIT-SSL' })));
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.selectOption('.form-control.accountType.custom-select', accounttype);
    I.fillField('.form-control.routingNumber', routingnumber);
    I.fillField('.form-control.accountnumber', accountnumber);
    I.fillField('.form-control.checkNumber', checknumber);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');

  },

  konbiniRegistered(phone) {
    I.waitForEnabled('.submit-payment');
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#KONBINI-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'KONBINI-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'KONBINI-SSL' })));
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
  },

  sepaRegistered(phone, iban, accountname, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#SEPA_DIRECT_DEBIT-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'SEPA_DIRECT_DEBIT-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'SEPA_DIRECT_DEBIT-SSL' })));
    I.waitForEnabled('.form-control.phone');
    I.waitForEnabled('.form-control.iban');
    I.waitForEnabled('.form-control.accountHolderName');
    I.fillField('.form-control.phone', phone);
    I.fillField('.form-control.iban', iban);
    I.fillField('.form-control.accountHolderName', accountname);
    I.waitForElement({ xpath: '//*[@id="elvConsent"]' });
    I.click({ xpath: '//*[@id="elvConsent"]' });
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');

  },

  chinaunionpayRegistered(phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#CHINAUNIONPAY-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'CHINAUNIONPAY-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'CHINAUNIONPAY-SSL' })));
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForElement({ xpath: '/html/body/form/center/input' });
    I.click({ xpath: '/html/body/form/center/input' });
    I.wait(3);
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  alipayRegistered(phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#ALIPAY-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'ALIPAY-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'ALIPAY-SSL' })));
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  sofortRegistered(phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.submit-payment');
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#SOFORT-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'SOFORT-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'SOFORT-SSL' })));
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement({ xpath: '//*[@id="jsEnabled"]/a/img' });
    I.wait(2);
    I.click({ xpath: '//*[@id="jsEnabled"]/a/img' });
    I.wait(2);

  },

  mistercashRegistered(phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#MISTERCASH-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'MISTERCASH-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'MISTERCASH-SSL' })));
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  klarnaPayLater(phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#KLARNA_PAYLATER-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'KLARNA_PAYLATER-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'KLARNA_PAYLATER-SSL' })));
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  przelewy24Registered(phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#PRZELEWY-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'PRZELEWY-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'PRZELEWY-SSL' })));
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  poliRegistered(phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#POLI-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'POLI-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'POLI-SSL' })));
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  klarnaPayNow(phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#KLARNA_PAYNOW-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'KLARNA_PAYNOW-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'KLARNA_PAYNOW-SSL' })));
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  idealRegistered(phone, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.submit-payment');
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#IDEAL-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'IDEAL-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'IDEAL-SSL' })));
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.waitForElement({ xpath: '//*[@id="op-Auth"]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="op-Auth"]' });
    I.wait(5);
    I.waitForElement('.card.confirm-details');
  },

  paypalRegistered(phone, country, response) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.submit-payment');
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#PAYPAL-EXPRESS');
    I.waitForElement(locate('a').withAttr({ alt: 'Pay Pal' }).inside(locate('li').withAttr({ id: 'PAYPAL-EXPRESS' })));
    I.wait(5);
    I.click(locate('a').withAttr({ alt: 'Pay Pal' }).inside(locate('li').withAttr({ id: 'PAYPAL-EXPRESS' })));
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.waitForElement('#simulatedAuth');
    I.selectOption('#simulatedAuth', response);
    I.wait(1);
    I.click('#PMMakePayment');
    I.wait(3);
    //I.waitForElement('.card.confirm-details');
  },

  klarnaSliceIt(phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#KLARNA_SLICEIT-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'KLARNA_SLICEIT-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'KLARNA_SLICEIT-SSL' })));
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  idealRegisteredCancel(phone, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.submit-payment');
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#IDEAL-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'IDEAL-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'IDEAL-SSL' })));
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.waitForElement({ xpath: '//*[@id="op-Cancel"]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="op-Cancel"]' });
    I.wait(5);
    //I.waitForElement('.card.confirm-details');
  },

  idealRegisteredRefuse(phone, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.submit-payment');
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#IDEAL-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'IDEAL-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'IDEAL-SSL' })));
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.waitForElement({ xpath: '//*[@id="op-Reject"]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="op-Reject"]' });
    I.wait(5);
    //I.waitForElement('.card.confirm-details');
  },

  //NEWUI

  wechatpayRegisteredNUI(phone) {
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="WECHATPAY-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
  },

  achRegisteredNUI(phone, country, accounttype, routingnumber, accountnumber, checknumber) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="ACH_DIRECT_DEBIT-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.selectOption('.form-control.accountType.custom-select', accounttype);
    I.fillField('.form-control.routingNumber', routingnumber);
    I.fillField('.form-control.accountnumber', accountnumber);
    I.fillField('.form-control.checkNumber', checknumber);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');

  },

  konbiniRegisteredNUI(phone) {
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="KONBINI-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
  },

  chinaunionpayRegisteredNUI(phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="CHINAUNIONPAY-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    //I.waitForElement({xpath: '/html/body/form/center/input'});
    //I.click({xpath: '/html/body/form/center/input'});
    //I.wait(2);
    I.waitForEnabled('.container', 5);
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled', 5);
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  alipayRegisteredNUI(phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="ALIPAY-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  sofortRegisteredNUI(phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="SOFORT-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement({ xpath: '//*[@id="jsEnabled"]/a/img' });
    I.wait(2);
    I.click({ xpath: '//*[@id="jsEnabled"]/a/img' });
    I.wait(2);

  },

  mistercashRegisteredNUI(phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="MISTERCASH-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  przelewy24RegisteredNUI(phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="PRZELEWY-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  poliRegisteredNUI(phone, status, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="POLI-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.waitForEnabled('.submit-payment');
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.waitForEnabled('.container');
    I.selectOption('status', status);
    I.waitForElement('#jsEnabled');
    I.wait(2);
    I.click('#jsEnabled');
    I.wait(2);

  },

  idealRegisteredNUI(phone, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="IDEAL-SSL"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.waitForElement({ xpath: '//*[@id="op-Auth"]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="op-Auth"]' });
    I.wait(2);
    I.waitForElement('.card.confirm-details');
  },

  paypalRegisteredNUI(phone, country) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="PAYPAL-EXPRESS"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.wait(3);
    I.waitForElement('#PMMakePayment');
    I.wait(2);
    I.click('#PMMakePayment');
    I.wait(2);
    I.waitForElement('.card.confirm-details');
  },

  //Features DUI

  idealRegisteredNarrative(phone, country, narrative) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.submit-payment');
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#IDEAL-SSL');
    I.waitForElement(locate('a').inside(locate('li').withAttr({ id: 'IDEAL-SSL' })));
    I.wait(5);
    I.click(locate('a').inside(locate('li').withAttr({ id: 'IDEAL-SSL' })));
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.waitForElement('.form-control.statementNarrative');
    I.fillField('.form-control.statementNarrative', narrative);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.waitForElement({ xpath: '//*[@id="op-Auth"]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="op-Auth"]' });
    I.wait(2);
    I.waitForElement('.card.confirm-details');
  },

  paypalRegisteredNarrative(phone, country, narrative) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.waitForEnabled('.submit-payment');
    I.waitForEnabled('.payment-form');
    I.waitForEnabled('#PAYPAL-EXPRESS');
    I.waitForElement(locate('a').withAttr({ alt: 'Pay Pal' }).inside(locate('li').withAttr({ id: 'PAYPAL-EXPRESS' })));
    I.wait(5);
    I.click(locate('a').withAttr({ alt: 'Pay Pal' }).inside(locate('li').withAttr({ id: 'PAYPAL-EXPRESS' })));
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.waitForElement('.form-control.statementNarrative');
    I.fillField('.form-control.statementNarrative', narrative);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.wait(3);
    I.waitForElement('#PMMakePayment');
    I.wait(2);
    I.click('#PMMakePayment');
    I.wait(2);
    I.waitForElement('.card.confirm-details');
  },

  paypalRegisteredNarrativeNUI(phone, country, narrative) {
    I.waitForElement({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.click({ xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]' });
    I.wait(2);
    I.selectOption('#billingCountry', country);
    I.wait(1);
    I.click('Alternative Payment');
    I.wait(1);
    I.click({ xpath: '//*[@id="PAYPAL-EXPRESS"]/div/label' });
    I.wait(1);
    I.waitForEnabled('.form-control.phone');
    I.fillField('.form-control.phone', phone);
    I.waitForElement('.form-control.statementNarrative');
    I.fillField('.form-control.statementNarrative', narrative);
    I.click('.submit-payment');
    I.wait(2);
    I.waitForEnabled('.btn.btn-primary.btn-block.place-order');
    I.wait(2);
    I.click('.btn.btn-primary.btn-block.place-order');
    I.wait(3);
    I.waitForElement('#PMMakePayment');
    I.wait(2);
    I.click('#PMMakePayment');
    I.wait(2);
    I.waitForElement('.card.confirm-details');
  },


};