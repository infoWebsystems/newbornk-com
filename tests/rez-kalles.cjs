const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const liquid = readFileSync(join(__dirname, '../snippets/nbk-rez-kalles.liquid'), 'utf8');
const code = liquid.match(/<script>([\s\S]*?)<\/script>/)[1];

function setup({ action = '/cart/add', withMain = true } = {}) {
  const handlers = [];
  const headerInput = { value: '900' };
  const input = { value: '101' };
  const headerForm = { action, querySelector: () => headerInput };
  let mainForm = withMain ? { action, querySelector: () => input } : null;
  const document = {
    querySelector(selector) {
      if (selector === '#MainContent .hdt-main-product-form') return mainForm;
      if (selector === 'form[action="/cart/add"]') return headerForm;
      throw new Error(`Unexpected selector: ${selector}`);
    },
    addEventListener(name, listener, options) {
      handlers.push({ name, listener, signal: options.signal });
    },
  };
  const variants = [{ id: 101, available: true }, { id: 102, available: false }];
  const window = { REZ_DATA: { current_product: { variants } } };
  const context = vm.createContext({ window, document, AbortController });
  vm.runInContext(code, context);
  const notifications = [];
  const tracker = {};
  const start = () => window.rezSupportTrackVariant(id => notifications.push(id), tracker);
  const dispatch = (name, target, detail) => {
    for (const handler of handlers) {
      if (handler.name === name && !handler.signal.aborted) handler.listener({ target, detail });
    }
  };
  return {
    window, document, input, headerInput, headerForm, notifications, start,
    mainForm: () => mainForm,
    select(id) {
      input.value = String(id);
      dispatch('variant:change', mainForm, { variant: variants.find(variant => variant.id === id) });
    },
    externalSelect(id) { dispatch('variant:change', headerForm, { variant: { id } }); },
    changeMaster(id) { input.value = String(id); dispatch('change', input); },
    invalidEvent() { dispatch('variant:change', mainForm, {}); },
    replaceForm() { mainForm = { action, querySelector: () => input }; },
    rerun() { vm.runInContext(code, context); },
  };
}

test('REZ initial selection uses the main product instead of earlier mega-menu forms', () => {
  const app = setup();
  const oldForm = app.document.querySelector('form[action="/cart/add"]');
  assert.equal(oldForm.querySelector('[name="id"]').value, '900');
  assert.equal(app.window.rezSupportSelectForm(), app.mainForm());
  assert.equal(app.window.rezSupportSelectForm().querySelector('[name="id"]').value, '101');
  app.start();
  assert.deepEqual(app.notifications, [101]);
  assert.equal(app.window.rezSupportBisBtnPosition(), '#MainContent .hdt-product__buy-button');
});

test('available and sold-out selections reach REZ without changing Shopify inputs', () => {
  const app = setup();
  app.start();
  app.select(102);
  assert.equal(app.input.value, '102');
  app.select(101);
  assert.deepEqual(app.notifications, [101, 102, 101]);
  assert.equal(app.input.value, '101');
  assert.equal(app.headerInput.value, '900');
});

test('header, recommendation and invalid variants cannot change the main notification target', () => {
  const app = setup();
  app.start();
  app.externalSelect(102);
  app.externalSelect(900);
  app.changeMaster(900);
  app.invalidEvent();
  assert.deepEqual(app.notifications, [101]);
});

test('localized cart actions and a replaced main form keep native variant tracking', () => {
  const app = setup({ action: '/en/cart/add' });
  app.start();
  app.replaceForm();
  app.select(102);
  app.changeMaster(101);
  assert.deepEqual(app.notifications, [101, 102, 101]);
});

test('duplicate script and tracker initialization do not duplicate variant events', () => {
  const app = setup();
  app.start();
  const hook = app.window.rezSupportTrackVariant;
  app.rerun();
  assert.equal(app.window.rezSupportTrackVariant, hook);
  app.start();
  app.notifications.length = 0;
  app.select(102);
  assert.deepEqual(app.notifications, [102]);
});

test('product-only snippet never substitutes a header form when main product is absent', () => {
  assert.match(liquid, /if request\.page_type == 'product'/);
  const app = setup({ withMain: false });
  assert.equal(app.window.rezSupportSelectForm(), null);
  app.start();
  app.externalSelect(101);
  assert.deepEqual(app.notifications, []);
});
