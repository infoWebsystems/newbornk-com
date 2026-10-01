const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { Liquid } = require('liquidjs');

const root = path.resolve(__dirname, '../..');
function createEngine(translate) {
  const renderer = new Liquid({
    root: [path.join(root, 'snippets'), path.join(root, 'blocks')],
    extname: '.liquid', strictFilters: true, jsTruthy: false
  });
  for (const tag of ['schema', 'stylesheet']) {
    renderer.registerTag(tag, {
      parse(token, tokens) {
        while (tokens.length) if (tokens.shift().name === `end${tag}`) return;
        throw new Error(`Unclosed ${tag}`);
      },
      render() { return ''; }
    });
  }
  renderer.registerFilter('t', translate);
  // These Shopify-only filters occur in unrelated branches of the real picker.
  for (const name of ['handle', 'image_url', 'image_tag', 'money', 'item_count_for_variant']) {
    renderer.registerFilter(name, value => value);
  }
  return renderer;
}
const engine = createEngine(key => ({
  'products.theme_settings.size': 'Size,Розмір',
  'products.theme_settings.color': 'Color,Колір',
  'nbk_footwear.size_label': 'Розмір (EU)',
  'products.product.choose_an_option': 'Оберіть розмір'
})[key] || key);

const renderSize = (raw_size, extra = {}) => engine.renderFile('nbk-footwear-size', { raw_size, ...extra });
function optionValue(text, id, available = true) {
  const value = new String(text);
  value.id = id;
  value.available = available;
  value.variant = { id: id + 1000, available, option1: value, options: [value] };
  return value;
}
function context(values, footwear = true) {
  const option = { name: 'Size', position: 1, values, selected_value: values[0] };
  values[0].selected = true;
  const variant = values[0].variant;
  return {
    product: { tags: footwear ? ['Взуття'] : ['Одяг'], handle: 'shoe', id: 1,
      options_with_values: [option], variants: values.map(v => v.variant),
      selected_variant: variant, selected_or_first_available_variant: variant, available: true },
    option, option_type: 'size', product_form_id: 'product-form-test',
    block: { settings: { picker_type: 'block', color_picker_type: 'color' } },
    section: { id: 'test', settings: {} },
    settings: { size_mode: 'size', size_type: 'only', size_maximum: 4,
      enable_size_limit: true, size_action: 'all', hide_sold_out: false },
    selected_value: values[0], un_no_pick: true
  };
}
function buttonLabels(html) {
  return [...html.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/g)]
    .map(m => m[1].replace(/<span class="sr-only">.*?<\/span>/g, '').replace(/<[^>]+>/g, '').trim());
}

test('literal EU extraction preserves thirds, halves, decimal commas and brands with no CM', async () => {
  for (const [raw, eu] of [
    ['US: 8.5/ EU: 42/ CM: 26.5', '42'],
    ['US: 8/ EU: 41 1/3: CM: 26', '41 1/3'],
    ['US:10.5/ EU: 44 2/3/ СМ: 28.5', '44 2/3'],
    ['Euro: 37 • US: 5,5 • См: 24,1', '37'],
    ['Euro: 41 • US:7.5 • См: 27.1', '41'],
    ['US: 9.5/ EU: 42.5', '42.5'],
    ['EU: 42,5 / US: 9.5', '42.5'],
    ['EU: 42⅔ / CM: 27', '42 2/3']
  ]) assert.equal(await renderSize(raw), eu, raw);
  for (const raw of ['US: 9/ CM: 27', 'EU: unknown', 'EU: 42 wide', 'S', 'EU: 42 3/7']) {
    assert.equal(await renderSize(raw), '', 'No guessed conversion for ' + raw);
  }
});

test('literal EU guards against stale metadata while metadata can supply a missing EU', async () => {
  const variant = { metafields: { custom: { footwear_size_eu: { value: '43' } } } };
  assert.equal(await renderSize('US: 9/ EU: 42/ CM: 27', { variant }), '42');
  assert.equal(await renderSize('US: 9', { variant }), '43');
});

test('sorting is numeric with halves between thirds; raw form values, IDs and selected size survive', async () => {
  const values = [
    optionValue('US: 9/ EU: 42 2/3/ CM: 27', 10),
    optionValue('US: 8.5/ EU: 42/ CM: 26.5', 11),
    optionValue('US: 9/ EU: 42.5/ CM: 27', 12, false),
    optionValue('US: 8/ EU: 42 1/3/ CM: 26', 13)
  ];
  const html = await engine.renderFile('product-variant-options', context(values));
  assert.deepEqual(buttonLabels(html), ['42', '42 1/3', '42.5', '42 2/3']);
  for (const value of values) {
    assert(html.includes(`value="${value}"`));
    assert(html.includes(`data-value-id="${value.id}"`));
  }
  assert.match(html, /value="US: 9\/ EU: 42 2\/3\/ CM: 27"[^>]+ checked[^>]+data-value-id="10"/);
  assert.match(html, /value="US: 9\/ EU: 42.5\/ CM: 27"[^>]+class="sr-only is-disabled"/);
});

