'use strict';

// Step definitions for HubSpot forms: fill, submit and validate them wherever
// HubSpot renders them (raw HTML in the page, an iframe, or the iframe the new
// forms editor's embed script creates in a `div.hs-form-frame`).
//
// What these steps rely on, all checked on public sites built on HubSpot CMS:
//
//   - the legacy form: `form.hs-form` with one `div.hs-form-field` per field
//     (also `div.hs_<name>` and `div.hs-fieldtype-<type>`), the input in
//     `div.input > input.hs-input[name=<internal name>]`, a required marker
//     `span.hs-form-required` and the submit button in `div.hs_submit`
//   - a failed validation: `ul.hs-error-msgs[role=alert]` after the field,
//     `input.hs-input.invalid.error`, and one more `.hs-error-msgs` for the
//     whole form ("Please complete all required fields.")
//   - the thank-you message `div.submitted-message`, which replaces the form
//     when the form is set to show a message (a form set to redirect leaves
//     the page; assert the new address with "I should be on ...")
//   - the new forms editor: a `div.hs-form-frame` that HubSpot's embed script
//     fills with an iframe holding `[data-hsfc-id="Renderer"]` and `hsfc-*`
//     classes; its inputs are named `0-1/<internal name>`
//
// The product word is optional ("the HubSpot form" and "the form" both match).
// Every assertion waits for its condition, and every failure is a friendly
// message with a hint.

const { When, Then } = require('@cucumber/cucumber');
const { friendly, smartSettle } = require('webship-js/tests/step-definitions/webship');
const {
  FORM_SELECTOR,
  FORM_HINT,
  budget,
  supplied,
  literal,
  actOrExplain,
  poll,
  formFrames,
  findInForms,
  fieldLocators,
  activeForm,
  rememberForm,
} = require('./hubspot-helpers');

const SUBMIT_BUTTONS = 'input[type="submit"], button[type="submit"], .hs-button.primary, .hsfc-Button';
const ERROR_ITEMS = '.hs-error-msgs li, .hs-error-msg, [role="alert"]';

/**
 * Describe the state of one field element, in the frame it lives in: whether
 * it is required, which error messages its wrapper shows and whether it is
 * marked invalid.
 *
 * @param {import('playwright').Locator} field
 */
function fieldState(field) {
  return field.evaluate((el) => {
    const visible = (node) => Boolean(node.offsetWidth || node.offsetHeight || node.getClientRects().length);
    let wrapper = el.closest('.hs-form-field') || el.closest('[class*="hsfc-"][class*="Field"]');
    if (!wrapper) wrapper = el.parentElement;
    const required = Boolean(el.required) || el.getAttribute('aria-required') === 'true'
      || Boolean(wrapper.querySelector('.hs-form-required, .hsfc-FieldLabel__RequiredIndicator'));
    const messages = Array.from(wrapper.querySelectorAll('.hs-error-msgs li, .hs-error-msg, [role="alert"]'))
      .filter(visible)
      .map((node) => (node.textContent || '').trim())
      .filter(Boolean);
    const invalid = el.classList.contains('invalid') || el.getAttribute('aria-invalid') === 'true';
    return { required, messages, invalid };
  });
}

/**
 * Assert the page does (or does not) carry a HubSpot form: a legacy
 * `form.hs-form` or a form of the new editor, in the page or in an iframe.
 *
 * Example #1: Then the page should have a HubSpot form
 * Example #2: And the page should have a form
 * Example #3: Then this page should have a HubSpot form
 * Example #4: But the page should not have a HubSpot form
 * Example #5: Then page should not have a form
 *
 */
Then(/^(?:the |this )?page should( not)* have a (?:HubSpot )?form$/, async function (notCase) {
  const found = await poll(this, async () => (await formFrames(this)).length > 0 || null);
  if (notCase) {
    const absent = await poll(this, async () => (await formFrames(this)).length === 0 || null, 2000);
    if (!absent) {
      throw friendly({ message: 'Expected the page not to have a HubSpot form, but it has one.', hint: FORM_HINT });
    }
    return;
  }
  if (!found) {
    throw friendly({ message: `Expected the page to have a HubSpot form (${FORM_SELECTOR}), but none appeared.`, hint: FORM_HINT });
  }
});

