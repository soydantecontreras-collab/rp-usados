## ADDED Requirements

### Requirement: Full-resolution desktop media
The desktop hero SHALL use the verified external 144-frame source with H264 High/yuv420p at 1920x1080, 48 fps and exactly 3 seconds, frequent keyframes and no audio.

#### Scenario: Encoding
- WHEN desktop media is encoded
- THEN source PNGs SHALL remain intact, blackout/door preservation/fade SHALL follow the approved pipeline, and poster SHALL match delivered frame zero.

### Requirement: Desktop-only integration
The integration SHALL alter only desktop video/poster references, intrinsic desktop poster dimensions and matching desktop preload.

#### Scenario: Preserved runtime
- WHEN the new assets are selected
- THEN mobile assets, JS scroll mapping, CSS, header and all other sections SHALL remain unchanged from preflight and build/affected PHP SHALL validate.
