import { describe, expect, it } from 'vitest';
import { roadmapCatalog } from '../fixtures/catalog';
import { defaultRoadmapState } from '../state';
import { discoverView } from './discover';

describe('discoverView', () => {
  it('ranks by interest overlap and marks stubs', () => {
    const vm = discoverView(roadmapCatalog, { ...defaultRoadmapState, interests: ['music', 'technology'] });
    expect(vm.paths[0].id).toBe('djvj');
    expect(vm.paths[0].matchedInterests).toEqual(['music', 'technology']);
    expect(vm.paths[0].status).toBe('full');
    expect(vm.paths.filter((p) => p.status === 'stub').length).toBe(8);
    expect(vm.interests.find((i) => i.id === 'music')?.selected).toBe(true);
    expect(vm.interests.find((i) => i.id === 'movement')?.selected).toBe(false);
  });
  it('with no interests, lists full paths before stubs, then by title', () => {
    const vm = discoverView(roadmapCatalog, defaultRoadmapState);
    expect(vm.paths[0].id).toBe('djvj');
    expect(vm.paths.every((p) => p.matchedInterests.length === 0)).toBe(true);
    const stubTitles = vm.paths.slice(1).map((p) => p.title);
    expect(stubTitles).toEqual([...stubTitles].sort((a, b) => a.localeCompare(b)));
  });
});
