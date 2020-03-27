const { I, homePage, worldpayPaymentTestRegistered, uriUtils } = inject();
let product;
When('Apm shopper selects yes or no for tracking consent', () => {
    I.amOnPage(uriUtils.uri.homePage);
    homePage.accept();
});

When('User selects googlepay as payment method', async() => {
  worldpayPaymentTestRegistered.googlePay();
});

When('User fills Email and Phone number for googlepay', (table) =>
  {
    for (const id in table.rows) {
      console.log(table.rows);
      if (id < 1) {
        continue; // skip a header of a table
      }
  
      // go by row cells
      const cells = table.rows[id].cells;
  
      // take values
      const Email  = cells[0].value;
      const Phonenumber = cells[1].value;

      worldpayPaymentTestRegistered.emailAndPhoneGooglePay(Email,Phonenumber);
    }});
  When('User clicks on Buy with GPay', () =>
    {
      worldpayPaymentTestRegistered.clickOnBuyWithGpay();
    });


    
When ('User enters respective google emailid', async(table) =>
{
  for (const id in table.rows) {
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const gId = cells[0].value;
    const gPwd = cells[1].value;
    console.log(gId,gPwd)

    
  const windows = await I.grabAllWindowHandles();
  I.say('windows : '+windows);
  await I.switchToWindow(windows[1]);
  worldpayPaymentTestRegistered.gmailId(gId,gPwd) ;
  I.say('windows : '+windows);
  await I.switchToWindow(windows[0]);
  
  
  }
});


Given('Apm Shopper searches for {string}', (inputProduct) => {
    product = inputProduct;
    homePage.search(product);
});

When('Apm selects size {string}', (size) => {
    worldpayPaymentTestRegistered.selectSize(size);
});

When('Apm he adds the product to cart', async () => {
    worldpayPaymentTestRegistered.addToCart();
    worldpayPaymentTestRegistered.viewCart();
    worldpayPaymentTestRegistered.clickCheckout();
   
});
When('Apm Shopper fills email and password', (table) => {
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
        worldpayPaymentTestRegistered.loginAsRegisteredUser(email, password);
       
        // ...
      }});


      When('Apm Shopper fills email and phone number and country for paypal', (table) => {   
        for (const id in table.rows) {
            console.log(table.rows);
            if (id < 1) {
              continue; // skip a header of a table
            }
        
            // go by row cells
            const cells = table.rows[id].cells;
        
            // take values
            const email = cells[0].value;
            const phone = cells[1].value;
            const country = cells[2].value;
        worldpayPaymentTestRegistered.paypalRegistered(email,phone,country);
    }});
    When('Apm selects color', async () => {
        worldpayPaymentTestRegistered.selectColor();
      });

    When('Apm Shopper fills shipping Address', (table) => {   
        for (const id in table.rows) {
            console.log(table.rows);
            if (id < 1) {
              continue; // skip a header of a table
            }
        
            // go by row cells
            const cells = table.rows[id].cells;
        
            // take values
            const firstName = cells[0].value;
            const lastName = cells[1].value;
            const addressOne = cells[2].value;
            const addressTwo = cells[3].value;
            const country = cells[4].value;
            const state = cells[5].value;
            const city = cells[6].value;
            const zipCode = cells[7].value;
            const phone = cells[8].value;
        worldpayPaymentTestRegistered.fillShipping(firstName,lastName,addressOne,addressTwo,country,state,city,zipCode,phone);
    }});

When('Apm Shopper fills email and phone number and status for alipay', (table) => {   
    for (const id in table.rows) {
        console.log(table.rows);
        if (id < 1) {
          continue; // skip a header of a table
        }
    
        // go by row cells
        const cells = table.rows[id].cells;
    
        // take values
        const email = cells[0].value;
        const phone = cells[1].value;
        const status = cells[2].value;
        const country = cells[3].value;
    worldpayPaymentTestRegistered.alipayRegistered(email,phone,status,country);

}});
When('Apm Print the Order Number',async () =>
{
  let pin = await I.grabTextFrom('.summary-details.order-number');
  console.log(pin);
  
});

When('Apm Shopper fills email and phone number and country for Ideal', (table) => {   
    for (const id in table.rows) {
        console.log(table.rows);
        if (id < 1) {
          continue; // skip a header of a table
        }
    
        // go by row cells
        const cells = table.rows[id].cells;
    
        // take values
        const email = cells[0].value;
        const phone = cells[1].value;
        const country = cells[2].value;
    worldpayPaymentTestRegistered.idealRegistered(email,phone,country);
}});

When('Apm Shopper fills email and phone number and country for sofort', (table) => {   
    for (const id in table.rows) {
        console.log(table.rows);
        if (id < 1) {
          continue; // skip a header of a table
        }
    
        // go by row cells
        const cells = table.rows[id].cells;
    
        // take values
        const email = cells[0].value;
        const phone = cells[1].value;
        const country = cells[2].value;
    worldpayPaymentTestRegistered.sofortRegistered(email,phone,country);
}});




When('Apm Shopper fills email and phone number for wechatpay', (table) => {   
    for (const id in table.rows) {
        console.log(table.rows);
        if (id < 1) {
          continue; // skip a header of a table
        }
    
        // go by row cells
        const cells = table.rows[id].cells;
    
        // take values
        const email = cells[0].value;
        const phone = cells[1].value;
    worldpayPaymentTestRegistered.wechatpayRegistered(email,phone);
}});


