const {I, worldpayPaymentTestRegisteredcredit, homePage, uriUtils}=inject();
let product;
When('shopper selects yes or no for tracking consent', () => {
  I.amOnPage(uriUtils.uri.homePage);
  homePage.accept();
});
When('Shopper click on login button displaying on left header side',async () => 
{
  worldpayPaymentTestRegisteredcredit.clickonLoginButton();
});

When('Shopper fills the correct login details and click on Login Button', (table) =>{
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
        worldpayPaymentTestRegisteredcredit.loginByLoginButtonHomePage(email,password);
       
      }});

When ('Shopper searches for {string}',(inputProduct) =>
 {
  product = inputProduct;
  worldpayPaymentTestRegisteredcredit.Search(product);
 
});

When('Selects size {string}', (size) => {
  worldpayPaymentTestRegisteredcredit.selectSizeSmall(size);
});


When('User add the product to cart and click to Checkout', async () => {
  worldpayPaymentTestRegisteredcredit.addToCart();
  worldpayPaymentTestRegisteredcredit.viewCart();
  worldpayPaymentTestRegisteredcredit.clickCheckout();
});


When('User clicks on checkout as guest', async () => {
  worldpayPaymentTestRegisteredcredit.clickCheckoutAsGuest();
});

When('Select Country {string}', (country) =>
{
  worldpayPaymentTestRegisteredcredit.selectCountry(country);
});

When('Select State {string}',(state) =>
{
  worldpayPaymentTestRegisteredcredit.selectState(state);
});

When('Fill the Shipping address',(table) =>
{
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const firstName  = cells[0].value;
    const lastName = cells[1].value;
    const streetAddress1 = cells[2].value;
    const streetAddress2 = cells[3].value;
    const city = cells[4].value;
    const postalCode = cells[5].value;
    const phoneNumber  = cells[6].value;
    
    worldpayPaymentTestRegisteredcredit.filladdress(firstName,lastName,streetAddress1,streetAddress2,city,postalCode,phoneNumber);
   
  }});

  When('User fills email and phone number and click on Add Payment Button',table =>
  {
    for (const id in table.rows) {
      console.log(table.rows);
      if (id < 1) {
        continue; // skip a header of a table
      }
  
      // go by row cells
      const cells = table.rows[id].cells;
  
      // take values
      const emailID  = cells[0].value;
      const PhoneNo = cells[1].value;

      worldpayPaymentTestRegisteredcredit.fillEmailIDandPhoneNoReDirect(emailID,PhoneNo);
    }});

    When ('User add a new Master card details',table =>
    {
    for (const id in table.rows) {
      console.log(table.rows);
      if (id < 1) {
        continue; // skip a header of a table
      }
  
      // go by row cells
      const cells = table.rows[id].cells;
  
      // take values
      const email  = cells[0].value;
      const PhonenNo = cells[1].value;
      const cardHolderName = cells[2].value;
      const cardNumber =cells[3].value;
      const expMonth = cells[4].value;
      const expYear=cells[5].value;
      const securityCode =cells[6].value;
      worldpayPaymentTestRegisteredcredit.fillCardDetails(email,PhonenNo,cardHolderName,cardNumber,expMonth,expYear,securityCode);
      I.wait(5);
    }});

    When ('Guest User add a new Master card details',table =>
    {
    for (const id in table.rows) {
      console.log(table.rows);
      if (id < 1) {
        continue; // skip a header of a table
      }
  
      // go by row cells
      const cells = table.rows[id].cells;
  
      // take values
      const email  = cells[0].value;
      const PhonenNo = cells[1].value;
      const cardHolderName = cells[2].value;
      const cardNumber =cells[3].value;
      const expMonth = cells[4].value;
      const expYear=cells[5].value;
      const securityCode =cells[6].value;
      worldpayPaymentTestRegisteredcredit.fillCardDetailsGuest(email,PhonenNo,cardHolderName,cardNumber,expMonth,expYear,securityCode);
      I.wait(5);
    }});

  When ('Verify that added card should be Master Card' ,()  =>
  {
    I.seeElement({xpath :"//div[@data-type='mastercard']"});
  });

  When ('User Click on Next Place Order Button' ,() =>
  {
    worldpayPaymentTestRegisteredcredit.ClickOnNextPlaceOrderButton();
  });
  When ('Click on Place Order and print Order Number' ,async () => 
    {
      worldpayPaymentTestRegisteredcredit.clickOnPlaceOrder();
      I.wait(10);
    });

