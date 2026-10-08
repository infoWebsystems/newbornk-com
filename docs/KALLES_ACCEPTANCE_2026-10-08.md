# Kalles acceptance audit — 8 October 2026

The owner deferred Yespo confirmation/welcome testing, a Chekly purchase and the App Inbox plan upgrade. They are follow-up tasks, not completed checks. This pass checked policy consistency and representative UA/EN storefront flows. No theme was published, order placed, subscriber created or message sent.

## Current release state

- PR #92 is merged. The initial reviewed revision was `50099af`; the follow-up changes are based on merged `kalles-main` revision `859bae3`.
- Dawn `133779652768` remains `MAIN`.
- Kalles `199582843040` remains `UNPUBLISHED`.
- Preview: https://newbornk.com/?preview_theme_id=199582843040
- This is a representative acceptance pass, not a full catalog or every-device audit.

## Initial checks and results

| Check | Evidence / result |
| --- | --- |
| Desktop navigation | UA and EN navigation render at 1280px. New Arrivals is present; SALE is red and Footwear is black. One globe in the header. Men's mega menu contains categories, brands, promotional image and product cards. Menu wraps to two rows at 1280px without overlap. |
| Mobile navigation | UA and EN menus open at 390px and contain New Arrivals. The EN mobile contact address remains Ukrainian. |
| Sorting and pagination | EN New Arrivals sorted by ascending price; the URL changed to `sort_by=price-ascending` and results changed. Load more increased the counter from 16/248 to 32/248. |
| Footwear filter | EU 42 returns 12/12 products, but one confirmed false positive remains; see below. Native filter navigation works, availability accuracy is not accepted. |
| Product sizes | Compact EU buttons retain original US/EU/CM reference. UA unavailable 42 → available 46 updates the variant, reference and purchase button. The equivalent EN check passed after reopening; an earlier failed product JSON request left the old disabled state. |
| One size | Multi-tool card's sole size is already selected and Add to cart is enabled. No size click is required. The raw `Size` option label remains English on this UA product. |
| Search | Mobile UA predictive search for `multi-tool` returned the correct card and opened its product page. |
| Wishlist | Added the multi-tool to native Kalles wishlist; control changed to Remove. Removed that test item and restored the original zero count. |
| Cart | Existing two lines / three units displayed the correct quantities and existing discount, subtotal UAH 10,413. No cart quantity was changed. A legacy `unique_id` line property is visible to the customer. Chekly was not opened in this pass. |
| REZ | Sold-out EU 42 opens the restock form with the exact EU 42 variant selected. No email submitted. Button and form remain Ukrainian on `/en/`. |
| Reviews | Judge.me initializes with localized Customer Reviews / Відгуки клієнтів headings and the appropriate empty state on the sampled products. No review submitted. |
| Support | KeyCRM launcher opens Telegram, Instagram, Messenger, WhatsApp and chat input. At 390px the launcher ends at y=774, above the bottom toolbar. No message sent. Its greeting/offline text remains Ukrainian on EN. |
| Payment block | EN block renders five payment methods and four delivery methods. Payment badges render on product and footer. This is display evidence, not a fresh checkout/payment verification. |
| Responsive / SEO | Seven rendered samples across UA/EN home, collection and products have one H1, one canonical, correct language alternates and parseable JSON-LD; no horizontal overflow at the tested 390/1280px widths. Product canonical removes collection paths, variant and tracking query parameters. Offers show UAH prices and per-variant stock states matching the sampled product. |
| Google Search Console | Sitemap last downloaded 6 October, zero reported errors/warnings. Home, New Arrivals and EN Men's collection are indexed with matching Google/user canonicals. This reflects the existing live site, not indexing of unpublished Kalles. |

## Confirmed footwear mismatch

Collection tested:
https://newbornk.com/en/collections/choloviche-vzuttia?filter.v.m.custom.footwear_size_eu_available=42

It returns Saucony PROGRID OMNI 9 DISRUPT navy, handle `krosivki-progrid-omni-9-disrupt-temno-sini`.

Fresh Admin and public Ajax responses agree:

