export const KEYS = {
  bikes: "ridewise.bikes.v1",
  services: "ridewise.services.v1",
  prefs: "ridewise.prefs.v1"
};
export function load(key, fallback){
  try{ return JSON.parse(localStorage.getItem(key)) ?? fallback; }catch{ return fallback; }
}
export function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
export function upsert(list, item, idProp="id"){
  const i = list.findIndex(x => x[idProp] === item[idProp]);
  if(i >= 0) list[i] = item; else list.unshift(item);
  return list;
}
export function remove(list, id, idProp="id"){ return list.filter(x => x[idProp] !== id); }
