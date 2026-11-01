# KREW page consolidation — 2 November 2026

The canonical page is `/pages/newborn-krew`; its English version is `/en/pages/newborn-krew`. Both use `page.newborn-krew` and the existing information-page typography. The responsive table preserves the approved thresholds and named tiers (1–15%). Content is maintained in the Shopify page resource and Translate & Adapt; `docs/content/newborn-krew.*.html` records the published copy.

Shopify changes already applied:

- Updated page `112935862432` and its English title/body translation. Removed legacy editor markup, the CREW/KREW naming inconsistency and conflicting account-feature promises.
- Changed the loyalty item in `footer-top` to page `112935862432`, preserving menu item identity and other menu entries.
- Hid the duplicate page `114172625056`; retained its content for recovery.
- Added `/pages/loyalty-program` → `/pages/newborn-krew` and `/en/pages/loyalty-program` → `/en/pages/newborn-krew` redirects.
- Verified both old addresses return HTTP 301, both destinations return HTTP 200, have one H1 and a self-referencing canonical, and contain no links to the old page.

This content consolidation does not change Shopify discounts or BAS calculations.

Welcome-popup changes remove percentage-height/flex constraints from nested Yespo containers, keep the white card and close control anchored together, and apply the scoped stylesheet when custom elements finish upgrading. Native submission, consent and dismissal remain with Yespo.

Validation: JavaScript syntax and whitespace checks passed. Shopify Theme Check found no issues in changed files (existing findings remain elsewhere in the theme). UA/EN, mobile 360/390px and desktop were reviewed; the popup stays within its card at 360×640 and 390×844 and closes/reopens correctly. No subscription was submitted. The modified theme assets were downloaded again and compared after the scoped production upload.

Rollback: restore the previous page content and translations from the saved pre-change export, republish page `114172625056`, remove the two redirects and restore the loyalty menu resource. Revert the five theme files independently; the page has a default-template fallback if its new template is removed.
