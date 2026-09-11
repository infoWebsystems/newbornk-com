# AOV drawer analytics verification

The live AOV.ai drawer did not emit `view_cart` when a product was added or the header cart link was opened. The normal `/cart` page already emitted it through Shopify's Google integration.

The theme now sends `view_cart` to `G-6WKK4C3QWJ` on each closed-to-open transition of the AOV drawer. It reads the current locale-aware Ajax cart, converts Shopify money subunits, and uses the existing `shopify_UA_<product>_<variant>` item identifier format. `cart_source=aov_drawer` distinguishes these events from native cart-page events.

The bridge checks Shopify's analytics processing permission before reading the cart for analytics and again before dispatch. Empty carts are ignored. Closing the drawer cancels pending work. Content and quantity changes while it stays open do not count as another view. The snippet is omitted on cart pages, so their existing native tracking continues.

## Automated checks

Run `node --test tests/aov-cart-analytics.cjs`.

Coverage includes reopen counts, quantity changes, UA routing, UAH values, item identifiers, duplicate initialization, delayed consent API loading, consent refusal/revocation, stale requests after close/reopen, late AOV mounting, cart-page exclusion, empty/malformed carts, and network failures.

The new snippet passes Shopify's Liquid validator. Full-file validation of `layout/theme.liquid` reports the same five existing errors on the base commit and this branch (blocking script, two preload checks, deprecated include, and missing wishlist snippet). The three-line render addition introduces no new diagnostics.

## Browser acceptance checklist

Use unpublished Shopify theme `199459766432`, "GA4 repair review - 2026-09-10". It contains these changes; production theme `133779652768` has not been changed by this fix.

1. Connect Tag Assistant to the preview and select `G-6WKK4C3QWJ`.
2. With analytics allowed and an empty cart, add the CAN GLASS test variant `57750971285664`. Expect one `add_to_cart` from the existing integration and one `view_cart` with `cart_source=aov_drawer`, `currency=UAH`, quantity 1 and value 1995.
3. Close and reopen the drawer from the header. Expect exactly one additional `view_cart` and no additional `add_to_cart`.
4. Increase quantity to 2 while open. Expect no additional `view_cart`. Close and reopen; expect one additional view with quantity 2 and value 3990.
5. Visit `/cart`. Expect one native `view_cart` with `shopify_event_name=cart_viewed`, without `cart_source=aov_drawer`.
6. Remove the test items and verify the cart is empty. Do not proceed to checkout.

As of 2026-09-11, automated checks pass and the preview contains the code. End-to-end hit verification is pending because Tag Assistant has not connected to the controlled preview tab. Do not treat a successful theme upload or data-layer push as proof that GA4 received a hit.

The integration observes AOV's current DOM classes (`.AOV-CartDrawer--open` and `#AOV-CDMinimal.AOV-CDMinimal--open`) under `#aov-cart-drawer`. Recheck this acceptance list after AOV updates. No public drawer-open event was found in the installed AOV runtime.
