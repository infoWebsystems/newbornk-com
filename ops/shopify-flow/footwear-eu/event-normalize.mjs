const SIZE_NAMES = ['size', 'розмір', 'размер'];
export default function main(input) {
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
