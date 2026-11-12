'use strict';

// Step definitions for the site search of a HubSpot CMS site.
//
// What these steps rely on, all checked on public sites built on HubSpot CMS:
//
//   - the search field: `.hs-search-field` holding `form.hs-search-field__form`
//     (its action is `/hs-search-results`) with `input.hs-search-field__input`
//     named `q`; a theme often hides the field until a search button is clicked
//   - the default search results page (`/hs-search-results?q=<term>`):
//     `.hs-search-results`, `p.hs-search-results__message` ("Displaying 1 - 10
//     of 316 results"), `ul.hs-search-results__listing` with one
//     `li.hs-search-results__listing__item` per result, each holding
//     `a.hs-search-results__link > h2.hs-search-results__title`; when nothing
//     matches, the page says "Sorry. There were no results for ..."
//
// The product word is optional ("the HubSpot search" and "the search" both match).

const { When, Then } = require('@cucumber/cucumber');
const { friendly, smartSettle } = require('webship-js/tests/step-definitions/webship');
const { budget, literal, actOrExplain, poll, pause } = require('./hubspot-helpers');

const SEARCH_INPUT = 'input.hs-search-field__input, .hs-search-field input[type="search"], .hs-search-field input[name="q"], form[action*="hs-search-results"] input[name="q"], input[type="search"]';
const SEARCH_TOGGLE = 'button[aria-label*="earch" i], a[aria-label*="earch" i], [class*="search"][class*="toggle"], [class*="search-toggle"], [class*="search-icon"]';
const RESULT_ITEMS = '.hs-search-results__listing__item';
const RESULT_TITLES = '.hs-search-results__title, .hs-search-results__link';

const SEARCH_HINT = 'The search field is `input.hs-search-field__input` (inside `.hs-search-field`) or any `input[type="search"]`; when the theme hides it behind a search button, the step clicks that button first.';
const RESULTS_HINT = 'The default search results page lists each result as `li.hs-search-results__listing__item` with its title in `.hs-search-results__title`; run a search first.';

/**
 * The first visible search input, opening a hidden search first when a search
 * button is there to click.
 *
 * @param {object} world
 * @returns {Promise<import('playwright').Locator|null>}
 */
async function visibleSearchInput(world) {
  const inputs = world.page.locator(SEARCH_INPUT);
  const find = async () => {
    const count = await inputs.count();
    for (let i = 0; i < count; i += 1) {
      if (await inputs.nth(i).isVisible().catch(() => false)) return inputs.nth(i);
    }
    return null;
  };
  let input = await poll(world, find, 3000);
  if (input) return input;
  const toggles = world.page.locator(SEARCH_TOGGLE);
  const count = await toggles.count();
  for (let i = 0; i < count && !input; i += 1) {
    if (await toggles.nth(i).isVisible().catch(() => false)) {
      await toggles.nth(i).click().catch(() => {});
      await pause(world.page, 300);
      input = await poll(world, find, 2000);
    }
  }
  return input;
}

/**
 * Assert the page does (or does not) have a site search field.
 *
 * Example #1: Then the page should have a site search
 * Example #2: And the page should have a site search
 * Example #3: Then this page should have a site search
 * Example #4: But the page should not have a site search
 * Example #5: Then page should not have a site search
 *
 */
Then(/^(?:the |this )?page should( not)* have a site search$/, async function (notCase) {
  const ok = await poll(this, async () => ((await this.page.locator(SEARCH_INPUT).count()) > 0) === !notCase);
  if (!ok) {
    throw friendly({
      message: notCase ? 'Expected the page not to have a site search, but it has one.' : `Expected the page to have a site search (${SEARCH_INPUT}), but there is none.`,
      hint: SEARCH_HINT,
    });
  }
});

/**
 * Search the site: type the term into the search field and press Enter, then
 * wait for the results page.
 *
 * Example #1: When I search the site for "pricing"
 * Example #2: And I search the site for "forms"
 * Example #3: When we search the site for "HubSpot"
 * Example #4: And search the site for "webship-js"
 * Example #5: When I search the site for "zzzzqqq"
 *
 */
