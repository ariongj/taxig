/* =========================================================
   TAXI GUSINJE – site configuration
   Edit this file for the basics: phone number, WhatsApp/Viber,
   prices and language.
   A NEW PHONE NUMBER is also written in index.html (links that work
   without JavaScript, the business data for Google, the description),
   js/i18n.js (meta.description), sq/ and en/ index.html, 404.html and
   the share pictures assets/og-image*.jpg – see README > Editing.
   After editing, check the file with:  node --check js/config.js
   ========================================================= */
window.TG_CONFIG = {
  /* Phone number in international format (used for tel: links). */
  phone: "+38269685205",

  /* How the number is displayed on the page. */
  phoneDisplay: "+382 69 685 205",

  /* WhatsApp number: digits only, no "+" and no spaces. */
  whatsapp: "38269685205",

  /* Viber number in international format. */
  viber: "+38269685205",

  /* Main language, shown to every visitor who has not picked one:
     "me" (Crnogorski), "sq" (Shqip) or "en" (English).
     "auto" follows the browser language instead (Albanian -> sq,
     Montenegrin/Serbian/Bosnian/Croatian -> me, everything else -> en).
     A language the visitor picks with the SQ / MNE / EN buttons is remembered. */
  defaultLang: "me",

  /* Optional: receive booking requests by e-mail through a form service
     (for example Formspree: "https://formspree.io/f/xxxxxxxx").
     Leave empty ("") and requests are sent through WhatsApp instead. */
  formEndpoint: "",

  /* Optional starting prices in EUR per vehicle, shown as "from €30".
     Use a number, or null to show "Price on request". */
  prices: {
    car: null,
    van: null,
    bus: null
  }
};
