const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const liquid = readFileSync(join(__dirname, '../snippets/nbk-cart-analytics.liquid'), 'utf8');
const code = liquid.match(/{% javascript %}([\s\S]*?){% endjavascript %}/)[1];
const tick = () => new Promise(resolve => setImmediate(resolve));
const sample = () => ({
  currency: 'UAH', total_price: 399000,
  items: [{ product_id: 15743700467872, variant_id: 57750971285664,
    product_title: 'Склянка COLD DRINKS CAN GLASS', vendor: 'CARHARTT WIP',
    variant_title: 'One size', quantity: 2, final_line_price: 399000 }],
});

function setup({ consent = true, configured = true, lateRoot = false, privacyReady = true } = {}) {
  const callbacks = new Map();
  const observers = [];
  const requests = [];
  let drawerOpen = false;
  let present = !lateRoot;
  let currentConsent = consent;
  const privacy = { analyticsProcessingAllowed: () => currentConsent };
  const root = { isConnected: true, hasAttribute: name => name === 'open' && drawerOpen };
  const window = { dataLayer: [], Shopify: {
    customerPrivacy: privacyReady ? privacy : undefined,
    loadFeatures: (_features, callback) => { callbacks.set('privacyReady', () => {
      window.Shopify.customerPrivacy = privacy; callback(null);
    }); },
  }, addEventListener: (name, callback) => callbacks.set(name, callback) };
  const document = {
    body: {},
    getElementById: id => id === 'nbk-cart-analytics-config'
      ? (configured ? { textContent: '{"cartUrl":"/uk/cart.js"}' } : null)
      : id === 'CartDrawer' && present ? root : null,
    addEventListener: (name, callback) => callbacks.set(name, callback),
  };
  const context = vm.createContext({
    window, document, AbortController, setTimeout, clearTimeout,
    MutationObserver: class {
      constructor(callback) { this.callback = callback; observers.push(this); }
      observe(target, options) {
        this.target = target;
        if (target === root) assert.deepEqual(Array.from(options.attributeFilter), ['open']);
      }
      disconnect() { this.target = undefined; }
    },
    fetch: (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject })),
  });
  vm.runInContext(code, context);
  return {
    window, requests,
    events: () => window.dataLayer.map(args => JSON.parse(JSON.stringify(Array.from(args)))),
    open: () => { drawerOpen = true; observers[0]?.callback(); },
    close: () => { drawerOpen = false; observers[0]?.callback(); },
    mutate: () => observers[0]?.callback(),
    insert: () => { present = true; observers[1]?.callback(); },
    consent: value => { currentConsent = value; callbacks.get('visitorConsentCollected')?.(); },
    privacyReady: () => callbacks.get('privacyReady')?.(),
    rerun: () => vm.runInContext(code, context),
    respond: async (index, cart = sample()) => {
      requests[index].resolve({ ok: true, json: async () => cart }); await tick();
    },
  };
}

test('auto-open and manual reopen send one UA event each; mutations and quantity updates do not', async () => {
  const app = setup();
  assert.equal(app.requests.length, 0);
  app.open(); app.mutate(); app.open();
  assert.equal(app.requests.length, 1);
  await app.respond(0);
  const [event] = app.events();
  assert.deepEqual(event.slice(0, 2), ['event', 'view_cart']);
  assert.equal(event[2].send_to, 'G-6WKK4C3QWJ');
  assert.equal(event[2].cart_source, 'kalles_drawer');
  assert.equal(event[2].currency, 'UAH');
  assert.equal(event[2].value, 3990);
  assert.equal(event[2].items[0].price, 1995);
  assert.equal(event[2].items[0].quantity, 2);
  assert.equal(event[2].items[0].item_id, 'shopify_UA_15743700467872_57750971285664');
  assert.equal(app.requests[0].url, '/uk/cart.js');
  app.mutate(); app.rerun(); app.mutate();
  assert.equal(app.events().length, 1);
  app.close(); app.open();
  const updated = sample(); updated.items[0].quantity = 1;
  updated.items[0].final_line_price = updated.total_price = 199500;
  await app.respond(1, updated);
  assert.equal(app.events().length, 2);
  assert.equal(app.events()[1][2].value, 1995);
});

test('no tracking or cart fetch until consent; grant while open sends once', async () => {
  const app = setup({ consent: false });
  app.open(); assert.equal(app.requests.length, 0);
  app.consent(true); app.consent(true);
  assert.equal(app.requests.length, 1);
  await app.respond(0);
  assert.equal(app.events().length, 1);
});

test('privacy API can load after opening', async () => {
  const app = setup({ privacyReady: false });
  app.open(); assert.equal(app.requests.length, 0);
  app.privacyReady(); await app.respond(0);
  assert.equal(app.events().length, 1);
});

test('closed or replaced requests never emit stale cart contents', async () => {
  const app = setup();
  app.open(); app.close(); app.open();
  await app.respond(0);
  assert.equal(app.events().length, 0);
  assert.equal(app.requests[0].options.signal.aborted, true);
  await app.respond(1);
  assert.equal(app.events().length, 1);
});

test('consent revocation during fetch suppresses event', async () => {
  const app = setup(); app.open(); app.consent(false);
  await app.respond(0); assert.equal(app.events().length, 0);
});

test('late Kalles mount is detected', async () => {
  const app = setup({ lateRoot: true });
  app.insert(); app.open(); await app.respond(0);
  assert.equal(app.events().length, 1);
});

test('cart page without config does not install tracking', () => {
  const app = setup({ configured: false }); app.open();
  assert.equal(app.requests.length, 0);
  assert.equal(app.window.newbornkKallesCartAnalytics, undefined);
});

test('empty and malformed carts are ignored; failed requests do not retry on every mutation', async () => {
  const app = setup(); app.open(); await app.respond(0, { currency: 'UAH', total_price: 0, items: [] });
  app.close(); app.open();
  const malformed = sample(); malformed.items[0].quantity = 0;
  await app.respond(1, malformed);
  app.close(); app.open(); app.requests[2].reject(new Error('offline')); await tick();
  app.mutate(); assert.equal(app.requests.length, 3);
  assert.equal(app.events().length, 0);
});
