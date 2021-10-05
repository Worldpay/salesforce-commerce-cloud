'use strict';

require('dotenv').config();
const fs = require('fs');
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const config = require('lighthouse/lighthouse-core/config/lr-desktop-config.js');
const reportGenerator = require('lighthouse/lighthouse-core/report/report-generator');
const ENVIRONMENT = process.argv.slice(2);
var result = [];

/**
 * Runs the lighthouse for the given URL and writes the report
 * @param url
 * @param browser
 * @param pageType
 * @return {Promise<void>}
 */
async function startLightHouse(url, browser, pageType) {
    const report = await lighthouse(url, {
        port: (new URL(browser.wsEndpoint())).port,
        output: 'html',
        logLevel: 'error',
        disableDeviceEmulation: true,
        onlyCategories : ['accessibility','performance'],
        chromeFlags: ['--disable-mobile-emulation', '--disable-storage-reset']
    }, config);
    const html = reportGenerator.generateReport(report.lhr, 'html');
    fs.writeFileSync(`${__dirname}/reports/html/${pageType}.html`, html);

    var entry = {
        pageType : pageType,
        accessibility : report.lhr.categories['accessibility'].score,
        performance : report.lhr.categories['performance'].score,
    };
    result.push(entry);
    fs.writeFileSync(`${__dirname}/reports/json/report.json`, JSON.stringify(result));
}

/**
 * @param {import('puppeteer').Browser} browser
 */
async function registeredCheckout (browser) {
    let sumbitPaymentURL;
    let shippingPageURL = `https://${ENVIRONMENT}${process.env.REGISTERED_CHECKOUT_URL}`;
    const page = await browser.newPage();
    await page.setViewport({
        width: 1366,
        height: 768,
    });
    try {
        await page.goto(shippingPageURL);
        await page.waitForSelector('.shipping-section', {visible: true});

        await Promise.all([
            // page.click('.single-shipping .shipping-address .shipment-selector-block  .btn-add-new'),
            page.waitForSelector('.single-shipping #shipmentSelector-default', {visible: true, waitUntil: 'networkidle2'}),
        ]);
        await Promise.all([
            page.click('button.submit-shipping'),
            page.waitForSelector('.payment-form', {visible: true})
        ]);

        const billingEmail = await page.$('input#email');
        await billingEmail.type('test@sapient.com');

        const billingPhoneNumber = await page.$('input#phoneNumber');
        await billingPhoneNumber.press('Backspace');
        await billingPhoneNumber.type('9234567890');

        const cardOwner = await page.$('input#cardOwner');
        await cardOwner.type('Puppeteer Lighthouse')

        const cardNumber = await page.$('input#cardNumber');
        await cardNumber.type('4444333322221111');

        await page.evaluate(() => {
            $("#expirationMonth option:contains('01')")[0].selected = true
        });
        await page.evaluate(() => {
            $("#expirationYear option:contains('2025')")[0].selected = true
        });

        const cvv = await page.$('input#securityCode');
        await cvv.type('111');

        const saveCard = await page.$('.save-credit-card');

        await page.evaluate(() => {
            $(".save-credit-card").prop("checked", false);
        });

        await Promise.all([
            page.click('.submit-payment'),
            page.waitForSelector('.place-order', {visible: true})
        ]);
        sumbitPaymentURL = await page.url();
        await page.close();
    } catch (e) {
        console.log("Error Occured in Checkout Process | Error : " + e.message);
        await page.screenshot({path: `${__dirname}/reports/screenshots/CheckoutError.png`});
        await page.close();
        await browser.close();
    }
    await startLightHouse(sumbitPaymentURL, browser, 'Registered Checkout');
}

/**
 * @param {import('puppeteer').Browser} browser
 * @param {string} origin
 */
async function placeOrder(browser) {
    let placeOrderURL = `https://${ENVIRONMENT}${process.env.PLACE_ORDER_URL}`;
    const page = await browser.newPage();
    await page.setViewport({
        width: 1366,
        height: 768,
    });
    try {
        await page.goto(placeOrderURL);
        const cardNumber = await page.$('input#cardNumber');
        await cardNumber.type('4444333322221111');

        await page.evaluate(() => {
            $("#expirationMonth option:contains('01')")[0].selected = true
        });
        await page.evaluate(() => {
            $("#expirationYear option:contains('2025')")[0].selected = true
        });
        const cvv = await page.$('input#securityCode');
        await cvv.type('111');
        const saveCard = await page.$('.save-credit-card');

        await page.evaluate(() => {
            $(".save-credit-card").prop("checked", false);
        });
        await page.click('#credit-card-content > fieldset > div.row.worldpaySaveCreditFields > div > div.form-check.save-credit-card > label > input');
        await page.click('#checkout-main > div:nth-child(3) > div.col-sm-7 > div.row > div > div > button.btn.btn-primary.btn-block.submit-payment');
        await page.waitForSelector('#checkout-main > div:nth-child(3) > div.col-sm-7 > div.row > div > div > button.btn.btn-primary.btn-block.place-order',{visible: true});
        await page.waitFor(2000);
        await page.click('#checkout-main > div:nth-child(3) > div.col-sm-7 > div.row > div > div > button.btn.btn-primary.btn-block.place-order');
        await page.waitForNavigation({waitUntil: 'networkidle0'});
        await page.waitForSelector('.order-thank-you-msg', {waitUntil: 'networkidle0', visible: true});

        var confirmationURL = await page.url();
        console.log('Confirmation URL : ' + confirmationURL);
        await startLightHouse(confirmationURL, browser, 'OrderConfirmationPage');
        await page.close();
    } catch (error) {
        console.log("There were issues while placing Order " + error.message);
        await page.screenshot({path: `${__dirname}/reports/screenshots/PlaceOrderError.png`});
        await page.close();
        await browser.close();
    }
}

