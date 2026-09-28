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
  var STORAGE_KEY = 'tg_lang';
  /* dictionary key -> value for <html lang> ("cnr" = Montenegrin) */
  var LANG_TAGS = { sq: 'sq', me: 'cnr', en: 'en' };
  /* browser language -> dictionary key */
  var BROWSER_LANGS = { sq: 'sq', en: 'en', sr: 'me', bs: 'me', hr: 'me', cnr: 'me', me: 'me' };
  var currentLang = 'sq';
  var lastSuccess = null;
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function $(selector, root) { return (root || document).querySelector(selector); }
  function $all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function scrollToEl(el, block) { if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: block || 'start' }); }

  /* ---------- translations ---------- */
  function t(key, vars) {
    var dict = I18N[currentLang] || {};
    var str = dict[key];
    if (str == null) str = (I18N.sq && I18N.sq[key] != null) ? I18N.sq[key] : key;
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

    var preferred = CONFIG.defaultLang || 'auto';
    if (preferred !== 'auto' && I18N[preferred]) return preferred;

    var languages = navigator.languages || [navigator.language || 'en'];
    for (var i = 0; i < languages.length; i++) {
      var primary = String(languages[i]).toLowerCase().split('-')[0];
      var mapped = BROWSER_LANGS[primary];
      if (mapped && I18N[mapped]) return mapped;
    }
    return 'en';
  }

  function applyLang(lang) {
    currentLang = I18N[lang] ? lang : 'sq';
    document.documentElement.lang = LANG_TAGS[currentLang] || currentLang;
    try { localStorage.setItem(STORAGE_KEY, currentLang); } catch (e) { /* storage blocked */ }

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
    btn.addEventListener('click', function () { applyLang(btn.getAttribute('data-lang')); });
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

  /* ---------- misc ---------- */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- init ---------- */
  applyContact();
  applyLang(detectLang());
})();
