import { getState, getBikes, getServicesByBike } from '../modules/state.js';
import { qs, qsa, setText, hide, show, toggleExpanded } from '../modules/utils/dom.js';
import { showToast, populateSelect } from '../modules/ui/components.js';
import { navigate } from '../modules/router.js';
import { formatDisplayDate } from '../modules/utils/date.js';
import { formatCurrency } from '../modules/utils/currency.js';

const SERVICE_TYPES_URL = '/data/serviceTypes.json';

init();

function init() {
  const addBikeButton = document.querySelector('[data-action="add-bike"]');
  const addServiceButton = document.querySelector('[data-action="add-service"]');
  const filterToggle = document.querySelector('[data-action="toggle-filters"]');
  const filterPanel = qs('#filter-panel');

  setText(qs('[data-bind="year"]'), new Date().getFullYear());
  renderStats();
  renderBikeCards();
  loadFilterOptions();

  addBikeButton?.addEventListener('click', () => {
    showToast({ message: 'Bike creation flow coming soon', variant: 'info' });
  });

  addServiceButton?.addEventListener('click', () => navigate('/service.html'));

  filterToggle?.addEventListener('click', () => {
    const expanded = filterToggle.getAttribute('aria-expanded') === 'true';
    if (expanded) {
      hide(filterPanel);
    } else {
      show(filterPanel);
    }
    toggleExpanded(filterToggle, !expanded);
  });

  qsa('[data-filter]').forEach((element) => {
    element.addEventListener('change', renderBikeCards);
  });
}

function renderStats() {
  const statRegion = document.querySelector('[data-region="stats"]');
  if (!statRegion) {
    return;
  }
  const { bikes, services } = getState();
  const totalCost = services.reduce((total, entry) => total + (Number(entry.cost) || 0), 0);
  const recent = [...services].sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  statRegion.innerHTML = `
    <article class="card stat-card" role="listitem">
      <strong>${bikes.length}</strong>
      <span>Bikes tracked</span>
    </article>
    <article class="card stat-card" role="listitem">
      <strong>${services.length}</strong>
      <span>Services logged</span>
    </article>
    <article class="card stat-card" role="listitem">
      <strong>${formatCurrency(totalCost)}</strong>
      <span>Total spend</span>
    </article>
    <article class="card stat-card" role="listitem">
      <strong>${recent ? formatDisplayDate(recent.date) : '—'}</strong>
      <span>Last service</span>
    </article>
  `;
}

function renderBikeCards() {
  const region = document.querySelector('[data-region="bike-cards"]');
  if (!region) {
    return;
  }
  const bikes = getBikes();
  const filterType = qs('[data-filter="type"]')?.value || '';
  const filterBike = qs('[data-filter="bike"]')?.value || '';

  const filteredBikes = bikes.filter((bike) => {
    if (filterBike && bike.id !== filterBike) {
      return false;
    }
    if (!filterType) {
      return true;
    }
    return getServicesByBike(bike.id).some((service) => service.type === filterType);
  });
  const fragment = document.createDocumentFragment();
  filteredBikes.forEach((bike) => {
    const services = getServicesByBike(bike.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    const filteredServices = services.filter((service) => !filterType || service.type === filterType);
    const lastService = filteredServices[0];
    const wrapper = document.createElement('article');
    wrapper.className = 'card';
    wrapper.setAttribute('role', 'listitem');
    wrapper.innerHTML = `
      <header>
        <h3>${bike.nickname || `${bike.make} ${bike.model}`}</h3>
        <p class="muted">${bike.year} ${bike.make} ${bike.model}</p>
      </header>
      <p><strong>Odometer:</strong> ${bike.odometer ?? '—'} mi</p>
      <p><strong>Last service:</strong> ${lastService ? formatDisplayDate(lastService.date) : '—'}</p>
      <div class="card-actions">
        <a class="btn-secondary" href="/bike.html?id=${bike.id}">View details</a>
        <a class="btn-link" href="/service.html?bikeId=${bike.id}">Log service</a>
      </div>
    `;
    fragment.appendChild(wrapper);
  });

  region.innerHTML = '';
  if (!filteredBikes.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'No bikes match the selected filters yet.';
    region.appendChild(empty);
    return;
  }
  region.appendChild(fragment);
}

async function loadFilterOptions() {
  const serviceFilter = qs('[data-filter="type"]');
  try {
    const response = await fetch(SERVICE_TYPES_URL, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`Failed to load service types: ${response.status}`);
    }
    const data = await response.json();
    populateSelect(serviceFilter, data.map((item) => ({ value: item.id, label: item.label })), {
      placeholder: 'All service types'
    });
  } catch (error) {
    console.error(error);
    populateSelect(serviceFilter, [], { placeholder: 'All service types' });
  }

  const bikeFilter = qs('[data-filter="bike"]');
  populateSelect(bikeFilter, getBikes().map((bike) => ({
    value: bike.id,
    label: bike.nickname || `${bike.make} ${bike.model}`
  })), { placeholder: 'All bikes' });
}
