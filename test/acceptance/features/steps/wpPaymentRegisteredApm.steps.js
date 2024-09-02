const { I, homePage, worldpayPaymentTestRegistered, uriUtils } = inject();
let product;
When('Apm shopper selects yes or no for tracking consent', () => {
  I.amOnPage(uriUtils.uri.homePage);
  homePage.accept();
});

When('User selects googlepay as payment method', async () => {
  worldpayPaymentTestRegistered.googlePay();
});

When('User fills Email and Phone number for googlepay', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const Email = cells[0].value;
    const Phonenumber = cells[1].value;

    worldpayPaymentTestRegistered.emailAndPhoneGooglePay(Email, Phonenumber);
  }
});
When('User clicks on Buy with GPay', () => {
  worldpayPaymentTestRegistered.clickOnBuyWithGpay();
});



When('User enters respective google emailid', async (table) => {
  for (const id in table.rows) {
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const gId = cells[0].value;
    const gPwd = cells[1].value;
    console.log(gId, gPwd)


    const windows = await I.grabAllWindowHandles();
    I.say('windows : ' + windows);
    await I.switchToWindow(windows[1]);
    worldpayPaymentTestRegistered.gmailId(gId, gPwd);
    I.say('windows : ' + windows);
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
  }
});


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
    const response = cells[3].value;
    worldpayPaymentTestRegistered.paypalRegistered(email, phone, country, response);
  }
});

When('Apm Shopper fills email, phone number, country & narratrive for paypal', (table) => {
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
    const narrative = cells[3].value;
    worldpayPaymentTestRegistered.paypalRegisteredNarrative(email, phone, country, narrative);
  }
});

When('Apm Shopper fills on new ui email, phone number, country & narratrive for paypal', (table) => {
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
    const narrative = cells[3].value;
    worldpayPaymentTestRegistered.paypalRegisteredNarrativeNUI(email, phone, country, narrative);
  }
});

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
    worldpayPaymentTestRegistered.fillShipping(firstName, lastName, addressOne, addressTwo, country, state, city, zipCode, phone);
  }
});

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
    worldpayPaymentTestRegistered.alipayRegistered(email, phone, status, country);
  }
});

When('Apm Shopper fills email, phone number, achpay details and status for achpay', (table) => {
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
    const accounttype = cells[3].value;
    const routingnumber = cells[4].value;
    const accountnumber = cells[5].value;
    const checknumber = cells[6].value;
    worldpayPaymentTestRegistered.achRegistered(email, phone, country, accounttype, routingnumber, accountnumber, checknumber);

  }
});

When('Apm Print the Order Number', async (table) => {
  const scenario = table.rows[0].cells[0].value;
  let pin = await I.grabTextFrom('.summary-details.order-number');
  console.log(pin);
  let pd = await I.grabTextFrom('.payment-details');
  pd = pd.replace(/\n/g, ' ');
  console.log(pin);
  I.writeToFile('result.log', '\n' + scenario + ': ' + pd + ': ' + pin + '\n');
  //I.writeToFile('result.log', '\n' + pd + ': ' + pin);
});

Then('validate error message', () => {
  I.see('INVALID SECURITY CODE. PLEASE TRY AGAIN.', '.error-message-text');
});


When('Apm verify for error scenerios', async (table) => {
  const scenario = table.rows[0].cells[0].value;
  let pin = await I.grabTextFrom({ xpath: '//*[@id="checkout-main"]/div[3]/div[1]/div[1]/p' });
  /*newui //*[@id="checkout-main"]/div[4]/div[1]/div[1]/p*/
  console.log(pin);
  let pd = await I.grabTextFrom('.payment-details');
  pd = pd.replace(/\n/g, ' ');
  console.log(pd);
  I.writeToFile('result.log', '\n' + scenario + ': ' + pd + ': ' + pin + '\n');
  //I.writeToFile('result.log', '\n' + pd + ': ' + pin);
});

When('Apm verify for NUI error scenerios', async (table) => {
  const scenario = table.rows[0].cells[0].value;
  let pin = await I.grabTextFrom({ xpath: '//*[@id="checkout-main"]/div[4]/div[1]/div[1]/p' });
  console.log(pin);
  let pd = await I.grabTextFrom('.payment-details');
  pd = pd.replace(/\n/g, ' ');
  console.log(pd);
  I.writeToFile('result.log', '\n' + scenario + ': ' + pd + ': ' + pin + '\n');
  //I.writeToFile('result.log', '\n' + pd + ': ' + pin);
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
    worldpayPaymentTestRegistered.idealRegistered(email, phone, country);
  }
});

When('Apm Shopper fills email and phone number and country for Ideal Cancel Scenario', (table) => {
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
    worldpayPaymentTestRegistered.idealRegisteredCancel(email, phone, country);
  }
});

