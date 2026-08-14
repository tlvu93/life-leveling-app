// Captures deterministic Atlas screenshots for the visual-verification loop.
// Usage: node scripts/capture-atlas.mjs [--base http://127.0.0.1:8085] [--out .tmp/atlas-shots]
//   --base  Dev server (npm run web -> :8085, fast iteration with HMR) or the
//           static export server (npm run serve:web:test -> :8084, final check).
// Seeds the same active-journey state the e2e suite uses, then loads the Atlas
// with ?showcase=1&static=1 (all nodes visible, animations pinned, fit-world
// camera) and emits full.png + every crop from atlas-crops.mjs, plus
// full-night.png for the night theme sanity check.
import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CROPS, VIEWPORT } from './atlas-crops.mjs';

const args = process.argv.slice(2);
function argValue(flag, fallback) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = argValue('--base', 'http://127.0.0.1:8085').replace(/\/$/, '');
const outDir = path.resolve(root, argValue('--out', path.join('.tmp', 'atlas-shots')));
const fixtures = JSON.parse(await readFile(path.join(root, 'e2e', 'fixtures', 'journey-states.json'), 'utf8'));

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
await context.addInitScript(({ key, value }) => {
  if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value));
}, { key: fixtures.storageKey, value: fixtures.active });

async function capture(query, outName, withCrops) {
  const page = await context.newPage();
  try {
    await page.goto(`${base}/?${query}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  } catch (error) {
    console.error(`Could not reach ${base} - start the app first ("npm run web" for :8085 or "npm run serve:web:test" for :8084).`);
    throw error;
  }
  await page.getByTestId('atlas-scene').waitFor({ timeout: 120_000 });
  // A painted universe produces a large canvas data URL; a blank canvas does not.
  await page.waitForFunction(() => {
    const canvas = document.querySelector('canvas');
    return Boolean(canvas && canvas.toDataURL().length > 20_000);
  }, undefined, { timeout: 120_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(outDir, `${outName}.png`) });
  if (withCrops) {
    for (const [name, clip] of Object.entries(CROPS)) {
      await page.screenshot({ path: path.join(outDir, `${name}.png`), clip });
    }
  }
  await page.close();
  console.log(`Captured ${outName}${withCrops ? ` + ${Object.keys(CROPS).length} crops` : ''}`);
}

await capture('showcase=1&static=1&theme=living', 'full', true);
await capture('showcase=1&static=1&theme=night', 'full-night', false);
await browser.close();
console.log(`Done -> ${outDir}`);
