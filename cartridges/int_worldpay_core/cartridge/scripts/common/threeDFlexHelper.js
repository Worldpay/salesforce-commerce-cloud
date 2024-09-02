
/**
 * Encodes string to base64 string
 * @param {string} source - Source string
 * @returns {string} - encoded string
 */
function base64url(source) {
    let Encoding = require('dw/crypto/Encoding');
    let encodedSource = Encoding.toBase64(source);

    // Remove trailing '=' characters efficiently
    encodedSource = encodedSource.slice(0, encodedSource.indexOf('=') !== -1 ? encodedSource.indexOf('=') : encodedSource.length);

    // Replace characters to make the string URL-safe
    encodedSource = encodedSource.replace(/\+/g, '-').replace(/\//g, '_');
    return encodedSource;
}

/**
 * @returns {Object} JWT required data
 */
function initJwtcreation() {
    var UUIDUtils = require('dw/util/UUIDUtils');
    var WorldpayPreferences = require('*/cartridge/scripts/object/worldpayPreferences');
    var worldPayPreferences = new WorldpayPreferences();
    var preferences = worldPayPreferences.worldPayPreferencesInit();
    var iat = Math.floor(new Date().getTime() / 1000);

    var jti = UUIDUtils.createUUID();
    return {
        iat: iat,
        jti: jti,
        jwtMacKey: preferences.jwtMacKey,
        iss: preferences.iss,
        OrgUnitId: preferences.OrgUnitId
    };
}

/**
 * @param {data} data JWT object
 * @param {string} jwtMacKey jwtMacKey custom preference
 * @returns {string} JWT
 */
function createJwt(data, jwtMacKey) {
    var Bytes = require('dw/util/Bytes');
    var Mac = require('dw/crypto/Mac');
    var worldpayConstants = require('*/cartridge/scripts/common/worldpayConstants');
    var header = {
        alg: worldpayConstants.DDC_ALG,
        typ: 'JWT'
    };
    var secret = jwtMacKey;
    var HeaderMsg = JSON.stringify(header);
    var charset = 'UTF8';

    var messageBytes = new Bytes(HeaderMsg, charset);
    var encodedHeader = base64url(messageBytes);
    var stringifiedData = JSON.stringify(data);

    var messageData = new Bytes(stringifiedData, charset);
    var encodedData = base64url(messageData);
    var signature = encodedHeader + '.' + encodedData;

    var encodedsignature = new Mac(Mac.HMAC_SHA_256).digest(signature, secret);
    signature = base64url(encodedsignature);
    return encodedHeader + '.' + encodedData + '.' + signature;
}

module.exports = {
    createJwt: createJwt,
    initJwtcreation: initJwtcreation
};
