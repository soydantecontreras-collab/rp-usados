export function fitCamera(camera, source, width, height) {
  // Match the source frame with cover cropping, including Blender's lens shift.
  const aspect = source.aspect;
  const fullWidth = Math.max(width, height * aspect);
  const fullHeight = fullWidth / aspect;
  camera.fov = 2 * Math.atan(source.sensorWidth / aspect / (2 * source.lens)) * 180 / Math.PI;
  camera.setViewOffset(fullWidth, fullHeight,
    (fullWidth - width) / 2 - source.shiftX * fullWidth,
    (fullHeight - height) / 2 - source.shiftY * fullWidth, width, height);
  camera.updateProjectionMatrix();
}
