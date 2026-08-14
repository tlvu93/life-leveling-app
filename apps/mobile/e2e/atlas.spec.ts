import { expect, test, type Locator, type Page } from '@playwright/test';

const STORAGE_KEY = 'life-leveling.alpha-1.journey.v2';
const LEGACY_STORAGE_KEY = 'life-leveling.alpha-1.journey.v1';

const onboardedJourney = {
  version: 2,
  profile: {
    completed: true,
    interests: ['music', 'technology', 'visual'],
    skills: ['starting-fresh'],
    availableTime: '2-hours',
    explorations: ['creative-hobby'],
  },
  selectedPathId: null,
  pathStartedAt: null,
  quest: {
    status: 'not-started',
    outcome: null,
    evidenceKind: 'note',
    evidence: '',
    artifact: null,
    reflection: '',
    difficulty: null,
    enjoyment: null,
    pulledIn: null,
    resolvedAt: null,
  },
  branchRecommendation: null,
  unlockedNodeIds: [],
};

const activeJourney = {
  ...onboardedJourney,
  selectedPathId: 'live-av',
  pathStartedAt: '2026-08-11T12:00:00.000Z',
  quest: { ...onboardedJourney.quest, status: 'active' },
  unlockedNodeIds: ['make-track-visible'],
};

async function seedJourney(page: Page, state: unknown = onboardedJourney) {
  await page.addInitScript(({ key, value }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value));
  }, { key: STORAGE_KEY, value: state });
}

async function writeJourney(page: Page, state: unknown) {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: STORAGE_KEY, value: state });
}

const viewports = [
  { name: 'small-phone', width: 320, height: 568 },
  { name: 'small-phone-landscape', width: 568, height: 320 },
  { name: 'phone-portrait', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

async function bounds(locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

function intersects(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

for (const viewport of viewports) {
  test(`Atlas HUD fits ${viewport.name}`, async ({ page }, testInfo) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') pageErrors.push(message.text());
    });
    await seedJourney(page);
    await page.setViewportSize(viewport);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('atlas-scene')).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });
    const canvasDataLength = await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL().length);
    expect(canvasDataLength).toBeGreaterThan(1_000);

    const header = await bounds(page.getByTestId('app-header'));
    const nav = await bounds(page.getByTestId('bottom-nav'));
    const inspector = await bounds(page.getByTestId('atlas-inspector'));
    const tools = await bounds(page.getByTestId('atlas-tool-rail'));

    for (const box of [header, nav, inspector, tools]) {
      expect(box.x).toBeGreaterThanOrEqual(-1);
      expect(box.y).toBeGreaterThanOrEqual(-1);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
    }
    expect(intersects(header, nav)).toBe(false);
    expect(intersects(header, inspector)).toBe(false);
    expect(intersects(inspector, nav)).toBe(false);
    expect(intersects(tools, inspector)).toBe(false);

    const documentSize = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      width: document.documentElement.scrollWidth,
    }));
    expect(documentSize.width).toBeLessThanOrEqual(documentSize.viewportWidth);
    expect(documentSize.height).toBeLessThanOrEqual(documentSize.viewportHeight);
    expect(pageErrors).toEqual([]);

    await page.screenshot({ path: testInfo.outputPath(`${viewport.name}.png`) });
  });
}

