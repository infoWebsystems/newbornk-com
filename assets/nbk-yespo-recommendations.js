(() => {
  const configNode = document.getElementById('nbk-yespo-recommendations-config');
  const wishlistTemplate = document.getElementById('nbk-yespo-wishlist-template');
  const main = document.getElementById('MainContent');
  if (!configNode || !main || main.dataset.nbkYespoInitialized) return;
  const config = JSON.parse(configNode.textContent);
  main.dataset.nbkYespoInitialized = 'true';
  const widgets = '.es-recom-container';
  const preparedCards = new WeakSet();
  const preparedSliders = new WeakMap();
  const products = new Map();
  const queue = [];
  let activeRequests = 0;
  let scheduled = false;

  function drainQueue() {
    while (activeRequests < 3 && queue.length) {
      const { handle, resolve } = queue.shift();
      activeRequests += 1;
      const root = config.root.replace(/\/?$/, '/');
      fetch(`${root}products/${encodeURIComponent(handle)}.js`, {
        credentials: 'same-origin', signal: AbortSignal.timeout(10000)
      })
        .then(response => response.ok ? response.json() : null)
        .then(product => resolve(Number.isSafeInteger(product?.id) && product.id > 0 ? product : null))
        .catch(() => resolve(null))
        .finally(() => { activeRequests -= 1; drainQueue(); });
    }
  }

  function getProduct(handle) {
    if (!products.has(handle)) {
      products.set(handle, new Promise(resolve => queue.push({ handle, resolve })));
      drainQueue();
    }
    return products.get(handle);
  }

  function localizeProductLinks(card) {
    card.querySelectorAll('a').forEach(link => {
      let url;
      try { url = new URL(link.href, location.origin); } catch { return; }
      if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
      let path = url.pathname;
      const prefix = (config.localePrefixes || []).find(value => path.startsWith(value));
      if (prefix) path = path.slice(prefix.length - 1);
      if (!/^\/(?:collections\/[^/]+\/)?products\/[^/]+\/?$/.test(path)) return;
      url.pathname = config.root.replace(/\/?$/, '/') + path.slice(1);
      if (link.href !== url.href) link.href = url.href;
    });
  }

  async function hydrateCard(card) {
    const link = card.querySelector('a.full-unstyled-link');
    if (!link) return;
    let url;
    try { url = new URL(link.href, location.origin); } catch { return; }
    if (url.origin !== location.origin) return;
    const match = url.pathname.match(/\/products\/([^/]+)\/?$/);
    if (!match) return;
    let handle;
    try { handle = decodeURIComponent(match[1]); } catch { return; }
    const product = await getProduct(handle);
    if (!product || !card.isConnected || !link.isConnected || link.href !== url.href) return;
    // Yespo's feed has Ukrainian names. Reuse the locale-aware wishlist lookup
    // so visible and accessible names match the current storefront language.
    if (typeof product.title === 'string' && product.title.trim()) {
      const title = card.querySelector('.card-information__text');
      const accessibleTitle = link.querySelector(':scope > .visually-hidden');
      [title, accessibleTitle].forEach(node => {
        if (node && node.textContent !== product.title) node.textContent = product.title;
      });
      card.querySelectorAll('.media img').forEach(img => img.setAttribute('alt', product.title));
    }
    if (!wishlistTemplate?.content.querySelector('hdt-wishlist') || card.querySelector('.nbk-yespo-wishlist')) return;
    await customElements.whenDefined('hdt-wishlist');
    if (!card.isConnected) return;
    const fragment = wishlistTemplate.content.cloneNode(true);
    const button = fragment.querySelector('hdt-wishlist');
    button.dataset.id = String(product.id);
    button.dataset.handle = product.handle;
    button.addEventListener('keydown', event => {
      if (event.key === ' ') { event.preventDefault(); button.click(); }
    });
    card.append(fragment);
  }

  const cardObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      cardObserver.unobserve(entry.target);
      hydrateCard(entry.target);
    });
  }, { rootMargin: '200px' });

  function addNavigation(slider) {
    if (preparedSliders.has(slider)) { preparedSliders.get(slider)(); return; }
    if (slider.swiper && !slider.swiper.destroyed) slider.swiper.destroy(true, true);
    const nav = document.createElement('div');
    nav.className = 'nbk-yespo-nav';
    const buttons = [-1, 1].map(direction => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', direction < 0 ? config.previous : config.next);
      button.setAttribute('aria-controls', slider.id);
      button.textContent = direction < 0 ? '←' : '→';
      button.addEventListener('click', () => {
        const step = slider.clientWidth;
        slider.scrollBy({ left: direction * step, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      });
      nav.append(button);
      return button;
    });
    const update = () => {
      const maximum = Math.max(0, slider.scrollWidth - slider.clientWidth);
      buttons[0].disabled = slider.scrollLeft <= 1;
      buttons[1].disabled = slider.scrollLeft >= maximum - 1;
      nav.hidden = maximum <= 1;
    };
    preparedSliders.set(slider, update);
    slider.addEventListener('scroll', update, { passive: true });
    new ResizeObserver(update).observe(slider);
    slider.after(nav);
    update();
  }

  function adaptWidget(widget) {
    const slider = widget.querySelector('.es-productsSlider');
    const cards = slider ? Array.from(slider.querySelectorAll('.card-wrapper')) : [];
    if (!cards.length) {
      widget.classList.remove('nbk-yespo-recommendations');
      return;
    }
    widget.classList.add('nbk-yespo-recommendations');
    widget.setAttribute('role', 'region');
    widget.setAttribute('aria-label', config.heading);
    const heading = widget.querySelector('h2.title');
    if (heading && heading.textContent !== config.heading) heading.textContent = config.heading;
    const related = main.querySelector(':scope > .hdt-related-products');
    if (related && !widget.dataset.nbkYespoPositioned) {
      widget.dataset.nbkYespoPositioned = 'true';
      related.before(widget);
    }
    if (!slider.id) slider.id = `${widget.id}-slider`;
    slider.setAttribute('aria-label', config.heading);
    slider.setAttribute('tabindex', '0');
    addNavigation(slider);
    cards.forEach(card => {
      localizeProductLinks(card);
      const priceLabels = { 'Звичайна ціна': config.regularPrice, 'Ціна розпродажу': config.salePrice, 'Ціна за одиницю': config.unitPrice, 'за': config.unitPriceSeparator };
      card.querySelectorAll('.price .visually-hidden').forEach(node => {
        const label = priceLabels[node.textContent.trim()];
        if (label && node.textContent !== label) node.textContent = label;
      });
      card.querySelectorAll('.card__badge .color-sale-badge').forEach(badge => {
        const text = badge.textContent.trim();
        if (config.saleBadge && /^Розпродаж(?=\s|$)/u.test(text)) {
          badge.textContent = text.replace(/^Розпродаж/u, () => config.saleBadge);
        }
      });
      if (preparedCards.has(card)) return;
      preparedCards.add(card);
      const slide = card.closest('.swiper-slide');
      if (slide) {
        slide.removeAttribute('role');
        slide.removeAttribute('aria-label');
      }
      card.querySelectorAll('.wishlist-hero-custom-button, .card__add-to-cart').forEach(control => control.remove());
      card.querySelectorAll('.media img').forEach(img => {
        img.loading = 'lazy';
        img.removeAttribute('fetchpriority');
      });
      cardObserver.observe(card);
    });
  }

  function sync() {
    scheduled = false;
    main.querySelectorAll(widgets).forEach(adaptWidget);
  }

  const observer = new MutationObserver(records => {
    if (scheduled || !records.some(record => {
      if (record.target instanceof Element && record.target.closest(widgets)) return true;
      return Array.from(record.addedNodes).some(node => node instanceof Element && (node.matches(widgets) || node.querySelector(widgets)));
    })) return;
    scheduled = true;
    requestAnimationFrame(sync);
  });
  observer.observe(main, { childList: true, subtree: true });
  sync();
})();
