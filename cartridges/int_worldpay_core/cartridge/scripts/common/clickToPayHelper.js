'use strict';

const Site = require('dw/system/Site');
const HashMap = require('dw/util/HashMap');
const Mac = require('dw/crypto/Mac');
const Bytes = require('dw/util/Bytes');
const Encoding = require('dw/crypto/Encoding');
const Signature = require('dw/crypto/Signature');
const Locale = require('dw/util/Locale');
const Logger = require('dw/system/Logger').getLogger('clickToPay', 'clickToPay');

const clickToPayService = require('*/cartridge/scripts/service/clickToPayService').ClickToPayService;

const JWT_TTL = 20;

/**
 * Check if Click to pay enabled
 */
function isEnabled() {
    return Site.getCurrent().getCustomPreferenceValue('wpCTPEnabled');
}

/**
 * Get Capture context path
 */
function getPath() {
    return Site.getCurrent().getCustomPreferenceValue('wpCTPCaputePath');
}

/**
 * Get click to pay merchant id
 */
function getMerchantId() {
    return Site.getCurrent().getCustomPreferenceValue('wpCTPMerchantId');
}

/**
 * Get click to pay Transaction id
 */
function getTransactionId() {
    return Site.getCurrent().getCustomPreferenceValue('wpCTPTransactionId');
}

/**
 * Get shared key
 */
function getSharedKey() {
    return Site.getCurrent().getCustomPreferenceValue('wpCTPSharedKey');
}

/**
 * Get key id
 */
function getKeyId() {
    return Site.getCurrent().getCustomPreferenceValue('wpCTPKeyId');
}

function getHost() {
    return Site.getCurrent().getCustomPreferenceValue('wpCTPEndpoint');
}

/**
 * Get CLICKTOPAY context
 * @returns {object} service result
 */
function getCtpContext(lineItemCtnr) {
    if (!isEnabled() || !lineItemCtnr) {
        return;
    }

    const body = getBody(lineItemCtnr);
    const headers = getHeaders(body);
    const reqParams = {
        body: body,
        endpoint: `https://${getHost()}${getPath()}`,
        headers: headers,
        method: 'POST'
    }

    const serviceResult = clickToPayService.call(reqParams);

    if (!serviceResult || serviceResult.status !== 'OK') {
        return {
            success: false
        }
    }

    // Validate response
    const validatedJwt = validateJwt(serviceResult.object.body);
    
    if (!validatedJwt) {
        return {
            success: false
        }
    }

    const jwtData = validatedJwt.ctx[0].data

    return {
        success: true,
        clientLibrary: jwtData.clientLibrary,
        clientLibraryIntegrity: jwtData.clientLibraryIntegrity,
        jwt: serviceResult.object.body
    };
}

/**
 * Generate digest
 */
function generateDigest(val) {
    const MessageDigest = require('dw/crypto/MessageDigest');
    const StringUtils = require('dw/util/StringUtils');
    const md = new MessageDigest(MessageDigest.DIGEST_SHA_256);

    return StringUtils.format('SHA-256={0}', Encoding.toBase64(md.digestBytes(new Bytes(JSON.stringify(val), 'UTF-8'))));
}

/**
 * Get request headers
 */
function getHeaders(body) {
    let signedHeaders = new HashMap();
    const digest = generateDigest(body);
    const date = new Date().toUTCString()
    
    signedHeaders.put('host', getHost());
    signedHeaders.put('path', getPath());
    signedHeaders.put('date', date);
    signedHeaders.put('merchantId', getMerchantId());
    signedHeaders.put('keyId', getKeyId());

    const signature = generateSignature(signedHeaders, digest);

    let headers = new HashMap();

    headers.put('Content-Type', 'application/json');
    headers.put('Accept', 'application/json')
    headers.put('v-c-merchant-id', getTransactionId())
    headers.put('Date', date)
    headers.put('Digest', digest)
    headers.put('Signature', signature)
    headers.put('Host', getHost())

    return headers;
}

/**
 * Get country code
 */
function getCountryCode(lineItemCtnr) {
    if (lineItemCtnr && lineItemCtnr.billingAddress && lineItemCtnr.billingAddress.countryCode) {
        return lineItemCtnr.billingAddress.countryCode.value.toUpperCase()
    }

    return Locale.getLocale(request.getLocale()).country.toUpperCase();
}

/**
 * Get request body
 * @returns {object} Request body
 */
