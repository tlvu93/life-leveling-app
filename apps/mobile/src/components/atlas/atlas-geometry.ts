import { atlasEdgePath, atlasNodeIndex, type AtlasGraphEdge } from '../../domain/atlas';

// Pure SVG-path geometry for the atlas scene. All functions return path
// strings consumable by Skia's <Path path={...}>.

const round = (value: number) => Math.round(value * 100) / 100;

/** Regular n-gon centered on (cx, cy); default rotation puts a vertex at 12 o'clock. */
export function regularPolygonPath(cx: number, cy: number, sides: number, radius: number, rotationRad = -Math.PI / 2): string {
  const commands: string[] = [];
  for (let index = 0; index < sides; index += 1) {
    const angle = rotationRad + (index * 2 * Math.PI) / sides;
    commands.push(`${index ? 'L' : 'M'} ${round(cx + radius * Math.cos(angle))} ${round(cy + radius * Math.sin(angle))}`);
  }
  return `${commands.join(' ')} Z`;
}

/** n-point star alternating between outerRadius and innerRadius vertices. */
export function starPath(cx: number, cy: number, points: number, outerRadius: number, innerRadius: number, rotationRad = -Math.PI / 2): string {
  const commands: string[] = [];
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = rotationRad + (index * Math.PI) / points;
    commands.push(`${index ? 'L' : 'M'} ${round(cx + radius * Math.cos(angle))} ${round(cy + radius * Math.sin(angle))}`);
  }
  return `${commands.join(' ')} Z`;
}

/**
 * 4-point concave glint (the star-sparkle silhouette): four arms whose sides
 * bow toward the center via quadratic curves. `waist` sets arm thinness.
 */
export function sparklePath(cx: number, cy: number, radius: number, waist = 0.22): string {
  const w = round(radius * waist);
  const r = round(radius);
  return [
    `M ${round(cx)} ${round(cy - r)}`,
    `Q ${round(cx + w)} ${round(cy - w)} ${round(cx + r)} ${round(cy)}`,
    `Q ${round(cx + w)} ${round(cy + w)} ${round(cx)} ${round(cy + r)}`,
    `Q ${round(cx - w)} ${round(cy + w)} ${round(cx - r)} ${round(cy)}`,
    `Q ${round(cx - w)} ${round(cy - w)} ${round(cx)} ${round(cy - r)}`,
    'Z',
  ].join(' ');
}

/**
 * Point at parameter t along the same cubic curve atlasEdgePath draws for an
 * edge, so beads and particles can sit exactly on the rendered line.
 */
export function pointOnEdge(edge: AtlasGraphEdge, t: number): { x: number; y: number } | null {
  const from = atlasNodeIndex.get(edge.from);
  const to = atlasNodeIndex.get(edge.to);
  if (!from || !to) return null;
  const dx = to.x - from.x;
  const c1 = { x: from.x + dx * 0.42, y: from.y };
  const c2 = { x: to.x - dx * 0.42, y: to.y };
  const u = 1 - t;
  return {
    x: u * u * u * from.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * to.x,
    y: u * u * u * from.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * to.y,
  };
}

/** Concatenates edge curves into one path string for single-pass glow strokes. */
export function concatEdgePaths(edges: AtlasGraphEdge[]): string {
  return edges.map((edge) => atlasEdgePath(edge)).filter(Boolean).join(' ');
}
