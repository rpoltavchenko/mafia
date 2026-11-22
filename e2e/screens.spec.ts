import { expect, test } from '@playwright/test';
import { freshApp, scenarios, SIZES, THEMES } from './helpers';

/**
 * Screenshot baselines for the main screens in every theme, on a phone and a desktop.
 * They guard refactors that should change nothing visually (e.g. CSS clean-ups).
 * Update on purpose with: npx playwright test e2e/screens.spec.ts --update-snapshots
 */
const SCREENS = ['setup', 'assign', 'night1', 'daySpeech', 'voteVote', 'ended'];

for (const [sizeName, viewport] of Object.entries(SIZES)) {
  for (const theme of THEMES) {
    for (const screen of SCREENS) {
      test(`${screen} · ${theme} · ${sizeName}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        // The host line is picked at random and its length moves the tiles: make it repeatable
        await page.addInitScript(() => {
          let seed = 42;
          Math.random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
        });
        await freshApp(page);
        const all = await scenarios(page);
        const [state] = all[screen];
        await page.evaluate(
          ([s, t]) => {
            localStorage.setItem('mafia-game-v1', JSON.stringify(s));
            localStorage.setItem('mafia-theme', t as string);
            localStorage.setItem('mafia-lang', 'en');
          },
          [state, theme],
        );
        await page.reload();
        await page.evaluate(() => document.fonts.ready);
        await expect(page).toHaveScreenshot(`${screen}-${theme}-${sizeName}.png`, { fullPage: true, stylePath: 'e2e/screenshot.css' });
      });
    }
  }
}
