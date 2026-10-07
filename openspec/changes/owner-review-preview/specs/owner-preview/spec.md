## ADDED Requirements

### Requirement: Isolated owner presentation
The preview SHALL include current approved frontend, nine eligible fixture vehicles and their pages without visible development banners/text. It SHALL NOT seed real inventory or change backend, hero or design. Default DEMO snapshots SHALL retain labels.

#### Scenario: Static export
- WHEN owner mode is selected
- THEN known test labels are absent from HTML and generated placeholder graphics, reserved states remain, sold records remain excluded, and prices appear only on vehicle pages.

### Requirement: Contact and deployment integrity
The snapshot SHALL use the supplied WhatsApp recipient and contextual vehicle name/URL, a fresh committed build, and a new Vercel preview. Source/output checks SHALL exclude credentials, temporary instrumentation and V1 runtime resources.

#### Scenario: Public review
- WHEN opening Home and vehicle page on desktop/mobile
- THEN approved responsive hero/header, anchors, catalog, gallery, sections, map and contact links work without overflow; desktop/mobile select only their own media on a fresh navigation.

### Requirement: Saved checkpoint
All approved source changes SHALL be committed/pushed to main and the working tree SHALL be clean on delivery.
