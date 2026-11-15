const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { Liquid } = require('liquidjs');

const engine = new Liquid({ root: path.resolve(__dirname, '../../snippets'), extname: '.liquid', strictFilters: true });
engine.registerTag('doc', {
  parse(token, tokens) {
    while (tokens.length) if (tokens.shift().name === 'enddoc') return;
    throw new Error('Unclosed LiquidDoc');
  },
  render() { return ''; }
});
engine.registerFilter('image_url', (image, ...args) => {
  const width = args.find(arg => Array.isArray(arg) && arg[0] === 'width')?.[1];
  assert.equal(width, Math.min(image.width, 1200), 'share images are capped without upscaling');
  assert(width > 0);
  return `//cdn.example.test/${image.src}?width=${width}`;
});
engine.registerFilter('money_without_currency', cents => (cents / 100).toFixed(2));
engine.registerFilter('json', value => JSON.stringify(value ?? null));
engine.registerFilter('t', key => key === 'nbk.home.about' ? 'About NEWBORN K' : key);
for (const name of ['schema', 'stylesheet']) engine.registerTag(name, {
  parse(token, tokens) {
    while (tokens.length) if (tokens.shift().name === `end${name}`) return;
    throw new Error(`Unclosed ${name}`);
  },
  render() { return ''; }
});

function context(type = 'collection') {
  return {
    request: { page_type: type, path: `/${type}/example`, origin: 'https://newbornk.com' },
    template: { name: type },
    collection: { handle: 'example', title: 'Collection', products_count: 4, metafields: { custom: {} } },
    shop: { name: 'NEWBORN K', description: 'Shop description' }, settings: {}, images: {},
    canonical_url: `https://newbornk.com/${type}/example`, page_title: 'Title "quoted"', page_description: 'Description & details',
    cart: { currency: { iso_code: 'UAH' } }
  };
}

function metadata(html) {
  const tags = new Map();
  for (const match of html.matchAll(/<meta (?:name|property)="([^"]+)" content="([^"]*)"\s*\/?\s*>/g)) {
    assert(!tags.has(match[1]), `Duplicate metadata ${match[1]}`);
    tags.set(match[1], match[2]);
  }
  return tags;
}
async function robots(ctx) {
  const tags = metadata(await engine.renderFile('meta-robots', ctx));
  assert.equal(tags.size, 1);
  return tags.get('robots').split(',')[0];
}

test('utility pages are noindex while products, collections and paginated blogs stay crawlable', async () => {
  for (const type of ['cart', 'search', '404', 'customers/account', 'customers/login']) {
    assert.equal(await robots(context(type)), 'noindex', type);
  }
  for (const handle of ['size-chart-touchof', 'carhartt-size-guide']) {
    assert.equal(await robots({ ...context('page'), page: { handle } }), 'noindex');
  }
  for (const type of ['product', 'collection', 'article', 'blog']) {
    assert.equal(await robots({ ...context(type), current_page: 2 }), 'index', type);
  }
});

test('pagination supplies an escaped description without duplicating the first-page layout tag', async () => {
  const ctx = { ...context(), current_page: 2 };
  const tags = metadata(await engine.renderFile('social-meta-tags', ctx));
  assert.equal(tags.get('description'), 'general.meta.page 2. Description &amp; details');
  assert.equal(metadata(await engine.renderFile('social-meta-tags', { ...ctx, current_page: 1 })).get('description'), undefined);
  assert.equal(metadata(await engine.renderFile('social-meta-tags', { ...ctx, page_description: '' })).get('description'), undefined);
});

test('collection robots respects typed Shopify booleans and direct legacy booleans without treating false values as true', async () => {
  for (const [field, expected] of [[{ value: true }, 'noindex'], [true, 'noindex'], [{ value: false }, 'index'], [false, 'index'], [undefined, 'index'], ['true', 'index'], ['false', 'index'], [{ value: 'false' }, 'index']]) {
    const ctx = context();
    ctx.collection.metafields.custom.noindex = field;
    assert.equal(await robots(ctx), expected, JSON.stringify(field));
  }
  const ctx = context('product');
  ctx.collection.metafields.custom.noindex = { value: true };
  assert.equal(await robots(ctx), 'index', 'a collection context on a product page does not hide the product');
});

