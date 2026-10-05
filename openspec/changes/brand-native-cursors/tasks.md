# Tasks

- [x] Generate arrow/hand SVG, CUR and PNG; inspect shapes and hotspots.
- [x] Integrate CSS only, restricted to fine mouse, preserving native special states and card B.
- [x] Build/package and verify external assets/manifest.
- [x] Verify Chrome/Edge, touch no-download, no-JS and failed-assets fallbacks; capture light/dark/photo/red reviews.
- [x] Record results, exact local URL and remaining limits. No deploy.

50 browser/format checks passed in installed Chrome 154 and Edge 154; production build and package passed. Evidence: artifacts/brand-cursors/qa.json. Mobile 375/390/430 requested zero cursor files; CUR failure loaded PNG alternative; all-asset failure retains terminal native CSS keywords with no pointer-hiding JS. Hero JS chunk remains main-CvXnZ-NT.js. Local preview: http://127.0.0.1:9470/. Cursor-review screenshots are clearly documented composites because OS pointers are outside Playwright screenshots. Safari/Firefox and physical OS cursor rasterization are not certified by these headless checks. No deploy.

Size revision verified: native Windows arrow alpha bounds 12x19 and hand 18x24; regenerated PNG bounds match exactly. New hotspots (1,1)/(6,2). Build/package and repeated 50 Chrome/Edge runtime checks passed with new hashed assets.
