# Size filter availability

## Required Shopify configuration

The Kyiv store must keep **Standard: Availability** enabled in Shopify Search & Discovery. It was missing before this audit, so `filter.v.availability=1` was ignored. Enabled on 2026-11-03, filter setting ID `134686310560`. This is a store-level prerequisite and applies independently of the published theme.

Do not replace the Size option, rewrite product variants, or change stock to repair this issue. Native Shopify filtering correctly joins Size and variant Availability once both filters are configured.

## Theme behavior

- Selecting any native Size (`filter.v.option.size`) or EU size (`filter.v.m.custom.footwear_size_eu_available`) adds `filter.v.availability=1` before Shopify builds the filtered result set.
- Several selected sizes use Shopify's OR logic. Every result must have at least one selected size available for sale.
- Both filter forms show “Available sizes”. While a size is selected, availability is an implicit constraint carried as a hidden field. Its conflicting control and removable chip are omitted.
- Removing the final size removes this automatic availability constraint. Without a selected size, the ordinary Availability filter remains available.
- Direct size links are normalized through the existing section-render path and replace browser history instead of adding another entry. A newly applied stock constraint resets pagination; already normalized pagination links retain their page.
- Sorting, active-filter links and back/forward use the same query normalization. Product cards are never hidden client-side, so Shopify counts and pagination reflect the actual results.
- All-zero and empty groups are omitted after suppressing duplicate raw EU sizes. Selected zero-count values stay visible and removable; price ranges are unaffected.

## Evidence

PLEASURES + L/XL on `/collections/all` originally returned 14 products. Seven displayed no available L or XL, including `futbolka-1996-ringer-shirt-bila` (only S available). After enabling Availability, the same query with `filter.v.availability=1` returns 7 products, each showing L or XL among its available sizes. The S-only Ringer shirt is excluded.

Native availability means available for sale; it is not a reservation. A future continue-selling policy can include backorders. The EU canonical field still has its documented Shopify Flow/indexing delay.

## Validation

Run `node --test tests/facet-stock.mjs` and the Liquid tests with `liquidjs` available on `NODE_PATH`. Browser acceptance covers direct links, L/XL changes, final-size removal, clear-all, back/forward, mobile filters, EU sizes, and UA/EN labels.

Only upload changed theme files to an unpublished preview. Theme publication is a separate release action. Roll back the theme code through Git; the standard Availability filter may stay configured as a normal storefront filter.

### Preview acceptance on 2026-11-03

Preview theme `201119891616` (unpublished):

- PLEASURES + L/XL: 7 results, each displaying L or XL available; the empty EU group is omitted.
- Removing L leaves 6 XL results; removing XL then restores all 23 PLEASURES products and removes the stock parameter.
- Browser Back restores the XL query and 6-result count. Clear-all restores 734 products.
- At 390 × 844, selecting the visible L label yields 193 results; all 16 cards on page one list L available. This is responsive browser testing, not a physical-device test.
- EN + EU 42: 12 results, all list 42 available; headings and availability hint are translated, and the ordinary empty Size group is absent.
- 71 Liquid tests and 8 stock-query tests pass. Theme Check reports no additional findings against the base commit (4510 existing findings in both trees). The toolkit validator also runs after installing its missing dependencies in a temporary directory; existing unrelated translation errors prevent a globally green theme report.
