## ADDED Requirements
### Requirement: Isolated stock permissions
The system SHALL provide vehicle-specific permissions and a stock-manager role without unrelated site permissions.
#### Scenario: Actor matrix
- **WHEN** anonymous, subscriber, manager and administrator attempt vehicle operations
- **THEN** anonymous/subscriber are denied; manager and administrator can manage stock; manager cannot manage posts/pages/plugins/settings/users/code.
#### Scenario: Plugin lifecycle
- **WHEN** plugin is activated, migrated or deactivated
- **THEN** administrators retain CPT access, activation is idempotent, manager writes are revoked on deactivation and no stock/users are deleted.

### Requirement: Safe stock images
The system SHALL restrict manager uploads and image associations in server-side native WordPress paths.
#### Scenario: File validation
- **WHEN** valid rasters, SVG, forged MIME, corrupt or oversized images are uploaded
- **THEN** only supported decodable JPEG/PNG/WebP within byte/dimension limits are accepted.
#### Scenario: Object authorization
- **WHEN** cover/gallery IDs or attachment parents/owners are forged
- **THEN** unrelated IDs and illegal reparenting are denied, old values preserved, administrator access retained and image count limited.

### Requirement: Malformed input preserves state
The system SHALL distinguish valid, intentional-empty and invalid metadata input.
#### Scenario: Invalid shapes and CSRF
- **WHEN** scalar arrays, invalid/nested galleries or invalid nonces are submitted
- **THEN** existing values remain; authorized valid writes and explicit clearing work.

### Requirement: Local development perimeter
The system SHALL bind development to loopback and permit LAN only by explicit configuration.
#### Scenario: Default and opt-in
- **WHEN** local launch has no LAN flag or has explicit LAN/origin flags
- **THEN** default listener is loopback and CORS restricted; LAN is possible only with opt-in.

### Requirement: Preserve approved public experience
The system SHALL preserve frontend assets, stock eligibility, price placement, gallery and WhatsApp contracts.
#### Scenario: Regression
- **WHEN** public catalog/detail and existing tests run after security changes
- **THEN** available/reserved show, sold is excluded, list prices stay absent and detail/media remain valid with unchanged public templates/assets.
