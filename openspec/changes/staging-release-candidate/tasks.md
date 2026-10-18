## 1. Preserve and integrate
- [x] Preserve old desktop panel in its own committed branch before switching.
- [x] Inspect approved rebuilt branch and fast-forward main conservatively.
- [x] Record functional comparison and integrate objective improvements with tests.
## 2. Reproducible release
- [x] Provide install, preview, build, QA, audit, clean and packaging commands.
- [x] Add CI without secrets or Codex paths and validate manifests/archives.
- [x] Add/test private caching policy and safe stock invalidation event.
## 3. Verification and handoff
- [x] Run service/security/HTTP/public/responsive regression and technical checks.
- [x] Verify clean-clone builds and installable archives; no fixtures/secrets.
- [x] Complete deploy/security/cache/backup/stock/handoff guides.
- [x] Review final scope, release notes and residual staging requirements.
## 4. Release procedure
After source validation: commit main, preserve the old source branch remotely,
push main, create/push annotated v1.0.0-rc1, verify remote/local refs and clean
working tree, then stop without deployment. The resulting hashes, CI links and
remote ref checks are execution evidence in GitHub/final delivery rather than
claims a source document can certify before its own commit is published.
