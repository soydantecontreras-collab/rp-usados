# Offline rendering

Use a separate background Blender 5.2.1 process. Original source timeline is 1..72 at 24 fps; 72 inclusive frame periods represent 3 seconds. Sample at t=i/48, with original frame=1+24*t: 1,1.5,...72.5. The last sample is at 2.979167 s and has a 1/48 s display period. The half-frame after 72 is evaluated by Blender using original animation extrapolation, without editing keys. This follows the requested exact temporal cadence; the historical V2 script instead fitted both endpoints using 1+i*71/143.

Keep camera, objects, materials, lighting, color management, samples, denoising and source FPS. Only output resolution/percentage/PNG encoding and GPU execution/persistent data change in the disposable process. Never save the blend. Write sequence and provenance report outside the repository, refuse existing target directory. Validate count, PNG headers and complete decoding, continuity, first/last and unchanged source hash.
