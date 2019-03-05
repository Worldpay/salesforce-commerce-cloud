function common() {}

common.variantId = '740357377119';
common.loginDetails = {
    loginId: 'skumari30@sapient.com',
    password: 'Sapient@12345'
};
common.ocapiUrl = 'https://worldpay03-tech-prtnr-eu04-dw.demandware.net/s/Sites-MobileFirst-Site/dw/shop/v19_1';
common.creditCardVisa = {
    cardName: 'VISA-SSL',
    cardType: 'Visa',
    cardOwner: 'test name',
    number: '4917610000000000',
    yearIndex: 2025,
    monthIndex: 1,
    cvn: 987
};
common.creditCardVisa2 = {
    cardName: 'VISA-SSL',
    cardType: 'Visa',
    cardOwner: 'test name',
    number: '4111111111111111',
    yearIndex: 2025,
    monthIndex: 1,
    cvn: 987
};
common.creditCardError = {
    cardName: 'VISA-SSL',
    cardType: 'Visa',
    cardOwner: 'ERROR',
    number: '4917610000000000',
    yearIndex: 2025,
    monthIndex: 1,
    cvn: 987
};
common.creditCard3D = {
    cardName: 'VISA-SSL',
    cardType: 'Visa',
    cardOwner: '3D',
    number: '4917610000000000',
    yearIndex: 2025,
    monthIndex: 1,
    cvn: 987
};
common.shippingAddress = {
    firstName: 'Jane',
    lastName: 'Smith',
    address1: '10 main Street',
    address2: '',
    country: 'US',
    stateCode: 'NY',
    city: 'burlington',
    postalCode: '14304',
    phone: '3333333333'
};
common.billingAddress = {
    firstName: 'Jane',
    lastName: 'Smith',
    address1: '10 main Street',
    address2: '',
    country: 'US', // United States
    stateCode: 'NY',
    city: 'burlington',
    postalCode: '14304',
    email: 'skumari30@sapient.com',
    phone: '3333333333'
};
common.sepaBillingAddress = {
    firstName: 'Jane',
    lastName: 'Smith',
    address1: '10 main Street',
    address2: '',
    country: 'DE', // Germany
    stateCode: 'NY',
    city: 'burlington',
    postalCode: '14304',
    email: 'skumari30@sapient.com',
    phone: '3333333333'
};
common.mistercashBillingAddress = {
    firstName: 'Jane',
    lastName: 'Smith',
    address1: '10 main Street',
    address2: '',
    country: 'BE', // Belgium
    stateCode: 'NY',
    city: 'burlington',
    postalCode: '14304',
    email: 'skumari30@sapient.com',
    phone: '3333333333'
};

module.exports = common;
