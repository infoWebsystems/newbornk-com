const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../assets/nbk-keycrm-chat.js'), 'utf8');

test('chat waits until 30 seconds, loads once, and keeps the localized token', () => {
  let now = 2000;
  const events = {};
  const timers = [];
  const scripts = [];
  const renders = [];
  const window = {
    addEventListener: (event, callback) => { events[event] = callback; },
    setTimeout: (callback, delay) => { timers.push({ callback, delay }); }
  };
  const context = vm.createContext({ window, performance: { now: () => now }, document: {
    currentScript: { dataset: { widgetToken: 'localized-token' } },
    readyState: 'loading',
    querySelector: () => null,
    createElement: () => ({ addEventListener(event, callback) { this[event] = callback; } }),
    head: { appendChild: (script) => scripts.push(script) }
  } });
  vm.runInContext(source, context);
  vm.runInContext(source, context);
  assert.equal(timers.length, 0);
  assert.equal(scripts.length, 0);
  now = 5000;
  events.load();
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay, 25000);
  assert.equal(scripts.length, 0);
  now = 30000;
  timers[0].callback();
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].async, true);
  window.KeyCRM = { render: (options) => {
    assert.equal(options.popUpInitialMessage, false);
    renders.push(options.token);
  } };
  scripts[0].load();
  assert.deepEqual(renders, ['localized-token']);
});

test('an already loaded page does not wait another 30 seconds', () => {
  let delay;
  vm.runInNewContext(source, {
    document: { currentScript: { dataset: { widgetToken: 'token' } }, readyState: 'complete' },
    performance: { now: () => 35000 },
    window: { setTimeout: (_callback, ms) => { delay = ms; } }
  });
  assert.equal(delay, 0);
});
