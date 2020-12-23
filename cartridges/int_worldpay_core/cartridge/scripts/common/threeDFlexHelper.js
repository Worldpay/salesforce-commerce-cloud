
// eslint-disable-next-line require-jsdoc
function base64url(source) {
    var Encoding = require('dw/crypto/Encoding');
    var encodedSource = Encoding.toBase64(source);
    encodedSource = encodedSource.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    return encodedSource;
}

/**
 * @returns {Object} JWT required data
 */
function initJwtcreation() {
    var UUIDUtils = require('dw/util/UUIDUtils');
    var WorldpayPreferences = require('*/cartridge/scripts/object/WorldpayPreferences');
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
    var WorldpayConstants = require('*/cartridge/scripts/common/WorldpayConstants');
    var header = {
        alg: WorldpayConstants.DDC_ALG,
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
    var encodedJWT = encodedHeader + '.' + encodedData + '.' + signature;
    return encodedJWT;
}


module.exports = {
    createJwt: createJwt,
    initJwtcreation: initJwtcreation
};
