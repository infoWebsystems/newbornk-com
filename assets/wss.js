document.addEventListener("DOMContentLoaded", function () {
    console.log(1)
    function initShowMoreText() {

            document.querySelectorAll(".show-more-text").forEach(container => {
                console.log(2)
                const lineHeight = parseInt(getComputedStyle(container).lineHeight);
                const maxHeight = lineHeight * 3;
                const readMore = container.dataset.readMore;
                const hide = container.dataset.hide;
                const countLine = container.dataset.lines;

                if (container.scrollHeight <= maxHeight) return;

                container.style.maxHeight = `${maxHeight}px`;
                container.style.overflow = "hidden";
                container.style.transition = "max-height 0.3s ease";

                const button = document.createElement("span");
                button.classList.add("show-more-btn");
                button.style.cursor = 'pointer';
                button.style.textDecoration = 'underline';
                button.textContent = readMore;

                button.addEventListener("click", function () {
                    if (container.style.maxHeight === "none") {
                        container.style.maxHeight = `${maxHeight}px`;
                        button.textContent = readMore;
                    } else {
                        container.style.maxHeight = "none";
                        button.textContent = hide;
                    }
                });
                container.after(button);
            });
    }

    initShowMoreText()
});
