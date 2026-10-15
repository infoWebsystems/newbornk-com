# Kalles final release preparation — 15 October 2026

Production is still Dawn `133779652768`; candidate `199582843040` remains unpublished. This pass closes the footwear, FAQ wording and English KeyCRM findings. Publication and checks on the live theme remain separate steps.

## Changes and evidence

- Footwear: browser-tested EU 42 in UK/EN, combined EU 42 + 42.5, EU 42 2/3 and clearing. Counts are 11, 11, 13 and 1. All 36 card/result checks have an available matching EU variant in the public product data. The previously incorrect Saucony navy result is absent; Admin confirms its EU 42 is unavailable and its EU 46 is available. No catalog or stock changes were necessary. This verifies present behavior; it does not establish why the historical search-index mismatch occurred or audit every footwear item.
- FAQ page `85075787936`: backed up the original body and translations, then replaced only the purchase-date phrase with 14 days from receipt in UK and EN. Fresh digest used for EN registration; readback matches and `outdated=false`. The existing three-working-day refund processing statement was preserved. Store-wide page content affects Dawn too and is not reverted by rolling back the theme.
- KeyCRM: created native widget `NEWBORN K — English` in the owner's authenticated account. It routes to the existing `Чат` channel, with the same public contacts, daily 11:30–20:30 schedule and `#C7EC51` color. Saved values were reopened and verified. The original Ukrainian widget was not edited. `snippets/nbk-keycrm-chat.liquid` selects the public EN widget token only for `request.locale.iso_code == 'en'`, with the original widget as fallback. Both widgets were opened in the preview and their localized greeting/placeholder verified without sending messages.
- Only `snippets/nbk-keycrm-chat.liquid` was uploaded to the existing preview. Admin readback matches the local file byte-for-byte. Theme ID, translations, settings, layout and checkout integrations were preserved.

## Candidate reconciliation

Compared all 705 Git-tracked theme files at `7ec4a4e` with a fresh candidate download before the snippet update. There are 46 JSON files with formatting/comment-only differences. Settings, app embeds, header and footer settings are semantically equal.

Preserve these existing remote differences; do not perform a blind full-theme push:

| Path | Difference / handling |
| --- | --- |
| `layout/theme.liquid` | Existing app-injected Chekly customer/config/script block, previously documented in the October acceptance audit. Retained byte-for-byte. |
| `assets/chekly-script-custom.js` | Remote app-managed script differs from the Git copy. Retained. No checkout code change or payment certification in this pass. |
| `assets/cekly_gb.aov-cartdrawer-checkout-extension.js` | Existing remote-only app asset; retained, not newly enabled. |
| `templates/collection.json` | Shopify has removed the Avada app block from an otherwise empty apps section. Preserve remote state; the custom after-grid content remains present and rendered. Do not restore a stale app reference by overwriting the template. |
| `templates/page.outlet.json` | Remote omits four empty `block_order` arrays. Preserve equivalent remote serialization. |
| `config/markets.json` | Warsaw `pl` market mapping remains in Git but is absent from the Kyiv candidate. Do not upload that stale Warsaw mapping to Kyiv. |

The deployable release is the existing tested candidate with the localized chat snippet, not a new upload of the vendor package. Merge the snippet PR into `kalles-main`, retain these recorded remote differences, and publish this exact candidate only on the owner's release instruction.

## Backups and validation

Evidence directory on the owner's machine: `/Users/mac/Documents/Codex/2026-09-13/py/work/kalles-release-2026-10-15/`.

- `backup-dawn.zip`: all 402 downloaded production theme files before this pass.
- `backup-kalles.zip`: all 705 downloaded candidate files before this pass.
- `backup-*-sha256.json`: per-file checksums. Theme rollback target remains Dawn `133779652768`; neither theme was deleted.
- `candidate-comparison.json`: complete path-level comparison, with generated JSON formatting normalized.
- `faq-before.json`, `faq-after.json`: content backup/readback.
- `filter-browser-cases.json`, `filter-products.json`, `filter-availability-verification.json`: 36/36 successful availability comparisons.
- `keycrm-ua-before.json`, `keycrm-en-after.json`, `keycrm-*-preview.png`: saved configuration and rendered proof.
- `keycrm-preview-upload.json`, `keycrm-preview-readback.json`: selective upload and exact readback.

Validation: 63 JavaScript tests and 61 Liquid tests pass, including localized widget routing and fallback. Shopify CLI Theme Check reports 3,912 errors on both a fresh `7ec4a4e` baseline and the changed tree; the findings are identical, with none on the changed snippet. The old October report's 3,872 figure is historical, not the result of this run. The bundled skill validator still lacks `@shopify/theme-check-common`; the installed CLI was used instead. The complete vendor theme is not lint-clean.

## Remaining release steps

1. Merge this release change into `kalles-main` and confirm no intervening theme-editor/app edits. If release is delayed, refresh backups and the candidate comparison.
2. Publish candidate `199582843040` in an agreed release window with the owner available to check actual orders.
3. Verify the live site outside preview: UK/EN, mobile/desktop, catalog filters, product variants, cart, redirects, support/reviews, canonical/hreflang/JSON-LD. Preserve Dawn for immediate rollback if critical purchase or navigation failures appear.

Yespo confirmation/welcome, a paid Chekly test order and App Inbox billing remain owner-deferred. They were not retested or passed here. No order, subscription, customer message, billing change or production publication occurred.