/**
 * @param {import('puppeteer').Browser} browser
 */
async function startCheckout(browser) {
    let sumbitPaymentURL;
    let shippingPageURL = `https://${ENVIRONMENT}${process.env.CHECKOUT_URL}`;
    const page = await browser.newPage();
    await page.setViewport({
        width: 1366,
        height: 768,
    });
    try {
        await page.goto(shippingPageURL);
        await page.waitForSelector('.shipping-section', {visible: true});

        await Promise.all([
            // page.click('.single-shipping .shipping-address .shipment-selector-block  .btn-add-new'),
            page.waitForSelector('#shippingFirstNamedefault', {visible: true, waitUntil: 'networkidle2'}),
        ]);
        const firstName = await page.$('#shippingFirstNamedefault');
        await firstName.type('Test');
        await firstName.press('Backspace');
        await firstName.type('Test');

        const lastName = await page.$('#shippingLastNamedefault');
        await lastName.type('Lighthouse');

        const address1 = await page.$('#shippingAddressOnedefault');
        await address1.type('500 Howard St');

        const city = await page.$('#shippingAddressCitydefault');
        await city.type('SanFrancisco');

        const zipCode = await page.$('#shippingZipCodedefault');
        await zipCode.type('94118');

        const phoneNumber = await page.$('#shippingPhoneNumberdefault');
        await phoneNumber.type('9234567890');

        await page.evaluate(() => {
            $("#shippingCountrydefault option:contains('UnitedStates')")[0].selected = true;
        });

        await page.evaluate(() => {
            $("#shippingStatedefault option:contains('California')")[0].selected = true;
        });
        await Promise.all([
            page.click('button.submit-shipping'),
            page.waitForSelector('.payment-form', {visible: true})
        ]);

        const billingEmail = await page.$('input#email');
        await billingEmail.type('test@sapient.com');

        const billingPhoneNumber = await page.$('input#phoneNumber');
        await billingPhoneNumber.press('Backspace');
        await billingPhoneNumber.type('9234567890');

        const cardOwner = await page.$('input#cardOwner');
        await cardOwner.type('Puppeteer Lighthouse')

        const cardNumber = await page.$('input#cardNumber');
        await cardNumber.type('4444333322221111');

        await page.evaluate(() => {
            $("#expirationMonth option:contains('01')")[0].selected = true
        });
        await page.evaluate(() => {
            $("#expirationYear option:contains('2030')")[0].selected = true
        });

        const cvv = await page.$('input#securityCode');
        await cvv.type('111');

        const saveCard = await page.$('.save-credit-card');

        await page.evaluate(() => {
            $(".save-credit-card").prop("checked", false);
        });

        await Promise.all([
            page.click('.submit-payment'),
            page.waitForSelector('.place-order', {visible: true})
        ]);
        sumbitPaymentURL = await page.url();
    } catch (e) {
        console.log("Error Occured in Checkout Process | Error : " + e.message);
        await page.screenshot({path: `${__dirname}/reports/screenshots/CheckoutError.png`});
        await page.close();
        await browser.close();
    }
    await startLightHouse(sumbitPaymentURL, browser, 'Guest Checkout');
}

/**
 * @param {import('puppeteer').Browser} browser
 */
