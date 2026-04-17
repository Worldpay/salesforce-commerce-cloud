(function () {

    function create_uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            var v = (c === 'x') ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function getOrCreateTmxSessionId() {
        var key = 'awp_tmx_session_id';
        var sid = '';

        try {
            sid = window.sessionStorage.getItem(key);
            if (!sid) {
                sid = create_uuid();
                window.sessionStorage.setItem(key, sid);
            }
        } catch (e) {
            sid = create_uuid();
        }

        return sid;
    }

    function getCsrfPair() {
        try {
            var el = document.querySelector('input[type="hidden"][name*="csrf"]');
            if (!el) return { name: '', value: '' };
            return { name: el.name || '', value: el.value || '' };
        } catch (e) {
            return { name: '', value: '' };
        }
    }

    function get3dsDeviceData() {
        var data = {};
        try {
            data.browserLanguage = (navigator.language || navigator.userLanguage || '').toString();
            data.browserScreenHeight = (window.screen && window.screen.height) ? window.screen.height : '';
            data.browserScreenWidth = (window.screen && window.screen.width) ? window.screen.width : '';
            data.browserColorDepth = (window.screen && window.screen.colorDepth) ? window.screen.colorDepth : '';
            data.timeZone = new Date().getTimezoneOffset();
            data.browserJavaEnabled = (navigator.javaEnabled && typeof navigator.javaEnabled === 'function') ? navigator.javaEnabled() : false;
            data.browserJavascriptEnabled = true;
            data.channel = 'browser';
        } catch (e) {}
        return data;
    }

    function postTmxSessionId(sessionId) {
        if (!window.awpSaveDeviceDataUrl) return;

        var csrf = getCsrfPair();
        var body = 'tmxSessionId=' + encodeURIComponent(sessionId);

        var dd = get3dsDeviceData();
        Object.keys(dd).forEach(function (k) {
            if (dd[k] === undefined || dd[k] === null || dd[k] === '') return;
            body += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(dd[k]);
        });

        if (csrf.name && csrf.value) body += '&' + encodeURIComponent(csrf.name) + '=' + encodeURIComponent(csrf.value);

        try {
            fetch(window.awpSaveDeviceDataUrl, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                body: body
            }).catch(function(){});
        } catch (e) {}
    }

    function initDeviceData() {
        if (!window.awpProfilingDomain || !window.awpOrgId) return;

        if (typeof qxdc === 'undefined' || typeof qxdc.prfl !== 'function') return;

        var sessionId = getOrCreateTmxSessionId();

        qxdc.prfl(window.awpProfilingDomain, window.awpOrgId, sessionId);

        postTmxSessionId(sessionId);
    }

    document.addEventListener('DOMContentLoaded', initDeviceData);

})();