test('first-run journey completes a Quest and persists Atlas growth', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByText('What should your Atlas look for?', { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Music', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Technology', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Visual creativity', exact: true }).click();
  await page.getByRole('checkbox', { name: 'A creative hobby', exact: true }).click();
  await page.getByRole('button', { name: 'REVEAL MY PATHS', exact: true }).click();

  await expect(page).toHaveURL(/\/discover$/);
  await expect(page.getByText('Paths worth trying', { exact: true })).toBeVisible();
  await expect(page.getByText('WHY IT MATCHES', { exact: true })).toHaveCount(6);
  await page.getByTestId('path-card-live-av').getByRole('button', { name: 'EXPLORE THIS PATH', exact: true }).click();

  await expect(page).toHaveURL(/\/path/);
  await expect(page.getByText('Alternative branches', { exact: true })).toBeVisible();
  await expect(page.getByText('4.7 helpful', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'START THIS PATH', exact: true }).click();

  await expect(page).toHaveURL(/\/quest$/);
  await expect(page.getByText('Take it into the real world', { exact: true })).toBeVisible();
  await page.getByLabel('Quest evidence', { exact: true }).fill('Saved a 20-second clip named first-reactive-pass.mp4.');
  await page.getByLabel('Private reflection', { exact: true }).fill('The color transitions felt exciting; setup took longer than expected.');
  await page.getByLabel('difficulty 3 of 5', { exact: true }).click();
  await page.getByLabel('enjoyment 5 of 5', { exact: true }).click();
  await page.getByRole('radio', { name: 'Visual design', exact: true }).click();
  await page.getByRole('button', { name: 'COMPLETE QUEST', exact: true }).click();
  await expect(page.getByTestId('quest-resolution-dialog')).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRM COMPLETION', exact: true }).click();

  await expect(page).toHaveURL(/reveal=1/);
  await expect(page.getByTestId('atlas-reveal')).toBeVisible();
  await expect(page.getByTestId('atlas-reveal').getByText('Build a projection sketch', { exact: true })).toBeVisible();
  const persistedJourney = await page.evaluate((key) => {
    const stored = JSON.parse(localStorage.getItem(key) ?? '{}');
    return {
      version: stored.version,
      profile: stored.profile,
      selectedPathId: stored.selectedPathId,
      quest: {
        status: stored.quest?.status,
        outcome: stored.quest?.outcome,
        evidence: stored.quest?.evidence,
        reflection: stored.quest?.reflection,
        difficulty: stored.quest?.difficulty,
        enjoyment: stored.quest?.enjoyment,
        pulledIn: stored.quest?.pulledIn,
      },
      hasCamera: Object.prototype.hasOwnProperty.call(stored, 'camera'),
    };
  }, STORAGE_KEY);
  expect(persistedJourney).toEqual({
    version: 3,
    profile: {
      completed: true,
      interests: ['music', 'technology', 'visual'],
      skills: ['starting-fresh'],
      availableTime: '2-hours',
      explorations: ['creative-hobby'],
    },
    selectedPathId: 'live-av',
    quest: {
      status: 'completed',
      outcome: 'completed',
      evidence: 'Saved a 20-second clip named first-reactive-pass.mp4.',
      reflection: 'The color transitions felt exciting; setup took longer than expected.',
      difficulty: 3,
      enjoyment: 5,
      pulledIn: 'visual-design',
    },
    hasCamera: false,
  });
  await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL().length)).toBeGreaterThan(1_000);
  await page.screenshot({ path: testInfo.outputPath('atlas-growth.png') });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('atlas-scene')).toBeVisible();
  await expect(page.getByTestId('atlas-reveal')).toBeVisible();
  await page.getByRole('button', { name: 'UPDATED PATHS', exact: true }).click();
  await expect(page.getByTestId('refined-recommendation')).toBeVisible();
  await expect(page.getByTestId('refined-recommendation').getByText('Build a projection sketch', { exact: true })).toBeVisible();
});

test('Atlas controls and primary navigation work', async ({ page }) => {
  await seedJourney(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 });

  await page.getByLabel('Zoom in', { exact: true }).click();
  await page.getByLabel('Hide community route', { exact: true }).click();
  await expect(page.getByLabel('Show community route', { exact: true })).toBeVisible();
  await page.getByLabel('Close node details', { exact: true }).click();
  await expect(page.getByTestId('atlas-inspector')).toBeHidden();
  await expect(page.getByText('Details', { exact: true })).toBeVisible();
  await page.getByLabel('Show selected node details', { exact: true }).click();
  await expect(page.getByTestId('atlas-inspector')).toBeVisible();

  await page.getByRole('tab', { name: 'Discover', exact: true }).click();
  await expect(page).toHaveURL(/\/discover$/);
  await expect(page.getByText('Paths worth trying', { exact: true })).toBeVisible();
});

const supportingRoutes = [
  { path: '/discover', heading: 'Paths worth trying', state: onboardedJourney },
  { path: '/path', heading: 'Live Audiovisual Performer', state: onboardedJourney },
  { path: '/quest', heading: 'Make one track visible', state: activeJourney },
  { path: '/community', heading: 'Find a route worth trying', state: onboardedJourney },
] as const;

