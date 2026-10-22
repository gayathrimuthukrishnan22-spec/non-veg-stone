# NonVeg.Store

**Crave it. Find it. Call it.**

A premium, static, non-vegetarian food discovery website covering meat, poultry and seafood. Built to feel like a premium food-tech brand — a cinematic 3D loader, a floating ambient hero scene, and a direct-contact conversion model (call / WhatsApp) instead of a checkout flow.

---

## 1. Project overview

NonVeg.Store is a single, static HTML site. There is no build step and no server-side code required — it can be opened directly or hosted on any static/PHP host, including a standard cPanel/Apache shared-hosting account.

Its job is simple: let a visitor browse categories (chicken, mutton, beef, pork, seafood), understand the specific cuts available, and then reach the business directly by phone or WhatsApp.

## 2. Folder structure

```
nonveg-store/
├── index.html
├── assets/
│   ├── images/
│   │   ├── hero/
│   │   ├── chicken/
│   │   ├── mutton/
│   │   ├── beef/
│   │   ├── pork/
│   │   └── seafood/
│   ├── icons/
│   └── models/
├── css/
│   ├── bootstrap.min.css        ← add here if going fully offline (see §7)
│   ├── bootstrap-icons.css      ← add here if going fully offline (see §7)
│   └── style.css                ← all custom design lives here
├── js/
│   ├── bootstrap.bundle.min.js  ← add here if going fully offline (see §7)
│   ├── main.js                  ← business config + orchestration
│   ├── three-scene.js           ← all Three.js visuals
│   ├── animations.js            ← GSAP loader sequence + scroll reveals
│   ├── theme.js                 ← light/dark mode
│   └── sound.js                 ← synthesized UI click sounds
└── README.md
```

## 3. Technology stack

- HTML5 / CSS3 / vanilla ES6+ JavaScript
- Bootstrap 5.3 (grid, offcanvas, utility classes only — visuals are fully custom)
- Bootstrap Icons
- Three.js (loader scene, hero atmosphere, seafood bubbles)
- GSAP + ScrollTrigger (loader timeline, scroll reveals)

No React/Vue/Angular, no Tailwind, no backend, no third-party APIs.

## 4. How to run

Because the page uses `fetch`-adjacent browser APIs and ES modules-style organization, open it via a local server rather than `file://`:

```bash
cd nonveg-store
python3 -m http.server 8080
# then visit http://localhost:8080
```

Any static server works (`npx serve`, VS Code Live Server, etc).

## 5. How to change business details

All contact information lives in **one place**: `js/main.js`, inside the `BUSINESS_CONFIG` object at the top of the file.

```js
const BUSINESS_CONFIG = {
  name: 'NonVeg.Store',
  phone: '+91XXXXXXXXXX',        // ← update: used for every "Call" button (tel: link)
  whatsapp: '91XXXXXXXXXX',      // ← update: no leading "+", used for wa.me links
  whatsappDefaultMessage: '...', // pre-filled WhatsApp message
  location: 'Your City, Tamil Nadu, India',
  hours: '7:00 AM – 9:00 PM, all days',
  email: 'hello@nonveg.store',
  social: {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/'
  }
};
```

- **Phone number**: edit `phone`. Every element with the class `js-call-link` (header, hero, bottom nav, CTA band, contact section) updates automatically.
- **WhatsApp**: edit `whatsapp` (digits only, country code, no `+`) and optionally `whatsappDefaultMessage`. Every `js-whatsapp-link` element updates automatically.
- **Social links**: edit `social.instagram` / `social.facebook`. To add more networks, add a new key, a new anchor in `index.html` with a matching `js-social-*` class, and wire it up in `applyBusinessConfig()` in `main.js`.
- **Location / hours**: edit `location` / `hours` — these populate the Contact section automatically.

## 6. How to replace images

Product photography is not included by default (the current build ships with icon-based cards so it works with zero image assets). To add real photography:

1. Drop images into the matching folder under `assets/images/` (e.g. a chicken photo goes in `assets/images/chicken/`).
2. In `index.html`, add an `<img>` inside the relevant `.product-card`, above or below the `<i class="product-icon">` element, with `width`/`height` attributes set and `loading="lazy" decoding="async"` to preserve the performance budget.
3. Prefer WebP/AVIF exports at the actual display size to avoid layout shift and keep payload small.

## 7. Going fully offline / local (no CDN)

By default the project loads Bootstrap, Bootstrap Icons, Three.js and GSAP from CDN (`jsdelivr`) for fast setup. To self-host:

1. Download `bootstrap.min.css` → `css/bootstrap.min.css`, and `bootstrap-icons.css` (+ its font files) → `css/bootstrap-icons.css`.
2. Download `bootstrap.bundle.min.js` → `js/bootstrap.bundle.min.js`.
3. Download `three.min.js`, `gsap.min.js`, `ScrollTrigger.min.js` and place them in `js/` (or a `js/vendor/` subfolder).
4. In `index.html`, replace each CDN `<link>`/`<script>` `src`/`href` with the local path.

## 8. How to enable/disable Three.js

Three.js is fully optional per-scene. In `js/main.js`, inside `boot()`:

- Remove/comment the `window.NonVegThree.initLoaderScene()` call to skip the cinematic loader's 3D layer (the loader will still show the logo + progress bar).
- Remove/comment `initHeroScene()` / `initSeafoodScene()` in `afterLoader()` to disable the ambient hero or seafood-bubble scenes individually.
- If the `THREE` CDN script fails to load, `three-scene.js` no-ops safely — the rest of the site continues to function.

## 9. How to modify theme colors

All colors are CSS custom properties at the top of `css/style.css`:

```css
:root{
  --bg: #FFF8EF;
  --surface: #FFFFFF;
  --text: #211A16;
  --muted: #75675E;
  --primary: #C83B22;
  --orange: #F0782B;
  --gold: #D9A441;
  --green: #5D7548;
  --border: #EADED2;
}
[data-theme="dark"]{
  --bg: #17110D;
  --surface: #211913;
  --text: #F7EEE4;
  --muted: #B7A99C;
  --border: #382C24;
}
```

Change any value and it cascades through the entire site immediately — buttons, headings, borders, and the loader gradient all reference these variables.

## 10. Deploying on shared hosting / cPanel

1. Zip the entire `nonveg-store/` folder contents (not the folder itself) or upload via cPanel's File Manager / FTP.
2. Upload everything into `public_html/` (or a subdirectory if the site should live at `yourdomain.com/subfolder`).
3. No `.htaccess`, PHP version, or database setup is required — it's a static site. If your host uses Apache, the defaults are fine as-is.
4. Point your domain's DNS / the hosting account's primary domain at that directory, and the site is live.
5. If serving over HTTPS (recommended — required for some browser APIs), enable your host's free SSL (e.g. AutoSSL/Let's Encrypt via cPanel) and ensure all asset URLs stay relative (they already are in this build).

## 11. Notes on availability claims

Beef and pork sections intentionally avoid asserting local availability, since this varies heavily by region and outlet in India. Update the copy in `index.html` (`#beef`, `#pork` sections) to reflect your actual sourcing before publishing.
