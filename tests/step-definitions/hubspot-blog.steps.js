'use strict';

// Step definitions for HubSpot blogs: the listing, a post, pagination and tags.
//
// HubSpot does not fix the markup of a blog listing: the theme decides (four
// public sites checked, four different structures). What HubSpot fixes, and
// what these steps rely on:
//
//   - the page: `hs-blog-listing` or `hs-blog-post` on the body (see
//     "the page should be a HubSpot blog listing page")
//   - the URLs: `/<blog>/<post>`, `/<blog>/page/<n>`, `/<blog>/tag/<tag>` and
//     `/<blog>/author/<author>`, for the main listing, the tag and the author
//     listings alike
//
// So a post is counted and found by the link to it: a link, outside the
// header, footer, menu and pagination, to one path segment under the blog path
// (not `tag`, `author` or `page`). A post is opened by the text, `aria-label`,
// `title` or image `alt` of that link.

const { When, Then } = require('@cucumber/cucumber');
const { friendly, smartSettle } = require('webship-js/tests/step-definitions/webship');
const { budget, exactText, actOrExplain, poll } = require('./hubspot-helpers');

const BLOG_HINT = 'A blog post is a link to one path segment under the blog path (for example `/blog/my-post`), outside the header, footer and menu; open the blog listing page first, and check the title text.';

/**
 * Runs in the page. With no title: the number of distinct posts the page
 * links to. With a title: the first link to a post whose text, aria-label,
 * title or image alt contains it.
 *
 * @param {{title: string|null}} arg
 */
function postLinks(arg) {
  const trim = (p) => p.replace(/\/$/, '');
  const base = trim(window.location.pathname).replace(/\/(page\/\d+|tag\/[^/]+|author\/[^/]+)$/, '');
  if (!base) return arg.title ? null : -1;
  const skip = new Set(['tag', 'author', 'page', 'all', 'rss', 'rss.xml']);
  const posts = new Map();
  let match = null;
  for (const a of document.querySelectorAll('a[href]')) {
    if (a.closest('header, footer, nav, .hs-menu-wrapper, [role="navigation"], [class*="pagination"]')) continue;
    let url;
    try { url = new URL(a.href); } catch { continue; }
    if (url.origin !== window.location.origin) continue;
    const path = trim(url.pathname);
    if (!path.startsWith(`${base}/`)) continue;
    const rest = path.slice(base.length + 1);
    if (!rest || rest.includes('/') || skip.has(rest)) continue;
    posts.set(path, true);
    if (arg.title && !match) {
      const labels = [a.textContent, a.getAttribute('aria-label'), a.getAttribute('title'), ...Array.from(a.querySelectorAll('img[alt]')).map((i) => i.getAttribute('alt'))];
      if (labels.some((l) => (l || '').replace(/\s+/g, ' ').includes(arg.title))) match = a;
    }
  }
  return arg.title ? match : posts.size;
}

/**
 * Assert the blog listing shows at least N posts. The posts are counted by
 * their links (see the top of this file), and the count is polled for the wait
 * budget, so a listing that is still rendering is waited for.
 *
 * Example #1: Then the HubSpot blog should list at least 1 post
 * Example #2: Then the HubSpot blog should list at least 3 posts
 * Example #3: And the blog should list at least 2 posts
 * Example #4: Then blog should list at least 3 posts
 * Example #5: Then the HubSpot blog should list at least 1 posts
 *
 */
Then(/^(?:the )?(?:HubSpot )?blog should list at least (\d+) posts?$/, async function (minimumStr) {
  const minimum = Number(minimumStr);
  let count = 0;
  const ok = await poll(this, async () => {
    count = await this.page.evaluate(postLinks, { title: null });
    return count >= minimum;
  });
  if (!ok) {
    throw friendly({
      message: count === -1
        ? 'The page is at the root of the site, so there is no blog path to count posts under.'
        : `Expected at least ${minimum} blog post(s) in the listing, found ${count}.`,
      hint: BLOG_HINT,
    });
  }
});

/**
 * Open a blog post from the listing by its title: the text, aria-label, title
 * or image alt of its link.
 *
 * Example #1: When I open the HubSpot blog post titled "Why BDD testing matters for marketing sites"
 * Example #2: When I open the HubSpot blog post titled "5 tips for testing a HubSpot CMS site"
 * Example #3: And I open the blog post titled "Automating website QA with webship-js"
 * Example #4: When we open the HubSpot blog post titled "5 tips for testing a HubSpot CMS site"
 * Example #5: And open the blog post titled "Why BDD testing matters for marketing sites"
 *
 */
When(/^(I |we )*open the (?:HubSpot )?blog post titled "([^"]*)"$/, async function (pronounCase, title) {
  let handle = null;
  await poll(this, async () => {
    const candidate = await this.page.evaluateHandle(postLinks, { title });
    handle = candidate.asElement();
    return Boolean(handle);
  });
  if (!handle) {
    throw friendly({ action: 'open the blog post', target: title, hint: BLOG_HINT });
  }
  await actOrExplain('open the blog post', title, () => handle.click(), BLOG_HINT);
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 3000);
});

/**
 * Go to a numbered page of the blog listing, through its link (`/page/2`).
 *
 * Example #1: When I go to page 2 of the HubSpot blog
 * Example #2: And I go to page 3 of the blog
 * Example #3: When we go to page 2 of the HubSpot blog
 * Example #4: And go to page 2 of the blog
 * Example #5: When I go to page 1 of the blog
 *
 */
