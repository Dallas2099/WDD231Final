export function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

export function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

export function on(element, event, handler, options) {
  element.addEventListener(event, handler, options);
  return () => element.removeEventListener(event, handler, options);
}

export function setText(element, value) {
  if (element) {
    element.textContent = value ?? '';
  }
}

export function show(element) {
  if (element) {
    element.hidden = false;
    element.setAttribute('aria-hidden', 'false');
  }
}

export function hide(element) {
  if (element) {
    element.hidden = true;
    element.setAttribute('aria-hidden', 'true');
  }
}

export function toggleExpanded(trigger, expanded) {
  trigger.setAttribute('aria-expanded', String(expanded));
}
