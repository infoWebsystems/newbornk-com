# Liquid render checks

The About-page checks in `about-page.cjs` cover the Warsaw composition with Kyiv photos, single UK/EN/RU story and founder biographies, English-only EN copy, and rendering without optional images or founder blocks.

These checks render the actual theme blocks and snippets with LiquidJS 10.29.0.

- `jsonld-graph.cjs` checks JSON-LD validity, incomplete taxonomy fields, variant-specific data, barcode validation, review/policy preservation, pagination and H1 fallback/escaping.
- `mega-menu.cjs` checks vertical category/brand groups, existing navigation URLs, collection-vendor matching, empty-collection guards, nested links, brand entries after the first 50, the accessory layout and native-menu fallback.
- `footwear-sizes.cjs` checks literal EU extraction, fractions and numeric ordering, metadata freshness, unchanged submitted values/IDs, stock-aware card labels, clothing isolation and the native selected-size reference after picker rendering.
- `footwear-facets.cjs` checks numeric EU facet ordering, active/disabled values, legacy-filter fallback, removable selections, clothing isolation and native search/price/availability parameters.

They do not replace Shopify preview checks because Shopify Liquid objects and filters can differ from the fixture renderer. The menu fixture supplies translation keys and a limited `handleize` implementation; visual layout, actual translated copy and production brand matching still need a preview check.

Install LiquidJS outside the theme, then run from the repository root:

```sh
npm install --prefix /tmp/nbk-liquid-tests --no-save liquidjs@10.29.0
NODE_PATH=/tmp/nbk-liquid-tests/node_modules node --test tests/liquid/*.cjs
```

The normal `node --test tests/*.cjs tests/*.mjs` suite remains dependency-free.
