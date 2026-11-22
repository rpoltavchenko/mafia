import { expect, test, type Page } from '@playwright/test';
import { freshApp } from './helpers';

/** The "Night 1 — the city falls asleep" overlay shows after each phase change; tap it away. */
async function passCurtain(page: Page) {
  const curtain = page.locator('.curtain');
  try {
    await curtain.waitFor({ state: 'visible', timeout: 1500 });
    await curtain.click();
    await curtain.waitFor({ state: 'hidden' });
  } catch {
    /* no curtain this time */
  }
}

const phase = (page: Page) => page.locator('.game-header h2');
const aliveText = (page: Page) => page.locator('.game-header .muted');
const undo = (page: Page) => page.locator('.game-header .undo-btn');

test('a game from setup to Night 1, with undo', async ({ page }) => {
  await freshApp(page);

  await page.getByRole('button', { name: 'Assign roles →' }).click();
  await page.getByRole('button', { name: 'Start game →' }).click();
  await passCurtain(page);
  await expect(phase(page)).toHaveText('Night');
  await expect(undo(page)).toBeDisabled();

  // Night 0: skip the wake-ups, then Day 0: skip to Night 1
  await page.getByRole('button', { name: '☀️ Morning →' }).click();
  await page.getByRole('button', { name: 'Yes, go to morning' }).click();
  await passCurtain(page);
  await expect(phase(page)).toHaveText('Day');
  await page.getByRole('button', { name: 'Skip to Night 1…' }).click();
  await page.getByRole('button', { name: 'Yes, go to Night 1' }).click();
  await passCurtain(page);
  await expect(phase(page)).toHaveText('Night');
  await expect(aliveText(page)).toHaveText('Round 1 · 10 alive');

  // Mafia picks the first player they're allowed to
  const victim = page.locator('.night-step').first().locator('.chip-player:not([disabled])').first();
  const victimName = (await victim.innerText()).replace(/\s+/g, ' ').trim();
  await victim.click();
  await page.getByRole('button', { name: '☀️ Morning →' }).click();
  await page.getByRole('button', { name: 'Yes, go to morning' }).click();
  await passCurtain(page);
  await expect(phase(page)).toHaveText('Day');
  await expect(aliveText(page)).toHaveText('Round 1 · 9 alive');
  await expect(page.locator('.news')).toContainText('was killed');
  await expect(page.locator('.tile.is-dead')).toHaveCount(1);

  // Undo the morning: back to Night 1 with the victim alive and the choice kept, no curtain
  await expect(undo(page)).toHaveAttribute('title', 'Undo: morning');
  await undo(page).click();
  await expect(phase(page)).toHaveText('Night');
  await expect(page.locator('.curtain')).toHaveCount(0);
  await expect(aliveText(page)).toHaveText('Round 1 · 10 alive');
  await expect(page.locator('.night-step').first().locator('.chip-player.is-selected')).toHaveText(victimName);

  // Ctrl+Z undoes the night choice
  await page.keyboard.press('Control+z');
  await expect(page.locator('.night-step').first().locator('.chip-player.is-selected')).toHaveCount(0);

  // Undo steps survive a reload
  await expect(undo(page)).toHaveAttribute('title', 'Undo: end of the day');
  await page.reload();
  await expect(phase(page)).toHaveText('Night');
  await expect(undo(page)).toHaveAttribute('title', 'Undo: end of the day');
  await undo(page).click();
  await expect(phase(page)).toHaveText('Day');
});
