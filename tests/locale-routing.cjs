const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '../assets/nbk-locale-routing.js'), 'utf8');

function setup({ locale = 'uk', root = '/', serverRoot = '/en/', htmlLang = locale, baseURI = 'https://newbornk.com/' } = {}) {
  const observers = [];
  const listeners = new Map();
  const writes = [];
  class Element {
    constructor(tag, attributes = {}) { this.tag = tag; this.attributes = { ...attributes }; this.children = []; }
    getAttribute(name) { return this.attributes[name] ?? null; }
    setAttribute(name, value) {
      this.attributes[name] = value; writes.push({ element: this, name, value });
      for (const observer of observers) if (observer.options.attributeFilter.includes(name)) observer.records.push({ type: 'attributes', target: this });
    }
    matches(selector) {
      return selector.split(',').some(part => {
        part = part.trim();
        if (part.startsWith('.')) return (this.attributes.class || '').split(/\s+/).includes(part.slice(1));
        const match = part.match(/^([\w-]+)?(?:\[([\w-]+)(?:="([^"]*)")?\])?$/);
        return Boolean(match && (!match[1] || this.tag === match[1]) && (!match[2] || Object.hasOwn(this.attributes, match[2]) && (match[3] === undefined || this.attributes[match[2]] === match[3])));
      });
    }
    closest(selector) { for (let current = this; current; current = current.parent) if (current.matches(selector)) return current; return null; }
    querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    append(child) {
      child.parent = this; this.children.push(child);
      for (const observer of observers) observer.records.push({ type: 'childList', target: this, addedNodes: [child] });
      return child;
    }
  }
  const html = new Element('html'); html.lang = htmlLang;
  const body = html.append(new Element('body'));
  const document = {
    currentScript: { dataset: { locale, root } }, documentElement: html, baseURI,
    querySelectorAll: selector => html.querySelectorAll(selector),
    addEventListener(type, callback, options) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push({ callback, options }); }
  };
  const window = { Shopify: { routes: { root: serverRoot } } };
  const context = vm.createContext({
    window, document, Element, URL, location: { origin: 'https://newbornk.com', href: baseURI },
    MutationObserver: class {
      constructor(callback) { this.callback = callback; this.records = []; }
      observe(target, options) { this.target = target; this.options = options; observers.push(this); }
    }
  });
  return {
    window, document, observers, listeners, writes,
    node: (tag, attributes) => new Element(tag, attributes),
    add(tag, attributes, parent = body) { return parent.append(new Element(tag, attributes)); },
    run() { vm.runInContext(source, context); },
    event(type, target) { for (const { callback } of listeners.get(type) || []) callback({ target }); },
    flush() {
      let turns = 0;
      while (observers.some(observer => observer.records.length)) {
        assert(++turns <= 10, 'Attribute normalization must not cause an observer feedback loop');
        for (const observer of observers) if (observer.records.length) observer.callback(observer.records.splice(0));
      }
      return turns;
    }
  };
}

test('repairs Ukrainian wrong-prefix links/forms and immediate Ajax root without changing URL shape', () => {
  const app = setup();
  const examples = [
    ['/en/collections/cholovikam?sort_by=price-ascending#products', '/collections/cholovikam?sort_by=price-ascending#products'],
    ['https://newbornk.com/en/products/test?variant=123&utm_source=a%2Fb#size', 'https://newbornk.com/products/test?variant=123&utm_source=a%2Fb#size'],
    ['//newbornk.com/en/search?q=blue%20shirt#results', '//newbornk.com/search?q=blue%20shirt#results'],
    ['en/pages/contact?from=menu', 'pages/contact?from=menu'],
    ['/en', '/']
  ];
  const links = examples.map(([href]) => app.add('a', { href }));
  const form = app.add('form', { action: '/en/search?q=old#search' });
  app.run();
  assert.equal(app.window.Shopify.routes.root, '/');
  examples.forEach(([, expected], index) => assert.equal(links[index].getAttribute('href'), expected));
  assert.equal(form.getAttribute('action'), '/search?q=old#search');
  assert.equal(app.document.baseURI, 'https://newbornk.com/', 'The current page is never redirected');
});

test('Russian page keeps Russian navigation; correct English and unrelated market roots stay untouched', () => {
  const russian = setup({ locale: 'ru', root: '/ru/' });
  const link = russian.add('a', { href: '/en/products/test?variant=42' });
  russian.run();
  assert.equal(link.getAttribute('href'), '/ru/products/test?variant=42');
  assert.equal(russian.window.Shopify.routes.root, '/ru/');
  for (const options of [{ locale: 'en', root: '/en/' }, { serverRoot: '/' }, { serverRoot: '/en-ca/' }, { htmlLang: 'en' }]) {
    const app = setup(options); const node = app.add('a', { href: '/en/products/test' }); app.run();
    assert.equal(node.getAttribute('href'), '/en/products/test');
    assert.equal(app.window.Shopify.routes.root, options.serverRoot || '/en/');
    assert.equal(app.observers.length, options.htmlLang === 'en' ? 0 : 1);
  }
});

test('English repairs late localized authentication without rewriting storefront or Ajax routes', () => {
  const app = setup({ locale: 'en', root: '/en/', baseURI: 'https://newbornk.com/en/blogs/blog' });
  const product = app.add('a', { href: '/en/products/example?variant=42' });
  app.window.routes = { cart_url: '/en/cart', cart_add_url: '/en/cart/add' };
  app.run();
  const query = '?locale=en&region_country=UA&return_to=%2Fen%2Fcollections%2Fnew';
  const login = app.add('a', { href: `https://newbornk.com/en/customer_authentication/redirect${query}` });
  app.flush();
  assert.equal(login.getAttribute('href'), `https://newbornk.com/customer_authentication/redirect${query}`);
  login.setAttribute('href', `/en/customer_authentication/redirect${query}`);
  app.flush();
  assert.equal(login.getAttribute('href'), `/customer_authentication/redirect${query}`);
  assert.equal(product.getAttribute('href'), '/en/products/example?variant=42');
  assert.equal(app.window.Shopify.routes.root, '/en/');
  assert.deepEqual(app.window.routes, { cart_url: '/en/cart', cart_add_url: '/en/cart/add' });
});

test('Shopify authentication stays at the root while Russian storefront links remain localized', () => {
  const app = setup({ locale: 'ru', root: '/ru/' });
  const query = '?locale=ru&region_country=UA&return_to=%2Fru%2Fcollections%2Fnew';
  const login = app.add('a', { href: `https://newbornk.com/en/customer_authentication/redirect${query}` });
  const social = app.add('a', { href: `/customer_authentication/login${query}` });
  const explicit = app.add('a', { href: `https://accounts.example.com/en/customer_authentication/redirect${query}` });
  app.run();
  assert.equal(login.getAttribute('href'), `https://newbornk.com/customer_authentication/redirect${query}`);
  assert.equal(social.getAttribute('href'), `/customer_authentication/login${query}`);
  assert.equal(explicit.getAttribute('href'), `https://accounts.example.com/en/customer_authentication/redirect${query}`);
  login.setAttribute('href', `/en/customer_authentication/redirect${query}`);
  app.flush();
  assert.equal(login.getAttribute('href'), `/customer_authentication/redirect${query}`);
});

test('preserves explicit language choices, localization forms, external destinations and hashes', () => {
  const app = setup();
  const unchanged = [
    ['/en/products/test', { hreflang: 'en' }], ['/en', { lang: 'en' }], ['/en/pages/help', { 'data-nbk-keep-locale': '' }],
    ['https://shopify.com/account?locale=en', {}], ['//other.example/en/products/test', {}],
    ['#details', {}], ['?locale=en', {}], ['mailto:shop@example.com', {}], ['/english/pages/test', {}], ['/ru/products/test', {}]
  ].map(([href, attributes]) => ({ href, node: app.add('a', { href, ...attributes }) }));
  const switcher = app.add('div', { class: 'translation-lab-language-switcher' });
  const languageLink = app.add('a', { href: '/en/products/test' }, switcher);
  const localization = app.add('form', { action: '/en/localization' });
  const custom = app.add('form', { action: '/en/language' }); app.add('input', { name: 'language_code' }, custom);
  const canonical = app.add('link', { href: '/en', rel: 'alternate', hreflang: 'en' });
  app.run();
  for (const { node, href } of unchanged) assert.equal(node.getAttribute('href'), href);
  assert.equal(languageLink.getAttribute('href'), '/en/products/test');
  assert.equal(localization.getAttribute('action'), '/en/localization');
  assert.equal(custom.getAttribute('action'), '/en/language');
  canonical.setAttribute('href', '/en/products/test'); app.flush();
  assert.equal(canonical.getAttribute('href'), '/en/products/test');
});

test('repairs late window.routes at DOM ready and before interaction without touching unrelated keys', () => {
  const app = setup(); const button = app.add('button'); app.run();
  app.window.routes = { cart_add_url: '/en/cart/add', predictive_search_url: '/en/search/suggest', unrelated_url: '/en/keep' };
  app.event('DOMContentLoaded');
  assert.equal(app.window.routes.cart_add_url, '/cart/add');
  assert.equal(app.window.routes.predictive_search_url, '/search/suggest');
  assert.equal(app.window.routes.unrelated_url, '/en/keep');
  app.window.routes = { cart_change_url: '/en/cart/change', cart_update_url: '/en/cart/update' };
  app.window.Shopify.routes.root = '/en/';
  app.event('pointerdown', button);
  assert.equal(app.window.routes.cart_change_url, '/cart/change');
  assert.equal(app.window.routes.cart_update_url, '/cart/update');
  assert.equal(app.window.Shopify.routes.root, '/');
  assert.equal(app.listeners.get('pointerdown')[0].options, true, 'Repair precedes bubble-phase app handlers');
});

test('normalizes dynamic cards and attribute changes once, including interaction before observer delivery', () => {
  const app = setup(); app.run(); app.run();
  assert.equal(app.observers.length, 1, 'Duplicate initialization does not duplicate observers');
  const wrapper = app.node('div');
  const link = wrapper.append(app.node('a', { href: '/en/products/first?campaign=1' }));
  app.add('section').append(wrapper); app.flush();
  assert.equal(link.getAttribute('href'), '/products/first?campaign=1');
  link.setAttribute('href', '/en/products/second#new'); app.flush();
  assert.equal(link.getAttribute('href'), '/products/second#new');
  const settledWrites = app.writes.length; app.flush();
  assert.equal(app.writes.length, settledWrites);
  link.setAttribute('href', '/en/products/third'); app.event('click', link);
  assert.equal(link.getAttribute('href'), '/products/third'); app.flush();
  const form = app.add('form', { action: '/en/cart' }); app.event('submit', form);
  assert.equal(form.getAttribute('action'), '/cart'); app.flush();
});

test('repairs Kalles routes before modules initialize and keeps later menu targets in the rendered language', () => {
  const app = setup(); app.run();
  app.window.themeHDN = { routes: { search_url: '/en/search', predictive_search_url: '/en/search/suggest' } };
  app.event('nbk:routes-ready');
  assert.equal(app.window.themeHDN.routes.search_url, '/search');
  assert.equal(app.window.themeHDN.routes.predictive_search_url, '/search/suggest');
  const menu = app.add('summary', { 'data-url': '/en/collections/women' });
  app.event('pointerdown', menu);
  assert.equal(menu.getAttribute('data-url'), '/collections/women');
  menu.setAttribute('data-url', '/en/collections/sale'); app.flush();
  assert.equal(menu.getAttribute('data-url'), '/collections/sale');
  const foreign = app.add('summary', { 'data-url': 'https://example.com/en/path' }); app.flush();
  assert.equal(foreign.getAttribute('data-url'), 'https://example.com/en/path');
});


test('already-localized authentication paths are repaired even when Shopify storefront root is correct', () => {
  for (const serverRoot of ['/ru/', '/en/']) {
    const app = setup({ locale: 'ru', root: '/ru/', serverRoot });
    const login = app.add('a', { href: '/ru/customer_authentication/redirect?locale=ru&region_country=UA' });
    const storefront = app.add('a', { href: '/en/products/explicit' });
    app.run();
    assert.equal(login.getAttribute('href'), '/customer_authentication/redirect?locale=ru&region_country=UA');
    assert.equal(storefront.getAttribute('href'), serverRoot === '/en/' ? '/ru/products/explicit' : '/en/products/explicit');
    login.setAttribute('href', '/ru/customer_authentication/redirect?locale=ru');
    app.flush();
    assert.equal(login.getAttribute('href'), '/customer_authentication/redirect?locale=ru');
  }
});
