/* Accepted catalog controls. Only an explicitly rendered, complete category supports facets. */
(() => {
  'use strict';
  const root = document.querySelector('.catalog--category');
  if (!root) return;
  const controls = root.querySelector('.category-controls');
  if (controls) {
    const compact = matchMedia('(max-width: 599px)');
    let mobileOpen = false;
    const layout = () => { controls.open = compact.matches ? mobileOpen : true; };
    controls.addEventListener('toggle', () => { if (compact.matches) mobileOpen = controls.open; });
    compact.addEventListener('change', layout);
    layout();
    controls.classList.add('is-ready');
  }
  const form = root.querySelector('.category-filter');
  const grid = root.querySelector('.category-results > .pgrid');
  const sort = root.querySelector('#category-sort');
  if (!form || !grid || !sort) return;
  const cards = [...grid.querySelectorAll(':scope > .pcard')];
  const count = root.querySelector('[data-category-count]');
  const word = root.querySelector('[data-category-word]');
  const empty = root.querySelector('.category-empty');
  const reset = form.querySelector('[type="reset"]');
  function render() {
    const selected = [...form.querySelectorAll('input:checked')].map(input => input.value);
    let visible = 0;
    cards.forEach(card => {
      card.hidden = selected.length > 0 && !selected.includes(card.dataset.force);
      if (!card.hidden) visible++;
    });
    [...cards].sort((a, b) => {
      if (sort.value === 'force-asc') return Number(a.dataset.force) - Number(b.dataset.force);
      if (sort.value === 'force-desc') return Number(b.dataset.force) - Number(a.dataset.force);
      return Number(a.dataset.order) - Number(b.dataset.order);
    }).forEach(card => grid.append(card));
    if (count) count.textContent = visible;
    if (word) word.textContent = visible % 10 === 1 && visible % 100 !== 11 ? 'товар' : visible % 10 >= 2 && visible % 10 <= 4 && (visible % 100 < 12 || visible % 100 > 14) ? 'товара' : 'товаров';
    grid.dataset.n = visible;
    if (empty) empty.hidden = visible > 0;
    if (reset) reset.disabled = selected.length === 0;
  }
  form.addEventListener('change', render);
  form.addEventListener('reset', event => {
    event.preventDefault();
    form.querySelectorAll('input[type="checkbox"]').forEach(input => { input.checked = input.defaultChecked; });
    render();
  });
  sort.addEventListener('change', render);
  render();
})();