for (const viewport of [
  { name: 'phone', width: 390, height: 844 },
  { name: 'phone-landscape', width: 844, height: 390 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`supporting screens fit ${viewport.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await seedJourney(page, supportingRoutes[0].state);
    for (const [index, route] of supportingRoutes.entries()) {
      if (index > 0) await writeJourney(page, route.state);
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(route.heading, { exact: true })).toBeVisible();
      const header = await bounds(page.getByTestId('app-header'));
      const nav = await bounds(page.getByTestId('bottom-nav'));
      expect(intersects(header, nav)).toBe(false);
      const heading = await bounds(page.getByText(route.heading, { exact: true }));
      expect(heading.y).toBeGreaterThanOrEqual(header.y + header.height - 1);
      const documentSize = await page.evaluate(() => ({
        viewportWidth: window.innerWidth,
        width: document.documentElement.scrollWidth,
      }));
      expect(documentSize.width).toBeLessThanOrEqual(documentSize.viewportWidth);
      await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-${route.path.slice(1)}.png`) });
    }
  });
}

test('Quest draft survives a reload before completion', async ({ page }) => {
  await seedJourney(page, activeJourney);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/quest', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Quest evidence', { exact: true }).fill('Local note about the first attempt.');
  await page.getByLabel('Private reflection', { exact: true }).fill('The live controls were the strongest part.');
  await page.getByLabel('difficulty 2 of 5', { exact: true }).click();
  await page.getByLabel('enjoyment 4 of 5', { exact: true }).click();
  await page.getByRole('radio', { name: 'Live control', exact: true }).click();
  await expect(page.getByRole('button', { name: 'COMPLETE QUEST', exact: true })).toBeEnabled();
  await expect.poll(async () => page.evaluate((key) => {
    const quest = JSON.parse(localStorage.getItem(key) ?? '{}').quest;
    return JSON.stringify({ difficulty: quest?.difficulty, enjoyment: quest?.enjoyment, pulledIn: quest?.pulledIn });
  }, STORAGE_KEY)).toBe(JSON.stringify({ difficulty: 2, enjoyment: 4, pulledIn: 'live-control' }));

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('Quest evidence', { exact: true })).toHaveValue('Local note about the first attempt.');
  await expect(page.getByLabel('Private reflection', { exact: true })).toHaveValue('The live controls were the strongest part.');
  await expect(page.getByLabel('difficulty 2 of 5', { exact: true })).toBeChecked();
  await expect(page.getByLabel('enjoyment 4 of 5', { exact: true })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Live control', exact: true })).toBeChecked();
});

test('local file evidence survives reload and Start over clears the journey', async ({ page }, testInfo) => {
  await seedJourney(page, activeJourney);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/quest', { waitUntil: 'domcontentloaded' });

  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Choose a file Any locally available file', exact: true }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles('e2e/fixtures/first-reactive-pass.txt');

  await expect(page.getByTestId('quest-artifact')).toBeVisible();
  await expect(page.getByText('first-reactive-pass.txt', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('life-leveling-local-evidence', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const count = request.result.transaction('artifacts').objectStore('artifacts').count();
      count.onsuccess = () => resolve(count.result);
      count.onerror = () => reject(count.error);
    };
  }))).toBe(1);

  await page.getByLabel('Private reflection', { exact: true }).fill('The attached result reminded me that live control was fun.');
  await page.getByLabel('difficulty 2 of 5', { exact: true }).click();
  await page.getByLabel('enjoyment 5 of 5', { exact: true }).click();
  await page.getByRole('radio', { name: 'Live control', exact: true }).click();
  await expect(page.getByRole('button', { name: 'COMPLETE QUEST', exact: true })).toBeEnabled();

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('quest-artifact')).toBeVisible();
  await expect(page.getByText('first-reactive-pass.txt', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Start over', exact: true }).click();
  await expect(page.getByTestId('reset-dialog')).toBeVisible();
  await page.getByTestId('reset-dialog').screenshot({ path: testInfo.outputPath('start-over-confirmation.png') });
  await page.getByRole('button', { name: 'KEEP JOURNEY', exact: true }).click();
  await expect(page.getByTestId('reset-dialog')).toBeHidden();
  await page.getByRole('button', { name: 'Start over', exact: true }).click();
  await page.getByRole('button', { name: 'DELETE & START OVER', exact: true }).click();

  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByText('What should your Atlas look for?', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('life-leveling-local-evidence', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const count = request.result.transaction('artifacts').objectStore('artifacts').count();
      count.onsuccess = () => resolve(count.result);
      count.onerror = () => reject(count.error);
    };
  }))).toBe(0);
});

