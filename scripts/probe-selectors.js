'use strict';

// Opens each URL given on the command line once, in the webship-js
// Playwright, and prints how many elements every HubSpot CMS selector this
// pack relies on matches. Use it to check a real site before you write a
// scenario against it (read-only: one page load per URL, no login, no
// form submission).
//
//   node scripts/probe-selectors.js https://example.com/ https://example.com/blog
//   node scripts/probe-selectors.js --json https://example.com/ > counts.json

const { chromium } = require('playwright');

const SELECTORS = {
  // Page signals
  'meta generator HubSpot': 'meta[name="generator"][content*="HubSpot" i]',
  'tracking script (hs-script-loader)': '#hs-script-loader, script[src*="hs-scripts.com"], script[src*="hs-analytics.net"]',
  'hs_cos_wrapper': '.hs_cos_wrapper',
  // Menu
  '.hs-menu-wrapper': '.hs-menu-wrapper',
  '.hs-menu-item': '.hs-menu-item',
  '.hs-item-has-children': '.hs-item-has-children',
  'theme menu (.menu__item)': '.menu__item',
  'nav / [role=navigation]': 'nav, [role="navigation"]',
  // Forms
  'form.hs-form': 'form.hs-form',
  '.hbspt-form': '.hbspt-form',
  '.hs-form-field': '.hs-form-field',
  '.hs-error-msgs': '.hs-error-msgs',
  '.hs_submit': '.hs_submit',
  '.submitted-message': '.submitted-message',
  '.hs-form-frame': '.hs-form-frame',
  '[data-hsfc-id]': '[data-hsfc-id]',
  'iframe.hs-form-iframe': 'iframe.hs-form-iframe, iframe[id^="hs-form-iframe"]',
  // CTAs
  '.hs-cta-wrapper': '.hs-cta-wrapper',
  '.cta_button': '.cta_button',
  '.hs-cta-embed': '.hs-cta-embed',
  '.hs-button': '.hs-button',
  // Blog
  '.blog-index': '.blog-index',
  '.blog-post': '.blog-post',
  '.hs-blog-post-listing': '.hs-blog-post-listing',
  '.blog-pagination': '.blog-pagination, .hs-pagination, [class*="pagination"]',
  // Cookie banner
  '#hs-eu-cookie-confirmation': '#hs-eu-cookie-confirmation',
  '#hs-banner-parent': '#hs-banner-parent',
  '#hs-eu-confirmation-button': '#hs-eu-confirmation-button',
  '#hs-eu-decline-button': '#hs-eu-decline-button',
  // Site search, languages, chat, meetings
  '.hs-search-field': '.hs-search-field',
  '.hs-search-field__input': '.hs-search-field__input, input.hs-search-field__input',
  '.lang_switcher_class': '.lang_switcher_class',
  '#hubspot-messages-iframe-container': '#hubspot-messages-iframe-container',
  '.meetings-iframe-container': '.meetings-iframe-container',
};

async function probe(browser, url) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  const result = { url, status: 0, finalUrl: url, title: '', counts: {} };
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    result.status = response ? response.status() : 0;
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(3000); // the cookie banner and chat widget load late
    result.finalUrl = page.url();
    result.title = (await page.title()).slice(0, 80);
    result.counts = await page.evaluate((selectors) => {
      const out = {};
      for (const [label, sel] of Object.entries(selectors)) {
        try { out[label] = document.querySelectorAll(sel).length; } catch (e) { out[label] = -1; }
      }
      return out;
    }, SELECTORS);
  } catch (err) {
    result.error = String(err.message || err).split('\n')[0];
  }
  await context.close();
  return result;
}

(async () => {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const urls = args.filter((a) => /^https?:\/\//.test(a));
  if (!urls.length) {
    console.error('Usage: node scripts/probe-selectors.js [--json] <url> [<url> ...]');
    process.exit(2);
  }
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const url of urls) {
    results.push(await probe(browser, url));
    await new Promise((r) => setTimeout(r, 4000)); // one page at a time, with a pause
  }
  await browser.close();
  if (json) { console.log(JSON.stringify(results, null, 2)); return; }
  for (const r of results) {
    console.log(`\n${r.url}  [${r.status}]  ${r.title}${r.error ? `  ERROR: ${r.error}` : ''}`);
    if (r.finalUrl !== r.url) console.log(`  -> ${r.finalUrl}`);
    for (const [label, n] of Object.entries(r.counts)) if (n) console.log(`  ${String(n).padStart(4)}  ${label}`);
  }
})();
