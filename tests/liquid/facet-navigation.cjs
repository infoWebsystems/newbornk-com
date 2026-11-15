const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { Liquid } = require('liquidjs');
const engine = new Liquid({ root: path.resolve(__dirname, '../../snippets'), extname: '.liquid', jsTruthy: false });
engine.registerTag('doc', {
  parse(token, tokens) { while (tokens.length) if (tokens.shift().name === 'enddoc') return; },
  render() { return ''; }
});
engine.registerFilter('t', key => key);
const link = (handle, count = 1, links = []) => ({ title: handle, handle, type: 'collection_link', url: `/en/collections/${handle}`, object: count === null ? null : { handle, all_products_count: count }, links });
const render = links => engine.renderFile('facets', {
  results: { url: '/en/collections/all', filters: [] },
  section: { id: 'test', settings: { widget_heading: 'Categories', cat_source: '2', cat_link_list: 'test' } },
  linklists: { test: { links } }, routes: {}, settings: {}
}, { globals: { linklists: { test: { links } } } });

test('facets exclude unpublished and empty collection destinations at every depth', async () => {
  const html = await render([
    link('live'), link('missing', null), link('empty', 0),
    link('parent', 2, [link('live-child'), link('missing-child', null), link('empty-child', 0),
      link('nested', 1, [link('live-grandchild'), link('missing-grandchild', null), link('empty-grandchild', 0)])])
  ]);
  for (const handle of ['live', 'live-child', 'live-grandchild']) assert(html.includes(`href="/en/collections/${handle}"`));
  for (const handle of ['missing','empty','missing-child','empty-child','missing-grandchild','empty-grandchild']) assert(!html.includes(`/en/collections/${handle}"`), handle);
});

test('a missing parent keeps reachable children without a broken parent destination', async () => {
  const html = await render([link('missing-parent', null, [link('live-child')]), link('empty-parent', 0, [link('missing-child', null)])]);
  assert(html.includes('missing-parent'));
  assert(html.includes('href="/en/collections/live-child"'));
  assert(!html.includes('data-url="/en/collections/missing-parent"'));
  assert(!html.includes('/en/collections/empty-parent'));
});

test('catalog navigation and filter form keep localized destinations', async () => {
  const html = await render([{ title: 'All', type: 'catalog_link', url: '/en/collections/all', links: [] }]);
  assert(html.includes('href="/en/collections/all"'));
  assert(html.includes('action="/en/collections/all"'));
});
