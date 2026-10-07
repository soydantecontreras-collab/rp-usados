# Design

Reuse the isolated WordPress snapshot exporter with an opt-in owner presentation mode; default labelled DEMO exports remain unchanged. Strip only known QA banners, test title suffixes, description paragraphs and image labels in the exported HTML. Recreate the existing code-generated grid placeholders as text-free SVGs with identical dimensions/colors/grid/border, retaining genuine JPEG photos and lazy/responsive image markup. No source uploads or database edits.

Static-only contact links use the explicitly confirmed phone and a dedicated preview alias to include absolute per-vehicle URLs. The source theme/contact model remains unchanged. Report metadata outside the upload records fixture provenance, phone, source commit and mode. Preserve noindex and robots exclusion.

Build -> PHP -> source commit/push -> new empty export directory -> local output inspection -> preview target deploy -> new review alias -> public QA. Do not reuse stale output, production targets or alias the production domain. Keep operative QA reports ignored; permanent procedure and scope tracked.
