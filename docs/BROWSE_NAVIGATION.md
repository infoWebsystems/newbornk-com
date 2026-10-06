# Kyiv browsing changes — 7 October 2026

The existing `/collections/brands` route renders the Warsaw brand-directory section in Kalles. Keeping this URL avoids changing Shopify resource assignments shared with Dawn. The directory uses children of the Kyiv top-menu Brands entry, falling back to brands-menu, preserves their actual collection URLs, and hides empty collection links. It includes search, A–Z navigation and a non-Latin/numeric group, with Ukrainian/English UI. Four legacy translated trademarks are normalized in `nbk-brand-label`; the directory sorts the displayed names. Other menu translations remain Shopify-managed.

New arrivals is injected only when absent from the configured desktop/mobile menu. The mobile menu already contains a New arrivals submenu, which is preserved without duplication. Original mega-menu indexes are unchanged.

The default, brand, outlet and lifestyle collection templates now use native Kalles load-more with a viewed/total count and progress bar. Filter parameters remain in the native next-page URL. The final page retains the completed count and removes the button; zero results do not render a progress bar.

## Validation

- 14 targeted Liquid tests passed (browse-navigation, dropdown-menu, mega-menu), including over 50 brand links, localized URLs, duplicate prevention, filtered pagination and final/empty states.
- Shopify unpublished preview 199582843040: 16 → 32 of 237 products after Load more.
- BAREEN filter: 16 → 20 of 20, 100% bar and no remaining load button.
- Ukrainian search returns a matching brand, shows a no-results state and restores all 39 navigation entries after clear.
- Desktop and 390px mobile navigation verified. English directory UI, localized links and preserved trademarks verified.
- No production theme publication or Shopify navigation mutation.

Preview: https://newbornk.com/collections/brands?preview_theme_id=199582843040
