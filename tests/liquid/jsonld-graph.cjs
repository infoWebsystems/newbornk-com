const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { Liquid } = require('liquidjs');

const root = path.resolve(__dirname, '../..');
const engine = new Liquid({ root: path.join(root, 'snippets'), extname: '.liquid', strictFilters: true });
engine.registerTag('doc', {
  parse(token, tokens) {
    while (tokens.length) if (tokens.shift().name === 'enddoc') return;
    throw new Error('Unclosed LiquidDoc');
  },
  render() { return ''; }
});
engine.registerFilter('json', value => JSON.stringify(value ?? null));
engine.registerFilter('image_url', image => `//cdn.example.test/${image?.src ?? image ?? 'missing.jpg'}`);
engine.registerFilter('t', key => key === 'general.wishlist.wishlist_page' ? 'Обране' : key);

function context(type = 'product') {
  return {
    template: { name: type }, request: { page_type: type },
    shop: { name: 'NEWBORN K', url: 'https://newbornk.com' },
    cart: { currency: { iso_code: 'UAH' } }, current_page: 1,
    canonical_url: `https://newbornk.com/${type}/example`,
    page_title: 'SEO title | NEWBORN K'
  };
}
function variant(id, size, color, barcode) {
  return { id, sku: `SKU-${id}`, title: `${size} / ${color}`, options: [size, color],
    option1: size, option2: color, barcode, price: 12500, available: id === 1,
    url: `/products/example?variant=${id}`, image: { src: `${id}.jpg` } };
}
function product() {
  const variants = [variant(1, 'M', 'Blue "Sky"', '4006381333931'), variant(2, 'L', 'Black', 'not-a-barcode')];
  return {
    id: 123, title: 'Coat "Special" & New', description: '<p>Text with "quotes"</p>',
    vendor: 'Brand', type: 'Coats', price: 12500, available: true,
    featured_image: { src: 'main.jpg' }, media: [{ src: 'main.jpg' }],
    has_only_default_variant: false, variants, selected_or_first_available_variant: variants[0],
    options_with_values: [{ name: 'Розмір', values: ['M', 'L'] }, { name: 'Колір', values: ['Blue "Sky"', 'Black'] }],
    metafields: { shopify: {}, reviews: { rating: { value: '4.8' }, rating_count: 7 } }
  };
}
async function graph(ctx) {
  const html = await engine.renderFile('jsonld-graph', ctx);
  const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  return JSON.parse(scripts[0][1])['@graph'];
}
const entity = (nodes, type) => nodes.find(node => node['@type'] === type);
const labels = values => ({ value: values.map(value => ({ label: { value } })) });

test('rendered graph keeps valid JSON, one organization, reviews and Kyiv offer policies', async () => {
  const p = product();
  p.metafields.shopify.fabric = labels(['', 'Cotton "organic"', ' ']);
  p.metafields.shopify['target-gender'] = labels(['Female']);
  const nodes = await graph({ ...context(), product: p });
  const main = entity(nodes, 'Product');
  const group = entity(nodes, 'ProductGroup');
  assert.equal(main.name, p.title);
  assert.equal(nodes.filter(n => [].concat(n['@type']).includes('Organization')).length, 1);
  assert.deepEqual(main.aggregateRating, { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: 7, bestRating: 5, worstRating: 1 });
  assert.equal(group.aggregateRating, undefined);
  assert.equal(main.material, 'Cotton "organic"');
  assert.equal(group.material, main.material);
  assert.equal(group.audience.suggestedGender, 'female');
  assert.deepEqual(group.variesBy, ['https://schema.org/size', 'https://schema.org/color']);
  assert.deepEqual(group.hasVariant.map(v => [v.size, v.color]), [['M', 'Blue "Sky"'], ['L', 'Black']]);
  assert.equal(group.hasVariant[0].gtin13, '4006381333931');
  assert(!Object.keys(group.hasVariant[1]).some(k => k.startsWith('gtin')));
  for (const offer of [...main.offers, ...group.hasVariant.map(v => v.offers)]) {
    assert.equal(offer.priceCurrency, 'UAH');
    assert.equal(offer.price, 125);
    assert.equal(offer.shippingDetails.shippingDestination.addressCountry, 'UA');
    assert.equal(offer.shippingDetails.shippingRate.value, '0');
    assert.equal(offer.hasMerchantReturnPolicy.merchantReturnDays, 14);
    assert.equal(offer.hasMerchantReturnPolicy.returnFees, 'https://schema.org/FreeReturn');
  }
  for (const header of ['header-inline-blocks', 'header-e-commerce-blocks', 'header-menu-bottom-blocks', 'header-vertical']) {
    assert.doesNotMatch(readFileSync(path.join(root, 'sections', `${header}.liquid`), 'utf8'), /"@type":\s*"Organization"/);
  }
});

