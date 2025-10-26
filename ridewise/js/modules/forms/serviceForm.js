import { qs } from '../utils/dom.js';
import { populateSelect, setLoading, showToast } from '../ui/components.js';
import { getBikes, getServiceById, upsertService } from '../state.js';
import { getQueryParam, navigate } from '../router.js';
import { validateServiceForm, formatErrors } from '../validators.js';
import { toInputDate } from '../utils/date.js';

const SERVICE_TYPES_URL = '/data/serviceTypes.json';
let serviceTypes = [];

export async function initServiceForm() {
  const form = qs('#service-form');
  if (!form) {
    return;
  }

  const bikeSelect = form.elements.bike;
  const typeSelect = form.elements.type;
  const cancelButton = form.querySelector('[data-action="cancel"]');
  const bikeId = getQueryParam('bikeId');
  const entryId = getQueryParam('entryId');

  populateSelect(bikeSelect, getBikes().map((bike) => ({
    value: bike.id,
    label: `${bike.year} ${bike.make} ${bike.model}${bike.nickname ? ` (${bike.nickname})` : ''}`.trim()
  })), { placeholder: 'Select a bike' });

  if (bikeId) {
    bikeSelect.value = bikeId;
  }

  await loadServiceTypes(typeSelect);

  if (entryId) {
    hydrateForm(form, entryId);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSubmit(form);
  });

  cancelButton?.addEventListener('click', () => {
    if (bikeSelect.value) {
      navigate('/bike.html', { id: bikeSelect.value });
    } else {
      navigate('/index.html');
    }
  });
}

async function loadServiceTypes(select) {
  try {
    setLoading(select, true);
    const response = await fetch(SERVICE_TYPES_URL, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`Failed to load service types: ${response.status}`);
    }
    const data = await response.json();
    serviceTypes = Array.isArray(data) ? data : [];
    populateSelect(select, serviceTypes.map((item) => ({ value: item.id, label: item.label })), {
      placeholder: 'Select a service type'
    });
  } catch (error) {
    console.error(error);
    populateSelect(select, [], { placeholder: 'Select a service type' });
    showToast({ message: 'Unable to load service types.', variant: 'error' });
  } finally {
    setLoading(select, false);
  }
}

function hydrateForm(form, entryId) {
  const entry = getServiceById(entryId);
  if (!entry) {
    return;
  }
  form.elements.bike.value = entry.bikeId;
  form.elements.date.value = toInputDate(entry.date);
  form.elements.odo.value = entry.odo ?? '';
  form.elements.hours.value = entry.hours ?? '';
  form.elements.type.value = entry.type ?? '';
  form.elements.cost.value = entry.cost ?? '';
  form.elements.vendor.value = entry.vendor ?? '';
  form.elements.notes.value = entry.notes ?? '';
}

function handleSubmit(form) {
  const errorRegion = qs('#form-errors');
  const errors = validateServiceForm(form);

  if (errors.length) {
    errorRegion.innerHTML = formatErrors(errors);
    errorRegion.classList.remove('visually-hidden');
    errorRegion.focus?.();
    return;
  }

  errorRegion.innerHTML = '';
  errorRegion.classList.add('visually-hidden');

  const payload = buildPayload(form);
  upsertService(payload);
  showToast({ message: 'Service entry saved', variant: 'success' });
  navigate('/bike.html', { id: payload.bikeId });
}

function buildPayload(form) {
  const entryId = getQueryParam('entryId');
  const id = entryId || cryptoId();
  const bikeId = form.elements.bike.value;
  const type = form.elements.type.value;
  const typeMeta = serviceTypes.find((item) => item.id === type);
  return {
    id,
    bikeId,
    date: form.elements.date.value,
    odo: toNumber(form.elements.odo.value),
    hours: toNumber(form.elements.hours.value),
    type,
    typeLabel: typeMeta?.label,
    vendor: form.elements.vendor.value.trim() || null,
    cost: toNumber(form.elements.cost.value),
    notes: form.elements.notes.value.trim() || '',
  };
}

function toNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function cryptoId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
