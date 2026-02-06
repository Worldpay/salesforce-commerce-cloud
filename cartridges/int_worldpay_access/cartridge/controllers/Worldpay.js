'use strict';

const server = require('server');
const Logger = require('dw/system/Logger').getLogger('awp');
const validateIPMiddleware = require('*/cartridge/scripts/middleware/validateIPMiddleware');

/**
 * Creates the accessOrderNotifyUpdate custom object from the request body.
 * @function createAccessOrderNotifyUpdateFromRequest
 * @param {SfraRequest} req - The request object.
 * @returns {dw.object.CustomObject|null} The created custom object or null if failed.
 */
function createAccessOrderNotifyUpdateFromRequest(req) {
    const {
        upsert
    } = require('*/cartridge/scripts/helpers/notifications/coHelper');
    var body = req.body || '';
    Logger.debug(
        'Worldpay-Notify : Add Custom Object : body value is : ' + body
    );

    var payload;
    try {
        payload = JSON.parse(body);
    } catch (e) {
        return null;
    }
    var orderNo =
        payload.eventDetails && payload.eventDetails.transactionReference;
    if (!orderNo) return null;

    return upsert(orderNo, body);
}

server.post(
    'Notify',
    server.middleware.https,
    validateIPMiddleware,
    function (req, res, next) {
        var customObject = createAccessOrderNotifyUpdateFromRequest(req);
        if (!customObject) {
            Logger.error(
                'Worldpay-Notify : Failed to create accessOrderNotifyUpdate custom object.'
            );
            res.setStatusCode(400);
            res.json({
                error: true,
                message:
                    'Failed to create accessOrderNotifyUpdate custom object.'
            });
            return next();
        }

        res.setStatusCode(200);
        res.json({
            error: false,
            success: true
        });
        return next();
    }
);

module.exports = server.exports();
