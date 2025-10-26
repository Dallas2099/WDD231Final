import { getBikeById, getServicesByBike } from '../modules/state.js';
import { getQueryParam, navigate } from '../modules/router.js';
import { setText, qs } from '../modules/utils/dom.js';
import { renderServiceRows } from '../modules/ui/table.js';
import { showToast } from '../modules/ui/components.js';
import { formatDisplayDate } from '../modules/utils/date.js';

const SERVICE_TYPES_URL = '/data/serviceTypes.json';
let typeLookup = {};

init();

async function init() {
  const bikeId = getQueryParam('id');
  if (!bikeId) {
    showToast({ message: 'No bike selected', variant: 'error' });
    navigate('/index.html');
    return;
  }

  await prepareTypeLookup();
  hydrateBike(bikeId);
  hydrateServices(bikeId);
  bindActions(bikeId);
  setText(qs('[data-bind="year"]'), new Date().getFullYear());
}

async function prepareTypeLookup() {
  try {
    const response = await fetch(SERVICE_TYPES_URL);
    if (response.ok) {
      const data = await response.json();
      typeLookup = Object.fromEntries(data.map((item) => [item.id, item.label]));
    }
  } catch (error) {
    console.warn('Unable to load service type lookup', error);
  }
}

function hydrateBike(bikeId) {
  const bike = getBikeById(bikeId);
  if (!bike) {
    showToast({ message: 'Bike not found', variant: 'error' });
    navigate('/index.html');
    return;
  }
  setText(qs('[data-bind="bike-title"]'), `${bike.year} ${bike.make} ${bike.model}`);
  setText(qs('[data-bind="bike-nickname"]'), bike.nickname || '—');
  setText(qs('[data-bind="bike-odo"]'), bike.odometer ? `${bike.odometer} mi` : '—');
}

function hydrateServices(bikeId) {
  const sortSelect = qs('[data-sort]');
  const tbody = qs('[data-region="service-table-body"]');
  if (!tbody) {
    return;
  }
  const baseServices = getServicesByBike(bikeId).map((entry) => ({
    ...entry,
    typeLabel: entry.typeLabel || typeLookup[entry.type]
  }));
  const applySort = () => {
    const value = sortSelect?.value || 'date-desc';
    const sorted = sortServices(baseServices, value);
    renderServiceRows(tbody, sorted, {
      onEdit: (service) => navigate('/service.html', { bikeId: service.bikeId, entryId: service.id })
    });
  };

  sortSelect?.addEventListener('change', applySort);
  applySort();

  const last = [...baseServices].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  setText(qs('[data-bind="bike-last-service"]'), last ? formatDisplayDate(last.date) : '—');
}

function bindActions(bikeId) {
  const addLink = document.querySelector('[data-link="add-service"]');
  addLink?.setAttribute('href', `/service.html?bikeId=${bikeId}`);
}

function sortServices(list, value) {
  const sorted = [...list];
  switch (value) {
    case 'date-asc':
      return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
    case 'odo-desc':
      return sorted.sort((a, b) => (b.odo || 0) - (a.odo || 0));
    case 'odo-asc':
      return sorted.sort((a, b) => (a.odo || 0) - (b.odo || 0));
    case 'date-desc':
    default:
      return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
}
