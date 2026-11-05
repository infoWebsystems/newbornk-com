(() => {
  const { locale, root } = document.currentScript?.dataset || {};
  if (window.nbkLocaleRouting || document.documentElement.lang !== locale) return;
  if (!((locale === 'uk' && root === '/') || (locale === 'ru' && root === '/ru/'))) return;
  const repairStorefrontLocale = window.Shopify?.routes?.root === '/en/';
  window.nbkLocaleRouting = true;

  const controls = '[hreflang], a[lang], [data-language-code], [data-locale], [data-nbk-keep-locale], localization-form, localization-form-header, .localization-form, .translation-lab-language-switcher, .language-switcher-custom, .language-switcher-mobile';
  const routeKeys = ['cart_url', 'cart_add_url', 'cart_change_url', 'cart_update_url', 'cart_clear_url', 'search_url', 'predictive_search_url', 'product_recommendations_url'];

  function correctUrl(value) {
    if (typeof value !== 'string' || !value || /^[#?]/.test(value)) return value;
    let url;
    try { url = new URL(value, document.baseURI); } catch { return value; }
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return value;
    if (/^\/(?:en|ru|uk)\/customer_authentication\//.test(url.pathname)) {
      url.pathname = url.pathname.replace(/^\/(?:en|ru|uk)/, '');
    } else {
      if (!repairStorefrontLocale || !/^\/en(?:\/|$)/.test(url.pathname)) return value;
      if (/^\/en\/localization\/?$/.test(url.pathname)) return value;
      url.pathname = root + url.pathname.slice(3).replace(/^\//, '');
    }
    if (/^https?:\/\//i.test(value)) return url.href;
    if (value.startsWith('//')) return `//${url.host}${url.pathname}${url.search}${url.hash}`;
    const corrected = `${url.pathname}${url.search}${url.hash}`;
    return value.startsWith('en/') && new URL(document.baseURI).pathname === '/' ? corrected.slice(1) : corrected;
  }

  function repairRoutes() {
    if (!repairStorefrontLocale) return;
    if (window.Shopify?.routes?.root === '/en/') window.Shopify.routes.root = root;
    [window.routes, window.themeHDN?.routes].filter(Boolean).forEach(routes => {
      routeKeys.forEach(key => {
        if (typeof routes[key] === 'string') routes[key] = correctUrl(routes[key]);
      });
    });
  }

  function normalizeElement(element) {
    if (!element.matches('a[href], form[action], [data-url]')) return;
    if (element.closest(controls)) return;
    if (element.matches('form') && element.querySelector('[name="locale_code"], [name="language_code"], [name="country_code"]')) return;
    const attribute = element.matches('a[href]') ? 'href' : element.matches('form[action]') ? 'action' : 'data-url';
    const original = element.getAttribute(attribute);
    const corrected = correctUrl(original);
    if (corrected !== original) element.setAttribute(attribute, corrected);
  }

  function normalize(node) {
    if (node instanceof Element && node.matches('a[href], form[action], [data-url]')) normalizeElement(node);
    node.querySelectorAll?.('a[href], form[action], [data-url]').forEach(normalizeElement);
  }

  document.addEventListener('nbk:routes-ready', repairRoutes);
  repairRoutes();
  normalize(document);
  document.addEventListener('DOMContentLoaded', () => {
    repairRoutes();
    normalize(document);
  }, { once: true });

  ['pointerdown', 'click', 'auxclick', 'submit', 'keydown'].forEach(type => {
    document.addEventListener(type, event => {
      repairRoutes();
      const element = event.target?.closest?.('a[href], form[action], [data-url]');
      if (element) normalizeElement(element);
    }, true);
  });

  new MutationObserver(records => {
    records.forEach(record => {
      if (record.type === 'attributes') normalizeElement(record.target);
      else record.addedNodes.forEach(normalize);
    });
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['href', 'action', 'data-url']
  });
})();
