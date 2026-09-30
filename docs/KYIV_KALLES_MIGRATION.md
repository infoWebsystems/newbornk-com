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

The existing JSON-LD graph, robots and hreflang logic, Pandectes bootstrap, GTM, Yespo app embed and Ahrefs analytics are retained. Consent-gated GA4 product selection is connected to Kalles links, and cart-view tracking observes the Kalles drawer. No customer or catalog records are edited by this migration.

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

1. Translate & Adapt review must include Kalles `top-menu`, `mobile-menu` and theme settings. English still shows “To men” / “To women”, Ukrainian announcement/homepage and mobile toolbar labels. Ukrainian collection sorting also shows “Date, new to old”. These are existing resource/theme translations, not fixed by changing the font or switcher.
2. Investigate a legacy extra wishlist button injected on the product page despite the Hero embed being disabled; keep only native Kalles controls.
3. Resolve or confirm the Judge.me `jdgmSettings is not defined` error in the preview. Shopify Shop JS also logs unsupported locale `uk`; confirm affected features before launch.
4. Run the final Chekly checkout/payment, consent and analytics acceptance checks, then review mobile/product layouts with the merchant.
5. Merge the reviewed Kalles PR and connect the separate Kalles theme to `kalles-main` if desired. Publishing the theme remains a separate merchant decision.

## Warsaw-style footer adaptation — September 30

After PR #75, adapted the Warsaw footer structure to Kyiv: a white wordmark above three balanced columns for newsletter signup, Kyiv contacts/social links, and existing footer navigation. The native globe stays below About us and above policy links. Tablet layout places signup above two columns; mobile stacks all content without collapsible menus.

Moved the homepage-only contact information into a translated footer-group section so the address, phone, email and opening hours appear directly above the footer across the store. The obsolete homepage carousel instance was removed. The white wordmark reuses Kyiv's existing vector logo.

The newsletter uses Shopify's native customer form and `newsletter` tag, with translated labels, consent copy, error/success states and a locale-aware privacy link. Warsaw's Klaviyo account and first-order discount were not copied. Forwarding Shopify subscribers into Kyiv's Yespo workflows remains unverified and requires separate integration acceptance before a newsletter campaign relies on it.

Validation: all 11 changed/new theme files passed the Liquid validator with cached Shopify schemas; the final footer style adjustment passed again. Changes uploaded to draft theme `199582843040` only. Browser checks confirmed Ukrainian and English footer content, translated address/hours and privacy links, native language switching, and no horizontal overflow at 1280px desktop, 820px tablet and 390px mobile. No newsletter form was submitted and no subscriber was created during these checks.

## Header, Google reviews and App Inbox — September 30

The active Kyiv header now uses the existing wordmark's vector paths in a 3,141-byte black SVG (about 1.4 KB compressed), retaining desktop/mobile widths of 160/120px, the sticky header, localized home link, white transparent variant and merchant-image fallback. Brand-specific logo overrides remain unchanged.

