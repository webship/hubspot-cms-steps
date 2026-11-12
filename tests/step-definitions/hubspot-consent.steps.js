'use strict';

// Step definitions for HubSpot's cookie consent banner and the choice it saves.
//
// What these steps rely on, all checked on public sites built on HubSpot CMS
// (huble.com, blendb2b.com, developers.hubspot.com, nanosurf.com):
//
//   - the banner: `#hs-banner-parent > #hs-eu-cookie-confirmation[role=dialog]`
//     with the buttons `#hs-eu-confirmation-button` (accept),
//     `#hs-eu-decline-button` and `#hs-eu-close-button` (dismiss); it only
//     shows when cookie consent is on for the visitor's region and the choice
//     was not made yet
//   - after a click the banner stays in the page, hidden, and HubSpot saves
//     the choice in the cookie `__hs_cookie_cat_pref`: `1:true_2:true_3:true`
//     after accept, `1:false_2:false_3:false` after decline (the numbers are
//     the cookie categories: analytics, functionality, advertisement)
//
// The product word is optional ("the HubSpot cookie banner" and "the cookie
// banner" both match).

const { Given, When, Then } = require('@cucumber/cucumber');
const { friendly } = require('webship-js/tests/step-definitions/webship');
const { budget, actOrExplain, poll } = require('./hubspot-helpers');

const COOKIE_BANNER = '#hs-eu-cookie-confirmation';
const COOKIE_ACCEPT = '#hs-eu-confirmation-button';
const COOKIE_DECLINE = '#hs-eu-decline-button';
const COOKIE_CLOSE = '#hs-eu-close-button';
const CONSENT_COOKIE = '__hs_cookie_cat_pref';

const COOKIE_HINT = 'The HubSpot cookie banner is `#hs-eu-cookie-confirmation` with `#hs-eu-confirmation-button`, `#hs-eu-decline-button` and `#hs-eu-close-button`; it only shows when cookie consent is enabled for the visitor\'s region and the choice has not been made yet (clear the cookie `__hs_cookie_cat_pref` to see it again).';

/**
 * Click a button of the cookie banner once it is visible.
 *
 * @param {object} world
 * @param {string} action   What the step does, for the error message.
 * @param {string} selector The button.
 */
async function clickBannerButton(world, action, selector) {
  const button = world.page.locator(selector).first();
  await actOrExplain(action, selector, async () => {
    await button.waitFor({ state: 'visible', timeout: budget(world) });
    await button.click();
  }, COOKIE_HINT);
}

/**
 * Read the saved consent: the decoded value of `__hs_cookie_cat_pref`, or null.
 *
 * @param {object} world
 * @returns {Promise<string|null>}
 */
async function savedConsent(world) {
  const cookies = await world.page.context().cookies();
  const cookie = cookies.find((c) => c.name === CONSENT_COOKIE);
  return cookie ? decodeURIComponent(cookie.value) : null;
}

/**
 * Accept the HubSpot cookie consent banner.
 *
 * Example #1: When I accept the cookie banner
 * Example #2: And I accept the cookie banner
 * Example #3: When we accept the cookie banner
 * Example #4: And accept the cookie banner
 * Example #5: When I accept the cookie banner
 *
 */
When(/^(I |we )*accept the cookie banner$/, async function (pronounCase) {
  await clickBannerButton(this, 'accept the cookie banner', COOKIE_ACCEPT);
});

/**
 * Decline the HubSpot cookie consent banner.
 *
 * Example #1: When I decline the cookie banner
 * Example #2: And I decline the cookie banner
 * Example #3: When we decline the cookie banner
 * Example #4: And decline the cookie banner
 * Example #5: When I decline the cookie banner
 *
 */
When(/^(I |we )*decline the cookie banner$/, async function (pronounCase) {
  await clickBannerButton(this, 'decline the cookie banner', COOKIE_DECLINE);
});

