document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const url = urlParams.get("url");
    const title = urlParams.get("title");
    const gender = urlParams.get("gender");

    if (url && title) {
        const breadcrumbsList = document.querySelector(".breadcrumbs__list");
        if (breadcrumbsList) {
            const newItem = document.createElement("li");
            newItem.classList.add("breadcrumbs__item");
            newItem.innerHTML = `<a href="${url}">${title}</a>`;
            breadcrumbsList.insertBefore(newItem, breadcrumbsList.children[1]);
        }
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        let jsonLDElement = document.querySelector('script[type="application/ld+json"][data-desc="seo-breadcrumb-list"]');
        if (jsonLDElement) {
            let jsonData = JSON.parse(jsonLDElement.textContent);
            if (jsonData["@type"] === "BreadcrumbList" && Array.isArray(jsonData.itemListElement)) {
                let collectionItem = {
                    "@type": "ListItem",
                    "position": 2,
                    "item": {
                        "@id": url,
                        "name": title
                    }
                };
                if (jsonData.itemListElement[1]) {
                    jsonData.itemListElement[1].position = 3;
                }
                jsonData.itemListElement.splice(1, 0, collectionItem);
                jsonLDElement.textContent = JSON.stringify(jsonData, null, 2);
            }
        }
    }

    if (gender) {
        localStorage.setItem('visited_gender', gender);
    }
});