test('existing size chart, empty collection, exact legacy handle and outlet exclusions remain intact', async () => {
  const cases = [
    [{ ...context('page'), page: { template_suffix: 'page' } }, 'noindex'],
    [{ ...context('page'), page: { template_suffix: 'contact' } }, 'index'],
    [{ ...context(), collection: { ...context().collection, products_count: 0 } }, 'noindex'],
    [{ ...context(), collection: { ...context().collection, handle: 'all' } }, 'noindex'],
    [{ ...context(), collection: { ...context().collection, handle: 'all-season' } }, 'index'],
    [{ ...context('page'), request: { page_type: 'page', path: '/pages/outlet' } }, 'noindex'],
    [{ ...context(), request: { page_type: 'collection', path: '/collections/brand-outlet' } }, 'noindex']
  ];
  for (const [ctx, expected] of cases) assert.equal(await robots(ctx), expected, ctx.request.path + ' ' + ctx.collection.handle);
});

test('home shares use one complete HTTPS image set with a safe Shopify page_image fallback', async () => {
  const home = { src: 'Frame_567194.jpg', width: 1200, height: 630 };
  const fallback = { src: 'store-default.jpg', width: 800, height: 800 };
  for (const [images, expected] of [[{ 'Frame_567194.jpg': home }, home], [{}, fallback]]) {
    const tags = metadata(await engine.renderFile('social-meta-tags', { ...context('index'), images, page_image: fallback }));
    assert.equal(tags.get('og:image'), `https://cdn.example.test/${expected.src}?width=${expected.width}`);
    assert.equal(tags.get('og:image:secure_url'), tags.get('og:image'));
    assert.equal(tags.get('og:image:width'), String(expected.width));
    assert.equal(tags.get('og:image:height'), String(expected.height));
  }
  const tags = metadata(await engine.renderFile('social-meta-tags', context('index')));
  assert.equal(tags.get('og:image'), undefined, 'missing images must not generate a broken image URL');
});

test('resource share metadata keeps its own image, canonical, escaped copy and product currency', async () => {
  for (const type of ['collection', 'article', 'product']) {
    const ctx = { ...context(type), images: { 'Frame_567194.jpg': { src: 'home.jpg' } },
      page_image: { src: 'resource.jpg', width: 500, height: 700 },
      product: { title: 'Product', selected_or_first_available_variant: { price: 12345 } },
      article: {}, blog: {} };
    const tags = metadata(await engine.renderFile('social-meta-tags', ctx));
    assert.equal(tags.get('og:image'), 'https://cdn.example.test/resource.jpg?width=500');
    assert.equal(tags.get('og:url'), ctx.canonical_url);
    assert.equal(tags.get('og:title'), 'Title &#34;quoted&#34;');
    assert.equal(tags.get('og:description'), 'Description &amp; details');
    assert.equal(tags.get('og:type'), type === 'collection' ? 'website' : type);
    if (type === 'product') {
      assert.equal(tags.get('og:price:currency'), 'UAH');
      assert.equal(tags.get('og:price:amount'), '123.45');
    }
  }
});

test('rendered site graph declares English alongside existing Ukrainian and Russian languages', async () => {
  const html = await engine.renderFile('jsonld-graph', context('index'));
  const scripts = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  const nodes = JSON.parse(scripts[0][1])['@graph'];
  const site = nodes.find(node => node['@type'] === 'WebSite');
  const organizations = nodes.filter(node => [].concat(node['@type']).includes('Organization'));
  assert.deepEqual(site.inLanguage, ['uk-UA', 'ru-UA', 'en']);
  assert.equal(organizations.length, 1);
  assert(organizations[0].contactPoint[0].availableLanguage.includes('English'));
});

