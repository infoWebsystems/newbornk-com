const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const vm = require('node:vm');
const source = readFileSync(join(__dirname, '../assets/cart.js'), 'utf8');
function setup(responses) {
  const definitions = {}, requests = [], writes = [];
  const classes = () => ({ add() {}, remove() {}, toggle() {} });
  const inputs = [{value:'3',defaultValue:'2'}, {value:'3',defaultValue:'2'}];
  const nodes = {};
  for (const id of ['main-cart-items','cart-icon-bubble','cart-live-region-text','main-cart-footer','cart-errors']) {
    nodes[id] = { dataset:{id}, classList:classes(), parentNode:{classList:classes()},
      querySelector:()=>null, setAttribute() {}, textContent:'',
      set innerHTML(value) { writes.push({id,value}); }, get innerHTML() { return ''; } };
  }
  const context = {HTMLElement:class {},customElements:{define:(n,c)=>definitions[n]=c},
    document:{getElementById:id=>nodes[id],activeElement:{blur(){}}},
    window:{location:{pathname:'/uk/cart'},cartStrings:{error:'Спробуйте ще раз',quantityError:'Доступно лише [quantity]'}},
    routes:{cart_change_url:'/uk/cart/change'},fetchConfig:()=>({method:'POST'}),
    DOMParser:class {parseFromString(html) {return {querySelector:()=>typeof html==='string'?{innerHTML:html}:null};}},
    setTimeout:()=>0,
    fetch:async(url,opts)=>{requests.push({url,opts});const next=responses.shift();if(next instanceof Error)throw next;return next;}};
  vm.runInNewContext(source,context);
  const cart = Object.create(definitions['cart-items'].prototype);
  cart.classList=classes();cart.lineItemStatusElement={setAttribute(){}};
  cart.querySelectorAll=selector=>selector==='[name="updates[]"]'?inputs:[{classList:classes()}];
  cart.querySelector=()=>inputs[0];
  return {cart,requests,nodes,inputs,writes};
}
const sections = label => Object.fromEntries(['main-cart-items','cart-icon-bubble','cart-live-region-text','main-cart-footer'].map(id=>[id,`${label}:${id}`]));
const reply=(data,ok=true)=>({ok,json:async()=>data});
test('422 availability restores fresh server sections and exposes exact cause as text',async()=>{
  const message='Only 2 items were added due to availability. <b>plain text</b>';
  const app=setup([reply({status:422,description:message},false),reply(sections('server-one'))]);
  await app.cart.updateQuantity(1,3);
  assert.equal(app.requests.length,2);assert.equal(app.requests[0].url,'/uk/cart/change');
  assert.ok(app.requests[1].url.startsWith('/uk/cart?sections='));
  assert.ok(app.writes.every(w=>w.value.startsWith('server-one:')));
  assert.equal(app.nodes['cart-errors'].textContent,message);assert.equal(app.cart.updating,false);
});
test('lost mutation response reconciles server state without issuing another mutation',async()=>{
  const app=setup([new Error('network'),reply(sections('accepted-three'))]);
  await app.cart.updateQuantity(1,3);
  assert.equal(app.requests.filter(r=>r.opts.method==='POST').length,1);
  assert.equal(app.writes.length,4);assert.equal(app.nodes['cart-errors'].textContent,'Спробуйте ще раз');
});
test('failed recovery resets both desktop/mobile inputs and releases the cart',async()=>{
  const app=setup([new Error('offline'),new Error('offline')]);
  await app.cart.updateQuantity(1,3);
  assert.deepEqual(app.inputs.map(i=>i.value),['2','2']);assert.equal(app.cart.updating,false);
  assert.equal(app.nodes['cart-errors'].textContent,'Спробуйте ще раз');
});
test('successful retry clears stale errors and renders accepted totals',async()=>{
  const app=setup([reply({status:422,message:'Limit'},false),reply(sections('two')),
    reply({item_count:1,items:[{quantity:1}],sections:sections('one')})]);
  await app.cart.updateQuantity(1,3);await app.cart.updateQuantity(1,1);
  assert.equal(app.nodes['cart-errors'].textContent,'');assert.equal(app.writes.at(-1).value,'one:main-cart-footer');
});
test('null bundled section never causes a partially rendered cart before recovery',async()=>{
  const broken=sections('broken');broken['main-cart-footer']=null;
  const app=setup([reply({item_count:1,items:[{quantity:1}],sections:broken}),reply(sections('recovered'))]);
  await app.cart.updateQuantity(1,1);
  assert.equal(app.writes.length,4);assert.ok(app.writes.every(w=>w.value.startsWith('recovered:')));
});
test('200 quantity adjustment gives limit feedback; removal does not report a false limit',async()=>{
  const app=setup([reply({item_count:2,items:[{quantity:2}],sections:sections('two')}),
    reply({item_count:0,items:[],sections:sections('empty')})]);
  await app.cart.updateQuantity(1,3);assert.equal(app.nodes['cart-errors'].textContent,'Доступно лише 2');
  await app.cart.updateQuantity(1,0);assert.equal(app.nodes['cart-errors'].textContent,'');
});

test('known Shopify availability response uses the storefront quantity translation',async()=>{
  const app=setup([reply({status:422,description:'Only 2 items were added to your cart due to availability.'},false),reply(sections('two'))]);
  await app.cart.updateQuantity(1,3);
  assert.equal(app.nodes['cart-errors'].textContent,'Доступно лише 2');
});