When('User Click on Place Order' ,async() =>
    {
      worldpayPaymentTestRegisteredcredit.PlaceOrder()
    });

When ('User Click on Ok Button in 3DS Challenge Window' ,() =>
  {
    worldpayPaymentTestRegisteredcredit.clickOnSubmitButton();
  });
  
    When ('Click on Place Order for error scenerios' ,async () => 
    {
      worldpayPaymentTestRegisteredcredit.clickOnPlaceOrdererror();
      let pin = await I.grabTextFrom({xpath :'//*[@id="checkout-main"]/div[3]/div[1]/div[1]/p'});
		    console.log(pin);

      I.wait(10);
    });
    //////////////////////////////////VISA card////////////
    When ('User add a new Visa card details',table =>
    {
    for (const id in table.rows) {
      console.log(table.rows);
      if (id < 1) {
        continue; // skip a header of a table
      }
  
      // go by row cells
      const cells = table.rows[id].cells;
  
      // take values
      const email  = cells[0].value;
      const PhonenNo = cells[1].value;
      const cardHolderName = cells[2].value;
      const cardNumber =cells[3].value;
      const expMonth = cells[4].value;
      const expYear=cells[5].value;
      const securityCode =cells[6].value;
      worldpayPaymentTestRegisteredcredit.fillCardDetails(email,PhonenNo,cardHolderName,cardNumber,expMonth,expYear,securityCode);
      I.wait(5);
    }});

    When ('Guest User add a new Visa card details',table =>
    {
    for (const id in table.rows) {
      console.log(table.rows);
      if (id < 1) {
        continue; // skip a header of a table
      }
  
      // go by row cells
      const cells = table.rows[id].cells;
  
      // take values
      const email  = cells[0].value;
      const PhonenNo = cells[1].value;
      const cardHolderName = cells[2].value;
      const cardNumber =cells[3].value;
      const expMonth = cells[4].value;
      const expYear=cells[5].value;
      const securityCode =cells[6].value;
      worldpayPaymentTestRegisteredcredit.fillCardDetailsGuest(email,PhonenNo,cardHolderName,cardNumber,expMonth,expYear,securityCode);
      I.wait(5);
    }});
  When ('Verify that added card should be Visa Card' ,()  =>
  {
      I.seeElement({xpath :"//div[@data-type='visa']"});
  });  

//////////////////////////////////Amex card////////////
When ('User add a new Amex card details',table =>
{
for (const id in table.rows) {
  console.log(table.rows);
  if (id < 1) {
    continue; // skip a header of a table
  }

  // go by row cells
  const cells = table.rows[id].cells;

  // take values
  const email  = cells[0].value;
  const PhonenNo = cells[1].value;
  const cardHolderName = cells[2].value;
  const cardNumber =cells[3].value;
  const expMonth = cells[4].value;
  const expYear=cells[5].value;
  const securityCode =cells[6].value;
  worldpayPaymentTestRegisteredcredit.fillCardDetails(email,PhonenNo,cardHolderName,cardNumber,expMonth,expYear,securityCode);
  I.wait(5);
}});

When ('Guest User add a new Amex card details',table =>
{
for (const id in table.rows) {
  console.log(table.rows);
  if (id < 1) {
    continue; // skip a header of a table
  }

  // go by row cells
  const cells = table.rows[id].cells;

  // take values
  const email  = cells[0].value;
  const PhonenNo = cells[1].value;
  const cardHolderName = cells[2].value;
  const cardNumber =cells[3].value;
  const expMonth = cells[4].value;
  const expYear=cells[5].value;
  const securityCode =cells[6].value;
  worldpayPaymentTestRegisteredcredit.fillCardDetailsGuest(email,PhonenNo,cardHolderName,cardNumber,expMonth,expYear,securityCode);
  I.wait(5);
}});

When ('Verify that added card should be Amex Card' ,()  =>
{
    I.seeElement({xpath :"//div[@data-type='amex']"});
});  

