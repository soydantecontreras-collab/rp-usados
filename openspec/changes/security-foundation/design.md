## Ownership and boundaries
The theme keeps CPT registration, metadata schema, native metaboxes and all public presentation. The plugin owns versioned role migration, Media authorization, existing native-route restrictions and upload limits. Future private routes are intentionally absent.

## Permissions
Use capability_type [vehiculo, vehiculos], explicit create_vehiculos and map_meta_cap. A stock manager can manage all stock (including existing vehicles authored by admin), not posts/pages/settings/users/plugins/themes. Attachment edit/delete requires manager ownership and an eligible image in the stock scope; reading/using already linked stock images is possible without transferring ownership. Administrators bypass role-specific Media restrictions. Deactivation revokes manager write/upload capabilities, leaves users/data intact and keeps admin CPT capabilities.

## Media policy
Manager uploads: JPEG/PNG/WebP; maximum 12 MiB, 6000 px each side, 24 million pixels. Decode through WordPress image editor after checking file bytes and dimensions. Up to 20 distinct images associated with a vehicle, 40 pending uploads; administrator is exempt from manager limits. New unbound images belong to their uploader; first association binds to one vehicle and the persisted binding is checked before accepting metadata. No manager reparenting of already bound images, arbitrary attachment ownership changes, SVG uploads or unfiltered_html/upload capabilities. Upload checks cover native upload and sideload hooks, JSON/raw REST upload context and native AJAX. Library queries are uploader/stock scoped; direct-ID reads are protected too, including legitimate legacy associations. These are application limits, not a transactionally enforced filesystem quota.

## Data validation
Separate validation from sanitization. Explicit empty strings/list may clear eligible metadata; arrays/objects in scalars, nested/associative galleries, invalid/non-image IDs and excessive lists reject the whole field. Native metabox validates before writes. Metadata hooks enforce attachment authorization for cover/gallery independently of UI.

## Development
Vite binds loopback unless RP_USADOS_ALLOW_LAN=1 and explicit RP_USADOS_DEV_ORIGINS is supplied. Playground CLI has no host option: a project launcher constrains the Node listener before CLI startup; tests cover actual bind addresses. Automatic admin login is disabled by default and rejected when LAN is enabled. LAN opt-in remains explicit; no vendor-file patch. Existing externally bound processes must be restarted; the isolated local demo was restarted and its loopback listener verified.

## Verification
Isolated WordPress/PHP 8.3 using Playground, real core REST controllers and native save/upload paths; tests do not mutate approved local preview data. Existing hero JS tests and public HTML contracts run too. Source assets and templates remain byte-identical to base commit.

## Tradeoffs
The theme now requires the plugin for role provisioning. No existing user is assigned the manager role automatically. Legacy images remain visible; administrator manages migration/sharing rather than silently transferring ownership. Host hardening/HTTPS/backups remain operational requirements outside this change.
