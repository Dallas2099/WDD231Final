import { loadAppData, saveAppData } from "./storage.js";

const TYPES_URL = "./data/serviceTypes.json";
let typesCache;

const randomId = (prefix) =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export async function loadServiceTypes() {
  if (typesCache) return typesCache;
  const response = await fetch(TYPES_URL);
  if (!response.ok) {
    throw new Error("Unable to load service types");
  }
  typesCache = await response.json();
  return typesCache;
}

export function getServices() {
  return loadAppData().services;
}

export function getServicesForBike(bikeId) {
  return getServices()
    .filter((service) => service.bikeId === bikeId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function addService(partialEntry) {
  const data = loadAppData();
  const service = {
    id: randomId("svc"),
    bikeId: partialEntry.bikeId,
    date: partialEntry.date,
    odometer: Number(partialEntry.odometer),
    serviceTypeId: partialEntry.serviceTypeId,
    cost: partialEntry.cost !== "" && partialEntry.cost != null ? Number(partialEntry.cost) : null,
    vendor: partialEntry.vendor?.trim() || "",
    notes: partialEntry.notes?.trim() || ""
  };

  data.services.push(service);
  saveAppData(data);
  return service;
}
