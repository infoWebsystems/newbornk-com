(() => {
  'use strict';

  // Scope to the existing welcome-discount form, including its native success
  // and validation views. Yespo still owns submission, consent, and dismissal.
  const selector = '.cl-floating-box[cl-widget-id="f35732v35732"]';
  const active = new Map();
  const styleId = 'nbk-welcome-popup-style';
  const styles = `
    :host { box-sizing: border-box !important; font-family: Formular, Arial, sans-serif !important; flex: 0 0 auto !important; }
    :host([cl-type="VIEW"]) { width: 100% !important; min-width: 0 !important; min-height: 0 !important; height: auto !important; max-height: none !important; overflow: visible !important; padding: 40px 20px 20px !important; gap: 0 !important; background: #fff !important; }
    :host([cl-type="COLUMNS"]), :host([cl-type="COLUMN"]) { width: 100% !important; min-width: 0 !important; min-height: 0 !important; height: auto !important; max-height: none !important; overflow: visible !important; padding: 0 !important; margin: 0 !important; gap: 10px !important; }
    :host([cl-type="COLUMN"][cl-path="0,0,0"]) { display: none !important; }
    :host([cl-type="VIEW"]), :host([cl-type="COLUMNS"]) { display: block !important; }
    :host([cl-type="COLUMN"]) { flex-direction: column !important; }
    [cl-content-container] { height: auto !important; min-height: 0 !important; min-width: 0 !important; max-height: none !important; flex: 0 0 auto !important; overflow: visible !important; gap: inherit !important; }
    :host([cl-type="IMAGE"]) { width: 140px !important; min-width: 0 !important; height: auto !important; min-height: 0 !important; margin: 0 auto 4px !important; padding: 0 !important; }
    img { height: auto !important; min-height: 0 !important; object-fit: contain !important; }
    :host([cl-type="TEXT"]) { width: 100% !important; margin: 0 !important; }
    [cl-element="text"], [cl-element="text"] * { font-family: inherit !important; font-size: 13px !important; line-height: 1.4 !important; font-weight: 400 !important; text-align: center !important; color: #666 !important; letter-spacing: normal !important; }
    :host([cl-path="0,0,1,1"]) [cl-element="text"] { font-size: 22px !important; line-height: 1.2 !important; font-weight: 500 !important; color: #111 !important; margin: 4px 0 6px !important; }
    :host([cl-type="INPUT"]), :host([cl-type="BUTTON"]) { width: 100% !important; min-width: 0 !important; height: auto !important; min-height: 44px !important; max-height: none !important; margin: 0 !important; }
    input { box-sizing: border-box !important; width: 100% !important; min-width: 0 !important; height: 44px !important; min-height: 44px !important; padding: 10px 12px !important; font-family: inherit !important; font-size: 16px !important; text-align: center !important; border: 1px solid #aaa !important; border-radius: 0 !important; }
    button { box-sizing: border-box !important; width: 100% !important; min-height: 44px !important; height: auto !important; padding: 10px 8px !important; }
    button, button .editable-text { font-family: inherit !important; font-size: 15px !important; line-height: 1.3 !important; text-align: center !important; }
    button .editable-text { width: auto !important; white-space: normal !important; }
    :host([cl-path="0,0,1,4"]), :host([cl-path="0,0,1,4"]) button { min-height: 32px !important; }
    :host([cl-path="0,0,1,4"]) button { padding: 4px !important; }
  `;

  function enhance(popup) {
    if (active.has(popup)) return;
    const observers = [];
    const seen = new WeakSet();
    const pending = new WeakSet();
    const decorate = (root) => {
      if (root instanceof ShadowRoot) {
        if (!root.getElementById(styleId)) {
          const style = document.createElement('style');
          style.id = styleId;
          style.textContent = styles;
          root.appendChild(style);
        }
        if (!seen.has(root)) {
          seen.add(root);
          const observer = new MutationObserver(() => decorate(root));
          observer.observe(root, { childList: true, subtree: true });
          observers.push(observer);
        }
      }
      root.querySelectorAll('*').forEach((element) => {
        if (element.shadowRoot) decorate(element.shadowRoot);
        else if (element.localName.startsWith('es-') && !pending.has(element)) {
          pending.add(element);
          customElements.whenDefined(element.localName).then(() => {
            if (popup.isConnected) decorate(popup);
          });
        }
      });
    };
    const close = () => popup.querySelector('.cl-floating-box-close-icon')?.click();
    const onClick = (event) => { if (event.target === popup) close(); };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
    };
    const viewport = window.visualViewport;
    const resize = () => {
      popup.style.setProperty('--nbk-popup-height', `${viewport?.height || window.innerHeight}px`);
      popup.style.setProperty('--nbk-popup-top', `${viewport?.offsetTop || 0}px`);
    };
    popup.classList.add('nbk-yespo-popup');
    popup.setAttribute('aria-label', document.documentElement.lang === 'en'
      ? 'Welcome discount' : 'Знижка на перше замовлення');
    popup.addEventListener('click', onClick);
    popup.addEventListener('keydown', onKeyDown);
    viewport?.addEventListener('resize', resize);
    viewport?.addEventListener('scroll', resize);
    window.addEventListener('resize', resize);
    active.set(popup, () => {
      clearInterval(upgradeTimer);
      clearTimeout(upgradeDeadline);
      observers.forEach((observer) => observer.disconnect());
      viewport?.removeEventListener('resize', resize);
      viewport?.removeEventListener('scroll', resize);
      window.removeEventListener('resize', resize);
      popup.removeEventListener('click', onClick);
      popup.removeEventListener('keydown', onKeyDown);
    });
    const observer = new MutationObserver(() => decorate(popup));
    observer.observe(popup, { childList: true, subtree: true });
    observers.push(observer);
    decorate(popup);
    resize();
    const upgradeTimer = setInterval(() => decorate(popup), 250);
    const upgradeDeadline = setTimeout(() => clearInterval(upgradeTimer), 10000);
  }

  const scan = () => {
    active.forEach((cleanup, popup) => {
      if (!popup.isConnected) { cleanup(); active.delete(popup); }
    });
    document.querySelectorAll(selector).forEach(enhance);
  };
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  scan();
})();
