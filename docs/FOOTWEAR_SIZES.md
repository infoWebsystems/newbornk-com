# Footwear sizes

Footwear currently stores combined US/EU/CM measurements in Shopify's size option. Kalles displays the literal EU measurement as a compact button and retains the original measurement string below the picker. It does not convert between sizing systems. Clothing keeps its existing options and ordering.

The implementation preserves original option values, option-value IDs, variant IDs, SKU and inventory settings. BAS still receives the original variant identity. The native Kalles variant-selection code handles availability and add-to-cart state. English size recognition includes Ukrainian option names because Shopify's translated catalog currently contains them.

## Data contract

Both fields are merchant-owned `PRODUCTVARIANT` metafield definitions of type `single_line_text_field`, with storefront `PUBLIC_READ` access:

| Field | Meaning |
| --- | --- |
| `custom.footwear_size_eu` | Literal EU value parsed from the original size option, including thirds such as `42 2/3`. |
| `custom.footwear_size_eu_available` | The same EU value only while this exact variant is `availableForSale`. Remove the field when unavailable or unrecognized. |

Only products with the exact `Взуття` tag participate. Unknown sizes stay visible in the product picker as their original text and are not guessed into the EU index. The theme prefers a literal EU value over metadata to avoid stale display after an external import. The current catalog uses inventory policy `DENY`; with a future `CONTINUE` policy, `availableForSale` can include backorders, so review the customer-facing availability label before changing that policy.

Search & Discovery uses the **available** field as the source for the `Розмір взуття (EU)` filter. Its native parameter is `filter.v.m.custom.footwear_size_eu_available`. A normal Size filter combined with a product availability filter does not guarantee that the selected size is the available variant; this field makes availability part of the selected value itself.

Kalles sorts the EU values numerically, including thirds, and labels selected chips with `EU`. Composite shoe sizes in the ordinary Size filter are suppressed only when Shopify supplies the new EU facet. Active legacy choices remain removable, clothing sizes remain intact, and the ordinary filter remains available while the new facet is absent.

## Maintenance

Shopify Flow maintains these two fields. The inventory workflow uses **Product variant inventory quantity changed**; the new-variant workflow uses **Product variant added**. Each parses the variant's original size and updates/removes the canonical and availability fields. Stock, SKU and raw option values are never written by these workflows.

An hourly reconciliation reads active tagged footwear and compares the two exact variant metadata fields. It emits only changed rows, so a fully synchronized catalog produces no writes. Query-completeness and output-size guards stop incomplete scans before changing data. Versioned scripts, exact Flow input/output GraphQL, alias setup, growth limits and tag-removal cleanup are documented in [the maintenance sources](../ops/shopify-flow/footwear-eu/README.md).

Stock indexing is asynchronous: native Flow execution and Shopify's search index can introduce a delay. The picker still uses the variant's current native availability. Watch Flow failures in Shopify; do not treat the filter index as inventory or a reservation system.

## October 1 verification

- Parsed all 445 variants across 56 active footwear products, without ambiguous per-product EU collisions. Filled 445 canonical values and 150 available values; readback matched current availability with no errors.
- Verified that variant IDs, SKU and original option values were unchanged.
- Fourteen focused Liquid-render tests passed. The nine uploaded theme files passed targeted validation; the existing picker warning about `hide_update_value` is unchanged. Remote Liquid files and parsed locale JSON match the working tree.
- On a 390px New Balance product page, the 16-size fieldset shrank from approximately 789px to 211px. Selecting available EU 42.5 after unavailable EU 42 updates the selected variant, original US/CM reference and purchase button. No cart item or order was created in this pass.
- English Salomon buttons display ordered fractional EU values after recognizing its translated Ukrainian option name.
- Collection cards display the `EU` prefix, four compact available size labels and the native remaining-size count; the original combined measurement stays hidden in the card's selected-value element.
- Both active event workflows were exported and compared with their versioned script/input/output. Native Flow previews verified available EU 42.5 and the unavailable EU 42 removal branch, without changing stock. These previews are not evidence of a real inventory event.
- Nine synthetic Flow test groups passed, covering parsing, unchanged metadata, changed availability, invalid-size cleanup, ID preservation, input immutability and complete-query/output guards. Native scripts, queries, schemas, alias mappings and mutation targets were independently checked against all three exported workflows.
- Search & Discovery saved the new source and displays its 31 available values. Storefront filtering is still awaiting index propagation: the facet is absent and a direct EU 42 query currently returns no products. This is **not yet a passed end-to-end filter check**. Shopify documents up to 24–48 hours for new metafield values to appear; see [filter troubleshooting](https://help.shopify.com/en/manual/online-store/storefront-search/search-and-discovery-filters#troubleshooting-filter-display-issues). An unchanged-title save on one product was a no-op and did not force reindexing.

Only the unpublished Kyiv Kalles preview received theme files. The Search & Discovery filter and metadata are store-level configuration, so any compatible live theme may display the filter once indexing completes.

## Acceptance and rollback

Before launch, verify the native EU facet on `/collections/krosivky` in Ukrainian and English, including EU 42, a fractional size, multi-select and clearing selections. Compare every returned model with an available variant of the selected EU size, including the New Balance regression where EU 42 is sold out while EU 42.5 is available. Recheck mobile layout and selected variant after filtering.

To roll back, remove the new filter from Search & Discovery and turn off the dedicated EU workflows. Revert the footwear theme commit. The ordinary size filter then remains available. The two new metadata fields can remain harmlessly stored; do not alter the original options or inventory to undo this feature. Local pre-change catalog and preview-file backups are retained with the October 1 audit artifacts.
