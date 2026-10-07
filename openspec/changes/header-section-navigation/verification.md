# Local verification — 2026-10-07

URL: http://127.0.0.1:9470/ (isolated existing rich DEMO WordPress; no remote deploy).

- Vite production build passed, manifest produced/readable. PHP 8.3: 26 files passed syntax validation. Installable ZIP regenerated without source/build tooling. git diff --check passed.
- Browser: desktop 1280/1024/900 and mobile 430/390/375. No horizontal overflow. Desktop header 64 px; mobile header 60 px, unchanged when disclosure opens. Mobile links 48 px tall.
- Desktop three anchors, mobile catalog anchor, and ficha -> Home/Nosotros navigation passed. Desktop catalog title lands around 76 px, mobile 71.6 px below respective 64/60 px header. Desktop Nosotros section 76 px, financing section 76 px; headings are further below their section padding.
- Enter opens mobile native disclosure, Tab reaches Vehículos with visible solid focus, Enter navigates/focuses catalog title and closes disclosure. Escape closes/returns focus to summary. Anchor hash is retained.
- No-JS browser test used temporary local proxy with script-src 'none' CSP. Native disclosure/anchor worked; title at 253.2 px below open navigation ending at 240 px. Proxy stopped and temporary script removed; no QA/debug added to runtime.
- Reduced motion branch inspected: instant scroll when requested; no navigation animation/CSS smooth scrolling dependency. OS preference was not emulated through the available browser tool.
- Desktop/mobile screenshots in ignored tools/.preview/header-navigation. Runtime files changed only: header.php, main.js, main.scss, header-navigation.js, header-navigation.css. Hero/media, catalog templates, vehicle page, backend, map and WhatsApp logic untouched.
- No commit, push or deploy performed. Local changes remain available for review.

## Mobile hamburger follow-up

- Build passed; PHP 8.3 26 files passed. Hamburger is a real BUTTON, aria-controls=mobile-navigation, expanded state synchronized. Native summary remains the no-JS fallback; no visible Menú text.
- At 375/390/430: header remains 60 px, hero shift on opening is 0 px, horizontal overflow 0 px, logo left 16 px (4 px closer to edge). Hamburger touch target 44 x 44 px; 20 px wide three-line icon. Contact action stays unchanged, before the hamburger.
- Open reveal 180 ms; subtle X state. Reduced-motion CSS disables reveal/line transitions. Preference branch inspected; no OS preference emulation.
- Second activation, outside click, selection and Escape close the panel. Enter opens, Tab reaches Vehículos with visible focus; Escape returns focus to the real toggle. Selecting Nosotros focuses its section, closes disclosure, updates hash and lands at ~72 px below 60 px header.
- Temporary CSP no-JS proxy proved native opening and anchor navigation: title 253.2 px, open panel bottom 240 px. Proxy/script removed.
- Desktop 1280 x 720: 64 px header, links retain identical x positions to approved version (719.90625, 807.453125, 892.09375), hamburger hidden. No protected component/source edited.
- Six header screenshots: tools/.preview/header-navigation/mobile-{375,390,430}-{closed,open}.jpg. Local only; no deploy.
