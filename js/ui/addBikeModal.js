import { addBike } from "../bikes.js";
import { showToast } from "./toasts.js";

const modal = document.getElementById("add-bike-modal");
const modalContent = modal?.querySelector(".modal-content");
const form = document.getElementById("add-bike-form");
const openButton = document.getElementById("open-add-bike");
const errorMap = new Map(
  Array.from(document.querySelectorAll("#add-bike-form .error-msg")).map((element) => [
    element.dataset.errorFor,
    element
  ])
);

let lastFocus = null;

const setError = (name, message = "") => {
  const target = errorMap.get(name);
  if (target) target.textContent = message;
  const field = form?.elements[name];
  if (field && "setCustomValidity" in field) {
    field.setCustomValidity(message);
  }
};

const validateField = (field) => {
  if (!field) return true;
  let message = "";
  if (field.required && !field.value.trim()) {
    message = "This field is required.";
  } else if (field.name === "year") {
    const year = Number(field.value);
    const currentYear = new Date().getFullYear() + 1;
    if (year < 1970 || year > currentYear) {
      message = `Enter a year between 1970 and ${currentYear}.`;
    }
  }
  setError(field.name, message);
  return !message;
};

const validateForm = () => {
  if (!form) return false;
  return ["name", "make", "model", "year"].every((name) => validateField(form.elements[name]));
};

const setDefaultYear = () => {
  const yearField = form?.elements.year;
  if (yearField && !yearField.value) {
    yearField.value = new Date().getFullYear();
  }
};

const closeModal = () => {
  if (!modal) return;
  modal.dataset.open = "false";
  document.body.classList.remove("modal-open");
  setTimeout(() => modal.setAttribute("hidden", ""), 200);
  form?.reset();
  errorMap.forEach((_, key) => setError(key, ""));
  if (lastFocus && typeof lastFocus.focus === "function") {
    lastFocus.focus();
  }
};

const openModal = () => {
  if (!modal) return;
  lastFocus = document.activeElement;
  setDefaultYear();
  modal.removeAttribute("hidden");
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => {
    modal.dataset.open = "true";
    modalContent?.focus({ preventScroll: true });
  });
};

export function setupAddBikeModal({ onBikeAdded } = {}) {
  if (!modal || !form || !openButton) return;

  openButton.addEventListener("click", openModal);

  modal.addEventListener("click", (event) => {
    const target = event.target;
    if (target?.dataset?.closeModal !== undefined || target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.dataset.open === "true") {
      closeModal();
    }
  });

  form.addEventListener("input", (event) => {
    if (event.target.name) validateField(event.target);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateForm()) {
      form.reportValidity();
      return;
    }
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    const newBike = addBike({
      name: payload.name,
      make: payload.make,
      model: payload.model,
      year: Number(payload.year)
    });
    onBikeAdded?.(newBike);
    showToast(`Added ${payload.name}`);
    closeModal();
  });
}
