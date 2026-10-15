/* Главная: слайдер (10 слайдов, кроссфейд), вкладки, калькулятор, счётчики. Без библиотек. */
(function () {
  'use strict';

  var doc = document;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  /* ---------- слайдер ---------- */
  var hero = doc.querySelector('.hero');
  if (hero && hero.querySelector('.slide') && hero.querySelector('.js-prev')) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.js-dot'));
    var counter = hero.querySelector('.js-count');
    var live = hero.querySelector('.hero__live');
    var playBtn = hero.querySelector('.js-play');
    var interval = parseInt(hero.getAttribute('data-interval'), 10) || 7000;
    var autoplay = hero.getAttribute('data-autoplay') === '1' && !reduce && slides.length > 1;
    var current = 0, timer = 0, userStopped = false, hovering = false, focused = false;

    hero.classList.add('hero--js');
    hero.style.setProperty('--interval', interval + 'ms');
    // кроссфейд: все слайды лежат друг на друге, скрытые прячутся через visibility и inert
    slides.forEach(function (sl, k) {
      // грузим только первый слайд, остальные открываются перед показом (экономия трафика)
      sl.hidden = k !== 0;
      sl.setAttribute('aria-hidden', k === 0 ? 'false' : 'true');
      if (k !== 0) sl.setAttribute('inert', '');
    });

    // заранее открываем второй слайд, когда страница уже загружена
    window.addEventListener('load', function () { setTimeout(function () { if (slides[1]) slides[1].hidden = false; }, 1500); });

    var show = function (i, announce) {
      i = (i + slides.length) % slides.length;
      if (i === current) return;
      slides[current].classList.remove('is-active');
      slides[current].setAttribute('aria-hidden', 'true');
      slides[current].setAttribute('inert', '');
      slides[i].hidden = false;
      void slides[i].offsetWidth;
      slides[(i + 1) % slides.length].hidden = false;
      slides[i].removeAttribute('inert');
      slides[i].setAttribute('aria-hidden', 'false');
      slides[i].classList.add('is-active');
      dots.forEach(function (d, k) {
        if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
      current = i;
      if (counter) counter.textContent = pad(i + 1);
      if (announce && live) live.textContent = slides[i].getAttribute('aria-label');
      restartBar();
    };
    var restartBar = function () {
      hero.classList.remove('hero--playing');
      if (isPlaying()) { void hero.offsetWidth; hero.classList.add('hero--playing'); }
    };
    var isPlaying = function () { return autoplay && !userStopped; };
    var schedule = function () {
      clearTimeout(timer);
      var paused = hovering || focused;
      hero.classList.toggle('hero--paused', paused);
      if (!isPlaying() || paused) return;
      timer = setTimeout(function () { show(current + 1, false); schedule(); }, interval);
    };
    var stop = function () {
      userStopped = true;
      clearTimeout(timer);
      hero.classList.remove('hero--playing');
      if (playBtn) { playBtn.classList.add('is-paused'); playBtn.setAttribute('aria-label', 'Запустить автопрокрутку'); }
    };
    var go = function (i) { show(i, true); stop(); };

    hero.querySelector('.js-prev').addEventListener('click', function () { go(current - 1); });
    hero.querySelector('.js-next').addEventListener('click', function () { go(current + 1); });
    dots.forEach(function (d) {
      d.addEventListener('click', function () { go(parseInt(d.getAttribute('data-index'), 10)); });
    });
    hero.addEventListener('keydown', function (e) {
      if (e.target.closest('a')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); }
    });

    if (autoplay && playBtn) {
      playBtn.hidden = false;
      playBtn.addEventListener('click', function () {
        if (userStopped) {
          userStopped = false;
          playBtn.classList.remove('is-paused');
          playBtn.setAttribute('aria-label', 'Остановить автопрокрутку');
          restartBar();
          schedule();
        } else {
          stop();
        }
      });
      hero.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hovering = true; schedule(); } });
      hero.addEventListener('pointerleave', function () { hovering = false; restartBar(); schedule(); });
      hero.addEventListener('focusin', function () { focused = true; schedule(); });
      hero.addEventListener('focusout', function (e) { if (!hero.contains(e.relatedTarget)) { focused = false; restartBar(); schedule(); } });
      doc.addEventListener('visibilitychange', function () { if (doc.hidden) clearTimeout(timer); else schedule(); });
      restartBar();
      schedule();
    }

    // свайп
    var sx = null, sy = null;
    var stage = hero.querySelector('.hero__stage');
    stage.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { sx = e.clientX; sy = e.clientY; } });
    stage.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      sx = sy = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(current + (dx < 0 ? 1 : -1));
    });
  }

  /* ---------- вкладки (ARIA tabs) ---------- */
  Array.prototype.forEach.call(doc.querySelectorAll('[data-tabs]'), function (box) {
    var tabs = Array.prototype.slice.call(box.querySelectorAll('[role="tab"]'));
    box.classList.add('tabs--js');
    var select = function (i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var p = doc.getElementById(t.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
      if (focus) tabs[i].focus();
      tabs[i].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, false); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, to = null;
        if (e.key === 'ArrowRight') to = (i + 1) % n;
        else if (e.key === 'ArrowLeft') to = (i - 1 + n) % n;
        else if (e.key === 'Home') to = 0;
        else if (e.key === 'End') to = n - 1;
        if (to !== null) { e.preventDefault(); select(to, true); }
      });
    });
  });

  /* ---------- калькулятор тягового усилия (оценка) ---------- */
  Array.prototype.forEach.call(doc.querySelectorAll('[data-calc]'), function (box) {
    var get = function (k) { return box.querySelector('[data-k="' + k + '"]'); };
    var out = box.querySelector('.js-calc-out');
    var hint = box.querySelector('.js-calc-hint');
    var num = function (el) {
      var v = (el.value || '').replace(/\s/g, '').replace(',', '.');
      return v === '' ? NaN : Number(v);
    };
    var calc = function () {
      var w = num(get('w')), L = num(get('l')), mu = num(get('mu'));
      var raw = (get('a').value || '').trim();
      var angles = raw ? raw.split(/[;\s]+|,\s+/).map(function (x) { return Number(x.replace(',', '.')); }) : [];
      var bad = [], empty = [];
      if (isNaN(w)) empty.push('массу 1 м'); else if (!(w > 0 && w < 200)) bad.push('массу 1 м');
      if (isNaN(L)) empty.push('длину'); else if (!(L > 0 && L <= 20000)) bad.push('длину');
      if (isNaN(mu)) empty.push('коэффициент трения'); else if (!(mu > 0 && mu <= 1.5)) bad.push('коэффициент трения (0–1,5)');
      if (angles.some(function (a) { return !(a >= 0 && a <= 360); })) bad.push('углы (0–360°)');
      if (bad.length || empty.length) {
        out.textContent = '0,00';
        out.classList.add('is-empty');
        hint.textContent = bad.length ? 'Проверьте: ' + bad.join(', ') + '.' : 'Заполните: ' + empty.join(', ') + '.';
        return;
      }
      out.classList.remove('is-empty');
      var T = mu * w * 9.81 * L;
      var total = 0;
      angles.forEach(function (a) { total += a; T = T * Math.exp(mu * a * Math.PI / 180); });
      out.textContent = (T / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
      if (!reduce) { out.classList.remove('is-pulse'); void out.offsetWidth; out.classList.add('is-pulse'); }
      hint.textContent = angles.length
        ? 'Прямой участок ' + L + ' м и ' + angles.length + ' пов. на ' + total + '°.'
        : 'Прямой участок ' + L + ' м без поворотов.';
    };
    box.addEventListener('input', calc);
  });

  /* ---------- счётчики ---------- */
  var nums = doc.querySelectorAll('.js-counter');
  if (nums.length && !reduce && 'IntersectionObserver' in window) {
    var fmt = function (v) { return Math.round(v).toLocaleString('ru-RU'); };
    var run = function (el) {
      var to = parseFloat(el.getAttribute('data-to')) || 0;
      var t0 = null, dur = 1400;
      var step = function (t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / dur);
        var eased = 1 - Math.pow(1 - k, 3);
        el.textContent = k < 1 ? fmt(to * eased) : el.getAttribute('data-final');
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(nums, function (el) {
      el.setAttribute('data-final', el.textContent);
      // до появления в кадре показываем 0, чтобы не было скачка с итога на ноль
      el.textContent = '0';
      io.observe(el);
    });
  }
})();