async function loginToAccount(browser) {
    let loginURL = `https://${ENVIRONMENT}${process.env.LOGIN_URL}`;
    const page = await browser.newPage();
    await page.goto(loginURL);
    //await page.click('.affirm.btn.btn-primary');
    await page.waitForSelector('input[type="email"]', {visible: true});
    const emailInput = await page.$('#login-form-email');
    await emailInput.type(process.env.LOGIN_USERNAME);
    const passwordInput = await page.$('#login-form-password');
    await passwordInput.type(process.env.LOGIN_PASSWORD);
    await Promise.all([
        page.click('form.login button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.waitForSelector('.profile-header')
    ]);
    await page.close();
}

/**
 * @param {import('puppeteer').Browser} browser
 */
async function guestAddProductToBasket(browser) {
    let cartPageURL;
    let productDetailsPageURL = `https://${ENVIRONMENT}${process.env.GUEST_PDP_URL}`;
    const page = await browser.newPage();
    await page.goto(productDetailsPageURL);
    //await page.click('.affirm.btn.btn-primary');
    try {
        await page.waitForSelector('.primary-images img');
        await page.waitForSelector('.add-to-cart');
        await Promise.all([
            page.click('.add-to-cart'),
            page.waitForSelector('div.add-to-basket-alert', { waitUntil: 'networkidle2' })
        ]);
        await Promise.all([
            page.click('a.minicart-link'),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);
        await page.waitForSelector('.promo-code-form');
        cartPageURL = await page.url();
        await page.close();
    } catch (error) {
        console.log("Guest Add to Cart was not working properly");
        await page.screenshot({path: `${__dirname}/reports/screenshots/GuestAddToCart.png`});
        await page.close();
        await browser.close();
    }
    await startLightHouse(cartPageURL, browser, 'CartPage');
}

/**
 * @param {import('puppeteer').Browser} browser
 */
async function visitProductDetailsPage(browser) {
    let productDetailsPageURL = `https://${ENVIRONMENT}${process.env.PDP_URL}`;
    const page = await browser.newPage();
    await page.goto(productDetailsPageURL);
    try {
        await page.waitForSelector('.primary-images img');
        await page.waitForSelector('.add-to-cart');
        await page.close();
    } catch (error) {
        console.log("Product Details page was not loading properly");
        await page.screenshot({path: `${__dirname}/reports/screenshots/ProductDetailsPage.png`});
        await page.close();
        await browser.close();
    }
    await startLightHouse(productDetailsPageURL, browser, 'ProductDetailsPage');
}

/**
 * @param {import('puppeteer').Browser} browser
 */
async function visitProductListPage(browser) {
    let productListPageURL = `https://${ENVIRONMENT}${process.env.PLP_URL}`;
    const page = await browser.newPage();
    await page.goto(productListPageURL);
    try {
        await page.waitForSelector('.product-grid .product');
        await page.close();
    } catch (error) {
        console.log("Product List page was not loading properly");
        await page.screenshot({path: `${__dirname}/reports/screenshots/ProductListPage.png`});
        await page.close();
        await browser.close();
    }
    await startLightHouse(productListPageURL, browser, 'ProductListPage');
}

/**
 * @param {import('puppeteer').Browser} browser
 */
async function visitHomePage(browser) {
    let homePageURL = `https://${ENVIRONMENT}${process.env.HOME_URL}`;
    const page = await browser.newPage();
    await page.goto(homePageURL);
    await page.click('.affirm.btn.btn-primary');
    try {
        await page.waitForSelector('.logo-home');
        await page.close();
    } catch (error) {
        console.log("Home page was not loading properly");
        await page.screenshot({path: `${__dirname}/reports/screenshots/HomePageError.png`});
        await page.close();
        await browser.close();
    }
    await startLightHouse(homePageURL, browser, 'HomePage');
}


/**
 * Gets the config object for Puppeteer
 * @param width - Screen Width
 * @param height - Screen Height
 * @return {{args: [], headless: boolean, slowMo: number}} - Config  Object
 */
function getPuppeteerConfig(width = 1720, height = 980) {
    let args = [];
    if (!!width && !!height) {
        args.push(`--window-size=${width},${height}`)
    }
    return {
        args : args,
        headless: false,
        slowMo: 50
    }
}

function generateSummary() {
    var result = require('./reports/json/report.json');
    let html = '<html><head><style>td, th { text-align: left; vertical-align: top; border: 1px solid silver} table { font-family: "Trebuchet MS", Arial, Helvetica, sans-serif; border-collapse: collapse;   width: 40%; } h2{ font-family: "Trebuchet MS", Arial, Helvetica, sans-serif; }  td, th {   border: 1px solid #ddd;   padding: 8px; }  tr:nth-child(even){background-color: #f2f2f2;}  tr:hover {background-color: #ddd;}   th {   padding-top: 12px;   padding-bottom: 12px;   text-align: left;   background-color: #4CAF50;   color: white; }</style></head><body><h2> Accessibility and Performance Reports </h2><table><tr style="font-weight:bold"><td>PageName</td><td>Accessibility</td><td>Performance</td></tr>';
    for (var i in result) {
        html = `${html}<tr>
                <td>${result[i].pageType}</td>
                <td>${Math.round(result[i].accessibility * 100)}</td>
                <td>${Math.round(result[i].performance * 100)}</td>
            </tr>`;
    }
    html += '</table></head></html>'
    fs.writeFileSync(`${__dirname}/reports/html/summary.html`, html, { encoding: 'utf8' });
}


/**
 * Main process for accessibility
 * @return {Promise<void>} - Promise
 */
async function main() {
    const puppeteerConfig = getPuppeteerConfig();
    const browser = await puppeteer.launch(puppeteerConfig);
    await visitHomePage(browser);
    await visitProductListPage(browser);
    await visitProductDetailsPage(browser);
    await guestAddProductToBasket(browser);
    await loginToAccount(browser);
    //await startCheckout(browser);
    await registeredCheckout(browser);
    await placeOrder(browser);
    await browser.close();
}

// START the process
main().then(function(){
    console.log('Scripts execution completed');
    generateSummary();
}).catch(function() {
    console.error('There are issues');
    generateSummary();
});


