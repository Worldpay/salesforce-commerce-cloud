var RELATIVE_PATH = './test/acceptance';
var OUTPUT_PATH = RELATIVE_PATH + '/report';
var HOST = '<Domain URL>';
// For e.g.: 'https://dev01.sandbox.us01.dx.commercecloud.salesforce.com';

var webDriver = {
    url: HOST,
    browser: 'chrome',
    /* desiredCapabilities: {
        chromeOptions: {
          args: [ "--headless", "--disable-gpu", "--no-sandbox", "--window-size=1920,1080" ]
        }
    }, */
    smartWait: 5000,
    waitForTimeout: 5000,
    windowSize: 'maximize',
    timeouts: {
        script: 60000,
        'page load': 10000

    }
};


exports.config = {
    output: OUTPUT_PATH,
    helpers: {
        WebDriver: webDriver,
        FileSystem: {}
    },

    plugins: {
        wdio: {
            enabled: true,
            services: ['selenium-standalone']
        },

        allure: {
            enabled: true
        },

        retryFailedStep: {
            enabled: true,
            retries: 1
        }
    },
    include: {
        homePage: RELATIVE_PATH + '/pages/HomePage.js',
        worldpayPaymentTestRegistered: RELATIVE_PATH + '/pages/worldpayPaymentTestRegistered.js',
        worldpayPaymentTestRegisteredcredit: RELATIVE_PATH + '/pages/worldpayPaymentTestRegisteredcredit.js',
        wpgCardCheckout: RELATIVE_PATH + '/pages/wpgCardCheckout.js',
        uriUtils: RELATIVE_PATH + '/utils/uriUtils.js',
        testData: RELATIVE_PATH + '/data/testData.js'
    },
    gherkin: {
        features: RELATIVE_PATH + '/features/TestSuites/**/*.feature',
        steps: [
            RELATIVE_PATH + '/features/steps/wpPaymentRegisteredApm.steps.js',
            RELATIVE_PATH + '/features/steps/wpPaymentRegisteredcredit.steps.js',
            RELATIVE_PATH + '/features/steps/wpgAll.steps.js',
            RELATIVE_PATH + '/features/steps/ocapi.steps.js'
        ]
    },
    tests: RELATIVE_PATH + '/tests/**/*.test.js',
    name: 'link_worldpay'
};
