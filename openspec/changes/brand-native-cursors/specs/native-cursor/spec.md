## ADDED Requirements

### Requirement: Conventional static brand cursor
The desktop interface SHALL use a conventional RP-red/black arrow and hand through CSS with exact hotspots and immediate native terminal fallbacks.
#### Scenario: Mouse across contexts
Given hover/fine pointer, backgrounds display arrow and enabled interactive elements display hand; clicks target their normal coordinates. No pointer-tracking JS or extra effects are installed. Card B stays unchanged.
#### Scenario: Text/disabled controls
Text-entry controls retain text cursor and disabled controls retain unavailable feedback.

### Requirement: Progressive desktop-only assets
Cursor media SHALL remain external, apply only to hover/fine mouse and require no JavaScript.
#### Scenario: Touch
The media query is false and no CUR/PNG cursor resource is requested.
#### Scenario: Failure
If assets fail or custom cursor URLs are unsupported, terminal auto/pointer values preserve native cursor. JavaScript disabled does not affect cursor CSS or links.
