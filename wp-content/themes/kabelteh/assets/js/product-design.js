(function () {
  'use strict';
  var control = document.querySelector('[data-rq-quantity-control]');
  if (!control) return;
  var input = control.querySelector('input');
  control.addEventListener('click', function (event) {
    var button = event.target.closest('[data-product-quantity]');
    if (!button) return;
    var value = input.valueAsNumber;
    if (!Number.isInteger(value) || value < 1) value = 1;
    value += button.getAttribute('data-product-quantity') === 'inc' ? 1 : -1;
    input.value = String(Math.min(999, Math.max(1, value)));
    input.setCustomValidity('');
  });
  input.addEventListener('input', function () { input.setCustomValidity(''); });
})();
