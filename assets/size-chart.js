modalToggle();

function modalToggle() {
  let modalBtns = document.querySelectorAll("[data-modal]");
  let closeModalBtns = document.querySelectorAll(".js-close-modal-btn");
  const bodyEl = document.querySelector("html");
  const modals = document.querySelectorAll(".wrapper-modal");
  modalBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      let currentModalData = btn.getAttribute("data-modal");
      let currentModal = document.querySelector(`.${currentModalData}`);
      if (currentModal.classList.contains("show")) {
        bodyEl.classList.remove("show-modal");
        bodyEl.classList.remove("show-modal-overlay");
        currentModal.classList.remove("show");
      } else {
        bodyEl.classList.add("show-modal");
        modals.forEach(function (modal) {
          modal.classList.remove("show");
        });
        currentModal.classList.add("show");
        if (currentModal.classList.contains("modal-overlay")) {
          bodyEl.classList.add("show-modal-overlay");
        }
      }
    });
  });
  closeModalBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      bodyEl.classList.remove("show-modal");
      bodyEl.classList.remove("show-modal-overlay");
      btn.closest(".wrapper-modal").classList.remove("show");
    });
  });
  bodyEl.addEventListener("click", function (event) {
    modals.forEach(function (modal) {
      if (!modal.contains(event.target) && !event.target.closest("[data-modal]") && !event.target.closest(".wrapper-modal")) {
        bodyEl.classList.remove("show-modal");
        bodyEl.classList.remove("show-modal-overlay");
        modal.classList.remove("show");
      }
    });
  });
}