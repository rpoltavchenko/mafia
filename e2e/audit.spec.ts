import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { freshApp } from './helpers';

test('colour contrast passes WCAG AA in every theme × phase', async ({ page }) => {
  await freshApp(page);
  const lines = (await page.evaluate(readFileSync('scripts/check-contrast.js', 'utf8'))) as string[];
  expect(lines).toHaveLength(12);
  expect(lines.filter((l) => !l.endsWith('all pass'))).toEqual([]);
});

test('no text overflows and no page scrolls sideways', async ({ page }) => {
  test.setTimeout(10 * 60_000);
  await freshApp(page);
  await page.addScriptTag({ path: 'scripts/ui-audit.js' });
  const issues = await page.evaluate(() =>
    (window as unknown as { __auditRun: (o: object) => Promise<unknown[]> }).__auditRun({
      sizes: [
        [1280, 800],
        [390, 844],
      ],
      langs: ['en', 'uk'],
      themes: ['neon', 'sunset', 'classic'],
    }),
  );
  expect(issues).toEqual([]);
  // every combination really ran (2 sizes × 2 languages × 3 themes × each scenario)
  const audit = await page.evaluate(() => (window as unknown as { __audit: { n: number; total: number } }).__audit);
  expect(audit.n).toBe(audit.total);
  expect(audit.total).toBeGreaterThanOrEqual(12 * 15);
});
