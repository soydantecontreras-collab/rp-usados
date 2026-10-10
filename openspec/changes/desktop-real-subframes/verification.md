# Verification — 2026-10-09

Output: `C:/Users/dante.DESKTOP/Downloads/render/RP_hero_v6_1080_final_48fps`.

- Background Blender exited 0 after 144 actual render calls, 1319.512 seconds total.
- Files `0001.png` through `0144.png`, all 1920x1080, 100% output, no missing names.
- Exact source evaluations 1,1.5,...72,72.5; source FPS remains 24, 144 output periods at 48 fps = 3 seconds.
- All PNGs passed header/end checks, provenance SHA-256 checks and full FFmpeg decoding to a null sink, without encoding any output media.
- 144 distinct PNG hashes; 142 of 143 adjacent evaluated camera matrices differ. The final half-frame uses unchanged original extrapolation after the last key; no image was copied or interpolated.
- First and last PNG visually inspected; the last is the original untreated Blender interior. Existing web/compositing blackout is outside this task and remains unchanged.
- Sequence size 339943245 bytes. External `render-report.json` records every subframe, camera matrix, timing and PNG hash; `verification.json` records completeness and preservation.
- Exact historical source is the preserved `Downloads/RP_Usados_Hero_v6_1.blend1`, hash `8b7d0887934afafeb0380e37f1358be2a7ef4c637bddc99efd0de995d0d52e9b`, matching the approved V2 report. It was never saved. The current `.blend` retained its preflight hash `6618f7c29420720bde2dffe74a712308a9b17f1306fc09d6b18534f38bf0ab81` as well.
- Every original 72-frame PNG retained its SHA-256. No source PNG or blend moved/deleted, no scene creative edits, no MP4, frontend changes, build, commit, push or deployment. PNGs remain outside the repository.
- Existing unrelated working changes preserved. `git diff --check` passed.
