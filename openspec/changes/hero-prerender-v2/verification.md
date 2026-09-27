# Verification and work log

Scope implemented as approved: independent preview only, source Blender untouched, no backend or V1 changes. UI sources are Stage 1 iteration 02. New files live in explorations/hero-v2 and blender/prerender-v2, with supporting report HERO_PRERENDER_V2.md.

Layer ownership: create-pages.py/style.css = interface; main.js = scroll and transition orchestration; seek-controller.js = media integration; render.py/encode.py = offline production; qa*.mjs = evidence. No persistence or business logic edits.

Requirement -> evidence:
- Independent identity: main/compact/reduced routes, reload assertions, no V1 network requests in qa/report.json.
- Faithful media: original SHA unchanged; render-report.json; encoding-report.json; first/middle/final visual inspection; per-candidate decoded poster; browser color difference measured and disclosed.
- Latest-target reversible control: forward/reverse 3s samples, quick reversal, real wheel input, target vs presented assertions.
- Progressive UI: video failure, JS absent/failed, normal mobile poster, live reduced motion, keyboard skip/focus, WhatsApp pending dialog, whole-card structure, zoom/resize.
- Evidence: 34 primary + 11 lifecycle checks passed; Vite isolated production build passed. Safari unavailable rather than asserted as passed.

Manual spec consistency checks completed against proposal/design/tasks/spec. No OpenSpec CLI dependency introduced. No production promotion or archive: user must review this V2 before choosing a final route.

Known limits and next decisions are in HERO_PRERENDER_V2.md. Recommend candidate A: 5.62 MB, ~47 presented fps, reverse seek p95 2.4ms in local Chromium. Keep mobile poster until physical-device validation. No final optimization or broader migration performed.
