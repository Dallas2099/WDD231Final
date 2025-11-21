const form = document.getElementById("service-form");
const bikeSelect = document.getElementById("form-bike");
const serviceTypeSelect = document.getElementById("form-type");

const escapeHtml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const errorMap = new Map(
  Array.from(document.querySelectorAll(".error-msg")).map((element) => [
    element.dataset.errorFor,
    element
  ])
);

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
  } else if (field.name === "odometer" && Number(field.value) <= 0) {
    message = "Enter a positive number.";
  } else if (field.name === "cost" && field.value && Number(field.value) < 0) {
    message = "Cost must be zero or greater.";
  }
  setError(field.name, message);
  return !message;
};

const validateForm = () => {
  if (!form) return false;
  const fields = ["bikeId", "date", "odometer", "serviceTypeId", "cost"];
  return fields.every((name) => validateField(form.elements[name]));
};

const setTodayAsDefault = () => {
  const dateInput = document.getElementById("form-date");
  if (dateInput && !dateInput.value) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
  }
};

export function setupServiceForm({ onSubmit }) {
  if (!form) return;
  setTodayAsDefault();

  form.addEventListener("input", (event) => {
    if (event.target.name) validateField(event.target);
  });

  form.addEventListener("reset", () => {
    errorMap.forEach((_, key) => setError(key, ""));
    setTodayAsDefault();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      form.reportValidity();
      return;
    }
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    payload.odometer = Number(payload.odometer);
    if (payload.cost === "") {
      delete payload.cost;
    }
    try {
      await onSubmit(payload);
      form.reset();
      setTodayAsDefault();
    } catch (error) {
      console.error("RideWise: failed to save entry.", error);
      window.alert("Unable to save entry. Please try again.");
    }
  });
}

export function populateBikeOptions(bikes, activeBikeId) {
  if (!bikeSelect) return;
  bikeSelect.innerHTML = bikes
    .map(
      (bike) =>
        `<option value="${bike.id}" ${bike.id === activeBikeId ? "selected" : ""}>
          ${escapeHtml(`${bike.year} ${bike.make} ${bike.model}`)}
        </option>`
    )
    .join("");
  if (!activeBikeId && bikes[0]) {
    bikeSelect.value = bikes[0].id;
  }
}

export function populateServiceTypes(serviceTypes) {
  if (!serviceTypeSelect) return;
  const currentValue = serviceTypeSelect.value;
  const options = [
    `<option value="" disabled ${currentValue ? "" : "selected"}>Select a service</option>`,
    ...serviceTypes.map((type) => `<option value="${type.id}">${escapeHtml(type.label)}</option>`)
  ].join("");
  serviceTypeSelect.innerHTML = options;
  if (currentValue) {
    serviceTypeSelect.value = currentValue;
  }
}
