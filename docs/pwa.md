# PWA launch assets

The Android launch screen is generated from the web app manifest. Its background,
theme color, HTML theme-color, and opaque icon backgrounds must all be `#c7ec51`.
`assets/pwa-icon.svg` uses the original letter paths from `snippets/icon-logo.liquid`
in the stacked NEW/BORN/K arrangement. The 192px and 512px PNGs are raster exports
of that source, with a solid background and no transparency.

## Publishing

The live manifest is a **Shopify Files** resource, not a theme asset. The copy in
`assets/manifest.json` records its source in Git; a theme sync alone does not update
the manifest used by installed apps.

1. Upload the PNGs to Shopify Files with versioned filenames.
2. Put their returned CDN URLs in `assets/manifest.json`.
3. Replace the contents of existing `manifest.json` in Shopify Files
   (`gid://shopify/GenericFile/68908160155808`) without renaming it.
4. Keep the `file_url` manifest link in `layout/theme.liquid`, and retain the app's
   `id`, `start_url`, and `scope`. Moving the manifest can stop existing Android
   installs from discovering updates.
5. Fetch the manifest URL from the live HTML, then check both PNGs, dimensions,
   and their border pixels against the manifest background. Check the app on
   Android after its WebAPK has updated.

The previous bitmap had a different green background (`#cbf951`) from the splash,
making its square visible. New filenames also let Android detect the icon change.
Invalid placeholder screenshot URLs were removed from the manifest.

Android may keep an installed WebAPK's old launch assets until its next update.
For device QA, use `chrome://webapks` to inspect/update the installed app. See
[Chrome's manifest update guidance](https://web.dev/articles/manifest-updates).
