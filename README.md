# hubspot-cms-steps

A [webship-js](https://webship.co/docs/webship-js/2.0.x) (Playwright + Cucumber-js) step pack for
websites built on HubSpot CMS. It tests what a HubSpot site renders: the cookie consent banner, forms
(including validation errors and the thank-you message), menus and CTAs, blog listings and posts,
the site search, language alternates, the tracking code, the chat widget and the page meta, all in
plain-English Gherkin.

It is published to npm as `@webship-js/hubspot-cms-steps`. The repository is also a project you can run
or fork: it carries a static demo site (`demo-site/`) that copies the markup HubSpot CMS renders, and a
suite of `.feature` files that runs against it in CI without a HubSpot account. The selectors behind the
steps were checked on public sites built on HubSpot CMS; the counts are in
[`docs/real-sites.md`](docs/real-sites.md).

## Installation

```bash
npm install --save-dev webship-js @webship-js/hubspot-cms-steps
```

Add the pack to the `require` list of your project's `cucumber.js`:

```javascript
module.exports = {
  default: {
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js', // webship-js core steps
      'node_modules/@webship-js/hubspot-cms-steps/tests/step-definitions/hubspot.steps.js', // this pack
      'tests/step-definitions/**/*.js', // your own steps, if any
    ],
    paths: ['tests/features/**/*.feature'],
    worldParameters: {
      launchUrl: process.env.LAUNCH_URL || 'https://your-hubspot-site.example',
    },
  },
};
```

`hubspot.steps.js` is the entry point; it loads the other step files.

## How the steps are written

- The product word is optional: "the HubSpot cookie banner" and "the cookie banner" both match.
- Every assertion takes `should` or `should not`. Every action takes `I`, `we` or no pronoun.
- Every assertion waits for its condition for the `minWaitTime.page` budget (at least 10 seconds) instead
  of reading the page once, and an action that changes the page settles the page before the next step.
- Every failure is a short message with a hint (what was expected, what was found, where HubSpot puts it),
  not an assertion or Playwright stack.
- A label is matched as the whole visible text (a menu link, a tag, a CTA); a title is matched as a part of the text.
- Every step has its regular expression and five Gherkin examples in the JSDoc block above it.
  `npm run test:examples` checks that each example matches its own step and no webship-js core step, and
  that every feature step is defined exactly once.

## Steps

HubSpot does not fix most of its markup: the theme decides. The last column says what the step relies on,
and every item in it was found on real sites (see [What the selectors match on real sites](docs/real-sites.md)).

### The page

| Step | Relies on |
| --- | --- |
| `the page should( not) be a HubSpot page` | `<meta name="generator" content="HubSpot">` |
| `the page should( not) be a HubSpot website\|landing\|blog listing\|blog post page` | the body classes `hs-site-page`, `hs-landing-page`, `hs-blog-listing`, `hs-blog-post` |
| `the HubSpot tracking code should( not) be installed( for portal "<id>")` | `script#hs-script-loader`, its address ends in `<portal id>.js` |
| `the HubSpot chat widget should( not) be present\|visible` | `#hubspot-messages-iframe-container` |
| `the page should( not) have a HubSpot meetings embed( for "<link>")` | `.meetings-iframe-container iframe` |
| `the page should( not) have a HubSpot language switcher` | `.lang_switcher_class` |
| `the page should( not) be available in the language "<code>"` | `link[rel="alternate"][hreflang]` |
| `I switch the language to "<code>"` | the switcher's link, else the language alternate |
| `the page should have the canonical address "<address>"` | `link[rel="canonical"]` |
| `the page should( not) be hidden from search engines` | `meta[name="robots"]` with `noindex` |

### Cookie consent

| Step | Relies on |
| --- | --- |
| `I accept\|decline\|dismiss the HubSpot cookie banner` | `#hs-eu-confirmation-button`, `#hs-eu-decline-button`, `#hs-eu-close-button` |
| `the HubSpot cookie banner should( not) be visible` / `I should( not) see the HubSpot cookie banner` | `#hs-eu-cookie-confirmation` (inside `#hs-banner-parent`); it stays in the page, hidden, after an answer |
| `the HubSpot cookie consent should( not) be accepted\|declined\|saved` | the cookie `__hs_cookie_cat_pref` (`1:true_2:true_3:true`, `1:false_2:false_3:false`) |
| `the HubSpot cookie consent is accepted\|declined` (Given) | sets that cookie, so a scenario can start without the banner |

### Forms

| Step | Relies on |
| --- | --- |
| `the page should( not) have a HubSpot form` | `form.hs-form`, or `[data-hsfc-id="Renderer"]` (new forms editor), in the page or in an iframe |
| `the HubSpot form should( not) have a field "<name>"` | the input `name` (`email`; `0-1/email` in the new editor), its label or its placeholder |
| `I fill in the HubSpot form field "<name>" with "<value>"` | the same; a select takes the option text or value |
| `I tick\|untick the HubSpot form checkbox "<name or label>"` | the same |
| `I submit the HubSpot form` | `div.hs_submit input[type=submit].hs-button` (new editor: `.hsfc-Button`) |
| `the HubSpot form field "<name>" should( not) be required` | `required`, or the marker `span.hs-form-required` |
| `the HubSpot form field "<name>" should( not) show an error( containing "<text>")` | `ul.hs-error-msgs[role=alert]` after the field, `input.invalid.error` |
| `the HubSpot form should( not) show an error( containing "<text>")` | `.hs-error-msgs` (one per field and one for the whole form) |
| `the HubSpot form should( not) show a success message( containing "<text>")` | `div.submitted-message` |

HubSpot renders a form in one of three ways, and the form steps find it in all three: raw HTML in the page
(`form.hs-form`, for example the CMS form module), an iframe (`iframe.hs-form-iframe`, the default for a form
not set as raw HTML), and, for the new forms editor, an iframe that HubSpot's embed script creates inside a
`div.hs-form-frame`. When a page has several forms, the form of the last field you filled is the one that is
submitted and checked. A form set to redirect leaves the page after the submit; assert the new address with
`I should be on "/thank-you"`.

### Menus and CTAs

| Step | Relies on |
| --- | --- |
| `the HubSpot menu should( not) have a link labeled "<label>"` | `.hs-menu-wrapper a`, or a theme's `nav a` |
| `the HubSpot menu link "<label>" should( not) link to "<address>"` | the link's `href` |
| `the HubSpot menu item "<label>" should( not) have a submenu link "<label>"` | `li.hs-item-has-children > ul.hs-menu-children-wrapper` |
| `I open the HubSpot menu item "<label>"` | hover, then click, on the item |
| `I click the HubSpot menu link "<label>"` | the visible copy of the link (a page carries the menu twice) |
| `the HubSpot menu link "<label>" should( not) be active` | `li.active`, or `aria-current="page"` |
| `I click the HubSpot CTA "<label>"` | `.hs-cta-wrapper a.cta_button`, `.hs-cta-embed a`, found by text, `title`, `aria-label` or image `alt` |
| `the HubSpot CTA "<label>" should( not) be visible` | the same |
| `the HubSpot CTA "<label>" should( not) link to "<address>"` | the `cta_dest_link` attribute (the `href` is HubSpot's tracking redirect, `/cs/c/?cta_guid=...`) |

An address is a path (`/pricing`, which matches the same path on the current site) or a full address.

### Blogs and search

| Step | Relies on |
| --- | --- |
| `the HubSpot blog should list at least <n> post(s)` | links to posts: one path segment under the blog path |
| `I open the HubSpot blog post titled "<title>"` | the text, `aria-label`, `title` or image `alt` of that link |
| `I go to page <n> of the HubSpot blog` / `the HubSpot blog should( not) have pagination` | `/<blog>/page/<n>` |
| `the HubSpot blog( post) should( not) have the tag / be tagged "<tag>"` / `I open the HubSpot blog tag "<tag>"` | `/<blog>/tag/<tag>`; a post count after the tag ("API (3)") is ignored |
| `the HubSpot blog( post) should( not) be written by "<author>"` | `/<blog>/author/<author>` |
| `the page should( not) have a HubSpot site search` | `input.hs-search-field__input`, or `input[type=search]` |
| `I search the HubSpot site for "<term>"` | the same, opened first when the theme hides it behind a search button; Enter |
| `the HubSpot search results should list at least <n> result(s)` / `should( not) include "<title>"` | `/hs-search-results`: `li.hs-search-results__listing__item`, `.hs-search-results__title` |
| `the HubSpot search should find no results` | the results page says "no results" and lists none |
| `I open the HubSpot search result "<title>"` | `a.hs-search-results__link` |

HubSpot does not fix the markup of a blog listing (four public sites checked, four different structures). It
does fix the body classes and the URLs, so the blog steps work on links and work on any theme.

## What needs a HubSpot account

The pack is read-only against a real site and needs no account. What it cannot check without one:

- The thank-you message of a submitted form (`div.submitted-message`, or the new editor's own markup): a
  test must submit a form, which creates a contact. Use a test form in a sandbox account, or assert the
  redirect address with `I should be on ...`.
- The new forms editor's field and error markup. The container (`div.hs-form-frame`) and the iframe are
  read from HubSpot's public embed script; the class names inside (`hsfc-*`) from a customer theme's
  stylesheet. The form steps use generic form semantics inside the iframe, and fall back to the label.
- The new CTA editor's wrapper (`.hs-cta-embed`) and the chat widget's own controls.
- Pages behind membership login and HubDB pages.

## Repository layout

| Path | Purpose |
| --- | --- |
| `tests/step-definitions/hubspot.steps.js` | Entry point: loads the other step files. |
| `tests/step-definitions/hubspot-site.steps.js` | The page steps. |
| `tests/step-definitions/hubspot-consent.steps.js` | The cookie consent steps. |
| `tests/step-definitions/hubspot-forms.steps.js` | The form steps. |
| `tests/step-definitions/hubspot-navigation.steps.js` | The menu and CTA steps. |
| `tests/step-definitions/hubspot-blog.steps.js` | The blog steps. |
| `tests/step-definitions/hubspot-search.steps.js` | The site search steps. |
| `tests/step-definitions/hubspot-helpers.js` | Shared helpers (not a step file). |
| `tests/features/` | `.feature` files for the demo site. |
| `tests/features/real-sites/` | Read-only `@real-site` checks against public sites built on HubSpot CMS, one file per host. |
| `demo-site/` | Static demo site that copies the markup HubSpot CMS renders, used to exercise the steps in CI. |
| `docs/real-sites.md` | What every selector matches on real sites (counts from the probe). |
| `scripts/probe-selectors.js` | Counts the HubSpot selectors on any public page. |
| `.github/workflows/ci.yml` | GitHub Actions workflow that serves the demo site and runs the suite on every push and pull request. |

## Running the tests locally

With the bundled static server (no DDEV needed):

```bash
npm install
npx playwright install --with-deps chromium
npm start &                         # serves demo-site/ on http://localhost:8090
npm test
```

Or with [DDEV](https://ddev.com/get-started/), which serves `demo-site/` at the project URL:

```bash
ddev start
LAUNCH_URL=$(ddev describe -j | node -e "process.stdin.once('data', d => console.log(JSON.parse(d).raw.primary_url))") npm test
```

The reference features assert the demo site's own copy, labels and paths ("Acme Analytics", `/pricing.html`).
Swap them for your site's content when you copy a feature.

## Checking a real site

`npm run probe -- https://example.com/ https://example.com/blog` opens each page once and prints how many
elements every HubSpot selector this pack uses matches. Use it before you write a scenario against your own
site: the default modules (`.hs-menu-wrapper`, `form.hs-form`, `.hs-cta-wrapper`) are only on a page when the
theme uses them.

`npm run test:real-sites` runs the `@real-site` features in `tests/features/real-sites/`, one file per public
host (`huble.com.feature` runs with `LAUNCH_URL=https://huble.com`); `npm run test:real-sites -- huble` runs
one. They are read-only: a form is submitted empty, so the browser-side validation stops it and nothing is
sent. The default run leaves them out.

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

This project only accepts changes through a pull request against the `2.0.x` branch. Open an issue first.

## License

MIT. See [LICENSE](LICENSE).

## Lanes, subsets and the settings webship-js reads

- `FEATURES=tests/features/a.feature,tests/features/b.feature npm test` runs a subset of the feature files; `CUCUMBER_TAGS=@critical npm test` runs a tag lane (the default run leaves `@wip`, `@auth-setup` and the read-only `@real-site` checks out).
- `cucumber.js` carries the `video` block (`WEBSHIP_VIDEO=on-failure` records the browser) and the `javascript` block (`WEBSHIP_JS_ERROR_MODE=fail` fails a scenario on a JavaScript error; `@js-off` silences one scenario) that webship-js reads.
- The step timeout is webship-js's own (45 seconds, set when it loads); `WEBSHIP_STEP_TIMEOUT=<milliseconds>` changes it, a `timeout` key in `cucumber.js` does not.