/**
 * Assert the HubSpot form does (or does not) have a field, found by its
 * internal property name, its label or its placeholder.
 *
 * Example #1: Then the HubSpot form should have a field "email"
 * Example #2: And the form should have a field "firstname"
 * Example #3: Then the HubSpot form should have a field "Company name"
 * Example #4: But the form should not have a field "fax"
 * Example #5: Then the HubSpot form should not have a field "password"
 *
 */
Then(/^(?:the )?(?:HubSpot )?form should( not)* have a field "([^"]*)"$/, async function (notCase, field) {
  const found = await findInForms(this, (frame) => fieldLocators(frame, field), notCase ? 1000 : budget(this));
  if (notCase && found) {
    throw friendly({ message: `Expected the form not to have a field "${field}", but it does.`, hint: FORM_HINT });
  }
  if (!notCase && !found) {
    throw friendly({ message: `Expected the form to have a field "${field}", but none is visible.`, hint: FORM_HINT });
  }
});

/**
 * Fill a field of the HubSpot form with a value. The field is found by its
 * internal property name, its label or its placeholder; a select takes the
 * visible option text (or the option value). The form the field is in is the
 * one the next form step works in.
 *
 * Example #1: When I fill in the HubSpot form field "email" with "jane@example.com"
 * Example #2: When I fill in the HubSpot form field "firstname" with "Jane"
 * Example #3: And I fill in the form field "lastname" with "Doe"
 * Example #4: And fill in the HubSpot form field "message" with "Please call me back"
 * Example #5: When we fill in the form field "country" with "Jordan"
 *
 */
When(/^(I |we )*fill in the (?:HubSpot )?form field "([^"]*)" with "([^"]*)"$/, async function (pronounCase, field, value) {
  const locator = await findInForms(this, (frame) => fieldLocators(frame, field));
  if (!locator) {
    throw friendly({ action: 'find the form field', target: field, hint: FORM_HINT });
  }
  const kind = await locator.evaluate((el) => ({ tag: el.tagName.toLowerCase(), type: (el.getAttribute('type') || '').toLowerCase() }));
  if (kind.type === 'checkbox' || kind.type === 'radio') {
    throw friendly({ action: 'fill in the form field', target: field, hint: 'This field is a checkbox or a radio button; use "I tick the form checkbox ..." instead.' });
  }
  await actOrExplain('fill in the form field', field, async () => {
    if (kind.tag === 'select') {
      await locator.selectOption({ label: value }).catch(() => locator.selectOption(value));
    } else {
      await locator.fill(value);
    }
  }, FORM_HINT + (kind.tag === 'select' ? ' For a select, use the option text or its value.' : ''));
  rememberForm(this, locator);
});

/**
 * Tick (check) or untick (uncheck) a checkbox of the HubSpot form, found by
 * its internal name or its label, such as the consent to communications.
 *
 * Example #1: When I tick the HubSpot form checkbox "I agree to receive other communications"
 * Example #2: And I tick the form checkbox "LEGAL_CONSENT.subscription_type_1"
 * Example #3: When we untick the HubSpot form checkbox "I agree to receive other communications"
 * Example #4: And check the form checkbox "I agree to the privacy policy"
 * Example #5: When I uncheck the form checkbox "I agree to the privacy policy"
 *
 */
When(/^(I |we )*(tick|untick|check|uncheck) the (?:HubSpot )?form checkbox "([^"]*)"$/, async function (pronounCase, action, field) {
  const locator = await findInForms(this, (frame) => fieldLocators(frame, field));
  if (!locator) {
    throw friendly({ action: `${action} the form checkbox`, target: field, hint: FORM_HINT });
  }
  const wanted = action === 'tick' || action === 'check';
  await actOrExplain(`${action} the form checkbox`, field, () => (wanted ? locator.check() : locator.uncheck()), FORM_HINT);
  rememberForm(this, locator);
});

/**
 * Submit the HubSpot form (the one the last form step worked in, else the
 * first visible one) and wait for the page to settle, so the response has a
 * chance to replace the form with its thank-you message or its errors.
 *
 * Example #1: When I submit the HubSpot form
 * Example #2: And I submit the HubSpot form
 * Example #3: When we submit the form
 * Example #4: And submit the HubSpot form
 * Example #5: When I submit the form
 *
 */
