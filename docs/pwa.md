# PWA launch assets

The Android launch screen is generated from the web app manifest. Its background,
theme color, HTML theme-color, and opaque icon backgrounds must all match the
announcement bar's brand accent, currently `#ccf951`. HTML theme-color reads
`settings.colors_accent_2`, the same setting as the announcement bar. If this
brand color changes, rebuild the icons and update both manifest colors together.
`assets/pwa-icon.svg` uses the original letter paths from `snippets/icon-logo.liquid`
in the stacked NEW/BORN/K arrangement. The v3 192px and 512px PNGs are raster
exports of that source, with a solid background and no transparency. Keep older
Shopify Files icons available for clients with a cached manifest.

## Android adaptive icons

The manifest has separate `any` and `maskable` icons. Android uses the maskable
versions to apply the device's standard icon shape, including rounded squares
and circles. Do not bake rounded transparent corners into these files or mark
the large regular logo as maskable: Android needs an opaque background and safe
padding around the artwork.

`assets/pwa-icon-maskable.svg` retains the original logo paths and scales the
artwork to 80% around the center. Its 192px and 512px PNGs have a solid `#ccf951`
background. All logo pixels must fit within the centered safe circle whose radius
is 40% of the image width; verify this after changing artwork or padding. See
[the maskable icon specification guidance](https://web.dev/articles/maskable-icon).

## iPhone and iPad icons

`layout/theme.liquid` links dedicated Apple Touch PNGs at 180px (iPhone), 167px
and 152px (iPad), with explicit `sizes`. These are opaque exports of
`assets/pwa-icon-maskable.svg`, preserving the same logo proportions and brand
background as Android. Let iOS apply its icon shape; do not add transparent
rounded corners. The HTML app title is `NBK`, matching the manifest's short name.
The existing manifest's `display: standalone` provides Home Screen app mode.

Apple Touch icons take precedence over manifest icons on iOS, so changing only
the Android icons will not update them. See [Apple's icon size guidance](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
and [WebKit's Home Screen app documentation](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).

These Apple Touch PNGs use `asset_url` and ship with the theme through Git;
they do not require a separate Shopify Files upload. After deployment, check
the rendered links and fetch each PNG to verify dimensions, opacity and color.
For device QA, add the site to the Home Screen on an iPhone and iPad, check the
icon and title, and open it to verify standalone mode. HTTP and image checks
alone do not prove the appearance on a physical device.

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
5. Fetch the manifest URL from the live HTML, then check all referenced PNGs,
   dimensions, border colors, and the maskable icons' safe areas. Check the app
   on Android after its WebAPK has updated.

The original bitmap had a different green background (`#cbf951`) from the splash
(`#c7ec51`), making its square visible. v2 matched the old splash color; v3 also
matches the storefront announcement bar to remove the Android status-bar seam.
New filenames let Android detect the icon change.
Invalid placeholder screenshot URLs were removed from the manifest.

Android may keep an installed WebAPK's old launch assets until its next update.
For device QA, use `chrome://webapks` to inspect/update the installed app. See
[Chrome's manifest update guidance](https://web.dev/articles/manifest-updates).
Chrome 144+ may ask the user to review and accept icon changes through
"Review app update"; reopening alone does not guarantee the installed icon has
changed. See [the current icon update behavior](https://developer.chrome.com/blog/improvements-to-web-app-updates).
