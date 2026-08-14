// Builds labeled TARGET|CURRENT side-by-side images for every crop present in
// both .tmp/mock-crops (from slice-mock.mjs) and .tmp/atlas-shots (from
// capture-atlas.mjs), plus the full-frame pair. Output: .tmp/atlas-compare/.
// Usage: node scripts/compose-compare.mjs [--shots .tmp/atlas-shots]
import { chromium } from '@playwright/test';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function dataUri(filePath) {
  return `data:image/png;base64,${(await readFile(filePath)).toString('base64')}`;
}

const args = process.argv.slice(2);
function argValue(flag, fallback) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mockDir = path.join(root, '.tmp', 'mock-crops');
const shotsDir = path.resolve(root, argValue('--shots', path.join('.tmp', 'atlas-shots')));
const outDir = path.join(root, '.tmp', 'atlas-compare');

await mkdir(outDir, { recursive: true });

const mockFiles = new Set(await readdir(mockDir));
const shotFiles = new Set(await readdir(shotsDir));
const names = [...mockFiles].filter((file) => file.endsWith('.png') && shotFiles.has(file)).map((file) => file.replace(/\.png$/, ''));

if (names.length === 0) {
  console.error('No matching crops found - run slice-mock.mjs and capture-atlas.mjs first.');
  process.exit(1);
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 2400, height: 1400 }, deviceScaleFactor: 1 });

for (const name of names) {
  const mockSrc = await dataUri(path.join(mockDir, `${name}.png`));
  const shotSrc = await dataUri(path.join(shotsDir, `${name}.png`));
  await page.setContent(`
    <style>
      html, body { margin: 0; background: #101018; color: #fff; font: 700 13px system-ui; }
      #wrap { display: inline-flex; gap: 10px; padding: 10px; }
      figure { margin: 0; }
      figcaption { padding: 4px 2px 6px; letter-spacing: 1px; }
      img { display: block; outline: 1px solid #3a3a55; }
    </style>
    <div id="wrap">
      <figure><figcaption>TARGET (mock) - ${name}</figcaption><img src="${mockSrc}"></figure>
      <figure><figcaption>CURRENT - ${name}</figcaption><img src="${shotSrc}"></figure>
    </div>`);
  await page.waitForFunction(() => [...document.querySelectorAll('img')].every((img) => img.complete && img.naturalWidth > 0));
  await page.locator('#wrap').screenshot({ path: path.join(outDir, `compare-${name}.png`) });
}

await browser.close();
console.log(`Wrote ${names.length} comparisons to ${outDir}: ${names.map((name) => `compare-${name}.png`).join(', ')}`);
