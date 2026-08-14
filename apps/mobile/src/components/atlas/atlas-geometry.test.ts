import { describe, expect, it } from 'vitest';

import { atlasGraphEdges, atlasNodeIndex } from '../../domain/atlas';

import { concatEdgePaths, pointOnEdge, regularPolygonPath, sparklePath, starPath } from './atlas-geometry';

function vertices(path: string): [number, number][] {
  return [...path.matchAll(/[ML] (-?[\d.]+) (-?[\d.]+)/g)].map((match) => [Number(match[1]), Number(match[2])]);
}

describe('atlas geometry', () => {
  it('builds a closed regular hexagon with a top vertex', () => {
    const path = regularPolygonPath(100, 50, 6, 20);
    const points = vertices(path);
    expect(points).toHaveLength(6);
    expect(path.trim().endsWith('Z')).toBe(true);
    expect(points[0][0]).toBeCloseTo(100);
    expect(points[0][1]).toBeCloseTo(30);
    for (const [x, y] of points) {
      expect(Math.hypot(x - 100, y - 50)).toBeCloseTo(20, 1);
    }
  });

  it('alternates star vertices between outer and inner radii', () => {
    const path = starPath(0, 0, 5, 10, 4);
    const points = vertices(path);
    expect(points).toHaveLength(10);
    points.forEach(([x, y], index) => {
      expect(Math.hypot(x, y)).toBeCloseTo(index % 2 === 0 ? 10 : 4, 1);
    });
  });

  it('draws a 4-arm sparkle with concave sides', () => {
    const path = sparklePath(10, 10, 8);
    expect(path.startsWith('M 10 2')).toBe(true);
    expect(path.match(/Q /g)).toHaveLength(4);
    expect(path.trim().endsWith('Z')).toBe(true);
  });

  it('evaluates edge cubics so t=0 and t=1 land on the endpoint nodes', () => {
    const edge = atlasGraphEdges.find((candidate) => candidate.id === 'overview-goal')!;
    const from = atlasNodeIndex.get(edge.from)!;
    const to = atlasNodeIndex.get(edge.to)!;
    expect(pointOnEdge(edge, 0)).toEqual({ x: from.x, y: from.y });
    expect(pointOnEdge(edge, 1)!.x).toBeCloseTo(to.x);
    expect(pointOnEdge(edge, 1)!.y).toBeCloseTo(to.y);
    const mid = pointOnEdge(edge, 0.5)!;
    expect(mid.x).toBeGreaterThan(Math.min(from.x, to.x));
    expect(mid.x).toBeLessThan(Math.max(from.x, to.x));
  });

  it('concatenates edges into one multi-subpath string', () => {
    const edges = atlasGraphEdges.slice(0, 3);
    const combined = concatEdgePaths(edges);
    expect(combined.match(/M /g)).toHaveLength(3);
    expect(combined.match(/C /g)).toHaveLength(3);
  });
});