test('photo evidence can complete the local Quest without a note', async ({ page }, testInfo) => {
  await seedJourney(page, activeJourney);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/quest', { waitUntil: 'domcontentloaded' });

  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Add photo or video Choose an image or a short clip', exact: true }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles('assets/images/favicon.png');

  await expect(page.getByTestId('quest-artifact')).toBeVisible();
  await expect(page.getByText('ATTACHED IMAGE', { exact: true })).toBeVisible();
  await page.getByTestId('quest-artifact').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('photo-evidence-attached.png') });
  await page.getByLabel('Private reflection', { exact: true }).fill('The visual composition was the part I wanted to keep changing.');
  await page.getByLabel('difficulty 3 of 5', { exact: true }).click();
  await page.getByLabel('enjoyment 5 of 5', { exact: true }).click();
  await page.getByRole('radio', { name: 'Visual design', exact: true }).click();
  await expect(page.getByLabel('Quest evidence', { exact: true })).toHaveValue('');
  await expect(page.getByRole('button', { name: 'COMPLETE QUEST', exact: true })).toBeEnabled();
});

test('a non-default one-hour profile stays truthful from onboarding through Path detail', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });
  await page.getByRole('checkbox', { name: 'Music', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Technology', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Nature', exact: true }).click();
  await page.getByRole('checkbox', { name: 'A creative hobby', exact: true }).click();
  await page.getByRole('radio', { name: /1 hour/ }).click();
  await page.getByRole('button', { name: 'REVEAL MY PATHS', exact: true }).click();

  const truthfulReason = 'Music, Technology, Starting fresh, A creative hobby are the saved signals supporting this route.';
  const exactTime = 'The 60-minute first Quest uses your full selected 1 hour each week.';
  await expect(page).toHaveURL(/\/discover$/);
  await expect(page.getByText('1 hour each week · starting fresh · private experiments first', { exact: true })).toBeVisible();
  await expect(page.getByTestId('path-card-live-av')).toContainText(truthfulReason);
  await expect(page.getByTestId('path-card-live-av')).toContainText(exactTime);
  await expect(page.getByText('2 hours each week', { exact: true })).toHaveCount(0);

  await page.getByTestId('path-card-live-av').getByRole('button', { name: 'EXPLORE THIS PATH', exact: true }).click();
  await expect(page.getByTestId('path-recommendation')).toContainText(truthfulReason);
  await expect(page.getByTestId('path-recommendation')).toContainText(exactTime);
  await expect(page.getByText('2 hours each week', { exact: true })).toHaveCount(0);
});

test('Starting Fresh reaches a complete evidence-based branch without declared interests', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('checkbox', { name: 'Nothing stands out yet', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'No strengths yet', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'REVEAL MY PATHS', exact: true }).click();

  const samplerCard = page.getByTestId('path-card-curiosity-sampler');
  await expect(samplerCard).toContainText('RANK 1');
  await samplerCard.getByRole('button', { name: 'EXPLORE THIS PATH', exact: true }).click();
  await expect(page.getByTestId('path-title')).toHaveText('Starting Fresh Sampler');
  await page.getByRole('button', { name: 'START THIS PATH', exact: true }).click();
  await expect(page.getByText('Compare two tiny experiments', { exact: true })).toBeVisible();
  await page.getByLabel('Private reflection', { exact: true }).fill('Investigating a question gave me the clearest pull.');
  await page.getByLabel('difficulty 2 of 5', { exact: true }).click();
  await page.getByLabel('enjoyment 4 of 5', { exact: true }).click();
  await page.getByRole('radio', { name: 'Investigating a question', exact: true }).click();
  await page.getByRole('button', { name: 'COMPLETE QUEST', exact: true }).click();
  await page.getByRole('button', { name: 'CONFIRM COMPLETION', exact: true }).click();
  await expect(page.getByTestId('atlas-reveal')).toContainText('Follow one question and explain it simply');
});

