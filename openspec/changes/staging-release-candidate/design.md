## Context
Base main 47e96a9; approved rebuilt panel 30b39bf; old uncommitted panel preserved
as 44932e7 on gestion-original-desktop. Root openspec/AGENTS.md selects manual Spec.

## Goals / Non-Goals
One staging-ready codebase with independently runnable development and release tools.
Do not promise production certification without hosting, SMTP, device and restore tests.
No redesign, model migration, production deployment or real account/stock creation.

## Decisions
- Fast-forward main to approved rebuild after preservation and functional review.
- Carry only objective improvements: atomic login limiting, manager wp-admin redirect,
  password recovery, missing-dependency fail-closed and data-preserving error paths.
- Keep public source unchanged except packaging scripts; provider-independent cache
  behavior resides in the plugin, not frontend templates.
- Private routes and authenticated responses are no-store; infrastructure must also
  bypass early page caches. Stock mutations queue object-cache cleanup and a
  documented URL invalidation action after writes complete. No global cache flush.
- Node/pnpm pinned, independent frozen lockfiles; local Playwright and disposable
  WordPress fixtures rather than Codex-specific runtime paths.
- CI distinguishes deterministic code/package checks from browser/hosting gates.
- Archives are regenerated from allowlists, with no fixtures/secrets/authoring files.
- Tag v1.0.0-rc1 means code ready for staging, not authorization for production.

## Architecture / Flow
Preserve -> compare -> integrate -> targeted security/cache changes -> portable
automation/docs -> real-path regression -> packages -> clean-clone verification ->
commit/push/tag -> verify remote refs and stop.

## Data or API Changes
No new business fields. Add cache integration action only; existing private APIs
and native WordPress auth remain authoritative.

## Risks / Trade-offs
WordPress WASM/SQLite tests do not establish host MySQL/InnoDB behavior, SMTP,
CDN correctness, physical mobile chrome or safe-area behavior. Those are explicit
staging gates. No automatic lock stealing or destructive upload cleanup.

## Alternatives Considered
Merging both panel trees would duplicate responsibilities. Shipping only docs
would leave portability failures. Provider-specific purge code without a selected
host would invent infrastructure and is therefore excluded.
