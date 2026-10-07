// Move the existing controls, preserving widget state and desktop DOM order.
(() => {
  function init(root = document) {
    root.querySelectorAll('.trm-header .header').forEach(header => {
      if (header.dataset.nbkMobileHeader) return;
      header.dataset.nbkMobileHeader = 'true';
      const heading = header.querySelector('.header__heading');
      const search = header.querySelector('.header__icons .header__search');
      const wishlist = header.querySelector('#icon-wishlist-header');
      const wishlistSlot = header.querySelector('.nbk-mobile-wishlist-slot');
      const controls = [[search, heading?.parentNode, heading], [wishlist, wishlistSlot, null]];
      const anchors = controls.map(([control]) => {
        if (!control) return null;
        const anchor = document.createComment('NBK desktop control position');
        control.before(anchor);
        return anchor;
      });
      const mobile = window.matchMedia('(max-width: 989px)');
      const update = () => controls.forEach(([control, destination, before], index) => {
        if (!control || !destination) return;
        if (mobile.matches) destination.insertBefore(control, before);
        else anchors[index].after(control);
      });
      update();
      mobile.addEventListener('change', update);
      header.closest('.shopify-section')?.addEventListener('shopify:section:unload', () => mobile.removeEventListener('change', update), { once: true });
    });
  }
  init();
  document.addEventListener('shopify:section:load', event => init(event.target));
})();
