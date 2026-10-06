/* Theme-local presentation only. Yespo owns messages, delivery and click tracking. */
(() => {
  const mount = document.getElementById('app-inbox');
  if (!mount || mount.dataset.nbkBranded) return;
  mount.dataset.nbkBranded = 'true';
  const css = `
    * { box-sizing: border-box; font-family: Formular, Arial, sans-serif !important; }
    .js-pull-notification-messages-counter { background: #ccf951 !important; color: #111 !important; font-weight: 700 !important; }
    .js-pull-notification-messages-container { background: #fff !important; color: #111 !important; width: min(420px, calc(100vw - 24px)) !important; height: auto !important; max-width: calc(100vw - 24px) !important; max-height: min(560px, calc(100dvh - 120px)) !important; border: 1px solid #ddd !important; border-top: 4px solid #ccf951 !important; border-radius: 0 !important; box-shadow: 0 12px 36px #0002 !important; }
    .js-pull-close-header { padding: 18px 20px; border-bottom: 1px solid #e8e8e8; }
    .js-pull-close-header-message::before { content: 'NEWBORN K'; color: #111; font-size: 17px; font-weight: 700; letter-spacing: .04em; }
    .js-pull-notification-messages { max-height: min(480px, calc(100dvh - 190px)) !important; height: auto !important; min-height: 118px !important; }
    .js-pull-notification-message { padding: 20px !important; gap: 16px; align-items: flex-start !important; background: #fff !important; }
    .js-pull-notification-message:hover { background: #f7f9f2 !important; }
    .js-pull-notification-message-image { width: 56px !important; height: 56px !important; flex: 0 0 56px; margin: 0 !important; object-fit: contain !important; }
    .js-pull-notification-message-image[src*="pull_message_image_placeholder"] { display: none !important; }
    .js-pull-notification-message-content-container { margin: 0 !important; min-width: 0; }
    .js-pull-notification-message .js-pull-notification-message-title { color: #111 !important; font-size: 16px !important; line-height: 1.3 !important; font-weight: 600 !important; margin: 0 0 8px !important; display: block !important; }
    .js-pull-notification-message .js-pull-notification-message-content { color: #222 !important; font-size: 14px !important; line-height: 1.5 !important; margin: 0 0 12px !important; display: block !important; }
    .js-pull-notification-message .js-pull-notification-message-created-date { color: #666 !important; font-size: 12px !important; line-height: 1.4 !important; }
    .js-pull-notification-message-button { background: #ccf951 !important; color: #111 !important; border: 1px solid #111 !important; }
    @media (max-width: 600px) { .js-pull-notification-messages-container { left: 12px !important; right: 12px !important; } .js-pull-notification-message { padding: 16px !important; gap: 12px; } }
  `;
  const selector = '.js-pull-notification-call-button-host-element, .js-pull-notification-host-element';
  function styleHosts() {
    document.querySelectorAll(selector).forEach(host => {
      const root = host.shadowRoot;
      if (!root || root.querySelector('#nbk-inbox-style')) return;
      const style = document.createElement('style');
      style.id = 'nbk-inbox-style';
      style.textContent = css;
      root.append(style);
    });
  }
  // The SDK adds its open shadow roots asynchronously. Never patch attachShadow.
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; styleHosts(); });
  });
  observer.observe(document.body, { childList: true, subtree: true });
  let attempts = 0;
  const timer = setInterval(() => {
    styleHosts();
    if (++attempts >= 30) clearInterval(timer);
  }, 500);
  mount.addEventListener('click', () => {
    styleHosts();
    setTimeout(styleHosts, 100);
    setTimeout(styleHosts, 500);
  });
  window.addEventListener('pagehide', () => { observer.disconnect(); clearInterval(timer); }, { once: true });
  styleHosts();
})();