When(/^(I |we )*go to page (\d+) of the (?:HubSpot )?blog$/, async function (pronounCase, number) {
  const links = this.page.locator(`a[href$="/page/${number}"], a[href$="/page/${number}/"], a[href*="/page/${number}?"]`);
  const page1 = Number(number) === 1;
  const target = page1 ? this.page.locator('[class*="pagination"] a, nav a').filter({ hasText: exactText('1') }) : links;
  await actOrExplain('go to the blog page', number, async () => {
    await target.first().waitFor({ state: 'visible', timeout: budget(this) });
    await target.first().click();
  }, 'HubSpot numbers the pages of a blog listing `/<blog>/page/<n>` (the first page is the blog itself); the pagination must show the link for that page.');
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 3000);
});

/**
 * Assert the blog listing does (or does not) have pagination: a link to the
 * second page (`/page/2`).
 *
 * Example #1: Then the HubSpot blog should have pagination
 * Example #2: And the blog should have pagination
 * Example #3: Then the HubSpot blog should not have pagination
 * Example #4: But the blog should not have pagination
 * Example #5: Then blog should have pagination
 *
 */
Then(/^(?:the )?(?:HubSpot )?blog should( not)* have pagination$/, async function (notCase) {
  const links = this.page.locator('a[href$="/page/2"], a[href$="/page/2/"], a[href*="/page/2?"]');
  const ok = await poll(this, async () => ((await links.count()) > 0) === !notCase);
  if (!ok) {
    throw friendly({
      message: notCase ? 'Expected the blog not to have pagination, but it links to page 2.' : 'Expected the blog to have pagination (a link to `/page/2`), but there is none.',
      hint: 'HubSpot numbers the pages of a blog listing `/<blog>/page/<n>`; a listing with a single page has no pagination.',
    });
  }
});

/**
 * Assert the blog page does (or does not) show a tag, as a link to its
 * listing (`/<blog>/tag/<tag>`): the tag filter of a listing, or the tags of a
 * post.
 *
 * Example #1: Then the HubSpot blog should have the tag "Testing"
 * Example #2: And the blog should have the tag "HubSpot"
 * Example #3: Then the HubSpot blog post should be tagged "Testing"
 * Example #4: But the blog post should not be tagged "Marketing"
 * Example #5: Then blog should not have the tag "Finance"
 *
 */
Then(/^(?:the )?(?:HubSpot )?blog(?: post)? should( not)* (?:have the tag|be tagged) "([^"]*)"$/, async function (notCase, tag) {
  const links = this.page.locator('a[href*="/tag/"]').filter({ hasText: exactText(tag, true) });
  const ok = await poll(this, async () => ((await links.count()) > 0) === !notCase);
  if (!ok) {
    throw friendly({
      message: notCase ? `Expected the page not to show the tag "${tag}", but it does.` : `Expected the page to show the tag "${tag}" (a link to \`/tag/...\`), but it does not.`,
      hint: 'HubSpot links each tag to `/<blog>/tag/<tag>`; the tag is matched by its whole text (a post count such as "(3)" after it is ignored). A theme may leave the tags out of the post or the listing.',
    });
  }
});

/**
 * Open a tag's listing from a blog page, through its link.
 *
 * Example #1: When I open the HubSpot blog tag "Testing"
 * Example #2: And I open the blog tag "HubSpot"
 * Example #3: When we open the HubSpot blog tag "Automation"
 * Example #4: And open the blog tag "Marketing"
 * Example #5: When I open the blog tag "Testing"
 *
 */
When(/^(I |we )*open the (?:HubSpot )?blog tag "([^"]*)"$/, async function (pronounCase, tag) {
  const links = this.page.locator('a[href*="/tag/"]').filter({ hasText: exactText(tag, true) });
  await actOrExplain('open the blog tag', tag, async () => {
    await links.first().waitFor({ state: 'visible', timeout: budget(this) });
    await links.first().click();
  }, 'HubSpot links each tag to `/<blog>/tag/<tag>`; the tag is matched by its whole text, and its link must be visible on the page.');
  await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 3000);
});

/**
 * Assert the blog post does (or does not) name an author, as a link to the
 * author's listing (`/<blog>/author/<author>`).
 *
 * Example #1: Then the HubSpot blog post should be written by "Jane Doe"
 * Example #2: And the blog post should be written by "John Roe"
 * Example #3: Then the HubSpot blog should be written by "Jane Doe"
 * Example #4: But the blog post should not be written by "John Roe"
 * Example #5: Then blog post should be written by "Jane Doe"
 *
 */
Then(/^(?:the )?(?:HubSpot )?blog(?: post)? should( not)* be written by "([^"]*)"$/, async function (notCase, author) {
  const links = this.page.locator('a[href*="/author/"]').filter({ hasText: exactText(author) });
  const ok = await poll(this, async () => ((await links.count()) > 0) === !notCase);
  if (!ok) {
    throw friendly({
      message: notCase ? `Expected the page not to name the author "${author}", but it does.` : `Expected the page to name the author "${author}" (a link to \`/author/...\`), but it does not.`,
      hint: 'HubSpot links each author to `/<blog>/author/<author>`; the author is matched by their whole name. A theme may leave the author out of the post.',
    });
  }
});
