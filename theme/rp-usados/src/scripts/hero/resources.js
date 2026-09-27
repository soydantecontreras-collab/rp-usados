/** Dispose shared GPU resources once, including ImageBitmaps from GLTFLoader. */
export function disposeModel(root) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  root?.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    for (const material of [].concat(object.material || [])) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
    object.shadow?.map?.dispose();
  });
  for (const geometry of geometries) geometry.dispose();
  const images = new Set();
  for (const texture of textures) { images.add(texture.source?.data); texture.dispose(); }
  for (const material of materials) material.dispose();
  for (const image of images) image?.close?.();
}
