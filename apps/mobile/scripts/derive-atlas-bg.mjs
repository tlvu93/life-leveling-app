// Derives the atlas nebula background from the design mock: crops the
// panel-free map region, stretches it to full frame, and blurs it so baked-in
// nodes/labels dissolve into pure color washes. Crisp stars are drawn
// procedurally by the Skia scene on top, so none are needed here.
// Usage: node scripts/derive-atlas-bg.mjs [path-to-mock.png]
// Output: assets/images/atlas-universe-bg.png (1672x941)
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_SIZE = { width: 1672, height: 941 };
// Panel-free region of the mock (excludes header, right panels, legend, dock).
const REGION = { x: 220, y: 64, width: 1130, height: 791 };
const OVERSCAN = 1.06; // hides transparent blur edges
const FILTER = 'blur(16px) saturate(1.18)';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mockPath = path.resolve(root, process.argv[2] ?? path.join('.tmp', 'mock.png'));
const outPath = path.join(root, 'assets', 'images', 'atlas-universe-bg.png');

const mockData = await readFile(mockPath);

const scaleX = (OUT_SIZE.width / REGION.width) * OVERSCAN;
const scaleY = (OUT_SIZE.height / REGION.height) * OVERSCAN;
const displayW = OUT_SIZE.width * scaleX;
const displayH = OUT_SIZE.height * scaleY;
const left = OUT_SIZE.width / 2 - (REGION.x + REGION.width / 2) * scaleX;
const top = OUT_SIZE.height / 2 - (REGION.y + REGION.height / 2) * scaleY;

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: OUT_SIZE, deviceScaleFactor: 1 });
await page.setContent(
  `<style>html,body{margin:0;overflow:hidden;background:#8a86c8}</style>` +
  `<img src="data:image/png;base64,${mockData.toString('base64')}" ` +
  `style="position:absolute;left:${left}px;top:${top}px;width:${displayW}px;height:${displayH}px;filter:${FILTER}">`,
);
await page.waitForFunction(() => {
  const img = document.querySelector('img');
  return Boolean(img && img.complete && img.naturalWidth > 0);
});
await page.waitForTimeout(300);
await page.screenshot({ path: outPath });
await browser.close();
console.log(`Derived nebula background -> ${outPath}`);
