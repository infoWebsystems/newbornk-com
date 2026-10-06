# Collection editorial content — 7 October 2026

## Shopify content (already updated)

35 collections now have Ukrainian descriptions adapted from Warsaw and matching English translations (70 descriptions). This covers 31 active shared brands, the men/women categories and two existing Oakley eyewear collections. Empty brand collections, Polish-only brands and category pages without Warsaw descriptions were excluded. Descriptions are Shopify resource data shared across themes; these writes are independent of merging the theme PR.

All 35 source descriptions and English body_html translations were re-fetched and matched exactly; no English body translation was outdated. Handles, product membership, titles and SEO metadata were not changed. The previous descriptions/translations are backed up locally in `work/kalles-seo-copy-2026-10-07/before-admin.json` and `before-oakley-admin.json`. New copy and source URLs are versioned in `docs/content/collection-copy-2026-10-07.json`.

The source was adapted for Kyiv: removed Poland-specific delivery promises, unsupported blanket performance/material claims, obsolete model lists and unnecessary repetition. Internal category links use existing Kyiv routes.

## Theme presentation (preview only)

- Collection descriptions follow the product grid and pagination in the default, brand, outlet and lifestyle templates.
- Editorial column: max 800px, 16px body / 24px heading; mobile 15px body / 22px heading and 20px side margins.
- Short descriptions remain visible. Descriptions over 120 whitespace-separated words starting with a paragraph keep that lead visible and place the rest in native details/summary. Other HTML stays intact and visible.
- All text remains in server-rendered HTML. The native disclosure works with keyboard and without JavaScript; no gradient or clipping.
- Removed obsolete pixel-height/read-more editor controls. The description visibility and position controls remain available.

## Validation

Three Liquid rendering tests passed (short, long with links, empty). Shopify accepted the preview upload; unique schema setting IDs and template/locale JSON checked. Desktop Rains, mobile English Rains, category disclosure via Enter and 390px no-overflow layout verified. No live theme publication.

## Follow-up

`okulyari-oakley` and `okulyary-oakley` are both indexed, self-canonical routes with overlapping intent and different collection rules. Their inaccurate copy was replaced with distinct text, but selecting a canonical destination and redirecting the duplicate needs a separate traffic/link and inventory-rule review. No redirects were changed.

## Updated collections

| Kyiv | Warsaw source |
|---|---|
| [a-cold-wall](https://newbornk.com/collections/a-cold-wall) | [Source](https://newbornk.pl/collections/a-cold-wall) |
| [alpha-industries](https://newbornk.com/collections/alpha-industries) | [Source](https://newbornk.pl/collections/alpha-industries) |
| [aries](https://newbornk.com/collections/aries) | [Source](https://newbornk.pl/collections/aries) |
| [arte-antwerp](https://newbornk.com/collections/arte-antwerp) | [Source](https://newbornk.pl/collections/arte) |
| [bareen](https://newbornk.com/collections/bareen) | [Source](https://newbornk.pl/collections/bareen) |
| [carhartt-wip](https://newbornk.com/collections/carhartt-wip) | [Source](https://newbornk.pl/collections/carhartt-wip) |
| [carne-bollente](https://newbornk.com/collections/carne-bollente) | [Source](https://newbornk.pl/collections/carne-bollente) |
| [cote-ciel](https://newbornk.com/collections/cote-ciel) | [Source](https://newbornk.pl/collections/cote-ciel) |
| [edwin](https://newbornk.com/collections/edwin) | [Source](https://newbornk.pl/collections/edwin) |
| [filling-pieces](https://newbornk.com/collections/filling-pieces) | [Source](https://newbornk.pl/collections/filling-pieces) |
| [flatlist](https://newbornk.com/collections/flatlist) | [Source](https://newbornk.pl/collections/flatlist) |
| [gestalten](https://newbornk.com/collections/gestalten) | [Source](https://newbornk.pl/collections/gestalten) |
| [gramicci](https://newbornk.com/collections/gramicci) | [Source](https://newbornk.pl/collections/gramicci) |
| [han-kjobenhavn](https://newbornk.com/collections/han-kjobenhavn) | [Source](https://newbornk.pl/collections/han-kjobenhavn) |
| [helly-hansen](https://newbornk.com/collections/helly-hansen) | [Source](https://newbornk.pl/collections/helly-hansen) |
| [klattermussen](https://newbornk.com/collections/klattermussen) | [Source](https://newbornk.pl/collections/klattermusen) |
| [market](https://newbornk.com/collections/market) | [Source](https://newbornk.pl/collections/market) |
| [new-amsterdam](https://newbornk.com/collections/new-amsterdam) | [Source](https://newbornk.pl/collections/new-amsterdam) |
| [norda-run](https://newbornk.com/collections/norda-run) | [Source](https://newbornk.pl/collections/norda-run) |
| [oakley](https://newbornk.com/collections/oakley) | [Source](https://newbornk.pl/collections/oakley) |
| [ochis](https://newbornk.com/collections/ochis) | [Source](https://newbornk.pl/collections/ochis) |
| [women](https://newbornk.com/collections/women) | [Source](https://newbornk.pl/collections/damskie) |
| [cholovikam](https://newbornk.com/collections/cholovikam) | [Source](https://newbornk.pl/collections/meskie) |
| [parel-studios](https://newbornk.com/collections/parel-studios) | [Source](https://newbornk.pl/collections/parel-studios) |
| [pas-normal-studios](https://newbornk.com/collections/pas-normal-studios) | [Source](https://newbornk.pl/collections/pas-normal-studio) |
| [post-archive-fachion](https://newbornk.com/collections/post-archive-fachion) | [Source](https://newbornk.pl/collections/post-archive-faction) |
| [published-by](https://newbornk.com/collections/published-by) | [Source](https://newbornk.pl/collections/published-by) |
| [rains](https://newbornk.com/collections/rains) | [Source](https://newbornk.pl/collections/rains) |
| [roa](https://newbornk.com/collections/roa) | [Source](https://newbornk.pl/collections/roa) |
| [rombaut](https://newbornk.com/collections/rombaut) | [Source](https://newbornk.pl/collections/rombaut) |
| [umbro](https://newbornk.com/collections/umbro) | [Source](https://newbornk.pl/collections/umbro) |
| [xlarge](https://newbornk.com/collections/xlarge) | [Source](https://newbornk.pl/collections/xlarge) |
| [etudes-studio](https://newbornk.com/collections/etudes-studio) | [Source](https://newbornk.pl/collections/etudes) |
| [okulyari-oakley](https://newbornk.com/collections/okulyari-oakley) | [Source](https://newbornk.pl/collections/oakley-eyewear) |
| [okulyary-oakley](https://newbornk.com/collections/okulyary-oakley) | [Source](https://newbornk.pl/collections/oakley-eyewear) |
