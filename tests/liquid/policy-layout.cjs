const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { Liquid } = require('liquidjs');

const root = path.resolve(__dirname, '../..');
const layout = readFileSync(path.join(root, 'layout/theme.liquid'), 'utf8');
// Render the real layout with unrelated header, footer and head integrations stubbed.
function engineFor(locale, globals = {}) {
  const engine = new Liquid({ root: path.join(root, 'snippets'), extname: '.liquid', globals });
  const labels = JSON.parse(readFileSync(path.join(root, 'locales', locale === 'en' ? 'en.default.json' : `${locale}.json`), 'utf8'));
  engine.registerFilter('t', key => key.split('.').reduce((value, part) => value?.[part], labels) ?? key);
  engine.registerTag('doc', { parse(token, tokens) { while (tokens.length) if (tokens.shift().name === 'enddoc') return; }, render() { return ''; } });
  for (const tag of ['section', 'sections']) engine.registerTag(tag, { parse() {}, render() { return ''; } });
  return engine;
}
const isolated = layout.replace(/\{%-?\s*render\s+'([^']+)'[^%]*-?%\}/g, (tag, name) => name === 'nbk-policy-title' || name === 'nbk-page-h1' ? tag : '')
  .replace(/^\s*render\s+'[^']+'.*$/gm, '');
function context(locale, type = 'policy', handle = 'refund-policy') {
  return { request: { page_type: type, path: `/${locale}/policies/${handle}`, locale: { iso_code: locale } },
    page_title: 'Refund policy', current_page: 1, settings: {}, template: {}, shop: { name: 'NEWBORN K' },
    content_for_layout: '<div class="shopify-policy__container"><div class="shopify-policy__title"><h1>Refund policy</h1></div><div class="shopify-policy__body"><p>Approved terms &amp; <a href="/pages/return">return link</a>.</p></div></div>' };
}
test('policy layout renders a single localized heading and title without altering approved body HTML', async () => {
  for (const [locale, title] of [['uk', 'Повернення та обмін'], ['en', 'Returns and exchanges'], ['ru', 'Возврат и обмен']]) {
    const ctx = context(locale);
    const html = await engineFor(locale, ctx).parseAndRender(isolated, ctx);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert(html.includes(`<h1>${title}</h1>`));
    assert(html.includes(`<title>${title} &ndash; NEWBORN K</title>`));
    assert(html.includes('<p>Approved terms &amp; <a href="/pages/return">return link</a>.</p>'));
    assert(html.includes('nbk-policy.css'));
  }
});
test('shipping label is localized; unknown policy types and unsupported locales keep Shopify titles', async () => {
  for (const [locale, handle, expected] of [['uk', 'shipping-policy', 'Оплата та доставка'], ['en', 'shipping-policy', 'Payment and delivery'], ['uk', 'privacy-policy', 'Refund policy'], ['pl', 'refund-policy', 'Refund policy']]) {
    assert.equal((await engineFor(locale).renderFile('nbk-policy-title', context(locale, 'policy', handle))).trim(), expected);
  }
});
test('ordinary pages retain their original title and content with no policy stylesheet', async () => {
  const ctx = context('uk', 'page');
  const html = await engineFor('uk', ctx).parseAndRender(isolated, ctx);
  assert(html.includes(ctx.content_for_layout));
  assert(html.includes('<title>Refund policy &ndash; NEWBORN K</title>'));
  assert(!html.includes('nbk-policy.css'));
});
