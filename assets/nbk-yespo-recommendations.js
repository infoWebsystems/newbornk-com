(() => {
  const configNode = document.getElementById('nbk-yespo-recommendations-config');
  const wishlistTemplate = document.getElementById('nbk-yespo-wishlist-template');
  const main = document.getElementById('MainContent');
  if (!configNode || !main || main.dataset.nbkYespoInitialized) return;
  const config = JSON.parse(configNode.textContent);
  main.dataset.nbkYespoInitialized = 'true';
  const widgets = '.es-recom-container';
  const preparedCards = new WeakSet();
  const preparedSliders = new WeakSet();
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

  function prepareSlider(slider) {
    if (preparedSliders.has(slider)) return;
    preparedSliders.add(slider);
    if (slider.swiper && !slider.swiper.destroyed) slider.swiper.destroy(true, true);
    // Native touch/trackpad scrolling, with keyboard and mouse equivalents.
    slider.addEventListener('keydown', event => {
      if (event.target !== slider || event.altKey || event.ctrlKey || event.metaKey) return;
      const distance = { ArrowLeft: -slider.clientWidth, ArrowRight: slider.clientWidth,
        Home: -slider.scrollWidth, End: slider.scrollWidth }[event.key];
      if (distance === undefined) return;
      event.preventDefault();
      slider.scrollBy({ left: distance, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
    let drag = null;
    let dragged = false;
    slider.addEventListener('pointerdown', event => {
      dragged = false;
      if (event.pointerType !== 'mouse' || event.button !== 0 || event.ctrlKey || event.metaKey ||
        event.target.closest('button, hdt-wishlist, input, select, textarea')) return;
      drag = { id: event.pointerId, x: event.clientX, scroll: slider.scrollLeft };
    });
    slider.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const distance = event.clientX - drag.x;
      if (!dragged && Math.abs(distance) < 8) return;
      if (!dragged) {
        dragged = true;
        slider.setPointerCapture(event.pointerId);
        slider.classList.add('is-dragging');
      }
      event.preventDefault();
      slider.scrollLeft = drag.scroll - distance;
    });
    const endDrag = event => {
      if (!drag || event.pointerId !== drag.id) return;
      if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
      drag = null;
      slider.classList.remove('is-dragging');
    };
    slider.addEventListener('pointerup', endDrag);
    slider.addEventListener('pointercancel', endDrag);
    slider.addEventListener('lostpointercapture', endDrag);
    slider.addEventListener('pointerleave', event => { if (!dragged) endDrag(event); });
    slider.addEventListener('dragstart', event => event.preventDefault());
    slider.addEventListener('click', event => {
      if (!dragged || event.detail === 0) return;
      dragged = false;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
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
    prepareSlider(slider);
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
