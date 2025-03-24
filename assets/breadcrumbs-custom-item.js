document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const url = urlParams.get("url");
    const title = urlParams.get("title");
    console.log('url', url)

    if (url && title) {
        const breadcrumbsList = document.querySelector(".breadcrumbs__list");
        if (breadcrumbsList) {
            const newItem = document.createElement("li");
            newItem.classList.add("breadcrumbs__item");
            newItem.innerHTML = `<a href="${url}">${title}</a>`;

            breadcrumbsList.insertBefore(newItem, breadcrumbsList.children[1]);
        }

        const newUrl = window.location.origin + window.location.pathname;
        console.log('newUrl', newUrl)
        window.history.replaceState({}, document.title, newUrl);
    }
});
