# Design

The Home query `rp_hero_preview=1` selects a separate hero template. Without it, the existing hero is retained. The remainder of the Home is unchanged. Header adjustments are scoped to this preview.

The Blender source remains untouched. A reproducible Blender script saves a separate working file and exports selected renderable geometry, the evaluated camera, existing doors, supported lights, and metadata for the original area lights. Mixed base-color nodes are baked where glTF cannot represent them. A render from the original scene supplies the fallback. The original world supplies the environment map.

Frontend ownership: lightweight eligibility/bootstrap; abortable loader; Three scene/camera; GSAP progress; transition; lifecycle/resource disposal. A single normalized progress evaluates all existing animation tracks and the provisional fade. Native scroll remains reversible. Static HTML and navigation exist before JavaScript. Mobile, reduced motion, unavailable WebGL and failed loading use the poster.

No 3D import or asset request occurs on other templates. Rendering is demand-driven, stops offscreen/hidden and resumes at current progress. Preview diagnostics are available only for explicit QA.

Vite entries use their content-hashed URL without a WordPress version query; imports back into an entry must have identical URL identity to avoid duplicate execution. The hero bootstrap is idempotent per DOM root. Both output and linear transmission shader variants are asynchronously prepared.

Known translation risks: Cycles indirect illumination, area-light shadows, AgX contrast look, transparency/refraction, emissive lighting and shader mixes. Measurements and image comparisons determine recommendations; fidelity is not assumed from a successful export.
