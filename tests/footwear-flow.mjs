import assert from 'node:assert/strict';
import test from 'node:test';
import normalizeEvent from '../ops/shopify-flow/footwear-eu/event-normalize.mjs';
import reconcile from '../ops/shopify-flow/footwear-eu/scheduled-normalize.mjs';

// Synthetic Shopify-shaped fixtures only; these IDs do not identify store records.
const PRODUCT_ID = 'gid://shopify/Product/1';
const VARIANT_ID = 'gid://shopify/ProductVariant/1';
const TAG = 'Взуття';

function variant({
  id = VARIANT_ID,
  raw = 'EU: 42 / US: 8.5 / CM: 26.5',
  optionName = 'Size',
  available = true,
  canonical = null,
  indexed = null,
} = {}) {
  return {
    id,
    selectedOptions: [{name: optionName, value: raw}],
    availableForSale: available,
    canonicalEu: canonical === null ? null : {value: canonical},
    availableEu: indexed === null ? null : {value: indexed},
  };
}

function product(variants = [variant()], tags = [TAG], id = PRODUCT_ID) {
  return {id, tags, variantsCount: {count: variants.length}, variants};
}

function event(raw, options = {}) {
  const {tags = [TAG], ...variantOptions} = options;
  return normalizeEvent({product: {tags}, productVariant: variant({raw, ...variantOptions})});
}

function scheduled(variants, tags = [TAG]) {
  return reconcile({getProductData: [product(variants, tags)]});
}

const accepted = [
  ['EU: 42 / US: 8.5 / CM: 26.5', '42'],
  ['Euro: 42 1/3 / US: 8.5 / CM: 26.5', '42 1/3'],
  ['EU: 42 2/3', '42 2/3'],
  ['EU: 42 1/2', '42 1/2'],
  ['EU: 42.5', '42.5'],
  ['EU: 42,5', '42.5'],
  ['EU: 42⅓', '42 1/3'],
  ['EU: 42⅔', '42 2/3'],
  ['EU: 42½', '42.5'],
  ['  eu : 42 • us : 8.5 • см : 26.5  ', '42'],
  ['EU: 10', '10'],
  ['EU: 80', '80'],
];

const rejected = [
  '',
  '42',
  'US: 8.5 / CM: 26.5',
  'CM: 26.5',
  'EU: 0',
  'EU: 9.5',
  'EU: 80.5',
  'EU: 999',
  'EU: -42',
  'EU: 42 0/3',
  'EU: 42 3/7',
  'EU: 42 3/3',
  'EU: 42 1/0',
  'EU: 42.5 1/3',
  'EU: 42 / EU: 43',
  'EU: 42 / Euro: 43',
  'EU: 42 sale',
  'EU: 42.5.1',
];

test('event and scheduled normalization preserve literal EU decimals and fractions', () => {
  for (const [raw, eu] of accepted) {
    assert.deepEqual(event(raw), {shouldWrite: true, euSize: eu, isTagged: true}, raw);
    assert.deepEqual(scheduled([variant({raw})]).rows, [
      {id: VARIANT_ID, eu, valid: true, available: true},
    ], `scheduled: ${raw}`);
  }
});

test('ambiguous, out-of-bounds and non-EU sizes are never converted or indexed', () => {
  for (const raw of rejected) {
    assert.deepEqual(event(raw), {shouldWrite: false, euSize: '', isTagged: true}, raw);
    assert.deepEqual(scheduled([variant({raw})]).rows, [], `empty metadata: ${raw}`);
    assert.deepEqual(scheduled([variant({raw, canonical: '42', indexed: '42'})]).rows, [
      {id: VARIANT_ID, eu: '', valid: false, available: true},
    ], `stale metadata: ${raw}`);
  }
});

test('only tagged footwear with one identifiable size option can write metadata', () => {
  for (const optionName of ['Size', ' size ', 'Розмір', 'размер']) {
    assert.equal(event('EU: 42', {optionName}).euSize, '42', optionName);
  }
  for (const tags of [[], ['Clothing'], ['Взуття-like']]) {
    assert.deepEqual(event('EU: 42', {tags}), {shouldWrite: false, euSize: '', isTagged: false});
    assert.deepEqual(scheduled([variant()], tags).rows, []);
    assert.deepEqual(scheduled([variant({canonical: '42', indexed: '42'})], tags).rows, [
      {id: VARIANT_ID, eu: '', valid: false, available: true},
    ]);
  }
  for (const selectedOptions of [[], [{name: 'Color', value: 'EU: 42'}], [
    {name: 'Size', value: 'EU: 42'}, {name: 'Розмір', value: 'EU: 43'},
  ]]) {
    const v = {...variant(), selectedOptions};
    assert.equal(normalizeEvent({product: {tags: [TAG]}, productVariant: v}).shouldWrite, false);
    assert.deepEqual(scheduled([v]).rows, []);
  }
  assert.deepEqual(normalizeEvent({}), {shouldWrite: false, euSize: '', isTagged: false});
});

