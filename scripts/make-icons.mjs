// Renders the PWA icons in public/ from public/icon.svg and public/icon-maskable.svg.
// Run with: node scripts/make-icons.mjs   (needs `npx playwright install chromium` once)
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const jobs = [
  ['public/icon.svg', 'public/icon-192.png', 192],
  ['public/icon.svg', 'public/icon-512.png', 512],
  ['public/icon.svg', 'public/apple-touch-icon.png', 180],
  ['public/icon-maskable.svg', 'public/icon-maskable-512.png', 512],
];
const browser = await chromium.launch();
for (const [src, out, size] of jobs) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const svg = readFileSync(src, 'utf8');
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.locator('svg').screenshot({ path: out, omitBackground: true });
  await page.close();
  console.log(out);
}
await browser.close();