//////////////////////////////////3D Master card////////////
When ('User should place an order with 3D MASTER CARD',table =>
{
for (const id in table.rows) {
  console.log(table.rows);
  if (id < 1) {
    continue; // skip a header of a table
  }

  // go by row cells
  const cells = table.rows[id].cells;

  // take values
  const email  = cells[0].value;
  const PhonenNo = cells[1].value;
  const cardHolderName = cells[2].value;
  const cardNumber =cells[3].value;
  const expMonth = cells[4].value;
  const expYear=cells[5].value;
  const securityCode =cells[6].value;
  worldpayPaymentTestRegisteredcredit.fillCardDetails(email,PhonenNo,cardHolderName,cardNumber,expMonth,expYear,securityCode);
  I.wait(5);
}});
When('Click on submit button on 3DS page',async () =>
{
  worldpayPaymentTestRegisteredcredit.clickOnSubmitButton();
});

///////////Refused Sttaus/////////////
When ('User add a new Amex card details with Refused Status',table =>
{
for (const id in table.rows) {
  console.log(table.rows);
  if (id < 1) {
    continue; // skip a header of a table
  }

  // go by row cells
  const cells = table.rows[id].cells;

  // take values
  const email  = cells[0].value;
  const PhonenNo = cells[1].value;
  const cardHolderName = cells[2].value;
  const cardNumber =cells[3].value;
  const expMonth = cells[4].value;
  const expYear=cells[5].value;
  const securityCode =cells[6].value;
  worldpayPaymentTestRegisteredcredit.fillCardDetails(email,PhonenNo,cardHolderName,cardNumber,expMonth,expYear,securityCode);
  I.wait(5);
}});

////////////////Cancelled Status//////
When ('User add a new Amex card details with Cancelled Status',table =>
{
for (const id in table.rows) {
  console.log(table.rows);
  if (id < 1) {
    continue; // skip a header of a table
  }

  // go by row cells
  const cells = table.rows[id].cells;

  // take values
  const email  = cells[0].value;
  const PhonenNo = cells[1].value;
  const cardHolderName = cells[2].value;
  const cardNumber =cells[3].value;
  const expMonth = cells[4].value;
  const expYear=cells[5].value;
  const securityCode =cells[6].value;
  worldpayPaymentTestRegisteredcredit.fillCardDetails(email,PhonenNo,cardHolderName,cardNumber,expMonth,expYear,securityCode);
  I.wait(5);
}});
////////////////Redirect Order///////////////////
When('Select Redierct Mode on payment Page',async () =>
{
  worldpayPaymentTestRegisteredcredit.SelectRedirectMode();
});

When('Select Amex card form Prefeered card option {string}',(Card) =>
{
  worldpayPaymentTestRegisteredcredit.selectCardRedirectMode(Card);
});

When ('User add a new Amex card details on Redirected WorldPay Page',table =>
{
for (const id in table.rows) {
  console.log(table.rows);
  if (id < 1) {
    continue; // skip a header of a table
  }

  // go by row cells
  const cells = table.rows[id].cells;

  // take values
  const cardNumber1  = cells[0].value;
  const expMonth1 = cells[1].value;
  const expYear1 = cells[2].value;
  const securityCode1 = cells[3].value;
  worldpayPaymentTestRegisteredcredit.fillCardDetailsRedirectAmex(cardNumber1,expMonth1,expYear1,securityCode1);
  I.wait(5);
}});

When('User click on Make Payment Button', () =>
{
  I.waitForElement('#submitButton');
  I.click('#submitButton');
  I.wait(5);
});


///////////////////Verification//////////////////
When('Verify that User logged in successfully',async () =>
{
  I.see('Dashboard','.page-title');
  I.seeElement('.user.hidden-md-down');
});

When('Verify that Shirt Displayed in URL',async () =>
{
  I.seeInCurrentUrl('/the-white-dress-shirt/78916783.html?lang=en_US');
});

When('Verify that Selected size is 15L',async () =>
{
  I.wait(5);
  I.seeTextEquals('15L','.custom-select.form-control.select-size');
});

// When('Verify all sizes',async () =>
// {
//   I.click('.custom-select.form-control.select-size');
//   I.seeTextEquals('.custom-select.form-control.select-size',['Select size,15L','15R','16L','16R',]);
 
// });

When('Verify that user has navigated to Shipping Page',async () =>
{
  I.seeInCurrentUrl('/en_US/Checkout-Begin?stage=shipping#shipping');
});

When('Print the Order Number',async () =>
{
  let pin = await I.grabTextFrom('.summary-details.order-number');
  console.log(pin);
});