test('Sports + Creative offers two complete routes and branches from a real attempt', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });
  await page.getByRole('checkbox', { name: 'Sports & movement', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Visual creativity', exact: true }).click();
  await page.getByRole('checkbox', { name: 'A creative hobby', exact: true }).click();
  await page.getByRole('button', { name: 'REVEAL MY PATHS', exact: true }).click();

  await expect(page.getByTestId('path-card-sports-storyteller')).toContainText('RANK 1');
  await expect(page.getByTestId('path-card-movement-maker')).toContainText('RANK 2');
  await page.getByTestId('path-card-sports-storyteller').getByRole('button', { name: 'EXPLORE THIS PATH', exact: true }).click();
  await expect(page.getByTestId('path-title')).toHaveText('Sports Storyteller');
  await page.getByRole('button', { name: 'START THIS PATH', exact: true }).click();
  await expect(page.getByText('Tell one sports moment in three frames', { exact: true })).toBeVisible();
  await page.getByLabel('Private reflection', { exact: true }).fill('Finding the turning point and explaining it was energizing.');
  await page.getByLabel('difficulty 2 of 5', { exact: true }).click();
  await page.getByLabel('enjoyment 5 of 5', { exact: true }).click();
  await page.getByRole('radio', { name: 'Finding the story', exact: true }).click();
  await page.getByRole('button', { name: 'COMPLETE QUEST', exact: true }).click();
  await page.getByRole('button', { name: 'CONFIRM COMPLETION', exact: true }).click();
  await expect(page.getByTestId('atlas-reveal')).toContainText('Narrate a 30-second sports story');
});

