## Implementation
- [x] 1. Create isolated local standalone routes using approved immutable assets.
- [x] 2. Separate dynamic wrapper, stable maximum media and stable small overlay.
- [x] 3. Measure +0/+16/+72 at 375/390/430, crop, movement, native scroll and reload.
- [x] 4. Save screenshots/report; document physical-browser limitations and verify production untouched.

Evidence: explorations/hero-v2/mobile-three-layer/README.md and
tools/.preview/hero-three-layer/report.json (103 checks over browser observations).
Manual spec validation: all requirements map to documented evidence. Android
toolbar validation remains an explicit later physical test, not a local pass.
