## ADDED Requirements

### Requirement: Complete verified approved frontend
The checkpoint SHALL verify the approved Home and vehicle details at desktop and mobile375/390/430 without creative edits, while preserving backend and vehicle administration.

#### Scenario: Core flows
- WHEN QA runs on isolated WordPress fixtures
- THEN native/reversible hero, selected-device media, menu/anchors, stock states, detail/gallery/lightbox, contact/map, accessibility/fallback and image loading SHALL be verified against the approved current implementation.

### Requirement: Clean reversible checkpoint
The repository SHALL contain approved web assets and useful documentation but no credentials, temporary debug pages, source PNG sequence or oversized intermediate renders.

#### Scenario: GitHub closure
- WHEN required QA and technical checks pass
- THEN approved reviewed changes SHALL be committed/pushed to main, local HEAD SHALL equal remote main and working tree SHALL be clean, with no deploy or subsequent admin changes.
