<p align="center"><img src="https://raw.githubusercontent.com/webship/hubspot-cms-steps/2.0.x/assets/logo.svg" alt="HubSpot logo" width="96"></p>

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

## From nothing to a green run

What the machine needs: git, Node.js 20 or later with npm, and
[DDEV](https://ddev.com/get-started/) for the demo site (or no container at all:
`npx http-server` serves the same pages).

**1. The site.** The demo site of this repository: static pages that copy the
markup HubSpot CMS renders (site, landing and blog pages, the cookie banner,
forms in the page, in an iframe and in the new editor's frame, menus and CTAs,
a blog with tags, authors and pages, the site search, a second language).
Start it with DDEV:

```bash
git clone https://github.com/webship/hubspot-cms-steps.git
cd hubspot-cms-steps
ddev start
```

The site answers at `https://hubspot-cms-steps.ddev.site`. Without DDEV,
`npx http-server demo-site -p 8090 -s` serves it at `http://localhost:8090`;
leave it running in its own terminal.

**2. A test project**, in another folder:

```bash
mkdir hubspot-tests && cd hubspot-tests
npm init -y
npm install --save-dev webship-js @webship-js/hubspot-cms-steps
npx init-webship-js
```

`npx init-webship-js` writes `cucumber.js`, `playwright.config.ts`, the
`tests/` folders with a first feature and the `npm test` scripts, and installs
Chromium. npm usually runs it already when it installs webship-js; a second run
changes nothing.

