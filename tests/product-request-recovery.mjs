import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
const source = readFileSync(new URL('../assets/global.min.js', import.meta.url), 'utf8');
const start = source.indexOf('async function fetchProductResource(');
const end = source.indexOf('function visibilitychangeFn', start);
assert(start > 0 && end > start);
const code = source.slice(start, end) + ';({ getJSONProduct, getOptionsProduct })';
const response = (body, status = 200) => ({ ok: status === 200, status, json: async () => body, text: async () => body });
function fixture(fetch) {
  const Shopify = { routes: { root: '/en/' } };
  return { ...vm.runInNewContext(code, { fetch, Shopify }), Shopify };
}
test('one transient failure retries and simultaneous consumers share the result', async () => {
  let calls = 0;
  const { getJSONProduct } = fixture(async () => ++calls === 1 ? response(null, 503) : response({ variants: [{ id: 42 }] }));
  const first = getJSONProduct.load('shoe');
  assert.equal(first, getJSONProduct.load('shoe'));
  assert.equal((await first).variants[0].id, 42);
  assert.equal(calls, 2);
  await getJSONProduct.load('shoe');
  assert.equal(calls, 2);
});
test('exhausted network failures evict the cache so a later choice can recover', async () => {
  let calls = 0;
  const { getJSONProduct, getOptionsProduct } = fixture(async () => {
    if (++calls <= 2) throw Error('offline');
    return response({ variants: [{ id: 46 }] });
  });
  await assert.rejects(getJSONProduct.load('shoe'), /offline/);
  assert.equal((await getJSONProduct.load('shoe')).variants[0].id, 46);
  const failure = fixture(async () => ++calls < 6 ? response(null, 503) : response('<picker>46</picker>'));
  await assert.rejects(failure.getOptionsProduct.load('shoe', ['1'], 'main'), /503/);
  assert.equal(await failure.getOptionsProduct.load('shoe', ['1'], 'main'), '<picker>46</picker>');
});
test('404 is not retried; handle, locale, option boundaries and page count do not collide', async () => {
  const urls = [];
  const { getJSONProduct, getOptionsProduct, Shopify } = fixture(async url => { urls.push(url); return url.includes('missing') ? response(null, 404) : response({ variants: [{ id: urls.length }] }); });
  await assert.rejects(getJSONProduct.load('missing'), /404/);
  assert.equal(urls.length, 1);
  await getOptionsProduct.load('shoe-a', ['1','23'], 'main');
  await getOptionsProduct.load('shoe-a', ['12','3'], 'main');
  await getOptionsProduct.load('shoe-b', ['1','23'], 'main');
  Shopify.routes.root = '/';
  await getOptionsProduct.load('shoe-a', ['1','23'], 'main');
  const product = await getJSONProduct.load('shoe', 2);
  assert.equal(product.variants.length, 2);
  assert.equal(urls.length, 7);
});
test('failed picker request restores the confirmed variant and allows a later retry', async () => {
  const a = source.indexOf('on_value_change_fn=async function(event)');
  const b = source.indexOf(',_master_input_change=new WeakSet', a);
  assert(a > 0 && b > a);
  const classes = new Set();
  const button = { disabled: false };
  const previous = { id: 42 };
  const picker = {
    currentVariant: previous, options: ['42'], dataset: { size: '1' },
    classList: { add: x=>classes.add(x), remove:x=>classes.delete(x), contains:x=>classes.has(x) },
    masterInput: { form: { querySelectorAll:()=>[button] }, dispatchEvent:()=>{ picker.restored = picker.currentVariant.id; } },
    querySelector: ()=>null, append: message=>{ picker.message = message; },
    setAttribute(){}, removeAttribute(){},
    async updateOptions() { assert.equal(button.disabled,true); throw Error('offline'); }
  };
  const context = { CustomEvent: class { constructor(type, values) {Object.assign(this,{type},values);} },
    document: { createElement:()=>({setAttribute(){}}) }, themeHDN:{extras:{variantError:'Please try again'}}, console:{error(){}} };
  const handler = vm.runInNewContext('(' + source.slice(a+'on_value_change_fn='.length,b) + ')',context);
  const event = { target: { hasAttribute:()=>true, closest:()=>({dataset:{index:'0'}}), value:'46' } };
  await handler.call(picker,event);
  assert.equal(picker.currentVariant,previous);
  assert.equal(picker.restored,42);
  assert.equal(picker.message.textContent,'Please try again');
  assert.equal(classes.has('loading'),false);
  assert.equal(button.disabled,false);
  picker.updateOptions = async function() { this.options=['46']; this.currentVariant={id:46}; };
  picker.selectVariant = function() { this.submitted=this.currentVariant.id; };
  await handler.call(picker,event);
  assert.equal(picker.submitted,46);
  assert.equal(button.disabled,false);
});