test('Guide discovery stops after five and private routes can become unlisted', async ({ page }, testInfo) => {
  await seedJourney(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/community', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('GUIDE 1 OF 5', { exact: true })).toBeVisible();

  const card = page.getByTestId('guide-deck-card');
  const cardBox = await bounds(card);
  await page.mouse.move(cardBox.x + cardBox.width * 0.7, cardBox.y + cardBox.height * 0.45);
  await page.mouse.down();
  await page.mouse.move(cardBox.x + cardBox.width * 0.2, cardBox.y + cardBox.height * 0.45, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByText('GUIDE 2 OF 5', { exact: true })).toBeVisible();
  for (let guideIndex = 2; guideIndex <= 5; guideIndex += 1) {
    await page.getByRole('button', { name: 'SAVE FOR LATER', exact: true }).click();
    if (guideIndex < 5) await expect(page.getByText(`GUIDE ${guideIndex + 1} OF 5`, { exact: true })).toBeVisible();
  }
  await expect(page.getByText('Guide session complete', { exact: true })).toBeVisible();
  await expect(page.getByText(/there is no next page of endless content/)).toBeVisible();

  await page.getByRole('button', { name: 'NEW PRIVATE ROUTE', exact: true }).click();
  await page.getByLabel('Route name', { exact: true }).fill('My private sports-photo route');
  await page.getByLabel('Route outcome', { exact: true }).fill('Make a three-image story from one practice.');
  await page.getByLabel('Route step 1', { exact: true }).fill('Choose one consent-safe moment');
  await page.getByLabel('Route step 2', { exact: true }).fill('Arrange three images or sketches');
  await page.getByRole('button', { name: 'SAVE PRIVATE DRAFT', exact: true }).click();
  await expect(page.getByText('My private sports-photo route', { exact: true })).toBeVisible();
  await expect(page.getByText('PRIVATE', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'MAKE UNLISTED', exact: true }).click();
  await expect(page.getByText('UNLISTED', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'SHARE LINK', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('finite-guides-and-unlisted-route.png'), fullPage: true });
});

test('a stopped Quest persists as attempted and redirects to an adjacent experiment', async ({ page }, testInfo) => {
  const chrisJourney = {
    ...activeJourney,
    profile: {
      completed: true,
      interests: ['music', 'technology', 'nature'],
      skills: ['starting-fresh'],
      availableTime: '1-hour',
      explorations: ['creative-hobby'],
    },
  };
  await seedJourney(page, chrisJourney);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/quest', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Private reflection', { exact: true }).fill('I tried it, but screen setup got in the way and none of the live parts felt right.');
  await page.getByLabel('difficulty 4 of 5', { exact: true }).click();
  await page.getByLabel('enjoyment 1 of 5', { exact: true }).click();
  await page.getByRole('radio', { name: 'None of these', exact: true }).click();
  await expect(page.getByRole('button', { name: 'I TRIED IT — NOT FOR ME', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'I TRIED IT — NOT FOR ME', exact: true }).click();
  await expect(page.getByTestId('quest-resolution-dialog')).toContainText('marked attempted, not completed');
  await page.getByRole('button', { name: 'RECORD AS ATTEMPTED', exact: true }).click();

  await expect(page).toHaveURL(/reveal=1/);
  await expect(page.getByTestId('atlas-reveal')).toContainText('ATTEMPT RECORDED');
  await expect(page.getByTestId('atlas-reveal').getByText('Make a sound-and-place notebook', { exact: true })).toBeVisible();
  await expect(page.getByTestId('atlas-reveal').getByText('Quest attempted', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Make one track visible, quest, attempted', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('stopped-quest-reveal.png') });
  await expect.poll(() => page.evaluate((key) => {
    const stored = JSON.parse(localStorage.getItem(key) ?? '{}');
    return JSON.stringify({
      version: stored.version,
      status: stored.quest?.status,
      outcome: stored.quest?.outcome,
      reflection: stored.quest?.reflection,
      difficulty: stored.quest?.difficulty,
      enjoyment: stored.quest?.enjoyment,
      pulledIn: stored.quest?.pulledIn,
      resolved: Boolean(stored.quest?.resolvedAt),
      redirected: stored.unlockedNodeIds?.includes('sound-walk-map'),
    });
  }, STORAGE_KEY)).toBe(JSON.stringify({
    version: 3,
    status: 'stopped',
    outcome: 'stopped',
    reflection: 'I tried it, but screen setup got in the way and none of the live parts felt right.',
    difficulty: 4,
    enjoyment: 1,
    pulledIn: 'none',
    resolved: true,
    redirected: true,
  }));

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('atlas-reveal')).toContainText('ATTEMPT RECORDED');
  await page.getByRole('button', { name: 'UPDATED PATHS', exact: true }).click();
  await expect(page.getByTestId('refined-recommendation')).toContainText('REDIRECTED FROM AN ATTEMPTED QUEST');
  await expect(page.getByTestId('refined-recommendation')).toContainText('Make a sound-and-place notebook');
});

test('an experienced low-difficulty profile skips the beginner rehearsal', async ({ page }, testInfo) => {
  const raviJourney = {
    ...activeJourney,
    profile: {
      completed: true,
      interests: ['music', 'technology', 'performance'],
      skills: ['music-production', 'live-performance'],
      availableTime: '5-plus-hours',
      explorations: ['career-possibility'],
    },
  };
  await seedJourney(page, raviJourney);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/quest', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Private reflection', { exact: true }).fill('The controls were familiar and I was ready to structure a longer set.');
  await page.getByLabel('difficulty 1 of 5', { exact: true }).click();
  await page.getByLabel('enjoyment 5 of 5', { exact: true }).click();
  await page.getByRole('radio', { name: 'Live control', exact: true }).click();
  await page.getByRole('button', { name: 'COMPLETE QUEST', exact: true }).click();
  await page.getByRole('button', { name: 'CONFIRM COMPLETION', exact: true }).click();

  await expect(page.getByTestId('atlas-reveal').getByText('Shape a multi-track AV rehearsal', { exact: true })).toBeVisible();
  await expect(page.getByTestId('atlas-reveal')).toContainText('5+ hours each week');
  await expect(page.getByTestId('atlas-reveal')).not.toContainText('Rehearse ten minutes of live control');
  await page.screenshot({ path: testInfo.outputPath('experienced-quest-reveal.png') });
});

const personaScenarios = [
  {
    name: 'Mara',
    profile: { completed: true, interests: ['music', 'visual', 'performance'], skills: ['starting-fresh'], availableTime: '2-hours', explorations: ['creative-hobby'] },
    liveReason: 'Music, Visual creativity, Performance, Starting fresh, A creative hobby are the saved signals supporting this route.',
    timeCopy: '2 hours each week',
    offer: 'STRONG PERSONAL FIT',
    difficulty: 3,
    enjoyment: 5,
    pull: 'Visual design',
    outcome: 'completed',
    next: 'Build a projection sketch',
  },
  {
    name: 'Leila',
    profile: { completed: true, interests: ['music', 'visual', 'community'], skills: ['visual-design'], availableTime: '3-4-hours', explorations: ['meet-people'] },
    liveReason: 'Music, Visual creativity, Visual design, A way to meet people are the saved signals supporting this route.',
    timeCopy: '3–4 hours each week',
    offer: 'PLAYABLE ALPHA BRIDGE',
    difficulty: 2,
    enjoyment: 4,
    pull: 'Visual design',
    outcome: 'completed',
    next: 'Shape a multi-track AV rehearsal',
  },
  {
    name: 'Jonas',
    profile: { completed: true, interests: ['music', 'technology', 'visual'], skills: ['coding'], availableTime: '1-hour', explorations: ['side-project'] },
    liveReason: 'Music, Technology, Visual creativity, A side project are the saved signals supporting this route.',
    timeCopy: '1 hour each week',
    offer: 'PLAYABLE ALPHA BRIDGE',
    difficulty: 3,
    enjoyment: 4,
    pull: 'System building',
    outcome: 'completed',
    next: 'Prototype a sound-reactive system',
  },
  {
    name: 'Chris',
    profile: { completed: true, interests: ['music', 'technology', 'nature'], skills: ['starting-fresh'], availableTime: '1-hour', explorations: ['creative-hobby'] },
    liveReason: 'Music, Technology, Starting fresh, A creative hobby are the saved signals supporting this route.',
    timeCopy: '1 hour each week',
    offer: 'PLAYABLE ALPHA BRIDGE',
    difficulty: 4,
    enjoyment: 1,
    pull: 'None of these',
    outcome: 'stopped',
    next: 'Make a sound-and-place notebook',
  },
  {
    name: 'Ravi',
    profile: { completed: true, interests: ['music', 'technology', 'performance'], skills: ['music-production', 'live-performance'], availableTime: '5-plus-hours', explorations: ['career-possibility'] },
    liveReason: 'Music, Technology, Performance, Music production, Live performance, A career possibility are the saved signals supporting this route.',
    timeCopy: '5+ hours each week',
    offer: 'STRONG PERSONAL FIT',
    difficulty: 1,
    enjoyment: 5,
    pull: 'Live control',
    outcome: 'completed',
    next: 'Shape a multi-track AV rehearsal',
  },
] as const;

for (const scenario of personaScenarios) {
  test(`${scenario.name} isolated persona reaches a truthful persisted next direction`, async ({ page }) => {
    await seedJourney(page, { ...onboardedJourney, profile: scenario.profile });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/discover', { waitUntil: 'domcontentloaded' });
    const liveCard = page.getByTestId('path-card-live-av');
    await expect(liveCard).toContainText(scenario.liveReason);
    await expect(liveCard).toContainText(scenario.timeCopy);
    await expect(liveCard).toContainText(scenario.offer);
    await expect(page.getByRole('button', { name: 'EXPLORE THIS PATH', exact: true })).toHaveCount(4);
    await expect(page.getByText('PREVIEW · NOT YET PLAYABLE', { exact: true })).toHaveCount(2);

    await liveCard.getByRole('button', { name: 'EXPLORE THIS PATH', exact: true }).click();
    await expect(page.getByTestId('path-recommendation')).toContainText(scenario.liveReason);
    await expect(page.getByTestId('path-recommendation')).toContainText(scenario.timeCopy);
    await page.getByRole('button', { name: 'START THIS PATH', exact: true }).click();
    await expect(page.getByText('PRIVATE · SAVED ONLY ON THIS DEVICE', { exact: true })).toBeVisible();
    await page.getByLabel('Private reflection', { exact: true }).fill(`${scenario.name} recorded what felt useful and what should change next.`);
    await page.getByLabel(`difficulty ${scenario.difficulty} of 5`, { exact: true }).click();
    await page.getByLabel(`enjoyment ${scenario.enjoyment} of 5`, { exact: true }).click();
    await page.getByRole('radio', { name: scenario.pull, exact: true }).click();

    if (scenario.outcome === 'stopped') {
      await page.getByRole('button', { name: 'I TRIED IT — NOT FOR ME', exact: true }).click();
      await page.getByRole('button', { name: 'RECORD AS ATTEMPTED', exact: true }).click();
      await expect(page.getByTestId('atlas-reveal')).toContainText('ATTEMPT RECORDED');
    } else {
      await page.getByRole('button', { name: 'COMPLETE QUEST', exact: true }).click();
      await page.getByRole('button', { name: 'CONFIRM COMPLETION', exact: true }).click();
      await expect(page.getByTestId('atlas-reveal')).toContainText('QUEST COMPLETED');
    }

    await expect(page.getByTestId('atlas-reveal')).toContainText(scenario.next);
    await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}').quest?.outcome, STORAGE_KEY)).toBe(scenario.outcome);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('atlas-reveal')).toContainText(scenario.next);
  });
}

