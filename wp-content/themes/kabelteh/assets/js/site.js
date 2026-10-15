/* Общий скрипт: мега-меню, ящик меню, прогресс чтения, оглавление, копирование почты, motion (появление, параллакс, подсветка карточек). Без библиотек. */
(function () {
  'use strict';

  var doc = document;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mq = window.matchMedia('(max-width: 1099px)');
  var head = doc.querySelector('.masthead');
  var isDrawer = function () { return !!head && head.classList.contains('is-drawer'); };

  /* ---------- мега-меню ---------- */
  var nav = doc.getElementById('mega');
  var burger = doc.querySelector('.burger');
  if (nav && head) {
    nav.classList.add('mega--js');
    var bar = nav.querySelector('.mega__bar');
    var tops = Array.prototype.slice.call(nav.querySelectorAll('.mega__item > .mega__top'));
    var buttons = tops.filter(function (b) { return b.tagName === 'BUTTON'; });
    var openBtn = null;
    var hoverTimer = 0;

    var panelOf = function (btn) { return doc.getElementById(btn.getAttribute('aria-controls')); };
    var close = function (btn, focus) {
      if (!btn) return;
      btn.setAttribute('aria-expanded', 'false');
      var p = panelOf(btn);
      if (p) p.classList.remove('is-open');
      if (openBtn === btn) openBtn = null;
      if (focus) btn.focus();
    };
    var open = function (btn) {
      if (openBtn && openBtn !== btn) close(openBtn);
      btn.setAttribute('aria-expanded', 'true');
      var p = panelOf(btn);
      if (p) p.classList.add('is-open');
      openBtn = btn;
    };

    /* ящик: на узком экране или если пункты не влезают в одну строку шапки */
    var toggleDrawer = function (state) {
      if (!burger) return;
      burger.setAttribute('aria-expanded', state ? 'true' : 'false');
      nav.classList.toggle('is-open', state);
      doc.body.classList.toggle('menu-open', state);
      if (state) nav.style.setProperty('--drawer-top', head.getBoundingClientRect().bottom + 'px');
    };
    var setMode = function () {
      var was = isDrawer();
      head.classList.add('is-measuring');
      head.classList.remove('is-drawer');
      var over = false;
      if (!mq.matches && bar && bar.children.length) {
        var first = bar.firstElementChild, last = bar.lastElementChild;
        var inner = head.querySelector('.masthead__in');
        over = last.offsetTop > first.offsetTop + 4 || (inner && inner.scrollWidth > inner.clientWidth + 2);
      }
      var on = mq.matches || over;
      head.classList.toggle('is-drawer', on);
      if (was !== on) {
        toggleDrawer(false);
        if (openBtn) close(openBtn);
      }
      doc.documentElement.style.setProperty('--stick', Math.round(head.getBoundingClientRect().height) + 'px');
      requestAnimationFrame(function () { requestAnimationFrame(function () { head.classList.remove('is-measuring'); }); });
    };
    if (burger) {
      burger.hidden = false;
      burger.addEventListener('click', function () {
        toggleDrawer(burger.getAttribute('aria-expanded') !== 'true');
      });
    }
    setMode();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(setMode);
    var rt = 0;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(setMode, 150); });
    mq.addEventListener('change', setMode);

    buttons.forEach(function (btn) {
      var item = btn.parentNode;
      btn.addEventListener('click', function () {
        if (btn.getAttribute('aria-expanded') === 'true') close(btn); else open(btn);
      });
      item.addEventListener('pointerenter', function (e) {
        if (isDrawer() || e.pointerType !== 'mouse') return;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () { open(btn); }, openBtn ? 0 : 90);
      });
      item.addEventListener('pointerleave', function (e) {
        if (isDrawer() || e.pointerType !== 'mouse') return;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () { close(btn); }, 220);
      });
      item.addEventListener('focusout', function (e) {
        if (isDrawer()) return;
        if (!item.contains(e.relatedTarget)) close(btn);
      });
    });

    // Стрелки влево/вправо по пунктам верхнего уровня, вниз в панель, Esc закрывает.
    nav.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (openBtn) { e.preventDefault(); close(openBtn, true); }
        else if (isDrawer() && nav.classList.contains('is-open')) { toggleDrawer(false); burger.focus(); }
        return;
      }
      var i = tops.indexOf(doc.activeElement);
      if (i < 0 || isDrawer()) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        tops[(i + (e.key === 'ArrowRight' ? 1 : -1) + tops.length) % tops.length].focus();
      } else if (e.key === 'ArrowDown' && doc.activeElement.tagName === 'BUTTON') {
        e.preventDefault();
        open(doc.activeElement);
        var first = panelOf(doc.activeElement).querySelector('a');
        if (first) first.focus();
      }
    });
    doc.addEventListener('click', function (e) {
      if (openBtn && !isDrawer() && !nav.contains(e.target)) close(openBtn);
    });
  }

  /* ---------- прогресс чтения и активная глава ---------- */
  var barP = doc.querySelector('.progress__bar');
  var tocLinks = Array.prototype.slice.call(doc.querySelectorAll('.toc__list a'));
  var heads = tocLinks.map(function (a) { return doc.getElementById(decodeURIComponent(a.hash.slice(1))); });
  var mbar = doc.querySelector('.mbar');
  var par = Array.prototype.map.call(doc.querySelectorAll('[data-parallax]'), function (el) {
    return { el: el, speed: parseFloat(el.getAttribute('data-parallax')) || 0 };
  });
  var heroStage = doc.querySelector('.hero__stage');
  if (heroStage) par.push({ el: heroStage, speed: -0.07 });
  var ticking = false;
  var onScroll = function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var h = doc.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      if (barP) barP.style.setProperty('--p', max > 0 ? Math.min(1, h.scrollTop / max).toFixed(4) : 0);
      if (head) head.classList.toggle('is-stuck', h.scrollTop > 8);
      if (mbar) mbar.classList.toggle('is-on', h.scrollTop > 360);
      if (!reduce) {
        for (var k = 0; k < par.length; k++) {
          var r = par[k].el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > window.innerHeight + 200) continue;
          var off = (r.top + r.height / 2 - window.innerHeight / 2) * par[k].speed;
          var lim = par[k].el === heroStage ? 16 : 60;
          off = Math.max(-lim, Math.min(lim, off));
          par[k].el.style.setProperty('--py', off.toFixed(1) + 'px');
        }
      }
      if (heads.length) {
        var line = Math.max(140, window.innerHeight * 0.3), active = -1;
        for (var i = 0; i < heads.length; i++) {
          if (heads[i] && heads[i].getBoundingClientRect().top <= line) active = i;
        }
        tocLinks.forEach(function (a, k) {
          var on = k === active;
          a.classList.toggle('is-active', on);
          if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        });
      }
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('load', onScroll);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(onScroll);
  onScroll();

  // На узком экране оглавление свёрнуто по умолчанию.
  var tocBox = doc.querySelector('.toc__box');
  if (tocBox && mq.matches) tocBox.open = false;

  /* ---------- копирование почты ---------- */
  doc.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.js-copy');
    if (!btn) return;
    var text = btn.getAttribute('data-copy') || '';
    var status = btn.parentNode.querySelector('.copy-status');
    var done = function (ok) {
      if (status) status.textContent = ok ? 'Адрес скопирован' : 'Не удалось скопировать, выделите адрес вручную';
      setTimeout(function () { if (status) status.textContent = ''; }, 3000);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } else {
      done(false);
    }
  });

  /* ---------- подсветка карточек под курсором ---------- */
  if (window.matchMedia('(hover: hover)').matches && !reduce) {
    var lastCard = null;
    doc.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var c = e.target.closest ? e.target.closest('.card') : null;
      if (lastCard && lastCard !== c) { lastCard.style.removeProperty('--mx'); lastCard.style.removeProperty('--my'); }
      lastCard = c;
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
    }, { passive: true });
  }

  /* ---------- появление при прокрутке (IntersectionObserver) ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    var sel = '.sec__head, .intro, .points__item, .stats__item, .card, .tabs, .steps__item, .acc__item, .statement, .statement__text, .board__row, .sitemap__col, .calc__fields, .calc__out, .contact > *, .mailband__grid > *, .prose > h2, .prose > .table-wrap, .doc__cover, .rail__in > *, .pcard, .pdp__fig, .pdp__info, .spec-wrap, .pdesc';
    var items = Array.prototype.slice.call(doc.querySelectorAll(sel));
    var vh = window.innerHeight;
    var pending = items.filter(function (el) { return el.getBoundingClientRect().top > vh * 0.92; });
    if (pending.length) {
      doc.documentElement.classList.add('js-reveal');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          io.unobserve(el);
          el.classList.add('is-in');
          // после показа снимаем служебные классы, чтобы hover работал со своими переходами
          setTimeout(function () { el.classList.remove('rv', 'rv--l', 'is-in'); }, 1300);
        });
      }, { rootMargin: '0px 0px -8% 0px' });
      pending.forEach(function (el) {
        var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
        el.style.setProperty('--i', String(idx % 4));
        el.classList.add('rv');
        if (el.matches('.rail__in > *, .acc__item, .board__row')) el.classList.add('rv--l');
        io.observe(el);
      });
      // страховка: если наблюдатель не сработал, всё показываем
      setTimeout(function () {
        pending.forEach(function (el) { if (el.classList.contains('rv') && !el.classList.contains('is-in')) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight) el.classList.add('is-in'); } });
      }, 2500);
    }
  }
})();
