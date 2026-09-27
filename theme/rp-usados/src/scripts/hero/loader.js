import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { disposeModel } from './resources.js';

export async function loadHeroAssets(base, signal, diagnostics) {
  const start = performance.now();
  const request = async (file, type = 'arrayBuffer') => {
    const response = await fetch(new URL(file, base), { signal, credentials: 'same-origin' });
    if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
    return response[type]();
  };
  const [buffer, metadata, hdrBuffer] = await Promise.all([
    request('hero.glb'), request('scene.json', 'json'), request('environment.hdr'),
  ]);
  signal.throwIfAborted();
  diagnostics.fetchMs = performance.now() - start;
  diagnostics.glbBytes = buffer.byteLength;
  diagnostics.environmentBytes = hdrBuffer.byteLength;
  const gltf = await new GLTFLoader().parseAsync(buffer, base);
  try {
    signal.throwIfAborted();
    const hdr = new HDRLoader().parse(hdrBuffer);
    diagnostics.parseMs = performance.now() - start - diagnostics.fetchMs;
    return { gltf, metadata, hdr };
  } catch (error) { disposeModel(gltf.scene); throw error; }
}
