# Tasks

- [x] Inspect source and existing WordPress/Vite integration.
- [x] Announce and add only the required Three.js runtime dependency.
- [x] Preserve source hash, export working copy and inspect animation/materials.
- [x] Produce source poster and environment; document unsupported effects.
- [x] Implement isolated modular Home preview and reversible scroll.
- [x] Validate fallback, motion preferences, viewport and lifecycle behavior.
- [x] Measure payload, loading, frame rate and resource usage in the local browser.
- [x] Verify build, PHP, WordPress preview and package/regression checks.
- [x] Deliver preview, visual differences, limitations and recommendations in HERO_WEB_INTEGRATION.md.

The pipeline is validated as a local trial, not production-ready. Final integrated-GPU results are about 48 FPS with 8.5 seconds preparation, 79 MB JS heap, and a longest observed initialization task of 445 ms. A WordPress/Vite query-string mismatch that duplicated initialization was fixed; QA now asserts exactly one canvas and GLB request. Lighting remains visibly different from Cycles. No live stock was created; populated vehicle-detail visual QA is pending real data.
