const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { Liquid } = require('liquidjs');

const root = path.resolve(__dirname, '../..');
const engine = new Liquid({
  root: [path.join(root, 'blocks'), path.join(root, 'snippets')],
  extname: '.liquid',
  strictFilters: true,
  jsTruthy: false
});
for (const tag of ['doc', 'schema', 'stylesheet']) {
  engine.registerTag(tag, {
    parse(token, tokens) {
      while (tokens.length) if (tokens.shift().name === `end${tag}`) return;
      throw new Error(`Unclosed ${tag} tag`);
    },
    render() { return ''; }
  });
}
engine.registerFilter('t', key => key);
engine.registerFilter('handleize', value => String(value ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));

function collectionLink(handle, count = 1, title = handle, children = []) {
  return { title, type: 'collection_link', url: `/en/collections/${handle}`,
    object: { handle, all_products_count: count }, links: children };
}
function context(categoryLabel = 'men', useCurrentBrands = true) {
  const categories = [
    collectionLink('shirts', 4, 'Shirts'),
    collectionLink('empty-category', 0, 'Empty category'),
    collectionLink('empty-parent', 0, 'Nested', [collectionLink('nested-child', 1, 'Nested child')])
  ];
  const brands = [
    collectionLink('actual-brand-destination', 2, 'ACT.1 🇺🇦'),
    collectionLink('carhartt-wip', 1, 'CARHARTT WIP'),
    collectionLink('empty-brand', 0, 'Empty Brand'),
    collectionLink('unrelated-brand', 1, 'Unrelated brand')
  ];
  while (brands.length < 51) brands.push(collectionLink(`other-${brands.length}`, 1, `Other ${brands.length}`));
  brands.push(collectionLink('brand-after-fifty', 1, 'Last Vendor'));
  const collection = { handle: 'cholovikam', all_products_count: 10,
    all_vendors: ['act.1', 'Carhartt WIP', 'Empty Brand', 'Last Vendor', 'Fallback Vendor'] };
  return {
    block: { settings: { menu_collection: collection, category_label: categoryLabel,
      brands_menu: { links: [collectionLink('fallback-link', 1, 'Fallback Vendor')] } } },
    section: { settings: { main_menu: { links: [
      collectionLink('cholovikam', 10, 'MEN', categories),
      ...(useCurrentBrands ? [collectionLink('brands', 20, 'BRANDS', brands)] : [])
    ] } } }
  };
}
const render = ctx => engine.renderFile('_mega_link-list', ctx);
const headingCount = html => (html.match(/class="hdt-mega-heading"/g) || []).length;

test('men and women have two vertical groups, hiding empty categories while preserving nested links', async () => {
  for (const label of ['men', 'women']) {
    const html = await render(context(label));
    assert(html.includes('nbk-menu-groups--two'));
    assert.equal(headingCount(html), 2, 'only category and brand headings receive dividers');
    assert(html.includes(`nbk_menu.categories_${label}`));
    assert(html.includes('/en/collections/shirts'));
    assert(!html.includes('/en/collections/empty-category'));
    assert(!html.includes('href="/en/collections/empty-parent"'));
    assert(html.includes('/en/collections/nested-child'));
  }
});

test('brands use current navigation URLs, normalized collection vendors and visible collections', async () => {
  const html = await render(context());
  assert(html.includes('/en/collections/actual-brand-destination'), 'vendor name must not be used to guess a URL');
  assert(html.includes('/en/collections/carhartt-wip'));
  assert(html.includes('/en/collections/brand-after-fifty'), 'navigation entries after the first 50 remain available');
  for (const handle of ['empty-brand', 'unrelated-brand', 'fallback-link']) {
    assert(!html.includes(`/en/collections/${handle}`), handle);
  }
});

test('accessories have one category column and no brands column', async () => {
  const html = await render(context('accessories'));
  assert.equal(headingCount(html), 1);
  assert(html.includes('nbk_menu.categories_accessories'));
  assert(!html.includes('nbk-menu-groups--two'));
  assert(!html.includes('/en/collections/actual-brand-destination'));
});

test('configured brand menu is used when the main navigation has no brand children', async () => {
  const html = await render(context('men', false));
  assert(html.includes('/en/collections/fallback-link'));
});

test('blocks without a menu collection retain the native linklist layout', async () => {
  const html = await render({ block: { settings: { linklist: {
    links: [collectionLink('legacy', 1, 'Legacy')]
  } } }, section: { settings: {} } });
  assert(html.includes('/en/collections/legacy'));
  assert(!html.includes('nbk-menu-groups'));
});