When(/^(I |we )*search the site for "([^"]*)"$/, async function (pronounCase, term) {
  const input = await visibleSearchInput(this);
  if (!input) {
    throw friendly({ action: 'search the site', target: term, hint: SEARCH_HINT });
  }
  await actOrExplain('search the site', term, async () => {
    await input.fill(term);
    await input.press('Enter');
  }, SEARCH_HINT);
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 3000);
});

/**
 * Assert the search results list at least N results.
 *
 * Example #1: Then the search results should list at least 1 result
 * Example #2: And the search results should list at least 3 results
 * Example #3: Then the search results should list at least 2 results
 * Example #4: And the search results should list at least 1 results
 * Example #5: Then search results should list at least 5 results
 *
 */
Then(/^(?:the )?search results should list at least (\d+) results?$/, async function (minimumStr) {
  const minimum = Number(minimumStr);
  let count = 0;
  const ok = await poll(this, async () => {
    count = await this.page.locator(RESULT_ITEMS).count();
    return count >= minimum;
  });
  if (!ok) {
    throw friendly({ message: `Expected at least ${minimum} search result(s), found ${count}.`, hint: RESULTS_HINT });
  }
});

/**
 * Assert the search found nothing: the results page lists no result and says
 * so.
 *
 * Example #1: Then the search should find no results
 * Example #2: And the search should find no results
 * Example #3: And the search should find no results
 * Example #4: But the search should find no results
 * Example #5: Then search should find no results
 *
 */
Then(/^(?:the )?search should find no results$/, async function () {
  let count = 0;
  let said = false;
  const ok = await poll(this, async () => {
    count = await this.page.locator(RESULT_ITEMS).count();
    said = await this.page.evaluate(() => /no results|nothing (was )?found|did not match/i.test((document.querySelector('.hs-search-results, main') || document.body).innerText || ''));
    return count === 0 && said;
  });
  if (!ok) {
    throw friendly({
      message: count > 0 ? `Expected the search to find no results, but it listed ${count}.` : 'The search listed no results, but the page does not say so ("no results").',
      hint: RESULTS_HINT,
    });
  }
});

/**
 * Assert the search results do (or do not) include a result whose title
 * contains the text.
 *
 * Example #1: Then the search results should include "Pricing"
 * Example #2: And the search results should include "5 tips for testing a HubSpot CMS site"
 * Example #3: Then the search results should include "forms"
 * Example #4: But the search results should not include "Contact us"
 * Example #5: Then search results should not include "Checkout"
 *
 */
Then(/^(?:the )?search results should( not)* include "([^"]*)"$/, async function (notCase, text) {
  const titles = this.page.locator(RESULT_ITEMS).locator(RESULT_TITLES).filter({ hasText: literal(text) });
  let all = [];
  const ok = await poll(this, async () => {
    all = await this.page.locator(RESULT_ITEMS).locator('.hs-search-results__title').allTextContents().catch(() => []);
    return ((await titles.count()) > 0) === !notCase;
  });
  if (!ok) {
    throw friendly({
      message: notCase
        ? `Expected the search results not to include "${text}", but they do.`
        : `Expected the search results to include "${text}" within ${budget(this)} ms, found: ${all.length ? all.map((t) => `"${t.trim()}"`).join(', ') : 'no results'}.`,
      hint: RESULTS_HINT + ' The match is case-sensitive and looks at the result titles.',
    });
  }
});

/**
 * Open a search result by its title.
 *
 * Example #1: When I open the search result "Pricing"
 * Example #2: And I open the search result "5 tips for testing a HubSpot CMS site"
 * Example #3: When we open the search result "Contact us"
 * Example #4: And open the search result "About Acme Analytics"
 * Example #5: When I open the search result "Pricing"
 *
 */
When(/^(I |we )*open the search result "([^"]*)"$/, async function (pronounCase, title) {
  const link = this.page.locator(RESULT_ITEMS).locator('a.hs-search-results__link').filter({ hasText: literal(title) }).first();
  await actOrExplain('open the search result', title, async () => {
    await link.waitFor({ state: 'visible', timeout: budget(this) });
    await link.click();
  }, RESULTS_HINT);
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 3000);
});
