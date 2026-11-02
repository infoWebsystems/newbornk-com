# Kyiv brand navigation

`brands-menu` is the shared brand registry for the A–Z directory, desktop and mobile brand lists, contextual mega-menu brand columns, and product vendor links. Add a brand as a collection resource link here; keep its title equal to its trademark and preserve the existing collection handle. Check any saved English menu translation as well.

The directory and menus hide missing or empty collections. The registry retains existing out-of-stock brand collections so their links return when their collection has products again. Collection rules must continue to restrict these brand collections to stocked products. Gift cards remain a separate shopping destination.

The homepage logo carousel is a curated selection, labelled “Вибрані бренди” / “Selected brands”, with an “Усі бренди” / “All brands” link to the full directory. It is not the brand registry.

Product vendor links resolve through the registry, including handles that differ from the vendor name, such as `post-archive-fachion` and `rute`. Existing localized collection URLs are retained. Unknown vendors keep Shopify's vendor-search fallback.

## Catalog repair applied on 3 November 2026

- All 60 brands with active, online, stocked products are present in the directory and desktop/mobile navigation.
- Created and published smart collections for CLUB-MATE, RÜTE, SEICHA MATCHA and WOSTOK (exact vendor plus positive variant inventory).
- Mirrored the registry into seven existing menus, preserving unrelated items and existing collection URLs.
- Corrected 34 stored English brand-link translations, including OCHIS, HELAS, GESTALTEN, VEJA and POST ARCHIVE FACTION.
- Kept nine existing empty brand collections in the 69-entry registry; the storefront hides them until stocked. No collections or existing URLs were deleted.

These catalog and translation updates are store data and are already applied independently of the theme PR. Theme changes are staged in unpublished theme `201119891616`.

## Validation

Liquid render checks cover UA/EN paths, more than 50 entries, empty collections, legacy translated trademarks, and canonical product vendor links. Shopify Theme Check reports no errors in changed files; its five warnings in these files predate this change. Section and block setting schemas are unchanged.

Backups of menus, collections, translations and affected live/preview theme files are stored with the local `kyiv-brand-fix-2026-11-03` audit artifacts. Restoring menu data and reverting this theme PR are separate rollback actions.
