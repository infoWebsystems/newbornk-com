const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const code = readFileSync(join(__dirname, '../assets/nbk-yespo-signup.js'), 'utf8');

function setup(sdk) {
  let Element;
  const timers = new Map();
  let id = 0;
  const window = { eS: sdk };
  const button = {
    disabled: true,
    addEventListener(_, fn) { this.click = fn; },
    removeEventListener() { this.click = null; },
  };
  const message = { hidden: true };
  class HTMLElement {
    isConnected = true;
    dataset = { formVariantId: 'f35732v35732' };
    querySelector(selector) { return selector === 'button' ? button : message; }
  }
  vm.runInNewContext(code, {
    window, HTMLElement,
    customElements: { get: () => Element, define: (_, cls) => { Element = cls; } },
    setTimeout: fn => { timers.set(++id, fn); return id; },
    clearTimeout: id => timers.delete(id),
  });
  const element = new Element();
  element.connectedCallback();
  return { button, message, window, element, timers, flush() {
    for (const [id, fn] of [...timers]) { timers.delete(id); fn(); }
  } };
}

test('opens the production Yespo form without collecting or posting email through Shopify', () => {
  const calls = [];
  const app = setup((...args) => calls.push(args));
  app.button.click();
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'showForm');
  assert.equal(calls[0][1].formVariantId, 'f35732v35732');
  assert.equal(app.button.disabled, false);
  const liquid = readFileSync(join(__dirname, '../blocks/_nbk-newsletter.liquid'), 'utf8');
  assert.doesNotMatch(liquid, /form 'customer'|contact\[email\]|posted_successfully/);
});

test('waits for the existing app embed to load and opens only once', () => {
  const app = setup();
  app.button.click();
  assert.equal(app.button.disabled, true);
  const calls = [];
  app.window.eS = (...args) => calls.push(args);
  app.flush();
  assert.equal(calls.length, 1);
  assert.equal(app.timers.size, 0);
});

test('blocked or failed SDK shows an error and permits retry without a fake subscription success', () => {
  const app = setup();
  app.button.click();
  for (let i = 0; i < 20; i++) app.flush();
  assert.equal(app.message.hidden, false);
  assert.equal(app.button.disabled, false);
  app.window.eS = () => { throw new Error('blocked'); };
  app.button.click();
  assert.equal(app.message.hidden, false);
  app.window.eS = () => {};
  app.button.click();
  assert.equal(app.message.hidden, true);
});

test('removing a theme-editor block cancels pending opening and removes its listener', () => {
  const app = setup();
  app.button.click();
  app.element.isConnected = false;
  app.element.disconnectedCallback();
  assert.equal(app.timers.size, 0);
  assert.equal(app.button.click, null);
});
