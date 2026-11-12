'use strict';

// Shared helpers for the HubSpot CMS step files.
//
// Not a step file: it registers no step definitions. It holds the plumbing
// the step files use: the wait budget, optional argument handling, friendly
// errors, and the lookup of a HubSpot form wherever it renders.
//
// A HubSpot form is not always in the page itself. HubSpot renders it as raw
// HTML (`form.hs-form` in the page), as an iframe (`iframe.hs-form-iframe`,
// the default for forms not set as raw HTML) or, for the new forms editor, in
// an iframe that HubSpot's embed script creates inside a `div.hs-form-frame`.
// Playwright lists every frame of the page, so one lookup covers the three.

const { friendly } = require('webship-js/tests/step-definitions/webship');

// The root of a rendered HubSpot form: the legacy form element, or the root
// the new forms editor renders (`data-hsfc-id="Renderer"`).
const FORM_SELECTOR = 'form.hs-form, [data-hsfc-id="Renderer"]';

/**
 * The per-assertion wait budget: `minWaitTime.page` from cucumber.js, and at
 * least 10 seconds, because a HubSpot form is loaded by script after the page.
 *
 * @param {object} world
 * @returns {number}
 */
function budget(world) {
  return Math.max((world.minWaitTime && world.minWaitTime.page) || 0, 10000);
}

/**
 * Whether an optional step argument was supplied (cucumber-js passes
 * `undefined` for a group that did not take part in the match).
 *
 * @param {*} value
 * @returns {boolean}
 */
function supplied(value) {
  return value !== undefined && value !== null && value !== '';
}

/**
 * Escape a literal string for use inside a RegExp.
 *
 * @param {string} text
 * @returns {string}
 */
function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * A case-sensitive RegExp that matches the literal text anywhere.
 *
 * @param {string} text
 * @returns {RegExp}
 */
function literal(text) {
  return new RegExp(escapeRegExp(text));
}

/**
 * Pause inside a polling loop.
 *
 * @param {import('playwright').Page} page
 * @param {number} ms
 */
async function pause(page, ms) {
  await page.waitForTimeout(ms);
}

/**
 * Run an action and rethrow any failure as a friendly error (action, target,
 * cause and a hint) instead of Playwright's raw timeout stack.
 *
 * @param {string} action
 * @param {string} target
 * @param {Function} fn
 * @param {string} hint
 */
async function actOrExplain(action, target, fn, hint) {
  try {
    return await fn();
  } catch (err) {
    if (err && err.stack === err.message && /\n  Hint: /.test(err.message)) throw err;
    throw friendly({ action, target, cause: err, hint });
  }
}

/**
 * Poll until `probe` returns a truthy value or the budget runs out. The probe
 * is called again every 250 ms; its last value is returned either way.
 *
 * @param {object} world
 * @param {Function} probe  async () => value
 * @param {number} [timeout]
 * @returns {Promise<*>}
 */
async function poll(world, probe, timeout = budget(world)) {
  const deadline = Date.now() + timeout;
  let value = await probe();
  while (!value && Date.now() < deadline) {
    await pause(world.page, 250);
    value = await probe();
  }
  return value;
}

/**
 * Every frame of the page that holds a HubSpot form, main frame first.
 *
 * @param {object} world
 * @returns {Promise<import('playwright').Frame[]>}
 */
async function formFrames(world) {
  const found = [];
  for (const frame of world.page.frames()) {
    try {
      if (await frame.locator(FORM_SELECTOR).count()) found.push(frame);
    } catch {
      // A frame that navigates away while it is counted is simply skipped.
    }
  }
  return found;
}

/**
 * The first visible element a lookup finds, in any frame that holds a form.
 *
 * @param {object} world
 * @param {(frame: import('playwright').Frame) => import('playwright').Locator[]} strategies
 *        Locators to try, in order, for one frame.
 * @param {number} [timeout]
 * @returns {Promise<import('playwright').Locator|null>}
 */
async function findInForms(world, strategies, timeout = budget(world)) {
  return poll(world, async () => {
    for (const frame of await formFrames(world)) {
      for (const locator of strategies(frame)) {
        try {
          const count = await locator.count();
          for (let i = 0; i < count; i += 1) {
            const candidate = locator.nth(i);
            if (await candidate.isVisible()) return candidate;
          }
        } catch {
          // The frame changed under us; try again on the next poll.
        }
      }
    }
    return null;
  }, timeout);
}

