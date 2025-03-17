document.addEventListener('DOMContentLoaded', function () {
    const popupDiscount = document.querySelector('#popup-discount');
    if(popupDiscount != null){
        document.addEventListener('click', function (e) {
            if(!e.target.closest('#popup-discount')){
                popupDiscount.classList.remove('show');
            }
        })
        const urlParams = new URLSearchParams(window.location.search);
        const popupClose = popupDiscount.querySelector('.popup-discount__close');
        if(popupClose != null){
            popupClose.addEventListener('click', function () {
                popupDiscount.classList.remove('show');
            })
        }
        if (urlParams.get("utm_campaign") === "Email_promocod") {
            popupDiscount.classList.add('show');
        }else{
            popupDiscount.classList.remove('show');
        }
    }
})
