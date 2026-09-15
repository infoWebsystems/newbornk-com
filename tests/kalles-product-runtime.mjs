import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const section = readFileSync(new URL('sections/main-product.liquid', root), 'utf8');
const globalSource = readFileSync(new URL('assets/global.min.js', root), 'utf8');
const libsSource = readFileSync(new URL('assets/libs.min.js', root), 'utf8');
const inputMarkup = section.match(/<input[^>]*name="id"[^>]*>/)[0];
assert.equal((section.match(/ tag-select/g) || []).length, 1);
assert.match(inputMarkup, /type="hidden"/);
assert.match(inputMarkup, /tag-select/);
assert.match(inputMarkup, /value="\{\{ selected_variant\.id \}\}"/, 'Hidden input uses the section’s selected variant');

class CustomEvent extends Event {
  constructor(type, options = {}) { super(type, options); this.detail = options.detail; }
}
class HTMLElement extends EventTarget {
  getAttribute(name) { return this.attributes?.[name] ?? null; }
  hasAttribute(name) { return Object.hasOwn(this.attributes ?? {}, name); }
}
const slice = (source, first, last) => {
  const start = source.indexOf(first);
  const end = source.indexOf(last, start);
  assert(start >= 0 && end > start, `Runtime boundaries changed for ${first}; update the harness before trusting it.`);
  return source.slice(start, end);
};
const helpers = slice(globalSource, 'var getterAdd=', ',_thu=') + ';';
const base = slice(globalSource, 'class VariantChangeBase', 'class Price extends');
const sticky = slice(globalSource, 'var _form_atc_visible', 'class CopyButton');

function stickyFixture(withInput) {
  const mainForm = new EventTarget();
  const stickyForm = new EventTarget();
  const input = new EventTarget();
  input.value = '101';
  const addButton = { disabled: false, firstElementChild: { textContent: '' } };
  const updates = [];
  stickyForm.addEventListener('variant:change', event => updates.push(event.detail.variant.id));
  const sandbox = {
    HTMLElement, EventTarget, CustomEvent,
    IntersectionObserver: class { observe() {} },
    document: { forms: { main: mainForm }, querySelector: () => null },
    $4: selector => selector === '[tag-select]' ? (withInput ? input : null)
      : selector === 'wrapp-hdt-pr-frm > form' ? stickyForm
      : selector === '[name="add"]' ? addButton : null,
    themeHDN: { extras: { addToCart: 'Add to cart', soldOut: 'Sold out' } },
    variantChange: 'variant:change'
  };
  const StickyATC = vm.runInNewContext(helpers + base + sticky + ';StickyATC', sandbox);
  const component = new StickyATC();
  component.attributes = { form: 'main' };
  return { component, mainForm, input, addButton, updates };
}

assert.throws(() => stickyFixture(false).component.connectedCallback(), /value/);
const stickyTest = stickyFixture(true);
assert.doesNotThrow(() => stickyTest.component.connectedCallback());
for (const [id, available] of [[202, true], [303, false], [101, true]]) {
  stickyTest.mainForm.dispatchEvent(new CustomEvent('variant:change', {
    detail: { variant: { id, available, variant_state: { pre_order: false } } }
  }));
  assert.equal(String(stickyTest.input.value), String(id), 'Submitted hidden ID follows main picker');
  assert.equal(stickyTest.addButton.disabled, !available);
}
assert.deepEqual(stickyTest.updates, [202, 303, 101]);
stickyTest.component.disconnectedCallback();
stickyTest.mainForm.dispatchEvent(new CustomEvent('variant:change', {
  detail: { variant: { id: 404, available: true, variant_state: {} } }
}));
assert.equal(stickyTest.updates.length, 3, 'Disconnect removes variant listener');

const classNamesCode = slice(libsSource, 'function removeClass(', 'function AutoHeight(');
const makeNode = () => {
  const classes = new Set();
  return { classes, classList: {
    contains: name => classes.has(name), add: name => classes.add(name), remove: name => classes.delete(name)
  } };
};
function carouselFixture(code, registry, nodes = []) {
  const rootNode = makeNode();
  const handlers = new Map();
  const engine = { slideRegistry: registry, options: { watchDrag: true } };
  let selected = 0;
  const api = {
    internalEngine: () => engine,
    selectedScrollSnap: () => selected,
    containerNode: () => ({ querySelectorAll: selector => nodes.filter(node => node.classes.has(selector.slice(1))) }),
    rootNode: () => rootNode,
    slideNodes: () => nodes,
    slidesInView: () => [],
    on: (name, callback) => handlers.set(name, callback),
    off: name => handlers.delete(name)
  };
  const ClassNames = vm.runInNewContext(code + ';ClassNames', { defaultOptions: {} });
  const plugin = ClassNames({ snapped: 'is-snapped', draggable: 'is-draggable' });
  return {
    init: () => plugin.init(api, { mergeOptions: (...args) => Object.assign({}, ...args), optionsAtMedia: value => value }),
    select: value => { selected = value; handlers.get('select')(); },
    engine, plugin, nodes
  };
}
assert.throws(() => carouselFixture(classNamesCode.replace('e[n.selectedScrollSnap()]||[]', 'e[n.selectedScrollSnap()]'), []).init(), /forEach/);
const empty = carouselFixture(classNamesCode, []);
assert.doesNotThrow(() => empty.init());
assert.doesNotThrow(() => empty.select(0));
assert.doesNotThrow(() => empty.plugin.destroy());
const nodes = [makeNode(), makeNode(), makeNode()];
const carousel = carouselFixture(classNamesCode, [[0, 1], [2]], nodes);
carousel.init();
assert.deepEqual(nodes.map(node => node.classes.has('is-snapped')), [true, true, false]);
carousel.select(1);
assert.deepEqual(nodes.map(node => node.classes.has('is-snapped')), [false, false, true]);
carousel.engine.slideRegistry = [];
carousel.select(0);
assert.deepEqual(nodes.map(node => node.classes.has('is-snapped')), [false, false, false], 'Empty registry clears stale classes');
carousel.plugin.destroy();
console.log('PASS: sticky ATC initializes and follows three main-picker variant changes; missing input reproduces old crash.');
console.log('PASS: empty ClassNames initialization/select/destroy, normal multi-slide selection, and stale-class cleanup; old source reproduces empty-carousel crash.');
