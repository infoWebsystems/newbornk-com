(() => {
  const main = document.getElementById('MainContent');
  const catalogUrl = document.currentScript?.dataset.catalogUrl;
  if (!main || !catalogUrl) return;

  const updateLink = () => {
    const widget = document.getElementById('es-recom-2951-v-r2951v3563');
    if (!widget || !main.contains(widget)) return;
    const link = widget.querySelector('h2.title > a[href="/collections/kurtky"]');
    if (link) link.setAttribute('href', catalogUrl);
  };

  updateLink();

  new MutationObserver(updateLink).observe(main, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['href'],
  });
})();
