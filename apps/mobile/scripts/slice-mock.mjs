// Slices the design mock into named crops for the visual-verification loop.
// Usage: node scripts/slice-mock.mjs [path-to-mock.png]
// Output: .tmp/mock-crops/full.png + one PNG per crop in atlas-crops.mjs.
// Rerunnable; uses only the Playwright runtime already installed for e2e.
import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CROPS, VIEWPORT } from './atlas-crops.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mockPath = path.resolve(root, process.argv[2] ?? path.join('.tmp', 'mock.png'));
const outDir = path.join(root, '.tmp', 'mock-crops');

let mockData;
try {
  mockData = await readFile(mockPath);
} catch {
  console.error(`Mock image not found at ${mockPath}`);
  process.exit(1);
}

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
await page.setContent(
  `<style>html,body{margin:0;background:#000}</style>` +
  `<img src="data:image/png;base64,${mockData.toString('base64')}" style="position:fixed;left:0;top:0;width:${VIEWPORT.width}px;height:${VIEWPORT.height}px">`,
);
await page.waitForFunction(() => {
  const img = document.querySelector('img');
  return Boolean(img && img.complete && img.naturalWidth > 0);
});

await page.screenshot({ path: path.join(outDir, 'full.png') });
for (const [name, clip] of Object.entries(CROPS)) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), clip });
}
await browser.close();
console.log(`Sliced mock into full + ${Object.keys(CROPS).length} crops at ${outDir}`);
