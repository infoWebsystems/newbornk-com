(() => {
  'use strict';

  const selector = '.cl-widget-f35733v35733 > es-sys-container-static';
  const decorated = new WeakSet();
  const decorate = () => {
    document.querySelectorAll(selector).forEach((launcher) => {
      if (!launcher.shadowRoot || decorated.has(launcher)) return;
      decorated.add(launcher);

      // The native Yespo click handler and audience rules remain in charge.
      // Its old bitmap sits inside a shadow root, beyond theme stylesheets.
      const style = document.createElement('style');
      style.textContent = '[cl-content-container] { visibility: hidden !important; }';
      launcher.shadowRoot.appendChild(style);
      launcher.setAttribute('role', 'button');
      launcher.setAttribute('tabindex', '0');
      launcher.setAttribute('aria-label', document.documentElement.lang === 'en'
        ? 'Get a welcome discount'
        : 'Отримати знижку на перше замовлення');
      launcher.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        launcher.click();
      });
    });
  };

  const observer = new MutationObserver((records) => {
    if (records.some((record) => Array.from(record.addedNodes).some((node) =>
      node.nodeType === 1 && (node.matches(selector) || node.querySelector(selector))
    ))) decorate();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  customElements.whenDefined('es-sys-container-static').then(decorate);
  decorate();
})();
