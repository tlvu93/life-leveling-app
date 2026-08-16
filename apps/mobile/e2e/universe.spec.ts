import { expect, test } from '@playwright/test';

test.describe('Universe canvas', () => {
  test('renders the shared catalog and inspects a node', async ({ page }) => {
    await page.goto('/universe', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('universe-screen')).toBeVisible();
    await expect(page.getByTestId('universe-scene')).toBeVisible();
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30_000 });

    // Tier 0 shows the major concepts; the tier label says which level this is.
    await expect(page.getByTestId('universe-tier').first()).toContainText('Regions');
    await expect(page.getByTestId('universe-node-rhythm-song-structure')).toBeVisible();

    // Selecting opens the inspector with the real node, not a placeholder.
    await page.getByTestId('universe-node-rhythm-song-structure').click();
    await expect(page.getByTestId('universe-inspector')).toBeVisible();
    await expect(page.getByTestId('inspector-title')).toHaveText('Rhythm & Song Structure');
    await expect(page.getByTestId('inspector-open-path')).toContainText('DJ/VJ');

    await page.getByTestId('inspector-close').click();
    await expect(page.getByTestId('universe-inspector')).toHaveCount(0);
  });

  test('zooming reveals denser information, not just bigger shapes', async ({ page }) => {
    await page.goto('/universe', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('universe-tier').first()).toContainText('Regions');
    await expect(page.getByTestId('universe-node-observing-a-live-set')).toHaveCount(0);

    for (let i = 0; i < 5; i += 1) {
      if ((await page.getByTestId('universe-tier').first().textContent()) === 'Concepts') break;
      await page.getByLabel('Zoom in').click();
    }
    await expect(page.getByTestId('universe-tier').first()).toContainText('Concepts');
    await expect(page.getByTestId('universe-node-observing-a-live-set')).toHaveCount(1);
  });

  test('the Universe tab reaches the canvas from Discover', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: 'Universe' }).click();
    await expect(page.getByTestId('universe-screen')).toBeVisible();
    // Never the Alpha atlas, which would bounce a roadmap user into legacy onboarding.
    await expect(page.getByTestId('atlas-screen')).toHaveCount(0);
  });
});
