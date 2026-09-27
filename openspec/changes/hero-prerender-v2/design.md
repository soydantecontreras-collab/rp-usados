# Design

Standalone Vite preview under explorations/hero-v2, independent from the WP entry and V1 bundles. Reuse iteration-02 CSS/fonts and catalog markup without changing source. Five owners: media production, preview markup/styles, scroll/transition orchestration, seek/presentation controller, QA/server tooling.

Render approved v6_1 in a separate Blender process. Preserve scene/camera/materials/color look. Sample the same 1–72 frame trajectory into 144 frames at 48 fps (3 seconds), 1600x900, 64 samples. Source PNGs are offline intermediates, never browser frame-sequence assets. Encode two H.264 candidates with different GOPs, faststart, no audio. Extract per-encoding first-frame posters from encoded media.

Native scroll maps one progress to requested frame and transition; one seek in flight, latest target wins. Use presented-frame callbacks to gate poster handoff and measure decoder lag. Stable URLs /hero-v2/ and /hero-v2/compact/. Mobile starts with poster; a reduced video route is measured independently. HTML catalog remains reachable without JS or media.

Manual spec workflow per openspec/AGENTS.md. No extra process dependency installation required. Catalog is the approved explicit sample composition, not live inventory. Header retains original-logo pending slot and working pending-number dialog.
