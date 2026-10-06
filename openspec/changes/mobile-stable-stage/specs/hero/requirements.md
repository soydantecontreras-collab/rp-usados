# Requirements

- On initial paint with JS and normal motion, reserve hero travel and sticky origin
  before deferred media initialization. A 1–20 px early scroll must not jump on init.
- Mobile image and caption share a stable visual height; +16/+72 px height-only
  changes must not translate either while outer black height follows DVH.
- Keep native scrolling and reversible media controller; no toolbar interception,
  compensatory height scrollTo, media edits or deployment.
- Width/orientation changes establish an appropriate new composition. Static,
  reduced-motion, unavailable-video and no-JS paths retain an accessible poster/CTA.
- Validate actual initial/top/mid reloads, source selection and immutable media.
  Distinguish Chromium viewport proxies from physical Android/Safari toolbar tests.
