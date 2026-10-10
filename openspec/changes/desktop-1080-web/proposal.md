# Desktop 1080p encode and asset substitution

Replace only provisional desktop video/poster with the verified 144-frame external 1080p sequence. Preserve approved doorway blackout, door/jamb visibility, terminal fade, native scroll mapping, mobile assets, header and all presentation. No commit, push, deployment or general QA.

Acceptance: H.264 High/yuv420p 1920x1080, 48 fps, 144 frames/3 seconds, CRF18/GOP4/no B-frames/faststart/no audio; poster decoded from delivered first frame; desktop reference/preload updated; Vite build and affected PHP valid.
