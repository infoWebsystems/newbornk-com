const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { Liquid } = require('liquidjs');

function engine(locale) {
  const messages = JSON.parse(readFileSync(path.resolve(__dirname, '../../locales', `${locale}.json`), 'utf8').replace(/^\/\*[\s\S]*?\*\/\s*/, ''));
  const liquid = new Liquid({ root: path.resolve(__dirname, '../../snippets'), extname: '.liquid', strictFilters: true, jsTruthy: false });
liquid.registerTag('doc', {
  parse(token, tokens) {
    while (tokens.length) if (tokens.shift().name === 'enddoc') return;
    throw new Error('Unclosed LiquidDoc');
  },
  render() { return ''; }
});
  liquid.registerFilter('t', key => key.split('.').reduce((value, part) => value?.[part], messages) ?? key);
  for (const name of ['money', 'handle', 'image_url', 'image_tag', 'placeholder_svg_tag', 'asset_url', 'stylesheet_tag']) liquid.registerFilter(name, value => value);
  return liquid;
}
const gender = 'filter.p.m.shopify.target-gender';
const color = 'filter.p.m.shopify.color-pattern';

for (const [locale, sort, genderName, female, black] of [
  ['uk', 'Спочатку найновіші', 'Стать', 'Жіноче', 'Чорний'],
  ['en.default', 'Date, new to old', 'Gender', 'Women', 'Black'],
  ['ru', 'Сначала новые', 'Пол', 'Женское', 'Чёрный']
]) {
  test(`${locale}: localized browsing labels retain native values and active filter removal`, async () => {
    const liquid = engine(locale);
    const value = { label: 'Female', value: 'gid://shopify/Metaobject/123', param_name: gender, active: true, count: 4, url_to_remove: '/collections/new?keep=1' };
    const filter = { label: 'Gender', param_name: gender, type: 'list', values: [value], active_values: [value] };
    assert.equal((await liquid.renderFile('nbk-filter-label', { filter })).trim(), genderName);
    assert.equal((await liquid.renderFile('nbk-filter-label', { filter, value })).trim(), female);
    assert.equal((await liquid.renderFile('nbk-filter-label', { filter: { param_name: color }, value: { label: 'Black' } })).trim(), black);
    const results = { url: '/collections/new', filters: [filter], sort_by: 'created-descending', sort_options: [{ value: 'created-descending', name: 'Date, new to old' }] };
    const ctx = { results, collection: results, section: { id: 'browse', settings: {}, blocks: [{ type: 'filter', settings: {} }] }, settings: {} };
    for (const renderer of ['facets', 'sidebar-collection']) {
      const html = await liquid.renderFile(renderer, ctx);
      assert.match(html, /name="filter.p.m.shopify.target-gender" value="gid:\/\/shopify\/Metaobject\/123"[^>]*checked/);
      assert(html.includes(female));
    }
    const active = await liquid.renderFile('active-filters', ctx);
    assert(active.includes(`href="/collections/new?keep=1">${female}</a>`));
    const sorting = await liquid.renderFile('sort-by-popover', ctx);
    assert(sorting.includes(sort));
    assert.match(sorting, /value="created-descending" aria-selected="true"/);
  });
}

test('custom labels and vendor names remain intact and escaped', async () => {
  const liquid = engine('uk');
  assert.equal((await liquid.renderFile('nbk-filter-label', { filter: { param_name: 'filter.p.vendor' }, value: { label: 'Black & Gold' } })).trim(), 'Black &amp; Gold');
  assert.equal((await liquid.renderFile('nbk-filter-label', { filter: { param_name: color }, value: { label: 'Midnight Blue' } })).trim(), 'Midnight Blue');
  assert.equal((await liquid.renderFile('nbk-sort-label', { option: { value: 'app-special', name: 'A & B' } })).trim(), 'A &amp; B');
});

test('Shopify collection relevance sort is localized separately from search relevance', async () => {
  const liquid = engine('uk');
  assert.equal((await liquid.renderFile('nbk-sort-label', { option: { value: 'most-relevant', name: 'Most relevant' } })).trim(), 'Найвідповідніші');
});

test('gender and product type lead both filter layouts without losing other facets or active values', async () => {
  const liquid = engine('uk');
  for (const genderKey of ['filter.v.t.shopify.target-gender', 'filter.p.m.shopify.target-gender']) {
    const names = ['filter.p.vendor', 'filter.p.product_type', 'filter.v.option.size', genderKey];
    const filters = names.map((param_name, index) => ({
      label: `Group ${index}`, param_name, type: 'list',
      values: [{ label: `Value ${index}`, value: `value-${index}`, param_name, active: index === 3, count: 2 }],
      active_values: [],
    }));
    const results = { url: '/collections/all', filters };
    const ctx = { results, collection: results, section: { id: 'browse', settings: {}, blocks: [{ type: 'filter', settings: {} }] }, settings: {} };
    for (const renderer of ['facets', 'sidebar-collection']) {
      const html = await liquid.renderFile(renderer, ctx);
      const inputs = [...html.matchAll(/name="(filter\.[^"]+)" value="(value-\d)"([^>]*)/g)];
      assert.deepEqual(inputs.map(match => match[1]), [genderKey, names[1], names[0], names[2]]);
      assert.equal(inputs[0][2], 'value-3');
      assert.match(inputs[0][3], /checked/);
    }
  }
});
