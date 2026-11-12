'use strict';

// Step definitions for what a visitor uses to move around a HubSpot CMS site:
// the menu and the call-to-action (CTA) buttons.
//
// What these steps rely on, all checked on public sites built on HubSpot CMS:
//
//   - the menu module: `div.hs-menu-wrapper[role=navigation]` holding
//     `ul[role=menu] > li.hs-menu-item.hs-menu-depth-<n>`; an item with a
//     submenu has `hs-item-has-children` and a `ul.hs-menu-children-wrapper`;
//     the current page is `li.active` (and `active-branch` on it and on its
//     parents). A page usually carries the menu twice, one copy hidden for
//     the other screen size. A theme may render its own `nav` instead (the
//     HubSpot boilerplate theme uses `nav.menu` with `a.menu__link`, and
//     `a.menu__link--active-link` for the current page), so the menu is looked
//     up in `.hs-menu-wrapper`, `nav` and `[role="navigation"]`.
//   - the CTA: `span.hs-cta-wrapper > span.hs-cta-node > a.cta_button`. Its
//     `href` is HubSpot's tracking redirect (`/cs/c/?cta_guid=...`); the
//     destination is the `cta_dest_link` attribute. The label is the text, the
//     `title`, or, for an image CTA, the `alt` of `img.hs-cta-img`. The new CTA
//     editor's wrapper is `.hs-cta-embed`.
//
// The product word is optional ("the HubSpot menu" and "the menu" both match).

const { When, Then } = require('@cucumber/cucumber');
const { friendly, smartSettle } = require('webship-js/tests/step-definitions/webship');
const {
  budget,
  exactText,
  sameAddress,
  pause,
  actOrExplain,
  poll,
} = require('./hubspot-helpers');

const MENU_ROOTS = '.hs-menu-wrapper, nav, [role="navigation"]';
const MENU_LINKS = '.hs-menu-wrapper a, nav a, [role="navigation"] a';
const CTA_SELECTOR = '.hs-cta-wrapper a, .hs-cta-embed a, .hs-cta-embed button, a.cta_button, button.cta_button, [data-hubspot-cta-id]';

const MENU_HINT = 'The menu is looked up in `.hs-menu-wrapper` (the menu module), `nav` and `[role="navigation"]` (theme menus); links are matched by their whole visible text, so check the label in the HubSpot menu settings.';
const CTA_HINT = 'A CTA is `a.cta_button` inside `.hs-cta-wrapper` (or `.hs-cta-embed` for the new editor), matched by its text, `title`, `aria-label` or image `alt`; check the wording and that the CTA is published.';

/**
 * The menu links with a whole-text label.
 *
 * @param {import('playwright').Page} page
 * @param {string} label
 */
function menuLink(page, label) {
  return page.locator(MENU_LINKS).filter({ hasText: exactText(label) });
}

/**
 * The first visible locator among a locator's matches (a page often carries the
 * menu twice, one copy hidden), or null.
 *
 * @param {import('playwright').Locator} locator
 * @returns {Promise<import('playwright').Locator|null>}
 */
async function firstVisible(locator) {
  const count = await locator.count();
  for (let i = 0; i < count; i += 1) {
    if (await locator.nth(i).isVisible().catch(() => false)) return locator.nth(i);
  }
  return null;
}

/**
 * Open the submenus above a link by hovering over each parent item, outermost
 * first, so a link in a flyout becomes visible.
 *
 * @param {import('playwright').Locator} link
 */
async function revealParents(link) {
  const parents = link.locator('xpath=ancestor::li');
  const count = await parents.count();
  for (let i = 0; i < count; i += 1) {
    const head = parents.nth(i).locator('xpath=./a | ./span | ./button').first();
    if (await head.count() && await head.isVisible().catch(() => false)) {
      await head.hover().catch(() => {});
      await pause(link.page(), 200);
    }
  }
}

/**
 * Assert the menu does (or does not) have a link with the given label. The
 * label is the whole text of the link, as it is written in the menu settings.
 *
 * Example #1: Then the menu should have a link labeled "Pricing"
 * Example #2: Then the menu should have a link labeled "Blog"
 * Example #3: And the menu should have a link labeled "Contact"
 * Example #4: But the menu should not have a link labeled "Checkout"
 * Example #5: Then menu should have a link labelled "Home"
 *
 */
