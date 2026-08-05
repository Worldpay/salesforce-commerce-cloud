'use strict';

var URLUtils = require('dw/web/URLUtils');

function getRouteArgs(routeArgs) {
    return Array.isArray(routeArgs) ? routeArgs : [];
}

function setFlashError(message) {
    if (message) {
        session.privacy.worldpayRedirectError = String(message);
    } else if (!empty(session.privacy.worldpayRedirectError)) {
        delete session.privacy.worldpayRedirectError;
    }
}

function getFlashError() {
    var errorMessage = !empty(session.privacy.worldpayRedirectError) ? session.privacy.worldpayRedirectError : null;

    if (errorMessage) {
        delete session.privacy.worldpayRedirectError;
    }

    return errorMessage;
}

function redirectToRoute(res, routeName, routeArgs) {
    res.redirect(URLUtils.url.apply(URLUtils, [routeName].concat(getRouteArgs(routeArgs))));
}

module.exports = {
    getFlashError: getFlashError,
    setFlashError: setFlashError,
    redirectToRoute: redirectToRoute,
    redirectWithFlashError: function (res, routeName, routeArgs, message) {
        setFlashError(message);
        redirectToRoute(res, routeName, routeArgs);
    }
};