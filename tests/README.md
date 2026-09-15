# Kyiv Kalles regression checks

Run from the repository root with Node.js 22 or newer. No dependencies or Shopify credentials are required.

```sh
node --test tests/*.cjs tests/*.mjs
```

- `checkout-tracking.cjs` exercises the unchanged Chekly tracking manager: fresh and saved click IDs, precedence, encoding, and existing campaign parameters.
- `product-selection-analytics.cjs` covers consent-gated GA4 selection events, normal/keyboard/middle-click navigation, excluded controls, malformed data, and Kalles image/title link integration with collection context.
- `kalles-cart-analytics.cjs` covers drawer reopening, quantity changes while open, GA4 routing and amounts, duplicate initialization, delayed consent, refusal/revocation, stale requests, late mounting, missing config, empty/malformed carts and failed requests.
- `kalles-product-runtime.mjs` executes the actual StickyATC and carousel ClassNames implementations in small DOM fixtures. It reproduces the former missing-input and empty-carousel crashes, verifies variant changes update the submitted ID, and checks carousel classes after selection and emptying.

The AOV-specific test and checklist were replaced with the Kalles cart adapter tests. The former `cart-quantity-error.cjs` exercised the removed Dawn `assets/cart.js`; it was removed with that implementation. These tests do not assert that Kalles has Dawn's custom recovery behavior after a failed quantity request. Verify cart quantity limits, server failures and retry behavior in the Shopify preview before publication.

## Browser checks

1. Use the unpublished Kyiv Kalles preview. Confirm the displayed preview theme before testing.
2. Check a product with multiple variants. Choose another size and add it from the sticky cart button; confirm the chosen variant and quantity in the drawer.
3. Open a product page with no recently viewed products. Confirm the carousel causes no console exception.
4. With analytics denied, opening the drawer and clicking a product must not emit the custom GA4 events or fetch the cart for analytics.
5. With analytics allowed, product image/title links emit `select_item` to `G-6WKK4C3QWJ`. Opening a nonempty drawer emits one `view_cart` with `cart_source=kalles_drawer`, current currency, total and items. Changing quantity while open emits no extra view; closing and reopening emits one new view.
6. Verify Google Tag Assistant separately if confirming delivery to GA4. Unit tests and data-layer entries establish local behavior, not receipt by Google.
7. Restore only the test items/quantities changed during verification; no completed order is needed.