test('reconciliation is changed-only, idempotent and does not mutate its input', () => {
  const input = {getProductData: [product([
    variant({canonical: '42', indexed: '42'}),
    variant({id: 'gid://shopify/ProductVariant/2', raw: 'EU: 43', canonical: '43', available: false}),
  ])]};
  const before = structuredClone(input);
  const expected = {rows: [], productCount: 1, variantCount: 2};
  assert.deepEqual(reconcile(input), expected);
  assert.deepEqual(reconcile(input), expected);
  assert.deepEqual(input, before);
  assert.deepEqual(reconcile({getProductData: []}), {rows: [], productCount: 0, variantCount: 0});
});

test('stale canonical values and availability changes preserve exact variant identity', () => {
  const changed = variant({id: 'gid://shopify/ProductVariant/2', raw: 'EU: 43 1/3', canonical: '42', indexed: '42'});
  const settled = variant({canonical: '42', indexed: '42'});
  assert.deepEqual(scheduled([settled, changed]).rows, [
    {id: changed.id, eu: '43 1/3', valid: true, available: true},
  ]);
  assert.deepEqual(scheduled([variant({canonical: '41', indexed: '42'})]).rows, [
    {id: VARIANT_ID, eu: '42', valid: true, available: true},
  ], 'a stale canonical value cannot override the literal EU size');
  assert.deepEqual(scheduled([variant({canonical: '42', indexed: '42', available: false})]).rows, [
    {id: VARIANT_ID, eu: '42', valid: true, available: false},
  ], 'sold-out variants retain the canonical size but require index cleanup');
  assert.deepEqual(scheduled([variant({available: false})]).rows, [
    {id: VARIANT_ID, eu: '42', valid: true, available: false},
  ], 'new sold-out variants still receive their canonical size');
  assert.deepEqual(scheduled([variant({canonical: '42', available: true})]).rows, [
    {id: VARIANT_ID, eu: '42', valid: true, available: true},
  ], 'restocked variants regain the indexed size');
  assert.deepEqual(scheduled([variant({canonical: '42', indexed: '43'})]).rows, [
    {id: VARIANT_ID, eu: '42', valid: true, available: true},
  ], 'an incorrect available-size value is corrected');
});

test('missing or invalid sizes request cleanup only when owned metadata exists', () => {
  const invalid = variant({raw: 'US: 8.5 / CM: 26.5', canonical: '42', indexed: '42', available: false});
  assert.deepEqual(scheduled([invalid]).rows, [
    {id: VARIANT_ID, eu: '', valid: false, available: false},
  ]);
  for (const fields of [{canonical: '42'}, {indexed: '42'}]) {
    assert.equal(scheduled([variant({raw: 'unknown', ...fields})]).rows.length, 1);
  }
  assert.deepEqual(scheduled([variant({raw: 'unknown'})]).rows, []);
});

test('product and variant fetch guards reject partial inputs before returning write rows', () => {
  assert.throws(() => reconcile({}), /product list missing/);
  assert.throws(() => reconcile({getProductData: null}), /product list missing/);
  const atCap = Array.from({length: 100}, (_, index) => product([], [TAG], `gid://shopify/Product/${index + 1}`));
  assert.throws(() => reconcile({getProductData: atCap}), /100-product/);
  assert.equal(reconcile({getProductData: atCap.slice(0, 99)}).productCount, 99);
  for (const variantsCount of [{count: 2}, {count: 0}, {}, undefined]) {
    assert.throws(() => reconcile({getProductData: [{...product(), variantsCount}]}), /incomplete variant/);
  }
  assert.throws(() => reconcile({getProductData: [{...product(), variants: undefined}]}), /incomplete variant/);
  assert.throws(() => reconcile({getProductData: [product(), {...product(), variantsCount: {count: 2}}]}), /incomplete variant/);
});

test('exact native aliases support absent metadata without a generic metafield list', () => {
  const absent = variant();
  assert.equal(absent.canonicalEu, null);
  assert.equal(absent.availableEu, null);
  assert.equal(Object.hasOwn(absent, 'metafields'), false);
  assert.deepEqual(scheduled([absent]).rows, [
    {id: VARIANT_ID, eu: '42', valid: true, available: true},
  ]);
  const settled = variant({canonical: '42', indexed: '42'});
  settled.metafields = Array.from({length: 100}, (_, index) => ({namespace: 'unrelated', key: `field_${index}`, value: 'x'}));
  assert.deepEqual(scheduled([settled]).rows, [], 'unrelated metadata cannot hide or replace the exact aliases');
  const unavailable = variant({canonical: '42', available: false});
  assert.deepEqual(scheduled([unavailable]).rows, [], 'a null availability alias means already cleared');
});

test('changed-row and serialized-output guards stop oversized reconciliation batches', () => {
  const many = count => Array.from({length: count}, (_, index) => variant({id: `gid://shopify/ProductVariant/${index + 1}`}));
  assert.throws(() => scheduled(many(1001)), /1000-row/);
  assert.throws(() => scheduled(many(600)), /50KB output/);
  const withinLimit = scheduled(many(10));
  assert.equal(withinLimit.rows.length, 10);
  assert.equal(new Set(withinLimit.rows.map(row => row.id)).size, 10);
  assert.ok(Buffer.byteLength(JSON.stringify(withinLimit), 'utf8') < 48000);
});
