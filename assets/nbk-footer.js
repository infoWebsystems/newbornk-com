(() => {
  if (customElements.get('nbk-footer')) return;
  customElements.define('nbk-footer', class extends HTMLElement {
    connectedCallback() {
      this.mobile = window.matchMedia('(max-width: 767px)');
      this.adapt = () => {
        this.querySelectorAll('[data-mobile-collapse]').forEach(group => {
          // Preserve native details semantics. Without JS every group is open.
          group.open = !this.mobile.matches;
        });
      };
      this.mobile.addEventListener('change', this.adapt);
      this.adapt();
    }
    disconnectedCallback() {
      this.mobile?.removeEventListener('change', this.adapt);
    }
  });
})();
