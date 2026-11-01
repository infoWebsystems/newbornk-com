const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { Liquid } = require('liquidjs');

const engine = new Liquid({ root: path.resolve(__dirname, '../../snippets'), extname: '.liquid' });
for (const name of ['doc', 'stylesheet']) {
  engine.registerTag(name, {
    parse(token, tokens) { while (tokens.length) if (tokens.shift().name === `end${name}`) return; },
    render() { return ''; }
  });
}

test('KeyCRM renders one localized widget and preserves the existing channel fallback', async () => {
  for (const [locale, token] of [
    ['uk', 'bc3f252a-342f-42cb-a3a6-3219b681731b'],
    ['en', 'b3871707-9529-4524-800a-476735d3b8c6'],
    ['ru', 'bc3f252a-342f-42cb-a3a6-3219b681731b'],
    [undefined, 'bc3f252a-342f-42cb-a3a6-3219b681731b']
  ]) {
    const html = await engine.renderFile('nbk-keycrm-chat', {request: {locale: {iso_code: locale}}});
    assert.equal((html.match(/data-widget-token=/g) || []).length, 1);
    assert.equal((html.match(/nbk-floating-widgets\.js/g) || []).length, 1);
    assert.match(html, new RegExp(`data-widget-token="${token}"`));
    assert.match(html, /nbk-keycrm-chat\.js/);
  }
});
