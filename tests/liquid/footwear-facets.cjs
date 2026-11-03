const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { Liquid } = require('liquidjs');

const engine = new Liquid({
  root: path.resolve(__dirname, '../../snippets'),
  extname: '.liquid', strictFilters: true, jsTruthy: false
});
engine.registerTag('doc', {
  parse(token, tokens) {
    while (tokens.length) if (tokens.shift().name === 'enddoc') return;
    throw new Error('Unclosed LiquidDoc');
  },
  render() { return ''; }
});
engine.registerFilter('t', key => ({
  'products.theme_settings.color': 'Color,Колір',
  'products.theme_settings.color_white': 'White',
  'products.facets.footwear_size_eu': 'Розмір взуття (EU)',
  'products.facets.footwear_size_available': 'Розміри в наявності'
})[key] || key);
engine.registerFilter('handle', value => String(value || '').toLowerCase());
engine.registerFilter('money', value => `${Number(value) / 100} UAH`);
engine.registerFilter('image_url', value => value);
engine.registerFilter('image_tag', value => value);
engine.registerFilter('placeholder_svg_tag', value => value);
engine.registerFilter('asset_url', value => value);
engine.registerFilter('stylesheet_tag', value => `<link href="${value}">`);

const footwearParam = 'filter.v.m.custom.footwear_size_eu_available';
const ordinaryParam = 'filter.v.option.size';
function facet(param, values, label = 'Size') {
  const entries = values.map(entry => {
    const data = typeof entry === 'string' ? { label: entry } : entry;
    return { count: 3, active: false, param_name: param,
      value: data.label, url_to_remove: '/collections/shoes?keep=1', ...data };
  });
  return { type: 'list', label, param_name: param, values: entries,
    active_values: entries.filter(value => value.active), url_to_remove: '/collections/shoes' };
}
function context(filters) {
  return { results: { url: '/collections/shoes', filters, default_sort_by: 'manual' },
    section: { id: 'footwear-facets', settings: {} }, settings: {}, enable_sorting: true };
}
function checkboxes(html, param) {
  return [...html.matchAll(/<input\b[^>]*type="checkbox"[^>]*>/g)]
    .map(([tag]) => ({ tag, name: tag.match(/name="([^"]*)"/)[1], value: tag.match(/value="([^"]*)"/)[1] }))
    .filter(input => input.name === param);
}

test('EU facets sort thirds and halves numerically and retain Shopify form values and stock states', async () => {
  const values = [
    { label: '42 2/3', value: '42 2/3', active: true, count: 0 },
    { label: '42.5', count: 0 }, '42', '42 1/3', '43'
  ];
  const html = await engine.renderFile('facets', context([facet(footwearParam, values)]));
  const inputs = checkboxes(html, footwearParam);
  assert.deepEqual(inputs.map(input => input.value), ['42', '42 1/3', '42.5', '42 2/3', '43']);
  assert.match(inputs[2].tag, /\sdisabled/);
  assert.match(inputs[3].tag, /\schecked/);
  assert.doesNotMatch(inputs[3].tag, /\sdisabled/);
  assert(html.includes('Розмір взуття (EU)'));
  assert(html.includes('Розміри в наявності'));
  for (const { tag } of inputs) {
    const id = tag.match(/id="([^"]*)"/)[1];
    assert(html.includes(`<label for="${id}">`));
  }
});

test('ordinary clothing facet keeps its original order, values and checked state', async () => {
  const html = await engine.renderFile('facets', context([facet(ordinaryParam, ['XL', '28', { label: 'S', active: true }, 'M'])]));
  const inputs = checkboxes(html, ordinaryParam);
  assert.deepEqual(inputs.map(input => input.value), ['XL', '28', 'S', 'M']);
  assert.match(inputs[2].tag, /\schecked/);
  assert.match(html, /Розміри в наявності/);
});

test('canonical EU filter replaces inactive composite sizes while active legacy sizes remain removable', async () => {
  const filters = [facet(ordinaryParam, [
    'US: 8/ EU: 41 1/3/ CM: 26', 'M',
    { label: 'US: 9/ EU: 42/ CM: 27', active: true }
  ]), facet(footwearParam, ['41 1/3', '42'])];
  const html = await engine.renderFile('facets', context(filters));
  const inputs = checkboxes(html, ordinaryParam);
  assert.deepEqual(inputs.map(input => input.value), ['M', 'US: 9/ EU: 42/ CM: 27']);
  assert.match(inputs[1].tag, /\schecked/);
  const active = await engine.renderFile('active-filters', context(filters));
  assert(active.includes('href="/collections/shoes?keep=1">US: 9/ EU: 42/ CM: 27</a>'));
});

test('raw composite size filter remains available when Shopify omits the replacement EU facet', async () => {
  const raw = ['US: 8/ EU: 41 1/3/ CM: 26', 'US: 9/ EU: 42/ CM: 27'];
  const html = await engine.renderFile('facets', context([facet(ordinaryParam, raw)]));
  assert.deepEqual(checkboxes(html, ordinaryParam).map(input => input.value), raw);
});

test('active EU pills use explicit EU labels and preserve native removal URLs', async () => {
  const filters = [facet(footwearParam, [{ label: '42 2/3', active: true,
    url_to_remove: '/collections/shoes?filter.v.availability=1' }]), facet(ordinaryParam, [{ label: 'M', active: true }])];
  const html = await engine.renderFile('active-filters', context(filters));
  assert(html.includes('href="/collections/shoes?filter.v.availability=1">EU 42 2/3</a>'));
  assert(html.includes('href="/collections/shoes?keep=1">M</a>'));
  assert(!html.includes('>EU M</a>'));
});

