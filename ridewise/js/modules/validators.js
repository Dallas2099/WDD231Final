const messages = {
  required: (label) => `${label} is required`,
  pattern: (label) => `${label} has an invalid format`,
};

export function validateRequired(value, label) {
  if (value === undefined || value === null || value === '') {
    return messages.required(label);
  }
  return null;
}

export function validatePattern(value, pattern, label) {
  if (!value) {
    return null;
  }
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  if (!regex.test(String(value))) {
    return messages.pattern(label);
  }
  return null;
}

export function collectErrors(validations) {
  return validations.filter((result) => Boolean(result));
}

export function formatErrors(errors) {
  if (!errors.length) {
    return '';
  }
  return `<ul>${errors.map((error) => `<li>${error}</li>`).join('')}</ul>`;
}

export function validateServiceForm(form) {
  const errors = [];
  const bike = form.elements.bike?.value;
  const date = form.elements.date?.value;
  const type = form.elements.type?.value;
  const cost = form.elements.cost?.value;

  errors.push(validateRequired(bike, 'Bike'));
  errors.push(validateRequired(date, 'Date'));
  errors.push(validateRequired(type, 'Service type'));
  if (cost) {
    errors.push(validatePattern(cost, /^\d+(?:\.\d{1,2})?$/, 'Cost'));
  }

  return collectErrors(errors);
}
