const { I, wpgCards, homePage, uriUtils } = inject();
let product;
When('shopper selects yes or no for tracking consent on home page', () => {
  I.amOnPage(uriUtils.uri.homePage);
  homePage.accept();
});

When('shopper searches for {string} and goes to PDP', (inputProduct) => {
  product = inputProduct;
  wpgCards.Search(product);
});

When('adds the product to cart and click to Checkout', async () => {
  wpgCards.addToCart();
  wpgCards.viewCart();
  wpgCards.clickCheckout();
});

When('clicks on checkout as guest to navigate to checkout page', async () => {
  wpgCards.clickCheckoutAsGuest();
});

When('fills shipping Address for {string} on shipping section', (inputCountry) => {
  country = inputCountry;
  wpgCards.fillShipping(country);
});

When('adds {string} and phone number', (iEmail) => {
  email = iEmail;
  wpgCards.fillEmailPhone(email);
});

When('Guest Shopper adds new card details {string}, {string} and {string}', (iCardName, iCardNumber, iCvv) => {
  cardname = iCardName;
  cardnumber = iCardNumber;
  cvv = iCvv;
  wpgCards.fillCardDetailsGuest(cardname, cardnumber, cvv);
  I.wait(5);
});

When('Verify that added card should be of Diners', () => {
  I.seeElement({ xpath: "//div[@data-type='diners']" });
});

When('Verify that added card should be of Master', () => {
  I.seeElement({ xpath: "//div[@data-type='mastercard']" });
});

When('Verify that added card should be of JCB', () => {
  I.seeElement({ xpath: "//div[@data-type='jcb ']" });
});

When('Verify that added card should be of Visa', () => {
  I.seeElement({ xpath: "//div[@data-type='visa']" });
});

When('Verify that added card should be of Amex Card', () => {
  I.seeElement({ xpath: "//div[@data-type='amex']" });
});

When('shopper click on Next Place Order Button', () => {
  wpgCards.ClickOnNextPlaceOrderButton();
});

When('shopper click on Place Order', async () => {
  wpgCards.clickOnPlaceOrder();
  I.wait(5);
});

When('shopper selects {string} and clicks on Submit Button in 3D page', async (i3DMagicValue) => {
  threeDMagicValue = i3DMagicValue;
  wpgCards.clickOn3DSubmitButton(threeDMagicValue);
});

When('Print the Order Number for {string}', async (iScenario) => {
  scenario = iScenario;
  let pin = await I.grabTextFrom('.summary-details.order-number');
  console.log(pin);
  let pd = await I.grabTextFrom('.payment-details');
  I.writeToFile('result.log', '\n' + scenario + ': ' + pin + ': ' + pd + '\n');
});

