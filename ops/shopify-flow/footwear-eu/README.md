# Footwear EU metadata maintenance

These sources belong to the dedicated native Shopify Flow workflows in the Kyiv store. They are operational code, not theme assets. Shopify does not deploy them when the theme branch is merged. Update the Run code action in Flow and verify the native workflow before treating a source edit as deployed.

## Event workflows

Use `event-normalize.mjs` with the corresponding input/output GraphQL in both workflows:

1. **NEWBORN K — Footwear EU size — inventory sync**: Product variant inventory quantity changed.
2. **NEWBORN K — Footwear EU size — variant added**: Product variant added.

Both target the triggering `productVariant.id`:

- If `shouldWrite`, update `custom.footwear_size_eu` to `euSize`. If `productVariant.availableForSale`, also update `custom.footwear_size_eu_available`; otherwise remove only the available field.
- Otherwise, remove both dedicated footwear fields. Never alter raw size options, SKU or inventory.

The parser requires the exact `Взуття` product tag, one recognized size option and one literal EU measurement. It accepts EU 10–80 and ordinary numeric sizes or thirds/halves; it does not infer EU from US/CM. Unsupported or ambiguous text is excluded from the index.

## Scheduled reconciliation

**NEWBORN K — Footwear EU size — hourly reconciliation** covers imported size edits that do not trigger an inventory event. Its Run code action must run before the For each step because Shopify Flow does not support Run code inside a loop. Read the full current product/variant input before producing rows. Only changed rows should reach the loop.

Register exact variant metafield aliases through Flow's variable picker before using them in Run code. Ordinary Admin GraphQL arguments/aliases cannot simply be pasted into Flow's input schema. Keep the exported input query and native alias configuration in agreement.

| Flow alias on `ProductVariant` | Metafield |
| --- | --- |
| `canonicalEu` | `custom.footwear_size_eu` |
| `availableEu` | `custom.footwear_size_eu_available` |

Each lookup returns `{ value }`, or `null` if the field is absent. The workflow's harmless Log output step registers these native aliases; its message contains no catalog payload. The product query is `status:active AND tag:Взуття`, sorted by ID with a maximum of 100 root records.

For each output row, use that row's variant ID, EU value, validity and availability flags. Do not use a global or first variant ID. Unknown sizes with old metadata require removal; unchanged or unrecognized variants without metadata require no action.

Guard failures must stop before any writes. Partition the retrieval if it reaches 100 products, a variant list is incomplete, output exceeds the row ceiling or its conservative 48KB limit. Shopify's Get product data and Run code output limits are not pagination. Inspect failures in Flow and adjust partitions as the footwear catalog grows; do not remove guards or silently truncate data.

## Operational boundaries

- Native events and search indexing are asynchronous. A stock change during reconciliation can make its snapshot stale. Event-driven maintenance and a later reconciliation repair metadata, but this is not an atomic stock check. The cart/product picker uses native variant availability.
- Reconciliation selects active products tagged `Взуття`. When removing that tag, explicitly remove both dedicated fields from that product's variants; a stock event may clean them later, but the scheduled tagged-product query will not select it.
- Catalog snapshots and tenant-specific `.flow` exports are kept in the local audit artifacts, outside Git. Export native workflows after a change and compare the Run code script/input/output and action mappings with these sources.
- Before changing inventory policy to allow backorders, review the storefront phrase “in stock”: the data contract is Shopify `availableForSale`.

See [the theme/data contract and acceptance checks](../../../docs/FOOTWEAR_SIZES.md). Run the synthetic maintenance tests with `node --test tests/footwear-flow.mjs` from the repository root.
