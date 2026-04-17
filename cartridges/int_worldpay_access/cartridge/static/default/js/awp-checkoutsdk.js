(function () {
  'use strict';

  var state = {
    initialized: false,
    checkout: null,
    generating: false,
    initializing: false
  };

  var WEB_SAFE_FONTS = [
    'Georgia, serif',
    'Palatino Linotype,Book Antiqua, Palatino, serif',
    'Times New Roman, Times, serif',
    'Arial, Helvetica, sans-serif',
    'Arial Black, Gadget, sans-serif',
    'Comic Sans MS, Cursive, sans-serif',
    'Impact, Charcoal, sans-serif',
    'Lucida Sans Unicode, sans-serif',
    'Lucida Sans Unicode, Lucida Grande, sans-serif',
    'Tahoma, Geneva, sans-serif',
    'Trebuchet MS, Helvetica, sans-serif',
    'Verdana, Geneva, sans-serif'
  ];

  function readStyleConfig() {
    if (window.awpCheckoutSdkStyleConfig && typeof window.awpCheckoutSdkStyleConfig === 'object') {
      return window.awpCheckoutSdkStyleConfig;
    }
    var el = document.getElementById('awp-checkoutsdk-style-config');
    if (!el) return null;
    var raw = el.textContent || el.innerText || '';
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function normalizeFontFamily(val) {
    return String(val || '')
      .replace(/\s*,\s*/g, ',')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function isWebSafeFont(val) {
    if (!val) return false;
    var norm = normalizeFontFamily(val);
    for (var i = 0; i < WEB_SAFE_FONTS.length; i++) {
      if (normalizeFontFamily(WEB_SAFE_FONTS[i]) === norm) return true;
    }
    return false;
  }

  function getPrefValue(prefs, key) {
    if (!prefs || !Object.prototype.hasOwnProperty.call(prefs, key)) return '';
    var val = prefs[key];
    if (val === null || typeof val === 'undefined') return '';
    return String(val).trim();
  }

  function setStyleProp(styles, selector, prop, val) {
    if (!val) return;
    if (!styles[selector]) styles[selector] = {};
    styles[selector][prop] = val;
  }

  function getDefaultStyles() {
    return {
      input: {
        'font-size': '16px',
        'line-height': '1.5',
        padding: '8px 12px',
        color: '#212529'
      },
      '::placeholder': {
        color: '#6c757d'
      }
    };
  }

  function cloneStyles(src) {
    var out = {};
    var key;
    for (key in src) {
      if (!Object.prototype.hasOwnProperty.call(src, key)) continue;
      out[key] = {};
      var props = src[key];
      var p;
      for (p in props) {
        if (Object.prototype.hasOwnProperty.call(props, p)) {
          out[key][p] = props[p];
        }
      }
    }
    return out;
  }

  function mergeStyles(base, custom) {
    var out = cloneStyles(base);
    var sel;
    for (sel in custom) {
      if (!Object.prototype.hasOwnProperty.call(custom, sel)) continue;
      if (!out[sel]) out[sel] = {};
      var props = custom[sel];
      var p;
      for (p in props) {
        if (Object.prototype.hasOwnProperty.call(props, p)) {
          out[sel][p] = props[p];
        }
      }
    }
    return out;
  }

  function buildCustomStyles(prefs) {
    var styles = {};

    var val = getPrefValue(prefs, 'CheckoutSdkInputColor');
    setStyleProp(styles, 'input', 'color', val);

    val = getPrefValue(prefs, 'CheckoutSdkInputFontFamily');
    setStyleProp(styles, 'input', 'font-family', val);

    val = getPrefValue(prefs, 'CheckoutSdkInputFontSize');
    setStyleProp(styles, 'input', 'font-size', val);

    val = getPrefValue(prefs, 'CheckoutSdkInputFontStyle');
    setStyleProp(styles, 'input', 'font-style', val);

    val = getPrefValue(prefs, 'CheckoutSdkInputLineHeight');
    setStyleProp(styles, 'input', 'line-height', val);

    val = getPrefValue(prefs, 'CheckoutSdkInputTextAlign');
    setStyleProp(styles, 'input', 'text-align', val);

    val = getPrefValue(prefs, 'CheckoutSdkInputFontWeight');
    setStyleProp(styles, 'input', 'font-weight', val);

    val = getPrefValue(prefs, 'CheckoutSdkInputLetterSpacing');
    setStyleProp(styles, 'input', 'letter-spacing', val);

    val = getPrefValue(prefs, 'CheckoutSdkInputTextTransform');
    setStyleProp(styles, 'input', 'text-transform', val);

    val = getPrefValue(prefs, 'CheckoutSdkInputCaretColor');
    setStyleProp(styles, 'input', 'caret-color', val);

    val = getPrefValue(prefs, 'CheckoutSdkValidColor');
    setStyleProp(styles, 'input.is-valid', 'color', val);
    setStyleProp(styles, '.is-valid', 'color', val);

    val = getPrefValue(prefs, 'CheckoutSdkInvalidColor');
    setStyleProp(styles, 'input.is-invalid', 'color', val);
    setStyleProp(styles, '.is-invalid', 'color', val);


    val = getPrefValue(prefs, 'CheckoutSdkOnFocusColor');
    setStyleProp(styles, 'input.is-onfocus', 'color', val);
    setStyleProp(styles, '.is-onfocus', 'color', val);

    val = getPrefValue(prefs, 'CheckoutSdkValidFontWeight');
    setStyleProp(styles, 'input.is-valid', 'font-weight', val);
    setStyleProp(styles, '.is-valid', 'font-weight', val);

    val = getPrefValue(prefs, 'CheckoutSdkInvalidFontWeight');
    setStyleProp(styles, 'input.is-invalid', 'font-weight', val);
    setStyleProp(styles, '.is-invalid', 'font-weight', val);

    val = getPrefValue(prefs, 'CheckoutSdkOnFocusFontWeight');
    setStyleProp(styles, 'input.is-onfocus', 'font-weight', val);
    setStyleProp(styles, '.is-onfocus', 'font-weight', val);

    return styles;
  }

  function applyCardholderStyles(prefs) {
    var input = document.getElementById('wpCardholderName');
    if (!input) return;

    var val = getPrefValue(prefs, 'CheckoutSdkInputColor');
    if (val) input.style.color = val;

    val = getPrefValue(prefs, 'CheckoutSdkInputFontFamily');
    if (val) input.style.fontFamily = val;

    val = getPrefValue(prefs, 'CheckoutSdkInputFontSize');
    if (val) input.style.fontSize = val;
    input.style.height = '38px';
    input.style.minHeight = '38px';
    input.style.lineHeight = '1.5';
    input.style.padding = '8px 12px';

    val = getPrefValue(prefs, 'CheckoutSdkInputFontStyle');
    if (val) input.style.fontStyle = val;

    val = getPrefValue(prefs, 'CheckoutSdkInputLineHeight');
    if (val) input.style.lineHeight = val;

    val = getPrefValue(prefs, 'CheckoutSdkInputTextAlign');
    if (val) input.style.textAlign = val;

    val = getPrefValue(prefs, 'CheckoutSdkInputFontWeight');
    if (val) input.style.fontWeight = val;

    val = getPrefValue(prefs, 'CheckoutSdkInputLetterSpacing');
    if (val) input.style.letterSpacing = val;

    val = getPrefValue(prefs, 'CheckoutSdkInputTextTransform');
    if (val) input.style.textTransform = val;

    val = getPrefValue(prefs, 'CheckoutSdkInputCaretColor');
    if (val) input.style.caretColor = val;

  }

  function buildStylesConfig() {
    var prefs = readStyleConfig() || {};
    var defaults = getDefaultStyles();
    var custom = buildCustomStyles(prefs);
    var styles = mergeStyles(defaults, custom);
    var hasCustom = Object.keys(custom).length > 0;
    return {
      styles: styles,
      hasCustom: hasCustom
    };
  }

  function blockEl() {
    return document.querySelector('[data-worldpay-checkoutsdk]');
  }

  function billingForm() {
    return document.querySelector('form[action*="CheckoutServices-SubmitPayment"]') || document.querySelector('form');
  }

  function sessionHidden() {
    return document.getElementById('worldpaySessionState');
  }


  function selectedPaymentMethodId() {
    var radio = document.querySelector(
      'input[type="radio"][name*="paymentMethod"]:checked,' +
      'input[type="radio"][name*="selectedPaymentMethod"]:checked,' +
      'input[type="radio"][name*="paymentMethods"]:checked'
    );
    if (radio && radio.value) return String(radio.value);

    var hidden = document.querySelector(
      'input[type="hidden"][name*="paymentMethod"],' +
      'input[type="hidden"][name*="selectedPaymentMethod"],' +
      'input[type="hidden"][name*="paymentMethods"]'
    );
    if (hidden && hidden.value) return String(hidden.value);

    return null;
  }

  function isCreditCard() {
    return selectedPaymentMethodId() === 'WORLDPAY_CHECKOUTSDK';
  }

  function isUsingSavedCard() {
    var useSaved = document.getElementById('awpUseSavedCard');
    return !!(useSaved && useSaved.checked);
  }

  function showBlock() {
    var el = blockEl();
    if (el) el.classList.remove('d-none');
  }

  function hideBlock() {
    var el = blockEl();
    if (el) el.classList.add('d-none');
  }

  function clearSessionState() {
    var h = sessionHidden();
    if (h) h.value = '';
  }


  function initIfNeeded() {
    if (state.initialized || state.initializing) return;

    var el = blockEl();
    if (!el) return;

    if (!window.Worldpay || !Worldpay.checkout || typeof Worldpay.checkout.init !== 'function') {
      setTimeout(initIfNeeded, 150);
      return;
    }

    var checkoutId = el.getAttribute('data-checkout-id');
    if (!checkoutId) return;

    var form = billingForm();
    if (!form) return;
    if (!form.id) form.id = 'worldpay-card-form';

    var prefs = readStyleConfig() || {};
    applyCardholderStyles(prefs);
    var styleConfig = buildStylesConfig();
    state.initializing = true;

    function doInit(styles, allowFallback) {
      Worldpay.checkout.init(
        {
          id: checkoutId,
          form: '#' + form.id,
          fields: {
            pan: { selector: '#card-pan', placeholder: '4444 3333 2222 1111' },
            expiry: { selector: '#card-expiry', placeholder: 'MM/YY' },
            cvv: { selector: '#card-cvv', placeholder: '123' }
          },
          styles: styles
        },
        function (error, checkout) {
          if (error) {
            if (allowFallback) {
              return doInit(getDefaultStyles(), false);
            }
            state.initializing = false;
            return;
          }
          state.checkout = checkout;
          state.initialized = true;
          state.initializing = false;
        }
      );
    }

    doInit(styleConfig.styles, styleConfig.hasCustom);
  }


  function syncVisibility() {
    if (!blockEl()) return;

    if (isCreditCard() && !isUsingSavedCard()) {
      showBlock();
      initIfNeeded();
    } else {
      hideBlock();
      clearSessionState();
    }

    if (isCreditCard() && isUsingSavedCard()) {
      clearSessionState();
    }
  }

  function shouldHandleWorldpay() {
    var el = blockEl();
    if (!el) return false;
    if (el.classList.contains('d-none')) return false;
    if (!isCreditCard()) return false;
    if (isUsingSavedCard()) return false;
    return true;
  }

  function shouldHandleSavedCard() {
    if (!isCreditCard()) return false;
    return isUsingSavedCard();
  }

  function generateSessionState(cb) {
    var hidden = sessionHidden();
    if (!hidden) return cb(false);

    if (hidden.value) return cb(true); 

    if (!state.checkout || typeof state.checkout.generateSessionState !== 'function') return cb(false);
    if (state.generating) return cb(false);

    state.generating = true;

    state.checkout.generateSessionState(function (err, sessionState) {
      state.generating = false;

      if (err) {
        return cb(false);
      }

      hidden.value = sessionState || '';
      return cb(!!hidden.value);
    });
  }

  function interceptSubmitPaymentClick() {
    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest
        ? e.target.closest('.submit-payment, .place-order')
        : null;
      if (!btn) return;

      if (shouldHandleSavedCard()) return;

      if (!shouldHandleWorldpay()) return;

      var hidden = sessionHidden();
      if (hidden && hidden.value) return;

      if (btn.dataset && btn.dataset.wpBypass === '1') {
        btn.dataset.wpBypass = '0';
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      generateSessionState(function (ok) {
        if (!ok) return;

        btn.dataset.wpBypass = '1';
        btn.click();
      });
    }, true);

    document.addEventListener('submit', function (e) {
      var form = billingForm();
      if (!form || e.target !== form) return;

      if (shouldHandleSavedCard()) return;

      if (!shouldHandleWorldpay()) return;

      var hidden = sessionHidden();
      if (hidden && hidden.value) return;

      e.preventDefault();
      e.stopPropagation();

      generateSessionState(function (ok) {
        if (!ok) return;
        form.submit();
      });
    }, true);
  }

  function main() {
    syncVisibility();

    document.addEventListener('change', function () { setTimeout(syncVisibility, 0); }, true);
    document.addEventListener('click', function () { setTimeout(syncVisibility, 0); }, true);

    interceptSubmitPaymentClick();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
