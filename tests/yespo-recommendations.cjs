const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '../assets/nbk-yespo-recommendations.js'), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
const PRODUCT_ID = 15857491476640;
const LEGACY_VARIANT_ID = 57750970695840;

class Element {
  constructor(tag = 'div', className = '') {
    this.tag = tag;
    this.className = className;
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.listeners = {};
    this.textContent = '';
    this.scrollLeft = 0;
    this.clientWidth = 300;
    this.scrollWidth = 900;
    this.classList = {
      contains: name => this.className.split(/\s+/).includes(name),
      add: name => { if (!this.classList.contains(name)) this.className = `${this.className} ${name}`.trim(); },
      remove: name => { this.className = this.className.split(/\s+/).filter(item => item !== name).join(' '); }
    };
  }
  get isConnected() { return Boolean(this.connectedRoot || this.parent?.isConnected); }
  get id() { return this.attributes.id || ''; }
  set id(value) { this.attributes.id = value; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  removeAttribute(name) { delete this.attributes[name]; }
  getAttribute(name) { return this.attributes[name] ?? null; }
  matches(selector) {
    const match = selector.match(/^([\w-]+)?(?:\.([\w-]+))?$/);
    return Boolean(match && (!match[1] || this.tag === match[1]) && (!match[2] || this.classList.contains(match[2])));
  }
  closest(selector) {
    for (let node = this; node; node = node.parent) if (node.matches(selector)) return node;
    return null;
  }
  querySelectorAll(selector) {
    const selectors = selector.split(',').map(item => item.trim());
    const result = [];
    const visit = node => {
      for (const child of node.children) {
        if (selectors.some(item => {
          if (item.startsWith(':scope > ')) return child.parent === this && child.matches(item.slice(9));
          const parts = item.split(' ');
          return parts.length === 1 ? child.matches(item) : child.matches(parts[1]) && Boolean(child.parent?.closest(parts[0]));
        })) result.push(child);
        visit(child);
      }
    };
    visit(this);
    return result;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  append(child) {
    if (child.tag === 'fragment') { for (const node of [...child.children]) this.append(node); return; }
    child.remove();
    child.parent = this;
    this.children.push(child);
    if (child.isConnected && child.tag === 'hdt-wishlist') this.onWishlistAppend?.(child);
  }
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this);
    this.parent = null;
  }
  before(child) {
    const parent = this.parent;
    child.remove();
    child.parent = parent;
    parent.children.splice(parent.children.indexOf(this), 0, child);
  }
  after(child) {
    const parent = this.parent;
    child.remove();
    child.parent = parent;
    parent.children.splice(parent.children.indexOf(this) + 1, 0, child);
  }
  get nextElementSibling() { return this.parent?.children[this.parent.children.indexOf(this) + 1] || null; }
  addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
  emit(name, event = {}) { for (const callback of this.listeners[name] || []) callback(event); }
  click() { this.clicks = (this.clicks || 0) + 1; }
  scrollBy(options) { this.lastScroll = options; this.scrollLeft += options.left; this.emit('scroll'); }
  cloneNode(deep) {
    const copy = new Element(this.tag, this.className);
    copy.attributes = { ...this.attributes };
    copy.dataset = { ...this.dataset };
    if (deep) for (const child of this.children) copy.append(child.cloneNode(true));
    return copy;
  }
}

