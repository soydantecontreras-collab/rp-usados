## Why
The approved frontend/security base and approved rebuilt stock panel need one
preserved, reproducible release candidate that can be installed without Codex.
Hosting, production credentials, the owner's account and real stock do not exist.

## What Changes
- Preserve uncommitted desktop management code as a separate Git branch before integration.
- Select rebuilt management as the base after functional comparison; retain only objective missing protections/flows from the older panel.
- Add portable development/build/validation/package commands and GitHub CI.
- Add provider-independent cache invalidation events and private-response policy.
- Produce installable archives and operational, security, stock and recovery guides.
- Publish main and an annotated staging candidate tag only after verification.

## Capabilities
### New Capabilities
- `reproducible-release`: clean-clone commands, deterministic packages, CI and handoff.
### Modified Capabilities
- `private-stock-management`: carry forward missing login protections/recovery without redesign.

## Impact
Plugin cross-cutting security/cache, tools, packaging, CI, tests and root docs.
No public creative changes, rendering, hosting purchase, DNS, real stock or deployment.

## Acceptance
Preserved Git history, verified integrated panel and unchanged public presentation;
build/PHP/JS/tests/audit/manifests/packages pass; documented manual hosting gates;
remote main equals local main and candidate tag points to it, clean working tree.