**3. `cucumber.js`.** Replace the file with the wiring of the pack: the step
files of webship-js and the entry file of the pack, and the address of the
site. The suite needs no account (see [Test users](#test-users)).

```javascript
module.exports = {
  default: {
    requireModule: ['tsx/cjs'],
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js',
      'node_modules/@webship-js/hubspot-cms-steps/tests/step-definitions/hubspot.steps.js',
      'tests/step-definitions/**/*.js',
    ],
    paths: ['tests/features/**/*.feature'],
    format: ['@cucumber/pretty-formatter', 'json:tests/reports/cucumber_report.json'],
    worldParameters: {
      launchUrl: process.env.LAUNCH_URL || 'https://hubspot-cms-steps.ddev.site',
      // The waits webship-js adds around each page, scenario and step (milliseconds).
      minWaitTime: { page: 3000, before_scenario: 0, after_scenario: 0, before_step: 0, after_step: 0 },
    },
  },
};
```

With the site of `npx http-server`, run with `LAUNCH_URL=http://localhost:8090`.

**4. A first feature**, `tests/features/first-run.feature`:

```gherkin
Feature: First run
  Scenario: The home page is a website page with the tracking code and the menu
    Given I am on "/index.html"
    Then the page should be a website page
    And the tracking code should be installed
    And the menu should have a link labeled "Pricing"

  Scenario: The cookie banner goes away once accepted
    Given I am on "/index.html"
    When I accept the cookie banner
    Then the cookie banner should not be visible
    And the cookie consent should be accepted
```

**5. Run it.**

```bash
npm test
```

A green first run prints every step, then the summary (the starter feature of
`npx init-webship-js` and the two scenarios above, passed) and the HTML report
it wrote:

```
3 scenarios (3 passed)
10 steps (10 passed)
0m03.819s (executing steps: 0m03.785s)
[webship-js] HTML report → …/hubspot-tests/tests/reports/cucumber_report.html
```

From there, copy the features of [`tests/features/`](tests/features/) (they
also ship in the package, under
`node_modules/@webship-js/hubspot-cms-steps/tests/features/`): together they use
every step of the pack, against the pages of the demo site.

### What the suite tests

The features of this repository run every step of the pack against the demo
site, and CI starts it with DDEV and runs them on every change: the page (the
generator, site, landing, blog listing and blog post pages, the tracking code
and its portal, the chat widget, a meetings embed, the language switcher and the
alternates, switching the language, the canonical address, a page hidden from
search engines), the cookie banner (accepting, declining, dismissing, the
consent cookie, a consent given before the visit), forms (in the page, in an
iframe and in the new editor's frame: their fields, required fields, ticking a
checkbox, the errors of a field and of the form, the success message), menus
and CTAs (labels, addresses, submenus, the active link, a CTA found by its text
or its image's alternative text, its destination), the blog (the listing, a
post, its tags and author, the pages of the listing, a tag page) and the site
search (the field, results, no results, opening a result). Every assertion runs
in its positive and in its negative form.

Not tested: what HubSpot itself does. The demo's small script stands in for
it, so the suite proves that the steps read HubSpot's markup, not that a given
HubSpot release produces it: a form actually sent (a contact created), the CTA
tracking redirect, the chat widget's own controls, smart content, memberships,
HubDB pages and the analytics of the tracking code (see
[What needs a HubSpot account](#what-needs-a-hubspot-account)).
`npm run probe` and the read-only features of
[`tests/features/real-sites/`](tests/features/real-sites/) check the selectors
on public HubSpot sites, outside CI. A run leaves nothing: the site is static
and the consent cookie lives in the browser.

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

## Test users

None. The steps read what a HubSpot site renders to a visitor, and the suite
tests the demo site of this repository (`demo-site/`), which has no sign-in:
`cucumber.js` lists no accounts (its `worldParameters` has no `users`) and no
scenario signs in. Pages behind a membership login are not covered (see
[What needs a HubSpot account](#what-needs-a-hubspot-account)). The JSON of the
accounts is empty:

```json
{}
```

## How the steps are written

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
| `the page generator should( not) (be\|start with\|contain) "HubSpot"` | `<meta name="generator" content="HubSpot">`; the name is a value of the step |
| `the page should( not) be a website\|landing\|blog listing\|blog post page` | the body classes `hs-site-page`, `hs-landing-page`, `hs-blog-listing`, `hs-blog-post` |
| `the tracking code should( not) be installed( for portal "<id>")` | `script#hs-script-loader`, its address ends in `<portal id>.js` |
| `the chat widget should( not) be present\|visible` | `#hubspot-messages-iframe-container` |
| `the page should( not) have a meetings embed( for "<link>")` | `.meetings-iframe-container iframe` |
| `the page should( not) have a language switcher` | `.lang_switcher_class` |
| `the page should( not) be available in the language "<code>"` | `link[rel="alternate"][hreflang]` |
| `I switch the language to "<code>"` | the switcher's link, else the language alternate |
| `the page should have the canonical address "<address>"` | `link[rel="canonical"]` |
| `the page should( not) be hidden from search engines` | `meta[name="robots"]` with `noindex` |

### Cookie consent

| Step | Relies on |
| --- | --- |
| `I accept\|decline\|dismiss the cookie banner` | `#hs-eu-confirmation-button`, `#hs-eu-decline-button`, `#hs-eu-close-button` |
| `the cookie banner should( not) be visible` / `I should( not) see the cookie banner` | `#hs-eu-cookie-confirmation` (inside `#hs-banner-parent`); it stays in the page, hidden, after an answer |
| `the cookie consent should( not) be accepted\|declined\|saved` | the cookie `__hs_cookie_cat_pref` (`1:true_2:true_3:true`, `1:false_2:false_3:false`) |
| `the cookie consent is accepted\|declined` (Given) | sets that cookie, so a scenario can start without the banner |

### Forms

| Step | Relies on |
| --- | --- |
| `the page should( not) have a form` | `form.hs-form`, or `[data-hsfc-id="Renderer"]` (new forms editor), in the page or in an iframe |
| `the form should( not) have a field "<name>"` | the input `name` (`email`; `0-1/email` in the new editor), its label or its placeholder |
| `I fill in the form field "<name>" with "<value>"` | the same; a select takes the option text or value |
| `I tick\|untick the form checkbox "<name or label>"` | the same |
| `I submit the form` | `div.hs_submit input[type=submit].hs-button` (new editor: `.hsfc-Button`) |
| `the form field "<name>" should( not) be required` | `required`, or the marker `span.hs-form-required` |
| `the form field "<name>" should( not) show an error( containing "<text>")` | `ul.hs-error-msgs[role=alert]` after the field, `input.invalid.error` |
| `the form should( not) show an error( containing "<text>")` | `.hs-error-msgs` (one per field and one for the whole form) |
| `the form should( not) show a success message( containing "<text>")` | `div.submitted-message` |

HubSpot renders a form in one of three ways, and the form steps find it in all three: raw HTML in the page
(`form.hs-form`, for example the CMS form module), an iframe (`iframe.hs-form-iframe`, the default for a form
not set as raw HTML), and, for the new forms editor, an iframe that HubSpot's embed script creates inside a
`div.hs-form-frame`. When a page has several forms, the form of the last field you filled is the one that is
submitted and checked. A form set to redirect leaves the page after the submit; assert the new address with
`I should be on "/thank-you"`.

### Menus and CTAs

| Step | Relies on |
| --- | --- |
| `the menu should( not) have a link labeled "<label>"` | `.hs-menu-wrapper a`, or a theme's `nav a` |
| `the menu link "<label>" should( not) link to "<address>"` | the link's `href` |
| `the menu item "<label>" should( not) have a submenu link "<label>"` | `li.hs-item-has-children > ul.hs-menu-children-wrapper` |
| `I open the menu item "<label>"` | hover, then click, on the item |
| `I click the menu link "<label>"` | the visible copy of the link (a page carries the menu twice) |
| `the menu link "<label>" should( not) be active` | `li.active`, or `aria-current="page"` |
| `I click the CTA "<label>"` | `.hs-cta-wrapper a.cta_button`, `.hs-cta-embed a`, found by text, `title`, `aria-label` or image `alt` |
| `the CTA "<label>" should( not) be visible` | the same |
| `the CTA "<label>" should( not) link to "<address>"` | the `cta_dest_link` attribute (the `href` is HubSpot's tracking redirect, `/cs/c/?cta_guid=...`) |

An address is a path (`/pricing`, which matches the same path on the current site) or a full address.

### Blogs and search

| Step | Relies on |
| --- | --- |
| `the blog should list at least <n> post(s)` | links to posts: one path segment under the blog path |
| `I open the blog post titled "<title>"` | the text, `aria-label`, `title` or image `alt` of that link |
| `I go to page <n> of the blog` / `the blog should( not) have pagination` | `/<blog>/page/<n>` |
| `the blog( post) should( not) have the tag / be tagged "<tag>"` / `I open the blog tag "<tag>"` | `/<blog>/tag/<tag>`; a post count after the tag ("API (3)") is ignored |
| `the blog( post) should( not) be written by "<author>"` | `/<blog>/author/<author>` |
| `the page should( not) have a site search` | `input.hs-search-field__input`, or `input[type=search]` |
| `I search the site for "<term>"` | the same, opened first when the theme hides it behind a search button; Enter |
| `the search results should list at least <n> result(s)` / `should( not) include "<title>"` | `/hs-search-results`: `li.hs-search-results__listing__item`, `.hs-search-results__title` |
| `the search should find no results` | the results page says "no results" and lists none |
| `I open the search result "<title>"` | `a.hs-search-results__link` |

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

- `npx cucumber-js tests/features/home.feature` runs one feature and `npx cucumber-js tests/features/home.feature:<line>` one scenario (the line of its `Scenario:`; the paths of `cucumber.js` are left out when the command line names any, and `npm run test:paths` checks it); `FEATURES=tests/features/a.feature,tests/features/b.feature npm test` runs a subset of the feature files too; `CUCUMBER_TAGS=@critical npm test` runs a tag lane (the default run leaves `@wip`, `@auth-setup` and the read-only `@real-site` checks out).
- `cucumber.js` carries the `video` block (`WEBSHIP_VIDEO=on-failure` records the browser) and the `javascript` block (`WEBSHIP_JS_ERROR_MODE=fail` fails a scenario on a JavaScript error; `@js-off` silences one scenario) that webship-js reads.
- The step timeout is webship-js's own (45 seconds, set when it loads); `WEBSHIP_STEP_TIMEOUT=<milliseconds>` changes it, a `timeout` key in `cucumber.js` does not.

## Logo

The HubSpot logo in this README comes from Simple Icons 16.37.0 (CC0-1.0), filled with the colour the set lists for the brand. The HubSpot name and logo are trademarks of their owner; this pack is not affiliated with or endorsed by them.
