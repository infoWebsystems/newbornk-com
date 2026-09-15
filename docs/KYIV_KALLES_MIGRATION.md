# Kyiv Kalles migration

This branch replaces Kyiv's Dawn theme with the Warsaw `kalles-main` implementation, adapted to the existing Kyiv catalog, navigation, content and integrations.

- Source: `infoWebsystems/pl-newbornk-com`, `ddfb4953a553d9e5f85212db68b8f748fbf304d3` (includes empty-collection navigation filtering).
- Target baseline: `infoWebsystems/newbornk-com`, master `9230a0f`.
- Draft theme: `199582843040`, **Kyiv Kalles - migration preview - 15 Sep 2026**.
- Preview: https://newbornk.com/?preview_theme_id=199582843040
- Existing live theme: `133779652768`, **newbornk-com/master**.

## Store behavior

Kyiv's desktop/mobile menus, eight hero banners, collection references, contacts, pages, logos and Formular fonts are used. Existing resource handles and published store locales are retained. The Kyiv home introduction is available in a collapsed, accessible section instead of its former hidden HTML.

The native Kalles cart hands off to the existing Chekly checkout at `checkout.newbornk.com`. The existing Chekly script and attribution behavior are retained. AOV's embed is disabled in this theme. Warsaw payment logos, agreement blocks and accelerated buttons are removed from cart configuration; payment and final acceptance remain within Kyiv's checkout flow.

Native **local Kalles wishlist** is selected, as requested. Wishlist Hero's embed is disabled only in this theme; the app and its saved data are not deleted. Kalles stores up to 50 product IDs in the current browser. Existing Hero lists are not imported or synchronized across devices.

Kyiv product descriptions, size charts, subtitle/model data, pickup availability, Judge.me ratings/reviews, and the existing Instagram widget are retained. The active Avada collection SEO block remains on the default collection template, matching the prior assignments.

The existing JSON-LD graph, robots and hreflang logic, Pandectes bootstrap, GTM, Yespo inbox/customer initialization and Ahrefs analytics are retained. Consent-gated GA4 product selection is connected to Kalles links, and cart-view tracking observes the Kalles drawer. No customer or catalog records are edited by this migration.

## Validation

Run the portable regression suite with:

```sh
node --test tests/*.cjs tests/*.mjs
```

17 tests pass, covering Chekly click-ID tracking, consent-gated cart/selection analytics, selected-variant updates in sticky add-to-cart, and empty carousel handling. Removed AOV/Dawn-only tests are explained in `tests/README.md`.

Shopify accepted the complete draft upload without errors. New/custom integration files and corrected templates have been checked with Shopify's Liquid validator. Inherited theme-check findings include unused vendor variables, naming/documentation warnings, and the intentionally retained external Ahrefs loader / synchronous consent bootstrap. This is not a claim that the full vendor theme is warning-free.

Browser checks completed: Ukrainian home, nested category menu, collection/product rendering, size selection and add/remove cart operations; native wishlist add, persistence across page navigation, mobile menu access and removal; final wishlist heading; mobile layout width 390 without horizontal overflow; tail brand links including XLARGE; and Kalles drawer handoff to the Chekly contact/payment screen. No payment or order was submitted. Test-added products and wishlist entries were removed; pre-existing cart contents were preserved.

The ten core live-theme files re-read during validation match their original checksums. The draft has not been published and master has not been updated.

## Review before publication

Review the draft on representative devices and complete the store's normal checkout/payment acceptance process. Interface translations are present for Ukrainian, English and Russian; merchant-authored theme section text and artwork are primarily Ukrainian and should be reviewed in each language before launch. Existing translated catalog and menu resources remain managed in Shopify.

The existing `carhartt-wip` collection has the malformed template suffix `Default collection`; Shopify falls back to the default collection template. This migration does not mutate that collection assignment.

Publish/merge is a separate approval step. Keep the live Dawn theme available for rollback.
