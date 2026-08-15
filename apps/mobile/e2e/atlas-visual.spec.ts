import { expect, test, type Page } from '@playwright/test';

import journeyStates from './fixtures/journey-states.json';

// Visual regression lock-in for the "Living Universe" atlas. These baselines
// protect the achieved look from accidental drift; mock parity itself is
// judged by the rubric loop (docs/v2/atlas-visual-rubric.md), never by these.
const VIEWPORT = { width: 1672, height: 941 };

async function openShowcase(page: Page, theme: 'living' | 'night') {
  await page.addInitScript(({ key, value }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value));
  }, { key: journeyStates.storageKey, value: journeyStates.active });
  await page.setViewportSize(VIEWPORT);
  await page.goto(`/?showcase=1&static=1&theme=${theme}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('atlas-scene')).toBeVisible();
  // Two canvases by design: the baked world canvas plus the animation overlay.
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => {
    const canvas = document.querySelector('canvas');
    return Boolean(canvas && canvas.toDataURL().length > 20_000);
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
}

test.describe('Atlas visual regression', () => {
  test('living showcase matches baseline', async ({ page }) => {
    await openShowcase(page, 'living');
    await expect(page).toHaveScreenshot('atlas-living-full.png', { maxDiffPixelRatio: 0.02 });
  });

  test('night showcase matches baseline', async ({ page }) => {
    await openShowcase(page, 'night');
    await expect(page).toHaveScreenshot('atlas-night-full.png', { maxDiffPixelRatio: 0.02 });
  });

  test('inspector panel matches baseline', async ({ page }) => {
    await openShowcase(page, 'living');
    await expect(page.getByTestId('atlas-inspector')).toHaveScreenshot('atlas-inspector.png', { maxDiffPixelRatio: 0.02 });
  });
});
