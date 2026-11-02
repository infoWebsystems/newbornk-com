(() => {
  'use strict';

  // Scope to the existing welcome-discount form, including its native success
  // and validation views. Yespo still owns submission, consent, and dismissal.
  const selector = '.cl-floating-box[cl-widget-id="f35732v35732"]';
  const active = new Map();
  const styleId = 'nbk-welcome-popup-style';
  const config = document.getElementById('nbk-welcome-popup-copy');
  if (!config) return;
  const copy = JSON.parse(config.textContent);
  const styles = `
    :host { box-sizing: border-box !important; font-family: Formular, Arial, sans-serif !important; flex: 0 0 auto !important; }
    :host([cl-type="VIEW"]) { width: 100% !important; min-width: 0 !important; min-height: 0 !important; height: auto !important; max-height: none !important; overflow: visible !important; padding: 24px 20px !important; gap: 0 !important; background: #fff !important; border-radius: 16px !important; }
    :host([cl-type="COLUMNS"]), :host([cl-type="COLUMN"]) { width: 100% !important; min-width: 0 !important; min-height: 0 !important; height: auto !important; max-height: none !important; overflow: visible !important; padding: 0 !important; margin: 0 !important; gap: 10px !important; }
    :host([cl-type="COLUMN"][cl-path="0,0,0"]) { display: none !important; }
    :host([cl-type="VIEW"]), :host([cl-type="COLUMNS"]) { display: block !important; }
    :host([cl-type="COLUMN"]) { flex-direction: column !important; }
    [cl-content-container] { height: auto !important; min-height: 0 !important; min-width: 0 !important; max-height: none !important; flex: 0 0 auto !important; overflow: visible !important; gap: inherit !important; }
    :host([cl-type="IMAGE"]) { width: 160px !important; max-width: calc(100% - 40px) !important; min-width: 0 !important; height: auto !important; min-height: 0 !important; margin: 0 0 14px !important; padding: 0 !important; align-self: flex-start !important; }
    img { height: auto !important; min-height: 0 !important; object-fit: contain !important; }
    :host([cl-type="TEXT"]) { width: 100% !important; margin: 0 !important; }
    [cl-element="text"], [cl-element="text"] * { font-family: inherit !important; font-size: 13px !important; line-height: 1.45 !important; font-weight: 400 !important; text-align: left !important; color: #555 !important; letter-spacing: normal !important; text-transform: none !important; }
    :host([data-nbk-heading]) [cl-element="text"] { font-size: clamp(26px, 7vw, 30px) !important; line-height: 1.12 !important; font-weight: 500 !important; color: #111 !important; margin: 0 !important; }
    .nbk-welcome-intro { margin: 10px 0 6px; font: 400 15px/1.4 Formular, Arial, sans-serif; color: #555; text-align: left; }
    :host([data-nbk-restriction]) { border-top: 1px solid #e5e5e5 !important; padding-top: 14px !important; }
    :host([cl-type="INPUT"]), :host([cl-type="BUTTON"]) { width: 100% !important; min-width: 0 !important; height: auto !important; min-height: 44px !important; max-height: none !important; margin: 0 !important; }
    [cl-element="label"] { display: block !important; margin: 0 0 6px !important; font: 400 14px/1.4 Formular, Arial, sans-serif !important; text-align: left !important; }
    .label-with-input-container { height: auto !important; }
    input { box-sizing: border-box !important; width: 100% !important; min-width: 0 !important; height: 48px !important; min-height: 48px !important; padding: 10px 12px !important; font-family: inherit !important; font-size: 16px !important; text-align: left !important; border: 1px solid #aaa !important; border-radius: 6px !important; }
    input:focus-visible, button:focus-visible, a:focus-visible { outline: 2px solid #111 !important; outline-offset: 3px !important; }
    input.invalid { border-color: #b42318 !important; }
    .nbk-welcome-error { margin: 6px 0 0; font: 400 13px/1.4 Formular, Arial, sans-serif; color: #b42318; }
    .nbk-welcome-error[hidden] { display: none; }
    button { box-sizing: border-box !important; width: 100% !important; min-height: 48px !important; height: auto !important; padding: 12px 8px !important; border-radius: 6px !important; }
    button, button .editable-text { font-family: inherit !important; font-size: 15px !important; line-height: 1.3 !important; text-align: center !important; text-transform: none !important; }
    button .editable-text { width: auto !important; white-space: normal !important; }
    :host([data-nbk-dismiss]), :host([data-nbk-dismiss]) button { min-height: 44px !important; }
    :host([data-nbk-dismiss]) button { padding: 10px !important; text-decoration: underline !important; text-underline-offset: 3px; }
  `;

  const elementsIn = (root) => Array.from(root.querySelectorAll('*')).flatMap((element) =>
    [element, ...(element.shadowRoot ? elementsIn(element.shadowRoot) : [])]);
  const setText = (element, text) => {
    if (element && element.textContent !== text) element.textContent = text;
  };

  function styleSignup(popup) {
    const elements = elementsIn(popup);
    const input = elements.find((element) => element.matches('input[name="email"]'));
    // Never rewrite Yespo's confirmation, success, or already-subscribed view.
    if (!input) return;
    const component = (path) => elements.find((element) => element.getAttribute('cl-path') === path);
    const heading = component('0,0,1,1');
    const headingText = heading?.shadowRoot?.querySelector('[cl-element="text"]');
    if (headingText) {
      heading.setAttribute('data-nbk-heading', '');
      setText(headingText, copy.heading);
      if (!heading.shadowRoot.querySelector('.nbk-welcome-intro')) {
        const intro = document.createElement('p');
        intro.className = 'nbk-welcome-intro';
        intro.textContent = copy.intro;
        headingText.after(intro);
      }
    }
    setText(component('0,0,1,3')?.shadowRoot?.querySelector('.editable-text'), copy.submit);
    const dismiss = component('0,0,1,4');
    dismiss?.setAttribute('data-nbk-dismiss', '');
    setText(dismiss?.shadowRoot?.querySelector('.editable-text'), copy.dismiss);
    const restriction = component('0,0,1,5');
    restriction?.setAttribute('data-nbk-restriction', '');
    setText(restriction?.shadowRoot?.querySelector('[cl-element="text"]'), copy.restriction);
    const consent = component('0,0,1,6')?.shadowRoot?.querySelector('[cl-element="text"]');
    const privacy = consent?.querySelector('a');
    if (privacy && !consent.dataset.nbkCopy) {
      consent.dataset.nbkCopy = 'true';
      // Keep the native privacy destination and the native consent/submission action.
      privacy.textContent = copy.privacy;
      consent.replaceChildren(document.createTextNode(`${copy.consent} `), privacy);
    }
    const image = component('0,0,1,0')?.shadowRoot?.querySelector('img');
    if (image && image.getAttribute('src') !== copy.logo) {
      image.src = copy.logo;
      image.removeAttribute('srcset');
      image.alt = 'NEWBORN K';
    }
    input.type = 'email';
    input.autocomplete = 'email';
    input.inputMode = 'email';
    input.placeholder = 'name@example.com';
    input.setAttribute('autocapitalize', 'none');
    const inputRoot = input.getRootNode();
    if (!inputRoot.getElementById('nbk-email-error')) {
      const error = document.createElement('p');
      error.id = 'nbk-email-error';
      error.className = 'nbk-welcome-error';
      error.hidden = true;
      error.setAttribute('aria-live', 'polite');
      error.textContent = copy.error;
      input.closest('.label-with-input-container').after(error);
      input.setAttribute('aria-describedby', `${input.getAttribute('aria-describedby') || ''} nbk-email-error`.trim());
    }
    // Reflect Yespo validation; do not add another submit handler or validation rule.
    const invalid = input.classList.contains('invalid');
    inputRoot.getElementById('nbk-email-error').hidden = !invalid;
    input.setAttribute('aria-invalid', String(invalid));
  }

  function enhance(popup) {
    if (active.has(popup)) return;
    const observers = [];
    const previousFocus = document.activeElement;
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
          const observer = new MutationObserver(() => { decorate(root); styleSignup(popup); });
          observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
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
      if (event.key === 'Tab') {
        const controls = elementsIn(popup).filter((element) =>
          element.matches('button, input, select, textarea, a[href], [tabindex="0"]') &&
          !element.disabled && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
        const first = controls[0];
        const last = controls[controls.length - 1];
        const focused = event.composedPath()[0];
        if (event.shiftKey && (focused === first || focused === popup)) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && (focused === last || focused === popup)) {
          event.preventDefault(); first?.focus();
        }
      }
    };
    const viewport = window.visualViewport;
    const resize = () => {
      popup.style.setProperty('--nbk-popup-height', `${viewport?.height || window.innerHeight}px`);
      popup.style.setProperty('--nbk-popup-top', `${viewport?.offsetTop || 0}px`);
    };
    popup.classList.add('nbk-yespo-popup');
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');
    popup.setAttribute('aria-label', copy.heading);
    popup.setAttribute('tabindex', '-1');
    const closeButton = popup.querySelector('.cl-floating-box-close-icon');
    closeButton?.setAttribute('aria-label', copy.close);
    // Focus the dialog, not the email field: opening must not raise a mobile keyboard.
    popup.focus({ preventScroll: true });
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
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    });
    const refresh = () => { decorate(popup); styleSignup(popup); };
    const observer = new MutationObserver(refresh);
    observer.observe(popup, { childList: true, subtree: true });
    observers.push(observer);
    refresh();
    resize();
    const upgradeTimer = setInterval(refresh, 250);
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
