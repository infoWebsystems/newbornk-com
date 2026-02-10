class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('ul');
    this.sliderItems = this.querySelectorAll('li');
    this.pageCount = this.querySelector('.slider-counter--current');
    this.pageTotal = this.querySelector('.slider-counter--total');
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');
    this.dotsContainer = this.querySelector('.slider-dots');

    if (!this.slider || !this.nextButton) return;

    const resizeObserver = new ResizeObserver(entries => this.initPages());
    resizeObserver.observe(this.slider);

    this.slider.addEventListener('scroll', this.update.bind(this));
    this.prevButton.addEventListener('click', this.onButtonClick.bind(this));
    this.nextButton.addEventListener('click', this.onButtonClick.bind(this));
  }

  initPages() {
    if (!this.sliderItems.length === 0) return;
    this.slidesPerPage = Math.floor(this.slider.clientWidth / this.sliderItems[0].clientWidth);
    this.totalPages = this.sliderItems.length - this.slidesPerPage + 1;
    
    this.createDots();
    this.update(); 
  }

  update() {
    if (!this.pageCount || !this.pageTotal) return;
    this.currentPage = Math.round(this.slider.scrollLeft / this.sliderItems[0].clientWidth) + 1;

    if (this.currentPage === 1) {
      this.prevButton.setAttribute('disabled', true);
    } else {
      this.prevButton.removeAttribute('disabled');
    }

    if (this.currentPage === this.totalPages) {
      this.nextButton.setAttribute('disabled', true);
    } else {
      this.nextButton.removeAttribute('disabled');
    }

    this.pageCount.textContent = this.currentPage;
    this.pageTotal.textContent = this.totalPages;

    this.updateDots();
  }

  onButtonClick(event) {
    event.preventDefault();
    const slideScrollPosition = event.currentTarget.name === 'next' ? this.slider.scrollLeft + this.sliderItems[0].clientWidth : this.slider.scrollLeft - this.sliderItems[0].clientWidth;
    this.slider.scrollTo({
      left: slideScrollPosition
    });
  }

  createDots() {
    if (!this.dotsContainer) return;

    this.dotsContainer.innerHTML = '';

    for (let i = 0; i < this.totalPages; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slider-dot';
      dot.dataset.index = i;

      dot.addEventListener('click', () => {
        this.slider.scrollTo({
          left: i * this.sliderItems[0].clientWidth,
          behavior: 'smooth'
        });
      });

      this.dotsContainer.appendChild(dot);
    }
  }

  updateDots() {
    if (!this.dotsContainer) return;

    const dots = this.dotsContainer.children;
    const activeIndex = this.currentPage - 1;

    [...dots].forEach((dot, i) => {
      dot.classList.toggle('is-active', i === activeIndex);
    });
  }
}

customElements.define('slider-component', SliderComponent);
