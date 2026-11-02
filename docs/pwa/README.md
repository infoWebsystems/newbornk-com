# Kyiv PWA system colors — 3 November 2026

The Android screenshot shows a lime system gesture area below the white mobile navigation. The linked Shopify Files manifest defined both `theme_color` and `background_color` as `#ccf951`; the theme emitted an empty page-level `theme-color`.

## Changes and deployment

- Set the page-level theme color to `#ffffff` in `layout/theme.liquid`.
- Update the existing Kyiv Shopify GenericFile `68908160155808` (`manifest.json`) in place: change only `theme_color` and `background_color` to `#ffffff`. This store-wide file update was applied on 3 November 2026 and affects every theme that links to the file, including production.
- `manifest.json` in this directory is the exact updated source for that Shopify File. It is documentation/deployment input, not a theme asset. Merging the PR does not upload Shopify Files.
- Keep the manifest filename/path, app ID `/`, start URL `/`, scope `/`, display behavior, description and all four icons. Keep the existing `file_url` manifest link; Shopify changes its version query when the file is replaced.
- The theme meta-tag change was uploaded only to unpublished preview `201119891616`; merge this PR through the normal `kalles-main` deployment path for production.

The top OS status bar may also become white: the standard PWA theme color applies to the system shell, not just the bottom gesture area. The lime New arrivals announcement, menu dimensions and safe-area spacing are unchanged.

## Verification

- Original source backed up outside the theme repository at `../pwa-2026-11-03/manifest-before.json`.
- JSON comparison confirms exactly two manifest fields changed.
- Shopify file update returned READY with no user errors; the new CDN URL serves the exact updated JSON with application/json MIME type.
- UA and EN preview HTML each render one white theme-color meta tag and the updated manifest file version.
- The previous versioned CDN URL can still serve the lime cached copy. An already-installed Android PWA may need its normal WebAPK update; the page-level meta tag gives current pages an explicit white override after deployment.
- A desktop browser cannot verify the Android system gesture area. Verify on the actual installed Android PWA after deployment/update, including reopening the app and navigating from home to a collection and product.

## Rollback

Revert the meta-tag change and update the same GenericFile with `theme_color` and `background_color` set back to `#ccf951`. Preserve all other fields. Do not delete/recreate the file or move the manifest to a theme asset URL.

## References

- [PWA colors and the page-level override](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Customize_your_app_colors)
- [Chrome manifest updates, including Android WebAPK caching](https://web.dev/articles/manifest-updates)
