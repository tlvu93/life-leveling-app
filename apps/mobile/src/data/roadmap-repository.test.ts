import { describe, expect, it } from 'vitest';
import { defaultRoadmapState, ROADMAP_STORAGE_KEY, type RoadmapState } from '../domain/roadmap/state';
import { InMemoryRoadmapRepository, KeyValueRoadmapRepository, type RoadmapKeyValueStorage } from './roadmap-repository';

function fakeStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed));
  const storage: RoadmapKeyValueStorage = {
    getItem: async (key) => store.get(key) ?? null,
    setItem: async (key, value) => { store.set(key, value); },
    multiRemove: async (keys) => { for (const key of keys) store.delete(key); },
  };
  return { storage, store };
}

const withInterests: RoadmapState = { ...defaultRoadmapState, interests: ['music', 'technology'] };

describe('KeyValueRoadmapRepository', () => {
  it('returns the default state when nothing is stored', async () => {
    const { storage } = fakeStorage();
    expect(await new KeyValueRoadmapRepository(storage).load()).toEqual(defaultRoadmapState);
  });
  it('round trips a saved state', async () => {
    const { storage } = fakeStorage();
    const repository = new KeyValueRoadmapRepository(storage);
    await repository.save(withInterests);
    expect(await repository.load()).toEqual(withInterests);
  });
  it('falls back to the default when the payload is corrupt', async () => {
    const { storage } = fakeStorage({ [ROADMAP_STORAGE_KEY]: 'not json {' });
    expect(await new KeyValueRoadmapRepository(storage).load()).toEqual(defaultRoadmapState);
  });
  it('clear removes the key', async () => {
    const { storage, store } = fakeStorage();
    const repository = new KeyValueRoadmapRepository(storage);
    await repository.save(withInterests);
    await repository.clear();
    expect(store.has(ROADMAP_STORAGE_KEY)).toBe(false);
    expect(await repository.load()).toEqual(defaultRoadmapState);
  });
});

describe('InMemoryRoadmapRepository', () => {
  it('starts empty, stores a clone, and clears', async () => {
    const repository = new InMemoryRoadmapRepository();
    expect(await repository.load()).toEqual(defaultRoadmapState);
    await repository.save(withInterests);
    const loaded = await repository.load();
    expect(loaded).toEqual(withInterests);
    expect(loaded).not.toBe(withInterests);
    await repository.clear();
    expect(await repository.load()).toEqual(defaultRoadmapState);
  });
});
