import { defaultRoadmapState, migrateRoadmapState, ROADMAP_STORAGE_KEY, type RoadmapState } from '../domain/roadmap/state';

export { ROADMAP_STORAGE_KEY };

export type RoadmapRepository = {
  load: () => Promise<RoadmapState>;
  save: (state: RoadmapState) => Promise<void>;
  clear: () => Promise<void>;
};

export type RoadmapKeyValueStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  multiRemove: (keys: string[]) => Promise<void>;
};

function cloneState(value: unknown) {
  return migrateRoadmapState(JSON.stringify(value));
}

export class KeyValueRoadmapRepository implements RoadmapRepository {
  constructor(private readonly storage: RoadmapKeyValueStorage) {}

  async load() {
    return migrateRoadmapState(await this.storage.getItem(ROADMAP_STORAGE_KEY));
  }

  async save(state: RoadmapState) {
    await this.storage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(state));
  }

  async clear() {
    await this.storage.multiRemove([ROADMAP_STORAGE_KEY]);
  }
}

export class InMemoryRoadmapRepository implements RoadmapRepository {
  private stored: RoadmapState | null;

  constructor(initialState: unknown = null) {
    this.stored = initialState === null ? null : cloneState(initialState);
  }

  async load() {
    return this.stored ? cloneState(this.stored) : cloneState(defaultRoadmapState);
  }

  async save(state: RoadmapState) {
    this.stored = cloneState(state);
  }

  async clear() {
    this.stored = null;
  }
}