When('Apm Shopper fills email and phone number and country for Ideal Refuse Scenario', (table) => {
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
    worldpayPaymentTestRegistered.idealRegisteredRefuse(email, phone, country);
  }
});

When('Apm Shopper fills email, phone number, country & narratrive for Ideal', (table) => {
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
    const narrative = cells[3].value;
    worldpayPaymentTestRegistered.idealRegisteredNarrative(email, phone, country, narrative);
  }
});


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
    const status = cells[2].value;
    const country = cells[3].value;
    worldpayPaymentTestRegistered.sofortRegistered(email, phone, status, country);
  }
});




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
    worldpayPaymentTestRegistered.wechatpayRegistered(email, phone);
  }
});



When('Apm Shopper fills email and phone number and status for chinaunionpay', (table) => {
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
    worldpayPaymentTestRegistered.chinaunionpayRegistered(email, phone, status, country);
  }
});

When('Apm Shopper fills email and phone number for konbini', (table) => {
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
    worldpayPaymentTestRegistered.konbiniRegistered(email, phone);
  }
});

When('Apm Shopper fills email and phone number and status for mistercash', (table) => {
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
    worldpayPaymentTestRegistered.mistercashRegistered(email, phone, status, country);
  }
});

When('Apm Shopper fills email and phone number and status for przelewy24', (table) => {
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
    worldpayPaymentTestRegistered.przelewy24Registered(email, phone, status, country);
  }
});

When('Apm Shopper fills email and phone number and status for poli', (table) => {
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
    worldpayPaymentTestRegistered.poliRegistered(email, phone, status, country);
  }
});


When('Apm Shopper fills email and phone number and status for sepa', (table) => {
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
    const iban = cells[2].value;
    const accountname = cells[3].value;
    const country = cells[4].value;
    worldpayPaymentTestRegistered.sepaRegistered(email, phone, iban, accountname, country);
  }
});

When('Apm shopper selects yes or no for uk tracking consent', () => {
  I.amOnPage(uriUtils.uri.ukHomePage);
  homePage.accept();
});

When('Apm Shopper fills uk shipping Address', (table) => {
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
    const county = cells[5].value;
    const city = cells[6].value;
    const zipCode = cells[7].value;
    const phone = cells[8].value;
    worldpayPaymentTestRegistered.fillUkShipping(firstName, lastName, addressOne, addressTwo, country, county, city, zipCode, phone);
  }
});

When('Apm Shopper fills email and phone number and status for klarna Pay Now', (table) => {
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
    worldpayPaymentTestRegistered.klarnaPayNow(email, phone, status, country);
  }
});

When('Apm Shopper fills email and phone number and status for klarna Pay Later', (table) => {
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
    worldpayPaymentTestRegistered.klarnaPayLater(email, phone, status, country);
  }
});

When('Apm Shopper fills email and phone number and status for klarna Slice It', (table) => {
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
    worldpayPaymentTestRegistered.klarnaSliceIt(email, phone, status, country);
  }
});

/*When('Apm Shopper selects APM payment method', () => {
  //I.click({xpath: '//label[contains(text(),'Alternative Payment')]'});
  I.click({xpath: '//label[@for='payment-method-alternativepayment']'});
  [contains(., 'payment-method-alternativepayment')]
  I.wait(1);	
  //I.waitForElement({xpath: '//label[contains(text(),'ACH Pay')]'});
  //I.click({xpath: '//label[contains(text(),'ACH Pay')]'});
  I.click({xpath: '//label[@for='Wechatpay']'});
  I.wait(1);
});*/



/*When('Apm Shopper selects NEWUI APM payment method', () => {
  I.waitForElement('Alternative Payment');
  I.click('Alternative Payment');
  I.wait(1);
  I.waitForElement('Wechatpay');
  I.click('Wechatpay');
  I.wait(1);


  I.waitForElement('Alternative Payment');
  I.click('Alternative Payment');
  I.wait(1);
  I.waitForElement('');
  I.click('');
  I.wait(1);
});*/

//NEWUI NEWUI newui

When('Apm Shopper fills new ui email and phone number and country for paypal', (table) => {
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
    worldpayPaymentTestRegistered.paypalRegisteredNUI(email, phone, country);
  }
});

When('Apm Shopper fills new ui email and phone number and status for alipay', (table) => {
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
    worldpayPaymentTestRegistered.alipayRegisteredNUI(email, phone, status, country);
  }
});

When('Apm Shopper fills new ui email, phone number, achpay details and status for achpay', (table) => {
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
    const accounttype = cells[3].value;
    const routingnumber = cells[4].value;
    const accountnumber = cells[5].value;
    const checknumber = cells[6].value;
    worldpayPaymentTestRegistered.achRegisteredNUI(email, phone, country, accounttype, routingnumber, accountnumber, checknumber);

  }
});

