
'use strict';

const HashMap = require('dw/util/HashMap');
const Site = require('dw/system/Site');
const Bytes = require('dw/util/Bytes');
const Mac = require('dw/crypto/Mac');
const Encoding = require('dw/crypto/Encoding');
const collections = require('*/cartridge/scripts/util/collections');

const clickToPayService = require('*/cartridge/scripts/service/clickToPayService').ClickToPayService;


function getPublicKey(kid) {
    let signedHeaders = new HashMap();

    const sharedSecret = Site.getCurrent().getCustomPreferenceValue('wpCTPSharedKey');
    const keyID = Site.getCurrent().getCustomPreferenceValue('wpCTPKeyId');
    const host = Site.getCurrent().getCustomPreferenceValue('wpCTPEndpoint');
    const merchantId = Site.getCurrent().getCustomPreferenceValue('wpCTPMerchantId');
    const date = new Date().toUTCString()
    
    // siganture headers
    signedHeaders.put('host', host);
    signedHeaders.put('date', date);
    signedHeaders.put('request-target', 'get /flex/v2/public-keys/' + kid);
    signedHeaders.put('v-c-merchant-id', merchantId);

    const signature = generateSignature(signedHeaders, keyID, sharedSecret);

    let headerString = '';

    collections.forEach(signedHeaders.keySet(), function (key) {
        headerString = headerString + ' ' + key;
    });

    let signatureMap = new HashMap();

    // request headers
    signatureMap.put('keyid', keyID);
    signatureMap.put('algorithm', 'HmacSHA256');
    signatureMap.put('headers', headerString);
    signatureMap.put('signature', signature);

    let signaturefields = '';

    collections.forEach(signatureMap.keySet(), function (key) {
        signaturefields = signaturefields + key + '="' + signatureMap.get(key) + '", ';
    });

    signaturefields = signaturefields.slice(0, signaturefields.length - 2);
    signedHeaders.put('signature', signaturefields);
    signedHeaders.remove('request-target');

    const reqParams = {
        endpoint: `https://${host}/flex/v2/public-keys/${kid}`,
        headers: signedHeaders,
        method: 'GET'
    }

    const serviceResult = clickToPayService.call(reqParams);

    if (!serviceResult) {
        return null;
    }

    return JSON.parse(serviceResult.object.body);
}

function generateSignature(signedHeaders, keyID, sharedSecret) {
    try {
        const encryptor = new Mac(Mac.HMAC_SHA_256);
        const secret = Encoding.fromBase64(sharedSecret);

        let signatureString = '';

        collections.forEach(signedHeaders.keySet(), function (key) {
            signatureString = signatureString + '\n' + key + ': ' + signedHeaders.get(key);
        });

        signatureString = signatureString.slice(1, signatureString.length);

        return Encoding.toBase64(encryptor.digest(new Bytes(signatureString.toString(), 'UTF-8'), secret));
    } catch (exception) {
        Logger.error('Error in Secure acceptance create request data' + exception.message);
        return { error: true, errorMsg: exception.message };
    }
}

module.exports = {
    getPublicKey: getPublicKey
};

