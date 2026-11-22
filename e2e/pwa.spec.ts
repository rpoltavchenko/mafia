import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('installable: manifest with icons, service worker registered', async ({ page }) => {
  await page.goto('/');
  const manifest = await (await page.request.get('/manifest.webmanifest')).json();
  expect(manifest).toMatchObject({ name: 'Mafia Host', short_name: 'Mafia', display: 'standalone' });
  expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  for (const icon of manifest.icons) expect((await page.request.get('/' + icon.src)).ok()).toBe(true);
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toBe('http://localhost:4173/');
});

test('works offline and keeps the saved game', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  // the first load ran before the worker controlled the page: reload so everything comes through it
  await page.reload();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.getByRole('button', { name: 'Assign roles →' }).click();
  await expect(page.getByRole('button', { name: 'Start game →' })).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start game →' })).toBeVisible();
  // self-hosted fonts come from the cache too
  expect(await page.evaluate(async () => (await document.fonts.ready, document.fonts.check('700 16px Inter')))).toBe(true);
  const offlineFailures: string[] = [];
  page.on('requestfailed', (r) => offlineFailures.push(r.url()));
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start game →' })).toBeVisible();
  expect(offlineFailures).toEqual([]);
});
