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
      const inbox = header.querySelector('#app-inbox');
      const bellTemplate = header.querySelector('.nbk-header-bell-template');
      const wishlistTemplate = header.querySelector('.nbk-header-wishlist-template');
      let shadowRoot;
      let shadowObserver;
      let frame;
      let retry;
      let shadowRetries = 0;
      const inboxStyles = `
        .js-pull-notification-call-button-container {
          width: var(--nbk-control-width, 44px) !important;
          height: 44px !important;
        }
        .js-pull-notification-bell-icon {
          width: var(--nbk-glyph-size, 20px) !important;
          height: var(--nbk-glyph-size, 20px) !important;
          color: #000 !important;
          transform: none !important;
          transition: none !important;
        }
        .js-pull-notification-bell-icon > svg:not(.nbk-header-icon) { display: none !important; }
        .js-pull-notification-bell-icon > .nbk-header-icon { display: block; width: 100%; height: 100%; }
        .js-pull-notification-messages-counter {
          top: 0 !important; right: 0 !important;
          width: auto !important; min-width: 18px !important; height: 18px !important;
          padding: 0 3px !important; border-radius: 9px !important;
          background: #ccf951 !important; color: #000 !important;
          font-size: 10px !important; line-height: 18px !important;
        }
      `;
      const scheduleWidgets = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(styleWidgets);
      };
      function styleWidgets() {
        // Wishlist Hero replaces the link contents. Only restore its decorative glyph.
        if (wishlist && wishlistTemplate && !wishlist.querySelector('.nbk-header-icon')) {
          wishlist.prepend(wishlistTemplate.content.cloneNode(true));
        }
        const host = inbox?.querySelector('.js-pull-notification-call-button-host-element');
        const root = host?.shadowRoot;
        if (host && !root && shadowRetries++ < 120) {
          clearTimeout(retry);
          retry = setTimeout(scheduleWidgets, 250);
        }
        if (!root || !bellTemplate) return;
        // Keep the native Yespo call control, listeners and unread counter.
        if (shadowRoot !== root) {
          shadowObserver?.disconnect();
          shadowRoot = root;
          shadowObserver = new MutationObserver(scheduleWidgets);
          shadowObserver.observe(root, { childList: true, subtree: true });
        }
        if (!root.querySelector('[data-nbk-header-inbox-style]')) {
          const style = document.createElement('style');
          style.dataset.nbkHeaderInboxStyle = '';
          style.textContent = inboxStyles;
          root.append(style);
        }
        const glyph = root.querySelector('.js-pull-notification-bell-icon');
        if (glyph && !glyph.querySelector('.nbk-header-icon')) {
          glyph.append(bellTemplate.content.cloneNode(true));
        }
      }
      const widgetObserver = new MutationObserver(scheduleWidgets);
      if (wishlist) widgetObserver.observe(wishlist, { childList: true, subtree: true });
      if (inbox) widgetObserver.observe(inbox, { childList: true, subtree: true });
      styleWidgets();
      const update = () => controls.forEach(([control, destination, before], index) => {
        if (!control || !destination) return;
        if (mobile.matches) destination.insertBefore(control, before);
        else anchors[index].after(control);
      });
      update();
      mobile.addEventListener('change', update);
      header.closest('.shopify-section')?.addEventListener('shopify:section:unload', () => {
        mobile.removeEventListener('change', update);
        widgetObserver.disconnect();
        shadowObserver?.disconnect();
        cancelAnimationFrame(frame);
        clearTimeout(retry);
      }, { once: true });
    });
  }
  init();
  document.addEventListener('shopify:section:load', event => init(event.target));
})();
