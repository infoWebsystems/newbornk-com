(function () {
  'use strict';

  class AovCartDrawerCheckoutExtension {
    constructor(checkoutManager) {
      this.checkoutManager = checkoutManager;
      this.selector = '.AOV-CartDrawer-Checkout';
      this._observer = null;
    }

    init() {
      if (!this.checkoutManager) return false;
      if (typeof this.checkoutManager.processCheckout !== 'function') return false;
      if (!this.checkoutManager.eventHandler || typeof this.checkoutManager.eventHandler.addWrapperListener !== 'function') return false;
      if (this.checkoutManager.__aovCartDrawerCheckoutExtensionApplied === true) return true;

      this._attachHandlers();
      this._observeDom();

      this.checkoutManager.__aovCartDrawerCheckoutExtensionApplied = true;
      return true;
    }

    _getProcessedAttrName() {
      return this.checkoutManager?.config?.dataAttrCheckout || 'chekly-procceded';
    }

    _attachHandlers() {
      const processedAttr = this._getProcessedAttrName();
      const nodes = document.querySelectorAll(this.selector);

      [...nodes].forEach((node) => {
        if (!node || typeof node.getAttribute !== 'function' || typeof node.setAttribute !== 'function') return;
        if (node.getAttribute(processedAttr) === 'true') return;

        ['mousedown', 'touchstart', 'click'].forEach((evt) => {
          this.checkoutManager.eventHandler.addWrapperListener(node, evt, () => {
            this.checkoutManager.processCheckout();
          });
        });

        node.setAttribute(processedAttr, 'true');
      });
    }

    _observeDom() {
      if (this._observer) return;
      if (!document.body) return;

      const debounced = this.checkoutManager?.domHandler?.debounce
        ? this.checkoutManager.domHandler.debounce(() => this._attachHandlers(), 200)
        : null;

      const handle = () => {
        if (debounced) {
          debounced();
        } else {
          this._attachHandlers();
        }
      };

      this._observer = new MutationObserver(handle);
      this._observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    }
  }

  const initializeExtension = () => {
    if (typeof window === 'undefined') return;
    if (window.aovCartDrawerCheckoutExtension) return;

    const manager = window.checkoutManager;
    if (!manager) {
      setTimeout(initializeExtension, 100);
      return;
    }

    const extension = new AovCartDrawerCheckoutExtension(manager);
    if (extension.init()) {
      window.aovCartDrawerCheckoutExtension = extension;
      return;
    }

    setTimeout(initializeExtension, 100);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
  } else {
    initializeExtension();
  }

  window.addEventListener('load', initializeExtension);
})();

