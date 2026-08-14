import { describe, expect, it } from 'vitest';

import { migrateJourneyState, resolveJourneyQuest, startPathInJourney, type JourneyState } from '../domain/journey';

import {
  createRemoteJourneyDocument,
  HttpJourneyRepository,
  InMemoryJourneyRepository,
  JOURNEY_STORAGE_KEY,
  JourneyRepositoryError,
  KeyValueJourneyRepository,
  LEGACY_JOURNEY_STORAGE_KEY,
  type JourneyKeyValueStorage,
} from './journey-repository';

class FakeKeyValueStorage implements JourneyKeyValueStorage {
  readonly values = new Map<string, string>();

  async getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  async multiRemove(keys: string[]) {
    keys.forEach((key) => this.values.delete(key));
  }
}

function completedJourney(): JourneyState {
  const initial = migrateJourneyState(null);
  const onboarded: JourneyState = {
    ...initial,
    profile: {
      completed: true,
      interests: ['music', 'technology', 'visual'],
      skills: ['starting-fresh'],
      availableTime: '1-hour',
      explorations: ['creative-hobby'],
    },
  };
  const started = startPathInJourney(onboarded, 'live-av', '2026-08-15T10:00:00.000Z');
  const attempted: JourneyState = {
    ...started,
    quest: {
      ...started.quest,
      evidenceKind: 'note',
      evidence: 'A private note about the attempt.',
      artifact: {
        id: 'artifact-1',
        kind: 'image',
        mimeType: 'image/png',
        name: 'first-pass.png',
        size: 2048,
        uri: 'file:///private/app/quest-evidence/first-pass.png',
        createdAt: '2026-08-15T10:45:00.000Z',
      },
      reflection: 'Live control felt difficult, but I wanted to keep adjusting it.',
      difficulty: 4,
      enjoyment: 5,
      pulledIn: 'live-control',
    },
  };
  return resolveJourneyQuest(attempted, 'completed', '2026-08-15T11:00:00.000Z')!;
}

describe('journey repositories', () => {
  it('round-trips a complete private journey through key-value persistence', async () => {
    const storage = new FakeKeyValueStorage();
    const repository = new KeyValueJourneyRepository(storage);
    const journey = completedJourney();

    await repository.save(journey);
    const restored = await repository.load();

    expect(restored.profile).toEqual(journey.profile);
    expect(restored.selectedPathId).toBe('live-av');
    expect(restored.pathStartedAt).toBe('2026-08-15T10:00:00.000Z');
    expect(restored.quest).toMatchObject({
      status: 'completed',
      outcome: 'completed',
      evidence: 'A private note about the attempt.',
      reflection: 'Live control felt difficult, but I wanted to keep adjusting it.',
      difficulty: 4,
      enjoyment: 5,
      pulledIn: 'live-control',
      resolvedAt: '2026-08-15T11:00:00.000Z',
    });
    expect(restored.quest.artifact).toEqual(journey.quest.artifact);
    expect(restored.branchRecommendation).not.toBeNull();
    expect(restored).not.toHaveProperty('camera');
  });

  it('migrates the legacy key and clears both generations', async () => {
    const storage = new FakeKeyValueStorage();
    storage.values.set(LEGACY_JOURNEY_STORAGE_KEY, JSON.stringify({
      version: 1,
      profile: completedJourney().profile,
      selectedPathId: 'live-av',
      pathStartedAt: '2026-08-15T10:00:00.000Z',
      quest: {
        status: 'completed',
        reflection: 'Legacy reflection',
        difficulty: 3,
        enjoyment: 4,
        pulledIn: 'visual-design',
        completedAt: '2026-08-15T11:00:00.000Z',
      },
      unlockedNodeIds: ['make-track-visible'],
    }));
    const repository = new KeyValueJourneyRepository(storage);

    const migrated = await repository.load();
    expect(migrated.version).toBe(3);
    expect(migrated.quest).toMatchObject({ outcome: 'completed', reflection: 'Legacy reflection' });

    await repository.save(migrated);
    expect(storage.values.has(JOURNEY_STORAGE_KEY)).toBe(true);
    await repository.clear();
    expect(storage.values.size).toBe(0);
  });

  it('keeps in-memory snapshots isolated from caller mutation', async () => {
    const repository = new InMemoryJourneyRepository();
    const journey = completedJourney();
    await repository.save(journey);

    const firstRead = await repository.load();
    firstRead.quest.reflection = 'Changed outside the repository';

    expect((await repository.load()).quest.reflection).toBe(journey.quest.reflection);
    await repository.clear();
    expect(repository.snapshot()).toBeNull();
  });

  it('uses the HTTP contract without transmitting a device-local evidence URI', async () => {
    const journey = completedJourney();
    const calls: { input: string; init?: RequestInit }[] = [];
    const fetchImpl = async (input: string, init?: RequestInit) => {
      calls.push({ input, init });
      if (init?.method === 'GET') {
        return new Response(JSON.stringify({ data: { state: createRemoteJourneyDocument(journey) } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(null, { status: 204 });
    };
    const repository = new HttpJourneyRepository({
      endpoint: 'https://example.test/api/v2/journey/',
      fetchImpl,
      headers: () => ({ Authorization: 'Bearer test-token' }),
    });

    const restored = await repository.load();
    await repository.save(journey);
    await repository.clear();

    expect(restored.quest.artifact).toMatchObject({ id: 'artifact-1', uri: '' });
    expect(calls.map((call) => call.init?.method)).toEqual(['GET', 'PUT', 'DELETE']);
    expect(calls.every((call) => call.input === 'https://example.test/api/v2/journey')).toBe(true);
    expect(calls[1].init?.credentials).toBe('include');
    expect(calls[1].init?.headers).toMatchObject({ Authorization: 'Bearer test-token', 'Content-Type': 'application/json' });
    const request = JSON.parse(String(calls[1].init?.body)) as { state: { quest: { artifact: Record<string, unknown> } } };
    expect(request.state.quest.artifact).not.toHaveProperty('uri');
    expect(request.state.quest.artifact).toMatchObject({ name: 'first-pass.png', size: 2048 });
  });

  it('normalizes missing and failed HTTP records', async () => {
    const missing = new HttpJourneyRepository({
      endpoint: 'https://example.test/api/v2/journey',
      fetchImpl: async () => new Response(null, { status: 404 }),
    });
    expect((await missing.load()).profile.completed).toBe(false);

    const unauthorized = new HttpJourneyRepository({
      endpoint: 'https://example.test/api/v2/journey',
      fetchImpl: async () => new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    });
    await expect(unauthorized.load()).rejects.toEqual(expect.objectContaining<Partial<JourneyRepositoryError>>({
      name: 'JourneyRepositoryError',
      operation: 'load',
      status: 401,
      message: 'Authentication required',
    }));
  });
});
