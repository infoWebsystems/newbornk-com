# Kyiv Kalles: release checklist

Checked 7 October 2026. **Prepared for acceptance; not yet cleared for publication.**

## Release and rollback targets

| Purpose | Theme | Git branch |
| --- | --- | --- |
| Current production / rollback | `133779652768` — `newbornk-com/master` (Dawn) | `master` |
| Release candidate | `199582843040` — `Kyiv Kalles - migration preview - 15 Sep 2026` | `kalles-main` |
| Changes | PR into `kalles-main` | `kalles-dev` |

[Open the release preview](https://newbornk.com/?preview_theme_id=199582843040).
Publishing is a separate action from merging a PR. Do not assume GitHub automatically deploys to this preview. Publish this exact tested theme: Shopify-managed translations are attached to its theme resources. No fresh vendor-theme installation or Dawn merge is needed.

## Checks completed

- Separate Kyiv Kalles licence verified against the purchase certificate supplied on 7 October. Purchase code is not stored in Git. Vendor registration has not been performed.
- Fresh preview settings compared with Git. Shopify removed empty generated settings and three already-disabled app blocks; active app settings match. Git now reflects that normalization.
- Active Pandectes, Multifeeds, Yespo, Instagram, REZ and Klaviyo embeds retained. Judge.me enabled for Kalles. AOV and Wishlist Hero intentionally disabled because Kalles supplies the cart and wishlist. Shopify Inbox remains disabled; KeyCRM is the support chat.
- Real production Yespo form opens from the footer. App Inbox bell opens the native message panel. Test submission shows the confirmation prompt; this alone does **not** prove email delivery.
- Same-day mobile acceptance: available product adds the selected variant to the Kalles cart; sold-out size opens the correct REZ notification; Chekly preserves products, variants, quantities and the existing welcome discount. Four delivery and five payment choices were visible. No order was submitted.
- Native sort choices and recognized filter labels localized for UK/EN/RU without changing Shopify query values. Mobile filter/sort controls exercised at 390 px; no horizontal page overflow. Built-in collection relevance sorting is included.
- Yespo product recommendation links retain the rendered locale, variant/query parameters and attribution. Browser EN recommendation click retained `/en/` and `sc_content`; UA links stayed unprefixed.
- Representative rendered home, collection and UA/EN product pages: one H1 and canonical each, UK/EN/RU alternates, parseable JSON-LD and appropriate page types. Product canonical removes the collection path and tracking query. These checks do not constitute a full catalog crawl or proof of Google indexing.
- 59 JavaScript regression tests pass after the English-content update; the earlier release pass also completed 50 Liquid render tests. Changed theme files pass Shopify validation with cached schemas (only inherited non-error sidebar warnings). Whole vendor theme remains non-clean; do not describe the full Theme Check baseline as passing.
- Eleven selectively uploaded preview files were read back and their checksums matched local files. Dawn remains `MAIN`, Kalles remains `UNPUBLISHED`.
- EN catalog content updated in Shopify on 7 October. Before the run, 212 of 963 published active products had missing English fields and 49 had outdated translations. After the native Translate & Adapt run and 43 manual field corrections across 23 products, all 963 have translations for their nonempty Cyrillic catalog fields, with no outdated product translations remaining. Coverage is an API audit, not a line-by-line editorial certification of every automatic translation.
- Another 90 English fields corrected across 87 collections, pages, menu links, menus, filters and the blog title. All 133 manual corrections were read back without mismatches. Brand names such as RAINS, PLEASURES and CARROTS are preserved; navigation uses Men, Women and Gift Cards.
- Yespo recommendation names now use the existing locale-aware Shopify product request, including image alt text and the accessible link name, while preserving attribution and lazy loading. Sale badges and screen-reader price text use native locale strings. Product page/browser checks confirmed English descriptions and model measurements, English recommendation titles, native wishlist controls and retained `/en/` tracked links. Both changed preview files were read back byte-for-byte; Ukrainian product/menu content remains Ukrainian.

## Gates before publication

1. **Yespo:** verify a new subscriber receives the confirmation email, confirmation creates/activates the intended contact, and the automatic welcome follows. The authorized test alias showed success but no email was found. Yespo login expired during the contact recheck. Manual QA welcome delivery is separate evidence and does not close this gate.
2. **Payment / orders:** owner completes an agreed test purchase, or authorizes a specific product and amount. Verify payment status, one matching Shopify order, KeyCRM receipt, and one purchase event with matching amount/currency/order ID. Test wallet availability on actual compatible devices. Do not pay the existing cart as an implicit test.
3. **Translations / terms:** core EN catalog and navigation gaps are closed. Before calling all EN content complete, reconcile policy and legal-page source content, then translate it. Shopify auto-translation excludes legal policies. The return policy advertises free shipping from UAH 1,500 and the shipping policy from UAH 4,000, while the checked Chekly/product block says UAH 5,000 with full prepayment to a Nova Poshta branch/locker. Owner clarification is pending; no legal policies were changed in this pass. The FAQ English body is also outdated. Third-party Yespo signup/App Inbox language and the GSC Instagram introduction require separate app-side localization; Instagram post captions and customer reviews remain original user-generated content.
4. **Inbox reach:** account previously reported more App Inbox contacts than its plan permits. Resolve the plan/audience decision with the owner; do not silently upgrade billing. Panel rendering works, but delivery to all contacts is not verified.

## Publication procedure

1. Close the gates above; approve and merge the release PR into `kalles-main`. Freeze theme-editor/code changes for the release window.
2. Reconcile the candidate against the exact merged commit, taking a fresh snapshot of settings and app embeds before any sync. Preserve Shopify-managed translations and the tested theme ID. Download current Dawn and candidate archives immediately before publishing; retain Dawn in the theme library.
3. With the owner/team available to check orders, publish **199582843040** in Shopify. Keep the domain, Markets, product/collection handles, redirects and checkout configuration unchanged.
4. In a clean session without preview cookies, check UA/EN home, collection, filtering, search, product size, wishlist, cart, Chekly, newsletter, REZ, reviews and chat at mobile/desktop widths. Inspect canonical, hreflang, robots and JSON-LD on live URLs.
5. Verify the agreed transaction and order/analytics receipt. Compare checkout errors and orders with the normal baseline before announcing the new site broadly.

## Rollback

If purchases fail, the wrong variants/totals reach checkout, essential support is unavailable, or widespread navigation/SEO failures appear, republish **Dawn 133779652768**. Recheck live cart → Chekly and order receipt immediately. Keep Kalles unpublished for repair. Theme rollback does not reverse orders, payments, catalog changes or external app configuration; handle those separately. Do not delete either theme.

Catalog taxonomy, menu restructuring and breadcrumb redesign are deferred until after migration.