for (const viewport of [
  { name: 'small-phone', width: 320, height: 568 },
  { name: 'small-phone-landscape', width: 568, height: 320 },
]) {
  test(`both Quest outcomes remain reachable on ${viewport.name}`, async ({ page }) => {
    const readyJourney = {
      ...activeJourney,
      quest: {
        ...activeJourney.quest,
        reflection: 'A real attempt gave me enough information to decide.',
        difficulty: 3,
        enjoyment: 3,
        pulledIn: 'none',
      },
    };
    await seedJourney(page, readyJourney);
    await page.setViewportSize(viewport);
    await page.goto('/quest', { waitUntil: 'domcontentloaded' });
    const complete = page.getByRole('button', { name: 'COMPLETE QUEST', exact: true });
    const stop = page.getByRole('button', { name: 'I TRIED IT — NOT FOR ME', exact: true });
    await stop.scrollIntoViewIfNeeded();
    const navBox = await bounds(page.getByTestId('bottom-nav'));
    const completeBox = await bounds(complete);
    const stopBox = await bounds(stop);
    expect(intersects(completeBox, navBox)).toBe(false);
    expect(intersects(stopBox, navBox)).toBe(false);
    await expect(complete).toBeEnabled();
    await expect(stop).toBeEnabled();
  });
}

