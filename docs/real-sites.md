# What the selectors match on real sites

Counts from `npm run probe` (`scripts/probe-selectors.js`) on 2026-11-12: one page load per page, no login, nothing submitted. The raw output is in `real-sites-2026-11-12.json`. A blank cell is zero.

Read the table by row: a selector that matches on some sites and not on others (`.hs-menu-wrapper`, `form.hs-form`, `.hs-cta-wrapper`) is only on a page when the theme uses that HubSpot module, which is why the steps look for it in more than one place. `.hs-form-frame` and `[data-hsfc-id]` (the new forms editor) did not match on any of these pages: HubSpot's own embed script, read from its public address, creates the form in an iframe inside `div.hs-form-frame`.

| Selector | lean-labs.com / | huble.com / | huble.com /contact-us | huble.com /blog | huble.com blog post | blendb2b.com /blog | blendb2b.com search results | sevenatoms.com / | sevenatoms.com /blog | impactplus.com / | nanosurf.com /en/products | developers.hubspot.com /blog | offers.hubspot.com /contact-sales | hubspot.com / |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `meta generator HubSpot` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 2 | 1 | 1 |
| `tracking script (#hs-script-loader)` | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 2 | 1 | 1 |
| `.hs_cos_wrapper` | 31 | 26 | 10 | 9 | 11 | 8 | 27 | 47 | 15 | 17 | 24 | 4 | 10 | 16 |
| `.hs-site-page` |  |  | 1 |  |  |  | 1 | 1 |  | 1 | 1 |  |  |  |
| `.hs-landing-page` |  | 1 |  |  |  |  |  |  |  |  |  |  | 1 |  |
| `.hs-blog-listing` |  |  |  | 1 |  | 1 |  |  | 1 |  |  | 1 |  |  |
| `.hs-blog-post` |  |  |  |  | 1 |  |  |  |  |  |  |  |  |  |
| `link rel=alternate hreflang` |  | 3 | 3 | 3 |  |  |  |  |  |  |  |  | 6 | 7 |
| `.hs-menu-wrapper` |  |  |  |  |  |  | 3 | 3 | 3 | 3 | 12 |  |  |  |
| `.hs-menu-item` |  |  |  |  |  |  | 9 | 115 | 115 | 45 | 64 |  |  |  |
| `.hs-item-has-children` |  |  |  |  |  |  |  | 17 | 17 |  |  |  |  |  |
| `.hs-menu-children-wrapper` |  |  |  |  |  |  |  | 17 | 17 |  |  |  |  |  |
| `.hs-menu-wrapper li.active` |  |  |  |  |  |  |  |  | 2 |  | 4 |  |  |  |
| `theme menu (.menu__item)` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `nav / [role=navigation]` | 3 | 1 | 1 | 1 | 1 | 2 | 5 | 3 | 3 | 4 | 12 | 6 | 1 | 3 |
| `form.hs-form` | 2 | 1 | 1 |  | 1 | 1 |  |  |  |  | 1 |  | 1 |  |
| `.hbspt-form` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `.hs-form-field` | 7 | 8 | 8 |  | 1 | 2 |  |  |  |  | 17 |  | 10 |  |
| `.hs-form-required` | 4 |  |  |  |  | 1 |  |  |  |  | 7 |  | 7 |  |
| `.hs-error-msgs` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `.hs_submit` | 2 | 1 | 1 |  | 1 | 1 |  |  |  |  | 1 |  | 1 |  |
| `.submitted-message` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `.hs-form-frame` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `[data-hsfc-id]` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `iframe.hs-form-iframe` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `.hs-cta-wrapper` |  |  |  |  | 2 |  |  | 16 | 3 |  |  |  |  |  |
| `a.cta_button` |  |  |  |  | 2 |  |  | 16 | 3 |  |  |  |  |  |
| `a[cta_dest_link]` |  |  |  |  | 2 |  |  | 16 | 3 |  |  |  |  |  |
| `.hs-cta-embed` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `[data-hubspot-cta-id]` | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `#hs-eu-cookie-confirmation` |  | 1 | 1 | 1 | 1 | 1 | 1 |  |  |  | 1 | 1 | 1 | 1 |
| `#hs-banner-parent` |  | 1 | 1 | 1 | 1 | 1 | 1 |  |  |  | 1 | 1 | 1 | 1 |
| `#hs-eu-confirmation-button` |  | 1 | 1 | 1 | 1 | 1 | 1 |  |  |  | 1 | 1 | 1 | 1 |
| `#hs-eu-decline-button` |  | 1 | 1 | 1 | 1 | 1 | 1 |  |  |  | 1 | 1 | 1 | 1 |
| `.hs-search-field__input` |  |  |  |  |  | 1 |  |  |  |  | 1 |  |  |  |
| `.hs-search-results__listing__item` |  |  |  |  |  |  | 10 |  |  |  |  |  |  |  |
| `.lang_switcher_class` |  | 1 | 1 | 1 |  |  |  |  |  |  |  |  |  |  |
| `#hubspot-messages-iframe-container` |  |  |  |  |  |  |  |  |  |  |  |  |  | 1 |
| `.meetings-iframe-container` | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |
