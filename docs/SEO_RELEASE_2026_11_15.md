# Kalles SEO release and follow-up — 15 November 2026

## Published release

The user approved publication of merged PRs #114 and #115 on 15 November. Their 11 theme files were uploaded to live theme **199582843040**. Each was pulled again and its SHA-256 matched the staged release. The three locale files were built from the current live versions with only the two `nbk_seo` keys added. Live `layout/theme.liquid`, including the current Chekly integration, matched its pre-release backup and was not uploaded.

Backups, the exact release manifest, upload receipt and readback are in the local audit workspace `nov15/release-before`, `release-manifest.json`, `release-push.json` and `release-after`.

35 release regression tests passed. Eleven public HTML samples returned 200 and confirmed blog H1s, one description tag, pagination descriptions/canonicals, localized policy descriptions, size-chart noindex and share-image widths no larger than 1200 px. Direct product and registration requests returned 429/406; the product was checked successfully in the browser. This was not a completed login or checkout test.

Rendered browser inspection found an additional issue: the English login link can regain `/en/customer_authentication/` after the initial HTML renders. PR #114 corrects the initial Liquid URL, but its runtime guard only runs in Ukrainian and Russian. The follow-up in this PR extends that guard to English while preserving `/en/` storefront and Ajax routes.

## New changes in this PR — preview only

- Normalize late or rewritten English authentication URLs to Shopify's root endpoint. Existing locale, region and return parameters are preserved; English product/navigation/cart routes stay English.
- Apply the existing collection-visibility helper to category links in the filter drawer at all three levels. Unpublished or empty destinations are omitted, while a missing parent can retain its reachable children without linking to the missing parent.
- Three live broken links were traced to this drawer: `/collections/integralist`, `/collections/liquix` and `/collections/sex-skateboards`. Their collections have zero members. Active vendor products were found elsewhere, so collection rules, products and publication status were not changed.

Review theme: **201250930848 — SEO audit review - 5 Nov 2026**. Only the three changed runtime files were uploaded. They are not part of the live release of PRs #114/#115. Browser verification confirmed the stable corrected EN login URL and no links to the three missing collections on the Carhartt WIP collection page.

44 targeted tests passed, including asynchronous English link changes, reachable descendants of hidden parents, metadata, structured data and footwear facets. Shopify theme validation passed all three runtime files; the existing nested category renderer produces two non-blocking nesting-depth warnings.

## Catalog corrections already applied

- Added explicit SEO titles and descriptions for **CLUB-MATE** and **RÜTE** in Ukrainian, English and Russian. Copy uses current catalog information and makes no health claims. All fields and translation freshness were read back from Shopify.
- Added the exact 301 redirect `/collections/klattermusen` → `/collections/klattermussen`, preserving the existing canonical collection handle. Redirect ID: `1690019856544`.

Exact copy: [collection-metadata.json](seo-release-2026-11-15/collection-metadata.json). Original fields and translations were backed up locally in `nov15/metadata-before.json`; readback is in `nov15/metadata-after.json`.

## Ahrefs baseline and remaining work

Latest completed crawl at inspection: **12 November 2026 02:05 UTC**, project **9030642**. Health Score **94**, 41,461 crawled URLs, 2,504 errors, 17,196 warnings and 29,618 notices. It predates today's theme publication and is not a post-release result.

The crawl reports 7 HTTP 404 URLs (down from 80 on 4 November), 31 missing H1s, 114 indexed URLs without descriptions and 32 heavy images. Most missing descriptions are paginated/utility pages covered by the published changes; RÜTE and CLUB-MATE were the additional empty collection SEO fields. These counts require a new crawl before being called resolved.

Remaining: merge and approve publication of this follow-up, then re-crawl; inspect surviving links to the two unavailable products without republishing seasonal/draft merchandise; optimize remaining original images while preserving product zoom. This PR does not claim a completed full-site SEO audit or zero remaining errors.

## Rollback

For the published PR114/115 batch, restore only the 11 files from `nov15/release-before`; do not restore the whole theme. For this preview follow-up, revert the three runtime files to the parent commit. Restore the two collections' prior SEO/translation fields from their backup and remove redirect `1690019856544` only if reverting the catalog corrections.
