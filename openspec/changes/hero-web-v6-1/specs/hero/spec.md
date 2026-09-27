# Hero preview requirements

## Requirement: approved motion
The preview SHALL evaluate the existing camera and doors from one progress value, without new motion or a longer timeline.
### Scenario: reversible traversal
GIVEN the exported v6.1 animation WHEN scrolling forward and backward THEN the camera and doors return to their corresponding poses.

## Requirement: progressive access
The preview SHALL expose a source-rendered image, brand and catalog link before JavaScript.
### Scenario: unavailable enhancement
GIVEN mobile, reduced motion, failed WebGL or failed GLB loading WHEN opening the preview THEN content and catalog navigation remain usable and no empty loading screen is shown.

## Requirement: isolated resources
The preview SHALL request Three.js and 3D assets only for an eligible Home hero, and release or pause resources appropriately.
### Scenario: lifecycle
GIVEN a ready hero WHEN outside the viewport or the document is hidden THEN rendering stops; WHEN visible again THEN the current scroll pose renders. On disposal GPU resources and listeners are released.

## Requirement: unchanged commerce
The trial SHALL preserve existing catalog, detail, WhatsApp and price logic.
### Scenario: non-preview route
GIVEN a catalog or detail route WHEN loading the page THEN no Three.js or hero GLB is requested and its existing template behavior remains unchanged.