test('unrecognized sizes remain visible after known EU sizes and clothing order is unchanged', async () => {
  const values = [optionValue('Unknown fit', 1), optionValue('EU: 42', 2), optionValue('EU: 40', 3)];
  assert.deepEqual(buttonLabels(await engine.renderFile('product-variant-options', context(values))), ['40', '42', 'Unknown fit']);
  const clothing = [optionValue('XL', 4), optionValue('S', 5), optionValue('M', 6)];
  assert.deepEqual(buttonLabels(await engine.renderFile('product-variant-options', context(clothing, false))), ['XL', 'S', 'M']);
});

test('card sizes show available EU sizes in numeric order with the original variant IDs', async () => {
  const values = [optionValue('EU: 44/ US: 10', 1), optionValue('EU: 42/ US: 8.5', 2, false), optionValue('EU: 43/ US: 9', 3)];
  const html = await engine.renderFile('size-list', context(values));
  const labels = [...html.matchAll(/<span class="hdt-swatch-title">(.*?)<\/span>/g)].map(m => m[1]);
  assert.deepEqual(labels, ['43', '44']);
  assert(html.includes('data-vrid="1003"'));
  assert(html.includes('data-value-id="3"'));
  assert(html.includes('class="hdt-variant-label">EU:</span>'));
});

test('picker keeps one native update-value reference under compact EU buttons, including dropdown configuration', async () => {
  for (const picker_type of ['block', 'dropdown', 'radio_full']) {
    const ctx = context([optionValue('US: 9/ EU: 42/ CM: 27', 1), optionValue('US: 10/ EU: 43/ CM: 28', 2)]);
    ctx.block.settings.picker_type = picker_type;
    const html = await engine.renderFile('_product-variant-picker', ctx);
    assert(html.includes('Розмір (EU)'));
    assert(html.includes('nbk-footwear-sizes'));
    assert(html.includes('type="block" data-index="0"'));
    assert.equal((html.match(/update-value/g) || []).length, 1);
    assert.match(html, /<p class="nbk-footwear-sizes__reference"><span update-value>US: 9\/ EU: 42\/ CM: 27<\/span><\/p>/);
    assert.deepEqual(buttonLabels(html), ['42', '43']);
  }
});

test('actual English locale recognizes Ukrainian option names in fractional EU picker and card sizes', async () => {
  const en = JSON.parse(readFileSync(path.join(root, 'locales/en.default.json'), 'utf8'));
  const englishEngine = createEngine(key => key.split('.').reduce((value, part) => value?.[part], en) ?? key);
  const values = [
    optionValue('US: 9/ EU: 42 2/3/ CM: 27', 40),
    optionValue('US: 8/ EU: 41 1/3/ CM: 26', 41),
    optionValue('US: 8.5/ EU: 42/ CM: 26.5', 42),
    optionValue('US: 9/ EU: 42.5/ CM: 27', 43, false)
  ];
  const ctx = context(values);
  ctx.option.name = 'Розмір';
  ctx.request = { locale: { iso_code: 'en' } };
  const picker = await englishEngine.renderFile('_product-variant-picker', ctx);
  assert(picker.includes('Size (EU)'));
  assert(picker.includes('nbk-footwear-sizes'));
  assert.deepEqual(buttonLabels(picker), ['41 1/3', '42', '42.5', '42 2/3']);
  for (const value of values) {
    assert(picker.includes(`name="Розмір" value="${value}"`));
    assert(picker.includes(`data-value-id="${value.id}"`));
  }
  assert.match(picker, /value="US: 9\/ EU: 42 2\/3\/ CM: 27"[^>]+ checked[^>]+data-value-id="40"/);
  assert.match(picker, /<span update-value>US: 9\/ EU: 42 2\/3\/ CM: 27<\/span>/);

  const card = await englishEngine.renderFile('size-list', ctx);
  const cardLabels = [...card.matchAll(/<span class="hdt-swatch-title">(.*?)<\/span>/g)].map(match => match[1]);
  assert.deepEqual(cardLabels, ['41 1/3', '42', '42 2/3']);
  assert(card.includes('class="hdt-variant-label">EU:</span>'));
  assert(card.includes('data-vrid="1040"'));
  assert(!card.includes('data-vrid="1043"'));
});
