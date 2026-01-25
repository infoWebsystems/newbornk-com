class ProductFormInputsWrapper extends HTMLElement {
  constructor () {
    super();

    this.trigger = this.querySelector('.product-form__inputs-trigger');
    if (!this.trigger) return;

    this.inputsList = this.querySelector('.product-form__inputs-inputs');
    if (!this.inputsList) return;

    this.inputs = this.inputsList.querySelectorAll('[type="radio"]');
    if (!this.inputs) return;

    this.onClick = this.onClick.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
  }

  connectedCallback () {
    this.trigger.addEventListener('click', this.onClick);
    this.inputs.forEach(input => input.addEventListener('change', this.onInputChange));
  }

  disconnectedCallback () {
    this.trigger.removeEventListener('click', this.onClick);
    this.inputs.forEach(input => input.removeEventListener('change', this.onInputChange));
  }

  onClick () {
    this.inputsList.classList.toggle('active');
  }

  onInputChange () {
    this.inputsList.classList.remove('active');
  }
}

customElements.define('product-form-inputs-wrapper', ProductFormInputsWrapper);