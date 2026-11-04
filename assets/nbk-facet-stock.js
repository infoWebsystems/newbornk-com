const sizeParams = ['filter.v.option.size', 'filter.v.m.custom.footwear_size_eu_available'];
const availabilityParam = 'filter.v.availability';

export function hasSizeFilter(url) {
  return sizeParams.some(name => url.searchParams.getAll(name).some(value => value.trim()));
}

export function normalizeSizeAvailability(url, previousUrl) {
  const next = new URL(url);
  if (hasSizeFilter(next)) {
    const stock = next.searchParams.getAll(availabilityParam);
    if (stock.length !== 1 || stock[0] !== '1') next.searchParams.delete('page');
    next.searchParams.set(availabilityParam, '1');
  } else if (previousUrl && hasSizeFilter(previousUrl)) {
    next.searchParams.delete(availabilityParam);
  }
  return next;
}
