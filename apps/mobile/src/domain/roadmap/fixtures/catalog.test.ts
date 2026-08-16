import { describe, expect, it } from 'vitest';
import { validateGuide } from '../graph';
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
  it('the theory disagreement spans the catalog: optional in A, excluded in B, required somewhere', () => {
    const a = roadmapCatalog.guides.find((g) => g.id === 'guide-club-first');
    const b = roadmapCatalog.guides.find((g) => g.id === 'guide-visual-first');
    expect(a?.steps.find((s) => s.nodeId === 'music-theory-fundamentals')?.role).toBe('optional-depth');
    expect(b?.stances.some((s) => s.nodeId === 'music-theory-fundamentals')).toBe(true);
    expect(roadmapCatalog.guides.some((g) => g.steps.some((s) => s.nodeId === 'music-theory-fundamentals' && s.role === 'required'))).toBe(true);
  });
});
