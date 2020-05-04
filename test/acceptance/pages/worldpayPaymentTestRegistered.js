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
        checkoutBtn: '.checkout-btn',
        loginbtn:'.mylogin',
        productDescription: '.description-and-detail .description .content',
        productDetails: '.description-and-detail .details .content',
        copyLinkMsgVisible: '.copy-link-message:not(.d-none)',
        miniCartQuantity: '.minicart-quantity',
        addToCartSuccess: '.add-to-cart-messages .alert-success',
        addToCartFailure: '.add-to-cart-messages .alert-danger'
    },
    selectSize(size) {
        I.waitForElement(this.locators.selectSize);
        I.selectOption(this.locators.selectSize, size);
        I.wiat(2);
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
        I.waitForElement(this.locators.cartHeader);
        
    },
    
    clickCheckout(){
        I.waitForElement(this.locators.checkoutBtn);
        I.click(this.locators.checkoutBtn);
       
    },
    selectColor(){
      I.waitForElement(this.locators.selectColor);
      I.click(this.locators.selectColor);
      I.wait(2);
    },

    loginAsRegisteredUser(email, password){
    I.waitForElement('#login-form-email');
    I.waitForElement('#login-form-password');
    I.fillField('#login-form-email', email);
    I.fillField('#login-form-password', password);
    I.waitForEnabled({xpath:'//*[@id="maincontent"]/div/div[2]/div/div[2]/div[2]/form[1]/button'});
    I.click({xpath:'//*[@id="maincontent"]/div/div[2]/div/div[2]/div[2]/form[1]/button'});
   I.wait(2);
    
  },
  paypalRegistered(email, phone, country)  {
    I.waitForElement({xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]'});
    I.wait(2);
    I.click({xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]'});
      I.wait(2);
      I.selectOption('#billingCountry',country);
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
    I.waitForElement('#PMMakePayment');
    I.wait(2);
    I.click('#PMMakePayment');
    I.wait(2);
    I.waitForElement('.card.confirm-details');
},

idealRegistered(email, phone, country)  {
  I.waitForElement({xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]'});
  I.wait(2);
  I.click({xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]'});
    I.wait(2);
    I.selectOption('#billingCountry',country);
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
  I.waitForElement({xpath: '//*[@id="op-Auth"]'});
  I.wait(2);
  I.click({xpath: '//*[@id="op-Auth"]'});
  I.wait(2);
  I.waitForElement('.card.confirm-details');
},


fillShipping(firstName,lastName,addressOne,addressTwo,country,state,city,zipCode,phone){
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
    I.fillField('#shippingFirstNamedefault',firstName);
    I.fillField('#shippingLastNamedefault',lastName);
    I.fillField('#shippingAddressOnedefault',addressOne);
    I.fillField('#shippingAddressTwodefault',addressTwo);
    I.selectOption('#shippingCountrydefault',country);
    I.selectOption('#shippingStatedefault',state);
    I.fillField('#shippingAddressCitydefault',city);
    I.wait(5);
    I.fillField('#shippingZipCodedefault',zipCode);
    I.wait(5);
    I.fillField('#shippingPhoneNumberdefault',phone);
    I.wait(2);
    I.click('.submit-shipping');
    I.wait(5);
  },

  sofortRegistered(email, phone, country)  {
    I.waitForElement({xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]'});
    I.wait(2);
    I.click({xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]'});
      I.wait(2);
      I.selectOption('#billingCountry',country);
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
      I.waitForElement({xpath: '//*[@id="jsEnabled"]/a/img'});
  I.wait(2);
  I.click({xpath: '//*[@id="jsEnabled"]/a/img'});
  I.wait(2);
 
  },
  wechatpayRegistered(email, phone)  {
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

alipayRegistered(email, phone, status,country)  {
    I.waitForElement({xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]'});
    I.click({xpath: '//*[@id="dwfrm_billing"]/fieldset/fieldset[1]/div/div[2]/a[1]'});
    I.wait(2);
    I.selectOption('#billingCountry',country);
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
      I.waitForEnabled('.container .containercell');
      I.selectOption('status', status);
      I.waitForElement('#jsEnabled');
      I.wait(2);
      I.click('#jsEnabled');
      I.wait(2);
     
  }
};



