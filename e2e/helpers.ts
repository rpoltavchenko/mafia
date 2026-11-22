import type { Page } from '@playwright/test';

export const THEMES = ['neon', 'sunset', 'classic'] as const;
export const SIZES = { phone: { width: 390, height: 844 }, desktop: { width: 1280, height: 800 } } as const;

/** Opens the app once with empty storage, so it saves a fresh game to build scenarios on. */
export async function freshApp(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await page.waitForFunction(() => !!localStorage.getItem('mafia-game-v1'));
}

/** Loads the worst-case scenario states from scripts/ui-audit.js (the same ones the audit uses). */
export async function scenarios(page: Page): Promise<Record<string, [unknown, string?]>> {
  await page.addScriptTag({ path: 'scripts/ui-audit.js' });
  return page.evaluate(() => {
    const w = window as unknown as { __auditScenarios: (base: unknown) => Record<string, [unknown, string?]> };
    return w.__auditScenarios(JSON.parse(localStorage.getItem('mafia-game-v1')!));
  });
}
