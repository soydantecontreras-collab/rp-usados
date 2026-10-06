# Full-page maximum-height media experiment

Temporary preview, not production adoption:
https://rp-usados-hero-ab-20261006-ezoaa0uvv-dante42.vercel.app/hero-mobile-overscan/

Local: `node explorations/hero-v2/mobile-overscan-full/serve.mjs`
http://127.0.0.1:9498/hero-mobile-overscan/

Outer dynamic viewport clips media captured from CSS 100lvh. Media is top
anchored, cover in portrait. Copy/CTA are separate, captured from 100svh.
Only width/orientation changes recapture stable references. Toolbar height
changes reveal more media without re-centering. Native document scroll remains.
The existing caption shade is removed only in this experiment: it otherwise
ends at SVH and creates a tonal seam across the newly revealed pavement.
No lower fade/matte, black concealment overlay or new animation.

Video/poster bytes match the approved assets. Original theme files are unchanged.
Experimental Vite transform removes orientation scroll compensation and the
skip-link JS interception; the normal anchor remains. No touch interception.

## Simulated toolbar measurement

SVH 760, LVH 832, header 60. This is a QA simulation, not phone-specific code.
Actual overscan in the public native route is the device's LVH minus SVH.

| Width | Crop on each lateral side | Initial bottom hidden | After +72 |
| --- | --- | --- | --- |
| 375 | 6.82% | 72 CSS px / 9.33% of source height | 0 |
| 390 | 5.09% | 72 CSS px / 9.33% of source height | 0 |
| 430 | 0.49% | 72 CSS px / 9.33% of source height | 0 |

At +16 the remaining hidden canvas is 56px. Top crop is zero. Media height
stays 772px; overlay stays 700px. Image top 60px and CTA top 682px remain
unchanged: 0px displacement at both +16 and +72. Zero empty pixels below
media, both initially and at the intermediate video frame t=0.4385s.

Build passed. Tested local forward/reverse, reload at intermediate progress,
all three portrait widths, landscape recapture, no horizontal overflow, and
public video presentation/reverse/reload. The long light CATÁLOGO / TEST section
is 1460px at 390x832 in the simulated case; document height is 3234px. Native
scroll passes the hero, subtle curve and three clearly fictitious blocks.

Public HTML, viewport.css and init.js exactly match SHA-256 of the fresh export.
Deployment dpl_EUXCCksP5Bt2XMTYzsbav7Nry81T is READY, target null (preview).
The protected principal Vercel project's targets were identical before/after.
No commit, production deploy, alias change, backend or Blender edits.

Artifacts: tools/.preview/mobile-overscan-full/geometry.json,
mid-progress.json, hero-expanded.jpg, public-hero.jpg, public-content.jpg.
Export: tools/.preview/hero-overscan-full-static-20261006.
Deployment and hashes: tools/.preview/hero-overscan-full-deploy/.

Physical Android Chrome toolbar behavior remains for the user to validate.
