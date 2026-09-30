# Mobile viewport, local demo, and institutional content

## Scope

- Stabilize the existing mobile hero viewport/sticky boundary without changing its media, composition, or scroll controller intent.
- Keep demonstration vehicles in a separate local WordPress Playground instance, conspicuously labelled as review data and excluded from the normal empty-stock instance.
- Improve only the copy and composition of the existing Nosotros and Financiación y permutas sections using confirmed facts.

## Acceptance

- Mobile hero, black bridge, subtle curve, and catalog have no visible background gap across viewport-height changes; reverse scroll, reload, reduced motion, and desktop remain functional.
- Demo catalog contains available and reserved units with mixed image ratios and no card prices; sold units remain excluded. Demo detail has a working gallery and price only there. All records/media are marked as development-only.
- Nosotros supports a future real-photo swap without layout redesign; no invented history or commercial terms. Financing text explains options while leaving terms unasserted.
- Vite build, PHP parse, local browser checks at 375/390/430 and desktop, keyboard and overflow pass. No deployment.

## Boundaries

- No backend schema or CPT changes, no Three.js, no Blender/video edits, no new visual identity.
- Preserve previous untracked Vercel preview artifacts and tooling.

## Completion evidence

- Mobile stage uses `100dvh` when supported, retaining the existing `100svh` fallback. Height-only browser-chrome changes no longer trigger a compensating `scrollTo`; width/orientation changes still preserve the camera pose.
- The demo lives only in an isolated local Playground instance on port 9470. Its fixture media are outside the theme; the theme zip was checked to exclude them.
- Build and package passed; the Vite manifest and current-owner institutional photo are present in the installable theme zip.
- `tools/local-demo-qa.mjs`: 81 checks passed at desktop and 375/390/430 mobile emulation. `tools/hero-lifecycle-qa.mjs`: 22 checks passed. The original phone's Safari/Chrome UI behavior still needs a physical-device confirmation.
