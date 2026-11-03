import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../assets/nbk-facet-stock.js', import.meta.url), 'utf8');
const { normalizeSizeAvailability, hasSizeFilter } = await import(`data:text/javascript,${encodeURIComponent(source)}`);
const url = query => new URL(`https://newbornk.com/en/collections/all?${query}`);

test('clothing sizes require stock on the matching variant and retain OR choices and other filters', () => {
  const input = url('filter.v.option.size=L&filter.v.option.size=XL&filter.p.vendor=PLEASURES&sort_by=price-ascending&section_id=main');
  const result = normalizeSizeAvailability(input);
  assert.equal(result.searchParams.get('filter.v.availability'), '1');
  assert.deepEqual(result.searchParams.getAll('filter.v.option.size'), ['L', 'XL']);
  for (const key of ['filter.p.vendor', 'sort_by', 'section_id']) assert.equal(result.searchParams.get(key), input.searchParams.get(key));
  assert.equal(result.pathname, input.pathname);
  assert.equal(input.searchParams.has('filter.v.availability'), false);
});

test('EU sizes and legacy composite sizes receive the same native stock constraint', () => {
  for (const query of ['filter.v.m.custom.footwear_size_eu_available=42+2%2F3', 'filter.v.option.size=US%3A+9%2FEU%3A+42']) {
    assert.equal(normalizeSizeAvailability(url(query)).searchParams.get('filter.v.availability'), '1');
  }
});

test('conflicting or duplicate availability values cannot restore sold-out size variants', () => {
  const result = normalizeSizeAvailability(url('filter.v.option.size=L&filter.v.availability=0&filter.v.availability=1'));
  assert.deepEqual(result.searchParams.getAll('filter.v.availability'), ['1']);
  assert.equal(normalizeSizeAvailability(result).href, result.href);
});

test('removing the final size also removes the automatic stock constraint', () => {
  const previous = url('filter.v.option.size=L&filter.v.availability=1');
  const result = normalizeSizeAvailability(url('filter.p.vendor=PLEASURES&filter.v.availability=1'), previous);
  assert.equal(result.searchParams.has('filter.v.availability'), false);
  assert.equal(result.searchParams.get('filter.p.vendor'), 'PLEASURES');
  const clearAll = normalizeSizeAvailability(url(''), previous);
  assert.equal(clearAll.search, '');
});

test('removing only one size, switching between clothing and footwear, and changing sort retain stock', () => {
  const previous = url('filter.v.option.size=L&filter.v.option.size=XL&filter.v.availability=1');
  for (const query of ['filter.v.option.size=XL', 'filter.v.m.custom.footwear_size_eu_available=42', 'filter.v.option.size=L&sort_by=price-descending']) {
    assert.equal(normalizeSizeAvailability(url(query), previous).searchParams.get('filter.v.availability'), '1');
  }
});

test('ordinary browsing and explicit stock filters remain unchanged without a size selection', () => {
  for (const query of ['', 'filter.v.availability=1', 'filter.v.availability=0', 'q=shirt&filter.p.vendor=PLEASURES', 'filter.v.option.size=']) {
    const input = url(query);
    assert.equal(hasSizeFilter(input), false);
    assert.equal(normalizeSizeAvailability(input).href, input.href);
  }
});

test('pagination and history restoration preserve exact query state while enforcing selected size stock', () => {
  const paged = url('filter.v.option.size=L&filter.v.availability=1&page=2&q=coat&options%5Bprefix%5D=last');
  assert.equal(normalizeSizeAvailability(paged).href, paged.href);
  const restoreStockOnly = url('filter.v.availability=1');
  assert.equal(normalizeSizeAvailability(restoreStockOnly).href, restoreStockOnly.href);
});


test('old paginated size links restart at page one when the stock constraint is newly applied', () => {
  const result = normalizeSizeAvailability(url('filter.v.option.size=L&page=3'));
  assert.equal(result.searchParams.has('page'), false);
  assert.equal(result.searchParams.get('filter.v.availability'), '1');
});
