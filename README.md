# Taxi Gusinje – website

A static one-page website for **Taxi Gusinje** in three languages (Shqip / Crnogorski / English).
Night navy and taxi yellow like the printed flyer. The **service is in front** (vehicles, booking, phone);
behind it lives an animated panorama of the whole region with clickable destination hotspots, lit for
the real time of day in Gusinje (day, sunset, night).
No build step and no framework: upload the files to any web host and it works.

## What is on the page

1. **Hero** – "Taksi & transfere në gjithë rajonin", the three services (Vetura 1–4, Kombi 8+1 5–8, Autobus 9+),
   "Book now" and "Call us" buttons, and a service card with the owner's vehicles from the flyer.
   The cars have **hotspots** (Mercedes E-Class, VW Passat, Mercedes Sprinter); clicking one opens
   the booking form with that vehicle selected. Below the card: 24/7 phone, WhatsApp and Viber.
2. **Regional panorama** (behind and below the hero) – a view from Plav towards the Prokletije that follows
   the time of day (see below):
   the sun by day, twinkling stars, two shooting stars and a crescent moon by night, a plane with blinking lights, sunset glow behind
   the Karanfili crown and Maja Rosit, drifting clouds, mist over the peaks and the valley, forests,
   Lake Plav with shimmering water, village lights, and six taxis driving along the roads. On desktop
   the mountain layers follow the mouse for a sense of depth.
   In daylight a small flock of birds crosses the sky and an eagle circles over the peaks.
   **Destination hotspots**: Plavsko jezero, Plav, Hridsko jezero, Valbona, Grebaje, Gusinje,
   Alipašini izvori, Theth, Vusanje, Ropojana, Vermoš and Skadarsko jezero (glimpsed in the distance) –
   tapping one fills it in as the destination of the booking form. Road signs at the edges point to
   Podgorica / the airport and Skadar / Tirana.
3. **Services / three plans** – Car, Kombi 8+1 (most requested), Bus, each with *Request a quote*.
4. **Destinations** – local trips, airports, Montenegro, Albania & Kosovo, groups & events, plus an
   animated route map with taxis driving from Gusinje via Podgorica to the coast (Tivat, Budva, Bar,
   Ulcinj), via Skadar to Tirana and Durrës, via Peć to Priština and Prizren, and north to Berane and Kolašin.
   Skadar Lake (Skadarsko jezero) lies between Podgorica and Skadar on the map.
5. **How it works** – 1) send request, 2) **the owner calls you back to confirm**, 3) driver picks you up.
6. **Booking request form** – name, phone, pickup, destination, date, time, passengers, vehicle,
   one-way/return, notes.
7. **Contact band** – the same dusk panorama with phone, WhatsApp, Viber, location and hours.
8. Sticky **Call / WhatsApp / Book** bar on phones.

Visitors who prefer reduced motion (a system setting) get a still version without animations.

### Day and night, live time and weather

**Time of day.** The page works out where the sun stands over Gusinje right now (from the visitor's
own clock, converted to Montenegrin time) and paints the sky to match: a blue day sky with the sun,
warm golden light in the late afternoon, the sun setting behind the Prokletije, dusk, blue hour with the
first stars, and a dark night with stars, the moon and the village lights. The sun rises on the left
(east), stands over Karanfili at noon and sets on the right (west); sunrise and sunset follow the season.
The sky and the contact band update by themselves every minute, so a page left open grows darker in the
evening.

