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

  /* ---------- phones: the panorama is wider than the screen and scrolls sideways ----------
     it starts on Gusinje, nudges once so visitors see it moves, and the hint fades after a swipe */
  (function () {
    var scroller = $('.pano-scroll');
    var hint = $('.pano-hint');
    if (!scroller) return;
    var touched = false;
    function scrollable() { return scroller.scrollWidth > scroller.clientWidth + 1; }
    function centre() {
      if (touched || !scrollable()) return;
      var svg = scroller.querySelector('svg');
      scroller.scrollLeft = svg.getBoundingClientRect().width * (820 / 1600) - scroller.clientWidth / 2;
    }
    function onTouch() {
      touched = true;
      if (hint && scrollable()) hint.classList.add('is-done');
    }
    centre();
    window.addEventListener('resize', centre);
    ['pointerdown', 'touchstart', 'wheel'].forEach(function (type) {
      scroller.addEventListener(type, onTouch, { passive: true });
    });
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    var seen = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      seen.disconnect();
      if (touched || !scrollable() || !scroller.scrollTo) return;
      var start = scroller.scrollLeft;
      window.setTimeout(function () {
        if (touched) return;
        scroller.scrollTo({ left: start + 80, behavior: 'smooth' });
        window.setTimeout(function () { if (!touched) scroller.scrollTo({ left: start, behavior: 'smooth' }); }, 750);
      }, 600);
    }, { threshold: 0.6 });
    seen.observe(scroller);
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
  /* how much a grey sky washes the colour out of the page sky */
  var WX_GREY = { partly: 0.12, cloudy: 0.45, fog: 0.45, drizzle: 0.4, rain: 0.5, snow: 0.5, storm: 0.6 };

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

  /* ---------- time of day: the panorama follows the sun over Gusinje ----------
     The sun's height and direction are worked out for Gusinje from the visitor's clock,
     and the scene is blended between these palettes (alt = height of the sun in degrees):
     high sun -> day -> golden hour -> dusk -> blue hour -> night.
     Colours are "#rrggbb" or "#rrggbb/opacity"; lists follow the gradient stops in index.html. */
  var SKY_KEYS = [
    { alt: -16, /* night */
      hero: '#080c15 #0a0f1d #0e1427',
      sky: '#0b1021/0 #10162f/.55 #161d3c/.8 #1b2346/.9 #212a50/1 #212a50/1',
      glow: '#8fa0d8/.08 #6070b0/.03 #404a80/0', spread: 600, squash: 0.4, disc: '#ffe9c0',
      far: '#363c64 #2a3056 #20264a #171c3a', rim: '#c9d4ff/.22', mist: '#8b97c0/.12', haze: '#8d97bd',
      mid: '#1c2244 #151a38 #0f142b', forestMid: '#131834',
      near: '#10152d #0b1024 #070a17', forestNear: '#090d1d',
      lake: '#161c39 #2d3664 #1a2046 #0b0f22',
      cloudW: '#6d77a8/.2', cloudC: '#5a6699/.18', veil: '#0b0f1f',
      peak: '#c8d2f0/.48', shimmer: '#c8d7ff/.45', stars: 1, lights: 1, cars: 1, shade: 0.9, birds: 0 },
    { alt: -8, /* blue hour */
      hero: '#090d18 #0c1222 #121a33',
      sky: '#121a34/0 #1a2244/.55 #2c3564/.8 #534f7c/.9 #7e6488/1 #7e6488/1',
      glow: '#f0a882/.4 #b87090/.16 #7a5a8a/0', spread: 600, squash: 0.4, disc: '#ffc98a',
      far: '#4e5282 #3d4271 #2c325e #1f2546', rim: '#f7bf98/.4', mist: '#b0a4c8/.2', haze: '#aaa2c4',
      mid: '#242b54 #1b2144 #131933', forestMid: '#181e3d',
      near: '#151b36 #0f152b #090d1d', forestNear: '#0b1023',
      lake: '#20264a #74607f #3b3b64 #10152b',
      cloudW: '#c09cb4/.32', cloudC: '#7d88b8/.26', veil: '#11162c',
      peak: '#e0d8f0/.55', shimmer: '#f0d0c0/.6', stars: 1, lights: 1, cars: 1, shade: 0.9, birds: 0 },
    { alt: -2, /* dusk: the sun has just set behind the Prokletije */
      hero: '#0a0e17 #0c1322 #131b33',
      sky: '#141d35/0 #1f2750/.55 #4f4272/.8 #b86f52/.92 #f0a452/1 #f0a452/1',
      glow: '#ffe6a3/.9 #ffb85e/.38 #ff9a4a/0', spread: 560, squash: 0.42, disc: '#ffd48a',
      far: '#6c6591 #4e5282 #343a68 #232a4f', rim: '#ffe2a6/.85', mist: '#d9c3d6/.26', haze: '#c9b9d6',
      mid: '#2d3561 #1f2649 #151b36', forestMid: '#1b2244',
      near: '#18203d #111831 #0b1020', forestNear: '#0d1326',
      lake: '#2a2f58 #b9734f #5e4869 #141a33',
      cloudW: '#ffc79a/.45', cloudC: '#9aa6d8/.3', veil: '#141a30',
      peak: '#ffecd2/.62', shimmer: '#ffe2aa/.75', stars: 0.8, lights: 1, cars: 1, shade: 0.9, birds: 0.55 },
    { alt: 4, /* golden hour */
      hero: '#0c1a36 #16305b #2b4a7c',
      sky: '#203f72/0 #2f5288/.6 #5a78a8/.88 #c99c82/.95 #f5c27e/1 #f6ca86/1',
      glow: '#fff2c8/.95 #ffcf80/.45 #ffb060/0', spread: 520, squash: 0.5, disc: '#fff0c4',
      far: '#9c8aa6 #7a7399 #585b87 #3c426d', rim: '#ffe4ac/.95', mist: '#f3d8c4/.3', haze: '#e8d4cc',
      mid: '#3d4b75 #2c3860 #1f294b', forestMid: '#262f56',
      near: '#1f2b4b #16203d #0e152b', forestNear: '#141c37',
      lake: '#3e5e92 #e8b070 #6c6892 #1a2442',
      cloudW: '#ffdcae/.6', cloudC: '#c9c9e8/.42', veil: '#3a4058',
      peak: '#fff2dc/.78', shimmer: '#ffe8b8/.85', stars: 0, lights: 0.3, cars: 0.7, shade: 0.7, birds: 1 },
    { alt: 14, /* day */
      hero: '#0c2549 #154379 #2966a2',
      sky: '#1c5590/0 #2966a4/.6 #4581bd/.9 #78a8d4/1 #a9cae6/1 #bdd8ee/1',
      glow: '#fffaf0/.55 #ffeac4/.2 #ffeac4/0', spread: 440, squash: 0.7, disc: '#fffae8',
      far: '#8b9dc0 #6f84ab #576d94 #41567a', rim: '#fff4e0/.5', mist: '#f0f2f6/.3', haze: '#e4ecf4',
      mid: '#3d6179 #2e506b #223f58', forestMid: '#264a57',
      near: '#22435a #193446 #0f2230', forestNear: '#15313d',
      lake: '#5689bd #93bce0 #44749f #152c45',
      cloudW: '#fffaf2/.66', cloudC: '#eef3fa/.55', veil: '#5a6577',
      peak: '#ffffff/.8', shimmer: '#ffffff/.8', stars: 0, lights: 0, cars: 0.45, shade: 0.45, birds: 1 },
    { alt: 32, /* high sun */
      hero: '#0d2a52 #174a86 #2c6eae',
      sky: '#1f5b98/0 #2c6fae/.6 #4a8cc6/.9 #7fb1dc/1 #b1d2ec/1 #c7e0f2/1',
      glow: '#ffffff/.5 #fff3d1/.16 #fff3d1/0', spread: 420, squash: 0.75, disc: '#fffdf4',
      far: '#8da3c4 #7189b0 #5a7299 #435a7f', rim: '#ffffff/.4', mist: '#eef4fa/.3', haze: '#e6eef6',
      mid: '#3f6a7d #2f5670 #23445c', forestMid: '#274f5a',
      near: '#24485a #1a3848 #102432', forestNear: '#16343f',
      lake: '#5d97c9 #9cc6e6 #4a7fae #173049',
      cloudW: '#ffffff/.7', cloudC: '#f4f8fc/.6', veil: '#5f6b7a',
      peak: '#ffffff/.82', shimmer: '#ffffff/.85', stars: 0, lights: 0, cars: 0.4, shade: 0.4, birds: 1 }
  ];
  SKY_KEYS.forEach(function (key) {
    Object.keys(key).forEach(function (name) {
      if (typeof key[name] !== 'string') return;
      key[name] = key[name].split(' ').map(function (token) {
        var part = token.split('/'), hex = part[0];
        return [parseInt(hex.substr(1, 2), 16), parseInt(hex.substr(3, 2), 16), parseInt(hex.substr(5, 2), 16), part.length > 1 ? Number(part[1]) : 1];
      });
    });
  });

  /* height of the far range every 50 units of the 1600-wide drawing: the sun rises and sets behind it */
  var RIDGE = [242, 238, 231, 226, 226, 212, 212, 212, 207, 200, 200, 187, 174, 150, 138, 128, 128,
    128, 132, 165, 181, 150, 150, 150, 153, 176, 194, 206, 213, 218, 226, 230, 234];
  var skyPreview = null; /* ?time=HH:MM shows another time of day */
  var sceneKind = null;  /* the weather the scene is dressed for */

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function ridgeAt(x) {
    var f = clamp(x / 50, 0, RIDGE.length - 1), i = Math.floor(f);
    return i >= RIDGE.length - 1 ? RIDGE[i] : RIDGE[i] + (RIDGE[i + 1] - RIDGE[i]) * (f - i);
  }

  /* height (alt) and compass direction (az, 180 = south) of the sun over Gusinje */
  function sunPosition(date) {
    var rad = Math.PI / 180, lat = 42.5622 * rad, lon = 19.8342;
    var d = date.getTime() / 86400000 - 10957.5;                 /* days since 1 Jan 2000, 12:00 UTC */
    var g = (357.529 + 0.98560028 * d) * rad;
    var q = 280.459 + 0.98564736 * d;
    var L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
    var e = (23.439 - 0.00000036 * d) * rad;
    var ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
    var dec = Math.asin(Math.sin(e) * Math.sin(L));
    var ha = ((18.697374558 + 24.06570982441908 * d) * 15 + lon) * rad - ra;
    var alt = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha));
    var az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(lat) - Math.sin(lat) * Math.cos(ha));
    return { alt: alt / rad, az: (az / rad + 360) % 360 };
  }

  /* the palette for a sun height, blended from the two nearest keys */
  function skyAt(alt) {
    var i = 0, last = SKY_KEYS.length - 1;
    if (alt <= SKY_KEYS[0].alt) return SKY_KEYS[0];
    if (alt >= SKY_KEYS[last].alt) return SKY_KEYS[last];
    while (alt > SKY_KEYS[i + 1].alt) i++;
    var a = SKY_KEYS[i], b = SKY_KEYS[i + 1], f = (alt - a.alt) / (b.alt - a.alt), out = {};
    Object.keys(a).forEach(function (name) {
      var va = a[name], vb = b[name];
      out[name] = typeof va === 'number' ? va + (vb - va) * f : va.map(function (c, n) {
        return [0, 1, 2, 3].map(function (ch) { return c[ch] + (vb[n][ch] - c[ch]) * f; });
      });
    });
    return out;
  }

  function rgb(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }
  function rgba(c) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + c[3].toFixed(3) + ')'; }
  function alpha(c, a) { return [c[0], c[1], c[2], a]; }
  function greyed(c, amount) {
    var l = c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
    return [c[0] + (l - c[0]) * amount, c[1] + (l - c[1]) * amount, c[2] + (l - c[2]) * amount, c[3]];
  }

  function setStops(id, colors) {
    var grad = document.getElementById(id);
    if (!grad) return;
    var stops = grad.getElementsByTagName('stop');
    for (var i = 0; i < stops.length && i < colors.length; i++) {
      stops[i].setAttribute('stop-color', rgb(colors[i]));
      stops[i].setAttribute('stop-opacity', colors[i][3].toFixed(3));
    }
  }

  function renderSky() {
    var sun = sunPosition(skyPreview || new Date());
    var k = skyAt(sun.alt);
    var root = document.documentElement;
    var grey = WX_GREY[sceneKind] || 0;
    var vars = {
      '--sky-0': rgb(greyed(k.hero[0], grey)), '--sky-1': rgb(greyed(k.hero[1], grey)), '--sky-2': rgb(greyed(k.hero[2], grey)),
      '--forest-mid': rgb(k.forestMid[0]), '--forest-near': rgb(k.forestNear[0]), '--sun-core': rgb(k.disc[0]),
      '--peak-ink': rgba(k.peak[0]), '--shimmer': rgba(k.shimmer[0]),
      '--stars': k.stars.toFixed(2), '--lights': k.lights.toFixed(2), '--car-glow': k.cars.toFixed(2),
      '--shade': k.shade.toFixed(2), '--birds': k.birds.toFixed(2)
    };
    Object.keys(vars).forEach(function (name) { root.style.setProperty(name, vars[name]); });

    var rim = k.rim[0], mist = k.mist[0], haze = k.haze[0], veil = k.veil[0];
    setStops('pano-sky', k.sky);
    setStops('pano-sun', k.glow);
    setStops('pano-sun-halo', [alpha(k.disc[0], 0.55), alpha(k.disc[0], 0)]);
    setStops('pano-far-fill', k.far);
    setStops('pano-rim', [alpha(rim, rim[3] * 0.14), rim, alpha(rim, rim[3] * 0.14)]);
    setStops('pano-mist', [alpha(mist, 0), mist, alpha(mist, 0)]);
    setStops('pano-mid-fill', k.mid);
    setStops('pano-near-fill', k.near);
    setStops('pano-lake', k.lake);
    setStops('pano-cloud-warm', [k.cloudW[0], alpha(k.cloudW[0], 0)]);
    setStops('pano-cloud-cool', [k.cloudC[0], alpha(k.cloudC[0], 0)]);
    setStops('pano-veil', [alpha(veil, 0), alpha(veil, 1), alpha(veil, 1)]);
    setStops('valley-mist', [alpha(haze, 0), alpha(haze, 0.16), alpha(haze, 0)]);
    setStops('fog-grad', [alpha(haze, 0), alpha(haze, 0.34), alpha(haze, 0.28), alpha(haze, 0)]);

    /* where the sun stands: east on the left, south in the middle (behind Karanfili), west on the right */
    var x = clamp(800 + (sun.az - 180) * 3.6, 120, 1480);
    var ridge = ridgeAt(x);
    var y = ridge - (sun.alt >= 0 ? (ridge - 64) * (1 - Math.exp(-sun.alt / 11)) : sun.alt * 6);
    var gy = clamp(y + Math.max(0, -sun.alt) * 20, 90, 262);
    var glow = document.getElementById('pano-sun');
    if (glow) {
      glow.setAttribute('cx', x.toFixed(1));
      glow.setAttribute('cy', gy.toFixed(1));
      glow.setAttribute('r', Math.round(k.spread));
      glow.setAttribute('gradientTransform', 'translate(' + x.toFixed(1) + ' ' + gy.toFixed(1) + ') scale(1 ' +
        k.squash.toFixed(3) + ') translate(' + (-x).toFixed(1) + ' ' + (-gy).toFixed(1) + ')');
    }
    var rimGrad = document.getElementById('pano-rim');
    if (rimGrad) {
      rimGrad.setAttribute('x1', (x - 800).toFixed(1));
      rimGrad.setAttribute('x2', (x + 800).toFixed(1));
    }
    var disc = sun.alt < -3 ? 0 : 1;
    $all('.sun-disc').forEach(function (el) {
      /* in the contact band the text sits in the sky, so the sun only shows there when it is low */
      var shown = el.closest('.pano-cta') ? disc * clamp((y - 110) / 30, 0, 1) : disc;
      el.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
      el.setAttribute('opacity', shown.toFixed(2));
    });
    /* a peak name steps aside while the sun passes behind it */
    $all('.peak-label').forEach(function (label) {
      var dx = Math.max(0, Math.abs(x - Number(label.getAttribute('x'))) - 50);
      var dy = y - (Number(label.getAttribute('y')) - 5);
      var near = disc * (1 - clamp((Math.sqrt(dx * dx + dy * dy) - 16) / 36, 0, 1));
      label.style.opacity = near > 0.01 ? (1 - near).toFixed(2) : '';
    });
    root.setAttribute('data-sky', sun.alt >= 8 ? 'day' : sun.alt >= 0 ? 'golden' : sun.alt >= -6 ? 'dusk' : sun.alt >= -12 ? 'twilight' : 'night');
  }

  /* "19:30" -> that time today in Gusinje (for the ?time= preview) */
  function previewTime(value) {
    var m = /^(\d{1,2}):?(\d{2})$/.exec(value || '');
    if (!m) return null;
    try {
      var now = new Date(), p = {};
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Podgorica', year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', hour12: false
      }).formatToParts(now).forEach(function (part) { p[part.type] = Number(part.value); });
      var offset = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute) - Math.floor(now.getTime() / 60000) * 60000;
      return new Date(Date.UTC(p.year, p.month - 1, p.day, Number(m[1]) % 24, Number(m[2])) - offset);
    } catch (e) { return null; }
  }

  /* dress the scene for the weather: grey veil, snow on the peaks, falling snow/rain, fog, lightning */
  function setScene(kind) {
    sceneKind = kind;
    $all('.hero-bg, .cta-bg').forEach(function (box) {
      ['clear', 'partly', 'cloudy', 'fog', 'drizzle', 'rain', 'snow', 'storm'].forEach(function (k) {
        box.classList.remove('wx-' + k);
      });
      if (kind) box.classList.add('wx-' + kind);
    });
    renderSky();

    var layer = $('.hero .wx-layer');
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
    var heroBg = $('.hero-bg');
    var month = Number(gusinjeTime({ month: 'numeric' })) || (new Date().getMonth() + 1);
    if (heroBg && (month >= 11 || month <= 4)) heroBg.classList.add('season-winter');

    /* previews: ?time=19:30 shows another time of day; ?wx=snow|rain|drizzle|storm|fog|cloudy|partly|clear
       shows that weather (?wx=night is the same as ?time=23:30) */
    var params = null;
    try { params = new URLSearchParams(window.location.search); } catch (e) { /* old browser */ }
    var forced = params && params.get('wx');
    if (forced && !WX_KINDS[forced]) forced = null;
    skyPreview = previewTime(params && params.get('time')) ||
      (params && params.get('wx') === 'night' ? previewTime('23:30') : null);
    if (forced) setScene(forced);
    else renderSky();
    window.setTimeout(function () { document.documentElement.classList.add('sky-ready'); }, 60);
    /* the sky moves on with the clock */
    window.setInterval(renderSky, 60000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) renderSky(); });

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
        if (!forced) setScene(WX.kind);
      })
      .catch(function () { /* offline or blocked: keep the clear-sky scene */ });
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
