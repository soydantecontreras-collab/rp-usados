# Media pipeline and presentation

Source: Downloads/render/RP_hero_mobile_v3_0001-0144.mp4, generated after
RP_Usados_Hero_Mobile_v3.blend. Existing H.264 source is already compressed;
web encoding cannot recover detail lost in that source.

Encode without image filters: libx264 slow, CRF 18, High, yuv420p, GOP 4,
scenecut 0, no B-frames, no audio, faststart. Preserve 720×1280, 48 fps and
all 144 frames. Extract poster from the resulting web file's first frame.
Version asset filenames to avoid stale browser caching.

Keep the existing presentation-gated seek controller and one latest target.
Remove the mask and its presentation callback, clamp and ResizeObserver.
The controller maps progress 0–1 to source frames 0–143; mobile stays opaque
while the new rendered black interior provides continuity into the bridge.
Desktop fade and source assets are untouched.
