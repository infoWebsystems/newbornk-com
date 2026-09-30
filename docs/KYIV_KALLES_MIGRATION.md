# Kyiv Kalles migration

Kyiv's Kalles theme is maintained separately from Dawn, using the Warsaw `kalles-main` implementation adapted to Kyiv's catalog, navigation, content and integrations.

- Source: `infoWebsystems/pl-newbornk-com`, `ddfb4953a553d9e5f85212db68b8f748fbf304d3` (includes empty-collection navigation filtering).
- Target baseline: `infoWebsystems/newbornk-com`, master `9230a0f`.
- Draft theme: `199582843040`, **Kyiv Kalles - migration preview - 15 Sep 2026**.
- Preview: https://newbornk.com/?preview_theme_id=199582843040
- Existing live theme: `133779652768`, **newbornk-com/master**.

## Branch workflow

- `master`: existing Dawn theme. Do not target Kalles pull requests here.
- `kalles-main`: baseline for Kyiv Kalles, initialized from the validated migration commit `d47f663e5ebfd9e95d53f54042296f39452aef7c`.
- `kalles-dev`: ongoing Kalles changes and additions, initialized from `kalles-main`.

Open future Kalles pull requests with head `kalles-dev` and base `kalles-main`. Keep changes in `kalles-dev` until reviewed. PR #68 targeting `master` is superseded by this separate branch setup and is closed without merging.

The draft theme above remains the existing Kalles preview. Creating these branches does not connect them to Shopify GitHub synchronization or publish a theme. Any future Shopify connection must use a separate Kalles theme, preserving the existing Dawn/master connection. The repository default branch remains unchanged; select `kalles-main` explicitly as the PR base.

## Store behavior

Kyiv's desktop/mobile menus, nine hero banners, collection references, contacts, pages, logos and Formular fonts are used. Existing resource handles and published store locales are retained. The Kyiv home introduction is available in a collapsed, accessible section instead of its former hidden HTML.

The native Kalles cart hands off to the existing Chekly checkout at `checkout.newbornk.com`. The existing Chekly script and attribution behavior are retained. AOV's embed is disabled in this theme. Warsaw payment logos, agreement blocks and accelerated buttons are removed from cart configuration; payment and final acceptance remain within Kyiv's checkout flow.

Native **local Kalles wishlist** is selected, as requested. Wishlist Hero's embed is disabled only in this theme; the app and its saved data are not deleted. Kalles stores up to 50 product IDs in the current browser. Existing Hero lists are not imported or synchronized across devices.

Kyiv product descriptions, size charts, subtitle/model data, pickup availability, Judge.me ratings/reviews, and the existing Instagram widget are retained. The active Avada collection SEO block remains on the default collection template, matching the prior assignments.

Legacy `product.default-outlet` and `product.gift-card-template` assignments have Kalles-compatible templates. Outlet products retain the existing next-day pickup notice. The Kyiv `robots.txt.liquid` template is retained byte-for-byte.

The existing JSON-LD graph, robots and hreflang logic, Pandectes bootstrap, GTM, Yespo inbox/customer initialization and Ahrefs analytics are retained. Consent-gated GA4 product selection is connected to Kalles links, and cart-view tracking observes the Kalles drawer. No customer or catalog records are edited by this migration.

### Yespo product recommendations

Yespo's existing recommendation widget uses Dawn markup. A product-page-only adapter supplies responsive Kalles-compatible styling and native horizontal scrolling with arrow controls. It retains the original recommendation cards, order and tracked links, translates the heading, and places the widget in the related-products position. The native Kalles related section is hidden only while Yespo has cards, so it remains a fallback when the widget is absent or empty.

Legacy Hero and direct-add controls are removed from these cards. Native Kalles wishlist buttons sit outside the product link and resolve the actual product ID with Shopify's locale-aware Ajax Product API as cards approach the viewport (cached, at most three simultaneous requests). The legacy feed's `data-wlh-id` can be a variant ID and is not used for the wishlist. Failed lookups leave product navigation available without an invalid wishlist button. Global Yespo configuration and the Dawn theme are unaffected.

Browser verification on `shtani-brandon-pant-siri`: five desktop/two mobile cards, no page overflow at 390px, regular/sale prices, arrow scrolling, and native wishlist add/remove including Space-key removal. The test wishlist addition was removed; cart contents were unchanged.

## Validation

Run the portable regression suite with:

```sh
node --test tests/*.cjs tests/*.mjs
```

