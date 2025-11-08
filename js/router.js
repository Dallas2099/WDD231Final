export function getParams(){
  const p = new URLSearchParams(location.search);
  return Object.fromEntries(p.entries());
}
export function setParam(name, value){
  const u = new URL(location.href);
  if(value) u.searchParams.set(name, value); else u.searchParams.delete(name);
  history.replaceState({}, "", u);
}
