'use strict';

import * as testDataMgr from './main.js'; // eslint-disable-line
import moment from 'moment-timezone';

export const loginUserEmail = 'jnishikant@sapient.com';
export const loginPassword = 'Abcd@1234';
export const newUserPassword = 'Sapient@123';
export const storefrontPath = 'C:/Users/nis0/Projects/WorldpaySFRANewWS/sfcc_worldpay';
export const resourcePath = 'C:/Users/nis0/Projects/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/templates/resources/';
export const variantProduct1 = '701644130756';
export const variantProduct2 = '708141677203';
export const variantProduct3 = '701644388652';

export const creditCardAmex = {
    cardName: 'AMEX-SSL',
    cardType: 'Amex',
    number: '34343434343434',
    yearIndex: getCurrentYear() + 1,
    cvn: 1234
};
export const creditCardDiscover = {
    cardName: 'DISCOVER-SSL',
    cardType: 'Discover',
    number: '6011111111111117',
    yearIndex: getCurrentYear() + 1,
    cvn: 987
};

export const creditCardVisa = {
    cardName: 'VISA-SSL',
    cardType: 'Visa',
    number: '4917610000000000',
    yearIndex: getCurrentYear() + 1,
    cvn: 987
};

export const creditCardError = {
    cardName: 'ERROR',
    cardType: 'Visa',
    number: '4917610000000000',
    yearIndex: getCurrentYear() + 1,
    cvn: 123
};

export const creditCardRefused = {
    cardName: 'REFUSED41',
    cardType: 'Amex',
    number: '34343434343434',
    yearIndex: getCurrentYear() + 1,
    cvn: 1234
};

export const creditCard3D = {
    cardName: '3D',
    cardType: 'Visa',
    number: '4444333322221111',
    yearIndex: getCurrentYear() + 1,
    cvn: 123
};

function getCurrentYear() {
    return moment(new Date()).year();
}
