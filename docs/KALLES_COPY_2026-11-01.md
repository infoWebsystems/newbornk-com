# Dawn content copied into Kyiv Kalles — 1 November 2026

Production remains Dawn `133779652768`. Kalles candidate `199582843040` remains unpublished. This is a copy: the production page, its template assignment and the Dawn source files are unchanged.

## Copied content

- `/pages/halloween` uses `halloween-v2` and has an empty page body. The candidate previously lacked this template and displayed only the page heading. Copied the active JSON template, six section types, scoped stylesheet and decorative icon snippet from current Dawn.
- Preserved the campaign copy, Shopify collection references, images, review excerpts and links. Product prices and availability render from Shopify. The brand discount/count labels and review count are editable campaign snapshots copied from Dawn, not live calculations. No campaign translation was added.
- Adapted review styles to suppress Kalles' additional blockquote decoration, which otherwise overlaps the existing quotation marks.
- Added the current Carne Bollente homepage banner as the first native Kalles slide, using `DESK_2.jpg` and mobile `MOB_2.jpg`. Preserved all nine previous slides and the source banner's empty destination.

## Verification

- Fresh `kalles-main` at `10369a6` has the same homepage settings as the pre-copy candidate after ignoring Shopify's generated JSON comment. No conflicting theme edits were overwritten.
- Shopify accepted the ten theme files. Readback matched all Liquid/CSS files exactly and both templates after JSON normalization. Git removes only extra trailing blank lines from copied files; executable content matches the verified preview.
- Shopify CLI Theme Check reported no findings in these ten files. The bundled skill validator could not start because `@shopify/theme-check-common` is missing; the complete inherited vendor theme is not lint-clean.
- Browser inspection in this exact candidate: desktop 1440px; mobile 319px and 390px. The landing has one H1, 16 product cards, 12 brand links, four reviews and four loaded store photos. No horizontal page overflow was observed. Review decoration is corrected. Homepage desktop and mobile images load from the intended assets.
- Earlier in the same-day readiness check, the existing Kalles cart opened the production Chekly checkout with its existing lines, quantities, discount and total retained. No order, payment, subscription or message was submitted. This does not replace the owner-deferred paid-order check.

## Preserve at release

The 49 existing candidate JSON files still match the accepted October snapshot semantically. The current Shopify layout contains an app-managed Chekly integration absent from Git. It now uses `window.Shopify.customer`, `https://chekly-app.com` and `data-checkout-domain="https://checkout.newbornk.com"`; retain these current values and the remote app-managed assets.

Do not overwrite the candidate with a full Git theme upload. The existing remote differences, including `config/markets.json`, are documented in [the October reconciliation](KALLES_PREPARATION_2026-10-15.md). This PR does not change the layout, app assets, app embeds, market settings or store-wide page data.

Merging this change does not publish or automatically deploy the preview. Publish the existing tested candidate only on a separate release instruction, keeping Dawn as the rollback theme. Yespo email delivery, a paid Chekly test order and App Inbox billing remain owner-deferred.

Preview: [Halloween](https://newbornk.com/pages/halloween?preview_theme_id=199582843040) · [Homepage](https://newbornk.com/?preview_theme_id=199582843040).

Local evidence and backup: `/Users/mac/Documents/Codex/2026-09-13/py/work/kalles-halloween-2026-11-01/` (`before/`, `source/`, `readback.json`, `theme-check.json`, `result.json`, desktop/mobile screenshots).
