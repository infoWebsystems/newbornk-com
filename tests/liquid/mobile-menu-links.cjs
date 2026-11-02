const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { Liquid } = require('liquidjs');
const root = path.resolve(__dirname, '../..');
const engine = new Liquid({root: ['snippets', 'blocks'].map(dir => path.join(root, dir)), extname: '.liquid', jsTruthy: false});
for (const tag of ['doc', 'schema', 'stylesheet']) engine.registerTag(tag, {
  parse(token, tokens) { while (tokens.length) if (tokens.shift().name === `end${tag}`) return; throw new Error(`Unclosed ${tag}`); },
  render() { return ''; }
});
engine.registerFilter('t', (key, ...args) => key.endsWith('open_submenu') ? `Submenu: ${Object.fromEntries(args).title}` : key);
engine.registerFilter('handleize', value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-'));
const item = (title, handle, locale = '', count = 2, links = []) => ({
  title, url: `${locale}/collections/${handle}`, type: 'collection_link', links,
  object: {handle, all_products_count: count}
});
const render = (links, categories = [], extra = {}) => engine.renderFile('_menu_mobile', {
  request: {design_mode: true}, section: {settings: {}}, settings: {}, collections: {},
  block: {settings: {main_menu_mobile: {links}, menu_categories: {links: categories}}}, ...extra
});

test('both menu tabs expose localized parent links independently of native toggles at every level', async () => {
  for (const locale of ['', '/en']) {
    const child = item('Jackets', 'jackets', locale, 2, [item('Winter', 'winter', locale)]);
    const parent = item('Clothing', 'clothing', locale, 4, [child]);
    parent.current = true;
    const html = await render([parent], [parent]);
    assert.equal((html.match(/class="nbk-mobile-menu-details"/g) || []).length, 4);
    for (const handle of ['clothing', 'jackets', 'winter']) {
      assert.equal((html.match(new RegExp(`href="${locale}/collections/${handle}"`, 'g')) || []).length, 2);
    }
    assert.equal((html.match(/aria-label="Submenu: Clothing"/g) || []).length, 2);
    assert.match(html, new RegExp(`href="${locale}/collections/clothing" aria-current="page"`));
    assert.doesNotMatch(html, /<hdt-accordion|data-url=/);
    for (const [, summary] of html.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>/g)) {
      assert.doesNotMatch(summary, /<a\b/, 'Links and disclosure buttons must be separate controls');
    }
  }
});

test('unavailable parent remains expandable without linking to an empty collection', async () => {
  const parent = item('Unavailable parent', 'empty-parent', '', 0, [item('Available child', 'available')]);
  const html = await render([parent, item('Empty leaf', 'empty-leaf', '', 0)]);
  assert.match(html, /<span class="hdt-menu-link nbk-mobile-menu-parent">/);
  assert.match(html, /aria-label="Submenu: Unavailable parent"/);
  assert.match(html, /href="\/collections\/available"/);
  assert.doesNotMatch(html, /href="\/collections\/empty-parent"|empty-leaf/);
});

test('parent labels preserve badges and escape navigation text and query parameters', async () => {
  const parent = item('Accessories & Bags [label_new]', 'accessories?sort_by=best-selling&filter.v.availability=1');
  const html = await engine.renderFile('nbk-mobile-menu-parent', {item: parent, destination_visible: '1'});
  assert.match(html, /Accessories &amp; Bags/);
  assert.match(html, /&amp;filter.v.availability=1/);
  assert.match(html, /hdt_label_new/);
});
