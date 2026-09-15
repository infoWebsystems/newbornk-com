const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const liquid = readFileSync(join(__dirname, '../snippets/product-selection-analytics.liquid'), 'utf8');
const code = liquid.match(/{% javascript %}([\s\S]*?){% endjavascript %}/)[1];
const sample = () => ({ item_list_id: '3901', item_list_name: 'Нові надходження',
  items: [{ item_id: 'shopify_UA_15857491476640_58807122100384', item_name: 'Футболка HELMET',
    item_brand: 'PLEASURES', item_variant: 'S', price: 3490, quantity: 1 }] });
function setup(consent = true) {
  const listeners = {};
  const privacy = { analyticsProcessingAllowed: () => consent };
  const window = { dataLayer: [], Shopify: { customerPrivacy: privacy }, addEventListener() {} };
  const context = vm.createContext({ window, document: { addEventListener(name, fn) {
    (listeners[name] ||= []).push(fn);
  } } });
  vm.runInContext(code, context);
  return { window, consent(value) { consent = value; }, rerun() { vm.runInContext(code, context); },
    events() { return window.dataLayer.map(args => JSON.parse(JSON.stringify(Array.from(args)))); },
    click({ type = 'click', button = 0, excluded = false, card = true, raw, download = false, prevented = false, detail = 1 } = {}) {
      let navigationBlocked = false;
      const link = { getAttribute: () => raw ?? JSON.stringify(sample()), hasAttribute: () => download };
      const target = { closest: selector => selector === 'a[data-nbk-selection]' ? (card ? link : null) : (excluded ? {} : null) };
      const event = { type, button, target, detail, defaultPrevented: prevented, preventDefault() { navigationBlocked = true; } };
      for (const fn of listeners[type] || []) fn(event);
      assert.equal(navigationBlocked, false);
    } };
}
test('one selection sends selected variant and list to the UA property without blocking navigation', () => {
  const app = setup(); app.click();
  assert.deepEqual(app.events(), [['event', 'select_item', { send_to: 'G-6WKK4C3QWJ', ...sample() }]]);
});
test('keyboard activation and middle click count once; right click does not', () => {
  const app = setup(); app.click({ detail: 0 }); app.click({ type: 'auxclick', button: 1 });
  app.click({ type: 'auxclick', button: 2 }); app.click({ button: 1 });
  assert.equal(app.events().length, 2);
});
test('wishlist, quick-add and other nested controls do not send selection', () => {
  const app = setup(); app.click({ excluded: true });
  app.click({ card: false }); app.click({ download: true }); app.click({ prevented: true });
  assert.equal(app.events().length, 0);
});
test('denied or unavailable consent is fail-closed; later consent permits only new clicks', () => {
  const app = setup(false); app.click(); assert.equal(app.events().length, 0);
  app.consent(true); assert.equal(app.events().length, 0); app.click();
  app.window.Shopify.customerPrivacy = undefined; app.click();
  assert.equal(app.events().length, 1);
});
test('duplicate initialization does not duplicate listeners; dynamically inserted cards work', () => {
  const app = setup(); app.rerun(); app.click(); app.click();
  assert.equal(app.events().length, 2);
});
test('malformed or incomplete metadata is ignored without breaking navigation', () => {
  const app = setup();
  for (const raw of ['<bad>', '{}', 'null', JSON.stringify({ ...sample(), items: [] }),
    JSON.stringify({ ...sample(), items: [{ item_id: 'wrong' }] }), JSON.stringify({ ...sample(), item_list_name: '' })]) app.click({ raw });
  assert.equal(app.events().length, 0);
});

test('Kalles product image and title links carry collection selection metadata', () => {
  const directory = join(__dirname, '../snippets');
  const files = readdirSync(directory).filter(name => /^card-product.*\.liquid$/.test(name) && name !== 'card-product-placeholder.liquid');
  let mediaLinks = 0;
  let titleLinks = 0;
  for (const filename of files) {
    const source = readFileSync(join(directory, filename), 'utf8');
    const links = source.match(/<a\b[^>]*\bclass="[^"]*\bhdt-card-product__(?:title|media-wrapp)\b[^"]*"[^>]*>/g) || [];
    for (const link of links) {
      assert.match(link, /render 'product-selection-analytics', product: card_product, list: collection/, `${filename}: product link must retain the displayed collection context`);
      assert.match(link, /href="\{\{ product_url \}\}"/, `${filename}: analytics must preserve the product destination`);
      if (link.includes('hdt-card-product__media-wrapp')) mediaLinks += 1;
      else titleLinks += 1;
    }
  }
  assert(mediaLinks > 0 && titleLinks > 0, 'Both Kalles image and title link integrations must be exercised');
});
