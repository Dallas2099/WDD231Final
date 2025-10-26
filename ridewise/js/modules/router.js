export function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}

export function getQueryParam(name, fallback = null) {
  const params = getQueryParams();
  return params[name] ?? fallback;
}

export function requireParam(name) {
  const value = getQueryParam(name);
  if (!value) {
    throw new Error(`Missing required parameter: ${name}`);
  }
  return value;
}

export function createUrl(path, params = {}) {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

export function navigate(path, params = {}) {
  const url = createUrl(path, params);
  window.location.assign(url);
}
