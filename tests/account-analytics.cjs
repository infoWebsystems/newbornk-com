const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync(require('node:path').join(__dirname, '../assets/nbk-account-analytics.js'), 'utf8');
const KEY = 'nbk_account_intent_v1';

function setup({ consent = true, signedIn = false, pending = null, privacyReady = true, path = '/', role = 'main', preview = false, blockedStorage = false } = {}) {
  const listeners = {}, timers = new Map(), storage = new Map();
  const nodes = [];
  let intersect, mutation, privacyCallback, nextId = 0, allowed = consent, now = 10000000;
  if (pending) storage.set(KEY, JSON.stringify(pending));
  const privacy = { analyticsProcessingAllowed: () => allowed };
  const document = {
    body: {}, visibilityState: 'visible',
    getElementById: () => ({ textContent: JSON.stringify({ signedIn, locale: 'uk', designMode: false }) }),
    querySelectorAll: () => nodes,
    addEventListener: (name, fn) => { (listeners[name] ||= []).push(fn); },
  };
  const window = {
    Shopify: { theme: { role }, customerPrivacy: privacyReady ? privacy : undefined,
      loadFeatures: (_, cb) => { privacyCallback = cb; } },
    addEventListener: () => {},
  };
  const location = new URL('https://newbornk.com' + path + (preview ? '?preview_theme_id=123' : ''));
  const context = vm.createContext({
    window, document, location, URL, URLSearchParams,
    Date: { now: () => now },
    sessionStorage: {
      getItem: key => { if (blockedStorage) throw Error('blocked'); return storage.get(key); },
      setItem: (key, value) => { if (blockedStorage) throw Error('blocked'); storage.set(key, value); },
      removeItem: key => storage.delete(key),
    },
    setTimeout: fn => { timers.set(++nextId, fn); return nextId; },
    clearTimeout: id => timers.delete(id),
    IntersectionObserver: class { constructor(cb) { intersect = cb; } observe() {} unobserve() {} },
    MutationObserver: class { constructor(cb) { mutation = cb; } observe() {} },
  });
  vm.runInContext(code, context);
  const fire = (name, event = {}) => (listeners[name] || []).forEach(fn => fn(event));
  return {
    storage, window,
    events: () => Array.from(window.dataLayer || [], x => ({ name: x[1], ...x[2] })),
    grant(value) { allowed = value; fire('visitorConsentCollected'); },
    ready() { window.Shopify.customerPrivacy = privacy; privacyCallback?.(null); },
    view(source = 'menu') {
      const node = { isConnected: true, dataset: { nbkKrewTeaser: source } }; nodes.push(node); mutation?.();
      intersect?.([{ target: node, isIntersecting: true, intersectionRatio: 0.75 }]); return node;
    },
    leave(node) { intersect?.([{ target: node, isIntersecting: false, intersectionRatio: 0 }]); },
    tick() { const pendingTimers = [...timers.values()]; timers.clear(); pendingTimers.forEach(fn => fn()); },
    visibility(value) { document.visibilityState = value; fire('visibilitychange'); },
    click(href, source = null, account = false) {
      const anchor = { localName: 'a', href, dataset: source ? { nbkAccountLink: source } : {},
        hasAttribute: key => key === 'data-nbk-account-link' && !!source, closest: () => null };
      const host = { localName: 'shopify-account', closest: () => null };
      fire('click', { composedPath: () => account ? [anchor, host] : [anchor] });
    },
    open() { fire('open', { target: { localName: 'shopify-account', closest: () => null } }); },
    rerun() { vm.runInContext(code, context); },
  };
}

test('nothing is sent or stored before consent; old clicks are not replayed', () => {
  const app = setup({ consent: false, path: '/en/pages/newborn-krew' });
  app.open(); app.click('/account', 'menu'); app.view(); app.tick();
  assert.equal(app.events().length, 0); assert.equal(app.storage.size, 0);
  app.grant(true); app.tick();
  assert.deepEqual(app.events().map(e => e.name), ['nbk_krew_view', 'nbk_krew_teaser_view']);
});

test('visible impression needs a full second and is counted once per placement element', () => {
  const app = setup(), node = app.view(); app.leave(node); app.tick();
  assert.equal(app.events().length, 0);
  app.view('footer'); app.tick(); app.tick(); app.rerun();
  assert.equal(app.events().length, 1); assert.equal(app.events()[0].entry_point, 'footer');
});

test('background tabs and revoked consent cancel pending impressions', () => {
  const app = setup(); app.view(); app.visibility('hidden'); app.tick();
  assert.equal(app.events().length, 0);
  app.visibility('visible'); app.grant(false); app.tick(); assert.equal(app.events().length, 0);
  app.grant(true); app.tick(); assert.equal(app.events().length, 1);
});

test('opening the account is not reported as login; account and KREW links are distinct', () => {
  const app = setup(); app.open(); app.click('/account', 'menu');
  app.click('https://shopify.com/57872023712/account/orders?email=private@example.com', null, true);
  app.click('/en/pages/newborn-krew'); app.click('https://example.com/privacy', null, true);
  assert.deepEqual(app.events().map(e => e.name), ['nbk_account_open', 'nbk_account_click', 'nbk_account_click', 'nbk_krew_click']);
  assert.equal(app.events()[2].destination, 'orders');
  assert.equal(JSON.stringify(app.events()).includes('private@'), false);
  assert.equal(JSON.stringify(app.events()).includes('57872023712'), false);
});

test('signed-in return requires recent intent and is consumed once', () => {
  const app = setup({ signedIn: true, pending: { at: 9990000, source: 'menu' } });
  app.grant(true); app.rerun();
  assert.deepEqual(app.events().map(e => e.name), ['nbk_login_return']);
  assert.equal(app.storage.has(KEY), false);
  assert.equal(setup({ signedIn: true }).events().length, 0);
  for (const at of [0, 20000000, '9990000']) {
    const expired = setup({ signedIn: true, pending: { at, source: 'menu' } });
    assert.equal(expired.events().length, 0); assert.equal(expired.storage.size, 0);
  }
});

test('late privacy API preserves recent intent until permission is known', () => {
  const app = setup({ signedIn: true, privacyReady: false, pending: { at: 9990000, source: 'footer' } });
  assert.equal(app.events().length, 0); assert.equal(app.storage.size, 1);
  app.ready(); assert.equal(app.events()[0].name, 'nbk_login_return');
});

test('preview themes do not contribute to analytics', () => {
  for (const options of [{ preview: true }, { role: 'unpublished' }]) {
    const app = setup(options); app.open(); app.click('/account', 'footer'); app.view(); app.tick();
    assert.equal(app.events().length, 0); assert.equal(app.storage.size, 0);
  }
});

test('blocked storage does not break account links and no identifiers are emitted', () => {
  const app = setup({ blockedStorage: true }); app.click('/account', 'footer');
  assert.equal(app.events()[0].name, 'nbk_account_click');
  assert.deepEqual(Object.keys(app.events()[0]).sort(), ['account_state','destination','entry_point','name','send_to','site_language','ui_version']);
});
