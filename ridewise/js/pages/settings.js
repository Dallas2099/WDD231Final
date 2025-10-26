import { getState, updatePrefs } from '../modules/state.js';
import { exportData, importData } from '../modules/storage.js';
import { showToast } from '../modules/ui/components.js';
import { qs, setText } from '../modules/utils/dom.js';

init();

function init() {
  const form = qs('#settings-form');
  const exportButton = form?.querySelector('[data-action="export"]');
  const importInput = form?.querySelector('[data-field="import"]');

  setText(qs('[data-bind="year"]'), new Date().getFullYear());
  hydrate(form);

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    updatePrefs({
      units: {
        distance: formData.get('distance'),
        temperature: formData.get('temperature')
      },
      theme: formData.get('theme')
    });
    applyTheme(formData.get('theme'));
    showToast({ message: 'Settings saved', variant: 'success' });
  });

  exportButton?.addEventListener('click', () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ridewise-backup.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  importInput?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      importData(text);
      hydrate(form);
      showToast({ message: 'Data imported', variant: 'success' });
    } catch (error) {
      console.error(error);
      showToast({ message: 'Import failed', variant: 'error' });
    } finally {
      event.target.value = '';
    }
  });
}

function hydrate(form) {
  const state = getState();
  if (!form || !state?.prefs) {
    return;
  }
  form.elements.distance.value = state.prefs.units?.distance ?? 'miles';
  form.elements.temperature.value = state.prefs.units?.temperature ?? 'fahrenheit';
  form.elements.theme.value = state.prefs.theme ?? 'auto';
  applyTheme(form.elements.theme.value);
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'auto') {
    root.dataset.theme = 'auto';
  } else {
    root.dataset.theme = theme;
  }
}
