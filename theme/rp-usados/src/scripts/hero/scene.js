import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { fitCamera } from './camera.js';
import { disposeModel } from './resources.js';

export function createScene(host, assets, diagnostics) {
  const { gltf, hdr, metadata } = assets;
  const camera = gltf.cameras.find(c => c.name === metadata.camera.name) || gltf.cameras[0];
  const duration = Math.max(...gltf.animations.map(clip => clip.duration));
  if (!camera || !Number.isFinite(duration) || !duration) {
    disposeModel(gltf.scene);
    throw new Error('Export must contain a camera and animation');
  }
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (error) { disposeModel(gltf.scene); throw error; }
  const scene = new THREE.Scene();
  scene.add(gltf.scene);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 2 ** metadata.colorManagement.exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  // Physical transmission is retained; a reduced internal buffer limits its cost.
  renderer.transmissionResolutionScale = .5;
  const environment = new THREE.DataTexture(hdr.data, hdr.width, hdr.height, hdr.format, hdr.type);
  environment.mapping = THREE.EquirectangularReflectionMapping;
  environment.colorSpace = THREE.LinearSRGBColorSpace;
  environment.flipY = true;
  environment.minFilter = THREE.LinearFilter;
  environment.magFilter = THREE.LinearFilter;
  environment.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTarget = pmrem.fromEquirectangular(environment);
  pmrem.dispose();
  scene.background = environment;
  scene.environment = envTarget.texture;
  RectAreaLightUniformsLib.init();
  const conversion = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
  for (const source of metadata.areaLights) {
    const light = new THREE.RectAreaLight(new THREE.Color(...source.color), 1, source.width, source.height);
    light.name = source.name;
    // Blender radiometric source units, matching the normalization below.
    light.power = source.powerWatts * (source.normalize ? 1 : source.width * source.height);
    const matrix = new THREE.Matrix4().fromArray(source.matrix).transpose().premultiply(conversion);
    matrix.decompose(light.position, light.quaternion, light.scale);
    scene.add(light);
  }
  const shadowNames = /Spill_Puerta|Calle_por_Vidriera_Avenida|Farol_Calle|Aplique_Ochava/;
  let shadowCount = 0;
  gltf.scene.traverse(object => {
    if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; }
    if (object.isLight) {
      // glTF SPEC exporter multiplies Blender watts by 683; normalize into the
      // same radiometric convention as the baked world and source emission maps.
      object.intensity /= 683;
      if (object.isSpotLight && shadowNames.test(object.name) && shadowCount < 4) {
        object.castShadow = true; shadowCount++;
        object.shadow.mapSize.set(1024, 1024);
        object.shadow.bias = -.0001;
        object.shadow.normalBias = .015;
        object.shadow.camera.near = .05;
      }
    }
  });
  const mixer = new THREE.AnimationMixer(gltf.scene);
  // All clips, should an exporter split tracks, share the same time and zero.
  for (const clip of gltf.animations) {
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.play();
  }
  host.append(renderer.domElement);
  const gl = renderer.getContext();
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  Object.assign(diagnostics, {
    duration, clips: gltf.animations.map(c => ({ name: c.name, duration: c.duration, tracks: c.tracks.length })),
    gpu: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    sourceCamera: metadata.camera, shadowLights: shadowCount, renderSamples: [],
  });
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height, false);
    fitCamera(camera, metadata.camera, width, height);
    diagnostics.viewport = { width, height, pixelRatio: renderer.getPixelRatio() };
  }
  function render(progress) {
    const start = performance.now();
    // Avoid exact clip end clamping a reversible action permanently.
    mixer.setTime(Math.min(duration - 1e-6, duration * progress));
    scene.updateMatrixWorld(true);
    renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    diagnostics.programsAfterRender = renderer.info.programs.length;
    diagnostics.frames++;
    diagnostics.renderSamples.push(performance.now() - start);
    if (diagnostics.renderSamples.length > 400) diagnostics.renderSamples.shift();
    Object.assign(diagnostics, {
      rendererMemory: { ...renderer.info.memory }, drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles, cameraPosition: camera.getWorldPosition(new THREE.Vector3()).toArray(),
    });
  }
  resize();
  return { renderer, render, resize,
    async prepare() {
      // Glass renders opaque geometry into a linear transmission buffer, while
      // the visible pass uses AgX/sRGB. Precompile BOTH variants asynchronously.
      const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
      const toneMapping = renderer.toneMapping;
      const glass = new Set();
      scene.traverse(object => {
        for (const material of [].concat(object.material || [])) {
          if (material.transmission > 0 && material.side === THREE.DoubleSide) glass.add(material);
        }
      });
      try {
        await renderer.compileAsync(scene, camera);
        renderer.setRenderTarget(target);
        renderer.toneMapping = THREE.NoToneMapping;
        await renderer.compileAsync(scene, camera);
        for (const material of glass) { material.side = THREE.BackSide; material.needsUpdate = true; }
        await renderer.compileAsync(scene, camera);
      } finally {
        for (const material of glass) { material.side = THREE.DoubleSide; material.needsUpdate = true; }
        renderer.toneMapping = toneMapping;
        renderer.setRenderTarget(null);
        target.dispose();
        diagnostics.precompiledPrograms = renderer.info.programs.length;
      }
    },
    dispose() {
      mixer.stopAllAction(); mixer.uncacheRoot(gltf.scene);
      disposeModel(scene); environment.dispose(); envTarget.dispose();
      renderer.renderLists.dispose(); renderer.dispose(); renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
