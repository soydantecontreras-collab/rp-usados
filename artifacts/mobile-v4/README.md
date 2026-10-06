# Native mobile v4 / 1080×1920 testing preview

Source commit: `fa10543d0d13e757cae411a9360c0f4525e1f9c8`.
Preview: https://vercel-testing-460b176-r2-vwbphlv3j-dante42.vercel.app/
Deployment: `dpl_Ajx9AUQKiAWNxFUUgpkonrMPEZjr`, READY, preview target null.
Production target was verified unchanged. Fresh static export:
`tools/.preview/vercel-mobile-v4-1080-20261006`, 11 routes, explicit DEMO stock.

## Source and encoding

The user approved generating the missing render from the v4 blend at the
requested output resolution. All 144 PNG frames render natively at 1080×1920;
no upscale, camera/material/light correction, crop, grade or scene save.
Original blend SHA256 unchanged:
`5ac5fb68ef188058d4d3cc1f674c72a1e5dc5d1ce91a1cd8cb90fb8fe72d8ad7`.
Original Cycles samples, denoising, compositor and color management preserved.
The native last PNG is fully black; doors are visible during the preceding
entry, not in the final frame. No web effect creates or reinterprets that result.

MP4: 5,315,275 bytes, 3 s, 48 fps, 1080×1920, ~14.174 Mbps total bitrate.
H.264 High Level 4.2 / yuv420p, CRF 18, slow, GOP 4, no B-frames or audio,
faststart. Three reference frames keep 1080×1920 / 48 fps within Level 4.2's
decoded-picture budget. Poster: 1,329,701-byte PNG from first encoded frame.

## QA

- Vite production build, manifest, installable package; PHP 8.3: 26 files.
- 23 controller assertions, including full endpoint and reverse presentation.
- Local 375/390/430: decoded 1080×1920, matching poster, no overflow,
  forward past 1.833 s and reverse to zero; reload at last frame succeeds.
- Public mobile 390: correct v4 MP4/poster, first frame and terminal source
  frame 143 at 2.979 s (+0.001 s seek offset), reload restores its presentation.
- Public native scroll reaches nine DEMO cards through the approved bridge
  and subtle curve; reverse returns to first video frame.
- Public DEMO ficha renders its existing specs/gallery structure.
- Fresh mobile navigation downloads only v4 mobile video/poster; fresh desktop
  navigation downloads only unchanged 1600×900 desktop video/poster.
- No Three.js/GLB/HDR/V1 hero resource observed; no mobile console errors.
- 79 public file-integrity/range checks passed. No debug/instrumentation added.
- JS and CSS source/bundles unchanged: overscan, copy/CTA, scroll travel and
  desktop behavior retain their approved implementation.

Physical Chrome Android toolbar/seek validation remains for the user. Viewport
emulation cannot reproduce native browser bars. No physical Safari test was
available. Existing reduced-motion/fallback behavior was preserved, not redesigned.
Masters/screenshots/network/deployment manifests are preserved in local ignored
`tools/.preview/mobile-v4-integration/`; no WordPress remote or real inventory.