When('Apm Shopper fills new ui email and phone number and country for Ideal', (table) => {
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
    worldpayPaymentTestRegistered.idealRegisteredNUI(email, phone, country);
  }
});

When('Apm Shopper fills new ui email and phone number and country for sofort', (table) => {
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
    worldpayPaymentTestRegistered.sofortRegisteredNUI(email, phone, status, country);
  }
});

When('Apm Shopper fills new ui email and phone number for wechatpay', (table) => {
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
    worldpayPaymentTestRegistered.wechatpayRegisteredNUI(email, phone);
  }
});



When('Apm Shopper fills new ui email and phone number and status for chinaunionpay', (table) => {
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
    worldpayPaymentTestRegistered.chinaunionpayRegisteredNUI(email, phone, status, country);
  }
});

When('Apm Shopper fills new ui email and phone number and status for enets', (table) => {
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
    worldpayPaymentTestRegistered.enetsRegisteredNUI(email, phone, status, country);
  }
});

When('Apm Shopper fills new ui email and phone number for konbini', (table) => {
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
    worldpayPaymentTestRegistered.konbiniRegisteredNUI(email, phone);
  }
});

When('Apm Shopper fills new ui email and phone number and status for mistercash', (table) => {
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
    worldpayPaymentTestRegistered.mistercashRegisteredNUI(email, phone, status, country);
  }
});

When('Apm Shopper fills new ui email and phone number and status for przelewy24', (table) => {
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
    worldpayPaymentTestRegistered.przelewy24RegisteredNUI(email, phone, status, country);
  }
});

When('Apm Shopper fills new ui email and phone number and status for poli', (table) => {
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
    worldpayPaymentTestRegistered.poliRegisteredNUI(email, phone, status, country);
  }
});


When('Apm Shopper fills new ui email and phone number and status for sepa', (table) => {
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
    const iban = cells[2].value;
    const accountname = cells[3].value;
    const country = cells[4].value;
    worldpayPaymentTestRegistered.sepaRegisteredNUI(email, phone, iban, accountname, country);
  }
});

//SFRA6.0

When('Apm Shopper fills phone number for wechatpay', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    worldpayPaymentTestRegistered.wechatpayRegistered(phone);
  }
});

When('Apm Shopper fills phone number, achpay details and status for achpay', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values

    const phone = cells[0].value;
    const country = cells[1].value;
    const accounttype = cells[2].value;
    const routingnumber = cells[3].value;
    const accountnumber = cells[4].value;
    const checknumber = cells[5].value;
    worldpayPaymentTestRegistered.achRegistered(phone, country, accounttype, routingnumber, accountnumber, checknumber);

  }
});

When('Apm Shopper fills phone number for konbini', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values

    const phone = cells[0].value;
    worldpayPaymentTestRegistered.konbiniRegistered(phone);
  }
});

When('Apm Shopper fills phone number and status for sepa', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values

    const phone = cells[0].value;
    const iban = cells[1].value;
    const accountname = cells[2].value;
    const country = cells[3].value;
    worldpayPaymentTestRegistered.sepaRegistered(phone, iban, accountname, country);
  }
});

When('Apm Shopper fills phone number and status for chinaunionpay', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values

    const phone = cells[0].value;
    const status = cells[1].value;
    const country = cells[2].value;
    worldpayPaymentTestRegistered.chinaunionpayRegistered(phone, status, country);
  }
});

When('Apm Shopper fills phone number and status for alipay', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values

    const phone = cells[0].value;
    const status = cells[1].value;
    const country = cells[2].value;
    worldpayPaymentTestRegistered.alipayRegistered(phone, status, country);
  }
});

When('Apm Shopper fills phone number and country for sofort', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values

    const phone = cells[0].value;
    const status = cells[1].value;
    const country = cells[2].value;
    worldpayPaymentTestRegistered.sofortRegistered(phone, status, country);
  }
});

When('Apm Shopper fills phone number and status for mistercash', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values

    const phone = cells[0].value;
    const status = cells[1].value;
    const country = cells[2].value;
    worldpayPaymentTestRegistered.mistercashRegistered(phone, status, country);
  }
});

When('Apm Shopper fills phone number and status for klarna Pay Later', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const status = cells[1].value;
    const country = cells[2].value;
    worldpayPaymentTestRegistered.klarnaPayLater(phone, status, country);
  }
});

When('Apm Shopper fills phone number and status for przelewy24', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const status = cells[1].value;
    const country = cells[2].value;
    worldpayPaymentTestRegistered.przelewy24Registered(phone, status, country);
  }
});

When('Apm Shopper fills phone number and status for poli', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const status = cells[1].value;
    const country = cells[2].value;
    worldpayPaymentTestRegistered.poliRegistered(phone, status, country);
  }
});

