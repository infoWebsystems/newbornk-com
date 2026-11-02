# Stage 3 — size context and KREW data readiness

Read-only checks on 2 November 2026. This stage is not complete and is separate from the footer preview.

## Size filters

Fresh public collection responses show:

| Collection | Distinct displayed filter values | Observation |
| --- | ---: | --- |
| All products | 92 | EU footwear facet plus mixed ordinary sizes |
| Footwear | 31 | Already uses `custom.footwear_size_eu_available`; no raw Size inputs rendered |
| Men's trousers | 32 | Letter sizes plus waist/inseam pairs and other numeric sizes |
| SANIA.JEWELER | 28 | Ring sizes with an order-availability suffix, centimetre lengths and other values |

The footwear facet already has a stock-aware variant field. Ordinary Size values cannot be merged simply because their numeric portions match. For example, a ring diameter, necklace length, clothing size and EU footwear size have different meanings.

Implementation sequence for the separate data change:

1. Export active product IDs, product type/taxonomy, vendor, option names, variant IDs/SKUs and inventory policy; retain original strings.
2. Build an explicit per-product-type size-system map: letter apparel, verified waist/inseam, verified numeric apparel, EU footwear, ring diameter, jewellery length and One size. Unknown numeric labels remain unmapped.
3. Use separate variant fields for system, display size and availability. Keep “available to order” distinct from in-stock inventory. Do not strip that information from a filter without providing the equivalent separate state.
4. Dry-run the proposed mapping with counts and exceptions. Preserve original variant IDs/SKUs and saved filter URLs; existing active filters must stay removable.
5. Add context-specific facets after mapping, verify available variants in actual results, then review the data diff before a batch update.

No catalog values were changed in this preview.

## KREW

Fresh Shopify definitions include `loyalty.online_spent`, `loyalty.offline_spent`, `loyalty.total_spent` and `loyalty.level`.

A fresh read-only sample of 50 customers with orders found:

- 37 with `offline_spent` and 37 with `total_spent`;
- 0 with `online_spent` and 0 with `level`;
- 0 with all four fields populated.

This is a sample, not an all-customer audit or an estimate of error prevalence. It does establish that the current fields cannot support a universally reliable personal progress display. Missing is not zero. A metafield modification date is not proof that BAS and Shopify were reconciled.

Before enabling personalized levels/progress:

1. Confirm the authoritative BAS-to-Shopify identity mapping and net eligible omnichannel spend, including return handling and migration cutover.
2. Produce a reconciled value with source/version, verification status and last-successful-sync time.
3. Apply the already approved KREW ladder in the discount engine and display layer consistently; compare with personal discounts using the agreed best-discount rule, without stacking a welcome discount accidentally.
4. Validate guest, verified member, incomplete/failed-sync profile, personal-discount and refund scenarios.

Until then retain useful account and programme entry points without inventing a personal balance or level. The BAS integration chat was not reachable through the thread-list tool during this check; its current progress was not verified. No customer balances or discount rules were changed.
