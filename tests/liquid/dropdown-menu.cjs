const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { Liquid } = require('liquidjs');

const engine = new Liquid({
  root: path.resolve(__dirname, '../../snippets'),
  extname: '.liquid', strictFilters: true, jsTruthy: false
});
for (const tag of ['doc', 'stylesheet']) engine.registerTag(tag, {
  parse(token, tokens) {
    while (tokens.length) if (tokens.shift().name === `end${tag}`) return;
    throw new Error(`Unclosed ${tag}`);
  }, render() { return ''; }
});
engine.registerFilter('handleize', value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-'));
const collection = (handle, count = 1, children = []) => ({
  title: handle, type: 'collection_link', url: `/en/collections/${handle}?source=menu`,
  object: { handle, all_products_count: count }, links: children
});
const section = { settings: { header_menu_colors: 'scheme-2', open_event: 'hover' } };
const render = (links, wide_panel = true) => engine.renderFile('sub_menu_blocks', {
  link: { title: 'Existing & translated title', links }, wide_panel, section
});

test('long dropdown preserves every original destination and order beyond 50 links', async () => {
  const links = Array.from({ length: 72 }, (_, i) => collection(`brand-${i}`));
  links.splice(20, 0, collection('empty', 0));
  links[3].current = true;
  const html = await render(links);
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(hrefs, links.filter(l => l.object.all_products_count).map(l => l.url));
  assert.match(html, /--nbk-dropdown-columns: 4/);
  assert.match(html, /href="\/en\/collections\/brand-3\?source=menu"[^>]+aria-current="page"/);
  assert(!html.includes('collections/empty'));
});

test('native nested accordion preserves child links while hiding empty parent destination', async () => {
  const current = { ...collection('actual-child'), current: true };
  const html = await render([collection('empty-parent', 0, [current, collection('empty-child', 0)])]);
  assert.match(html, /<hdt-accordion[^>]+only-click-icon/);
  assert.match(html, /<summary(?![^>]*data-url=)[^>]*aria-expanded="false"/);
  assert.match(html, /href="\/en\/collections\/actual-child\?source=menu"[^>]+hdt-menu-link--active[^>]+aria-current="page"/);
  assert(!html.includes('href="/en/collections/empty-parent'));
  assert(!html.includes('collections/empty-child'));
});

test('translated menus use existing labels, with sizing based on visible links only', async () => {
  const links = [collection('perfumy'), collection('svichky'), ...Array.from({ length: 25 }, (_, i) => collection(`hidden-${i}`, 0))];
  const html = await render(links);
  assert.match(html, /Existing &amp; translated title/);
  assert.match(html, /--nbk-dropdown-columns: 2/);
  assert.match(html, /nbk-dropdown-panel--short/);
  assert(!html.includes('hidden-'));
  const native = await render(links, false);
  assert(!native.includes('nbk-dropdown-panel'));
  assert(!native.includes('nbk-dropdown-title'));
  assert.match(native, /color-scheme="scheme-2">\s*<ul/);
});

test('short menus use up to four grid columns while longer menus retain vertical columns', async () => {
  for (const [count, columns, short] of [[1, 1, true], [2, 2, true], [4, 4, true], [10, 4, true], [11, 2, false], [21, 3, false]]) {
    const html = await render(Array.from({ length: count }, (_, i) => collection(`category-${i}`)));
    assert(html.includes(`--nbk-dropdown-columns: ${columns};`));
    assert.equal(html.includes('nbk-dropdown-panel--short'), short);
  }
});

test('desktop trigger retains native hover, keyboard details and original parent URL', async () => {
  const link = collection('real-parent', 5, [collection('real-child')]);
  const html = await engine.renderFile('main-menu', { link, section, index: 4, blocks_content: '' });
  assert.match(html, /<hdt-header-menu[^>]+opened-able-click event="hover"/);
  assert.match(html, /<details not-need-calc>/);
  assert.match(html, /data-url="\/en\/collections\/real-parent\?source=menu"/);
  assert.match(html, /nbk-dropdown-panel/);
});
