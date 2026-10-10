## ADDED Requirements

### Requirement: Real desktop temporal evaluations
The render SHALL evaluate the approved scene independently at source frame 1+i/2 for i=0..143, without duplication, optical flow, keyframe editing or source retiming.

#### Scenario: Full cadence
- GIVEN the approved 1..72 timeline at 24 fps
- WHEN the offline render runs
- THEN 144 sequential PNGs at 1920x1080/100% SHALL represent 3 seconds at 48 fps and source hash SHALL remain unchanged.

### Requirement: Scope preservation
The task SHALL leave existing PNGs, creative source, mobile, desktop web assets and integration untouched.

#### Scenario: Delivery
- WHEN the PNG sequence completes
- THEN no MP4, web build, commit, push or deployment SHALL be produced.
