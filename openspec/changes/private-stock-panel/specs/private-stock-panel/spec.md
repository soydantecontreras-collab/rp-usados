## ADDED Requirements
### Requirement: Authenticated private management
The panel SHALL use native WordPress authentication and permit only authorized managers/administrators.
#### Scenario: Unauthorized visitor
- WHEN anonymous/subscriber requests private data or mutation
- THEN access is refused, with no private data exposed.
#### Scenario: Login and logout
- WHEN a valid CSRF-protected credential POST succeeds
- THEN WordPress cookies grant capabilities-based access and logout invalidates the session.
### Requirement: Consistent vehicle persistence
The panel SHALL preserve original fields and slug, generate a title, validate before writes and reject concurrent changes.
#### Scenario: Invalid or stale payload
- WHEN fields are malformed, attachments unauthorized, or revision stale
- THEN existing values remain unchanged and actionable errors are returned.
#### Scenario: Draft and publication
- WHEN a unit lacks required publication fields
- THEN draft save succeeds but publication fails until brand/model/year/state/cover are supplied.
### Requirement: Safe image interaction
The panel SHALL reuse secure raster uploads, allow ordering/replacement/removal of associations and reject HEIC clearly.
#### Scenario: Remove a gallery image
- WHEN the owner removes and saves an image association
- THEN the attachment remains physically stored.
### Requirement: Accessible responsive progressive enhancement
The panel SHALL provide desktop rows, mobile touch cards/forms and native POST fallback.
#### Scenario: Mobile and no JS
- WHEN viewed at 375/390/430 or without JavaScript
- THEN core login/list/save/state/upload functions remain usable and public frontend is unchanged.
