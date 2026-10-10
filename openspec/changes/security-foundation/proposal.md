## Why
The approved security audit found shared post capabilities, unrestricted Media policy and malformed input deletion. A future private stock panel needs server-side isolation before any UI or new write endpoint exists.

## What Changes
- From generic post capabilities to vehicle-specific capabilities and a minimal stock-manager role. Administrators retain full access.
- From an image-only picker to role-scoped raster upload and attachment authorization in WordPress native paths.
- From malformed fields potentially clearing metadata to rejecting malformed payloads and preserving old values.
- From externally bound development servers to loopback by default, with explicit LAN opt-in.
- Compatible dependency patches only; no audit-silencing overrides.

## Capabilities
### New Capabilities
- `stock-security`: permissions, media policy, validation and lifecycle safeguards.

## Impact
Plugin `plugins/rp-usados-security`, theme CPT/data/admin adapters, local launch/configuration, dependency locks and isolated integration tests. No public templates, creative assets, data schema changes, new gestion UI, new REST endpoints, deployment or Git publication.

## Acceptance
Real WordPress tests SHALL deny writes/uploads for anonymous/subscriber; allow vehicle management for the stock manager without other site administration; preserve administrator access; reject invalid nonce/types/MIME/foreign objects; preserve public catalog/detail contracts. Build, PHP, existing tests and audits must pass.