23 tests pass, covering Chekly click-ID tracking, consent-gated cart/selection analytics, selected-variant updates in sticky add-to-cart, empty carousel handling, and the Yespo wishlist adapter's ID resolution, lazy requests, preserved links, insertion, concurrency and failure paths. Removed AOV/Dawn-only tests are explained in `tests/README.md`.

Shopify accepted the complete draft upload without errors. New/custom integration files and corrected templates have been checked with Shopify's Liquid validator. Inherited theme-check findings include unused vendor variables, naming/documentation warnings, and the intentionally retained external Ahrefs loader / synchronous consent bootstrap. This is not a claim that the full vendor theme is warning-free.

Browser checks completed: Ukrainian home, nested category menu, collection/product rendering, size selection and add/remove cart operations; native wishlist add, persistence across page navigation, mobile menu access and removal; final wishlist heading; mobile layout width 390 without horizontal overflow; tail brand links including XLARGE; and Kalles drawer handoff to the Chekly contact/payment screen. No payment or order was submitted. Test-added products and wishlist entries were removed; pre-existing cart contents were preserved.

The ten core live-theme files re-read during validation match their original checksums. The draft has not been published and master has not been updated.

## Review before publication

Review the draft on representative devices and complete the store's normal checkout/payment acceptance process. Interface translations are present for Ukrainian, English and Russian; merchant-authored theme section text and artwork are primarily Ukrainian and should be reviewed in each language before launch. Existing translated catalog and menu resources remain managed in Shopify.

The existing `carhartt-wip` collection has the malformed template suffix `Default collection`; Shopify falls back to the default collection template. This migration does not mutate that collection assignment.

Merging future changes from `kalles-dev` into `kalles-main` and publishing the Kalles theme are separate review steps. Keep the live Dawn theme available for rollback.

## September 30 refresh

Reconciled Dawn/master through `f424f6a` with Kalles after PR #69. This is an adaptation on `kalles-dev` for review into `kalles-main`; live Dawn remains unchanged.

- Ported the locale guard and extended it to Kalles `themeHDN.routes` initialization and nested-menu `data-url` navigation. Explicit language selections remain untouched.
- Replaced native language labels with an accessible 44px globe button; the native popover offers Ukrainian and English. The footer globe follows About us and precedes the separate policy menu.
- Retained Kalles Formular typography and uppercase desktop navigation across both locales.
- Rebuilt the updated contact page using Kalles-compatible sections, translated content/form labels, the current storefront photographs, a single H1, localised help links and existing seller details.
- Added the latest desktop/mobile hero slide, reconciled the homepage brand text, and retained the existing Yespo service-worker asset.
- Did not transplant Dawn breadcrumb, pagination or product markup. Kalles already has its own implementations and an About-page H1.

### Verification on September 30

- All 29 Node regression tests pass, including six locale-routing checks and Kalles late route initialization / nested menu coverage.
- All 17 changed/new theme files passed the Liquid validator using cached Shopify schemas (network schema refresh unavailable). The four files adjusted for contact labels were validated again.
- Uploaded only the changed theme files to unpublished theme `199582843040`.
- Browser: header/footer UA/EN switching, same contact-page return path, mobile language selector, Ukrainian collection/product navigation and predictive search verified.
- Contact page: one H1, both photographs load, translated form labels and locale-aware help links; 390px viewport has no horizontal overflow.
- Shopping smoke test: selected M for COLDFRONT DOWN JACKET, added one M to the native cart, confirmed the variant, removed only that test item. Existing two carabiners remained. Native wishlist added/removed the test product and returned to zero.
- No contact message or order was submitted. Payment completion and external analytics receipt were not verified in this pass.

### Remaining launch blockers / acceptance

1. Translate & Adapt review must include Kalles `top-menu`, `mobile-menu` and theme settings. English still shows “To men” / “To women”, Ukrainian announcement/homepage and mobile toolbar labels, and the footer address. Ukrainian collection sorting also shows “Date, new to old”. These are existing resource/theme translations, not fixed by changing the font or switcher.
2. Investigate a legacy extra wishlist button injected on the product page despite the Hero embed being disabled; keep only native Kalles controls.
3. Resolve or confirm the Judge.me `jdgmSettings is not defined` error in the preview. Shopify Shop JS also logs unsupported locale `uk`; confirm affected features before launch.
4. Run the final Chekly checkout/payment, consent and analytics acceptance checks, then review mobile/product layouts with the merchant.
5. Merge the reviewed Kalles PR and connect the separate Kalles theme to `kalles-main` if desired. Publishing the theme remains a separate merchant decision.