| Variant | Current availability | Filter source field |
| --- | --- | --- |
| `56861262250144`, EU 42 | `availableForSale=false`, quantity 0 | `custom.footwear_size_eu_available` is absent |
| `56861262446752`, EU 46 | `availableForSale=true`, quantity 1 | value `46` |

Do not change stock or restore an incorrect EU 42 field to hide the mismatch. The current data is correct. Investigate storefront search-index freshness / filter behavior, then repeat the unavailable-42 regression, fractional size, multi-select and clear-filter checks. The precise cause is not established by this read-only pass.

The first EN product visit also logged `not loaded json` and left the old disabled purchase state after selecting EU 46. Fresh UA and EN visits succeeded, and both public product JSON endpoints subsequently returned HTTP 200 with correct stock. Treat this as an intermittent request-failure recovery issue, not proof that all EN variant selection is broken.

## Payment, shipping and returns inconsistencies

Eight current Shopify source/translation resources were read. Their English bodies exist and are not marked outdated; the contradictions are in the source content itself.

| Topic | Current mismatch | Proposed correction |
| --- | --- | --- |
| Payment / carriers | Shipping policy mentions cryptocurrency, cash to courier and international DHL. The product summary derived from the previous Chekly inspection lists plata, LiqPay, mono instalments, PrivatBank instalments, payment on receipt; Nova Poshta, Ukrposhta, pickup and Uklon. | Use one approved method list in the product summary, payment page and shipping policy. Confirm whether crypto/DHL still exist before removing their promises. No fresh Chekly verification was performed. |
| Taxi | Shipping policy allows cash to courier; Payment & Delivery and product block require full prepayment. Product block additionally offers Uklon free from UAH 20,000. | Adopt one taxi rule and carry the Uklon threshold to the full terms if it is still current. |
| Dispatch / transit | Shipping policy says a maximum of two days overall. Payment page/product block separate dispatch 0–1 business day and transit 1–2 business days. | Separate dispatch and transit everywhere; avoid an inconsistent total-delivery promise. |
| Return window | Return page/policy says 14 days from receipt; FAQ and legal notice use purchase-day wording. | Choose one accurate start event and repeat it consistently in UA and EN. |
| Refund timing | Return text describes inspection/processing, three business days, up to 10 business days for receipt and up to 30 at a bank. FAQ says 15 minutes–3 days and immediate in-store refund. Legal notice clause 7.2.2 says up to 10 days, while other clauses use 3 or 14 days. | Separate store processing from bank settlement; approve one policy before replacing all copies. These are content discrepancies, not a legal compliance conclusion. |
| Refund method | Return page/policy requires the same original account/card. FAQ/legal notice also mention cash. | State the method for each original payment channel consistently. |
| Offer documents | `/pages/public-agreement` and `/policies/legal-notice` contain different offer texts. `/policies/terms-of-service` is only a purchase-procedure fragment. Legal notice refers to missing clause 7.2.4. | Maintain one complete approved offer version and repair the missing cross-reference. Preserve current URLs. |

