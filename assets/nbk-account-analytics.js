(() => {
  'use strict';
  const element = document.getElementById('nbk-account-analytics-config');
  if (!element || window.nbkAccountAnalytics) return;
  let config;
  try { config = JSON.parse(element.textContent); } catch { return; }
  if (config.designMode || (window.Shopify?.theme?.role && window.Shopify.theme.role !== 'main') || new URLSearchParams(location.search).has('preview_theme_id')) return;
  window.nbkAccountAnalytics = true;

  const KEY = 'nbk_account_intent_v1';
  const TTL = 30 * 60 * 1000;
  const placements = new Set(['menu', 'footer', 'header', 'toolbar', 'account_component', 'page']);
  const seen = new WeakSet();
  const observed = new WeakSet();
  const visible = new Set();
  const timers = new Map();
  let programViewed = false;
  let returnChecked = false;
  const allowed = () => window.Shopify?.customerPrivacy?.analyticsProcessingAllowed?.() === true;
  const placement = value => placements.has(value) ? value : 'page';

  function emit(name, source, details = {}) {
    if (!allowed()) return false;
    window.dataLayer = window.dataLayer || [];
    function send() { window.dataLayer.push(arguments); }
    send('event', name, {
      send_to: 'G-6WKK4C3QWJ',
      ui_version: 'krew_entry_v1',
      entry_point: placement(source),
      account_state: config.signedIn ? 'signed_in' : 'signed_out',
      site_language: config.locale === 'en' ? 'en' : 'uk',
      ...details,
    });
    return true;
  }

  function clearIntent() {
    try { sessionStorage.removeItem(KEY); } catch { /* Storage can be blocked. */ }
  }

  function rememberIntent(source) {
    if (!allowed() || config.signedIn) return;
    try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), source: placement(source) })); } catch { /* No tracking dependency for navigation. */ }
  }

  function checkReturn() {
    if (returnChecked || !allowed()) return;
    returnChecked = true;
    try {
      const pending = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (!pending) return;
      const age = Date.now() - pending.at;
      if (!Number.isFinite(pending.at) || age < 0 || age > TTL) { clearIntent(); return; }
      if (config.signedIn) {
        clearIntent();
        emit('nbk_login_return', pending.source);
      }
    } catch { clearIntent(); }
  }

  function programPage() {
    return /\/(?:pages\/(?:newborn-krew|loyalty-program))\/?$/.test(location.pathname);
  }

  function startImpression(node) {
    if (!allowed() || seen.has(node) || timers.has(node) || document.visibilityState !== 'visible') return;
    timers.set(node, setTimeout(() => {
      timers.delete(node);
      if (!node.isConnected || !visible.has(node) || document.visibilityState !== 'visible') return;
      if (emit('nbk_krew_teaser_view', node.dataset.nbkKrewTeaser)) seen.add(node);
    }, 1000));
  }

  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        visible.add(entry.target); startImpression(entry.target);
      } else {
        visible.delete(entry.target);
        clearTimeout(timers.get(entry.target)); timers.delete(entry.target);
      }
    }
  }, { threshold: 0.5 }) : null;

  function connect() {
    document.querySelectorAll('[data-nbk-krew-teaser]').forEach(node => {
      if (observed.has(node)) return;
      observed.add(node); observer?.observe(node);
    });
    for (const node of visible) {
      if (!node.isConnected) {
        visible.delete(node); clearTimeout(timers.get(node)); timers.delete(node);
        observer?.unobserve(node);
      }
    }
  }

  function sourceFor(node) {
    if (node?.closest?.('[data-nbk-krew-teaser]')) return node.closest('[data-nbk-krew-teaser]').dataset.nbkKrewTeaser;
    if (node?.closest?.('#tab-mobile')) return 'menu';
    if (node?.closest?.('hdt-toolbar-mobile, .hdt-toolbar, .hdt-toolbar-mobile')) return 'toolbar';
    if (node?.closest?.('#hdt-header, header')) return 'header';
    return 'account_component';
  }

  // Shopify's native component exposes an `open` event. Count opening separately
  // from an account link click or a confirmed signed-in storefront return.
  document.addEventListener('open', event => {
    if (event.target?.localName === 'shopify-account') emit('nbk_account_open', sourceFor(event.target));
  }, true);

  document.addEventListener('click', event => {
    if (!allowed()) return;
    const path = event.composedPath();
    const anchor = path.find(node => node?.localName === 'a' && node.href);
    if (!anchor) return;
    let url;
    try { url = new URL(anchor.href, location.href); } catch { return; }
    const account = path.find(node => node?.localName === 'shopify-account');
    const source = anchor.dataset?.nbkAccountLink || anchor.dataset?.nbkKrewLink || sourceFor(account || anchor);
    const loyaltyLink = url.origin === location.origin && /\/pages\/(newborn-krew|loyalty-program)\/?$/.test(url.pathname);
    if (loyaltyLink) {
      emit('nbk_krew_click', source);
    } else if (anchor.hasAttribute('data-nbk-account-link') || (account && /\/account(?:\/|$)/.test(url.pathname)) || (url.origin === location.origin && /\/account(?:\/|$)/.test(url.pathname))) {
      const destination = /\/orders\/?$/.test(url.pathname) ? 'orders' : /\/profile\/?$/.test(url.pathname) ? 'profile' : 'account';
      emit('nbk_account_click', source, { destination });
      rememberIntent(source);
    }
  }, true);

  function syncConsent() {
    if (!allowed()) {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
      // Delete our own consent-gated state on withdrawal; never replay old clicks.
      if (window.Shopify?.customerPrivacy) clearIntent();
      return;
    }
    checkReturn();
    if (programPage() && !programViewed && document.visibilityState === 'visible') {
      programViewed = emit('nbk_krew_view', 'page');
    }
    visible.forEach(startImpression);
  }

  document.addEventListener('visitorConsentCollected', syncConsent);
  document.addEventListener('visibilitychange', () => {
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear(); syncConsent();
  });
  new MutationObserver(connect).observe(document.body, { childList: true, subtree: true });
  connect(); syncConsent();
  function loadPrivacy() {
    if (window.Shopify?.customerPrivacy) syncConsent();
    else window.Shopify?.loadFeatures?.([{ name: 'consent-tracking-api', version: '0.1' }], error => {
      if (!error) syncConsent();
    });
  }
  loadPrivacy();
  window.addEventListener('load', loadPrivacy, { once: true });
})();
