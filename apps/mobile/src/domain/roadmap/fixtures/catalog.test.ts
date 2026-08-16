import { describe, expect, it } from 'vitest';
import { validateGuide } from '../graph';
import { validateCatalog } from '../relationships';
import { roadmapCatalog } from './catalog';

const nodeIds = new Set(roadmapCatalog.nodes.map((n) => n.id));

describe('roadmap catalog fixtures', () => {
  it('has no duplicate node, path, or guide ids', () => {
    expect(roadmapCatalog.nodes.length).toBe(nodeIds.size);
    expect(new Set(roadmapCatalog.paths.map((p) => p.id)).size).toBe(roadmapCatalog.paths.length);
    expect(new Set(roadmapCatalog.guides.map((g) => g.id)).size).toBe(roadmapCatalog.guides.length);
  });
  it('every guide validates against the catalog', () => {
    for (const guide of roadmapCatalog.guides) {
      const known = new Set(roadmapCatalog.nodes
        .filter((n) => !n.provisional || n.provisional.scopeGuideId === guide.id)
        .map((n) => n.id));
      expect({ guide: guide.id, issues: validateGuide(guide, known) }).toEqual({ guide: guide.id, issues: [] });
    }
  });
  it('every path overview is complete and every referenced node exists', () => {
    for (const path of roadmapCatalog.paths) {
      expect(path.overview.whatItIs.length).toBeGreaterThan(0);
      expect(path.interestIds.length).toBeGreaterThan(0);
      for (const id of path.nodeIds) expect(nodeIds.has(id)).toBe(true);
      for (const id of path.neighborPathIds) expect(roadmapCatalog.paths.some((p) => p.id === id)).toBe(true);
    }
    const djvj = roadmapCatalog.paths.find((p) => p.id === 'djvj');
    expect(djvj?.overview.settings.length).toBeGreaterThanOrEqual(4);
    expect(djvj?.overview.variants.length).toBe(4);
    expect(djvj?.overview.realities.length).toBeGreaterThanOrEqual(3);
    expect(djvj?.neighborPathIds).toHaveLength(4);
  });
  it('all 17 shared DJ/VJ nodes are referenced by a DJ/VJ guide as placement or stance', () => {
    const djvj = roadmapCatalog.paths.find((p) => p.id === 'djvj');
    const guides = roadmapCatalog.guides.filter((g) => g.pathId === 'djvj');
    expect(djvj?.nodeIds).toHaveLength(17);
    for (const nodeId of djvj?.nodeIds ?? []) {
      const referenced = guides.some((g) =>
        g.steps.some((s) => s.nodeId === nodeId) || g.stances.some((s) => s.nodeId === nodeId));
      expect({ nodeId, referenced }).toEqual({ nodeId, referenced: true });
    }
  });
  it('both contested nodes carry a placement or stance in BOTH DJ/VJ guides', () => {
    for (const guideId of ['guide-club-first', 'guide-visual-first']) {
      const guide = roadmapCatalog.guides.find((g) => g.id === guideId);
      for (const contested of ['music-theory-fundamentals', 'playing-an-instrument']) {
        const placed = guide?.steps.some((s) => s.nodeId === contested) ?? false;
        const stanced = guide?.stances.some((s) => s.nodeId === contested) ?? false;
        expect({ guideId, contested, covered: placed || stanced }).toEqual({ guideId, contested, covered: true });
      }
    }
  });
  it('every path features a guide that belongs to it', () => {
    for (const path of roadmapCatalog.paths) {
      const featured = roadmapCatalog.guides.find((g) => g.id === path.featuredGuideId);
      expect({ path: path.id, ok: Boolean(featured) && featured?.pathId === path.id })
        .toEqual({ path: path.id, ok: true });
    }
  });
  it('the catalog passes relationship and featured-guide validation', () => {
    expect(validateCatalog(roadmapCatalog)).toEqual([]);
  });
  it('DJ/VJ bridges reach all four neighbour paths', () => {
    const djvjNodeIds = new Set(roadmapCatalog.paths.find((p) => p.id === 'djvj')?.nodeIds ?? []);
    const clusterOf = (id: string) => roadmapCatalog.nodes.find((n) => n.id === id)?.clusterId;
    const reached = new Set(
      roadmapCatalog.relationships
        .filter((r) => r.kind === 'bridge')
        .flatMap((r) => {
          if (djvjNodeIds.has(r.from) && !djvjNodeIds.has(r.to)) return [clusterOf(r.to)];
          if (djvjNodeIds.has(r.to) && !djvjNodeIds.has(r.from)) return [clusterOf(r.from)];
          return [];
        })
        .filter((c): c is string => Boolean(c)),
    );
    for (const neighbour of ['music-production', 'creative-coding-music', 'projection-mapping', 'event-technology']) {
      expect({ neighbour, reached: reached.has(neighbour) }).toEqual({ neighbour, reached: true });
    }
  });
  it('every path is touched by at least one bridge', () => {
    const clusterOf = (id: string) => roadmapCatalog.nodes.find((n) => n.id === id)?.clusterId;
    const bridged = new Set(
      roadmapCatalog.relationships
        .filter((r) => r.kind === 'bridge')
        .flatMap((r) => [clusterOf(r.from), clusterOf(r.to)])
        .filter((c): c is string => Boolean(c)),
    );
    for (const path of roadmapCatalog.paths) {
      expect({ path: path.id, bridged: bridged.has(path.id) }).toEqual({ path: path.id, bridged: true });
    }
  });
  it('every path has an internal dependency spine', () => {
    const clusterOf = (id: string) => roadmapCatalog.nodes.find((n) => n.id === id)?.clusterId;
    for (const path of roadmapCatalog.paths) {
      const internal = roadmapCatalog.relationships.filter(
        (r) => r.kind === 'dependency' && clusterOf(r.from) === path.id && clusterOf(r.to) === path.id,
      );
      expect({ path: path.id, hasSpine: internal.length >= 2 }).toEqual({ path: path.id, hasSpine: true });
    }
  });
  it('every node carries usable layout metadata', () => {
    for (const node of roadmapCatalog.nodes) {
      expect({
        node: node.id,
        ok: node.clusterId.length > 0 && node.depth >= 0 && node.depth <= 3,
      }).toEqual({ node: node.id, ok: true });
    }
  });
  it('every bridge explains itself', () => {
    for (const rel of roadmapCatalog.relationships.filter((r) => r.kind === 'bridge')) {
      expect({ rel: `${rel.from}->${rel.to}`, explained: Boolean(rel.note?.trim()) })
        .toEqual({ rel: `${rel.from}->${rel.to}`, explained: true });
    }
  });
  it('no relationship references a provisional node', () => {
    const provisional = new Set(roadmapCatalog.nodes.filter((n) => n.provisional).map((n) => n.id));
    for (const rel of roadmapCatalog.relationships) {
      expect({ rel: `${rel.from}->${rel.to}`, clean: !provisional.has(rel.from) && !provisional.has(rel.to) })
        .toEqual({ rel: `${rel.from}->${rel.to}`, clean: true });
    }
  });
  it('declares content version 2', () => {
    expect(roadmapCatalog.contentVersion).toBe(2);
  });
  it('the theory disagreement spans the catalog: optional in A, excluded in B, required somewhere', () => {
    const a = roadmapCatalog.guides.find((g) => g.id === 'guide-club-first');
    const b = roadmapCatalog.guides.find((g) => g.id === 'guide-visual-first');
    expect(a?.steps.find((s) => s.nodeId === 'music-theory-fundamentals')?.role).toBe('optional-depth');
    expect(b?.stances.some((s) => s.nodeId === 'music-theory-fundamentals')).toBe(true);
    expect(roadmapCatalog.guides.some((g) => g.steps.some((s) => s.nodeId === 'music-theory-fundamentals' && s.role === 'required'))).toBe(true);
  });
});
