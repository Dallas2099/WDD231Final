import { initServiceForm } from '../modules/forms/serviceForm.js';
import { qs, setText } from '../modules/utils/dom.js';

init();

function init() {
  setText(qs('[data-bind="year"]'), new Date().getFullYear());
  initServiceForm();
}
