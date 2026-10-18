## ADDED Requirements
### Requirement: Preserve approved work
The workflow SHALL preserve the old panel in Git before integrating the approved rebuilt panel.
#### Scenario: Dirty desktop checkout
- **WHEN** the old panel is uncommitted
- **THEN** its non-secret sources are committed on a separate branch before switching.

### Requirement: Reproducible delivery
The project SHALL provide documented clean-clone installation, builds, tests and archives without Codex runtimes.
#### Scenario: Independent developer
- **WHEN** a developer installs the documented Node/pnpm dependencies
- **THEN** frozen installs, builds, manifests and packages can be regenerated.

### Requirement: Private cache boundary
The plugin SHALL send no-store responses for management and authenticated content.
#### Scenario: Private request
- **WHEN** management, private REST or authenticated HTML is served
- **THEN** it is not eligible for public caching and hosting bypass requirements are documented.

### Requirement: Safe stock invalidation
Stock changes SHALL invalidate WordPress object caches and expose affected public URLs after writes.
#### Scenario: Vehicle changes
- **WHEN** publication, status, data, cover or gallery changes
- **THEN** home, archive and vehicle URLs are emitted for provider integration without global flushing or external credentials.

### Requirement: Staging candidate only
The release SHALL remain explicitly a staging candidate with no invented production data.
#### Scenario: Candidate publication
- **WHEN** all code checks pass
- **THEN** main and an annotated candidate tag are pushed, and missing hosting/stock/device/SMTP gates remain explicit.
