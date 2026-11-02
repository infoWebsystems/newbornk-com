# Mobile UX preview — 2 November 2026

First preview from the approved mobile UX handoff. This change does not complete the entire handoff backlog.

## Review target

- Store: newbornk.com
- Unpublished theme: **Mobile UX review - 2 Nov 2026**, ID `201119891616`
- Preview: https://newbornk.com/?preview_theme_id=201119891616
- English: https://newbornk.com/en?preview_theme_id=201119891616
- Based on `kalles-main` at `2fdb576`; preview was duplicated from the current live theme to preserve its app settings and license.
- The first pass pushed nine scoped theme files; the gender-navigation revision adds four more scoped files. No live-theme publication, layout replacement, customer data changes, or app-admin changes were made.

## Changes

### Welcome popup

The existing Yespo welcome form is presented as a white, centered card with the real wordmark, a visible Email label, concise Ukrainian/English copy, and compact consent and offer conditions. The native input, submit action, validation, privacy link, and dismissal handlers remain in use.

The styling targets welcome widget `f35732v35732` and its nested shadow roots. Signup text is rewritten only while its native email input exists. Other native form states retain their content.

The dialog has a 44px close target, Escape/backdrop dismissal, keyboard focus containment and restoration. It does not focus the input automatically. A short viewport or keyboard scrolls the outer dialog, rather than creating a second scroller inside the form. Chat and gift launchers are hidden while the dialog is open.

### Mobile navigation

Five actions share equal widths and a common baseline, including the native Shopify account control. Labels fit a 320px viewport, zero-count badges are hidden, and safe-area spacing is included. Catalog links to the locale-aware All products collection. Native search, cart, wishlist and account behavior is preserved.

### Chat

The existing 30-second startup delay is retained. The widget starts closed, does not restore an earlier open state, and suppresses the unsolicited unread-message preview. The compact launcher and unread badge remain available; opening and closing the conversation manually still works.

## Validation performed

- JavaScript syntax checks and `git diff --check` passed.
- The first-pass changed files had no Shopify Theme Check findings. In the gender-navigation revision, the mobile menu files retain four pre-existing warnings (`lazyMn` variable naming and `key_brand` undefined-object checks); no new errors were introduced. Full-theme pre-existing findings remain.
- Read back all nine uploaded theme files from the unpublished theme and confirmed they match the working tree (JSON compared without Shopify-generated comments).
- Checked Ukrainian layouts at 320×640, 360×640, 390×844 and 430×932, and English at 320×640 and 390×844. No horizontal overflow or inner form scroller in these views.
- Checked a short 320×360 viewport: the whole dialog is scrollable and all controls remain reachable.
- Invalid email shows the native validation state with an accessible inline message. X, decline, Escape and keyboard focus wrap/restore were exercised.
- Catalog navigation, search entry, account menu and cart count updates were checked. Added one selected-size product, verified the cart line, then removed only that test line and restored the original cart contents.
- Chekly opened with the cart and checkout form. No order or payment was submitted.
- Chat was absent before the delay, appeared as a 44px launcher, stayed closed, and opened/closed manually.
- Isolated startup checks cover delayed and late load, one-time initialization and closed-state render options.

## Remaining before production approval

- Real iPhone/Safari and Android/Chrome acceptance, including the on-screen keyboard and device safe area. Browser viewport checks are not device testing.
- Authorized valid-email submission, native success/already-subscribed states, confirmation and welcome-email delivery. No new subscription was submitted in this stage.
- A valid performance baseline: PageSpeed returned quota exceeded, so no Lighthouse/Core Web Vitals score was obtained.
- Visual approval of this preview. Merging into a branch connected to the live theme can deploy it; keep the PR in draft until approval.

## Later handoff stages

- Footer density, remaining translations and service links.
- Size/filter data cleanup and KREW personalization based on verified Shopify/BAS data.
- Final mobile regression and an explicitly approved production rollout.

## Gender navigation revision — 2 November 2026

The existing `cholovikam` and `women` collections were never deleted. The consolidated navigation introduced in PR #101 replaced their top-level entries with Clothing. This revision restores separate Men/Women entry points while retaining the product-type Categories tab and gender filter.

### Store configuration dependency

- A separate Shopify menu, `kyiv-catalog-gender-preview` (ID `341175009440`), is assigned to desktop and mobile menus in this preview. The live theme still uses its existing menu.
- The menu combines the current catalog links with the existing men's and women's category branches. It contains 10 roots and 126 items; 68 English link translations were copied and read back successfully.
- The same menu must exist on the destination store before this header configuration is deployed. It already exists on newbornk-com.
- Mobile gender submenus now include a localized View all link to the full collection. Desktop mega-menu category headings are ordinary HTML links to the parent collection, in addition to the existing clickable top-level controls.
- Collection IDs, handles, SEO fields, content, smart rules and product data were not changed. No redirects were created.

### Verification

- Uploaded only `sections/header-group.json`, `blocks/_mega_link-list.liquid`, `blocks/_menu_mobile.liquid` and `snippets/menu_mobile.liquid` to unpublished theme `201119891616`.
- Desktop menu click reached `/collections/cholovikam`; mobile Women's View all reached `/collections/women`; English Men's View all retained `/en/collections/cholovikam`.
- UA/EN mobile roots and translated category links checked at 390px. Desktop screenshot shows the restored links in the header. Header source includes ordinary parent-collection anchors.
- Public collection pages render with self-canonical URLs and allow indexing.
- GSC URL Inspection on 2 November reports both URLs as Submitted and indexed, with Google-selected canonical equal to the user canonical. Men's last crawl: `2026-10-30T00:25:43Z`; women's: `2026-11-01T13:18:45Z`. These are crawl snapshots, not a before/after traffic or ranking assessment.

### Separate catalog follow-up

The smart collections still use legacy gender tags plus positive inventory. The standard gender metafield shown by storefront filters disagrees for some products (the women's page includes products marked Male). Audit this mismatch against verified product evidence before changing collection membership; this navigation revision intentionally does not rewrite product data or collection rules.
