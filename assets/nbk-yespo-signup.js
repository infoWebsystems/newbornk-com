(() => {
  if (customElements.get('nbk-yespo-signup')) return;

  customElements.define('nbk-yespo-signup', class extends HTMLElement {
    connectedCallback() {
      this.button = this.querySelector('button');
      this.message = this.querySelector('[role="status"]');
      this.button.disabled = false;
      this.openForm = () => {
        this.message.hidden = true;
        this.button.disabled = true;
        let attempts = 0;
        const open = () => {
          this.timer = null;
          if (!this.isConnected) return;
          if (typeof window.eS === 'function') {
            try {
              // Official invocation from the published production Yespo form.
              window.eS('showForm', { formVariantId: this.dataset.formVariantId });
            } catch {
              this.message.hidden = false;
            }
            this.button.disabled = false;
          } else if (++attempts < 20) {
            this.timer = setTimeout(open, 250);
          } else {
            this.message.hidden = false;
            this.button.disabled = false;
          }
        };
        open();
      };
      this.button.addEventListener('click', this.openForm);
    }

    disconnectedCallback() {
      clearTimeout(this.timer);
      this.button?.removeEventListener('click', this.openForm);
    }
  });
})();
