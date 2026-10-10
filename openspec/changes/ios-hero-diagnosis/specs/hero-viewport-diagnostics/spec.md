## ADDED Requirements
### Requirement: Independent full-page diagnosis
Diagnostic output SHALL preserve the approved full-page hero without changing production.
#### Scenario: Open diagnostic route
- **WHEN** /ios-debug/ is opened
- **THEN** header, hero, bridge, curve and next content use normal document scrolling and original media/layout.
### Requirement: Event-driven viewport measurements
Diagnostics SHALL report units, viewport, safe areas, header/media/overlay boxes, intrinsic image/video and crop estimates on relevant events.
#### Scenario: Browser bars change
- **WHEN** scroll, resize, visualViewport resize/scroll or orientation changes
- **THEN** a bounded local history records the observed geometry, without compensatory scrolling or layout overrides.
### Requirement: Evidence boundaries
Report SHALL distinguish real measurements from emulation and hypotheses.
#### Scenario: No physical iPhone available
- **WHEN** local WebKit is tested
- **THEN** Safari toolbar and safe area behavior remains explicitly unverified until physical diagnostics are available.
