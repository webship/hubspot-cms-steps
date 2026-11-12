'use strict';

// Step definitions for what a HubSpot CMS page says about itself.
//
// What these steps rely on, all checked on public sites built on HubSpot CMS:
//
//   - the body classes HubSpot's `builtin_body_classes` adds (sometimes to a
//     wrapper element instead of the `body`): `hs-site-page`, `hs-landing-page`,
//     `hs-blog-listing`, `hs-blog-post`, plus `hs-content-id-<id>` and
//     `hs-content-path-<path>`
//
// The product word is optional ("the HubSpot page" and "the page" both match).

const { Then } = require('@cucumber/cucumber');
const { friendly } = require('webship-js/tests/step-definitions/webship');
const { budget, poll } = require('./hubspot-helpers');

const PAGE_KINDS = {
  website: { selector: '.hs-site-page', label: 'website page' },
  landing: { selector: '.hs-landing-page', label: 'landing page' },
  'blog listing': { selector: '.hs-blog-listing', label: 'blog listing page' },
  'blog post': { selector: '.hs-blog-post', label: 'blog post page' },
};

/**
 * Assert the page is (or is not) of a HubSpot kind: a website page, a landing
 * page, a blog listing page or a blog post page. HubSpot marks each with a
 * class (`hs-site-page`, `hs-landing-page`, `hs-blog-listing`, `hs-blog-post`)
 * on the body, whatever the theme.
 *
 * Example #1: Then the page should be a HubSpot website page
 * Example #2: Then the page should be a HubSpot landing page
 * Example #3: And the page should be a HubSpot blog listing page
 * Example #4: And this page should be a HubSpot blog post page
 * Example #5: But the page should not be a HubSpot blog post page
 *
 */
Then(/^(?:the |this )?page should( not)* be a HubSpot (website|landing|blog listing|blog post) page$/, async function (notCase, kind) {
  const { selector, label } = PAGE_KINDS[kind];
  const timeout = budget(this);
  const found = await poll(this, async () => ((await this.page.locator(selector).count()) > 0) === !notCase, timeout);
  if (!found) {
    const classes = await this.page.evaluate(() => Array.from(document.querySelectorAll('[class*="hs-"]'))
      .flatMap((n) => Array.from(n.classList)).filter((c) => /^hs-(site-page|landing-page|blog-listing|blog-post|content-path)/.test(c)).slice(0, 4)).catch(() => []);
    throw friendly({
      message: notCase
        ? `Expected the page not to be a HubSpot ${label}, but it carries \`${selector}\`.`
        : `Expected the page to be a HubSpot ${label} (\`${selector}\`), found ${classes.length ? classes.map((c) => `\`${c}\``).join(', ') : 'no HubSpot page class'}.`,
      hint: 'HubSpot adds `hs-site-page`, `hs-landing-page`, `hs-blog-listing` or `hs-blog-post` through the `builtin_body_classes` variable; a theme that leaves it out has none of them.',
    });
  }
});