function setup({ handles = ['helmet'], root = '/uk', defined = true, empty = false, wishlist = true } = {}) {
  const requests = [];
  const intersections = [];
  const mutations = [];
  const frames = [];
  const upgraded = [];
  let resolveDefined;
  const definition = defined ? Promise.resolve() : new Promise(resolve => { resolveDefined = resolve; });
  const body = new Element('body'); body.connectedRoot = true;
  const main = new Element('main'); main.id = 'MainContent'; body.append(main);
  const widget = new Element('div', 'es-recom-container'); widget.id = 'yespo-products';
  const heading = new Element('h2', 'title'); heading.textContent = 'Recommended'; widget.append(heading);
  const slider = new Element('div', 'es-productsSlider'); widget.append(slider);
  main.append(widget);
  const related = new Element('section', 'hdt-related-products'); main.append(related);
  const template = new Element('template'); template.content = new Element('fragment');
  const templateButton = new Element('hdt-wishlist', 'nbk-yespo-wishlist hdt-pr_btn');
  templateButton.dataset.id = '19041994'; templateButton.setAttribute('action', 'add');
  if (wishlist) template.content.append(templateButton);
  const config = { textContent: JSON.stringify({ root, localePrefixes: ['/uk/', '/en/', '/ru/'], heading: 'Рекомендовані товари', previous: 'Попередні', next: 'Наступні' }) };
  function makeCard(handle, href = `https://newbornk.com/uk/products/${handle}?variant=${LEGACY_VARIANT_ID}&es_source=product&es_request_id=keep-me`) {
    const slide = new Element('div', 'swiper-slide'); slide.setAttribute('role', 'group'); slide.setAttribute('aria-label', '1 / 3');
    const card = new Element('div', 'card-wrapper');
    const link = new Element('a', 'full-unstyled-link'); link.href = href; card.append(link);
    const accessibleTitle = new Element('span', 'visually-hidden'); accessibleTitle.textContent = 'Назва з фіда'; link.append(accessibleTitle);
    const title = new Element('span', 'card-information__text'); title.textContent = 'Назва з фіда'; link.append(title);
    const media = new Element('div', 'media'); const image = new Element('img'); image.setAttribute('fetchpriority', 'high'); media.append(image); link.append(media);
    const hero = new Element('button', 'wishlist-hero-custom-button'); hero.setAttribute('data-wlh-id', LEGACY_VARIANT_ID); card.append(hero);
    const add = new Element('button', 'card__add-to-cart'); card.append(add);
    card.onWishlistAppend = button => {
      assert.notEqual(button.dataset.id, '19041994', 'Real product ID is set while template content is inert');
      assert.ok(button.dataset.handle, 'Handle is set before custom element can upgrade');
      upgraded.push({ id: button.dataset.id, handle: button.dataset.handle });
    };
    slide.append(card); slider.append(slide);
    return { card, link, hero, image, slide, title, accessibleTitle, originalHref: href };
  }
  const cards = empty ? [] : handles.map(handle => makeCard(handle));
  const context = vm.createContext({
    Element, URL, location: { origin: 'https://newbornk.com' },
    document: { getElementById: id => ({ MainContent: main, 'nbk-yespo-recommendations-config': config, 'nbk-yespo-wishlist-template': template })[id] || null,
      createElement: tag => new Element(tag) },
    AbortSignal: { timeout: ms => ({ timeout: ms }) },
    fetch: (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject })),
    customElements: { whenDefined: name => { assert.equal(name, 'hdt-wishlist'); return definition; } },
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame: callback => frames.push(callback),
    ResizeObserver: class { constructor(callback) { this.callback = callback; } observe() {} },
    IntersectionObserver: class {
      constructor(callback, options) { this.callback = callback; this.options = options; this.observed = new Set(); intersections.push(this); }
      observe(node) { this.observed.add(node); }
      unobserve(node) { this.observed.delete(node); }
    },
    MutationObserver: class { constructor(callback) { this.callback = callback; mutations.push(this); } observe() {} }
  });
  vm.runInContext(source, context);
  return {
    requests, cards, widget, slider, main, heading, upgraded, intersections, mutations,
    intersect(card) { intersections[0].callback([{ target: card, isIntersecting: true }]); },
    mutate() { mutations[0].callback([{ target: slider, addedNodes: [] }]); while (frames.length) frames.shift()(); },
    insert(handle, href) { const card = makeCard(handle, href); cards.push(card); this.mutate(); return card; },
    rerun() { vm.runInContext(source, context); },
    define() { resolveDefined(); },
    async respond(index, product = { id: PRODUCT_ID, handle: 'helmet' }, ok = true) { requests[index].resolve({ ok, json: async () => product }); await tick(); },
    async reject(index) { requests[index].reject(new Error('offline')); await tick(); }
  };
}

