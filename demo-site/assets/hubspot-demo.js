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

  // The corpus the offline search looks through: the pages and the blog posts.
  var CORPUS = [
    { title: 'Acme Analytics | Home', url: '/index.html', text: 'Turn website visitors into customers. Real-time funnel reporting, landing pages and A/B testing.' },
    { title: 'Pricing', url: '/pricing.html', text: 'Simple, transparent pricing for every team.' },
    { title: 'About Acme Analytics', url: '/about-us.html', text: 'Learn about the company and its team.' },
    { title: 'Contact us', url: '/contact-us.html', text: 'Tell us a bit about yourself and we will be in touch.' },
    { title: 'Testing a multilingual HubSpot site', url: '/blog/multilingual-hubspot-sites.html', text: 'Language switchers and translated pages need their own scenarios.' },
    { title: 'Testing HubSpot forms without sending them', url: '/blog/testing-hubspot-forms.html', text: 'Validation errors can be tested without sending a single submission.' },
    { title: 'Automating website QA with webship-js', url: '/blog/automating-website-qa.html', text: 'How we replaced manual click-throughs with Cucumber scenarios.' },
    { title: '5 tips for testing a HubSpot CMS site', url: '/blog/hubspot-cms-tips.html', text: 'Forms, CTAs, and cookie banners each need their own testing strategy.' },
    { title: 'Why BDD testing matters for marketing sites', url: '/blog/why-bdd-testing-matters.html', text: 'Gherkin scenarios keep your landing pages honest as they change.' }
  ];

  function escapeHtml(text) {
    return text.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  // Renders the default HubSpot search results markup (`.hs-search-results`).
  function initSearchResults() {
    var root = document.querySelector('[data-demo-search-results]');
    if (!root) return;
    var term = (new URLSearchParams(window.location.search).get('q') || '').trim();
    var needle = term.toLowerCase();
    var hits = needle ? CORPUS.filter(function (item) {
      return (item.title + ' ' + item.text).toLowerCase().indexOf(needle) !== -1;
    }) : [];
    if (!hits.length) {
      root.innerHTML = '<div class="hs-search__no-results"><p>Sorry. There were no results for \u201d' + escapeHtml(term) + '\u201d.</p><p>Try rewording your query, or browse through our site.</p></div>';
      return;
    }
    root.innerHTML = '<p class="hs-search-results__message" role="status">Displaying 1 \u2013 ' + hits.length + ' of ' + hits.length + ' results</p>'
      + '<ul class="hs-search-results__listing">' + hits.map(function (item) {
        return '<li class="hs-search-results__listing__item"><div class="hs-search-results__content">'
          + '<a class="hs-search-results__link" href="' + item.url + '"><h2 class="hs-search-results__title">' + escapeHtml(item.title) + '</h2></a>'
          + '<p class="hs-search-results__description">' + escapeHtml(item.text) + '</p></div></li>';
      }).join('') + '</ul>';
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
    initSearchResults();
    initCookieBanner();
    initForms();
  });
})();
