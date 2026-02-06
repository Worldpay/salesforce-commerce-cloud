'use strict';

var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
/**
 * Middleware to validate the remote IP address if the ValidateIPAddress custom preference is enabled.
 * Responds with error if validation fails, otherwise continues to next middleware.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 */
function validateIPMiddleware(req, res, next) {
    const isValidateIPAddress = Boolean(
        Site.getCurrent().getCustomPreferenceValue('ValidateIPAddress')
    );

    if (!isValidateIPAddress) {
        Logger.getLogger('awp').error('IP Address validation disabled');
        return next();
    }

    const utils = require('*/cartridge/scripts/utils');
    const remoteIpAddress = req.httpHeaders.get('x-forwarded-for') || '';
    const validateIPStatus = utils.validateIP(remoteIpAddress);
    if (validateIPStatus.error) {
        Logger.getLogger('awp').error(
            'IP Address validation failed for IP: ' + remoteIpAddress
        );

        next(new Error('IP Address validation failed'));
    }
    
    return next();
}

module.exports = validateIPMiddleware;
