import { expect, test } from '@playwright/test';

test.describe('Creator golden journey', () => {
  test('authors a Guide with a branch, an exclusion, and an unlisted link', async ({ page }) => {
    await page.goto('/create', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('roadmap-screen')).toBeVisible();

    // 1. Start a Guide on the DJ/VJ Path
    await page.getByTestId('start-djvj').click();
    await expect(page.getByTestId('not-publishable')).toBeVisible();

    // 2. Say who it is for
    await page.getByTestId('persona-title').fill('Club-first, my way');
    await page.getByTestId('persona-audience').fill('People near a city with open-decks nights');
    await page.getByTestId('persona-startingPoint').fill('A laptop and headphones');
    await page.getByTestId('persona-outcome').fill('A ten-minute set on club gear');

    // 3. Place shared Nodes — reuse, not reinvention
    await page.getByTestId('node-search').fill('rhythm');
    await page.getByTestId('place-rhythm-song-structure').click();
    await page.getByTestId('node-search').fill('mixing technique');
    await page.getByTestId('place-mixing-technique').click();
    await page.getByTestId('node-search').fill('harmonic');
    await page.getByTestId('place-harmonic-mixing').click();
    await expect(page.locator('[data-testid^="route-step-"]')).toHaveCount(3);

    // 4. Roles: a checkpoint, and an alternative on a branch
    const steps = page.locator('[data-testid^="route-step-"]');
    const secondId = (await steps.nth(1).getAttribute('data-testid'))?.replace('route-step-', '') ?? '';
    const thirdId = (await steps.nth(2).getAttribute('data-testid'))?.replace('route-step-', '') ?? '';
    await page.getByTestId(`role-${secondId}-checkpoint`).click();
    await page.getByTestId(`connect-alt-${thirdId}`).click();
    await expect(page.getByTestId(`branch-${thirdId}`)).toBeVisible();

    // 5. State what the route leaves out, and why
    await page.getByTestId('exclude-music-theory-fundamentals').click();
    await page.getByTestId('exclusion-reason').fill('Phrasing is the only theory this route needs.');
    await page.getByTestId('save-exclusion').click();
    await expect(page.getByTestId('stance-music-theory-fundamentals')).toBeVisible();

    // 6. Propose a concept the shared Universe is missing
    await page.getByTestId('toggle-propose').click();
    await page.getByTestId('proposal-title').fill('Open-decks etiquette');
    await page.getByTestId('proposal-description').fill('Sign-up norms, and staying for other people.');
    await page.getByTestId('submit-proposal').click();
    await expect(page.locator('[data-testid^="route-step-"]')).toHaveCount(4);

    // 7. The route is sound, so an unlisted link becomes available
    await expect(page.getByTestId('builder-clean')).toBeVisible();
    await expect(page.getByTestId('builder-issue')).toHaveCount(0);
    await page.getByTestId('toggle-unlisted').click();
    await expect(page.getByTestId('unlisted-banner')).toBeVisible();

    // 8. Preview it the way an Explorer would read it
    await page.getByTestId('preview-draft').click();
    await expect(page.getByTestId('preview-visibility')).toContainText('UNLISTED');
    await expect(page.getByTestId('preview-stance')).toContainText('Phrasing is the only theory');
    await expect(page.locator('[data-testid^="preview-step-"]')).toHaveCount(4);
  });

  test('a draft survives a reload', async ({ page }) => {
    await page.goto('/create', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('start-bouldering').click();
    await page.getByTestId('persona-title').fill('Gym-first, honestly');
    await page.getByTestId('node-search').fill('falling');
    await page.getByTestId('place-falling-safely').click();
    await expect(page.locator('[data-testid^="route-step-"]')).toHaveCount(1);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid^="route-step-"]')).toHaveCount(1);
    await expect(page.getByTestId('persona-title')).toHaveValue('Gym-first, honestly');
  });
});