Then(/^(?:the )?menu should( not)* have a link labell?ed "([^"]*)"$/, async function (notCase, label) {
  const timeout = budget(this);
  try {
    await menuLink(this.page, label).first().waitFor({ state: notCase ? 'detached' : 'attached', timeout });
  } catch {
    throw friendly({
      message: notCase
        ? `Expected the menu not to have a link labeled "${label}", but it does.`
        : `Expected the menu to have a link labeled "${label}" within ${timeout} ms, but none appeared.`,
      hint: MENU_HINT,
    });
  }
});

/**
 * Assert a menu link does (or does not) lead to the given address, written as
 * a path ("/pricing") or a full address.
 *
 * Example #1: Then the menu link "Pricing" should link to "/pricing"
 * Example #2: And the menu link "Blog" should link to "/blog"
 * Example #3: Then the menu link "Contact" should link to "https://example.com/contact"
 * Example #4: But the menu link "Home" should not link to "/pricing"
 * Example #5: Then menu link "About" should link to "/about-us"
 *
 */
Then(/^(?:the )?menu link "([^"]*)" should( not)* link to "([^"]*)"$/, async function (label, notCase, href) {
  const links = menuLink(this.page, label);
  let seen = [];
  const ok = await poll(this, async () => {
    seen = await links.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')));
    if (!seen.length) return false;
    return seen.some((h) => sameAddress(h, href, this.page.url())) === !notCase;
  });
  if (!ok) {
    throw friendly({
      message: !seen.length
        ? `Expected the menu to have a link labeled "${label}", but none appeared.`
        : notCase
          ? `Expected the menu link "${label}" not to link to "${href}", but it does.`
          : `Expected the menu link "${label}" to link to "${href}", found "${seen.join('", "')}".`,
      hint: MENU_HINT + ' A path such as "/pricing" matches the same path on the current site.',
    });
  }
});

/**
 * Assert a top-level menu item does (or does not) have a submenu link, in the
 * nested list HubSpot renders (`li.hs-item-has-children > ul`).
 *
 * Example #1: Then the menu item "Services" should have a submenu link "Google Ads Management"
 * Example #2: And the menu item "Resources" should have a submenu link "Blog"
 * Example #3: Then the menu item "Industries" should have a submenu link "Ecommerce"
 * Example #4: But the menu item "Pricing" should not have a submenu link "Blog"
 * Example #5: Then menu item "Resources" should have a submenu link "Guides"
 *
 */
Then(/^(?:the )?menu item "([^"]*)" should( not)* have a submenu link "([^"]*)"$/, async function (parent, notCase, child) {
  const timeout = budget(this);
  const probe = ({ roots, parentText, childText }) => {
    const norm = (n) => (n.textContent || '').replace(/\s+/g, ' ').trim();
    return Array.from(document.querySelectorAll('li')).some((li) => {
      if (!li.closest(roots)) return false;
      const head = Array.from(li.children).find((c) => c.matches('a, span, button') && norm(c) === parentText);
      if (!head) return false;
      return Array.from(li.querySelectorAll('ul a')).some((a) => norm(a) === childText);
    });
  };
  try {
    const ok = await poll(this, async () => (await this.page.evaluate(probe, { roots: MENU_ROOTS, parentText: parent.trim(), childText: child.trim() })) === !notCase, timeout);
    if (!ok) throw new Error('not found');
  } catch {
    throw friendly({
      message: notCase
        ? `Expected the menu item "${parent}" not to have a submenu link "${child}", but it does.`
        : `Expected the menu item "${parent}" to have a submenu link "${child}" within ${timeout} ms, but it does not.`,
      hint: 'A submenu is the `ul` inside the item (`li.hs-item-has-children > ul.hs-menu-children-wrapper`); the item and the link are matched by their whole visible text.',
    });
  }
});

/**
 * Open a menu item that has a submenu: hover over it (HubSpot's menu opens on
 * hover) and, when the submenu is still closed, click it.
 *
 * Example #1: When I open the menu item "Services"
 * Example #2: And I open the menu item "Resources"
 * Example #3: When we open the menu item "Industries"
 * Example #4: And open the menu item "Resources"
 * Example #5: When I open the menu item "Services"
 *
 */
When(/^(I |we )*open the menu item "([^"]*)"$/, async function (pronounCase, label) {
  const head = await poll(this, async () => firstVisible(menuLink(this.page, label)));
  if (!head) {
    throw friendly({ action: 'open the menu item', target: label, hint: MENU_HINT + ' The item must be visible: on a small screen, open the menu button first.' });
  }
  const submenu = head.locator('xpath=ancestor::li[1]//ul//a');
  await actOrExplain('open the menu item', label, async () => {
    await head.hover();
    await pause(this.page, 300);
    if (!(await firstVisible(submenu))) {
      await head.click();
      await pause(this.page, 300);
    }
    if (!(await firstVisible(submenu))) throw new Error('the submenu did not open');
  }, 'The item must have a submenu (`li.hs-item-has-children > ul`), and hovering or clicking it must show the submenu.');
});

