import { expect, test } from '@playwright/test';

test.describe('Explorer golden journey', () => {
  test('interests to a shared page, without ever showing a score', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('roadmap-screen')).toBeVisible();

    // 1. Interests
    await page.getByTestId('interest-music').click();
    await page.getByTestId('interest-technology').click();

    // 2. DJ/VJ is discoverable, and stubs are visibly thin
    await expect(page.getByTestId('path-djvj')).toBeVisible();
    await expect(page.getByTestId('stub-bouldering')).toBeVisible();
    await page.getByTestId('path-djvj').click();

    // 3. Compare the two Guides
    await expect(page.getByTestId('featured-guide-club-first')).toBeVisible();
    await page.getByTestId('compare-guides').click();
    await expect(page.getByTestId('material-difference').first()).toBeVisible();
    expect(await page.getByTestId('material-difference').count()).toBeGreaterThanOrEqual(3);
    await expect(page.getByTestId('disagreement-music-theory-fundamentals')).toBeVisible();

    // 4. Adopt the club-first route. Expo Router keeps the previous screen
    // mounted, so scope to the comparison card rather than matching globally.
    await page.getByTestId('compare-head-guide-club-first').getByTestId('adopt-guide-club-first').click();
    await expect(page.getByTestId('provenance')).toContainText('Club-first');

    // 5. Remix: swap the gear-access Step for something else
    await page.locator('[data-testid^="step-"]:visible').filter({ hasText: 'Gear Access' }).first().click();
    await page.getByTestId('show-alternatives').click();
    await page.locator('[data-testid^="swap-"]:visible').first().click();
    await expect(page.locator('[data-testid^="origin-"]:visible').first()).toContainText('Replaced:');

    // 6. Record honest progress
    await page.locator('[data-testid^="step-"]:visible').first().click();
    await page.getByTestId('progress-practicing').click();
    await page.goBack();
    await expect(page.locator('[data-testid^="state-"]:visible').first()).toContainText('Practising');

    // 7. Share preview starts empty, then shows only what was picked
    await page.locator('[data-testid="open-share"]:visible').first().click();
    await expect(page.getByTestId('share-empty')).toBeVisible();
    await page.getByTestId('pick-interest-music').click();
    await expect(page.getByTestId('shared-interest-music')).toBeVisible();
    await expect(page.getByTestId('shared-interest-technology')).toHaveCount(0);
    await expect(page.getByTestId('share-audit')).toBeVisible();

    // The guardrail that stayed committed: no life-completion score anywhere.
    await expect(page.getByText(/life level|overall completion/i)).toHaveCount(0);
  });

  test('the percentage framing variant is available to moderators', async ({ page }) => {
    await page.goto('/paths/djvj?framing=percent', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('transfer-line')).toContainText('% explored');
  });
});
