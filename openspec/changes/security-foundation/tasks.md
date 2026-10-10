- [x] Implement versioned plugin roles and custom CPT capabilities with lifecycle tests.
- [x] Implement raster upload validation and central attachment authorization on native write paths.
- [x] Reject malformed scalar/gallery input while preserving previous values.
- [x] Restrict development listener/CORS defaults and test explicit LAN opt-in.
- [x] Patch compatible dependencies and run both audits.
- [x] Add isolated real WordPress security tests and native-route checks.
- [x] Run build, PHP, existing tests and public CPT/catalog/detail regression.
- [x] Document installation, policies, results and pending hosting requirements; no commit/push.

Verification: 161 isolated WordPress checks, 18 actual HTTP/cookie/native-upload
checks, 47 public regression checks (1440/375/390/430), 3 development-perimeter
tests and 23 existing hero ordering assertions. PHP 8.3 parsed 31 files. Vite
build/manifest passed with unchanged public asset hashes. Both pnpm audits report
zero vulnerabilities. Runtime reports are ignored under tools/.preview/security*.
No /gestion UI/routes, public source changes, commit/push or deploy.
