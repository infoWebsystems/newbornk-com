# Kyiv About page

The `page.about` template now uses `nbk-about`, following the Warsaw `/pages/o-nas` composition: centered wordmark and address, store photograph beside the story, two founder portraits with overlapping white biography panels, and a closing community statement. On mobile the story and founder cards stack in one column.

Kyiv's existing store image, founder portraits and current Ukrainian/English facts are retained. Biography openings are adjusted to work as standalone paragraphs below the names. Russian copy is also supplied. The generic page body and old content blocks are no longer rendered together, so the heading, story and biographies appear once.

## Editing

- Set the store photo, map URL, founder portraits and card order in the **Kyiv about** section in the theme editor.
- Edit copy under `nbk_about` in the theme's language editor (`locales/uk.json`, `locales/en.default.json`, `locales/ru.json`). The address and store-image alt text reuse `nbk_contact`.
- The Shopify Page title remains the H1. The URL, template assignment, original Page body and its translations/SEO fields were preserved. Editing the old Page body no longer changes the structured story; update the theme translations instead.
- The preview upload preserved its current app-injected Chekly layout code.

## Verification — 10 October 2026

- All 60 Liquid render tests passed, including UK/EN/RU content and missing-image/block cases.
- Desktop at 1280 px and mobile at 390 px were checked in unpublished theme `199582843040`: correct Kyiv photos, one H1, no horizontal overflow, two desktop columns and one mobile column. The EN section contains no Cyrillic text.
- The changed theme files have no Theme Check findings. Full vendor-theme validation is not clean: 3,912 errors versus the inherited 3,872 baseline. The 40 additional findings are the eight new keys missing in each unused bundled locale (`de`, `es`, `fr`, `pl`, `zh-CN`); those languages are outside the Kyiv UK/EN/RU implementation. They must be translated before enabling them. The skill's separate validator could not run because its installed `@shopify/theme-check-common` dependency is absent; Shopify CLI Theme Check was used instead.
- Theme files were selectively uploaded to the unpublished preview and read back. Publishing the theme is a separate action.

[UA preview](https://newbornk.com/pages/about-us?preview_theme_id=199582843040) · [EN preview](https://newbornk.com/en/pages/about-us?preview_theme_id=199582843040)
