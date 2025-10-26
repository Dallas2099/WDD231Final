export function formatCurrency(amount, currency = 'USD') {
  if (amount === undefined || amount === null || amount === '') {
    return '—';
  }
  const value = Number(amount);
  if (Number.isNaN(value)) {
    return String(amount);
  }
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
}
