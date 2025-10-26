import { loadData, saveData } from './storage.js';

const state = {
  initialized: false,
  prefs: null,
  bikes: [],
  services: [],
};

function ensureState() {
  if (!state.initialized) {
    const data = loadData();
    state.prefs = data.prefs;
    state.bikes = data.bikes;
    state.services = data.services;
    state.initialized = true;
  }
}

export function getState() {
  ensureState();
  return state;
}

export function getBikes() {
  ensureState();
  return state.bikes;
}

export function getBikeById(id) {
  ensureState();
  return state.bikes.find((bike) => bike.id === id) ?? null;
}

export function getServicesByBike(bikeId) {
  ensureState();
  return state.services.filter((service) => service.bikeId === bikeId);
}

export function getServiceById(id) {
  ensureState();
  return state.services.find((service) => service.id === id) ?? null;
}

export function upsertService(entry) {
  ensureState();
  const index = state.services.findIndex((service) => service.id === entry.id);
  if (index >= 0) {
    state.services[index] = { ...state.services[index], ...entry };
  } else {
    state.services.push(entry);
  }
  persist();
}

export function upsertBike(bike) {
  ensureState();
  const index = state.bikes.findIndex((existing) => existing.id === bike.id);
  if (index >= 0) {
    state.bikes[index] = { ...state.bikes[index], ...bike };
  } else {
    state.bikes.push(bike);
  }
  persist();
}

export function updatePrefs(prefs) {
  ensureState();
  state.prefs = { ...state.prefs, ...prefs };
  persist();
}

function persist() {
  saveData({ schemaVersion: 1, prefs: state.prefs, bikes: state.bikes, services: state.services });
}