/**
 * Dismiss the HubSpot cookie banner with its close button (the "x" some
 * banners show), which closes the banner without choosing.
 *
 * Example #1: When I dismiss the cookie banner
 * Example #2: And I dismiss the cookie banner
 * Example #3: When we dismiss the cookie banner
 * Example #4: And dismiss the cookie banner
 * Example #5: When I dismiss the cookie banner
 *
 */
When(/^(I |we )*dismiss the cookie banner$/, async function (pronounCase) {
  await clickBannerButton(this, 'dismiss the cookie banner', COOKIE_CLOSE);
});

/**
 * Assert the HubSpot cookie banner is (or is not) visible. The negative
 * form passes when the banner was answered (it stays in the page, hidden) or
 * is absent.
 *
 * Example #1: Then the cookie banner should be visible
 * Example #2: Then the cookie banner should not be visible
 * Example #3: And the cookie banner should be visible
 * Example #4: But the cookie banner should not be visible
 * Example #5: Then I should see the cookie banner
 *
 */
Then(/^(?:(?:the )?cookie banner should( not)* be visible|(?:I |we )*should( not)* see the cookie banner)$/, async function (notVisible, notSee) {
  const absent = Boolean(notVisible || notSee);
  const timeout = budget(this);
  try {
    await this.page.locator(COOKIE_BANNER).first().waitFor({ state: absent ? 'hidden' : 'visible', timeout });
  } catch {
    throw friendly({
      message: absent ? 'Expected not to see the HubSpot cookie banner, but it is visible.' : `Expected the HubSpot cookie banner to be visible, but it did not appear within ${timeout} ms.`,
      hint: COOKIE_HINT,
    });
  }
});

/**
 * Assert the saved cookie consent: accepted (every category true), declined
 * (every category false) or saved (a choice was made, whichever it was). It
 * reads the cookie `__hs_cookie_cat_pref`.
 *
 * Example #1: Then the cookie consent should be accepted
 * Example #2: And the cookie consent should be declined
 * Example #3: Then the cookie consent should be saved
 * Example #4: But the cookie consent should not be saved
 * Example #5: Then cookie consent should not be accepted
 *
 */
Then(/^(?:the )?cookie consent should( not)* be (accepted|declined|saved)$/, async function (notCase, state) {
  let value = null;
  const matches = (v) => {
    if (v === null) return false;
    if (state === 'saved') return true;
    if (state === 'accepted') return /:true/.test(v) && !/:false/.test(v);
    return /:false/.test(v) && !/:true/.test(v);
  };
  const ok = await poll(this, async () => {
    value = await savedConsent(this);
    return matches(value) === !notCase;
  });
  if (!ok) {
    throw friendly({
      message: `Expected the cookie consent ${notCase ? 'not ' : ''}to be ${state}, but the cookie \`${CONSENT_COOKIE}\` is ${value === null ? 'not set' : `"${value}"`}.`,
      hint: 'HubSpot saves the visitor\'s choice in `__hs_cookie_cat_pref` (`1:true_2:true_3:true` after accept, `1:false_2:false_3:false` after decline); answer the banner first.',
    });
  }
});

/**
 * Start a scenario with the cookie consent already answered, so the banner
 * does not show: it sets the cookie `__hs_cookie_cat_pref` for the site.
 * Use it before the page is opened.
 *
 * Example #1: Given the cookie consent is accepted
 * Example #2: And the cookie consent is declined
 * Example #3: Given the cookie consent is accepted
 * Example #4: And the cookie consent is declined
 * Example #5: Given cookie consent is accepted
 *
 */
Given(/^(?:the )?cookie consent is (accepted|declined)$/, async function (state) {
  const flag = state === 'accepted' ? 'true' : 'false';
  await this.page.context().addCookies([{
    name: CONSENT_COOKIE,
    value: encodeURIComponent(`1:${flag}_2:${flag}_3:${flag}`),
    url: this.launchUrl,
    expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 180,
  }]);
});
