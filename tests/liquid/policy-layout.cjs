const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { Liquid } = require('liquidjs');

const root = path.resolve(__dirname, '../..');
const layout = readFileSync(path.join(root, 'layout/theme.liquid'), 'utf8');
// Render the real layout with unrelated header, footer and head integrations stubbed.
function engineFor(locale, globals = {}) {
  const engine = new Liquid({ root: [path.join(root, 'snippets'), path.join(root, 'sections')], extname: '.liquid', globals });
  const labels = JSON.parse(readFileSync(path.join(root, 'locales', locale === 'en' ? 'en.default.json' : `${locale}.json`), 'utf8'));
  engine.registerFilter('t', key => key.split('.').reduce((value, part) => value?.[part], labels) ?? key);
  engine.registerTag('doc', { parse(token, tokens) { while (tokens.length) if (tokens.shift().name === 'enddoc') return; }, render() { return ''; } });
  engine.registerTag('schema', { parse(token, tokens) { while (tokens.length) if (tokens.shift().name === 'endschema') return; }, render() { return ''; } });
  for (const tag of ['section', 'sections']) engine.registerTag(tag, { parse() {}, render() { return ''; } });
  return engine;
}
const isolated = layout.replace(/\{%-?\s*render\s+'([^']+)'[^%]*-?%\}/g, (tag, name) => ['nbk-policy-title', 'nbk-page-h1', 'nbk-service-content'].includes(name) ? tag : '')
  .replace("{% section 'nbk-service-page' %}", "{% render 'nbk-service-page' %}")
  .replace(/^\s*render\s+'[^']+'.*$/gm, '');
function context(locale, type = 'policy', handle = 'refund-policy') {
  return { request: { page_type: type, path: `/${locale}/policies/${handle}`, locale: { iso_code: locale } },
    page_title: 'Refund policy', current_page: 1, settings: {}, template: {}, shop: { name: 'NEWBORN K' },
    content_for_layout: '<div class="shopify-policy__container"><div class="shopify-policy__title"><h1>Refund policy</h1></div><div class="shopify-policy__body"><p>Approved terms &amp; <a href="/pages/return">return link</a>.</p></div></div>' };
}
test('policy layout renders a single localized heading and title without altering approved body HTML', async () => {
  for (const [locale, title] of [['uk', 'Повернення та обмін'], ['en', 'Returns and exchanges'], ['ru', 'Возврат и обмен']]) {
    const ctx = context(locale);
    const html = await engineFor(locale, ctx).parseAndRender(isolated, ctx);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert(html.includes(`<h1>${title}</h1>`));
    assert(html.includes(`<title>${title} &ndash; NEWBORN K</title>`));
    assert(html.includes('<p>Approved terms &amp; <a href="/pages/return">return link</a>.</p>'));
    assert(html.includes('nbk-policy.css'));
  }
});
test('shipping label is localized; unknown policy types and unsupported locales keep Shopify titles', async () => {
  for (const [locale, handle, expected] of [['uk', 'shipping-policy', 'Оплата та доставка'], ['en', 'shipping-policy', 'Payment and delivery'], ['uk', 'privacy-policy', 'Refund policy'], ['pl', 'refund-policy', 'Refund policy']]) {
    assert.equal((await engineFor(locale).renderFile('nbk-policy-title', context(locale, 'policy', handle))).trim(), expected);
  }
});
test('ordinary pages retain their original title and content with no policy stylesheet', async () => {
  const ctx = context('uk', 'page');
  const html = await engineFor('uk', ctx).parseAndRender(isolated, ctx);
  assert(html.includes(ctx.content_for_layout));
  assert(html.includes('<title>Refund policy &ndash; NEWBORN K</title>'));
  assert(!html.includes('nbk-policy.css'));
});

test('all five information pages use the same section in both languages without changing body copy', async () => {
  for (const locale of ['uk', 'en']) {
    for (const handle of ['order-and-delivery', 'return', 'faq', 'public-agreement', 'privacy-policy']) {
      const ctx = context(locale, 'page', handle);
      ctx.page = { handle, title: 'Page title', content: '<h2>Approved heading</h2><p>Approved terms.</p>' };
      const html = await engineFor(locale, ctx).parseAndRender(isolated, ctx);
      assert.equal((html.match(/<h1\b/g) || []).length, 1, `${locale}/${handle}`);
      assert(html.includes('class="nbk-service-page"'));
      assert(html.includes(ctx.page.content));
      assert(html.includes('nbk-policy.css'));
      assert(!html.includes(ctx.content_for_layout), 'old page template must not duplicate its heading/body');
    }
  }
});