When(/^(I |we )*submit the (?:HubSpot )?form$/, async function (pronounCase) {
  const form = await activeForm(this);
  if (!form) {
    throw friendly({ action: 'submit the form', target: FORM_SELECTOR, hint: FORM_HINT });
  }
  const buttons = form.locator(SUBMIT_BUTTONS);
  let target = null;
  const count = await buttons.count();
  for (let i = 0; i < count && !target; i += 1) {
    if (await buttons.nth(i).isVisible().catch(() => false)) target = buttons.nth(i);
  }
  if (!target) {
    throw friendly({ action: 'submit the form', target: SUBMIT_BUTTONS, hint: 'The submit button is the form\'s `input[type="submit"]` (legacy forms) or its `.hsfc-Button` (new forms); it must be visible.' });
  }
  await actOrExplain('submit the form', FORM_SELECTOR, () => target.click(), FORM_HINT);
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 3000);
});

/**
 * Assert a field of the HubSpot form is (or is not) required: the input has
 * `required`, or its label carries the required marker (`.hs-form-required`).
 *
 * Example #1: Then the HubSpot form field "email" should be required
 * Example #2: And the form field "firstname" should be required
 * Example #3: Then the HubSpot form field "message" should not be required
 * Example #4: But the form field "phone" should not be required
 * Example #5: Then form field "email" should be required
 *
 */
Then(/^(?:the )?(?:HubSpot )?form field "([^"]*)" should( not)* be required$/, async function (field, notCase) {
  const locator = await findInForms(this, (frame) => fieldLocators(frame, field));
  if (!locator) {
    throw friendly({ message: `Expected the form to have a field "${field}", but none is visible.`, hint: FORM_HINT });
  }
  const { required } = await fieldState(locator);
  if (required === Boolean(notCase)) {
    throw friendly({
      message: notCase
        ? `Expected the form field "${field}" not to be required, but it is.`
        : `Expected the form field "${field}" to be required, but it is not.`,
      hint: 'A field is required when its input has `required` or its label carries `span.hs-form-required`; check the field\'s "Required" setting in the form.',
    });
  }
});

/**
 * Assert a field of the HubSpot form does (or does not) show a validation
 * error, optionally containing the given text (`ul.hs-error-msgs` after the
 * field, or an input marked `invalid`). Submit the form first.
 *
 * Example #1: Then the HubSpot form field "email" should show an error
 * Example #2: And the form field "email" should show an error containing "required"
 * Example #3: Then the HubSpot form field "firstname" should show an error containing "Please complete this required field."
 * Example #4: But the form field "message" should not show an error
 * Example #5: Then form field "email" should not show an error
 *
 */
Then(/^(?:the )?(?:HubSpot )?form field "([^"]*)" should( not)* show an error(?: containing "([^"]*)")?$/, async function (field, notCase, text) {
  const locator = await findInForms(this, (frame) => fieldLocators(frame, field));
  if (!locator) {
    throw friendly({ message: `Expected the form to have a field "${field}", but none is visible.`, hint: FORM_HINT });
  }
  let state = await fieldState(locator);
  const matches = (s) => (supplied(text) ? s.messages.some((m) => m.includes(text)) : s.messages.length > 0 || s.invalid);
  const ok = await poll(this, async () => {
    state = await fieldState(locator).catch(() => state);
    return matches(state) === !notCase;
  });
  if (!ok) {
    throw friendly({
      message: notCase
        ? `Expected the form field "${field}" not to show an error${supplied(text) ? ` containing "${text}"` : ''}, but it shows: "${state.messages.join(' / ')}".`
        : `Expected the form field "${field}" to show an error${supplied(text) ? ` containing "${text}"` : ''}, found ${state.messages.length ? `"${state.messages.join(' / ')}"` : 'none'}.`,
      hint: 'HubSpot shows `ul.hs-error-msgs` after the field and marks the input `invalid error` once the form was submitted with a missing or malformed value; submit the form first (the match is case-sensitive).',
    });
  }
});