/**
 * Locators for a form field inside the forms of one frame. A field is found by
 * its internal property name (`email`, `firstname`; `0-1/email` in forms from
 * the new editor), then by its label, then by its placeholder (HubSpot themes
 * often show the label as the placeholder, for example "First*").
 *
 * @param {import('playwright').Frame} frame
 * @param {string} field
 * @returns {import('playwright').Locator[]}
 */
function fieldLocators(frame, field) {
  const name = field.replace(/"/g, '\\"');
  const scope = frame.locator(FORM_SELECTOR);
  return [
    frame.locator(`:is(form.hs-form, [data-hsfc-id="Renderer"]) :is(input, select, textarea)[name="${name}"], :is(form.hs-form, [data-hsfc-id="Renderer"]) :is(input, select, textarea)[name$="/${name}"]`),
    scope.getByLabel(field),
    scope.getByPlaceholder(field),
  ];
}

/**
 * The form on screen: the form the last form step worked in, else the first
 * visible form of the page.
 *
 * @param {object} world
 * @param {number} [timeout]
 * @returns {Promise<import('playwright').Locator|null>}
 */
async function activeForm(world, timeout = budget(world)) {
  return poll(world, async () => {
    if (world.hubspotForm) {
      try {
        if (await world.hubspotForm.count()) return world.hubspotForm;
      } catch {
        // The remembered form is gone (a thank-you message replaced it).
      }
      world.hubspotForm = null;
    }
    for (const frame of await formFrames(world)) {
      const forms = frame.locator(FORM_SELECTOR);
      const count = await forms.count();
      for (let i = 0; i < count; i += 1) {
        if (await forms.nth(i).isVisible().catch(() => false)) return forms.nth(i);
      }
    }
    return null;
  }, timeout);
}

/**
 * Remember the form a field belongs to, so the next form step (submit, an
 * assertion) works in the same form when a page carries several.
 *
 * @param {object} world
 * @param {import('playwright').Locator} field
 */
function rememberForm(world, field) {
  world.hubspotForm = field.locator('xpath=ancestor-or-self::*[self::form or @data-hsfc-id="Renderer"][1]');
}

/**
 * A RegExp that matches a whole text, ignoring the whitespace around it (the
 * label of a menu link or a CTA as a person reads it).
 *
 * @param {string} text
 * @param {boolean} [allowCount]  Also accept a trailing post count, as in "API (3)".
 * @returns {RegExp}
 */
function exactText(text, allowCount = false) {
  const count = allowCount ? '(?:\\s*\\(\\d+\\))?' : '';
  return new RegExp(`^\\s*${escapeRegExp(String(text).trim()).replace(/\s+/g, '\\s+')}${count}\\s*$`);
}

/**
 * Whether two addresses point at the same place. The page address resolves
 * relative ones; an expected value that starts with a slash matches on the
 * path and query alone, so "/pricing" matches "https://site.example/pricing".
 *
 * @param {string|null} actual
 * @param {string} expected
 * @param {string} base  The address of the current page.
 * @returns {boolean}
 */
function sameAddress(actual, expected, base) {
  if (actual === null || actual === undefined) return false;
  try {
    const a = new URL(actual, base);
    const e = new URL(expected, base);
    if (a.href === e.href) return true;
    if (expected.startsWith('/')) {
      const strip = (u) => `${u.pathname.replace(/\/$/, '')}${u.search}`;
      return a.hostname === new URL(base).hostname && strip(a) === strip(e);
    }
    return false;
  } catch {
    return actual === expected;
  }
}

const FORM_HINT = 'HubSpot renders a form as raw HTML (`form.hs-form`), in an iframe (`iframe.hs-form-iframe`) or, for the new forms editor, in an iframe inside `div.hs-form-frame`; the form must have finished loading. A field is found by its internal name (`email`, `firstname`), its label or its placeholder.';

module.exports = {
  FORM_SELECTOR,
  FORM_HINT,
  budget,
  supplied,
  escapeRegExp,
  literal,
  exactText,
  sameAddress,
  pause,
  actOrExplain,
  poll,
  formFrames,
  findInForms,
  fieldLocators,
  activeForm,
  rememberForm,
};
