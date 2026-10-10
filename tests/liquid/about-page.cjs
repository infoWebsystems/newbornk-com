const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { Liquid } = require('liquidjs');
const root = path.resolve(__dirname, '../..');
const template = JSON.parse(readFileSync(path.join(root, 'templates/page.about.json'), 'utf8'));
const source = readFileSync(path.join(root, 'sections/nbk-about.liquid'), 'utf8');

function renderer(locale) {
  const labels = JSON.parse(readFileSync(path.join(root, 'locales', locale === 'en' ? 'en.default.json' : `${locale}.json`), 'utf8'));
  const engine = new Liquid();
  for (const name of ['schema', 'stylesheet']) engine.registerTag(name, { parse(token, tokens) { while (tokens.length) if (tokens.shift().name === `end${name}`) return; }, render() { return ''; } });
  engine.registerFilter('t', key => { const label = key.split('.').reduce((object, field) => object?.[field], labels); assert.equal(typeof label, 'string', key); return label; });
  engine.registerFilter('asset_url', value => `/assets/${value}`);
  engine.registerFilter('image_url', image => image);
  engine.registerFilter('image_tag', (url, ...args) => `<img src="${url}" alt="${args.find(([name]) => name === 'alt')?.[1] || ''}">`);
  return {engine, labels};
}

test('Warsaw About structure uses Kyiv photos and one localized copy of the story and each founder', async () => {
  assert.equal(template.sections.main.type, 'nbk-about');
  assert.deepEqual(template.sections.main.block_order, ['anton', 'dmytro']);
  for (const [locale, title] of [['uk', 'Про нас'], ['en', 'About us'], ['ru', 'О нас']]) {
    const {engine, labels} = renderer(locale);
    const section = {...template.sections.main, id:'about', blocks:template.sections.main.block_order.map(key=>({...template.sections.main.blocks[key],shopify_attributes:`data-founder="${key}"`}))};
    const html = await engine.parseAndRender(source, {section, page:{title}, shop:{name:'NEWBORN K'}});
    assert.equal((html.match(/<h1\b/g)||[]).length,1);
    assert.equal(html.split(labels.nbk_about.intro).length-1,1);
    assert.equal(html.split(labels.nbk_about.anton_bio).length-1,1);
    assert.equal(html.split(labels.nbk_about.dmytro_bio).length-1,1);
    assert(html.includes('newbornk-store-interior-wide.webp'));
    assert(html.includes('photo_me.webp'));
    assert(html.includes('254827446_288865236453523_8434811695550782982_n.jpg'));
    assert(html.includes(labels.nbk_contact.address));
    assert(html.includes('data-founder="anton"'));
    if (locale === 'en') assert(!/[А-Яа-яІіЇїЄє]/u.test(html), 'EN cannot retain Ukrainian legacy block copy');
  }
});

test('About stays readable when an optional photo or founder list is empty', async () => {
  const {engine, labels} = renderer('en');
  const html = await engine.parseAndRender(source, {section:{id:'empty', settings:{image:null,map_url:'https://maps.app.goo.gl/VtaNBz5cXNtQKzAF6'},blocks:[]},page:{title:'About us'},shop:{name:'NEWBORN K'}});
  assert(html.includes('nbk-about__story--text'));
  assert(html.includes(labels.nbk_about.intro));
  assert(!html.includes('nbk-about__founders"'));
  assert(!html.includes('src=""'));
});