test('version 1 browser state migrates to version 3 without losing the completed attempt', async ({ page }) => {
  const legacyCompleted = {
    version: 1,
    profile: onboardedJourney.profile,
    selectedPathId: 'live-av',
    pathStartedAt: '2026-08-11T12:00:00.000Z',
    quest: {
      status: 'completed', evidenceKind: 'note', evidence: 'legacy local note', artifact: null,
      reflection: 'legacy reflection', difficulty: 2, enjoyment: 5, pulledIn: 'visual-design', completedAt: '2026-08-11T13:00:00.000Z',
    },
    unlockedNodeIds: ['make-track-visible', 'projection-sketch'],
  };
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: LEGACY_STORAGE_KEY, value: legacyCompleted });
  await page.goto('/quest', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('QUEST COMPLETED · REFLECTION SAVED', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Private reflection', { exact: true })).toHaveValue('legacy reflection');
  await expect.poll(() => page.evaluate((key) => {
    const stored = JSON.parse(localStorage.getItem(key) ?? '{}');
    return JSON.stringify({ version: stored.version, outcome: stored.quest?.outcome, resolvedAt: stored.quest?.resolvedAt });
  }, STORAGE_KEY)).toBe(JSON.stringify({ version: 3, outcome: 'completed', resolvedAt: '2026-08-11T13:00:00.000Z' }));
});
