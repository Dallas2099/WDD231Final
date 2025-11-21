const STORAGE_KEY = "ridewise_v1";

const clone = (value) =>
  typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));

const defaultData = {
  bikes: [
    { id: "bike_01", name: "Adventure Twin", make: "Honda", model: "CB500X", year: 2021 },
    { id: "bike_02", name: "Midnight Torque", make: "Yamaha", model: "MT-07", year: 2019 }
  ],
  services: [
    {
      id: "svc_seed_1",
      bikeId: "bike_01",
      date: "2024-04-05",
      odometer: 8200,
      serviceTypeId: "oil_change",
      cost: 64.99,
      vendor: "DIY",
      notes: "Swapped to full synthetic, torqued drain plug to 31 ft-lb."
    }
  ],
  preferences: {
    units: "miles",
    currency: "USD",
    theme: "light"
  }
};

export function loadAppData() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return clone(defaultData);
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...clone(defaultData),
      ...parsed,
      bikes: parsed.bikes?.length ? parsed.bikes : clone(defaultData.bikes),
      services: Array.isArray(parsed.services) ? parsed.services : [],
      preferences: { ...defaultData.preferences, ...(parsed.preferences || {}) }
    };
  } catch (error) {
    console.error("RideWise: failed to parse stored data. Resetting to defaults.", error);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return clone(defaultData);
  }
}

export function saveAppData(data) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

export { STORAGE_KEY };
