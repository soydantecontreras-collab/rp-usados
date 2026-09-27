import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function createProgress(root, onProgress) {
  const distance = () => Math.round(Math.min(1000, Math.max(650, innerHeight * .95)));
  root.style.setProperty('--hero-scroll', `${distance()}px`);
  const trigger = ScrollTrigger.create({
    trigger: root,
    start: () => `top ${document.querySelector('.site-header').getBoundingClientRect().height}px`,
    end: () => `+=${distance()}`,
    invalidateOnRefresh: true,
    onRefreshInit: () => root.style.setProperty('--hero-scroll', `${distance()}px`),
    onUpdate: self => onProgress(self.progress),
    onRefresh: self => onProgress(self.progress),
  });
  onProgress(trigger.progress);
  return {
    refresh: () => trigger.refresh(),
    current: () => trigger.progress,
    dispose() { trigger.kill(); root.style.removeProperty('--hero-scroll'); },
  };
}
