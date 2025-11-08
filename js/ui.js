import { save, load, KEYS, upsert, remove } from "./storage.js";
import { getParams, setParam } from "./router.js";

let state = {
  bikes: [],
  types: [],
  services: [],
  prefs: { units:"miles", theme:"system" }
};

export function initUI({ seedBikes, seedTypes }){
  // Hydrate state from storage or seeds
  state.bikes = load(KEYS.bikes, seedBikes);
  state.types = seedTypes;
  state.services = load(KEYS.services, []);
  state.prefs = load(KEYS.prefs, state.prefs);

  // DOM refs
  const yearEl = document.getElementById("year");
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // Selects
  const selBike = document.getElementById("bikeId");
  const selFilterBike = document.getElementById("filter-bike");
  const selType = document.getElementById("serviceType");
  const selFilterType = document.getElementById("filter-type");

  // Populate dropdowns
  function renderBikeOptions(select, includeAll=false){
    select.innerHTML = includeAll ? `<option value="">All</option>` : "";
    for(const b of state.bikes){
      const o = document.createElement("option");
      o.value = b.id;
      o.textContent = `${b.nickname ?? ""} ${b.year} ${b.make} ${b.model}`.trim();
      select.appendChild(o);
    }
  }
  renderBikeOptions(selBike);
  renderBikeOptions(selFilterBike, true);

  selType.innerHTML = state.types.map(t => `<option>${t}</option>`).join("");
  selFilterType.insertAdjacentHTML("beforeend", state.types.map(t => `<option>${t}</option>`).join(""));

  // URL param ?bike=…
  const { bike } = getParams();
  if(bike && state.bikes.some(b => b.id === bike)){
    selBike.value = bike;
    selFilterBike.value = bike;
  }

  // Filters
  const qEl = document.getElementById("filter-q");
  [selFilterBike, selFilterType, qEl].forEach(el => el.addEventListener("input", renderList));

  // Form validation + submit
  const form = document.getElementById("service-form");
  form.addEventListener("submit", onSubmit);
  form.addEventListener("input", onValidate);
  onValidate();

  // Settings
  const dlg = document.getElementById("settings-modal");
  const openBtn = document.getElementById("open-settings");
  const units = document.getElementById("units");
  const theme = document.getElementById("theme");
  units.value = state.prefs.units;
  theme.value = state.prefs.theme;
  openBtn.addEventListener("click", () => dlg.showModal());
  document.getElementById("save-settings").addEventListener("click", () => {
    state.prefs.units = units.value; state.prefs.theme = theme.value;
    save(KEYS.prefs, state.prefs);
  });

  renderList();
  renderStats();
}

function onValidate(){
  const f = document.getElementById("service-form");
  const fields = ["bikeId","date","odometer","serviceType","cost"];
  const errors = {
    bikeId: "Please select a bike.",
    date: "Please enter a date.",
    odometer: "Odometer/Hours must be 0 or more.",
    serviceType: "Please choose a service type.",
    cost: "Cost must be 0 or more."
  };
  for(const name of fields){
    const el = f.elements[name];
    const err = document.getElementById(`err-${name}`);
    if(!el) continue;
    let msg = "";
    if(name==="odometer" && (el.value==="" || Number(el.value) < 0)) msg = errors[name];
    else if(name==="cost" && el.value!=="" && Number(el.value) < 0) msg = errors[name];
    else if(el.required && !el.value) msg = errors[name];
    err.textContent = msg;
  }
}

function onSubmit(e){
  e.preventDefault();
  const f = e.currentTarget;
  onValidate();
  if(f.querySelector(".error:not(:empty)")) return;

  const entry = {
    id: f.entryId.value || crypto.randomUUID(),
    bikeId: f.bikeId.value,
    date: f.date.value,
    odometer: Number(f.odometer.value),
    serviceType: f.serviceType.value,
    cost: f.cost.value==="" ? null : Number(f.cost.value),
    vendor: f.vendor.value.trim(),
    notes: f.notes.value.trim(),
    createdAt: Date.now()
  };
  state.services = upsert(state.services, entry, "id");
  save(KEYS.services, state.services);

  // reflect bike in URL param
  setParam("bike", entry.bikeId);

  f.reset();
  f.entryId.value = "";
  showToast("Saved");
  renderList();
  renderStats();
}

function showToast(text){
  const t = document.getElementById("toast");
  t.textContent = text;
  t.hidden = false;
  t.classList.add("show");
  setTimeout(()=>{ t.classList.remove("show"); t.hidden = true; }, 1800);
}

function renderList(){
  const ul = document.getElementById("entries");
  const bike = document.getElementById("filter-bike").value;
  const type = document.getElementById("filter-type").value;
  const q = document.getElementById("filter-q").value.toLowerCase();

  let rows = [...state.services];
  if(bike) rows = rows.filter(r => r.bikeId === bike);
  if(type) rows = rows.filter(r => r.serviceType === type);
  if(q) rows = rows.filter(r =>
    (r.vendor || "").toLowerCase().includes(q) || (r.notes || "").toLowerCase().includes(q)
  );
  rows.sort((a,b)=> b.createdAt - a.createdAt);

  const bikesById = Object.fromEntries(state.bikes.map(b => [b.id, b]));
  ul.innerHTML = rows.map(r => {
    const b = bikesById[r.bikeId];
    const bikeName = b ? `${b.nickname ?? ""} ${b.year} ${b.make} ${b.model}`.trim() : r.bikeId;
    return `
<li class="entry" data-id="${r.id}">
  <div class="entry__meta"><strong>${bikeName}</strong> • ${r.serviceType} • ${r.date}</div>
  <div>${r.odometer.toLocaleString()} ${currentUnits()}</div>
  ${r.vendor ? `<div>Vendor: ${escapeHtml(r.vendor)}</div>` : ""}
  ${r.cost!=null ? `<div>Cost: $${r.cost.toFixed(2)}</div>` : ""}
  ${r.notes ? `<div>Notes: ${escapeHtml(r.notes)}</div>` : ""}
  <div class="entry__actions">
    <button class="btn" data-action="edit">Edit</button>
    <button class="btn" data-action="delete">Delete</button>
  </div>
</li>`;
  }).join("");

  // actions
  ul.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", e => {
      const li = e.currentTarget.closest(".entry");
      const id = li.dataset.id;
      const action = e.currentTarget.dataset.action;
      if(action==="delete"){
        state.services = remove(state.services, id, "id");
        save(KEYS.services, state.services);
        renderList(); renderStats(); showToast("Deleted");
      } else if(action==="edit"){
        const entry = state.services.find(x => x.id === id);
        loadForm(entry);
      }
    });
  });
}

function renderStats(){
  const el = document.getElementById("stats-content");
  const count = state.services.length;
  const totalCost = state.services.reduce((s,r)=> s + (r.cost || 0), 0);
  el.innerHTML = `
    <div><strong>Entries:</strong> ${count}</div>
    <div><strong>Total Cost:</strong> $${totalCost.toFixed(2)}</div>
  `;
}

function loadForm(entry){
  const f = document.getElementById("service-form");
  f.entryId.value = entry.id;
  f.bikeId.value = entry.bikeId;
  f.date.value = entry.date;
  f.odometer.value = entry.odometer;
  f.serviceType.value = entry.serviceType;
  f.cost.value = entry.cost ?? "";
  f.vendor.value = entry.vendor ?? "";
  f.notes.value = entry.notes ?? "";
  f.scrollIntoView({behavior:"smooth", block:"center"});
}

function escapeHtml(s){ return s.replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[m])); }
function currentUnits(){ return load(KEYS.prefs, {units:"miles"}).units; }
