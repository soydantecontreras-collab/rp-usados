/** Portable QA browser. Install with `pnpm browsers:install` from the root. */
import { chromium } from 'playwright';
export { chromium };
export function browserOptions(extra = {}) {
  const channel = process.env.RP_BROWSER_CHANNEL;
  if (channel && !['chrome', 'msedge', 'chromium'].includes(channel)) throw new Error('RP_BROWSER_CHANNEL must be chrome, msedge or chromium.');
  return { headless: true, ...(channel && channel !== 'chromium' ? { channel } : {}), ...extra };
}
