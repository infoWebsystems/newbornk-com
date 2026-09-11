class CartRemoveButton extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', (event) => {
      event.preventDefault();
      this.closest('cart-items').updateQuantity(this.dataset.index, 0);
    });
  }
}

customElements.define('cart-remove-button', CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();

    this.lineItemStatusElement = document.getElementById('shopping-cart-line-item-status');

    this.currentItemCount = Array.from(this.querySelectorAll('[name="updates[]"]'))
      .reduce((total, quantityInput) => total + parseInt(quantityInput.value), 0);

    this.debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, 300);

    this.addEventListener('change', this.debouncedOnChange.bind(this));
  }

  onChange(event) {
    this.updateQuantity(event.target.dataset.index, event.target.value, document.activeElement.getAttribute('name'));
  }

  getSectionsToRender() {
    return [
      {
        id: 'main-cart-items',
        section: document.getElementById('main-cart-items').dataset.id,
        selector: '.js-contents',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section'
      },
      {
        id: 'cart-live-region-text',
        section: 'cart-live-region-text',
        selector: '.shopify-section'
      },
      {
        id: 'main-cart-footer',
        section: document.getElementById('main-cart-footer').dataset.id,
        selector: '.js-contents',
      }
    ];
  }

  async updateQuantity(line, quantity, name) {
    if (this.updating) return;
    this.updating = true;
    this.enableLoading(line);
    this.showError('');

    try {
      const body = JSON.stringify({
        line,
        quantity,
        sections: this.getSectionsToRender().map((section) => section.section),
        sections_url: window.location.pathname
      });
      const response = await fetch(routes.cart_change_url, {...fetchConfig(), body});
      const state = await response.json();
      if (!response.ok || state.errors) {
        const message = [state.description, state.errors, state.message]
          .find((value) => typeof value === 'string' && value.trim());
        const availability = message?.match(/^Only (\d+) items were added to your cart due to availability\.$/);
        const failure = new Error(availability
          ? window.cartStrings.quantityError.replace('[quantity]', availability[1])
          : message || window.cartStrings.error);
        failure.cartMessage = true;
        throw failure;
      }

      this.renderSections(state.sections);
      this.setEmpty(state.item_count === 0);
      const actualQuantity = state.items?.[Number(line) - 1]?.quantity;
      const error = Number(quantity) > 0 && actualQuantity !== undefined && actualQuantity !== Number(quantity)
        ? window.cartStrings.quantityError.replace('[quantity]', actualQuantity)
        : '';
      this.showError(error);
      this.updateLiveRegions(state.item_count);
    } catch (error) {
      try {
        const sections = this.getSectionsToRender().map((section) => section.section);
        const response = await fetch(`${window.location.pathname}?sections=${encodeURIComponent(sections.join(','))}`, {
          credentials: 'same-origin', cache: 'no-store'
        });
        if (!response.ok) throw new Error();
        this.renderSections(await response.json());
        this.setEmpty(!this.querySelector('[name="updates[]"]'));
      } catch {
        this.querySelectorAll('[name="updates[]"]').forEach((input) => {
          input.value = input.defaultValue;
        });
      }
      this.showError(error.cartMessage ? error.message : window.cartStrings.error);
    } finally {
      this.querySelectorAll('.loading-overlay').forEach((overlay) => overlay.classList.add('hidden'));
      this.lineItemStatusElement?.setAttribute('aria-hidden', true);
      this.disableLoading();
      this.updating = false;
      if (name) document.getElementById(`CartItem-${line}`)?.querySelector(`[name="${name}"]`)?.focus();
    }
  }

  renderSections(sections) {
    const replacements = this.getSectionsToRender().map((section) => {
      const root = document.getElementById(section.id);
      return {
        element: root.querySelector(section.selector) || root,
        html: this.getSectionInnerHTML(sections[section.section], section.selector)
      };
    });
    replacements.forEach(({element, html}) => { element.innerHTML = html; });
  }

  setEmpty(empty) {
    this.classList.toggle('is-empty', empty);
    const footer = document.getElementById('main-cart-footer');
    footer?.classList.toggle('is-empty', empty);
    footer?.parentNode.classList.toggle('is-empty', empty);
  }

  showError(message) {
    const element = document.getElementById('cart-errors');
    if (element) {
      element.setAttribute('role', 'alert');
      element.textContent = message;
    }
  }

  updateLiveRegions(itemCount) {
    this.currentItemCount = itemCount;
    this.lineItemStatusElement?.setAttribute('aria-hidden', true);
    const cartStatus = document.getElementById('cart-live-region-text');
    cartStatus.setAttribute('aria-hidden', false);
    setTimeout(() => { cartStatus.setAttribute('aria-hidden', true); }, 1000);
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    document.getElementById('main-cart-items').classList.add('cart__items--disabled');
    this.querySelectorAll('.loading-overlay')[line - 1].classList.remove('hidden');
    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute('aria-hidden', false);
  }

  disableLoading() {
    document.getElementById('main-cart-items').classList.remove('cart__items--disabled');
  }
}

customElements.define('cart-items', CartItems);