test('lazy wishlist uses Ajax product ID instead of legacy variant ID and preserves tracked link', async () => {
  const app = setup();
  const { card, link, originalHref, hero, image, slide } = app.cards[0];
  assert.equal(app.requests.length, 0, 'Offscreen recommendations must not request product data');
  assert.equal(hero.isConnected, false);
  assert.equal(card.querySelector('.card__add-to-cart'), null);
  assert.equal(image.loading, 'lazy');
  assert.equal(image.getAttribute('fetchpriority'), null);
  assert.equal(slide.getAttribute('aria-label'), null);
  app.intersect(card);
  assert.equal(app.requests[0].url, '/uk/products/helmet.js');
  assert.equal(app.requests[0].options.credentials, 'same-origin');
  await app.respond(0);
  const button = card.querySelector('hdt-wishlist');
  assert.equal(button.dataset.id, String(PRODUCT_ID));
  assert.notEqual(button.dataset.id, String(LEGACY_VARIANT_ID));
  assert.equal(button.dataset.handle, 'helmet');
  assert.equal(button.closest('a'), null, 'Wishlist activation must not navigate the recommendation link');
  assert.equal(link.href, originalHref);
  assert.equal(new URL(link.href).searchParams.get('es_request_id'), 'keep-me');
  assert.deepEqual(app.upgraded, [{ id: String(PRODUCT_ID), handle: 'helmet' }]);
  let prevented = false;
  button.emit('keydown', { key: ' ', preventDefault() { prevented = true; } });
  assert.equal(prevented, true); assert.equal(button.clicks, 1);
});

test('asynchronously inserted cards initialize once; repeated widgets share product fetches', async () => {
  const app = setup({ empty: true, root: '/' });
  assert.equal(app.widget.classList.contains('nbk-yespo-recommendations'), false);
  const first = app.insert('helmet');
  app.rerun(); app.mutate();
  assert.equal(app.intersections.length, 1);
  assert.equal(app.mutations.length, 1);
  assert.equal(app.widget.querySelectorAll('.nbk-yespo-nav').length, 1);
  assert.equal(app.heading.textContent, 'Рекомендовані товари');
  const second = app.insert('helmet');
  app.intersect(first.card); app.intersect(second.card);
  assert.equal(app.requests.length, 1);
  assert.equal(app.requests[0].url, '/products/helmet.js');
  await app.respond(0);
  app.mutate();
  assert.equal(first.card.querySelectorAll('hdt-wishlist').length, 1);
  assert.equal(second.card.querySelectorAll('hdt-wishlist').length, 1);
});

test('two recommendation widgets settle after positioning without repeated DOM moves', () => {
  const app = setup({ handles: ['helmet', 'sweater'] });
  const secondWidget = new Element('div', 'es-recom-container'); secondWidget.id = 'yespo-second';
  const secondSlider = new Element('div', 'es-productsSlider');
  secondWidget.append(secondSlider);
  secondSlider.append(app.cards[1].slide);
  app.main.append(secondWidget);

  const related = app.main.querySelector(':scope > .hdt-related-products');
  const moveBefore = related.before.bind(related);
  let moves = 0;
  related.before = node => { moves += 1; moveBefore(node); };
  app.mutate();
  assert.equal(moves, 1, 'New widget is positioned once before related products');
  const positionedOrder = [...app.main.children];

  for (let update = 0; update < 20; update += 1) app.mutate();
  assert.equal(moves, 1, 'Mutation callbacks must not alternate widget moves forever');
  assert.deepEqual(app.main.children, positionedOrder);
  assert.equal(app.widget.nextElementSibling, secondWidget);
  assert.equal(secondWidget.nextElementSibling, related);
  assert.equal(app.main.querySelectorAll('.nbk-yespo-nav').length, 2);
});

test('waits for native wishlist definition and ignores cards removed before registration', async () => {
  const app = setup({ defined: false, handles: ['helmet', 'sweater'] });
  app.intersect(app.cards[0].card); await app.respond(0);
  app.intersect(app.cards[1].card); await app.respond(1, { id: PRODUCT_ID + 1, handle: 'sweater' });
  assert.equal(app.cards[0].card.querySelector('hdt-wishlist'), null);
  assert.equal(app.cards[1].card.querySelector('hdt-wishlist'), null);
  app.cards[0].card.remove(); app.define(); await tick();
  assert.deepEqual(app.upgraded, [{ id: String(PRODUCT_ID + 1), handle: 'sweater' }]);
});

