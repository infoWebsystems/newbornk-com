const SIZE_NAMES = ['size', 'розмір', 'размер'];
function normalize(input) {
  const tags = input.product?.tags || [];
  const isTagged = tags.includes('Взуття');
  const fail = { shouldWrite: false, euSize: '', isTagged };
  if (!isTagged) return fail;
  const opts = (input.productVariant?.selectedOptions || []).filter(o => SIZE_NAMES.includes(String(o.name || '').trim().toLowerCase()));
  if (opts.length !== 1) return fail;
  const raw = String(opts[0].value || '').replace(/⅓/g, ' 1/3').replace(/⅔/g, ' 2/3').replace(/½/g, '.5');
  const re = /(Euro|EU|US|CM|СМ)\s*:\s*(\d+(?:[.,]\d+)?(?:\s+\d+\/\d+)?)/gi;
  const matches = Array.from(raw.matchAll(re));
  const remainder = raw.replace(re, '').replace(/[\s•/:|,;–—-]/g, '');
  if (remainder) return fail;
  const eu = matches.filter(m => /^(EU|Euro)$/i.test(m[1]));
  if (eu.length !== 1) return fail;
  const parts = eu[0][2].trim().replace(',', '.').split(/\s+/);
  const whole = Number(parts[0]);
  if (!Number.isFinite(whole) || whole < 10 || whole > 80) return fail;
  let euSize = String(whole);
  if (parts.length === 2) {
    if (!Number.isInteger(whole) || !['1/3', '2/3', '1/2'].includes(parts[1])) return fail;
    euSize += ' ' + parts[1];
  }
  return { shouldWrite: true, euSize, isTagged };
}


export default function main(input) {
  const products = input.getProductData;
  if (!Array.isArray(products)) throw new Error('Footwear reconciliation: product list missing.');
  if (products.length >= 100) throw new Error('Footwear reconciliation reached the 100-product query cap. Partition the query into disjoint groups before resuming; no metadata was changed by this run.');
  const rows = [];
  let variantCount = 0;
  for (const product of products) {
    const variants = product.variants;
    const expected = product.variantsCount?.count;
    if (!Array.isArray(variants) || !Number.isInteger(expected) || variants.length !== expected) {
      throw new Error('Footwear reconciliation: incomplete variant list for ' + product.id + '. Partition the query or update the variant fetch before resuming.');
    }
    for (const productVariant of variants) {
      variantCount++;
      const canonical = productVariant.canonicalEu;
      const indexed = productVariant.availableEu;
      const size = normalize({ product, productVariant });
      const available = productVariant.availableForSale === true;
      const canonicalNeedsChange = size.shouldWrite ? canonical?.value !== size.euSize : !!canonical;
      const indexNeedsChange = size.shouldWrite && available ? indexed?.value !== size.euSize : !!indexed;
      if (canonicalNeedsChange || indexNeedsChange) {
        rows.push({ id: productVariant.id, eu: size.euSize, valid: size.shouldWrite, available });
      }
    }
  }
  if (rows.length > 1000) throw new Error('Footwear reconciliation exceeded the 1000-row Flow loop limit. Partition product query before resuming; no metadata was changed by this run.');
  const output = { rows, productCount: products.length, variantCount };
  if (JSON.stringify(output).length > 48000) throw new Error('Footwear reconciliation neared the 50KB output limit. Partition the product query before resuming; no metadata was changed by this run.');
  return output;
}
