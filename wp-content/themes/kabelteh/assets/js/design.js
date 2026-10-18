/* Only the review copy. Catalog names and search records are generated from the real catalog. */
(() => {
  'use strict';
  const catalogButton = document.querySelector('.nav-catalog');
  const catalogPanel = document.getElementById('catalog-panel');
  const backdrop = document.querySelector('.menu-backdrop');
  const menuButton = document.querySelector('.mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const main = document.querySelector('main');
  const header = document.querySelector('.site-header');
  const otherButtons = [...document.querySelectorAll('.nav-dropdown-button')];
  function closeOtherPanels(except = null) {
    otherButtons.forEach(button => {
      if (button === except) return;
      button.setAttribute('aria-expanded', 'false');
      document.getElementById(button.getAttribute('aria-controls')).hidden = true;
    });
  }
  otherButtons.forEach(button => {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    function open() {
      setCatalog(false);
      closeOtherPanels(button);
      panel.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      backdrop.hidden = false;
    }
    button.addEventListener('click', () => {
      const shouldOpen = panel.hidden;
      closeOtherPanels();
      if (shouldOpen) open();
      else backdrop.hidden = true;
    });
    button.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') { event.preventDefault(); open(); panel.querySelector('a').focus(); }
    });
  });
  let mobileReturnFocus = null;
  function setCatalog(open, restore = false) {
    if (open) closeOtherPanels();
    catalogButton.setAttribute('aria-expanded', String(open));
    catalogPanel.hidden = !open;
    backdrop.hidden = !open;
    if (restore) catalogButton.focus();
  }
  catalogButton.addEventListener('click', () => setCatalog(catalogPanel.hidden));
  catalogButton.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCatalog(true);
      catalogPanel.querySelector('a').focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.catalog-item')) {
      setCatalog(false);
      closeOtherPanels();
    }
  });
  document.addEventListener('focusin', event => {
    const item = event.target.closest('.catalog-item');
    if (!item || !item.contains(catalogPanel)) {
      catalogButton.setAttribute('aria-expanded', 'false');
      catalogPanel.hidden = true;
    }
    closeOtherPanels(item?.querySelector('.nav-dropdown-button'));
    if (mobileMenu.hidden) backdrop.hidden = catalogPanel.hidden && otherButtons.every(button => button.getAttribute('aria-expanded') !== 'true');
  });
  function setMobile(open) {
    if (open) {
      setCatalog(false);
      closeOtherPanels();
      mobileReturnFocus = document.activeElement;
    }
    mobileMenu.hidden = !open;
    backdrop.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    main.inert = open;
    header.inert = open;
    if (open) mobileMenu.querySelector('button').focus();
    else if (mobileReturnFocus) mobileReturnFocus.focus();
  }
  menuButton.addEventListener('click', () => setMobile(true));
  document.querySelector('[data-mobile-close]').addEventListener('click', () => setMobile(false));
  backdrop.addEventListener('click', () => {
    setCatalog(false);
    closeOtherPanels();
    if (!mobileMenu.hidden) setMobile(false);
  });
  mobileMenu.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const nodes = [...mobileMenu.querySelectorAll('a,button,summary')].filter(el => el.getClientRects().length);
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!catalogPanel.hidden) { event.preventDefault(); setCatalog(false, true); }
    const opened = otherButtons.find(button => button.getAttribute('aria-expanded') === 'true');
    if (opened) { event.preventDefault(); closeOtherPanels(); backdrop.hidden = true; opened.focus(); }
    if (!mobileMenu.hidden) { event.preventDefault(); setMobile(false); }
  });
  matchMedia('(min-width: 960px)').addEventListener('change', event => {
    if (event.matches && !mobileMenu.hidden) setMobile(false);
    if (!event.matches && !catalogPanel.hidden) setCatalog(false);
    if (!event.matches) { closeOtherPanels(); backdrop.hidden = true; }
  });

  const searchDialog = document.querySelector('.search-dialog');
  const searchField = document.getElementById('catalog-search');
  const searchStatus = document.querySelector('.search-status');
  const resultList = document.querySelector('.search-results');
  let searchIndex = null;
  let indexRequest = null;
  let indexFailed = false;
  let searchSequence = 0;
  const normalize = value => value.toLocaleLowerCase('ru').replaceAll('ё', 'е').trim();
  function loadSearchIndex(retry) {
    if (searchIndex) return Promise.resolve(searchIndex);
    if (indexRequest) return indexRequest;
    if (indexFailed && !retry) return Promise.resolve(null);
    indexFailed = false;
    indexRequest = fetch(document.documentElement.dataset.searchIndex || '/search-index.json').then(response => {
      if (!response.ok) throw new Error('Search index unavailable');
      return response.json();
    }).then(records => {
      if (!Array.isArray(records)) throw new Error('Search index unavailable');
      searchIndex = records;
      return records;
    }).catch(() => {
      indexFailed = true;
      return null;
    }).finally(() => { indexRequest = null; });
    return indexRequest;
  }
  document.querySelector('[data-search-open]').addEventListener('click', () => {
    setCatalog(false);
    closeOtherPanels();
    searchDialog.showModal();
    searchField.focus();
    if (searchField.value.trim().length >= 2) search(true);
  });
  document.querySelector('[data-search-close]').addEventListener('click', () => searchDialog.close());
  searchDialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      searchDialog.close();
    }
  });
  searchDialog.addEventListener('click', event => {
    if (event.target === searchDialog) {
      const box = searchDialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) searchDialog.close();
    }
  });
  async function search(retry = false) {
    const sequence = ++searchSequence;
    const query = normalize(searchField.value);
    resultList.replaceChildren();
    if (query.length < 2) { searchStatus.textContent = 'Введите минимум два символа названия или артикула.'; return; }
    searchStatus.textContent = 'Ищем оборудование…';
    try {
      const records = await loadSearchIndex(retry);
      if (sequence !== searchSequence) return;
      if (!records) {
        searchStatus.textContent = 'Поиск временно недоступен. Нажмите «Найти», чтобы повторить, или откройте каталог по ссылке ниже.';
        return;
      }
      const words = query.split(/\s+/);
      const matches = records.filter(record => words.every(word => normalize(record.name + ' ' + record.sku).includes(word)));
      const shown = matches.slice(0, 8);
      searchStatus.textContent = matches.length ? `Найдено: ${matches.length}. Показаны первые ${shown.length}.` : 'Ничего не найдено. Попробуйте другое название или артикул.';
      for (const record of shown) {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = record.route ? new URL(record.route, new URL(document.documentElement.dataset.siteRoot || './', location.href)).href : record.url;
        link.textContent = record.name;
        const sku = document.createElement('small');
        sku.textContent = record.sku;
        link.append(sku);
        li.append(link);
        resultList.append(li);
      }
    } catch (error) {
      searchStatus.textContent = 'Поиск временно недоступен. Откройте каталог по ссылке ниже.';
    }
  }
  searchField.addEventListener('input', () => search());
  document.querySelector('.search-form').addEventListener('submit', event => { event.preventDefault(); search(true); });

  // Keep the original request.js cart and add background inertness to its existing focus trap.
  const cart = document.getElementById('rq');
  new MutationObserver(() => {
    const open = cart.classList.contains('is-open');
    main.inert = open;
    header.inert = open;
    if (!open) document.querySelector('[data-rq-toggle]').focus();
  }).observe(cart, { attributes: true, attributeFilter: ['class'] });
})();
