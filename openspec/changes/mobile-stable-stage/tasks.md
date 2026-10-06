# Verification

- [x] Production build, manifest, PHP syntax (26 files) and package (66 entries).
- [x] Compare 375/390/430 before/after: +16/+72 heights, image, CTA, sticky origin.
- [x] Delayed module (12 px) and 1/5/20 px first scroll: no initialization jump.
- [x] 24 slow/fast native touch runs; 36 cold/warm reloads at top/mid, forward/reverse.
- [x] Portrait/landscape, reduced motion, no JS, media failure and resource selection.
- [x] Confirm unchanged media hashes and pixel-identical initial desktop/mobile stage.
- [x] Recheck final compiled build after consolidating the shared viewport variable.
- [ ] Physical Android/Chrome toolbar confirmation by user; nueva preview estática
  autorizada para esa prueba. Sin publicación de producción.

See HERO_MOBILE_VIEWPORT_QA.md for evidence and emulation limitations.
