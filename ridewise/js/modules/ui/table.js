import { formatDisplayDate } from '../utils/date.js';
import { formatCurrency } from '../utils/currency.js';

export function renderServiceRows(tbody, services, { currency = 'USD', onEdit } = {}) {
  if (!tbody) {
    return;
  }
  tbody.innerHTML = '';
  if (!services.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.className = 'empty';
    cell.textContent = 'No service entries yet.';
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  services.forEach((service) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDisplayDate(service.date)}</td>
      <td>${formatUsage(service)}</td>
      <td>${service.typeLabel ?? service.type}</td>
      <td>${service.vendor ?? '—'}</td>
      <td>${formatCurrency(service.cost, currency)}</td>
      <td>
        <button type="button" class="btn-link" data-action="edit-service" data-service-id="${service.id}">Edit</button>
      </td>
    `;
    if (typeof onEdit === 'function') {
      const editButton = row.querySelector('[data-action="edit-service"]');
      editButton?.addEventListener('click', () => onEdit(service));
    }
    tbody.appendChild(row);
  });
}

function formatUsage(service) {
  if (service.odo && service.hours) {
    return `${service.odo} mi / ${service.hours} hr`;
  }
  if (service.odo) {
    return `${service.odo} mi`;
  }
  if (service.hours) {
    return `${service.hours} hr`;
  }
  return '—';
}
