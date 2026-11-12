# hubspot-cms-steps

A standalone [webship-js](https://webship.co/docs/webship-js/2.0.x) (Playwright + Cucumber-js)
test project for websites built on the HubSpot CMS: the cookie consent banner, HubSpot forms,
CTA modules, the menu module, and the blog listing module — all in plain-English Gherkin.

It is published to npm as `@webship-js/hubspot-cms-steps`, and is also a project you can run
directly (or fork) to test a HubSpot CMS site. It ships a self-contained demo HubSpot-style site (`demo-site/`)
and a full suite of `.feature` files, so the suite can be verified in CI without a real
HubSpot account.

## Installation

To reuse these steps in your own webship-js project:

```bash
npm install --save-dev webship-js @webship-js/hubspot-cms-steps
```

Add both step-definition paths to your project's `cucumber.js`:

```javascript
module.exports = {
  default: {
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js', // webship-js core steps
      'node_modules/@webship-js/hubspot-cms-steps/tests/step-definitions/hubspot.steps.js', // this plugin
      'tests/step-definitions/**/*.js', // your own custom steps, if any
    ],
    paths: ['tests/features/**/*.feature'],
    worldParameters: {
      launchUrl: process.env.LAUNCH_URL || 'https://your-hubspot-site.example',
    },
  },
};
```

## Repository layout

| Path | Purpose |
| --- | --- |
| `tests/step-definitions/hubspot.steps.js` | Entry point: the page, cookie banner, CTA, menu and blog steps; it loads the other step files. |
| `tests/step-definitions/hubspot-forms.steps.js` | The form steps: fill, submit, validation errors and the thank-you message. |
| `tests/step-definitions/hubspot-helpers.js` | Shared helpers (wait budget, finding a form in the page or in an iframe). Not a step file. |
| `tests/features/` | `.feature` files testing the demo site's main pages (home, pricing, about, blog, contact). |
| `tests/features/real-sites/` | Read-only `@real-site` checks against public sites built on HubSpot CMS (one file per host). |
| `demo-site/` | Static demo site that copies the markup HubSpot CMS renders, used to exercise the steps in CI. |
| `scripts/probe-selectors.js` | Counts the HubSpot selectors on any public page (read-only, one page load per URL). |
| `.ddev/` | DDEV project config used to serve `demo-site/` locally and in CI. |
| `.github/workflows/ci.yml` | GitHub Actions workflow that builds the site with DDEV and runs the suite on every push/PR. |

## Running the tests locally

Requires [DDEV](https://ddev.com/get-started/) and Docker.

```bash
npm install
npx playwright install --with-deps chromium
ddev start                          # serves demo-site/ at the DDEV project URL
LAUNCH_URL=$(ddev describe -j | node -e "process.stdin.once('data', d => console.log(JSON.parse(d).raw.primary_url))") npm test
```

Or, without DDEV, using the bundled static server on port 8090:

```bash
npm start &                         # serves demo-site/ on http://localhost:8090
npm test
```

## Steps

| Step | Type |
| --- | --- |
| `the page should( not) be a HubSpot page` | Then |
| `I accept the (HubSpot )cookie banner` / `I decline the (HubSpot )cookie banner` | When |
| `the (HubSpot )cookie banner should( not) be visible` / `I should( not) see the cookie banner` | Then |
| `the page should( not) have a (HubSpot )form` | Then |
| `the (HubSpot )form should( not) have a field "<name>"` | Then |
| `I fill in the (HubSpot )form field "<name>" with "<value>"` | When |
| `I tick/untick the (HubSpot )form checkbox "<name or label>"` | When |
| `I submit the (HubSpot )form` | When |
| `the (HubSpot )form field "<name>" should( not) be required` | Then |
| `the (HubSpot )form field "<name>" should( not) show an error( containing "<text>")` | Then |
| `the (HubSpot )form should( not) show an error( containing "<text>")` | Then |
| `the (HubSpot )form should( not) show a success message( containing "<text>")` | Then |
| `I click the (HubSpot )CTA "<label>"` | When |
| `the (HubSpot )CTA "<label>" should( not) link to "<href>"` | Then |
| `the (HubSpot )menu should( not) have a link labeled "<label>"` | Then |
| `the (HubSpot )blog should list at least <n> post(s)` | Then |
| `I open the (HubSpot )blog post titled "<title>"` | When |

The product word is optional ("the HubSpot cookie banner" and "the cookie
banner" both match), so a feature written for another pack reads here too.
Every Then step takes `should` or `should not`, every action takes `I`, `we`
or no pronoun and is registered as a `When`, and every failure is a friendly
message with a hint (no assertion or Playwright stack). Each assertion polls
its condition for the `minWaitTime.page` budget (at least 10 s) instead of
reading the page once, and the form submit and CTA click settle the page
before the next step. The reference features assert the demo site's own
copy, labels and paths (`/pricing.html`, "Acme Analytics", ...); swap them
for your site's content when you copy a feature.

Every step's regex and five Gherkin examples are in the JSDoc block above it
in [`tests/step-definitions/hubspot.steps.js`](tests/step-definitions/hubspot.steps.js);
`npm run test:examples` checks that each example matches its own step (and no
webship-js core step) and that every feature step is defined exactly once.
CI runs it before the suite.

## Forms

HubSpot renders a form in one of three ways, and the form steps find it in all three:
raw HTML in the page (`form.hs-form`, for example the CMS form module), an iframe
(`iframe.hs-form-iframe`, the default for a form not set as raw HTML), and, for the
new forms editor, an iframe that HubSpot's embed script creates inside a
`div.hs-form-frame`. A field is found by its internal property name (`email`,
`firstname`; `0-1/email` in the new editor), by its label or by its placeholder. When
a page has several forms, the form of the last field you filled is the one that is
submitted and checked. A form set to redirect leaves the page after the submit; assert
the new address with `I should be on "/thank-you"`.

## Checking a real site

`npm run probe -- https://example.com/ https://example.com/blog` opens each page once
and prints how many elements every HubSpot selector this pack uses matches. Use it
before you write a scenario against your own site: HubSpot themes differ, and the
default modules (`.hs-menu-wrapper`, `form.hs-form`, `.hs-cta-wrapper`) are only on
a page when the theme uses them.

`npm run test:real-sites` runs the `@real-site` features in
`tests/features/real-sites/`, one file per public host (`huble.com.feature` runs with
`LAUNCH_URL=https://huble.com`). They are read-only: a form is submitted empty, so the
browser-side validation stops it and nothing is sent. The default run leaves them out.

## Writing a scenario

```gherkin
Feature: Contact page

  Scenario: Visitor submits the contact form
    Given I am on "/contact-us.html"
    When I accept the cookie banner
    And I fill in the form field "firstname" with "Jane"
    And I fill in the form field "lastname" with "Doe"
    And I fill in the form field "email" with "jane@example.com"
    And I submit the form
    Then the form should show a success message
```

## Contributing

This project only accepts changes via pull request against the `2.0.x` branch.

## License

MIT — see [LICENSE](LICENSE).

### Lanes, subsets and the settings webship-js reads

- `FEATURES=tests/features/a.feature,tests/features/b.feature npm test` runs a subset of the feature files; `CUCUMBER_TAGS=@critical npm test` runs a tag lane (the default run leaves `@wip` out).
- `cucumber.js` carries the `video` block (`WEBSHIP_VIDEO=on-failure` records the browser) and the `javascript` block (`WEBSHIP_JS_ERROR_MODE=fail` fails a scenario on a JavaScript error; `@js-off` silences one scenario) that webship-js reads.
- The step timeout is webship-js's own (45 seconds, set when it loads); `WEBSHIP_STEP_TIMEOUT=<milliseconds>` changes it, a `timeout` key in `cucumber.js` does not.