/**
 * Assert the HubSpot form does (or does not) show an error message, optionally
 * containing the given text: a field error or the message for the whole form
 * ("Please complete all required fields."). Submit the form first.
 *
 * Example #1: Then the HubSpot form should show an error
 * Example #2: And the form should show an error containing "required"
 * Example #3: Then the HubSpot form should show an error containing "Please complete all required fields."
 * Example #4: But the form should not show an error
 * Example #5: Then form should not show an error containing "required"
 *
 */
Then(/^(?:the )?(?:HubSpot )?form should( not)* show an error(?: containing "([^"]*)")?$/, async function (notCase, text) {
  let messages = [];
  const collect = async () => {
    const found = [];
    for (const frame of await formFrames(this)) {
      const texts = await frame.locator(ERROR_ITEMS).evaluateAll((nodes) => nodes
        .filter((n) => Boolean(n.offsetWidth || n.offsetHeight || n.getClientRects().length))
        .map((n) => (n.textContent || '').trim())
        .filter(Boolean)).catch(() => []);
      found.push(...texts);
    }
    return found;
  };
  const ok = await poll(this, async () => {
    messages = await collect();
    const hit = supplied(text) ? messages.some((m) => m.includes(text)) : messages.length > 0;
    return hit === !notCase;
  });
  if (!ok) {
    throw friendly({
      message: notCase
        ? `Expected the form not to show an error${supplied(text) ? ` containing "${text}"` : ''}, but it shows: "${messages.join(' / ')}".`
        : `Expected the form to show an error${supplied(text) ? ` containing "${text}"` : ''}, found ${messages.length ? `"${messages.join(' / ')}"` : 'none'}.`,
      hint: 'HubSpot lists the errors in `.hs-error-msgs` (one per field and one for the whole form) after a submit with missing or malformed values; submit the form first (the match is case-sensitive).',
    });
  }
});

/**
 * Assert the HubSpot form's success ("thank you") message is (or is not)
 * visible, optionally containing the given text. A form set to redirect
 * leaves the page instead; assert the new address with "I should be on ...".
 *
 * Example #1: Then the HubSpot form should show a success message
 * Example #2: Then the HubSpot form should show a success message containing "Thanks"
 * Example #3: And the form should show a success message containing "received your message"
 * Example #4: But the HubSpot form should not show a success message
 * Example #5: Then the form should not show a success message containing "error"
 *
 */
Then(/^(?:the )?(?:HubSpot )?form should( not)* show a success message(?: containing "([^"]*)")?$/, async function (notCase, text) {
  let seen = '';
  const probe = async () => {
    for (const frame of this.page.frames()) {
      const messages = await frame.locator('.submitted-message').evaluateAll((nodes) => nodes
        .filter((n) => Boolean(n.offsetWidth || n.offsetHeight || n.getClientRects().length))
        .map((n) => (n.textContent || '').trim())).catch(() => []);
      if (messages.length) seen = messages.join(' / ');
      if (messages.some((m) => (supplied(text) ? literal(text).test(m) : true))) return true;
      if (supplied(text)) {
        // The new editor shows its message inside the form root, in place of the fields.
        const inRoot = await frame.locator('[data-hsfc-id="Renderer"]').first().evaluate((root, wanted) => {
          const hasInput = Array.from(root.querySelectorAll('input:not([type="hidden"]), select, textarea')).some((n) => Boolean(n.offsetWidth || n.offsetHeight));
          return !hasInput && (root.textContent || '').includes(wanted);
        }, text).catch(() => false);
        if (inRoot) return true;
      }
    }
    return false;
  };
  const ok = await poll(this, async () => (await probe()) === !notCase);
  if (!ok) {
    throw friendly({
      message: notCase
        ? `Expected the form not to show a success message${supplied(text) ? ` containing "${text}"` : ''}, but it does ("${seen}").`
        : `Expected the form to show a success message${supplied(text) ? ` containing "${text}"` : ''} within ${budget(this)} ms${seen ? `, found: "${seen}"` : ', but none appeared'}.`,
      hint: 'HubSpot replaces the form with `.submitted-message` after a successful submit when the form is set to show a message; a form set to redirect leaves the page ("I should be on ..."). Submit the form first (the match is case-sensitive).',
    });
  }
});
