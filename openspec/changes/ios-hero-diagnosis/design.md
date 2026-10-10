## Context
Source checkpoint 7a7a4c2; deployed runtime fecec4e. Mobile captures svh/lvh before styles and sizes a dynamic dvh wrapper, top-anchored lvh media and svh copy. Portrait media uses cover; landscape uses contain.
## Goals / Non-Goals
Measure actual CSS/DOM boxes, intrinsic media, crop, safe areas and text scaling. Test WebKit plus Chromium reference. Do not apply a final fix or claim desktop WebKit emulates Safari bars/hardware.
## Decisions
Copy the fresh owner static output into a new ignored directory. Add /ios-debug/ with identical full-page Home and a fixed collapsed diagnostic control, hidden unit/safe-area probes and event-driven bounded measurements. No telemetry transmission. JSON can be downloaded explicitly. Do not reinterpret video or style the hero.
## Architecture / Flow
Generator -> isolated copy/probe -> local WebKit matrix -> public independent preview -> device evidence -> diagnosis/proposed minimal change for approval.
## Data or API Changes
None. Device measurements remain in memory/downloads and ignored QA artifacts.
## Risks / Trade-offs
Windows WebKit differs from iOS Safari, may lack H.264 and has no system safe areas/browser bars. Fixed UI probes cannot prove physical viewport values. Any heights substituted by tests are labelled sensitivity simulations.
## Alternatives Considered
UA-specific CSS/model offsets and global removal of Android overscan are rejected without evidence.
