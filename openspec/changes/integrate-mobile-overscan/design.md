# Design and file map

Manual Spec workflow per openspec/AGENTS.md; no CLI installation necessary.
Approved direction: premium automotive, Manrope/Archivo, existing Stage 1/02.

Presentation dependencies: header.php calls hero-layout.php before paint;
front-page.php calls home/hero.php; main.scss imports production.css; main.js
loads hero-v2/main.js only on Home; main coordinates ScrollTrigger and
seek-controller.js owns actual video presentation. No persistence edits.

Direct edits (single hero presentation module):
- home/hero-layout.php: capture SVH and LVH once per width/orientation.
- home/hero.php: media canvas and stable sibling overlay; decorative aperture SVG.
- production.css: approved overscan/overlay and mobile-only aperture treatment.
- hero-v2/main.js: coordinate aperture from actual presented time and native resize.
- hero-v2/seek-controller.js: optional presentation callback, without changing seeks.

Outer DVH retains SVH fallback. Portrait cover is top-anchored to maximum
canvas; landscape preserves full vertical video with side letterbox. Remove
caption shade ending at SVH because it creates a seam on revealed media.
Desktop dimensions/appearance stay unchanged. No scroll compensation or
touch interception. Static/reduced motion retains matching poster and access.

Darkening uses source-frame aperture polygons, inside handles/leaves; SVG uses
the same cover/contain fit as video. No lower fade/full-screen black overlay.
Any last-context frame hold requires explicit user approval, since it changes
the displayed terminal portion rather than the immutable MP4.

User approved the hold during this turn. Mobile requested source time is capped
at frame 88 (1.8333s) where both leaves, frame and signage still exist. Scroll
travel is unchanged; the remaining portion retains that pose while exiting
to the existing bridge. No mobile visual opacity-zero gate at terminal progress.
