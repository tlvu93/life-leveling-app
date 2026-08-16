import { describe, expect, it } from 'vitest';
import { roadmapCatalog } from '../fixtures/catalog';
import { guideClubFirst } from '../fixtures/djvj/guide-club-first';
import { guideVisualFirst } from '../fixtures/djvj/guide-visual-first';
import { builderView, searchNodes } from './guide-builder';

describe('builderView', () => {
  const vm = builderView(roadmapCatalog, guideClubFirst);

  it('reports a valid fixture draft with no issues', () => {
    expect(vm.issues).toEqual([]);
    expect(vm.stances).toEqual([]);
  });
  it('marks alternative-branch steps with the step they fork from', () => {
    const controller = vm.route.find((s) => s.stepId === 'a4-controller');
    const free = vm.route.find((s) => s.stepId === 'a4-free');
    const mainline = vm.route.find((s) => s.stepId === 'a5');
    expect(controller?.branchOf).toBe('a3');
    expect(free?.branchOf).toBe('a3');
    expect(mainline?.branchOf).toBeNull();
  });
  it('offers provisional nodes only to the guide they are scoped to', () => {
    expect(searchNodes(roadmapCatalog, guideClubFirst, 'etiquette').map((n) => n.id)).toEqual(['open-decks-etiquette']);
    expect(searchNodes(roadmapCatalog, guideVisualFirst, 'etiquette')).toEqual([]);
    const found = searchNodes(roadmapCatalog, guideClubFirst, 'etiquette');
    expect(found[0].provisional).toBe(true);
  });
  it('search matches titles and descriptions case-insensitively', () => {
    expect(searchNodes(roadmapCatalog, guideVisualFirst, 'CAMELOT').map((n) => n.id))
      .toEqual(['music-theory-fundamentals', 'harmonic-mixing']);
    expect(searchNodes(roadmapCatalog, guideVisualFirst, 'beatgrids').map((n) => n.id))
      .toEqual(['club-media-player-workflow']);
  });
});
