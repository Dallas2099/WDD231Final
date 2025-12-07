import { loadAppData } from "./storage.js";
import { getBikes, findBikeById } from "./bikes.js";
import { getServicesForBike, addService, loadServiceTypes } from "./services.js";
import {
  setupDashboard,
  updateBikeSelector,
  renderServiceTypeFilter,
  renderEntries,
  renderStats
} from "./ui/renderDashboard.js";
import {
  setupServiceForm,
  populateBikeOptions,
  populateServiceTypes
} from "./ui/renderForms.js";
import { showToast } from "./ui/toasts.js";
import { getParam, setParam } from "./urlParams.js";
import { setupAddBikeModal } from "./ui/addBikeModal.js";

const state = {
  activeBikeId: null,
  serviceTypes: [],
  filters: { serviceTypeId: "", query: "" }
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  loadAppData(); // ensure defaults seeded
  try {
    state.serviceTypes = await loadServiceTypes();
  } catch (error) {
    console.error("RideWise: Failed to load service types.", error);
    state.serviceTypes = [];
  }

  setupDashboard({
    onBikeChange: handleBikeChange,
    onFilterChange: handleFilterChange
  });
  setupServiceForm({ onSubmit: handleServiceSubmit });
  setupAddBikeModal({ onBikeAdded: handleBikeAdded });

  renderServiceTypeFilter(state.serviceTypes);
  populateServiceTypes(state.serviceTypes);

  const bikes = getBikes();
  state.activeBikeId = resolveInitialBikeId(bikes);
  updateBikeSelector(bikes, state.activeBikeId);
  populateBikeOptions(bikes, state.activeBikeId);
  render();
}

function resolveInitialBikeId(bikes) {
  const fromUrl = getParam("bikeId");
  if (fromUrl && bikes.some((bike) => bike.id === fromUrl)) {
    return fromUrl;
  }
  return bikes[0]?.id || null;
}

function handleBikeChange(nextBikeId) {
  state.activeBikeId = nextBikeId;
  setParam("bikeId", nextBikeId);
  populateBikeOptions(getBikes(), state.activeBikeId);
  render();
}

function handleFilterChange(filters) {
  state.filters = filters;
  const bikes = getBikes();
  const allEntries = getServicesForBike(state.activeBikeId);
  renderEntries(applyFilters(allEntries), bikes, state.serviceTypes, allEntries.length);
}

async function handleServiceSubmit(formValues) {
  await addService(formValues);
  state.activeBikeId = formValues.bikeId;
  setParam("bikeId", state.activeBikeId, { replace: true });
  showToast("Service entry saved");
  render();
}

function handleBikeAdded(bike) {
  state.activeBikeId = bike.id;
  setParam("bikeId", state.activeBikeId, { replace: true });
  const bikes = getBikes();
  updateBikeSelector(bikes, state.activeBikeId);
  populateBikeOptions(bikes, state.activeBikeId);
  render();
}

function applyFilters(entries = getServicesForBike(state.activeBikeId)) {
  if (!state.activeBikeId) return [];
  return entries.filter((entry) => {
    const matchesType = state.filters.serviceTypeId
      ? entry.serviceTypeId === state.filters.serviceTypeId
      : true;
    const matchesQuery = state.filters.query
      ? `${entry.vendor} ${entry.notes}`.toLowerCase().includes(state.filters.query)
      : true;
    return matchesType && matchesQuery;
  });
}

function render() {
  const bikes = getBikes();
  if (!state.activeBikeId && bikes.length) {
    state.activeBikeId = bikes[0].id;
    setParam("bikeId", state.activeBikeId, { replace: true });
  }
  updateBikeSelector(bikes, state.activeBikeId);
  populateBikeOptions(bikes, state.activeBikeId);

  const entries = getServicesForBike(state.activeBikeId);
  renderEntries(applyFilters(entries), bikes, state.serviceTypes, entries.length);
  renderStats(findBikeById(state.activeBikeId), entries);
}