The footer's contact block displays **5.0 ★ · 162 Google reviews**, verified against [Kyiv's Google Maps profile](https://maps.app.goo.gl/VtaNBz5cXNtQKzAF6) on September 30, 2026. Like Warsaw, this is a lightweight linked text line, not a live review feed. Edit the rating, count and profile URL in the **Kyiv contacts and reviews** footer block; count 0 hides it. UA/EN/RU labels use locale pluralization. The contact block is a theme block so its settings remain available during Liquid rendering.

Added the legacy `#app-inbox` mount to the Kalles header once, with space for the Yespo bell on desktop/mobile and no extra gap while empty. Removed obsolete lowercase `es('appInbox.init')` / `checkMessages` calls. The installed Yespo Shopify app already initializes the SDK via `eS('init', {APP_INBOX:true}, ...)` and supplies its authentication callback; duplicating that logic in the theme is unnecessary. [Yespo documents App Inbox for authenticated customers](https://docs.esputnik.com/docs/configuring-app-inbox-for-websites). The anonymous session has no customer and therefore does not render a bell. **Authenticated bell placement, opening and message display still require acceptance testing**; the provider's authenticated appearance response determines the placement selector.

The footer newsletter remains Shopify's native subscription form. Receipt/sync in Yespo is not verified. No subscriber or message was created during this work.

Validation: all new/changed logo, footer, locale and Inbox host files passed Shopify Liquid validation using cached schemas. The reduced analytics snippet reports only the existing external Ahrefs CDN performance diagnostic; its loader is unchanged. Shopify accepted uploads to unpublished theme `199582843040`. Browser checks confirmed the SVG loads at 160px desktop and 120px mobile (including sticky state), one Inbox mount, UA/EN review text and profile link, and no horizontal overflow at 1280px and 390px. The live theme is unchanged.

## Warsaw feature parity — September 30

Adapted the active Warsaw feature set at `pl-newbornk-com/kalles-main` `915a99d3f6d8bfbef4db42c985b02be34a19f3a9` to Kyiv after PR #77. The additions remain on `kalles-dev` for review into `kalles-main` and unpublished theme `199582843040`.

### Navigation and homepage

- Three desktop mega-menus use Warsaw's column layout: men/women have separate vertical category and brand lists, followed by a portrait promotion and native four-product carousel; accessories have one category list with the Warsaw spacer. Group headings have a single divider and links use uppercase Formular typography. Men, women and accessories match the destination collection, so translating menu titles does not disconnect their content. The mobile menu is unchanged.
- Categories retain Kyiv's current navigation, nested links and empty-collection guards. Brands prefer the current main-menu branch, retain its real destinations, and are filtered by the selected collection's vendors and nonempty brand collections. Preview currently renders 34 men's brands and 35 women's brands.
- Promotions use existing Kyiv portrait images with lazy loading, natural image ratios, 30px column padding and translated UA/EN/RU underlined links. Men/women promotions open the corresponding collection sorted by newest products.
- Added two native collection-card rows: CARNE BOLLENTE / GRAMICCI / A-COLD-WALL, then CARHARTT WIP / NEW AMSTERDAM. Existing homepage sections, their settings and relative order are preserved.
- Added a native ten-brand carousel. All ten linked collections were confirmed to contain products. It uses lightweight brand names; optional logo pickers accept real brand artwork later. No additional JavaScript is needed. Empty collections are hidden.

### SEO

H1 uses the resource title rather than the search-engine title, retaining the wishlist translation. Removed duplicate Organization emission from all four header variants. The existing connected Kyiv JSON-LD graph now conditionally emits valid GTINs, taxonomy material/audience, and variant-specific color/material. Missing or ambiguous data is omitted. Existing review and Kyiv offer-policy values are preserved.

CollectionPage remains on every collection page. ItemList is emitted only on page one and its count matches the rendered subset, preventing first-page products from being described again on later pages.

### Yespo acceptance status

The installed Yespo Shopify app shows **App Inbox Enabled**, **Web Tracking Enabled** and **Data Sync Enabled**. Its historical synchronization reports 7,201 customers synchronized / 33 failed, and 5,062 orders synchronized / 24 failed. No resync or configuration change was performed.

Authenticated Chrome testing confirmed the header bell mounts in the existing `#app-inbox`, opens an existing Ukrainian message and closes normally. This resolves the authenticated desktop Inbox check left open after PR #77. No message was created or sent during this verification.

The footer continues to use Shopify's native customer newsletter form, including marketing consent and the `newsletter` tag. The installed app supports Shopify-to-Yespo synchronization, but **a new signup's receipt and consent in both systems still need an end-to-end test using a merchant-provided test email**. Historical sync failures are not evidence that this new form failed. No subscriber was created during this work.

### Verification and remaining acceptance

- All 19 changed/new theme files pass Shopify Liquid/schema validation (cached Shopify schemas); the final brand-indicator contrast adjustment passes again.
- Existing Node regression suite: 29 passing tests. New actual Liquid-render suite: 6 passing tests covering JSON validity, escaping, reviews/policies, GTINs, missing/variant taxonomy data, collection pagination and H1 selection. See `tests/liquid/README.md` for the command.
- Shopify accepted selective uploads only to the unpublished theme.
- Desktop Chrome: all three mega-menus open in UA/EN, promotion images load, nested URLs retain the locale, four product cards are present, Space/Enter open and Escape closes; tall menus retain native vertical scrolling.
- Desktop carousel advances with native previous/next controls. At 390px, the mobile menu expands categories, the brand carousel advances, and the document has no horizontal overflow. Editorial images use `object-fit: contain`.
- Live-rendered collection and product JSON-LD parses correctly, contains one Organization and one resource H1. Page two retains CollectionPage without ItemList; product offers retain UAH.

Before launch, finish the test newsletter signup, existing English resource/theme translation review (including “To men” / “To women” and Ukrainian homepage campaign text), and the separate Chekly/payment/analytics acceptance checks. Publishing remains a separate merchant decision. No Warsaw discount, Klaviyo account, AI chat, currency setup or campaign was copied.

The mega-menu layout correction additionally passed validation for all seven affected theme files and five focused actual Liquid-render tests. Desktop checks covered three Ukrainian menus, English group labels, locale-preserving URLs, loaded portrait images, 30px padding and no horizontal overflow at 1440px. The existing mobile drawer and nested links open at 390px without horizontal overflow. When uploading new block setting definitions, upload the section-group settings again after the block schema is registered: Shopify can otherwise discard the new setting values during the same batch upload.
