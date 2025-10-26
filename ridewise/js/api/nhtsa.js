const BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const DEFAULT_PARAMS = new URLSearchParams({ format: 'json' });

async function request(path, params = {}) {
  const url = new URL(path, BASE_URL);
  const combined = new URLSearchParams(DEFAULT_PARAMS);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      combined.set(key, value);
    }
  });
  url.search = combined.toString();

  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`NHTSA request failed: ${response.status}`);
  }
  return response.json();
}

export async function decodeVin(vin) {
  if (!vin || vin.length < 5) {
    throw new Error('VIN must be at least 5 characters long');
  }
  const data = await request(`/DecodeVin/${encodeURIComponent(vin)}`);
  return data?.Results ?? [];
}

export async function getMakesByYear(year) {
  const data = await request('/GetMakesForVehicleType', { year, vehicleType: 'motorcycle' });
  return data?.Results ?? [];
}