/**
 * Click a menu link by its whole text. A link in a closed submenu is revealed
 * first by hovering over its parent items.
 *
 * Example #1: When I click the menu link "Pricing"
 * Example #2: And I click the menu link "Contact"
 * Example #3: When we click the menu link "Blog"
 * Example #4: And click the menu link "Home"
 * Example #5: When I click the menu link "Google Ads Management"
 *
 */
When(/^(I |we )*click the menu link "([^"]*)"$/, async function (pronounCase, label) {
  const links = menuLink(this.page, label);
  await actOrExplain('click the menu link', label, async () => {
    await links.first().waitFor({ state: 'attached', timeout: budget(this) });
    let target = await firstVisible(links);
    if (!target) {
      await revealParents(links.first());
      target = await firstVisible(links);
    }
    if (!target) throw new Error('the link is not visible, even after opening its parent items');
    await target.click();
  }, MENU_HINT);
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 3000);
});

/**
 * Assert a menu link is (or is not) the current page: its item has the class
 * `active` (HubSpot's menu module), its link has `aria-current="page"`, or the
 * theme's own active class.
 *
 * Example #1: Then the menu link "Pricing" should be active
 * Example #2: And the menu link "Home" should be active
 * Example #3: Then the menu link "Blog" should be active
 * Example #4: But the menu link "Contact" should not be active
 * Example #5: Then menu link "About" should not be active
 *
 */
Then(/^(?:the )?menu link "([^"]*)" should( not)* be active$/, async function (label, notCase) {
  const links = menuLink(this.page, label);
  let count = 0;
  const ok = await poll(this, async () => {
    count = await links.count();
    if (!count) return false;
    const states = await links.evaluateAll((nodes) => nodes.map((a) => {
      const li = a.closest('li');
      return a.getAttribute('aria-current') === 'page'
        || a.classList.contains('active') || /(^|[-_])active-link($|\s)/.test(a.className)
        || Boolean(li && li.classList.contains('active'));
    }));
    return states.some(Boolean) === !notCase;
  });
  if (!ok) {
    throw friendly({
      message: !count
        ? `Expected the menu to have a link labeled "${label}", but none appeared.`
        : notCase
          ? `Expected the menu link "${label}" not to be the current page, but it is.`
          : `Expected the menu link "${label}" to be the current page, but it is not.`,
      hint: 'HubSpot\'s menu module marks the current page `li.active` (and its parents `active-branch`); a theme menu uses `aria-current="page"` or its own class. Check you are on the page the link points to.',
    });
  }
});

/**
 * The CTAs with the given label: found by their text, their `title`, their
 * `aria-label` or the `alt` of the image inside them (an image CTA has no
 * text).
 *
 * @param {import('playwright').Page} page
 * @param {string} label
 * @returns {import('playwright').Locator[]}
 */
