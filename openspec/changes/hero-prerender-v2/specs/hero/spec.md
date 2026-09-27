# ADDED requirements

## Requirement: Independent identity
V2 SHALL load at a stable path and SHALL NOT request V1 assets or backend mutations.
### Scenario: Reload or navigate home
V2 keeps its own header, poster and restored scroll state; no legacy hero is returned.

## Requirement: Faithful media
Both encodings SHALL derive from the approved Blender source and share timing/crop/color. Each poster SHALL be decoded from its encoding's first frame.
### Scenario: First presentation
Poster remains until the current requested frame is presented, without auto playback.

## Requirement: Reversible latest-target control
One progress SHALL determine video time and UI transition, without intercepting scrolling.
### Scenario: Fast direction reversal
An outstanding seek may complete, but obsolete queued targets are discarded in favor of the newest target.

## Requirement: Progressive UI
Approved catalog and Ver vehículos SHALL remain usable with media/network/JS failure and reduced motion.
### Scenario: Mobile or unavailable video
The coherent poster and normal HTML catalog remain available; reduced candidate is evaluated separately.

## Requirement: Evidence
Delivery SHALL include two encoding measurements and browser evidence, distinguishing simulations from real Safari/iPhone testing.
