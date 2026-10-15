# Kyiv Kalles: release checklist

Checked 15 October 2026. **The three remaining acceptance findings are closed; Kalles is not yet published.** The release candidate contains `kalles-main` at `7ec4a4e` plus the localized KeyCRM snippet in this release change and the preserved Shopify/app-managed differences listed in the [final preparation record](KALLES_PREPARATION_2026-10-15.md). Merge the release change before publication. Yespo end-to-end testing, a paid Chekly order and the App Inbox plan upgrade remain explicitly owner-deferred, not passed.

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
- On 8 October, six more EN body fields were updated directly in Shopify: Payment & Delivery, FAQ, and the terms, contact, privacy and public-offer policies. All six match the submitted text and are not outdated. Source Ukrainian bodies were preserved. The English payment page and FAQ were checked in the Kalles preview. These store-wide translations affect Dawn as well as Kalles; merging Git changes does not apply or roll them back.
- Following explicit owner approval on 8 October, Yespo Popup 35732's EN version was applied. The live Kalles footer opens English signup copy on `/en/` and the original Ukrainian copy on UA pages. Consent links to the matching privacy page. Confirmation instructions, existing-subscriber and error states are translated in the saved form; no new subscription or email was sent in this verification.
- Native EN language versions were added to two existing App Inbox drafts: Welcome 4713000 → EN 4719989 and style help 4709392 → EN 4719991. Reopening verified the English text and preserved Ukrainian originals. Welcome retains its personal-code variable and UTM parameters, with an `/en/collections/without-discount` destination; style help retains its Telegram destination and image. No campaign was created or sent, and no workflow routing was changed.
- The owner-approved free-shipping rule now appears in both source policies (refund and shipping) and the return page: orders from UAH 5,000, paid in full in advance, delivered to a Nova Poshta branch or parcel locker. Exact readback confirms only that condition changed in the Ukrainian bodies. Three EN bodies were added or refreshed against those current sources; the return page's stale office address was replaced by 20 Velyka Zhytomyrska Street. These bodies match the submitted translations and are not outdated.
- GSC Instagram Feed's requested permission update was accepted after explicit owner approval. Its existing widget 76962 now has native EN localization for the introduction and viewer link. The rendered EN product page shows the English introduction; the UA product page retains the Ukrainian introduction. No theme code or Instagram captions were changed.

## Latest acceptance fixes

- Product requests now retry transient failures once and clear failed caches. Variant-selection failures restore the confirmed choice and show a localized retry message. EN unavailable EU 42 → available EU 46 was verified in the updated preview.
- REZ's native EN button/modal copy is corrected and verified; no subscription or email was sent. UA One size uses `Розмір`, remains preselected and is ready to add. The mobile EN contact address is translated.
- Payment & Delivery, Returns and FAQ source/EN bodies were updated using the owner's approved payment/delivery list and refund-processing deadline. These are store-wide content changes, separate from Git/theme deployment.
- Latest validation: 63 JavaScript tests, 50 Liquid render tests, and no new Theme Check findings against the 3,872-error vendor baseline. Twelve changed theme files were uploaded only to preview `199582843040` and read back; generated locale comments were normalized for comparison.

- After owner approval of the full review document, `/policies/shipping-policy`, `/policies/refund-policy`, `/pages/public-agreement`, `/policies/legal-notice` and `/policies/terms-of-service` received the exact reviewed Ukrainian bodies and five matching English translations. Native UI saves succeeded for policies; Admin readback confirms all EN fields match and are not outdated. The three offer copies match after normalizing Shopify tag whitespace. EN shipping was verified in the storefront. These are live store-wide content updates; Kalles remains unpublished.

## Final acceptance findings — 15 October

1. **Footwear filter — passed:** EU 42 returns 11 matching products in UK and EN; EU 42 + 42.5 returns 13; EU 42 2/3 returns one. All 36 displayed-result checks match an available product variant. The unavailable Saucony EU 42 is excluded. Clearing filters works. No stock, SKU, option or metafield was changed; the historical cause remains unproven.
2. **Return-window wording — corrected:** the store-wide FAQ now says 14 days from receipt in both Ukrainian and English, matching the existing Returns page. Only that phrase changed. Admin readback confirms the EN body is current; the storefront shows the corrected wording.
3. **KeyCRM localization — corrected:** a native English widget uses the existing `Чат` support channel, contacts, daily 11:30–20:30 schedule and `#C7EC51` color. Kalles selects it on `/en/`; other locales retain the original Ukrainian widget. Both rendered greetings and placeholders were verified. No chat message was sent.

## Owner-deferred follow-up checks

On 8 October the owner explicitly moved Yespo, Chekly purchase testing and the Inbox plan decision until later. Do not reinstate them as approval gates or call them passed. No billing change, subscription or payment is authorized by this deferral.

1. **Yespo:** verify a new subscriber receives the confirmation email, confirmation creates/activates the intended contact, and the automatic welcome follows. The authorized test alias previously showed success but no email was found. Yespo access works again on 8 October; no new subscription or email was sent in this pass. Manual QA welcome delivery is separate evidence and does not close this gate. The live signup form now selects UK/EN correctly, but the confirmation email, confirmation landing page and welcome flow still need locale checks: the selected confirmation message and redirect preview showed Ukrainian.
2. **Payment / orders:** owner completes an agreed test purchase, or authorizes a specific product and amount. Verify payment status, one matching Shopify order, KeyCRM receipt, and one purchase event with matching amount/currency/order ID. Test wallet availability on actual compatible devices. Do not pay the existing cart as an implicit test.
3. **External app localization / reach:** Yespo signup and the GSC Instagram introduction switch between UK/EN. Existing App Inbox messages and dates remain Ukrainian on EN; delivered messages and routing have not changed. Yespo reported 7,139 contacts against a 5,000-contact plan, with 2,139 contacts unable to receive App Inbox messages. The owner will revisit the tariff later. Rendering is verified; delivery to all contacts is not. Instagram captions and customer reviews remain original user-generated content.

## Publication procedure

1. Resolve the outstanding acceptance findings and record the owner's deferred checks. Merge any resulting fixes into `kalles-main`; freeze theme-editor/code changes for the release window.
2. Reconcile the candidate against the exact merged commit, taking a fresh snapshot of settings and app embeds before any sync. Preserve Shopify-managed translations and the tested theme ID. Download current Dawn and candidate archives immediately before publishing; retain Dawn in the theme library.
3. With the owner/team available to check orders, publish **199582843040** in Shopify. Keep the domain, Markets, product/collection handles, redirects and checkout configuration unchanged.
4. In a clean session without preview cookies, check UA/EN home, collection, filtering, search, product size, wishlist, cart, Chekly, newsletter, REZ, reviews and chat at mobile/desktop widths. Inspect canonical, hreflang, robots and JSON-LD on live URLs.
5. Compare checkout errors and actual orders with the normal baseline before announcing the new site broadly. Complete a test transaction and order/analytics receipt only when the owner resumes the deferred payment test.

## Rollback

If purchases fail, the wrong variants/totals reach checkout, essential support is unavailable, or widespread navigation/SEO failures appear, republish **Dawn 133779652768**. Recheck live cart → Chekly and order receipt immediately. Keep Kalles unpublished for repair. Theme rollback does not reverse orders, payments, catalog changes or external app configuration; handle those separately. Do not delete either theme.

Catalog taxonomy, menu restructuring and breadcrumb redesign are deferred until after migration.
