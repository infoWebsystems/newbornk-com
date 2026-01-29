document.addEventListener("DOMContentLoaded", function () {
    function setCookie(name, value, days) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
    }

    function getCookie(name) {
        return document.cookie.split('; ').reduce((r, v) => {
            const parts = v.split('=');
            return parts[0] === name ? decodeURIComponent(parts[1]) : r;
        }, '');
    }

    function deleteCookie(name) {
        document.cookie = `${name}=; Max-Age=-1; path=/`;
    }
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
      const lang = document.documentElement.getAttribute("lang");
      let toast_title = "Товар додано до кошика";
      if (lang == "ru") {
        toast_title = "Товар добавлен в корзину";
      }
      showToast(data.title, toast_title, data.image);
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
    const descriptionBlock = document.querySelectorAll(".collection-hero__description, .less");
    if (!descriptionBlock.length) return;

    function show_more(selector = null) {
      const showMoreDesk = parseInt(selector.dataset.lines, 10) || 0;
      const showMoreMob = parseInt(selector.dataset.linesMob, 10) || 0;
      const lineHeight = parseFloat(window.getComputedStyle(selector).lineHeight);
      const contentHeight = selector.scrollHeight;
      const maxLines = window.innerWidth <= 768 ? showMoreMob : showMoreDesk;
      const maxHeight = maxLines * lineHeight;

      if (contentHeight > maxHeight) {
        selector.classList.add("less");
        selector.style.maxHeight = maxHeight + "px";
        selector.style.overflow = "hidden";

        const toggleButton = document.createElement("a");
        toggleButton.href = "#";
        toggleButton.innerText = window.translation.read_more;
        toggleButton.style.display = "block";
        toggleButton.style.color = "black";
        toggleButton.style.cursor = "pointer";

        toggleButton.addEventListener("click", function (e) {
          e.preventDefault();
          if (selector.classList.contains("less")) {
            selector.classList.remove("less");
            selector.style.maxHeight = "none";
            toggleButton.innerText = window.translation.read_less;
          } else {
            selector.classList.add("less");
            selector.style.maxHeight = maxHeight + "px";
            toggleButton.innerText = window.translation.read_more;
          }
        });

        selector.after(toggleButton);
      } else {
        selector.classList.remove("less");
      }
    }

    descriptionBlock.forEach((el) => {
      show_more(el);
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

    initShowMoreText();
    initCardAddToCart();
    window.initCardAddToCart = initCardAddToCart;
});


document.addEventListener('DOMContentLoaded', () => {
    const footer = document.querySelector('footer');
    if (!footer) return;

    const observer = new IntersectionObserver(
        ([entry]) => {
        document.body.classList.toggle(
            'footer-is-visible',
            entry.isIntersecting
        );
        },
        {
        root: null,
        threshold: 0.01
        }
    );

    observer.observe(footer);
});