test('GTIN validates digits, lengths and checksum while preserving leading zeros', async () => {
  for (const barcode of ['96385074', '012345678905', '4006381333931', '10012345000017']) {
    const fragment = await engine.renderFile('nbk-jsonld-gtin', { barcode });
    assert.equal(JSON.parse(`{"name":"x"${fragment}}`)[`gtin${barcode.length}`], barcode);
  }
  for (const barcode of ['', undefined, 'ABC6381333931', '4006381333932', '1234567', '123456789', '00000000', '400638133 931']) {
    assert.equal((await engine.renderFile('nbk-jsonld-gtin', { barcode })).trim(), '', String(barcode));
  }
  const p = product();
  p.has_only_default_variant = true;
  p.options_with_values = [];
  p.variants = [p.variants[0]];
  const nodes = await graph({ ...context(), product: p });
  assert.equal(entity(nodes, 'Product').gtin13, '4006381333931');
  assert.equal(entity(nodes, 'ProductGroup'), undefined);
});

test('missing or ambiguous taxonomy does not create empty or guessed attributes', async () => {
  for (const genders of [undefined, ['', ' '], ['Female', 'Male'], ['Unknown custom value'], ['German custom label']]) {
    const p = product();
    p.metafields.shopify.fabric = labels(['', ' ']);
    if (genders) p.metafields.shopify['target-gender'] = labels(genders);
    p.metafields.reviews = {};
    const nodes = await graph({ ...context(), product: p });
    for (const node of [entity(nodes, 'Product'), entity(nodes, 'ProductGroup')]) {
      assert.equal(node.material, undefined);
      assert.equal(node.audience, undefined);
      assert.equal(node.aggregateRating, undefined);
    }
  }
  for (const [label, expected] of [['Жіночий', 'female'], ['Чоловічий', 'male'], ['Unisex', 'unisex']]) {
    const p = product();
    p.metafields.shopify['target-gender'] = labels([label]);
    assert.equal(entity(await graph({ ...context(), product: p }), 'ProductGroup').audience.suggestedGender, expected);
  }
});

test('material options remain variant-specific instead of being overwritten by taxonomy', async () => {
  const p = product();
  p.options_with_values = [{ name: 'Material', values: ['Cotton', 'Wool'] }];
  p.variants.forEach((v, i) => { v.options = [i ? 'Wool' : 'Cotton']; v.option1 = v.options[0]; });
  p.metafields.shopify.fabric = labels(['Cotton', 'Wool']);
  const group = entity(await graph({ ...context(), product: p }), 'ProductGroup');
  assert.equal(group.material, undefined);
  assert.deepEqual(group.variesBy, ['https://schema.org/material']);
  assert.deepEqual(group.hasVariant.map(v => v.material), ['Cotton', 'Wool']);
});

test('collection ItemList count matches its emitted subset and is omitted beyond page one', async () => {
  const collection = { title: 'Coats "New"', description: '', products_count: 120,
    products: Array.from({ length: 30 }, (_, i) => ({ title: `Product ${i}`, url: `/products/${i}` })) };
  const ctx = { ...context('collection'), collection };
  const first = entity(await graph(ctx), 'CollectionPage');
  assert.equal(first.mainEntity.numberOfItems, 20);
  assert.equal(first.mainEntity.numberOfItems, first.mainEntity.itemListElement.length);
  const fallback = entity(await graph({ ...ctx, current_page: undefined, list_count: 999 }), 'CollectionPage');
  assert.equal(fallback.mainEntity.numberOfItems, 20);
  const second = entity(await graph({ ...ctx, current_page: 2 }), 'CollectionPage');
  assert(second);
  assert.equal(second.mainEntity, undefined);
  const empty = entity(await graph({ ...ctx, collection: { ...collection, products_count: 0, products: [] } }), 'CollectionPage');
  assert.equal(empty.mainEntity, undefined);
});

test('H1 uses escaped resource titles while keeping the translated wishlist', async () => {
  for (const type of ['collection', 'product', 'article', 'blog', 'page']) {
    const title = `Resource ${type} <New> & "special"`;
    const output = await engine.renderFile('nbk-page-h1', { ...context(type), [type]: { title } });
    assert.equal(output.trim(), `Resource ${type} &lt;New&gt; &amp; &#34;special&#34;`);
    assert(!output.includes('SEO title'));
  }
  assert.equal((await engine.renderFile('nbk-page-h1', context('index'))).trim(), 'NEWBORN K');
  assert.equal((await engine.renderFile('nbk-page-h1', { ...context('search'), template: { name: 'search', suffix: 'wishlist' } })).trim(), 'Обране');
  assert.equal((await engine.renderFile('nbk-page-h1', context('policy'))).trim(), 'SEO title | NEWBORN K');
});
