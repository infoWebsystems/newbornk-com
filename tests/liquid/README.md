# Liquid render checks

These checks render the actual snippets with LiquidJS 10.29.0, parse the resulting JSON-LD, and exercise incomplete taxonomy fields, variant-specific data, barcode validation, review/policy preservation, pagination and H1 fallback/escaping. They do not replace Shopify preview checks because Shopify Liquid objects and filters can differ from the fixture renderer.

Install LiquidJS outside the theme, then run from the repository root:

```sh
npm install --prefix /tmp/nbk-liquid-tests --no-save liquidjs@10.29.0
NODE_PATH=/tmp/nbk-liquid-tests/node_modules node --test tests/liquid/*.cjs
```

The normal `node --test tests/*.cjs tests/*.mjs` suite remains dependency-free.
