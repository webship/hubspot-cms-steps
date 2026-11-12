'use strict';

// Entry point of @webship-js/hubspot-cms-steps: require this one file and the
// step definitions for websites built on HubSpot CMS are registered.
//
//   hubspot-site.steps.js        the page: a HubSpot page, its kind, the tracking
//                                code, chat, meetings, languages, canonical
//   hubspot-consent.steps.js     the cookie consent banner and the saved choice
//   hubspot-forms.steps.js       forms: fill, submit, validation, thank-you
//   hubspot-navigation.steps.js  the menu and the CTAs
//   hubspot-blog.steps.js        blog listings, posts, pagination, tags, authors
//   hubspot-search.steps.js      the site search and its results
//   hubspot-helpers.js           shared helpers (not a step file)
//
// The product word is optional in every sentence ("the HubSpot cookie banner"
// and "the cookie banner" both match), so a feature written for another pack
// reads here too. Every assertion waits for its condition for the
// `minWaitTime.page` budget (at least 10 s) and every failure is a friendly
// error with a hint, instead of a raw assertion or Playwright stack.

require('./hubspot-site.steps');
require('./hubspot-consent.steps');
require('./hubspot-forms.steps');
require('./hubspot-navigation.steps');
require('./hubspot-blog.steps');
require('./hubspot-search.steps');
