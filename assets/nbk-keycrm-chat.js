(() => {
  'use strict';

  const token = document.currentScript?.dataset.widgetToken;
  if (!token || window.nbkKeyCRMChatLoaded) return;
  window.nbkKeyCRMChatLoaded = true;

  const start = () => {
    const render = () => window.KeyCRM.render({ token });
    if (window.KeyCRM?.render) {
      render();
      return;
    }

    const source = 'https://chat.key.live/bundles/widget.min.js';
    const existing = document.querySelector(`script[src="${source}"]`);
    if (existing) {
      existing.addEventListener('load', render, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = source;
    script.async = true;
    script.addEventListener('load', render, { once: true });
    document.head.appendChild(script);
  };

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
})();
