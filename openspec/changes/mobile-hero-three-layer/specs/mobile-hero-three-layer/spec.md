## ADDED Requirements

### Requirement: Independent local full-page comparison
The experiment SHALL provide current and proposed standalone document routes
while preserving approved production and media assets.

#### Scenario: User opens each route
- **WHEN** a route loads
- **THEN** header, hero and following section are direct document content
- **AND** no iframe, nested scroll panel or layout selector exists.

### Requirement: Stable separate media and overlay
The proposed route SHALL reveal more of a stable maximum media canvas when the
visible viewport expands without repositioning image, title or CTA.

#### Scenario: Viewport expands 16 or 72 pixels
- **GIVEN** a fixed width and captured small/maximum viewport
- **WHEN** visible height increases by 16 or 72 pixels
- **THEN** facade and CTA screen coordinates remain unchanged
- **AND** visible media extends to the dynamic wrapper bottom with no coverage gap.

### Requirement: Comparable evidence
The experiment SHALL report coverage, movement and source crop for both routes.

#### Scenario: Local measurement
- **WHEN** initial and expanded states are inspected at 375, 390 and 430 pixels
- **THEN** evidence distinguishes empty CSS coverage from dark media pixels
- **AND** forward/reverse scroll and poster-to-video remain the approved behavior.