function getBody(lineItemCtnr) {
    return {
        "targetOrigins": ['https://' + request.httpHost],
        "clientVersion": '0.26',
        "buttonType": "CHECKOUT_AND_CONTINUE",
        "allowedCardNetworks": Site.getCurrent().getCustomPreferenceValue('wpCTPAllowedCardNetworks').split(","),
        "allowedPaymentTypes": [Site.getCurrent().getCustomPreferenceValue('wpCTPaAlowedPaymentTypes')],
        "country": getCountryCode(),
        "locale": request.locale,
        "captureMandate": {
            "billingType": "FULL",
            "requestEmail": true,
            "requestPhone": true,
            "requestShipping": true,
            "shipToCountries": [getCountryCode()],
            "showAcceptedNetworkIcons": true
        },
        "data": {
            "orderInformation": {
                "amountDetails": {
                    "totalAmount": String(lineItemCtnr.totalGrossPrice.value),
                    "currency": lineItemCtnr.totalGrossPrice.currencyCode
                }
            }
        }
    }
}

/**
 * Get signature value
 */
function generateSignature(signedHeaders, digest) {
    try {
        const encryptor = new Mac(Mac.HMAC_SHA_256);
        const sharedSecret = getSharedKey();
        const decodedSecret = Encoding.fromBase64(sharedSecret);
        let signatureArr = [];

        signatureArr.push('(request-target): post ' + signedHeaders.get('path'));
        signatureArr.push('host: ' + signedHeaders.get('host'));
        signatureArr.push('date: ' + signedHeaders.get('date'));
        signatureArr.push('digest: ' + digest);
        signatureArr.push('v-c-merchant-id: ' + signedHeaders.get('merchantId'));

        const signatureString = signatureArr.join('\n');
        const signatureDigest = encryptor.digest(new Bytes(signatureString), decodedSecret);
        const signature = Encoding.toBase64(signatureDigest);


        return "keyid=\""+signedHeaders.get('keyId')+"\", algorithm=\"HmacSHA256\", headers=\"(request-target) host date digest v-c-merchant-id\", signature=\""+signature+"\"";
    } catch (e) {
        return { error: true, errorMsg: e.message };
    }
}

/**
 * Verify response signature
 */
function verifySignature(resKid, message) {
    if (!resKid || !message) return null;;

    const publicKey = require('*/cartridge/scripts/clickToPay/flexHelper').getPublicKey(resKid);

    if (!publicKey.n || !publicKey.e) {
        Logger.error('Invalid JWT decode flex key');

        return null;
    }

    const RSApublickey = require('*/cartridge/scripts/clickToPay/publicKey').getRSAPublicKey(publicKey.n, publicKey.e);

    const JWTAlgoToSFCCMapping = {
        RS256: "SHA256withRSA",
        RS512: "SHA512withRSA",
        RS384: "SHA384withRSA",
    };

    
    let apiSig = new Signature();
    
    const encodedHeader = message.split('.')[0];
    const encodedPayload = message.split('.')[1];
    const jwtSignature = message.split('.')[2];
    const jwtSignatureInBytes = new Encoding.fromBase64(jwtSignature);
    const kid = JSON.parse(Encoding.fromBase64(encodedHeader)).kid;
    const alg = JSON.parse(Encoding.fromBase64(encodedHeader)).alg;


    const contentToVerify = new Bytes(encodedHeader + '.' + encodedPayload);

    const isValid = apiSig.verifyBytesSignature(jwtSignatureInBytes, contentToVerify, new Bytes(RSApublickey), JWTAlgoToSFCCMapping[alg]);

    if (isValid) {
        return Encoding.fromBase64(encodedPayload).toString();
    }
    
    return null;
}

/**
 * Validate jwt response
 * @param {string|null} message - Response object from service
 */
function validateJwt(jwt) {
    if (!jwt) return false;

    try {
        const jwtArr = jwt.split('.');
        const headers = JSON.parse(Encoding.fromBase64(jwtArr[0]));

        if (!headers['alg'] || headers['alg'] !== 'RS256' || !headers['kid']) {
            Logger.error('Invalid JWT header: missing alg or kid');

            return false;
        }

        const payload = JSON.parse(Encoding.fromBase64(jwtArr[1]));

        if (!payload) {
            Logger.error('Failed to decode JWT payload');

            return false;
        }

        const now = new Date().getTime()

        if (!payload['exp'] || now < (payload['exp'] + JWT_TTL)) {
            Logger.error('Capture Context JWT has expired');

            return false;
        }

        const verifiedSignature = verifySignature(headers['kid'], jwt);

        if (!verifiedSignature) {
            Logger.error('Capture Context JWT signature verification failed');

            return false;
        }


        return JSON.parse(verifiedSignature);
    } catch (error) {
        Logger.error('Error in validate JWT, {0}', error);

        return false;
    }


}

module.exports = {
    isEnabled: isEnabled,
    getCtpContext: getCtpContext
};