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
  /* if js/i18n.js ever fails to load (e.g. a typo while editing), bookings still read properly in Montenegrin */
  var FALLBACK = {
    "plans.price.request": "Cijena na upit",
    "plans.price.from": "od €{price}",
    "plans.price.note": "Fiksna cijena, potvrđena telefonom",
    "form.vehicle.car": "Automobil",
    "form.vehicle.car.sub": "do 4 osobe",
    "form.vehicle.van": "Kombi 8+1",
    "form.vehicle.van.sub": "do 8 osoba",
    "form.vehicle.bus": "Autobus",
    "form.vehicle.bus.sub": "velike grupe",
    "form.trip.one": "U jednom pravcu",
    "form.trip.return": "Povratno",
    "form.error.required": "Ovo polje je obavezno.",
    "form.error.phone": "Unesite ispravan broj telefona, npr. +382 69 123 456.",
    "form.error.date": "Izaberite današnji ili kasniji datum.",
    "form.error.time": "Ovo vrijeme je već prošlo.",
    "form.error.return": "Povratak mora biti nakon polaska.",
    "form.error.vehicle": "Izaberite vozilo.",
    "form.error.capacity": "Ovo vozilo prima najviše {max} putnika – izaberite veće.",
    "form.error.pax": "Unesite broj putnika (1–60).",
    "form.error.summary": "Molimo popunite označena polja.",
    "form.success.title": "Hvala, {name}!",
    "form.success.wa": "Vaš zahtjev je spreman u WhatsApp-u – pritisnite „Pošalji“ ako još nije poslat. Čim ga primimo, zovemo vas na {phone} da potvrdimo cijenu i vrijeme.",
    "form.success.sent": "Primili smo vaš zahtjev. Zovemo vas na {phone} da potvrdimo cijenu i vrijeme.",
    "form.success.manual": "Formular nije mogao biti poslat automatski. Pošaljite zahtjev putem WhatsApp-a ili SMS-a – zatim vas zovemo na {phone} da potvrdimo.",
    "form.success.alt": "WhatsApp se nije otvorio? Pošaljite zahtjev na drugi način:",
    "form.success.openwa": "Otvori u WhatsApp-u",
    "form.success.sms": "Pošalji SMS-om",
    "form.success.call": "Pozovi odmah",
    "form.success.again": "Pošalji novi zahtjev",
    "wx.clear": "Vedro",
    "wx.partly": "Djelimično oblačno",
    "wx.cloudy": "Oblačno",
    "wx.fog": "Magla",
    "wx.drizzle": "Sitna kiša",
    "wx.rain": "Kiša",
    "wx.snow": "Snijeg",
    "wx.storm": "Grmljavina",
    "msg.title": "Zahtjev za rezervaciju – Stemi Travel · Taxi Gusinje",
    "msg.name": "Ime",
    "msg.phone": "Telefon",
    "msg.from": "Polazak",
    "msg.to": "Odredište",
    "msg.date": "Datum",
    "msg.time": "Vrijeme",
    "msg.pax": "Putnici",
    "msg.vehicle": "Vozilo",
    "msg.trip": "Putovanje",
    "msg.return": "Povratak",
    "msg.notes": "Napomene",
    "msg.footer": "Molim vas, pozovite me da potvrdimo."
  };
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
    if (str == null) str = (I18N.me && I18N.me[key] != null) ? I18N.me[key] : (FALLBACK[key] != null ? FALLBACK[key] : key);
    if (vars) {
      Object.keys(vars).forEach(function (name) {
        str = str.split('{' + name + '}').join(vars[name]);
      });
    }
    return str;
  }

  /* like t(), but null when a text is missing, so the page keeps what it already shows */
  function tr(key) {
    var dict = I18N[currentLang] || {};
    if (dict[key] != null) return dict[key];
    if (I18N.me && I18N.me[key] != null) return I18N.me[key];
    return FALLBACK[key] != null ? FALLBACK[key] : null;
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

    function each(attr, apply) {
      $all('[' + attr + ']').forEach(function (el) {
        var text = tr(el.getAttribute(attr));
        if (text != null) apply(el, text);
      });
    }
    each('data-i18n', function (el, text) { el.textContent = text; });
    each('data-i18n-html', function (el, text) { el.innerHTML = text; });
    each('data-i18n-placeholder', function (el, text) { el.setAttribute('placeholder', text); });
    each('data-i18n-aria', function (el, text) { el.setAttribute('aria-label', text); });
    each('data-i18n-alt', function (el, text) { el.setAttribute('alt', text); });
    each('data-i18n-value', function (el, text) { el.setAttribute('value', text); });
    /* error messages already on screen follow the language too */
    $all('[data-error-key]').forEach(function (el) {
      var key = el.getAttribute('data-error-key'), vars = null;
      try { vars = JSON.parse(el.getAttribute('data-error-vars') || 'null'); } catch (e) { /* ignore */ }
      if (tr(key) != null) el.textContent = t(key, vars);
    });

    if (tr('meta.title') != null) document.title = tr('meta.title');
    var metaDescription = $('meta[name="description"]');
    if (metaDescription && tr('meta.description') != null) metaDescription.setAttribute('content', tr('meta.description'));

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
  /* numbers from config.js; if one is missing or mistyped, the numbers written in the page stay */
  function digits(value) {
    var d = String(value || '').replace(/\D/g, '');
    if (d.indexOf('00') === 0) d = d.slice(2);
    return /^[1-9]\d{7,14}$/.test(d) ? d : '';
  }
  var PHONE_NUM = digits(CONFIG.phone);
  var WA_NUM = digits(CONFIG.whatsapp) || PHONE_NUM;
  var VIBER_NUM = digits(CONFIG.viber) || PHONE_NUM;
  if (!WA_NUM) {
    var staticWa = $('[data-link="wa"]');
    WA_NUM = staticWa ? digits((staticWa.getAttribute('href') || '').split('?')[0]) : '';
  }
  if (!PHONE_NUM) PHONE_NUM = WA_NUM;

  function applyContact() {
    if (PHONE_NUM) $all('[data-link="tel"]').forEach(function (a) { a.setAttribute('href', 'tel:+' + PHONE_NUM); });
    if (WA_NUM) $all('[data-link="wa"]').forEach(function (a) { a.setAttribute('href', 'https://wa.me/' + WA_NUM); });
    if (VIBER_NUM) $all('[data-link="viber"]').forEach(function (a) { a.setAttribute('href', 'viber://chat?number=%2B' + VIBER_NUM); });
    var shown = CONFIG.phoneDisplay || CONFIG.phone;
    if (shown) $all('[data-phone-text]').forEach(function (el) { el.textContent = shown; });
  }

  function renderPrices() {
    $all('[data-price]').forEach(function (el) {
      var key = el.getAttribute('data-price');
      var price = CONFIG.prices ? CONFIG.prices[key] : null;
      var text = (typeof price === 'number' && price > 0)
        ? (tr('plans.price.from') != null ? t('plans.price.from', { price: price }) : null)
        : tr('plans.price.request');
      if (text != null) el.textContent = text;
    });
  }

  function renderSubmitHint() {
    var hint = $('#submit-hint');
    var text = tr(CONFIG.formEndpoint ? 'form.submit.hint.endpoint' : 'form.submit.hint');
    if (hint && text != null) hint.textContent = text;
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
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !header.classList.contains('nav-open')) return;
    var inside = header.contains(document.activeElement);
    closeNav();
    if (inside) navToggle.focus();
  });
  /* the phone menu also closes when anything outside it (or any page link) is tapped */
  document.addEventListener('click', function (e) {
    if (!header.classList.contains('nav-open')) return;
    var target = e.target;
    if (!header.contains(target) || (target.closest && target.closest('a[href^="#"]'))) closeNav();
  });

  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  $all('[data-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var lang = btn.getAttribute('data-lang');
      applyLang(lang, true);
      /* keep the address in step, so a copied link opens in the same language */
      try {
        var url = new URL(window.location.href);
        var def = CONFIG.defaultLang || 'me';
        if (def !== 'auto' && lang === def) url.searchParams.delete('lang'); else url.searchParams.set('lang', lang);
        history.replaceState(null, '', url.pathname + url.search + url.hash);
      } catch (e) { /* old browser */ }
    });
  });
  /* without the dictionaries the page simply stays in Montenegrin */
  if (!I18N.me) $all('.lang-switch, .footer-langs').forEach(function (el) { el.hidden = true; });

  /* ---------- reveal on scroll ---------- */
  /* sections are only hidden for the fade-in once this script runs, so a script error never blanks the page */
  var revealElements = $all('.reveal');
  document.documentElement.classList.add('js-reveal');
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
  var returnBox = $('#return-fields');
  var errorSummary = $('#form-error-summary');

  function field(name) { return form.elements.namedItem(name); }

  /* phone numbers the way people type them: +382 69 123 456, 00382 69…, 069 123 456, (069) 123-456 */
  function normalisePhone(value) {
    var s = String(value).replace(/[\s\/().-]/g, '');
    if (s.indexOf('00') === 0) s = '+' + s.slice(2);
    return s;
  }
  function validPhone(value) {
    var s = normalisePhone(value);
    if (/^\+382/.test(s)) return /^\+382\d{8,9}$/.test(s);
    return /^\+[1-9]\d{7,14}$/.test(s) || /^0\d{8,9}$/.test(s);
  }

  /* today's date and the time right now in Gusinje, whatever the visitor's own time zone */
  function gusinjeNow() {
    var d = new Date();
    try {
      var p = {};
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Podgorica', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(d).forEach(function (part) { p[part.type] = part.value; });
      if (!p.year) throw new Error('no parts');
      return { date: p.year + '-' + p.month + '-' + p.day, time: (p.hour === '24' ? '00' : p.hour) + ':' + p.minute };
    } catch (e) {
      return {
        date: d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2),
        time: ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2)
      };
    }
  }
  function todayISO() { return gusinjeNow().date; }
  function setDateLimits() {
    if (dateInput) dateInput.min = todayISO();
    var rdate = field('rdate');
    if (rdate) rdate.min = (dateInput && dateInput.value) || todayISO();
  }
  setDateLimits();

  /* errors: shown under the field, tied to it for screen readers, and re-translated on a language change */
  function groupOf(el) { return el.type === 'radio' ? $all('input[name="' + el.name + '"]', form) : [el]; }
  function describe(input, errorId) {
    var ids = [];
    if (input.id === 'f-phone') ids.push('phone-hint');
    if (errorId) ids.push(errorId);
    if (ids.length) input.setAttribute('aria-describedby', ids.join(' '));
    else input.removeAttribute('aria-describedby');
  }
  function setError(el, key, vars) {
    var wrap = el.closest('.field');
    if (!wrap) return;
    wrap.classList.add('is-invalid');
    var error = wrap.querySelector('[data-error]');
    if (error) {
      if (!error.id) error.id = 'err-' + (el.name || el.id);
      error.textContent = t(key, vars);
      error.setAttribute('data-error-key', key);
      if (vars) error.setAttribute('data-error-vars', JSON.stringify(vars)); else error.removeAttribute('data-error-vars');
    }
    groupOf(el).forEach(function (input) {
      input.setAttribute('aria-invalid', 'true');
      describe(input, error ? error.id : null);
    });
  }
  function clearError(el) {
    var wrap = el.closest('.field');
    if (!wrap) return;
    wrap.classList.remove('is-invalid');
    var error = wrap.querySelector('[data-error]');
    if (error) { error.textContent = ''; error.removeAttribute('data-error-key'); error.removeAttribute('data-error-vars'); }
    groupOf(el).forEach(function (input) { input.removeAttribute('aria-invalid'); describe(input, null); });
    if (errorSummary && !form.querySelector('.field.is-invalid')) errorSummary.hidden = true;
  }
  function clearErrors() {
    $all('.field.is-invalid', form).forEach(function (wrap) {
      var input = wrap.querySelector('input, textarea');
      if (input) clearError(input); else wrap.classList.remove('is-invalid');
    });
    if (errorSummary) errorSummary.hidden = true;
  }

  $all('input, textarea', form).forEach(function (el) {
    function clear() { if (el.closest('.field.is-invalid')) clearError(el); }
    el.addEventListener('input', clear);
    el.addEventListener('change', clear);
  });

  /* "return trip" asks for the date and time of the way back */
  function syncReturn() {
    if (!returnBox) return;
    var isReturn = !!form.querySelector('input[name="trip"][value="return"]:checked');
    returnBox.hidden = !isReturn;
    ['rdate', 'rtime'].forEach(function (name) {
      var el = field(name);
      if (!el) return;
      el.required = isReturn;
      if (!isReturn) clearError(el);
    });
    setDateLimits();
  }
  $all('input[name="trip"]', form).forEach(function (radio) { radio.addEventListener('change', syncReturn); });
  if (dateInput) dateInput.addEventListener('change', setDateLimits);
  syncReturn();

  /* no vehicle picked yet? the number of passengers suggests one */
  var paxInput = field('passengers');
  if (paxInput) {
    paxInput.addEventListener('change', function () {
      if (form.querySelector('input[name="vehicle"]:checked')) return;
      var n = parseInt(paxInput.value, 10);
      if (isNaN(n) || n < 1) return;
      var radio = form.querySelector('input[name="vehicle"][value="' + (n <= 4 ? 'car' : n <= 8 ? 'van' : 'bus') + '"]');
      if (radio) { radio.checked = true; clearError(radio); }
    });
  }

  function validate() {
    clearErrors();
    var firstBad = null;
    function bad(el, key, vars) { setError(el, key, vars); if (!firstBad) firstBad = el; }

    var name = field('name'), phone = field('phone'), from = field('from'), to = field('to');
    var date = field('date'), time = field('time'), passengers = field('passengers');
    var now = gusinjeNow();

    if (!name.value.trim()) bad(name, 'form.error.required');
    if (!phone.value.trim()) bad(phone, 'form.error.required');
    else if (!validPhone(phone.value)) bad(phone, 'form.error.phone');
    if (!from.value.trim()) bad(from, 'form.error.required');
    if (!to.value.trim()) bad(to, 'form.error.required');
    if (!date.value) bad(date, 'form.error.required');
    else if (date.value < now.date) bad(date, 'form.error.date');
    if (!time.value) bad(time, 'form.error.required');
    else if (date.value === now.date && time.value < now.time) bad(time, 'form.error.time');
    var count = parseInt(passengers.value, 10);
    if (!passengers.value || isNaN(count) || count < 1 || count > 60) bad(passengers, 'form.error.pax');
    var chosen = form.querySelector('input[name="vehicle"]:checked');
    var CAPACITY = { car: 4, van: 8 };
    if (!chosen) bad(form.querySelector('input[name="vehicle"]'), 'form.error.vehicle');
    else if (!isNaN(count) && CAPACITY[chosen.value] && count > CAPACITY[chosen.value]) {
      bad(chosen, 'form.error.capacity', { max: CAPACITY[chosen.value] });
    }

    if (form.querySelector('input[name="trip"][value="return"]:checked')) {
      var rdate = field('rdate'), rtime = field('rtime');
      if (!rdate.value) bad(rdate, 'form.error.required');
      else if (date.value && rdate.value < date.value) bad(rdate, 'form.error.return');
      if (!rtime.value) bad(rtime, 'form.error.required');
      else if (rdate.value && rdate.value === date.value && time.value && rtime.value <= time.value) bad(rtime, 'form.error.return');
    }

    if (firstBad) {
      if (errorSummary) errorSummary.hidden = false;
      scrollToEl(firstBad.closest('.field') || firstBad, 'center');
      try { firstBad.focus({ preventScroll: true }); } catch (e) { firstBad.focus(); }
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
    if (trip && trip.value === 'return') {
      lines.push('↩️ ' + t('msg.return') + ': ' + formatDate(field('rdate').value) + '   🕒 ' + t('msg.time') + ': ' + field('rtime').value);
    }
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
    var title = $('#success-title');
    if (title) { try { title.focus({ preventScroll: true }); } catch (e) { title.focus(); } }
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
    /* api.whatsapp.com keeps the emoji; the short wa.me link turns them into "?" boxes */
    var waUrl = WA_NUM ? 'https://api.whatsapp.com/send?phone=' + WA_NUM + '&text=' + encodeURIComponent(message) : '';
    var smsUrl = PHONE_NUM ? 'sms:+' + PHONE_NUM + '?&body=' + encodeURIComponent(message) : '';
    if (waUrl) $('#success-wa').setAttribute('href', waUrl);
    if (smsUrl) $('#success-sms').setAttribute('href', smsUrl);

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
    } else if (waUrl) {
      window.open(waUrl, '_blank', 'noopener');
      showSuccess('wa', name, phone);
    } else {
      showSuccess('manual', name, phone);
    }
  });

  $('#success-again').addEventListener('click', function () {
    form.reset();
    clearErrors();
    syncReturn();
    setDateLimits();
    lastSuccess = null;
    showForm();
    scrollToEl(form, 'start');
    var first = field('name');
    if (first) { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }
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
        clearError(radio);
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
        var label = spot.querySelector('.spot-label');
        to.value = tr(spot.getAttribute('data-place')) || (label ? label.textContent : '');
        clearError(to);
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

    /* arrow buttons: shown only on the side where there is more landscape to see */
    var prevBtn = $('.pano-prev'), nextBtn = $('.pano-next');
    function updateNav() {
      var can = scrollable(), max = scroller.scrollWidth - scroller.clientWidth;
      var focused = document.activeElement;
      if (prevBtn) prevBtn.hidden = !can || scroller.scrollLeft <= 4;
      if (nextBtn) nextBtn.hidden = !can || scroller.scrollLeft >= max - 4;
      /* keep the keyboard focus on a visible arrow when one side runs out */
      if (focused === prevBtn && prevBtn.hidden && nextBtn && !nextBtn.hidden) nextBtn.focus();
      if (focused === nextBtn && nextBtn.hidden && prevBtn && !prevBtn.hidden) prevBtn.focus();
    }
    [prevBtn, nextBtn].forEach(function (btn) {
      if (!btn) return;
      btn.addEventListener('click', function () {
        onTouch();
        var step = scroller.clientWidth * 0.7 * Number(btn.getAttribute('data-dir'));
        if (scroller.scrollBy) scroller.scrollBy({ left: step, behavior: reduceMotion ? 'auto' : 'smooth' });
        else scroller.scrollLeft += step;
      });
    });
    scroller.addEventListener('scroll', updateNav, { passive: true });
    window.addEventListener('resize', updateNav);
    updateNav();

    /* mouse: drag the landscape sideways (a drag is not a tap on a place) */
    var drag = null, dragged = false;
    scroller.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0 || !scrollable()) return;
      drag = { x: e.clientX, left: scroller.scrollLeft, moved: false };
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; scroller.classList.add('is-dragging'); }
      if (drag.moved) scroller.scrollLeft = drag.left - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!drag) return;
      dragged = drag.moved;
      drag = null;
      scroller.classList.remove('is-dragging');
      window.setTimeout(function () { dragged = false; }, 0);
    });
    scroller.addEventListener('click', function (e) {
      if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; }
    }, true);
    scroller.addEventListener('dragstart', function (e) { e.preventDefault(); });
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
    var sunUp = sunPosition(new Date()).alt > -0.833;
    var icon = (WX.kind === 'clear' && !sunUp) ? 'moon' : WX_ICONS[WX.kind];
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
      var hidden = (WX_GREY[sceneKind] || 0) >= 0.4; /* clouds cover the sun */
      var near = hidden ? 0 : disc * (1 - clamp((Math.sqrt(dx * dx + dy * dy) - 16) / 36, 0, 1));
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

  var LITE = !!((window.matchMedia && window.matchMedia('(max-width: 720px)').matches) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4));

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
      for (i = 0; i < (LITE ? 40 : 90); i++) {
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
      var count = kind === 'drizzle' ? (LITE ? 35 : 70) : (LITE ? 60 : 140);
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
    window.setTimeout(function () {
      renderClock();
      window.setInterval(renderClock, 60000);
    }, 60500 - (Date.now() % 60000));

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
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) return;
      renderClock();
      renderSky();
      if (Date.now() - lastWeather > WEATHER_EVERY) loadWeather();
    });

    var WEATHER_EVERY = 15 * 60000;
    var lastWeather = 0;   /* last attempt */
    var lastWeatherOk = 0; /* last successful reading */
    function loadWeather() {
      if (!window.fetch) return;
      lastWeather = Date.now();
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=42.5622&longitude=19.8342' +
        '&current=temperature_2m,weather_code,is_day&timezone=Europe%2FPodgorica';
      fetch(url)
        .then(function (res) { if (!res.ok) throw new Error('weather ' + res.status); return res.json(); })
        .then(function (data) {
          var now = data && data.current;
          if (!now || typeof now.temperature_2m !== 'number') return;
          var kind = wxKind(now.weather_code);
          lastWeatherOk = Date.now();
          WX.temp = now.temperature_2m;
          WX.isDay = now.is_day === 1;
          var changed = kind !== WX.kind;
          WX.kind = kind;
          renderWeather();
          if (!forced && changed) setScene(kind);
        })
        .catch(function () {
          /* offline or blocked: try again in 5 minutes; an old reading is not shown as "now" for long */
          lastWeather = Date.now() - WEATHER_EVERY + 5 * 60000;
          if (lastWeatherOk && Date.now() - lastWeatherOk > 45 * 60000) {
            var box = $('#live-wx');
            if (box) box.hidden = true;
          }
        });
    }
    loadWeather();
    window.setInterval(function () { if (!document.hidden && Date.now() - lastWeather >= WEATHER_EVERY) loadWeather(); }, 60000);
  })();

  /* ---------- animations rest while their part of the page is off screen (saves battery on phones) ---------- */
  (function () {
    function pauseSvg(svg, pause) {
      if (pause && svg.pauseAnimations) svg.pauseAnimations();
      if (!pause && svg.unpauseAnimations) svg.unpauseAnimations();
    }
    if (reduceMotion) {
      /* CSS cannot stop the SVG's own animations (moving cars, pulsing spots, the plane) */
      $all('svg').forEach(function (svg) { pauseSvg(svg, true); });
      return;
    }
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('anim-off', !entry.isIntersecting);
        $all('svg', entry.target).forEach(function (svg) { pauseSvg(svg, !entry.isIntersecting); });
      });
    }, { rootMargin: '100px 0px' });
    $all('.hero, .cta, .route-map').forEach(function (el) { io.observe(el); });
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
