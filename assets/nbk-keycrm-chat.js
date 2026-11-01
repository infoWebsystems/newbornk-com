(() => {
  'use strict';

  const token = document.currentScript?.dataset.widgetToken;
  if (!token || window.nbkKeyCRMChatLoaded) return;
  window.nbkKeyCRMChatLoaded = true;

  const start = () => {
    const render = () => window.KeyCRM.render({ token, popUpInitialMessage: false });
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

  const schedule = () => window.setTimeout(start, Math.max(0, 30000 - performance.now()));
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
})();
