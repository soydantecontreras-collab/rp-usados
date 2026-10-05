# Tasks

- [x] Inspect photo/sections and preserve approved boundaries.
- [x] Prepare responsive media and update copy/layout in two sections.
- [x] Build/package, PHP syntax, desktop/mobile/keyboard/reduced-motion QA.
- [x] Document final copy/photo replacement and pending contact. No deploy.

Evidence: production build/package passed; PHP 8.3 parsed all 25 theme PHP files. 59 targeted checks passed at 1920/1440/1280/768/430/390/375, keyboard pending-contact CTA, reduced motion, 200% zoom, responsive photo and no overflow. Actual browser srcset natural dimensions are density-corrected/rounded, so ratio checks use pixel-rounding tolerance; source variants are exactly 480×640, 720×960 and 960×1280. Screenshots and report: artifacts/institutional/. Copy/replacement workflow: INSTITUTIONAL_CONTENT.md. Hero JS hash remains main-CvXnZ-NT.js. No changes to backend/catalog/detail or hero assets. No deployment.
