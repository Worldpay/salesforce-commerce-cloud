(function () {
    function parseMessage(data) {
        if (!data) return null;
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            } catch (e) {
                return null;
            }
        }
        return data;
    }

    function postCollectionReference(url, sessionId) {
        if (!url) return;
        var body = 'collectionReference=' + encodeURIComponent(sessionId || '');
        try {
            fetch(url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                body: body
            }).then(function (res) {
                return res.json();
            }).then(function (json) {
                if (json && json.redirectUrl) {
                    window.top.location.href = json.redirectUrl;
                }
            }).catch(function () {});
        } catch (e) {}
    }

    function init3dsDdc() {
        if (!window.awp3ds || !window.awp3ds.supplyUrl) return;

        var supplyUrl = window.awp3ds.supplyUrl;
        var allowedOrigin = window.awp3ds.ddcOrigin || '';
        var posted = false;

        function handleMessage(evt) {
            if (allowedOrigin && evt.origin !== allowedOrigin) return;
            var msg = parseMessage(evt.data);
            if (!msg || msg.MessageType !== 'profile.completed') return;

            if (posted) return;
            posted = true;

            postCollectionReference(supplyUrl, msg.SessionId || '');
        }

        window.addEventListener('message', handleMessage, false);

        var timeoutMs = window.awp3ds.timeoutMs || 8000;
        setTimeout(function () {
            if (!posted) {
                posted = true;
                postCollectionReference(supplyUrl, '');
            }
        }, timeoutMs);
    }

    document.addEventListener('DOMContentLoaded', init3dsDdc);
})();
