## Why
The owner needs touch-first stock management without navigating WordPress admin.

## What Changes
- Add private plugin-owned /gestion login, stock list and shared create/edit form.
- Add cookie-authenticated REST with explicit permissions, validation and version checks.
- Add image uploads/reordering through the existing raster policy, without physical deletion.
- Preserve CPT, metadata keys, public templates, hero assets, URLs and legacy values.

## Capabilities
- private-stock-panel: authenticated stock and media workflow with progressive enhancement.

## Impact
Only plugin modules, its isolated Vite build, security tests and documentation. No new dependencies, commit, push or deploy. Public frontend remains byte-identical.