Sources: [Payment & Delivery](https://newbornk.com/pages/order-and-delivery), [Returns](https://newbornk.com/pages/return), [FAQ](https://newbornk.com/pages/faq), [Public agreement](https://newbornk.com/pages/public-agreement), [Shipping policy](https://newbornk.com/policies/shipping-policy), [Refund policy](https://newbornk.com/policies/refund-policy), [Legal notice](https://newbornk.com/policies/legal-notice), [Terms](https://newbornk.com/policies/terms-of-service).

The already-approved free-shipping rule is consistent in the three previously updated bodies: from UAH 5,000, fully prepaid, to a Nova Poshta branch or parcel locker. No new business terms or policy bodies were changed in this audit.

## Next work

1. Resolve the EU availability filter false positive and retest its stock-sensitive cases.
2. Consolidate the contradictory payment/delivery/return content using one approved source, then refresh EN against it.
3. Complete the remaining native app/menu language details: REZ, KeyCRM greeting, mobile address and raw Size label. Yespo work remains deferred by the owner.
4. Repeat the intermittent EN variant request failure and verify recovery. During one locale change the preview fell back to live Dawn; reopen the exact preview ID when this occurs and do not count Dawn as Kalles evidence.
5. After corrections, take fresh theme/settings backups and publish only on the owner's release instruction. Yespo, paid Chekly order and Inbox billing remain explicitly deferred, not passed.

Evidence archive: `work/kalles-final-audit-2026-10-08/` alongside the repository, containing the Admin snapshot, browser metadata, GSC responses and screenshots. Full stock, catalog, order, app and theme settings were not changed.


## Follow-up corrections — 8 October 2026

The owner approved removing cryptocurrency/DHL and processing refunds within three business days after receipt and inspection; bank settlement remains separate.

### Theme and app corrections completed

- Product JSON and section requests retry transient failures once and evict failed cached promises. Cache keys include locale, handle, section/options and page count. An optional product JSON failure no longer prevents the picker from initializing.
- A failed variant request restores the last confirmed choice, restores the purchase button state, clears the loading state and shows a localized retry message. A subsequent attempt can succeed. Main-form purchase buttons are disabled while the new size is loading.
- Recognized size labels use native locale strings, including Ukrainian `Розмір`; original option names and variant values are unchanged.
- Mobile contact address uses the existing locale address while preserving the contact links. The EN drawer was opened at 390 px and showed `20 Velyka Zhytomyrska Street, Kyiv`.
- REZ's native English translation was saved and read back for the button, modal, success/error/consent text and email labels. The EN sold-out EU 42 form showed the correct variant and English copy. No signup or email was sent. The Ukrainian original remains, with one previously English mixed-stock subtitle translated.
- Browser verification after the upload: EN Saucony unavailable 42 → available 46 updated the URL to variant `56861262446752`, retained US/EU/CM reference and enabled both main and sticky Add to cart buttons. UA multi-tool card showed `Розмір: One size`, selected sole option and enabled Add to cart without a size click.
- 63 JavaScript tests and 50 Liquid render tests pass. New failure-recovery tests cover retry, cache eviction, permanent HTTP failure, cache identity and restored picker state. Theme Check reports 3,872 inherited errors, identical to the baseline with zero new findings. The whole vendor theme is not lint-clean.
- Twelve changed theme files were selectively uploaded to unpublished theme `199582843040`. Main uploads matched readback checksums; five additional locale files matched parsed JSON after Shopify added its generated-file comment. Theme settings were not uploaded. Dawn remains MAIN.

### Store-wide content completed

The UA body and fresh EN translation were updated and read back for `/pages/order-and-delivery`, `/pages/return` and `/pages/faq`. The payment page now uses the five payment/four delivery choices and the existing PDP thresholds. Refund processing on Returns and FAQ uses the owner-approved three-business-day wording. These changes affect the current live store independently of the theme.

### Findings still open

1. **EU 42 filter accuracy:** all nine Saucony variant fields were inspected. Only EU 46 is available and carries the available-size field; no duplicate EU 42 exists. Search & Discovery filter `133483593888` uses the intended variant metafield, with no grouped values. The false positive remains. Saving the same title/handle did not change `updatedAt`, so no reindex was demonstrated. No inventory or available-size values were modified. Shopify documents possible search-index delays of 24–48 hours; this is a possible cause, not a confirmed diagnosis. Recheck unavailable EU 42, fractional, multi-select and clear-filter cases before accepting the filter.
2. **Policy copies / offer:** the Shopify mutation lacks `write_legal_policies`. Automatic approval review rejected the public-agreement write and the later shipping-policy UI save because the complete, legally consequential replacement had not been reviewed and could retain conflicting terms. Neither was bypassed. Shipping, refund, legal notice, terms and public-agreement bodies remain unchanged in this follow-up. Exact full UA/EN replacements and a hash manifest are prepared outside Git in `work/kalles-final-fixes-2026-10-08/policies-review.html` for owner approval. The offer proposal consolidates three current versions using `/pages/public-agreement` as its base and the approved payment/delivery/refund clauses. Other existing offer clauses are preserved. The separate FAQ return-window wording (purchase vs receipt) remains unresolved and is not silently changed.
3. **KeyCRM EN greeting:** the existing Ukrainian chat works. The vendor documents separate widgets for multiple languages. Account/settings URL requested from the owner; no widget token or greeting was guessed or overwritten.
4. **Deferred:** Yespo confirmation/welcome, a Chekly purchase and App Inbox billing remain owner-deferred. This follow-up did not send email/chat, create an order, change billing or publish Kalles.

Sources: [Shopify filter troubleshooting](https://help.shopify.com/en/manual/online-store/storefront-search/search-and-discovery-filters), [KeyCRM widget FAQ](https://help.keycrm.app/uk/communication-channels/pitannia-vidpovidi-faq-vidzhiet-onlain-chatu).

Follow-up evidence: `work/kalles-final-fixes-2026-10-08/` alongside this repository. The policy preview and app configuration changes are not applied by merging this PR.


## Owner-approved policy publication

After reviewing `policies-review.html`, the owner approved publication. Fresh source readback confirmed that none of the five destinations had changed since the review; all six reviewed source/translation files matched the saved SHA-256 manifest.

- Published the reviewed Ukrainian shipping and refund policy bodies through Shopify's native policy editor, each with a successful save.
- Published the reviewed complete offer at `/pages/public-agreement`, `/policies/legal-notice` and `/policies/terms-of-service`.
- Registered all five English body translations against fresh source digests, with no user errors. Final readback confirms exact EN matches and `outdated=false` on all five resources.
- Policy source bodies match byte-for-byte. The Page body differs only in Shopify's whitespace between HTML tags. All three offer copies therefore contain the same reviewed text.
- Browser verification of `/en/policies/shipping-policy` in the exact Kalles preview showed all five payment choices, the approved delivery methods/thresholds and English copy. Publication evidence is `policies-published-verified.json` and `policies-published-en.png` in the existing evidence archive.
- The previous policy/offer publication block is resolved. The separate FAQ purchase-vs-receipt wording question is still pending. EU filtering and KeyCRM EN also remain open; deferred Yespo/Chekly/billing checks are unchanged.
- No theme publication occurred: Dawn is MAIN and Kalles is UNPUBLISHED.

## Refund-policy rendering correction — 9 October 2026

The Ukrainian refund source was a standalone HTML document. Shopify's policy renderer removed its document/style tags but displayed the stylesheet contents as prose. The previous source readback and English shipping check did not catch this Ukrainian rendering defect.

- Replaced the refund policy body with a semantic HTML fragment. All approved body prose and link destinations are unchanged; only document metadata, CSS, decorative section numbers and the redundant body heading were removed. Verified text and link equivalence before saving.
- Refreshed the existing English translation against the new digest; the English text is unchanged and `outdated=false`. The other seven audited resources are unchanged in final readback.
- Kalles uses the existing UA/EN/RU labels for refund and shipping titles, including page/social titles, retains one native H1, and applies readable policy-only typography. Other policy types and locales retain their Shopify titles.
- Verified Ukrainian refund in the user's narrow browser view and English refund plus Ukrainian shipping on desktop: no printed CSS, one H1, localized titles, unchanged processing terms and no desktop horizontal overflow. Saved `refund-uk-mobile.png` and `refund-en-desktop.png`.
- All 53 Liquid render tests pass, including actual layout fixtures for localized policies, fallback titles and unchanged ordinary pages. Shopify CLI Theme Check reports the same 3,872 inherited errors with no findings on the three changed theme files. The skill's standalone validator could not run because its installed package lacks `@shopify/theme-check-common`; the installed Shopify CLI provided validation instead.
- Uploaded three files only to unpublished theme `199582843040`, with exact readback. The preview contains an app-injected Chekly block absent from Git; it was preserved byte-for-byte when applying the layout patch. Future layout deployments must preserve or reconcile app-managed changes rather than overwrite them blindly. No checkout configuration was changed.
- Evidence and before/after source snapshots are in `work/kalles-policy-format-fix-2026-10-09/` alongside this repository. Dawn remains MAIN; Kalles was not published.
