import { qs } from '../utils/dom.js';

const TOAST_TIMEOUT = 4000;

export function showToast({ message, variant = 'info', timeout = TOAST_TIMEOUT }) {
  const region = qs('#toast-region');
  if (!region) {
    console.warn('Toast region not found');
    return () => {};
  }
  const toast = document.createElement('div');
  toast.className = 'toast toast-enter';
  toast.dataset.variant = variant;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `<p>${message}</p>`;
  region.appendChild(toast);

  const remove = () => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  };

  const timer = window.setTimeout(remove, timeout);
  toast.addEventListener('click', () => {
    window.clearTimeout(timer);
    remove();
  });

  return remove;
}

export function populateSelect(select, options, { placeholder } = {}) {
  if (!select) {
    return;
  }
  const values = Array.isArray(options) ? options : [];
  select.innerHTML = '';
  if (placeholder) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = placeholder;
    select.appendChild(option);
  }
  values.forEach(({ value, label }) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  });
}

export function setLoading(select, isLoading) {
  if (!select) {
    return;
  }
  select.disabled = Boolean(isLoading);
  select.setAttribute('aria-busy', String(Boolean(isLoading)));
  if (isLoading) {
    select.dataset.loading = 'true';
  } else {
    delete select.dataset.loading;
    select.removeAttribute('aria-busy');
  }
}
