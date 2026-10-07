## ADDED Requirements

### Requirement: Three real destinations
The header SHALL show Vehículos, Nosotros and Financiación y permutas, with real Home anchors; it SHALL NOT show Ver vehículos as a header CTA. Brand/contact actions and approved hero SHALL remain unchanged.

#### Scenario: Desktop navigation
- WHEN selecting a header destination
- THEN its title is visible below the sticky header, with smooth motion only if allowed by the user's motion preference.

### Requirement: Accessible mobile disclosure
Mobile SHALL show these destinations vertically through a keyboard-operable native disclosure, without altering header height or hero framing.

#### Scenario: Progressive enhancement
- WHEN JS is unavailable
- THEN disclosure and anchors still navigate normally.
- WHEN JS is available and Escape is pressed inside the disclosure
- THEN the disclosure closes and focus returns to its summary.

### Requirement: Bounded change
The implementation SHALL NOT modify hero scripts/media/layout, backend, catalog, vehicle pages, map or WhatsApp behavior, and SHALL remain local until approved.

### Requirement: Mobile hamburger enhancement
The mobile header SHALL show a compact three-line hamburger at its right edge, without visible Menú text. With JS it SHALL be a real button with aria-expanded and aria-controls, closing on selection, repeat activation, outside click and Escape. Without JS a native hamburger disclosure SHALL remain usable. The approved desktop layout SHALL remain unchanged.

#### Scenario: Open and close mobile panel
- WHEN activating the hamburger
- THEN its three destinations appear in a legible dark dropdown without shifting header or hero, with a brief reveal only if motion is allowed.
- WHEN closing using Escape
- THEN focus returns to the toggle.
