## Why

Android Chrome retracts its bars during native scroll. The approved small visual
stage stays stable but exposes black space in the expanding dynamic wrapper.

## What Changes

Local full-document comparison only. Current A is preserved. Experimental B
separates dynamic clipping wrapper, stable maximum media canvas and stable small
overlay stage. No production changes or deployment are authorized.

## Capabilities

### New Capabilities
- `mobile-hero-three-layer`: isolated local viewport experiment with measurements.

### Modified Capabilities
None. Approved production is unchanged.

## Impact

Only `explorations/hero-v2/mobile-three-layer/` and this change. Reuse immutable
approved static snapshot assets/controller. No dependencies, media edits or PHP.

