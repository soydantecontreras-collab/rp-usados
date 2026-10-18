## Approved boundary
Checkpoint 47e96a9090f273026c5c7c747cfad5aad3bcd82c; implement the attached request locally.

## Ownership and relationships
- Plugin access/routes: WordPress wp_signon/cookies, guest CSRF, rate limits, private pages and non-JS forms.
- Plugin service: reuse theme validators, CPT metadata and existing media authorization; validate complete merged payload before writes and reject stale versions.
- Plugin REST: transport/schema/permission callbacks call service; no price in public auxiliary responses.
- Plugin templates/SCSS/JS: isolated assets, desktop rows/mobile cards, real upload progress and memory-only unsaved state.
- Tests: real WordPress and HTTP fixtures outside public webroot; screenshots/reports ignored.

## Data and recovery
Preserve slug on edit, legacy valid currency, WhatsApp/excerpt/featured fields not exposed by this panel. New currencies ARS/USD. Incomplete drafts allowed; publish requires brand/model/year/state/cover. Removing media means association only. HEIC remains disallowed with actionable message.
Use per-object short server lock and content-derived revision; validate all fields before persistence and restore snapshot if guarded writes fail. No autosave or persistent browser storage.

## Delivery
No JavaScript: native login, filter, save, state and image selector POST fallback. JS enhances previews, upload queue, ordering and feedback. Recovery uses native WordPress mail and must be verified on staging. No physical iPhone certification claimed.
