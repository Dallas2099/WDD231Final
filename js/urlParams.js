export function getParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

export function setParam(name, value, options = {}) {
  const url = new URL(window.location);
  if (value === null || value === undefined || value === "") {
    url.searchParams.delete(name);
  } else {
    url.searchParams.set(name, value);
  }
  const method = options.replace ? "replaceState" : "pushState";
  window.history[method]({}, "", url);
}

export function getParams() {
  return new URLSearchParams(window.location.search);
}
