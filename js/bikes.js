import { loadAppData, saveAppData } from "./storage.js";

const randomId = (prefix) =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export function getBikes() {
  return loadAppData().bikes;
}

export function findBikeById(id) {
  return getBikes().find((bike) => bike.id === id) || null;
}

export function addBike(partialBike) {
  const data = loadAppData();
  const newBike = {
    id: partialBike.id || randomId("bike"),
    name: partialBike.name?.trim() || "New Bike",
    make: partialBike.make?.trim() || "",
    model: partialBike.model?.trim() || "",
    year: Number(partialBike.year) || new Date().getFullYear()
  };
  data.bikes.push(newBike);
  saveAppData(data);
  return newBike;
}
