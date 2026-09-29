# Taxi Gusinje – website

A static one-page website for **Taxi Gusinje** (part of **Stemi Travel**) in three languages (Shqip / Crnogorski / English).
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
   one-way/return (a return trip asks for the date and time of the way back), notes. Phone numbers are
   accepted as people type them (+382 69…, 00382…, 069…); a pickup time that has already passed today is
   refused; the number of passengers suggests a vehicle if none is chosen. A short privacy note sits under
   the send button.
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
Open-Meteo service, no key, loaded by the visitor's browser and refreshed every 15 minutes while the page is open). The panorama follows the real
weather: grey skies when it is cloudy, snow falls and the peaks turn white when it snows, rain streaks down
in rain, lightning flashes in a storm, fog banks roll in with fog, and the sun, stars and birds hide behind
the clouds. From November to April the peaks carry snow anyway. If the weather cannot be loaded, only the
clock is shown.

**Previews.** Add `?time=` to the address to see another time of day, for example
`https://ariongj.github.io/taxig/?time=12:30`, `?time=18:30` (sunset) or `?time=23:00`. Add `?wx=` to see a
weather scene: `snow`, `rain`, `drizzle`, `storm`, `fog`, `cloudy`, `partly`, `clear` (`?wx=night` is the
same as `?time=23:30`). Both can be combined: `?time=12:00&wx=snow`.

### Phones

On phones and tablets (up to 923 px wide) the mountain panorama is wider than the screen, so it can be swiped left and right (it starts on
Gusinje, nudges once to show it moves, and every place is reachable). The layout is compact: the booking
buttons sit side by side, the vehicle plans are condensed
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
- `?lang=sq`, `?lang=mne` or `?lang=en` at the end of the address switches the page language. To **share** the site in
  Albanian or English, use the /sq/ and /en/ links from *Sharing the link* below: only those show the preview picture
  and text in that language.
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
| `assets/og-image.jpg` | the picture WhatsApp / Facebook show when the link is shared (1200 × 630, Montenegrin, with the phone number) |
| `assets/og-image-sq.jpg`, `assets/og-image-en.jpg` | the same share picture in Albanian and English |
| `sq/index.html`, `en/index.html` | share links for the Albanian and English site (see *Sharing the link* below) |
| `originals/` | kept on this computer only, not on the website (the printed flyer, which shows an old phone number; an older copy is still in the public git history of the repository) |
| `_config.yml` | tells GitHub Pages not to publish this README |
| `assets/favicon.svg` | browser-tab icon |

No external photos are used; everything except the Google fonts is inside this folder.

## Sharing the link

Share the address in the language of the person you send it to – WhatsApp and Facebook then show the
preview picture and text in that language:

- Montenegrin: https://ariongj.github.io/taxig/
- Albanian: https://ariongj.github.io/taxig/sq/
- English: https://ariongj.github.io/taxig/en/

## Editing

- **Phone / WhatsApp / Viber**: `js/config.js` → `phone`, `phoneDisplay`, `whatsapp`, `viber` (currently the official
  number +382 69 685 205 for all three, written in international form). The number is written in more places –
  see *Changing the phone number* below.
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

After editing `js/config.js` or `js/i18n.js`, check them for typos (a missing comma or quote would stop the
page's buttons from working):

```bash
node --check js/config.js
```

```bash
node --check js/i18n.js
```

**Changing the phone number** – besides `js/config.js`, the number is also written in `index.html` (the links that
work without JavaScript, the `telephone` line of the business data for Google, the description and
`og:image:alt`), in `js/i18n.js` (`meta.description` in all three languages), in `sq/index.html`, `en/index.html`,
`404.html`, and in the three share pictures `assets/og-image*.jpg` (which have to be made again).

**Live weather licence** – Open-Meteo's free service is meant for non-commercial use. For a business site, either
take their commercial plan or remove the weather chip; the sky that follows the sun works without it.

## Preview locally

Double-click `index.html`, or start the small local server and open http://localhost:8080:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/serve.ps1 -Port 8080
```

## Publishing

**Live site:** https://ariongj.github.io/taxig/ – published with GitHub Pages from the `main` branch of
https://github.com/ariongj/taxig. Every push to `main` updates the site within a minute or two.

Any other static hosting works too. Upload these files and folders: `index.html`, `404.html`, `css`, `js`,
`assets`, `sq`, `en`:

- **Netlify Drop** – make a new folder with only the files and folders listed above and drag that folder onto
  https://app.netlify.com/drop (free, instant). Don't drag the whole project folder: it also holds `originals/`
  (the old flyer) and this README.
- **GitHub Pages**, **Cloudflare Pages**, **Vercel** – point them at this folder.
- **Classic hosting (cPanel / FTP)** – upload to the `public_html` folder.

The share tags point to the GitHub Pages address so WhatsApp and Facebook show a preview. If the site moves
to its own domain (e.g. `taxigusinje.me`), update: `og:url` and `og:image` in `index.html`, the four `hreflang`
links and the business data (`url`, `image`, `@id`) in `index.html`, the addresses in `sq/index.html` and
`en/index.html`, and both `/taxig/` paths in `404.html`.