test('supplementary homepage copy keeps content and links without introducing another primary heading', async () => {
  const source = readFileSync(path.resolve(__dirname, '../../sections/nbk-store-intro.liquid'), 'utf8');
  for (const content of ['<h1>Про NEWBORN K</h1><p>Опис <a href="/pages/about-us">магазину</a>.</p>', '<h1 class="intro-title">About NEWBORN K</h1><p>Store description.</p>']) {
    const html = await engine.parseAndRender(source, { section: { settings: { content } } });
    assert.doesNotMatch(html, /<\/?h1\b/i);
    assert.match(html, /<h2(?: class="intro-title")?>/);
    assert.match(html, /<\/h2>/);
    assert.match(html, /<details class="hdt-container nbk-store-intro">/);
    assert(html.includes(content.slice(content.indexOf('<p>'))));
  }
  assert.equal((await engine.parseAndRender(source, { section: { settings: { content: '' } } })).trim(), '');
});


test('server-rendered account links use the Shopify root endpoint and preserve login parameters', async () => {
  for (const file of ['sections/main-register.liquid', 'snippets/hdt_customer_form_sidebar.liquid']) {
    const source = readFileSync(path.resolve(__dirname, '../..', file), 'utf8');
    const expression = source.match(/{{ routes.account_login_url[^}]*}}/)[0];
    for (const prefix of ['', '/en', '/ru', '/uk']) {
      const html = await engine.parseAndRender(expression, { routes: { account_login_url: `https://newbornk.com${prefix}/customer_authentication/redirect?locale=ru&return_to=%2Fru%2Fcollections%2Fnew` } });
      assert.equal(html, 'https://newbornk.com/customer_authentication/redirect?locale=ru&amp;return_to=%2Fru%2Fcollections%2Fnew');
    }
    assert.equal(await engine.parseAndRender(expression, { routes: { account_login_url: '/ru/account/login' } }), '/ru/account/login');
    assert.equal(await engine.parseAndRender(expression, { routes: { account_login_url: 'https://account.newbornk.com/login?locale=en' } }), 'https://account.newbornk.com/login?locale=en');
  }
});

test('large social images use a 1200px rendition with proportional dimensions; small images are not enlarged', async () => {
  for (const [width, height, expectedWidth, expectedHeight] of [[4160, 6240, 1200, 1800], [2560, 3329, 1200, 1560], [3000, 1500, 1200, 600], [800, 600, 800, 600]]) {
    const tags = metadata(await engine.renderFile('social-meta-tags', { ...context('article'), page_image: { src: 'image.png', width, height } }));
    assert.equal(tags.get('og:image'), `https://cdn.example.test/image.png?width=${expectedWidth}`);
    assert.equal(tags.get('og:image:width'), String(expectedWidth));
    assert.equal(tags.get('og:image:height'), String(expectedHeight));
    assert.equal(tags.get('og:image:secure_url'), tags.get('og:image'));
  }
});

test('policy descriptions fill missing terms/privacy metadata, preserve existing copy and match social metadata', async () => {
  for (const [handle, key] of [['terms-of-service', 'terms_description'], ['privacy-policy', 'privacy_description']]) {
    for (const prefix of ['', '/en', '/ru']) {
      const ctx = { ...context('policy'), page_description: undefined, request: { page_type: 'policy', path: `${prefix}/policies/${handle}` } };
      const tags = metadata(await engine.renderFile('social-meta-tags', ctx));
      assert.equal(tags.get('description'), `nbk_seo.${key}`);
      assert.equal(tags.get('og:description'), tags.get('description'));
      assert.equal(tags.get('twitter:description'), tags.get('description'));
      for (const description of ['Existing policy description', '']) {
        const kept = metadata(await engine.renderFile('social-meta-tags', { ...ctx, page_description: description }));
        assert.equal(kept.get('description'), undefined, 'the layout owns an existing description tag');
      }
    }
  }
  const other = { ...context('policy'), page_description: undefined, request: { page_type: 'policy', path: '/policies/refund-policy' } };
  assert.equal(metadata(await engine.renderFile('social-meta-tags', other)).get('description'), undefined);
  for (const locale of ['uk', 'en.default', 'ru']) {
    const translations = JSON.parse(readFileSync(path.resolve(__dirname, `../../locales/${locale}.json`), 'utf8')).nbk_seo;
    for (const value of Object.values(translations)) assert(value.length > 80 && value.length <= 170);
  }
});
