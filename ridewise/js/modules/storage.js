const STORAGE_KEY = 'ridewise-data';
const SCHEMA_VERSION = 1;

const DEFAULT_DATA = {
  schemaVersion: SCHEMA_VERSION,
  prefs: { units: { distance: 'miles', temperature: 'fahrenheit' }, currency: 'USD', theme: 'auto' },
  bikes: [
    { id: 'abc123', year: 2005, make: 'BMW', model: 'R1200GS', nickname: 'GS', odometer: 48210 }
  ],
  services: [
    { id: 'def456', bikeId: 'abc123', date: '2025-10-01', odo: 48000, hours: null, type: 'oil_change', vendor: 'Self', cost: 74.23, notes: '' }
  ]
};

function isStorageAvailable() {
  try {
    const testKey = '__ridewise_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn('RideWise localStorage unavailable', error);
    return false;
  }
}

function migrate(data) {
  const version = data?.schemaVersion ?? 0;
  if (version === SCHEMA_VERSION) {
    return data;
  }

  const migrated = { ...data };

  if (version < 1) {
    migrated.schemaVersion = 1;
    migrated.services = (migrated.services ?? []).map((service) => ({ hours: null, notes: '', ...service }));
  }

  return { ...DEFAULT_DATA, ...migrated, schemaVersion: SCHEMA_VERSION };
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('RideWise failed to parse stored data', error);
    return null;
  }
}

export function loadData() {
  if (!isStorageAvailable()) {
    return clone(DEFAULT_DATA);
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    saveData(DEFAULT_DATA);
    return clone(DEFAULT_DATA);
  }
  const parsed = safeParse(raw);
  const migrated = migrate(parsed ?? {});
  saveData(migrated);
  return clone(migrated);
}

export function saveData(data) {
  if (!isStorageAvailable()) {
    return;
  }
  const payload = JSON.stringify({ ...data, schemaVersion: SCHEMA_VERSION });
  window.localStorage.setItem(STORAGE_KEY, payload);
}

export function resetData() {
  saveData(DEFAULT_DATA);
  return clone(DEFAULT_DATA);
}

export function exportData() {
  const data = loadData();
  return JSON.stringify(data, null, 2);
}

export function importData(json) {
  const parsed = safeParse(json);
  if (!parsed) {
    throw new Error('Import data must be valid JSON');
  }
  const migrated = migrate(parsed);
  saveData(migrated);
  return migrated;
}

export function getSchemaVersion() {
  return SCHEMA_VERSION;
}

function clone(payload) {
  if (typeof structuredClone === 'function') {
    return structuredClone(payload);
  }
  return JSON.parse(JSON.stringify(payload));
}