function ctaLocators(page, label) {
  const name = label.replace(/"/g, '\\"');
  const all = page.locator(CTA_SELECTOR);
  return [
    all.filter({ hasText: exactText(label) }),
    all.filter({ hasText: label }),
    page.locator(CTA_SELECTOR.split(', ').map((s) => `${s}[title="${name}"], ${s}[aria-label="${name}"]`).join(', ')),
    all.filter({ has: page.locator(`img[alt="${name}"]`) }),
  ];
}

/**
 * The first CTA a lookup finds, waiting for it: attached, or visible.
 *
 * @param {object} world
 * @param {string} label
 * @param {boolean} visible
 * @returns {Promise<import('playwright').Locator|null>}
 */
async function findCta(world, label, visible) {
  return poll(world, async () => {
    for (const locator of ctaLocators(world.page, label)) {
      const count = await locator.count().catch(() => 0);
      for (let i = 0; i < count; i += 1) {
        if (!visible || await locator.nth(i).isVisible().catch(() => false)) return locator.nth(i);
      }
    }
    return null;
  });
}

/**
 * Click a CTA by its label. The click goes through HubSpot's tracking
 * redirect to the CTA's destination, and the step waits for the page to
 * settle.
 *
 * Example #1: When I click the CTA "See Pricing"
 * Example #2: When I click the CTA "Talk to Sales"
 * Example #3: And I click the CTA "Get Started"
 * Example #4: When we click the CTA "Start Free Trial"
 * Example #5: And click the CTA "Get in Touch"
 *
 */
When(/^(I |we )*click the CTA "([^"]*)"$/, async function (pronounCase, label) {
  const cta = await findCta(this, label, true);
  if (!cta) {
    throw friendly({ action: 'click the CTA', target: label, hint: CTA_HINT });
  }
  await actOrExplain('click the CTA', label, () => cta.click(), CTA_HINT);
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 3000);
});

/**
 * Assert a CTA is (or is not) visible on the page.
 *
 * Example #1: Then the CTA "Get Started" should be visible
 * Example #2: And the CTA "Talk to Sales" should be visible
 * Example #3: Then the CTA "Download the guide" should be visible
 * Example #4: But the CTA "Start Free Trial" should not be visible
 * Example #5: Then CTA "See Pricing" should be visible
 *
 */
Then(/^(?:the )?CTA "([^"]*)" should( not)* be visible$/, async function (label, notCase) {
  const cta = await findCta(this, label, true);
  if (notCase ? Boolean(cta) : !cta) {
    throw friendly({
      message: notCase ? `Expected the CTA "${label}" not to be visible, but it is.` : `Expected the CTA "${label}" to be visible, but it did not appear within ${budget(this)} ms.`,
      hint: CTA_HINT,
    });
  }
});

/**
 * Assert a CTA does (or does not) lead to the given address, written as a path
 * ("/pricing") or a full address. The destination is the CTA's
 * `cta_dest_link`; its `href` is HubSpot's tracking redirect, so it is only the
 * fallback.
 *
 * Example #1: Then the CTA "See Pricing" should link to "/pricing"
 * Example #2: Then the CTA "Talk to Sales" should link to "/contact-us"
 * Example #3: And the CTA "Get Started" should link to "https://example.com/get-started"
 * Example #4: But the CTA "Get in Touch" should not link to "/pricing"
 * Example #5: Then CTA "Start Free Trial" should link to "/contact-us"
 *
 */
Then(/^(?:the )?CTA "([^"]*)" should( not)* link to "([^"]*)"$/, async function (label, notCase, href) {
  const cta = await findCta(this, label, false);
  if (!cta) {
    throw friendly({ action: 'find the CTA', target: label, hint: CTA_HINT });
  }
  let actual = null;
  const ok = await poll(this, async () => {
    actual = await cta.evaluate((el) => el.getAttribute('cta_dest_link') || el.getAttribute('data-cta-dest-link') || el.getAttribute('href')).catch(() => null);
    return sameAddress(actual, href, this.page.url()) === !notCase;
  });
  if (!ok) {
    throw friendly({
      message: notCase
        ? `Expected the "${label}" CTA not to link to "${href}", but it does.`
        : `Expected the "${label}" CTA to link to "${href}", found "${actual}".`,
      hint: 'The destination is the CTA\'s `cta_dest_link` attribute (its `href` is HubSpot\'s tracking redirect, `/cs/c/?cta_guid=...`); a path such as "/pricing" matches the same path on the current site.',
    });
  }
});
