'use strict';

var URL_ATTRIBUTES = ['href', 'src', 'action', 'formaction', 'xlink:href'];

function isSafeUrl(value) {
    if (!value || value.charAt(0) === '#') {
        return true;
    }

    try {
        var url = new URL(value, window.location.href);
        return ['http:', 'https:', 'mailto:', 'tel:'].indexOf(url.protocol) > -1;
    } catch (e) {
        return false;
    }
}

function getRedirectUrl(value) {
    try {
        var url = new URL(value, window.location.href);

        if (['http:', 'https:'].indexOf(url.protocol) === -1 || url.origin !== window.location.origin) {
            return null;
        }

        return url.href;
    } catch (e) {
        return null;
    }
}

function sanitizeElement(element) {
    Array.prototype.slice.call(element.attributes).forEach(function (attribute) {
        var name = attribute.name.toLowerCase();

        if (name.indexOf('on') === 0 || name === 'srcdoc') {
            element.removeAttribute(attribute.name);
        } else if (URL_ATTRIBUTES.indexOf(name) > -1 && !isSafeUrl(attribute.value)) {
            element.removeAttribute(attribute.name);
        }
    });
}

function sanitizeHtml(html) {
    var parsed = new DOMParser().parseFromString(String(html || ''), 'text/html');
    var fragment = document.createDocumentFragment();

    Array.prototype.slice.call(parsed.body.querySelectorAll('script, object, embed')).forEach(function (element) {
        element.parentNode.removeChild(element);
    });
    Array.prototype.slice.call(parsed.body.querySelectorAll('*')).forEach(sanitizeElement);

    while (parsed.body.firstChild) {
        fragment.appendChild(parsed.body.firstChild);
    }

    return fragment;
}

module.exports = {
    setSanitizedHtml: function ($target, html) {
        var target = $target && $target[0];

        if (target) {
            target.textContent = '';
            target.appendChild(sanitizeHtml(html));
        }
    },

    appendAlert: function ($target, className, message, dismissible) {
        var target = $target && $target[0];
        var alert = document.createElement('div');

        alert.className = className;
        alert.setAttribute('role', 'alert');

        if (dismissible) {
            var button = document.createElement('button');
            var closeText = document.createElement('span');

            button.type = 'button';
            button.className = 'close';
            button.setAttribute('data-dismiss', 'alert');
            button.setAttribute('aria-label', 'Close');
            closeText.setAttribute('aria-hidden', 'true');
            closeText.textContent = '\u00d7';
            button.appendChild(closeText);
            alert.appendChild(button);
        }

        alert.appendChild(document.createTextNode(message));

        if (target) {
            target.appendChild(alert);
        }
    },

    submitRedirectForm: function (action, fields) {
        var form = document.createElement('form');

        form.method = 'POST';
        form.action = action;

        Object.keys(fields).forEach(function (name) {
            var input = document.createElement('input');

            input.type = 'hidden';
            input.name = name;
            input.value = fields[name] == null ? '' : fields[name];
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
    },

    redirect: function (value) {
        var url = getRedirectUrl(value);

        if (!url) {
            return false;
        }

        window.location.assign(url);
        return true;
    }
};
