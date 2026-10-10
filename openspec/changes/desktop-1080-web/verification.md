# Local verification — 2026-10-09

- External source verification repeated: 144 contiguous PNGs, all 1920x1080, complete decoder passed, provenance hashes unchanged; first/last inspected during sequence delivery. No PNGs copied into Git or moved/deleted.
- Regenerated only existing doorway/door mattes in isolated Blender processes, resolution/subframe alignment updated. Both completed 144 frames. No source blend saved.
- Delivered `theme/rp-usados/assets/hero/v2/hero-desktop-1080-crf18.mp4`: H264 High, yuv420p progressive, 1920x1080 SAR1:1, 48 fps, 144 decoded frames, exactly 3s, 6697013 bytes, ~17.86 Mbps. CRF18/slow/GOP4/no B-frames/audio, moov before mdat.
- MP4 native timing confirmed: mdhd timescale12288/duration36864 =3, stts144 samples at delta256 =48fps.
- Poster extracted from delivered frame0; decoded RGB comparison is pixel-identical, 1920x1080.
- Treatment at frames35,65,100,115: interior meanRGB7.84..8.00, doors36.43..85.50, separation>15. Final encoded maxRGB10. Existing color management, #080809 and fade2.55..2.90 preserved.
- SHA-256 checks prove mobile MP4/poster, all hero JS and styles unchanged from preflight. No scroll mapping, header, other sections or backend logic edited.
- Production changes only desktop asset reference/dimensions in `template-parts/home/hero.php` and desktop poster preload literal in `inc/frontend.php`; old provisional assets retained but not referenced by production.
- Local Home HTTP200 contains new desktop source/preload and identical mobile source. No preview query parameters.
- Vite6.4.3 production build passed; manifest assets exist. PHP8.3 validated all26 PHP files. Restored dist/.gitkeep after Vite cleanup. git diff --check passed.
- Existing unrelated working changes preserved. No general/browser QA, static export, deployment, commit or push. Runtime reports/scripts/intermediates remain ignored under tools/.preview/desktop-1080-real-subframes.
