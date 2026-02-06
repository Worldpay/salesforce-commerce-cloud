/* eslint-disable no-underscore-dangle */

'use strict';

const Logger = require('dw/system/Logger');
const SvcReg = require('*/cartridge/scripts/service/createTokensGetSvc');

/**
 * Retrieves the latest token by the specified namespace.
 * 
 * @param {string} namespace - The namespace to filter tokens.
 * @returns {Object} - An object containing an error flag and the latest token or null.
 */
function getLatestTokenByNamespace(namespace) {
    try {
        const svc = SvcReg.createTokensGetSvc();
        const res = svc.call({ path: '/tokens?namespace=' + encodeURIComponent(namespace) });

        if (!res || res.status !== 'OK' || !res.object) {
            return { error: true, token: null };
        }
        const body = res.object.body;
        let list = null;

        if (body && body._embedded) {
            list = body._embedded.tokens || body._embedded.token || [];
        }

        if (!list || !list.length) {
            return { error: false, token: null };
        }

        list.sort(function(a, b){
            const da = new Date(a.createdAt || 0).getTime();
            const db = new Date(b.createdAt || 0).getTime();
            return db - da;
        });

        return { error: false, token: list[0] };
    } catch (e) {
        Logger.getLogger('awp').error('getLatestTokenByNamespace error: {0}', e.message);
        return { error: true, token: null };
    }
}

/**
 * Retrieves the details of a token by its selfHref.
 * 
 * @param {string} selfHref - The selfHref of the token to retrieve details for.
 * @returns {Object} - An object containing an error flag and the token details or null.
 */
function getTokenDetail(selfHref) {
    try {
        if (!selfHref) return { error: true };
        const svc = SvcReg.createTokensGetSvc();
        const res = svc.call({ path: selfHref });
        if (!res || res.status !== 'OK' || !res.object) return { error: true };
        return { error: false, detail: res.object.body };
    } catch (e) {
        return { error: true };
    }
}
/**
 * Deletes a token by its href.
 * 
 * @param {string} href - The href of the token to delete.
 * @returns {Object} - An object containing an error flag, code, and body or exception.
 */
function deleteTokenByHref(href) {
    try {
        const svc = SvcReg.deleteTokenDeleteSvc();
        const res = svc.call({ href: href });
        if (!res || res.status !== 'OK' || !res.object) {
            Logger.getLogger('awp').error('deleteTokenByHref: service error href={0}', href);
            return { error: true };
        }
        const code = res.object.code;
        if (code === 204 || code === 200 || code === 202 || code === 404) {
            return { error: false, code: code, body: res.object.body };
        }
        return { error: true, code: code, body: res.object.body };
    } catch (e) {
        Logger.getLogger('awp').error('deleteTokenByHref ex: {0}', e);
        return { error: true, ex: e };
    }
}

module.exports = {
    getLatestTokenByNamespace: getLatestTokenByNamespace,
    getTokenDetail: getTokenDetail,
    deleteTokenByHref: deleteTokenByHref
};
