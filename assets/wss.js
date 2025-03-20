document.addEventListener("DOMContentLoaded", function () {
    async function addToCart(variantId, quantity = 1, cartUrl, item) {
        try {
            const response = await fetch(`${cartUrl}.js`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: variantId,
                    quantity: quantity
                })
            });
            if (!response.ok) throw new Error('Error add to cart');
            const data = await response.json();

            updateCartCount(item);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function updateCartCount(item) {
        try {
            const response = await fetch('/cart.js');
            if (!response.ok) throw new Error('Error get cart');

            const data = await response.json();
            const totalItems = data.item_count;

            const cartCountElement = document.querySelector('.cart-count-bubble span');
            if (cartCountElement) {
                cartCountElement.textContent = totalItems;
            }

            if(item){
                item.classList.remove('loading');
            }
            return totalItems;
        } catch (error) {
            console.error('Error:', error);
        }
    }
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

    function initCardAddToCart(){
        const buttonsCardAddToCart = document.querySelectorAll('.card__add-to-cart');
        if(buttonsCardAddToCart.length > 0){
            buttonsCardAddToCart.forEach(function (item) {
                item.addEventListener('click', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    item.classList.add('loading');
                    const itemId = item.dataset.id;
                    const cartUrl = item.dataset.url;
                    console.log('itemId', itemId)
                    console.log('cartUrl', cartUrl)
                    addToCart(itemId, 1, cartUrl, item);
                })
            })
        }
    }

    initShowMoreText()
    initCardAddToCart()
});
