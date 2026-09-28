/* =========================================================
   TAXI GUSINJE – site logic (no dependencies)
   - language switch (SQ / MNE / EN)
   - phone / WhatsApp / Viber links from config.js
   - vehicle tiles, photo hotspots and plan buttons -> preselect the vehicle
   - booking request form -> WhatsApp message (or e-mail endpoint)
   ========================================================= */
(function () {
  'use strict';

  var CONFIG = window.TG_CONFIG || {};
  var I18N = window.TG_I18N || {};
  /* only an explicit choice (a click on a language button) is remembered */
  var STORAGE_KEY = 'tg_lang_choice';
  /* dictionary key -> value for <html lang> ("cnr" = Montenegrin) */
  var LANG_TAGS = { sq: 'sq', me: 'cnr', en: 'en' };
  /* browser language -> dictionary key */
  var BROWSER_LANGS = { sq: 'sq', en: 'en', sr: 'me', bs: 'me', hr: 'me', cnr: 'me', me: 'me' };
  var currentLang = 'me';
  var lastSuccess = null;
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function $(selector, root) { return (root || document).querySelector(selector); }
  function $all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function scrollToEl(el, block) { if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: block || 'start' }); }

  /* ---------- translations ---------- */
  function t(key, vars) {
    var dict = I18N[currentLang] || {};
    var str = dict[key];
    if (str == null) str = (I18N.me && I18N.me[key] != null) ? I18N.me[key] : key;
    if (vars) {
      Object.keys(vars).forEach(function (name) {
        str = str.split('{' + name + '}').join(vars[name]);
      });
    }
    return str;
  }

  function detectLang() {
    /* a shared link can force the language: ?lang=sq | ?lang=me (or mne) | ?lang=en */
    var param = null;
    try { param = new URLSearchParams(window.location.search).get('lang'); } catch (e) { /* old browser */ }
    if (param) {
      param = String(param).toLowerCase();
      if (param === 'mne' || param === 'cnr') param = 'me';
      if (I18N[param]) return param;
    }

    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { /* storage blocked */ }
    if (stored && I18N[stored]) return stored;

    var preferred = CONFIG.defaultLang || 'me';
    if (preferred !== 'auto' && I18N[preferred]) return preferred;

    var languages = navigator.languages || [navigator.language || 'en'];
    for (var i = 0; i < languages.length; i++) {
      var primary = String(languages[i]).toLowerCase().split('-')[0];
      var mapped = BROWSER_LANGS[primary];
      if (mapped && I18N[mapped]) return mapped;
    }
    return 'me';
  }

  function applyLang(lang, remember) {
    currentLang = I18N[lang] ? lang : 'me';
    document.documentElement.lang = LANG_TAGS[currentLang] || currentLang;
    if (remember) {
      try { localStorage.setItem(STORAGE_KEY, currentLang); } catch (e) { /* storage blocked */ }
    }

    $all('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    $all('[data-i18n-html]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    $all('[data-i18n-placeholder]').forEach(function (el) { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder'))); });
    $all('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
    $all('[data-i18n-alt]').forEach(function (el) { el.setAttribute('alt', t(el.getAttribute('data-i18n-alt'))); });
    $all('[data-i18n-value]').forEach(function (el) { el.setAttribute('value', t(el.getAttribute('data-i18n-value'))); });

    document.title = t('meta.title');
    var metaDescription = $('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute('content', t('meta.description'));

    $all('[data-lang]').forEach(function (btn) {
      var active = btn.getAttribute('data-lang') === currentLang;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    renderPrices();
    renderSubmitHint();
    renderSuccessText();
    renderWeather();
  }

  /* ---------- contact links and photos from config ---------- */
  function applyContact() {
    var tel = 'tel:' + (CONFIG.phone || '');
    var wa = 'https://wa.me/' + (CONFIG.whatsapp || '');
    var viber = 'viber://chat?number=' + encodeURIComponent(CONFIG.viber || CONFIG.phone || '');
    $all('[data-link="tel"]').forEach(function (a) { a.setAttribute('href', tel); });
    $all('[data-link="wa"]').forEach(function (a) { a.setAttribute('href', wa); });
    $all('[data-link="viber"]').forEach(function (a) { a.setAttribute('href', viber); });
    $all('[data-phone-text]').forEach(function (el) { el.textContent = CONFIG.phoneDisplay || CONFIG.phone || ''; });
  }

  function renderPrices() {
    $all('[data-price]').forEach(function (el) {
      var key = el.getAttribute('data-price');
      var price = CONFIG.prices ? CONFIG.prices[key] : null;
      el.textContent = (typeof price === 'number' && price > 0)
        ? t('plans.price.from', { price: price })
        : t('plans.price.request');
    });
  }

  function renderSubmitHint() {
    var hint = $('#submit-hint');
    if (hint) hint.textContent = t(CONFIG.formEndpoint ? 'form.submit.hint.endpoint' : 'form.submit.hint');
  }

  /* ---------- header / navigation ---------- */
  var header = $('.site-header');
  var navToggle = $('.nav-toggle');

  function closeNav() {
    header.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  navToggle.addEventListener('click', function () {
    var open = header.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  $all('.nav-links a').forEach(function (a) { a.addEventListener('click', closeNav); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });

  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  $all('[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () { applyLang(btn.getAttribute('data-lang'), true); });
  });

  /* ---------- reveal on scroll ---------- */
  var revealElements = $all('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealElements.forEach(function (el) { observer.observe(el); });
  } else {
    revealElements.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---------- booking form ---------- */
  var form = $('#booking-form');
  var successBox = $('#booking-success');
  var dateInput = $('#f-date');
  var PHONE_RE = /^\+?[0-9][0-9\s().-]{6,}$/;

  function field(name) { return form.elements.namedItem(name); }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  if (dateInput) dateInput.min = todayISO();

  function setError(el, key) {
    var wrap = el.closest('.field');
    if (!wrap) return;
    wrap.classList.add('is-invalid');
    var error = wrap.querySelector('[data-error]');
    if (error) error.textContent = t(key);
  }

  function clearErrors() {
    $all('.field.is-invalid', form).forEach(function (wrap) { wrap.classList.remove('is-invalid'); });
    $('#form-error-summary').hidden = true;
  }

  $all('input, textarea', form).forEach(function (el) {
    function clear() {
      var wrap = el.closest('.field');
      if (wrap) wrap.classList.remove('is-invalid');
    }
    el.addEventListener('input', clear);
    el.addEventListener('change', clear);
  });

  function validate() {
    clearErrors();
    var firstBad = null;
    function bad(el, key) { setError(el, key); if (!firstBad) firstBad = el; }

    var name = field('name'), phone = field('phone'), from = field('from'), to = field('to');
    var date = field('date'), time = field('time'), passengers = field('passengers');

    if (!name.value.trim()) bad(name, 'form.error.required');
    if (!phone.value.trim()) bad(phone, 'form.error.required');
    else if (!PHONE_RE.test(phone.value.trim())) bad(phone, 'form.error.phone');
    if (!from.value.trim()) bad(from, 'form.error.required');
    if (!to.value.trim()) bad(to, 'form.error.required');
    if (!date.value) bad(date, 'form.error.required');
    else if (date.value < todayISO()) bad(date, 'form.error.date');
    if (!time.value) bad(time, 'form.error.required');
    var count = parseInt(passengers.value, 10);
    if (!passengers.value || isNaN(count) || count < 1 || count > 60) bad(passengers, 'form.error.pax');
    if (!form.querySelector('input[name="vehicle"]:checked')) bad(form.querySelector('input[name="vehicle"]'), 'form.error.vehicle');

    if (firstBad) {
      $('#form-error-summary').hidden = false;
      scrollToEl(firstBad.closest('.field') || firstBad, 'center');
      if (firstBad.type !== 'radio') {
        try { firstBad.focus({ preventScroll: true }); } catch (e) { firstBad.focus(); }
      }
      return false;
    }
    return true;
  }

  function formatDate(iso) {
    var parts = String(iso).split('-');
    return parts.length === 3 ? parts[2] + '.' + parts[1] + '.' + parts[0] : iso;
  }

  function buildMessage() {
    var vehicle = form.querySelector('input[name="vehicle"]:checked');
    var trip = form.querySelector('input[name="trip"]:checked');
    var lines = [
      '🚖 ' + t('msg.title'),
      '',
      '👤 ' + t('msg.name') + ': ' + field('name').value.trim(),
      '📞 ' + t('msg.phone') + ': ' + field('phone').value.trim(),
      '📍 ' + t('msg.from') + ': ' + field('from').value.trim(),
      '🏁 ' + t('msg.to') + ': ' + field('to').value.trim(),
      '📅 ' + t('msg.date') + ': ' + formatDate(field('date').value) + '   🕒 ' + t('msg.time') + ': ' + field('time').value,
      '👥 ' + t('msg.pax') + ': ' + field('passengers').value,
      '🚗 ' + t('msg.vehicle') + ': ' + (vehicle ? t('form.vehicle.' + vehicle.value) : '-'),
      '🔁 ' + t('msg.trip') + ': ' + (trip ? t('form.trip.' + trip.value) : '-')
    ];
    var notes = field('notes').value.trim();
    if (notes) lines.push('📝 ' + t('msg.notes') + ': ' + notes);
    lines.push('', t('msg.footer'));
    return lines.join('\n');
  }

  function renderSuccessText() {
    if (!lastSuccess) return;
    $('#success-title').textContent = t('form.success.title', { name: lastSuccess.name });
    var key = lastSuccess.mode === 'sent' ? 'form.success.sent'
      : lastSuccess.mode === 'manual' ? 'form.success.manual'
      : 'form.success.wa';
    $('#success-text').textContent = t(key, { phone: lastSuccess.phone });
  }

  function showSuccess(mode, name, phone) {
    lastSuccess = { mode: mode, name: name, phone: phone };
    renderSuccessText();
    successBox.setAttribute('data-mode', mode);
    form.hidden = true;
    successBox.hidden = false;
    scrollToEl(successBox, 'center');
  }

  function showForm() {
    successBox.hidden = true;
    form.hidden = false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var honeypot = field('_gotcha');
    if (honeypot && honeypot.value) return; /* bot: ignore silently */
    if (!validate()) return;

    var message = buildMessage();
    var name = field('name').value.trim();
    var phone = field('phone').value.trim();
    var waUrl = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(message);
    var smsUrl = 'sms:' + CONFIG.phone + '?&body=' + encodeURIComponent(message);
    $('#success-wa').setAttribute('href', waUrl);
    $('#success-sms').setAttribute('href', smsUrl);

    if (CONFIG.formEndpoint) {
      var submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.classList.add('is-loading');
      var data = new FormData(form);
      data.append('message', message);
      data.append('_subject', t('msg.title'));
      data.append('language', currentLang);
      fetch(CONFIG.formEndpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('Form endpoint returned ' + res.status);
          showSuccess('sent', name, phone);
        })
        .catch(function () { showSuccess('manual', name, phone); })
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.classList.remove('is-loading');
        });
    } else {
      window.open(waUrl, '_blank', 'noopener');
      showSuccess('wa', name, phone);
    }
  });

  $('#success-again').addEventListener('click', function () {
    form.reset();
    if (dateInput) dateInput.min = todayISO();
    clearErrors();
    lastSuccess = null;
    showForm();
    scrollToEl(form, 'start');
  });

  function focusFirstEmpty() {
    window.setTimeout(function () {
      var order = ['name', 'phone', 'from', 'to', 'date', 'time'];
      for (var i = 0; i < order.length; i++) {
        var el = field(order[i]);
        if (el && !el.value) {
          try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
          return;
        }
      }
    }, reduceMotion ? 0 : 700);
  }

  /* "Request a quote" buttons on the plan cards preselect the vehicle */
  $all('[data-choose-vehicle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var value = btn.getAttribute('data-choose-vehicle');
      var radio = form.querySelector('input[name="vehicle"][value="' + value + '"]');
      if (radio) {
        radio.checked = true;
        var wrap = radio.closest('.field');
        if (wrap) wrap.classList.remove('is-invalid');
      }
      showForm();
      scrollToEl($('#booking'), 'start');
      focusFirstEmpty();
    });
  });

  /* destination hotspots in the panorama fill in the destination */
  $all('.spot').forEach(function (spot) {
    spot.addEventListener('click', function (e) {
      e.preventDefault();
      var to = field('to');
      if (to) {
        to.value = t(spot.getAttribute('data-place'));
        var wrap = to.closest('.field');
        if (wrap) wrap.classList.remove('is-invalid');
      }
      showForm();
      scrollToEl($('#booking'), 'start');
      focusFirstEmpty();
    });
  });

  /* ---------- panorama depth: layers follow the mouse (desktop only) ---------- */
  (function () {
    var hero = $('.hero');
    var pano = $('.hero .pano');
    var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!hero || !pano || reduceMotion || !finePointer) return;
    var layers = [
      { el: pano.querySelector('.pl-clouds'), x: 10, y: 4, s: 1.02 },
      { el: pano.querySelector('.pl-far'), x: 7, y: 3, s: 1.015 },
      { el: pano.querySelector('.pl-mist'), x: 12, y: 4, s: 1.03 },
      { el: pano.querySelector('.pl-mid'), x: 14, y: 5, s: 1.02 },
      { el: pano.querySelector('.pl-near'), x: 22, y: 7, s: 1.03 }
    ].filter(function (layer) { return layer.el; });
    var target = { x: 0, y: 0 }, now = { x: 0, y: 0 }, frame = 0;

    function render() {
      now.x += (target.x - now.x) * 0.07;
      now.y += (target.y - now.y) * 0.07;
      layers.forEach(function (layer) {
        layer.el.style.transform = 'translate(' + (-now.x * layer.x).toFixed(2) + 'px,' + (-now.y * layer.y).toFixed(2) + 'px) scale(' + layer.s + ')';
      });
      frame = (Math.abs(target.x - now.x) > 0.001 || Math.abs(target.y - now.y) > 0.001) ? requestAnimationFrame(render) : 0;
    }
    function kick() { if (!frame) frame = requestAnimationFrame(render); }

    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width - 0.5;
      target.y = (e.clientY - r.top) / r.height - 0.5;
      kick();
    });
    hero.addEventListener('pointerleave', function () { target.x = 0; target.y = 0; kick(); });
  })();

  /* ---------- live clock + weather in Gusinje (Open-Meteo, free, no key) ---------- */
  var SVGNS = 'http://www.w3.org/2000/svg';
  var WX = { kind: null, temp: null, isDay: true };
  var WX_KINDS = {
    clear: [0, 1], partly: [2], cloudy: [3], fog: [45, 48],
    drizzle: [51, 53, 55, 56, 57], rain: [61, 63, 65, 66, 67, 80, 81, 82],
    snow: [71, 73, 75, 77, 85, 86], storm: [95, 96, 99]
  };
  var WX_ICONS = { clear: 'sun', partly: 'cloud', cloudy: 'cloud', fog: 'fog', drizzle: 'rain', rain: 'rain', snow: 'snow', storm: 'storm' };

  function wxKind(code) {
    for (var kind in WX_KINDS) {
      if (WX_KINDS.hasOwnProperty(kind) && WX_KINDS[kind].indexOf(code) !== -1) return kind;
    }
    return 'cloudy';
  }

  function gusinjeTime(options) {
    try {
      var opts = { timeZone: 'Europe/Podgorica' };
      Object.keys(options).forEach(function (k) { opts[k] = options[k]; });
      return new Intl.DateTimeFormat('en-GB', opts).format(new Date());
    } catch (e) { return null; }
  }

  function renderClock() {
    var el = $('#live-time');
    if (!el) return;
    var text = gusinjeTime({ hour: '2-digit', minute: '2-digit', hour12: false });
    if (!text) {
      var d = new Date();
      text = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    }
    el.textContent = text;
  }

  function renderWeather() {
    var box = $('#live-wx');
    if (!box || !WX.kind) return;
    $('#live-temp').textContent = Math.round(WX.temp) + '°C';
    $('#live-desc').textContent = t('wx.' + WX.kind);
    var icon = (WX.kind === 'clear' && !WX.isDay) ? 'moon' : WX_ICONS[WX.kind];
    var use = box.querySelector('use');
    if (use) use.setAttribute('href', '#i-wx-' + icon);
    box.hidden = false;
  }

  /* dress the panorama for the weather: veil, snow on the peaks, falling snow/rain, fog, lightning */
  function setScene(kind, isDay) {
    var pano = $('.hero .pano');
    if (!pano) return;
    ['clear', 'partly', 'cloudy', 'fog', 'drizzle', 'rain', 'snow', 'storm', 'night'].forEach(function (k) {
      pano.classList.remove('wx-' + k);
    });
    if (kind) pano.classList.add('wx-' + kind);
    if (isDay === false) pano.classList.add('wx-night');

    var layer = pano.querySelector('.wx-layer');
    if (!layer) return;
    while (layer.firstChild) layer.removeChild(layer.firstChild);
    if (reduceMotion) return;

    var rnd = Math.random, i, el, x;
    if (kind === 'snow') {
      for (i = 0; i < 90; i++) {
        el = document.createElementNS(SVGNS, 'circle');
        el.setAttribute('class', 'flake');
        el.setAttribute('cx', (rnd() * 1600).toFixed(0));
        el.setAttribute('cy', '0');
        el.setAttribute('r', (0.9 + rnd() * 1.8).toFixed(1));
        el.style.setProperty('--d', (7 + rnd() * 8).toFixed(1) + 's');
        el.style.setProperty('--delay', (-rnd() * 14).toFixed(1) + 's');
        el.style.setProperty('--x', ((rnd() * 2 - 1) * 40).toFixed(0) + 'px');
        layer.appendChild(el);
      }
    } else if (kind === 'rain' || kind === 'drizzle' || kind === 'storm') {
      var count = kind === 'drizzle' ? 70 : 140;
      for (i = 0; i < count; i++) {
        el = document.createElementNS(SVGNS, 'line');
        el.setAttribute('class', 'drop');
        x = rnd() * 1700;
        el.setAttribute('x1', x.toFixed(0));
        el.setAttribute('y1', '0');
        el.setAttribute('x2', (x - 3).toFixed(0));
        el.setAttribute('y2', kind === 'drizzle' ? '8' : '14');
        el.style.setProperty('--d', (kind === 'drizzle' ? 1.1 + rnd() * 0.6 : 0.55 + rnd() * 0.4).toFixed(2) + 's');
        el.style.setProperty('--delay', (-rnd() * 2).toFixed(2) + 's');
        layer.appendChild(el);
      }
    } else if (kind === 'fog') {
      el = document.createElementNS(SVGNS, 'rect');
      el.setAttribute('class', 'fog-bank');
      el.setAttribute('x', '-100');
      el.setAttribute('y', '220');
      el.setAttribute('width', '1800');
      el.setAttribute('height', '260');
      el.setAttribute('fill', 'url(#fog-grad)');
      layer.appendChild(el);
    }
  }

  (function () {
    renderClock();
    window.setInterval(renderClock, 20000);

    /* the Prokletije peaks carry snow from November to April */
    var pano = $('.hero .pano');
    var month = Number(gusinjeTime({ month: 'numeric' })) || (new Date().getMonth() + 1);
    if (pano && (month >= 11 || month <= 4)) pano.classList.add('season-winter');

    /* ?wx=snow|rain|drizzle|storm|fog|cloudy|partly|clear|night previews a weather scene */
    var forced = null;
    try { forced = new URLSearchParams(window.location.search).get('wx'); } catch (e) { /* old browser */ }
    if (forced === 'night') setScene(null, false);
    else if (forced && WX_KINDS[forced]) setScene(forced, true);

    if (!window.fetch) return;
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=42.5622&longitude=19.8342' +
      '&current=temperature_2m,weather_code,is_day&timezone=Europe%2FPodgorica';
    fetch(url)
      .then(function (res) { if (!res.ok) throw new Error('weather ' + res.status); return res.json(); })
      .then(function (data) {
        var now = data && data.current;
        if (!now || typeof now.temperature_2m !== 'number') return;
        WX.temp = now.temperature_2m;
        WX.kind = wxKind(now.weather_code);
        WX.isDay = now.is_day === 1;
        renderWeather();
        if (!forced) setScene(WX.kind, WX.isDay);
      })
      .catch(function () { /* offline or blocked: keep the default scene */ });
  })();

  /* ---------- "how it works": the taxi drives while the steps are on screen ---------- */
  (function () {
    var wrap = $('.steps-wrap');
    if (!wrap || !('IntersectionObserver' in window) || reduceMotion) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { wrap.classList.toggle('play', entry.isIntersecting); });
    }, { threshold: 0.35 }).observe(wrap);
  })();

  /* ---------- floating WhatsApp button after the hero (desktop) ---------- */
  (function () {
    var btn = $('.float-wa');
    var heroEl = $('.hero');
    if (!btn || !heroEl) return;
    function toggle() { btn.classList.toggle('show', window.scrollY > heroEl.offsetHeight * 0.7); }
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
  })();

  /* ---------- misc ---------- */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- init ---------- */
  applyContact();
  applyLang(detectLang(), false);
})();
