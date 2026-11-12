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

  // The messages HubSpot's forms show by default (see the validation message
  // tables in HubSpot's developer documentation).
  var REQUIRED = 'Please complete this required field.';
  var REQUIRED_ALL = 'Please complete all required fields.';
  var BAD_EMAIL = 'Email must be formatted correctly.';

  function errorList(message) {
    var list = document.createElement('ul');
    list.className = 'no-list hs-error-msgs inputs-list';
    list.setAttribute('role', 'alert');
    var item = document.createElement('li');
    var label = document.createElement('label');
    label.className = 'hs-error-msg hs-main-font-element';
    label.textContent = message;
    item.appendChild(label);
    list.appendChild(item);
    return list;
  }

  function clearErrors(form) {
    form.querySelectorAll('.hs-error-msgs, .hs_error_rollup').forEach(function (node) {
      var holder = node.closest('.hs_error_rollup') || node;
      holder.remove();
    });
    form.querySelectorAll('.hs-input.invalid').forEach(function (input) {
      input.classList.remove('invalid', 'error');
    });
  }

  // Behaves like a legacy HubSpot form: client-side validation that marks the
  // input `invalid error` and adds `ul.hs-error-msgs` after it, one more error
  // for the whole form, and a `div.submitted-message` in place of the form.
  function initForms() {
    var forms = document.querySelectorAll('form.hs-form');
    forms.forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        clearErrors(form);
        var failed = false;
        form.querySelectorAll('.hs-form-field').forEach(function (wrapper) {
          var input = wrapper.querySelector('input, select, textarea');
          if (!input || input.type === 'hidden') return;
          var message = null;
          if (input.required && !input.value) message = REQUIRED;
          else if (input.type === 'email' && input.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value)) message = BAD_EMAIL;
          if (message) {
            failed = true;
            input.classList.add('invalid', 'error');
            wrapper.appendChild(errorList(message));
          }
        });
        if (failed) {
          var rollup = document.createElement('div');
          rollup.className = 'hs_error_rollup';
          rollup.appendChild(errorList(REQUIRED_ALL));
          form.insertBefore(rollup, form.querySelector('.hs_submit'));
          return;
        }
        var holder = form.parentElement;
        var message = document.createElement('div');
        message.className = 'submitted-message';
        message.innerHTML = '<p>Thanks, we received your message and will be in touch shortly.</p>';
        form.remove();
        holder.appendChild(message);
      });
    });
  }

  // A CTA's href is HubSpot's tracking redirect (/cs/c/?cta_guid=...), which
  // sends the visitor on to the address in `cta_dest_link`. Do the same offline.
  function initCtas() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest && event.target.closest('a.cta_button[cta_dest_link]');
      if (!link) return;
      event.preventDefault();
      window.location.href = link.getAttribute('cta_dest_link');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initCtas();
    initCookieBanner();
    initForms();
  });
})();
