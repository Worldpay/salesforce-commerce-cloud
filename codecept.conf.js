var RELATIVE_PATH = './test/acceptance';
var OUTPUT_PATH = RELATIVE_PATH + '/report';
var HOST = 'https://worldpay03-tech-prtnr-eu04-dw.demandware.net';

var webDriver = {
    url: HOST,
    browser: 'chrome',
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
        WebDriver: webDriver
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
        uriUtils: RELATIVE_PATH + '/utils/uriUtils.js'
    },
    gherkin: {
        features: RELATIVE_PATH + '/features/PaymentMethods/**/*.feature',
        steps: [
            RELATIVE_PATH + '/features/steps/wpPaymentRegisteredApm.steps.js',
            RELATIVE_PATH + '/features/steps/wpPaymentRegisteredcredit.steps.js'
        ]
    },
    tests: RELATIVE_PATH + '/tests/**/*.test.js',
    name: 'link_worldpay'
};
