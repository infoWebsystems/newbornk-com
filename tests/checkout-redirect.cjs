const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'chekly-script-custom.js'), 'utf8');

// Exercise the shipped URL builder with synthetic data. No browser, network,
// customer record, checkout session, or order is created by this harness.
function checkout({ customer, root = '/', cartToken = 'synthetic-cart-token', search = '', savedTracking = '' } = {}) {
  const cookies = { cart: cartToken, chekly_tracking: savedTracking };
  const storage = new Map();
  const window = {
    Shopify: {
      shop: 'newbornk-com.myshopify.com',
      currency: { active: 'UAH', rate: 1 },
      routes: { root },
      customer,
    },
    location: { origin: 'https://newbornk.com', search },
    addEventListener() {},
  };
  const attributes = {
    'data-chekly-url': 'https://chekly-app.com',
    'data-checkout-domain': 'https://checkout.newbornk.com',
    'data-chekly-theme': 'chekly',
  };
  const context = vm.createContext({
    console, URL, URLSearchParams, encodeURIComponent, window,
    navigator: { languages: ['uk-UA'], language: 'uk-UA' },
    document: {
      querySelector(selector) {
        assert.equal(selector, '[data-chekly-url]');
        return { getAttribute: name => attributes[name] };
      },
    },
    sessionStorage: {
      getItem: key => storage.get(key),
      setItem: (key, value) => storage.set(key, value),
      removeItem: key => storage.delete(key),
    },
  });
  function shippedClass(startMarker, endMarker) {
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker, start);
    assert(start >= 0 && end > start, 'Chekly class boundaries changed; update this harness before trusting it.');
    return vm.runInContext(`(${source.slice(start, end)})`, context);
  }
  const Manager = shippedClass('class u{', 'const h=new u;');
  const Tracking = shippedClass('class i{', 'class s{');
  const ShopifyData = shippedClass('class a{', 'class u{');
  const manager = Object.create(Manager.prototype);
  Object.assign(manager, {
    config: {
      dataAttrAppUrl: 'data-chekly-url',
      dataAttrCustomDomain: 'data-checkout-domain',
      dataAttrCheckoutTheme: 'data-chekly-theme',
      defaultAppBaseUrl: 'https://chekly-app.com',
      domainPath: 'checkout',
    },
    isCheckoutProcessing: false,
    isReturningFromChekly: false,
    cookieHelper: { getCookie: key => cookies[key] || '', setCookieWithExpire() {} },
    shopifyData: ShopifyData,
    gaLinker: { getLinkerParam: () => '_gl=synthetic-linker' },
    hooks: {},
  });
  manager.trackingManager = new Tracking(manager.cookieHelper);
  manager.processCheckout(true);
  return { url: window.location, manager, window, storage };
}

test('guest redirect keeps Kyiv domain, cart, locale, theme, click attribution, and linker', () => {
  const result = checkout({ root: '/en/', search: '?gclid=new-click', savedTracking: '{"gclid":"old-click"}' });
  const url = new URL(result.url);
  assert.equal(url.origin, 'https://checkout.newbornk.com');
  assert.equal(url.pathname, '/checkout/');
  for (const [key, value] of Object.entries({
    storeName: 'newbornk.com', cartToken: 'synthetic-cart-token', curRate: '1',
    theme: 'chekly', shopifyDomain: 'newbornk-com.myshopify.com', subFolder: 'en',
    gclid: 'new-click', _gl: 'synthetic-linker',
  })) assert.equal(url.searchParams.get(key), value, key);
  assert.equal(url.searchParams.has('user_email'), false);
  assert.equal(result.storage.get('chekly_about_to_redirect'), 'true');
});

test('logged-in contact fields survive the redirect without query corruption', () => {
  const customer = {
    firstName: 'Ім’я & тест', lastName: 'Тест = №1',
    email: 'checkout+test@example.invalid', phone: '+380000000000',
  };
  const url = new URL(checkout({ customer }).url);
  for (const [key, value] of Object.entries({
    user_name: customer.firstName, user_lastname: customer.lastName,
    user_email: customer.email, user_phone: customer.phone,
  })) assert.equal(url.searchParams.get(key), value, key);
  assert.equal([...url.searchParams.keys()].some(key => key.includes('тест')), false);
});

test('ordinary customer values and the default language route remain intact', () => {
  const url = new URL(checkout({ customer: { firstName: 'Test', lastName: 'Customer', email: 'test@example.invalid', phone: '12345' } }).url);
  assert.equal(url.searchParams.get('user_name'), 'Test');
  assert.equal(url.searchParams.get('user_email'), 'test@example.invalid');
  assert.equal(url.searchParams.has('subFolder'), false);
});

test('a repeated checkout event does not build a second redirect', () => {
  const result = checkout();
  result.manager.getAppBaseUrl = () => { throw new Error('Duplicate checkout'); };
  result.manager.processCheckout(true);
  assert.equal(result.window.location, result.url);
});

test('a missing cart token uses the existing Shopify checkout fallback', () => {
  assert.equal(checkout({ cartToken: '' }).url, '/checkout');
});
