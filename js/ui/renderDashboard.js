const elements = {
  activeBikeSelect: document.getElementById("active-bike"),
  filterToggle: document.getElementById("filter-toggle"),
  filterPanel: document.getElementById("filter-panel"),
  filterService: document.getElementById("filter-service"),
  filterSearch: document.getElementById("filter-search"),
  entriesList: document.getElementById("entries"),
  emptyState: document.getElementById("empty-state"),
  statsContainer: document.getElementById("stats-content")
};

const escapeHtml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export function setupDashboard({ onBikeChange, onFilterChange }) {
  elements.activeBikeSelect?.addEventListener("change", (event) => {
    onBikeChange?.(event.target.value);
  });

  const emitFilters = () => {
    onFilterChange?.({
      serviceTypeId: elements.filterService?.value || "",
      query: elements.filterSearch?.value.trim().toLowerCase() || ""
    });
  };

  elements.filterService?.addEventListener("change", emitFilters);
  elements.filterSearch?.addEventListener("input", emitFilters);

  if (elements.filterToggle && elements.filterPanel) {
    elements.filterToggle.addEventListener("click", () => {
      const isCollapsed = elements.filterPanel.dataset.collapsed !== "false";
      const nextState = isCollapsed ? "false" : "true";
      elements.filterPanel.dataset.collapsed = nextState;
      elements.filterToggle.setAttribute("aria-expanded", String(!isCollapsed));
    });
  }

  emitFilters();
}

export function updateBikeSelector(bikes, activeBikeId) {
  if (!elements.activeBikeSelect) return;
  const options = bikes
    .map(
      (bike) =>
        `<option value="${bike.id}" ${bike.id === activeBikeId ? "selected" : ""}>
          ${escapeHtml(`${bike.year} ${bike.make} ${bike.model}`)}
        </option>`
    )
    .join("");
  elements.activeBikeSelect.innerHTML = options;
}

export function renderServiceTypeFilter(serviceTypes) {
  if (!elements.filterService) return;
  const currentValue = elements.filterService.value;
  const options = [
    `<option value="">All services</option>`,
    ...serviceTypes.map(
      (type) => `<option value="${type.id}">${escapeHtml(type.label)}</option>`
    )
  ].join("");
  elements.filterService.innerHTML = options;
  if (currentValue) {
    elements.filterService.value = currentValue;
  }
}

export function renderEntries(entries, bikes, serviceTypes, totalForBike = entries.length) {
  if (!elements.entriesList) return;
  const typeMap = Object.fromEntries(serviceTypes.map((type) => [type.id, type.label]));
  const bikeMap = Object.fromEntries(bikes.map((bike) => [bike.id, bike]));

  if (!entries.length) {
    elements.entriesList.innerHTML = "";
    if (elements.emptyState) {
      elements.emptyState.textContent =
        totalForBike > 0
          ? "No entries match your current filters."
          : "No service entries yet. Log your first maintenance action with the form on the right.";
      elements.emptyState.hidden = false;
    }
    return;
  }

  const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });

  elements.entriesList.innerHTML = entries
    .map((entry) => {
      const bike = bikeMap[entry.bikeId];
      return `
        <li class="entry">
          <div class="entry-header">
            <span>${escapeHtml(typeMap[entry.serviceTypeId] || "Service")}</span>
            <span>${formatter.format(new Date(entry.date))}</span>
          </div>
          <div class="entry-meta">
            ${escapeHtml(
              bike ? `${bike.year} ${bike.make} ${bike.model}` : "Unknown bike"
            )} ·
            Odo: ${entry.odometer.toLocaleString()}
            ${
              entry.cost != null
                ? ` · Cost: $${Number(entry.cost).toFixed(2)}`
                : ""
            }
            ${entry.vendor ? ` · Vendor: ${escapeHtml(entry.vendor)}` : ""}
          </div>
          ${
            entry.notes
              ? `<p class="entry-notes">${escapeHtml(entry.notes)}</p>`
              : ""
          }
        </li>
      `;
    })
    .join("");
  if (elements.emptyState) elements.emptyState.hidden = true;
}

export function renderStats(bike, entries) {
  if (!elements.statsContainer) return;
  if (!bike) {
    elements.statsContainer.innerHTML = "<p>Select a bike to get stats.</p>";
    return;
  }

  const latestEntry = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const totalSpent = entries.reduce((sum, entry) => sum + (entry.cost || 0), 0);
  const stats = [
    { label: "Bike", value: `${bike.year} ${bike.make}` },
    { label: "Services logged", value: String(entries.length) },
    {
      label: "Last service",
      value: latestEntry ? new Date(latestEntry.date).toLocaleDateString() : "—"
    },
    {
      label: "Odometer",
      value: latestEntry ? `${latestEntry.odometer.toLocaleString()} mi` : "—"
    },
    { label: "Lifetime spend", value: entries.length ? `$${totalSpent.toFixed(2)}` : "—" }
  ];

  elements.statsContainer.innerHTML = stats
    .map(
      (stat) => `
      <article class="stat">
        <div class="stat-label">${escapeHtml(stat.label)}</div>
        <div class="stat-value">${escapeHtml(String(stat.value))}</div>
      </article>`
    )
    .join("");
}
