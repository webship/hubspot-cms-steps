// Minimal, offline stand-in for HubSpot's cookie banner and form runtime
// behaviour, so the demo site can be exercised in CI without a network
// call to HubSpot's CDN or forms API.
(function () {
  'use strict';

  function initCookieBanner() {
    var banner = document.getElementById('hs-eu-cookie-confirmation');
    if (!banner) return;
    var accept = document.getElementById('hs-eu-confirmation-button');
    var decline = document.getElementById('hs-eu-decline-button');
    if (accept) {
      accept.addEventListener('click', function () {
        document.cookie = '__hs_cookie_cat_pref=1; path=/';
        banner.setAttribute('hidden', 'hidden');
      });
    }
    if (decline) {
      decline.addEventListener('click', function () {
        document.cookie = '__hs_do_not_track=1; path=/';
        banner.setAttribute('hidden', 'hidden');
      });
    }
  }

  function initForms() {
    var forms = document.querySelectorAll('form[data-hs-demo-form]');
    forms.forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var required = form.querySelectorAll('[required]');
        var missing = Array.prototype.some.call(required, function (field) {
          return !field.value;
        });
        if (missing) {
          form.classList.add('hs-form-has-error');
          return;
        }
        var frame = form.closest('.hs-form-frame') || form.parentElement;
        var message = frame.querySelector('.submitted-message');
        form.setAttribute('hidden', 'hidden');
        if (message) message.removeAttribute('hidden');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initCookieBanner();
    initForms();
  });
})();
