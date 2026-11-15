# Kalles SEO follow-up — 5 November 2026

This follows the 4 November Ahrefs crawl (project 9030642) and PR #114. The crawl is a baseline, not a new post-fix score.

## Theme changes in this PR

- Open Graph images request a maximum width of 1200 px, preserving aspect ratio and avoiding upscaling. Both image URL tags and declared dimensions agree. No format conversion or crop is forced, so transparency is preserved.
- Article-list image fallback `src` is capped at 720 px, matching its largest existing responsive candidate. Intrinsic dimensions, lazy loading and responsive sizes are preserved.
- Terms of service and privacy policy receive localized UA/EN/RU descriptions when Shopify supplies no page description. Existing descriptions remain authoritative; social metadata uses the same fallback. The policy body and terms are unchanged.

Product gallery images and original uploads are unchanged. The theme uses the gallery `src` for hover zoom, so capping that source alone would degrade zoom quality.

## Catalog changes already applied through Admin API

Five collections now have explicit SEO titles/descriptions in Ukrainian, English and Russian (15 localized URLs):

| Collection | Resolved issue |
| --- | --- |
| PIDNOGAMY | Missing metadata; English title incorrectly said FOOTWEAR and Russian title was mistranslated. Both now say PIDNOGAMY. |
| Summer Sale | Missing metadata, now specific to summer clothing. |
| Autumn Sale 2026 | Missing metadata, now specific to the autumn selection. |
| Пальта | Missing metadata and EN/RU category-title translations. |
| NEW Пальта | Missing metadata and EN/RU category-title translations; copy identifies new arrivals. |

The two coat collections currently contain the same three products but have different inclusion rules: `Пальта` vs `NEW AND Пальта`. Their URLs, rules, publication status and canonical URLs were preserved. They should not be merged merely because their current membership matches.

Exact applied copy is in [collection-metadata.json](seo-followup-2026-11-05/collection-metadata.json). Every field was read back from Shopify; all translations are current. Before/after backups are in the local audit workspace under `followup/`.

## Image measurements

For the 18 large-image URLs from the baseline audit, requests with modern browser Accept headers totaled 20,829,690 bytes at their previous widths. The same sources at a maximum width of 1200 px totaled 4,198,102 bytes (79.8% less). All 18 returned HTTP 200.

This is a rendition benchmark, not a claim that page load or every Ahrefs image warning improved by 79.8%. A 1200 px IMG_9895 rendition remains about 1.03 MB. Original gallery/inline images remain available and may still be flagged by Ahrefs.

[Individual measurements](seo-followup-2026-11-05/image-size-check.json).

## Broken-link disposition

The baseline contained 80 HTTP 404 URLs and six HTTP 429 responses; 429 is rate limiting, not proof of a deleted page. Admin inspection of the 15 distinct affected product handles found 14 drafts and one active product not published online. None were republished or redirected to unrelated pages.

A fresh rendered check of `/products/trail-sling-bag-green` in the review theme no longer contained the affected Regular Pants/Musette links. This does not prove every historic source is clean. A new crawl is needed to separate stale recommendation links from remaining live sources; do not bulk-redirect intentional unpublished products.

## Validation and review state

- 27 focused Liquid render tests passed (metadata, JSON-LD and policy layout).
- Admin collection/translation mutations validated against API 2026-10, executed without user errors, then read back.
- Theme validation passed both changed Liquid snippets and English/Ukrainian locale files. Russian locale validation still reports pre-existing missing keys; comparison against HEAD found 56 missing leaf keys before and after, with zero newly missing keys. The validator reports 30 of those as missing translation errors. This PR does not claim the whole Russian locale is complete.
- Browser preview checks confirmed one description tag, correct policy translations, PIDNOGAMY headings and 1200 px share images. No Liquid error was present on sampled pages.
- Review theme: **201250930848 — SEO audit review - 5 Nov 2026**, unpublished.
- Only the two changed snippets and the new `nbk_seo` locale keys were uploaded. Existing preview locale content was preserved. Live theme **199582843040** was not written. PR #114 is merged in Git but its pagination snippet change is not yet present in the live theme; deploy it along with this PR when approved.
- Browser verification and image measurements are archived under `docs/seo-followup-2026-11-05/`.

## Remaining verification

After the approved theme release, run a new Ahrefs crawl to verify the prior fixes and this batch. Revisit remaining large original images separately with a zoom-preserving approach; review surviving 404 sources based on the new crawl. No new health score or indexation improvement is claimed yet.

## Rollback

Revert this PR for the theme changes. Restore the five collections' previous SEO fields and their prior EN/RU translations from `followup/before-targets.json` if catalog rollback is required. Preview files before upload are saved under `followup/preview-before/`.