test('native privacy and offer headings use their translated page titles', async () => {
  const ctx = context('uk');
  ctx.pages = { 'privacy-policy': {title:'Політика конфіденційності'}, 'public-agreement':{title:'Договір публічної оферти'} };
  for (const [handle,title] of [['privacy-policy','Політика конфіденційності'],['legal-notice','Договір публічної оферти'],['terms-of-service','Договір публічної оферти']]) {
    ctx.request.path = `/policies/${handle}`;
    assert.equal((await engineFor('uk',ctx).renderFile('nbk-policy-title',ctx)).trim(),title);
  }
});

test('legacy return layout loses global styles while preserving text, links and semantic sections', async () => {
  const content = '<style>body {font-family:other} .hero {color:red}</style><meta charset="utf-8"><div class="return-page-content" style="padding:90px"><span class="sec-title">Conditions</span><p class="method-title">Postal return</p><p><strong>14 days</strong> after receipt. <a href="mailto:info@newbornk.com" style=\'color:red\'>Contact</a></p></div>';
  const html = await engineFor('uk').renderFile('nbk-service-content',{content,page_body:true,handle:'return'});
  assert(!html.includes('<style') && !html.includes('body {') && !html.includes('<meta') && !html.includes(' style='));
  assert(html.includes('data-nbk-legacy="return-page-content"'));
  assert(html.includes('<h2>Conditions</h2>'));
  assert(html.includes('<h3>Postal return</h3>'));
  assert(html.includes('<strong>14 days</strong> after receipt. <a href="mailto:info@newbornk.com">Contact</a>'));
});

test('legacy privacy spacing and offer headings become semantic without promoting inline emphasis', async () => {
  const content = '<p>Introduction.<br><br><br><strong>Privacy section:</strong><br><br>Approved terms. <strong>+380970443333</strong>, Kyiv.<br><br><br><br></p><p><b>7. Responsibilities</b>:</p><p><b>Emphasis</b> inside prose.</p>';
  const html = await engineFor('en').renderFile('nbk-service-content',{content,page_body:true,handle:'privacy-policy'});
  assert(html.includes('<h2>Privacy section:</h2>'));
  assert(html.includes('<h2>7. Responsibilities:</h2>'));
  assert(html.includes('<p><b>Emphasis</b> inside prose.</p>'));
  assert(html.includes('<strong>+380970443333</strong>, Kyiv.'));
  assert(!html.includes('<br><br>'));
});

test('About keeps one localized page heading while preserving prose and section blocks', async () => {
  for (const [locale, title] of [['uk', 'Про нас'], ['en', 'About us']]) {
    const ctx = context(locale, 'page', 'about-us');
    ctx.page = { handle: 'about-us', title, content: `<h1>${title}</h1><p>Original story.</p>` };
    ctx.section = { settings: {show_page_body:true}, blocks:[{type:'content',settings:{heading:'Founder',body:'<p>Original biography.</p>'}}] };
    const engine = engineFor(locale, ctx);
    engine.registerTag('stylesheet', { parse(token, tokens) { while (tokens.length) if (tokens.shift().name === 'endstylesheet') return; }, render() { return ''; } });
    engine.registerTag('form', { parse(token, tokens) { while (tokens.length) if (tokens.shift().name === 'endform') return; }, render() { return ''; } });
    const html = await engine.renderFile('nbk-kyiv-content',ctx);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.equal((html.match(new RegExp(title, 'g')) || []).length, 1);
    assert(html.includes('nbk-service-page__header'));
    assert(html.includes('<p>Original story.</p>'));
    assert(html.includes('<h2>Founder</h2>'));
    assert(html.includes('<p>Original biography.</p>'));
    const different = await engine.renderFile('nbk-service-content',{content:'<h1>Our story</h1><p>Copy.</p>',handle:'about-us',title,page_body:true});
    assert(different.includes('<h2>Our story</h2>'), 'a distinct body heading must remain');
  }
});
