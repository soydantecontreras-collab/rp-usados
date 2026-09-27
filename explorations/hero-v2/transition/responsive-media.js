// Shared with the <picture>/preload/CSS media condition in create-pages.py.
// Coarse, non-hover devices keep the vertical asset when rotated past 900px.
export const MOBILE_QUERY = '(max-width: 899px), (hover: none) and (pointer: coarse)';
export function selectMedia(video, mobile) {
  const device = mobile ? 'mobile' : 'desktop';
  document.body.dataset.device = device;
  video.dataset.src = mobile ? video.dataset.mobileSrc : video.dataset.desktopSrc;
  return device;
}
