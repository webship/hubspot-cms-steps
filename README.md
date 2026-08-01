# hubspot-cms-steps

A standalone [webship-js](https://webship.co/docs/webship-js/2.0.x) (Playwright + Cucumber-js)
test project for websites built on the HubSpot CMS: the cookie consent banner, HubSpot forms,
CTA modules, the menu module, and the blog listing module — all in plain-English Gherkin.

This is not an npm package to install elsewhere — it's a project you run directly (or fork)
to test a HubSpot CMS site. It ships a self-contained demo HubSpot-style site (`demo-site/`)
and a full suite of `.feature` files, so the suite can be verified in CI without a real
HubSpot account.

## Repository layout

| Path | Purpose |
| --- | --- |
| `tests/step-definitions/hubspot.steps.js` | Custom step definitions for HubSpot-specific behaviour. |
| `tests/features/` | `.feature` files testing the demo site's main pages (home, pricing, about, blog, contact). |
| `demo-site/` | Static demo HubSpot-style site used to exercise the steps in CI. |
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

## Writing a scenario

```gherkin
Feature: Contact page

  Scenario: Visitor submits the contact form
    Given I am on "/contact-us.html"
    And I accept the HubSpot cookie banner
    When I fill in the HubSpot form field "email" with "jane@example.com"
    And I submit the HubSpot form
    Then the HubSpot form should show a success message
```

## Contributing

This project only accepts changes via pull request against the `2.0.x` branch.

## License

MIT — see [LICENSE](LICENSE).
