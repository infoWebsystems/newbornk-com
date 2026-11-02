(() => {
  'use strict';
  // Observe only the toolbar. Kalles still updates cart/wishlist counts and links.
  const mounted = new WeakSet();
  const mount = (root) => {
    root.querySelectorAll('.hdt-toolbar').forEach((toolbar) => {
      if (mounted.has(toolbar)) return;
      mounted.add(toolbar);
      const sync = () => toolbar.querySelectorAll('hdt-cart-count, hdt-wishlist-count').forEach((badge) => {
        badge.hidden = Number(badge.textContent.trim()) <= 0;
      });
      sync();
      const observer = new MutationObserver(sync);
      observer.observe(toolbar, { childList: true, subtree: true, characterData: true });
      document.addEventListener('shopify:section:unload', (event) => {
        if (event.target.contains(toolbar)) observer.disconnect();
      });
    });
  };
  mount(document);
  document.addEventListener('shopify:section:load', (event) => mount(event.target));
})();