**Clock and weather.** The hero shows the current local time in Gusinje and the live weather (free
Open-Meteo service, no key, loaded by the visitor's browser once per visit). The panorama follows the real
weather: grey skies when it is cloudy, snow falls and the peaks turn white when it snows, rain streaks down
in rain, lightning flashes in a storm, fog banks roll in with fog, and the sun, stars and birds hide behind
the clouds. From November to April the peaks carry snow anyway. If the weather cannot be loaded, only the
clock is shown.

**Previews.** Add `?time=` to the address to see another time of day, for example
`https://ariongj.github.io/taxig/?time=12:30`, `?time=18:30` (sunset) or `?time=23:00`. Add `?wx=` to see a
weather scene: `snow`, `rain`, `drizzle`, `storm`, `fog`, `cloudy`, `partly`, `clear` (`?wx=night` is the
same as `?time=23:30`). Both can be combined: `?time=12:00&wx=snow`.

### Phones

On phones the layout is compact: the booking buttons sit side by side, the vehicle plans are condensed
cards, destinations form one list, "how it works" is a timeline, date and time share a row in the form, and
a Call / WhatsApp / Book bar stays at the bottom of the screen.

### More on the page

- **How it works** – a small taxi drives along the three steps and the "we call you back" step rings.
- **FAQ** – six common questions (booking, night work, airports, Albania & Kosovo, price, groups).
- **Floating WhatsApp button** on desktop once the visitor scrolls past the hero.
- Home-screen icons for phones (`assets/apple-touch-icon.png`, `assets/favicon-32.png`) and a
  custom `404.html` page.

## How the booking request works

1. The customer picks a vehicle (service tile, car hotspot or plan card) or goes straight to the form,
   fills it in and presses **Send request**.
2. The site opens WhatsApp with a ready-made message (all details) addressed to the number
   in `js/config.js`. The customer only presses *Send*.
3. The page then shows *"Thank you, {name}! … we will call you on {phone} to confirm the price and time"*,
   with fallback buttons (open WhatsApp again, send by SMS, call now).
4. The owner receives the message on WhatsApp and calls the customer back. No online payment.

Optional: set `formEndpoint` in `js/config.js` to a form service URL (for example Formspree)
to receive requests **by e-mail** instead. WhatsApp and SMS stay available as a fallback.

## Languages

- **MNE** Crnogorski is the main language: the page itself is written in Montenegrin and every visitor
  sees it first. **SQ** Shqip and **EN** English are one click away in the header or footer, and a
  visitor's own choice is remembered.
- Change the main language with `defaultLang` in `js/config.js` (`"me"`, `"sq"`, `"en"`, or `"auto"` to
  follow the browser language).
- Links can force a language, handy for sharing: `https://your-site/?lang=sq`, `?lang=mne`, `?lang=en`.
- All texts live in `js/i18n.js`; every key exists in all three languages.

## Files

| File | What it is |
| --- | --- |
| `index.html` | the page, including the mountain silhouette, hotspots and route map (inline SVG) |
| `css/styles.css` | design |
| `js/config.js` | **phone, WhatsApp, Viber, prices, default language, form endpoint** – edit this first |
| `js/i18n.js` | every text in Albanian (`sq`), Montenegrin (`me`) and English (`en`) |
| `js/main.js` | language switch, vehicle preselection, form validation, WhatsApp message |
| `assets/fleet.jpg` | the vehicles, cropped from the flyer |
| `assets/flyer.jpg` | the flyer (used as the social-share image) |
| `assets/favicon.svg` | browser-tab icon |

No external photos are used; everything except the Google fonts is inside this folder.

## Editing

- **Phone / WhatsApp / Viber**: `js/config.js` → `phone`, `phoneDisplay`, `whatsapp`, `viber`.
- **Prices**: `js/config.js` → `prices: { car: 30, van: 50, bus: null }` shows "from €30" / "from €50";
  `null` shows "Price on request".
- **Vehicle photo**: replace `assets/fleet.jpg` with a sharper photo of the cars (same name, wide format).
  The current one comes from a phone screenshot of the flyer and is only 521 px wide. If the new photo
  is framed differently, move the three hotspots in `index.html` (`style="--x:24%;--y:58%"` etc.).
- **Panorama hotspots**: in `index.html`, each `<a class="spot" ... data-place="spot.theth" transform="translate(1000 214)">`
  is one place (the numbers are its position in the 1600 × 520 drawing). The names are the `spot.*`
  entries in `js/i18n.js`. Copy a line to add a place, delete one to remove it.
- **Texts**: `js/i18n.js`. The wording "fixed price", "no online payment", "give us your flight number",
  "Mercedes Sprinter" for the kombi and the passenger ranges are assumptions – confirm them with the owner.

## Preview locally

Double-click `index.html`, or start the small local server and open http://localhost:8080:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/serve.ps1 -Port 8080
```

## Publishing

**Live site:** https://ariongj.github.io/taxig/ – published with GitHub Pages from the `main` branch of
https://github.com/ariongj/taxig. Every push to `main` updates the site within a minute or two.

Any other static hosting works too. Upload **all** files and folders (`index.html`, `css`, `js`, `assets`):

- **Netlify Drop** – drag the whole folder onto https://app.netlify.com/drop (free, instant).
- **GitHub Pages**, **Cloudflare Pages**, **Vercel** – point them at this folder.
- **Classic hosting (cPanel / FTP)** – upload to the `public_html` folder.

The `og:url` and `og:image` meta tags in `index.html` point to the GitHub Pages address so WhatsApp and
Facebook show a preview. If the site moves to its own domain (e.g. `taxigusinje.me`), update both tags.
