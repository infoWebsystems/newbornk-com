const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { Liquid } = require('liquidjs');
const root = path.resolve(__dirname, '../..');
const engine = new Liquid({ root: ['snippets', 'blocks', 'sections'].map(d => path.join(root, d)), extname: '.liquid', jsTruthy: false });
for (const tag of ['doc', 'schema', 'stylesheet']) engine.registerTag(tag, {
  parse(token, tokens) { while (tokens.length) if (tokens.shift().name === `end${tag}`) return; throw new Error(`Unclosed ${tag}`); },
  render() { return ''; }
});
engine.registerFilter('handleize', value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
engine.registerFilter('url_for_vendor', value => `/collections/vendors?q=${encodeURIComponent(value)}`);
engine.registerFilter('t', key => key);
const render = (file, ctx) => engine.renderFile(file, ctx, { globals: { linklists: ctx.linklists, collections: ctx.collections, settings: ctx.settings } });
const brand = (title, handle, locale = '', count = 1) => ({
  title, type: 'collection_link', url: `${locale}/collections/${handle}`, links: [],
  object: { handle, all_products_count: count, url: `${locale}/collections/${handle}` }
});
function context(locale = '') {
  const links = Array.from({ length: 60 }, (_, i) => brand(`Brand ${i}`, `brand-${i}`, locale));
  links.push(brand('ÉTUDES STUDIO', 'etudes-studio', locale), brand('POST ARCHIVE FACTION', 'post-archive-fachion', locale), brand('Empty', 'empty', locale, 0));
  const parent = brand('Бренди', 'brands', locale, 100);
  parent.links = [brand('Stale', 'stale', locale)];
  return { linklists: { 'brands-menu': { links }, 'top-menu': { links: [parent] } },
    link: parent, section: { id: 'test', settings: { main_menu: { links: [parent] }, lazy_mn: false } },
    block: { settings: { main_menu_mobile: { links: [parent] } } },
    request: { design_mode: true }, settings: {}, collections: {} };
}
function collectionHrefs(html) { return [...html.matchAll(/href="([^"]*\/collections\/[^"?#]+)"/g)].map(m => m[1]); }

test('UA/EN directory, desktop and mobile use the registry past 50 entries, not stale menu children', async () => {
  for (const locale of ['', '/en']) {
    const ctx = context(locale);
    const expected = ctx.linklists['brands-menu'].links.filter(x => x.object.all_products_count).map(x => x.url).sort();
    for (const file of ['nbk-brands-directory', 'sub_menu_blocks', 'nbk-brand-menu-items', '_menu_mobile']) {
      const html = await render(file, ctx);
      const destinations = file === '_menu_mobile' ? [...expected, ctx.link.url].sort() : expected;
      assert.deepEqual(collectionHrefs(html).sort(), destinations, `${locale} ${file}`);
      assert(!html.includes('/collections/stale'));
      assert(!html.includes('/collections/empty'));
      if (file === 'nbk-brands-directory') {
        assert.match(html, /id="NBKLetter-test-e"/);
        assert.match(html, /data-brand-group="E"[\s\S]*etudes-studio/);
      }
    }
  }
});

test('brand parent opens the registry even when the selected navigation has no children', async () => {
  const ctx = context('/en'); ctx.link.links = [];
  const html = await render('main-menu', ctx);
  assert.match(html, /<details/);
  assert.match(html, /collections\/post-archive-fachion/);
  assert.equal((await render('nbk-menu-state', { ...ctx, item: ctx.link })).trim(), '62|1');
});

test('vendor links preserve existing canonical URLs, diacritics, flags and localized paths', async () => {
  for (const locale of ['', '/en']) {
    const ctx = context(locale);
    ctx.linklists['brands-menu'].links.push(brand('RUBAE', 'rubae', locale), brand('Incorrect translation', 'rains', locale), brand('OCIES', 'ochis', locale));
    for (const [vendor, handle] of [['Post Archive Faction', 'post-archive-fachion'], ['ÉTUDES STUDIO', 'etudes-studio'], ['RUBAE 🇺🇦', 'rubae'], ['RAINS', 'rains'], ['OCHIS', 'ochis']]) {
      assert.equal((await render('nbk-brand-url', { ...ctx, vendor })).trim(), `${locale}/collections/${handle}`);
    }
    const html = await render('vendor', { ...ctx, vendor: 'Post Archive Faction' });
    assert.match(html, new RegExp(`href="${locale}/collections/post-archive-fachion"`));
    const pdp = await render('_product-brands', { ...ctx, product: { vendor: 'Post Archive Faction' } });
    assert.match(pdp, new RegExp(`href="${locale}/collections/post-archive-fachion"`));
  }
});

test('unknown vendors retain a working Shopify fallback; unavailable collections are not linked', async () => {
  const ctx = context();
  ctx.linklists['brands-menu'].links.push({ title: 'Unpublished', type: 'collection_link', object: null });
  for (const vendor of ['Unknown & Brand', 'Unpublished']) {
    assert.equal((await render('nbk-brand-url', { ...ctx, vendor })).trim(), `/collections/vendors?q=${encodeURIComponent(vendor)}`);
  }
  assert.equal((await render('nbk-brand-url', { ...ctx, vendor: 'New Brand', collections: { 'new-brand': { url: '/en/collections/new-brand' } } })).trim(), '/en/collections/new-brand');
});
