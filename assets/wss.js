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

            const cartCountElement = document.querySelector('.header__icon.header__icon--cart .visually-hidden');
            if (cartCountElement) {
                cartCountElement.innerHTML = `${window.translation.cart} <div class="cart-count-bubble"><span aria-hidden="true">${totalItems}</span></div>`;
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
        const descriptionBlock = document.querySelector(".collection-hero__description");
        if (!descriptionBlock) return;

        const showMoreDesk = parseInt(descriptionBlock.dataset.lines, 10) || 0;
        const showMoreMob = parseInt(descriptionBlock.dataset.linesMob, 10) || 0;
        const lineHeight = parseFloat(window.getComputedStyle(descriptionBlock).lineHeight);
        const contentHeight = descriptionBlock.scrollHeight;
        const maxLines = window.innerWidth <= 768 ? showMoreMob : showMoreDesk;
        const maxHeight = maxLines * lineHeight;

        if (contentHeight > maxHeight) {
            descriptionBlock.classList.add("less");
            descriptionBlock.style.maxHeight = maxHeight + "px";
            descriptionBlock.style.overflow = "hidden";

            const toggleButton = document.createElement("a");
            toggleButton.href = "#";
            toggleButton.innerText = window.translation.read_more;
            toggleButton.style.display = "block";
            toggleButton.style.color = "black";
            toggleButton.style.cursor = "pointer";

            toggleButton.addEventListener("click", function (e) {
                e.preventDefault();
                if (descriptionBlock.classList.contains("less")) {
                    descriptionBlock.classList.remove("less");
                    descriptionBlock.style.maxHeight = "none";
                    toggleButton.innerText = window.translation.read_less;
                } else {
                    descriptionBlock.classList.add("less");
                    descriptionBlock.style.maxHeight = maxHeight + "px";
                    toggleButton.innerText = window.translation.read_more;
                }
            });

            descriptionBlock.after(toggleButton);
        } else {
            descriptionBlock.classList.remove("less");
        }

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

    function initFiterImgsPlp(removeActive) {
        const filterW_MButtons = document.querySelectorAll('.filter-w-m .button');
        const filterWMBlock = document.querySelector('.filter-w-m');
        if (filterWMBlock == null) {
        } else {
            const referrer = document.referrer;
            const parts = referrer.split('/').filter(Boolean);
            const lastPart = parts.length ? parts[parts.length - 1] : false;
            console.log('lastPart', lastPart)
            if(lastPart == 'brands'){
                filterWMBlock.classList.remove('hidden');
                if (filterW_MButtons.length > 0) {
                    filterW_MButtons.forEach(function (button) {
                        if(removeActive){
                            button.classList.remove('active');
                        }
                        button.addEventListener('click', function (e) {
                            e.preventDefault();
                            filterW_MButtons.forEach(btn => btn.classList.remove('active'));
                            button.classList.add('active');
                            let identificator = button.dataset.ident;
                            const blocksImgs = document.querySelectorAll("#main-collection-product-grid .grid__item");

                            blocksImgs.forEach(item => {
                                const mediaBlock = item.querySelector(".media");
                                if (!mediaBlock) return;

                                const images = Array.from(mediaBlock.querySelectorAll("img"));
                                if (images.length < 2) return;
                                const getIdentifier = function (img) {
                                    return img.alt.split("@")[0] + "@";
                                };

                                const firstImage = images[0];
                                const firstImageIdentifier = getIdentifier(firstImage);
                                if (firstImageIdentifier === identificator.toLowerCase()) return;
                                const itemImage = images.find(img => getIdentifier(img) === identificator.toLowerCase());

                                if (itemImage) {
                                    mediaBlock.prepend(itemImage);
                                }
                            });
                        });
                    });
                }
            }
        }
    }

    initShowMoreText();
    initCardAddToCart();
    window.initCardAddToCart = initCardAddToCart;
    initFiterImgsPlp();
    window.initFiterImgsPlp = initFiterImgsPlp;
});
