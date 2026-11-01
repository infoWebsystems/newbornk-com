# Account entry and catalog navigation

## Store dependencies

The header and mobile menu use the Shopify menu `kyiv-catalog-navigation`.
It is a separate menu, so the original `top-menu` and `mobile-menu` remain
available for rollback. Its Ukrainian labels have native English Link
translations. Existing collection destinations remain intact.

The catalog replaces gender-specific top-level navigation with Clothing.
Both filter layouts put Shopify's native gender filter first and product type
second. The category tab retains product types. Three collection templates no
longer render the duplicated `sidebar-menu` category block. Native filter values,
counts, URLs and active-filter removal remain unchanged.

The live store's standard gender field was filled for 174 previously unclassified
products using explicit existing gender tags. Existing values were not changed;
compare-and-set prevented overwrites. All 174 values were read back successfully.
55 additional products need a taxonomy-category review before Shopify accepts
the standard field; 34 products have no explicit gender tags. Do not infer these
remaining classifications from product imagery or overwrite their taxonomy as
part of a theme deployment.

## KREW entry and measurement

The teaser is shown in the mobile menu and the main balanced footer. Its copy
does not claim that a verified loyalty balance is already available in the
hosted account. The customer-account service and unified BAS/Shopify policy are
a separate release dependency.

Events are sent to the Kyiv GA4 property only when Shopify's analytics consent
API explicitly allows analytics. Theme editor and unpublished previews are
excluded. Payloads contain only locale, signed-in state, placement, UI version
and the account destination category; no customer IDs, names, email addresses,
discount codes or balances.

| Event | Meaning |
| --- | --- |
| `nbk_krew_teaser_view` | At least half the teaser was visible for one second in a foreground page |
| `nbk_account_open` | Native account popover opened; this is not a login |
| `nbk_account_click` | Account, orders or profile link clicked |
| `nbk_krew_click` | Loyalty-program page link clicked |
| `nbk_krew_view` | Loyalty-program page viewed |
| `nbk_login_return` | A signed-out account intent was followed by a signed-in storefront return within 30 minutes in the same tab |

`nbk_login_return` is a storefront-return proxy. It does not measure every
successful login on Shopify's separately hosted account pages. Existing
historical page views cannot reconstruct a reliable historical login rate.

After deployment, verify event receipt in GA4 Realtime/DebugView with analytics
consent. Compare teaser click-through, account-link clicks per session, loyalty
page visitors per session and the return proxy over equivalent date ranges.
Segment by locale, device and `entry_point`; register custom dimensions in GA4
before relying on those dimensions in standard explorations. An increase after
release is observational, not proof of causation without a controlled experiment.

## Theme validation and release

Account-event consent/TTL tests and Liquid localization/filter tests are in
`tests/account-analytics.cjs` and `tests/liquid/browse-localization.cjs`.

Deploy only the reviewed file list. Preserve current Shopify section settings
when applying the two menu-handle changes and removing the old sidebar blocks.
Do not overwrite live `layout/theme.liquid` or `config/settings_data.json`:
checkout integration and license settings are outside this change.

Payment badges use six equal tracks in the product trust block: wallets occupy
one track each; providers and instalment/cash badges occupy two. This preserves
the four/three badge arrangement while aligning LiqPay with payment on receipt.
The footer's existing payment layout is unchanged.
