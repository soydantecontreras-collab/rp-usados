# Pipeline

Load Downloads/RP_Usados_Hero_Mobile_v4.blend with automatic script execution
disabled. Textures are packed. Preserve Cycles 64 samples, denoising, adaptive
threshold, AgX/look/exposure, camera, lights, materials and animation. Use the
available GPU for compute only. Change output resolution and format only in
memory; render RGB PNG frames 1–144. Never save the original scene.

Encode frames with libx264 slow, High/yuv420p, CRF 18, GOP 4, no B-frames/audio,
faststart. Extract first decoded encoded frame as the versioned mobile poster.
Replace mobile asset references and intrinsic poster dimensions only. Existing
scroll controller maps 0–1 to every frame 0–143, with no hold or mask. Overscan,
stable copy/CTA, native scroll, black bridge and subtle curve are unchanged.