When('Apm Shopper fills phone number and status for klarna Pay Now', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const status = cells[1].value;
    const country = cells[2].value;
    worldpayPaymentTestRegistered.klarnaPayNow(phone, status, country);
  }
});

When('Apm Shopper fills phone number and country for Ideal', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const country = cells[1].value;
    worldpayPaymentTestRegistered.idealRegistered(phone, country);
  }
});

When('Apm Shopper fills phone number and country for paypal', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const country = cells[1].value;
    const response = cells[2].value;
    worldpayPaymentTestRegistered.paypalRegistered(phone, country, response);
  }
});

When('Apm Shopper fills phone number and status for klarna Slice It', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const status = cells[1].value;
    const country = cells[2].value;
    worldpayPaymentTestRegistered.klarnaSliceIt(phone, status, country);
  }
});

When('Apm Shopper fills phone number and country for Ideal Cancel Scenario', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const country = cells[1].value;
    worldpayPaymentTestRegistered.idealRegisteredCancel(phone, country);
  }
});

When('Apm Shopper fills phone number and country for Ideal Refuse Scenario', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const country = cells[1].value;
    worldpayPaymentTestRegistered.idealRegisteredRefuse(phone, country);
  }
});

//NEWUI

When('Apm Shopper fills new ui phone number for wechatpay', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    worldpayPaymentTestRegistered.wechatpayRegisteredNUI(phone);
  }
});

When('Apm Shopper fills new ui phone number, achpay details and status for achpay', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const country = cells[1].value;
    const accounttype = cells[2].value;
    const routingnumber = cells[3].value;
    const accountnumber = cells[4].value;
    const checknumber = cells[5].value;
    worldpayPaymentTestRegistered.achRegisteredNUI(phone, country, accounttype, routingnumber, accountnumber, checknumber);

  }
});

When('Apm Shopper fills new ui phone number for konbini', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    worldpayPaymentTestRegistered.konbiniRegisteredNUI(phone);
  }
});

When('Apm Shopper fills new ui phone number and status for chinaunionpay', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const status = cells[1].value;
    const country = cells[2].value;
    worldpayPaymentTestRegistered.chinaunionpayRegisteredNUI(phone, status, country);
  }
});

When('Apm Shopper fills new ui phone number and status for alipay', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const status = cells[1].value;
    const country = cells[2].value;
    worldpayPaymentTestRegistered.alipayRegisteredNUI(phone, status, country);
  }
});

When('Apm Shopper fills new ui phone number and country for sofort', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const status = cells[1].value;
    const country = cells[2].value;
    worldpayPaymentTestRegistered.sofortRegisteredNUI(phone, status, country);
  }
});

When('Apm Shopper fills new ui phone number and status for mistercash', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const status = cells[1].value;
    const country = cells[2].value;
    worldpayPaymentTestRegistered.mistercashRegisteredNUI(phone, status, country);
  }
});

When('Apm Shopper fills new ui phone number and status for przelewy24', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const status = cells[1].value;
    const country = cells[2].value;
    worldpayPaymentTestRegistered.przelewy24RegisteredNUI(phone, status, country);
  }
});

When('Apm Shopper fills new ui phone number and status for poli', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const status = cells[1].value;
    const country = cells[2].value;
    worldpayPaymentTestRegistered.poliRegisteredNUI(phone, status, country);
  }
});

When('Apm Shopper fills new ui phone number and country for Ideal', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const country = cells[1].value;
    worldpayPaymentTestRegistered.idealRegisteredNUI(phone, country);
  }
});

When('Apm Shopper fills new ui phone number and country for paypal', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const country = cells[1].value;
    worldpayPaymentTestRegistered.paypalRegisteredNUI(phone, country);
  }
});

//Features DUI

When('Apm Shopper fills phone number, country & narratrive for Ideal', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const country = cells[1].value;
    const narrative = cells[2].value;
    worldpayPaymentTestRegistered.idealRegisteredNarrative(phone, country, narrative);
  }
});

When('Apm Shopper fills phone number, country & narratrive for paypal', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const country = cells[1].value;
    const narrative = cells[2].value;
    worldpayPaymentTestRegistered.paypalRegisteredNarrative(phone, country, narrative);
  }
});

//NUI

When('Apm Shopper fills on new ui phone number, country & narratrive for paypal', (table) => {
  for (const id in table.rows) {
    console.log(table.rows);
    if (id < 1) {
      continue; // skip a header of a table
    }

    // go by row cells
    const cells = table.rows[id].cells;

    // take values
    const phone = cells[0].value;
    const country = cells[1].value;
    const narrative = cells[2].value;
    worldpayPaymentTestRegistered.paypalRegisteredNarrativeNUI(phone, country, narrative);
  }
});

