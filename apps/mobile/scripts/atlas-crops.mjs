// Shared geometry for the atlas visual-verification harness.
// The viewport matches the design mock (apps/mobile/.tmp/mock.png, 1672x941).
// Crop rects are in CSS pixels at deviceScaleFactor 1 and apply to BOTH the
// mock (slice-mock.mjs) and live captures (capture-atlas.mjs), so each
// compare-<name>.png in .tmp/atlas-compare lines up region-for-region.
// Style parity is the goal, not content parity - node names/positions differ.

export const VIEWPORT = { width: 1672, height: 941 };

export const CROPS = {
  // Map canvas areas
  'hub-music': { x: 110, y: 180, width: 330, height: 300 },
  'skill-web': { x: 640, y: 80, width: 360, height: 300 },
  'route': { x: 860, y: 400, width: 420, height: 400 },
  'region-label': { x: 560, y: 630, width: 400, height: 160 },
  'background': { x: 200, y: 780, width: 340, height: 150 },
  // HUD chrome
  'header': { x: 0, y: 0, width: 1672, height: 64 },
  'tool-rail': { x: 16, y: 440, width: 90, height: 230 },
  'legend': { x: 16, y: 660, width: 200, height: 215 },
  'navigator-card': { x: 1370, y: 80, width: 295, height: 140 },
  'inspector': { x: 1350, y: 365, width: 315, height: 505 },
  'dock': { x: 360, y: 855, width: 960, height: 80 },
};
