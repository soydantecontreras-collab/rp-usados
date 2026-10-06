# Mobile render v3 testing preview

Source commit: `496acd301f79dd5f9f5002ab4bad4624a87b8045`.
Public preview: https://vercel-testing-460b176-r2-1aitndfei-dante42.vercel.app/
Deployment: `dpl_4Mkm8z2ivYtvntQhDmnC14zKzUM4`, READY, target null.
Production target verified unchanged. Export is a fresh 11-route static DEMO
snapshot at `tools/.preview/vercel-mobile-v3-20261006`, generated after build
and source commit. No WordPress remote or real inventory.

## Verification

- Vite production build; PHP 8.3: 26 files; 23 seek ordering assertions.
- 144 frames encoded without visual filters, CRF 18 / GOP 4 / no B-frames.
- Source/web metadata, first/last frame checked; SSIM 0.995466.
- Local 375/390/430: new mobile resource, no overflow, forward past the
  former 1.833 s hold, reverse to frame zero.
- Local/public 390: frame 143 presented at 2.979 s (seek offset 0.001 s),
  reload at the end restores that frame and removes the poster correctly.
- Public native scroll continues through the curve to all nine DEMO cards;
  reverse returns to the first video frame.
- Fresh public mobile navigation downloads only v3 MP4 and v3 poster;
  fresh public desktop navigation downloads only approved desktop MP4/poster.
- Desktop source SHA256 unchanged; mobile source and Blender file unmodified.
- Public file integrity: 77 checks including MP4 range responses (206).
- No Three.js/GLB/HDR/V1 resource observed; mobile console had no errors.

The full-page physical Android/Chrome toolbar test remains for the user.
Desktop viewport emulation does not reproduce actual Chrome toolbar motion.
No Safari/iPhone physical test was available. Existing reduced-motion and
fallback behavior is preserved; this pass did not change those conditions.

Detailed browser screenshots/network and export/deployment manifests are
local ignored QA artifacts in `tools/.preview/mobile-v3-integration/`.
