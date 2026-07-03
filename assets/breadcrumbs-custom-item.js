(function () {
  var STORAGE_KEY = 'nbk:breadcrumb';

  // Collection pages: remember the collection context when a product card is clicked.
  // Cards link to the clean canonical /products/ URL; the context travels via
  // sessionStorage instead of ?url=&title=&gender= query params.
  function storeBreadcrumb(event) {
    if (!event.target || !event.target.closest) return;
    var link = event.target.closest('a[data-bc-url]');
    if (!link) return;
    if (event.type === 'auxclick' && event.button !== 1) return;

    var gender = link.getAttribute('data-bc-gender');
    if (gender) {
      try {
        localStorage.setItem('visited_gender', gender);
      } catch (e) {}
    }

    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          url: link.getAttribute('data-bc-url'),
          title: link.getAttribute('data-bc-title'),
          product: link.pathname,
        })
      );
    } catch (e) {}
  }

  document.addEventListener('click', storeBreadcrumb, true);
  document.addEventListener('auxclick', storeBreadcrumb, true);

  // Product pages: insert the collection crumb after "Home".
  document.addEventListener('DOMContentLoaded', function () {
    var urlParams = new URLSearchParams(window.location.search);
    var url = urlParams.get('url');
    var title = urlParams.get('title');
    var gender = urlParams.get('gender');
    var fromParams = Boolean(url && title);

    if (!fromParams) {
      try {
        var stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
        sessionStorage.removeItem(STORAGE_KEY);
        if (stored && stored.product === window.location.pathname) {
          url = stored.url;
          title = stored.title;
        }
      } catch (e) {}
    }

    if (url && title) {
      var breadcrumbsList = document.querySelector('.breadcrumbs__list');
      if (breadcrumbsList && breadcrumbsList.children.length > 0) {
        var newItem = document.createElement('li');
        newItem.classList.add('breadcrumbs__item');
        var anchor = document.createElement('a');
        anchor.href = url;
        anchor.textContent = title;
        newItem.appendChild(anchor);
        breadcrumbsList.insertBefore(newItem, breadcrumbsList.children[1]);
      }

      var jsonLDElement = document.querySelector('script[type="application/ld+json"][data-desc="seo-breadcrumb-list"]');
      if (jsonLDElement) {
        try {
          var jsonData = JSON.parse(jsonLDElement.textContent);
          if (jsonData['@type'] === 'BreadcrumbList' && Array.isArray(jsonData.itemListElement)) {
            var collectionItem = {
              '@type': 'ListItem',
              position: 2,
              item: {
                '@id': url,
                name: title,
              },
            };
            if (jsonData.itemListElement[1]) {
              jsonData.itemListElement[1].position = 3;
            }
            jsonData.itemListElement.splice(1, 0, collectionItem);
            jsonLDElement.textContent = JSON.stringify(jsonData, null, 2);
          }
        } catch (e) {}
      }
    }

    // Legacy links crawled with ?url=&title= keep working; tidy the address bar like before.
    if (fromParams) {
      window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
    }

    if (gender) {
      try {
        localStorage.setItem('visited_gender', gender);
      } catch (e) {}
    }
  });
})();