test('search facets preserve action, query, sort and unavailable-product parameters', async () => {
  const ctx = context([facet(footwearParam, ['42'])]);
  delete ctx.results.url;
  ctx.results.terms = 'blue shoes';
  ctx.results.sort_by = 'price-ascending';
  ctx.routes = { search_url: '/uk/search' };
  ctx.enable_sorting = false;
  const html = await engine.renderFile('facets', ctx);
  assert(html.includes('method="GET" action="/uk/search"'));
  for (const [name, value] of [['page', ''], ['q', 'blue shoes'], ['sort_by', 'price-ascending'],
    ['type', 'product'], ['options[prefix]', 'last'], ['options[unavailable_products]', 'last']]) {
    assert(html.includes(`name="${name}" value="${value}"`), name);
  }
});

test('boolean availability and price filters retain their native field names and values', async () => {
  const availability = facet('filter.v.availability', [
    { label: 'In stock', value: '1', active: true }, { label: 'Sold out', value: '0', count: 0 }
  ], 'Availability');
  availability.type = 'boolean';
  const price = { type: 'price_range', label: 'Price', param_name: 'filter.v.price',
    min_value: { param_name: 'filter.v.price.gte', value: 12500 },
    max_value: { param_name: 'filter.v.price.lte', value: 30000 }, range_max: 50000 };
  const html = await engine.renderFile('facets', context([availability, price, facet(footwearParam, ['42'])]));
  const stock = checkboxes(html, 'filter.v.availability');
  assert.deepEqual(stock.map(input => input.value), ['1', '0']);
  assert.match(stock[0].tag, /\schecked/);
  assert.match(stock[1].tag, /\sdisabled/);
  assert.match(html, /name="filter\.v\.price\.gte"[^>]*value="125"/);
  assert.match(html, /name="filter\.v\.price\.lte"[^>]*value="300"/);
});

for (const renderer of ['facets', 'sidebar-collection']) {
  test(`${renderer}: footwear replaces composite values and keeps numeric order and removable legacy choice`, async () => {
    const filters = [facet(ordinaryParam, [
      'US: 8/ EU: 41 1/3/ CM: 26', 'M',
      { label: 'Euro: 42 • US:8.5 • См: 27.8', active: true }
    ]), facet(footwearParam, ['42 2/3', '42.5', '42'])];
    const ctx = context(filters);
    ctx.collection = ctx.results;
    ctx.section.blocks = [{ type: 'filter', settings: {} }];
    const html = await engine.renderFile(renderer, ctx);
    assert.deepEqual(checkboxes(html, ordinaryParam).map(x => x.value), ['M', 'Euro: 42 • US:8.5 • См: 27.8']);
    assert.deepEqual(checkboxes(html, footwearParam).map(x => x.value), ['42', '42.5', '42 2/3']);
    assert.match(html, /Розміри в наявності/);
    const shoeOnly = context([facet(ordinaryParam, ['US: 8/ EU: 41 1/3/ CM: 26']), facet(footwearParam, ['41 1/3'])]);
    shoeOnly.collection = shoeOnly.results;
    shoeOnly.section.blocks = [{ type: 'filter', settings: {} }];
    assert.equal(checkboxes(await engine.renderFile(renderer, shoeOnly), ordinaryParam).length, 0);
    const fallback = context([facet(ordinaryParam, ['US: 8/ EU: 41 1/3/ CM: 26', 'S'])]);
    fallback.collection = fallback.results;
    fallback.section.blocks = [{ type: 'filter', settings: {} }];
    assert.equal(checkboxes(await engine.renderFile(renderer, fallback), ordinaryParam).length, 2);
  });
}

for (const renderer of ['facets', 'sidebar-collection']) {
  const render = async filters => {
    const ctx = context(filters);
    ctx.collection = ctx.results;
    ctx.section.blocks = [{ type: 'filter', settings: {} }];
    return engine.renderFile(renderer, ctx);
  };
  test(`${renderer}: empty and all-zero groups disappear, while active zero-count choices stay removable`, async () => {
    const html = await render([
      facet(footwearParam, [{ label: '42', count: 0 }, { label: '43', count: 0 }], 'Empty EU'),
      facet('filter.p.vendor', [], 'Empty brand'),
      facet(ordinaryParam, [{ label: 'L', count: 0, active: true }, { label: 'S', count: 0 }]),
      { type: 'price_range', label: 'Price', param_name: 'filter.v.price',
        min_value: { param_name: 'filter.v.price.gte' }, max_value: { param_name: 'filter.v.price.lte' }, range_max: 50000 }
    ]);
    assert.equal(checkboxes(html, footwearParam).length, 0);
    assert.doesNotMatch(html, /Розмір взуття \(EU\)|Empty brand/);
    const sizes = checkboxes(html, ordinaryParam);
    assert.equal(sizes.length, 2);
    assert.match(sizes[0].tag, /checked/);
    assert.doesNotMatch(sizes[0].tag, /disabled/);
    assert.match(html, /name="filter.v.price.gte"/);
  });
  test(`${renderer}: active sizes carry stock in the form without a conflicting availability control`, async () => {
    const availability = facet('filter.v.availability', [{ label: 'In stock', value: '1', active: true }, { label: 'Sold out', value: '0' }]);
    availability.type = 'boolean';
    const size = facet(ordinaryParam, [{ label: 'L', active: true }]);
    const html = await render([availability, size]);
    assert.match(html, /type="hidden" name="filter.v.availability" value="1"/);
    assert.equal(checkboxes(html, 'filter.v.availability').length, 0);
    assert.equal(checkboxes(html, ordinaryParam).length, 1);
    const active = await engine.renderFile('active-filters', context([availability, size]));
    assert.doesNotMatch(active, /In stock|Sold out/);
    assert.match(active, />L<\/a>/);
  });
}