test('failed, invalid, foreign and detached recommendations do not add a wishlist control', async () => {
  const app = setup({ empty: true });
  const foreign = app.insert('foreign', 'https://other.example/products/helmet');
  const malformed = app.insert('malformed', 'https://newbornk.com/products/%E0%A4%A');
  app.intersect(foreign.card); app.intersect(malformed.card);
  assert.equal(app.requests.length, 0);
  for (const [index, response] of [null, { id: LEGACY_VARIANT_ID.toString(), handle: 'wrong' }, { id: -1, handle: 'wrong' }].entries()) {
    const card = app.insert(`invalid-${index}`); app.intersect(card.card);
    await app.respond(index, response);
    assert.equal(card.card.querySelector('hdt-wishlist'), null);
  }
  const missing = app.insert('missing'); app.intersect(missing.card); await app.respond(3, {}, false);
  const failed = app.insert('failed'); app.intersect(failed.card); await app.reject(4);
  const removed = app.insert('removed'); app.intersect(removed.card); removed.card.remove(); await app.respond(5);
  assert.equal(app.upgraded.length, 0);
});

test('product lookups never exceed three in flight and queued cards still resolve', async () => {
  const app = setup({ handles: ['one', 'two', 'three', 'four', 'five'] });
  for (const { card } of app.cards) app.intersect(card);
  assert.equal(app.requests.length, 3);
  await app.respond(0, { id: PRODUCT_ID, handle: 'one' });
  assert.equal(app.requests.length, 4);
  await app.reject(1);
  assert.equal(app.requests.length, 5);
  for (const index of [2, 3, 4]) await app.respond(index, { id: PRODUCT_ID + index, handle: ['three', 'four', 'five'][index - 2] });
  assert.equal(app.upgraded.length, 4);
});

for (const root of ['/', '/en', '/ru/']) {
  test(`recommendation links keep current locale ${root}, attribution and variant`, async () => {
    const app = setup({ empty: true, root });
    for (const path of ['/products/helmet', '/uk/products/helmet', '/en/collections/new/products/helmet', '/ru/products/helmet']) {
      const item = app.insert('helmet', `https://newbornk.com${path}?variant=${LEGACY_VARIANT_ID}&es_request_id=keep-me#details`);
      const url = new URL(item.link.href);
      const expected = root.replace(/\/?$/, '/') + path.replace(/^\/(?:uk|en|ru)\//, '/').slice(1);
      assert.equal(url.pathname, expected);
      assert.equal(url.searchParams.get('variant'), String(LEGACY_VARIANT_ID));
      assert.equal(url.searchParams.get('es_request_id'), 'keep-me');
      assert.equal(url.hash, '#details');
      app.mutate();
      assert.equal(new URL(item.link.href).pathname, expected, 'Repeated renders must not duplicate locale prefixes');
      app.intersect(item.card);
    }
    assert.equal(app.requests.length, 1);
    assert.equal(app.requests[0].url, root.replace(/\/?$/, '/') + 'products/helmet.js');
    await app.respond(0);
    assert.equal(app.upgraded.length, 4);
  });
}

test('recommendation locale correction leaves external tracking and non-product links intact', () => {
  const app = setup({ empty: true, root: '/en/' });
  for (const href of ['https://tracker.example/products/helmet?url=abc', 'https://newbornk.com/pages/about', 'https://newbornk.com/collections/new']) {
    const item = app.insert('helmet', href);
    assert.equal(item.link.href, href);
  }
});

test('visible and accessible recommendation names use the localized product without extra requests', async () => {
  const app = setup({ root: '/en/', wishlist: false });
  const item = app.cards[0];
  app.intersect(item.card);
  const title = 'SIMPLE PANT trousers — brown <limited>';
  await app.respond(0, { id: PRODUCT_ID, handle: 'helmet', title });
  assert.equal(app.requests[0].url, '/en/products/helmet.js');
  assert.equal(item.title.textContent, title, 'Use text, never HTML from a product title');
  assert.equal(item.accessibleTitle.textContent, title);
  assert.equal(item.image.getAttribute('alt'), title);
  assert.equal(item.card.querySelector('hdt-wishlist'), null);
  app.mutate();
  assert.equal(app.requests.length, 1);
  assert.equal(new URL(item.link.href).searchParams.get('es_request_id'), 'keep-me');
});

test('failed or stale product lookups keep the original recommendation title', async () => {
  const app = setup({ root: '/en/', handles: ['failed', 'changed', 'empty'] });
  for (const item of app.cards) app.intersect(item.card);
  await app.reject(0);
  app.cards[1].link.href = 'https://newbornk.com/en/products/new-product';
  await app.respond(1, { id: PRODUCT_ID, handle: 'changed', title: 'Old product' });
  await app.respond(2, { id: PRODUCT_ID, handle: 'empty', title: '  ' });
  for (const item of app.cards) assert.equal(item.title.textContent, 'Назва з фіда');
});
