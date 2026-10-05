# RP Usados — conventional brand cursors

Static arrow and hand; existing red #b51f2b, black #111414, 0.5 px pale keyline for separation. No animations, tracking or custom DOM cursor. Sources: default.svg and pointer.svg. Generate committed CUR/PNG files with `node tools/build-brand-cursors.mjs` from the repository root (bundled Sharp runtime, no project dependency).

Both canvases are 32×32. Visible alpha bounds exactly match Windows standard LoadCursor/GetIconInfo measurements on this machine: arrow 12×19; hand 18×24. Hotspots: arrow (1,1), hand index (6,2), relative to top-left. The CUR header and CSS use the same coordinates. CUR is a standard Windows 32-bit DIB with alpha and AND transparency mask; PNG is a cross-browser alternative. Terminal CSS values auto/pointer preserve system fallback. Input and disabled-control states are native.

Vite references the generated assets externally using no-inline. False `(hover:hover) and (pointer:fine)` conditions do not request them: verified at 375/390/430 in Chrome/Edge touch emulation. No JS is required. Both CUR and PNG alternatives may load on desktop; combined media ~10 KB. Source SVG is retained for editing, not requested at runtime.

Verification: `node tools/brand-cursors-qa.mjs`, reports/captures in artifacts/brand-cursors. Headless Chrome/Edge exercise actual production CSS, loading and fallback chains; they do not capture OS-rendered cursor pixels. `*-page.png` are original screenshots; `*-cursor-review.png` compose the actual PNG at tested hotspot for visual contrast review. User can inspect the live OS pointer at http://127.0.0.1:9470/.

Historical A/B/C/D sandbox is superseded and remains only an exploration archive. Production uses this static CSS system. Card B and hero were not modified.
