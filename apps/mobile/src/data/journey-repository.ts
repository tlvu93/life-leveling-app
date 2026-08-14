import { defaultJourneyState, migrateJourneyState, type JourneyState } from '../domain/journey';

export const JOURNEY_STORAGE_KEY = 'life-leveling.alpha-1.journey.v2';
export const LEGACY_JOURNEY_STORAGE_KEY = 'life-leveling.alpha-1.journey.v1';

export type JourneyRepository = {
  load: () => Promise<JourneyState>;
  save: (state: JourneyState) => Promise<void>;
  clear: () => Promise<void>;
};

export type JourneyKeyValueStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  multiRemove: (keys: string[]) => Promise<void>;
};

function cloneState(value: unknown) {
  return migrateJourneyState(JSON.stringify(value));
}

export class KeyValueJourneyRepository implements JourneyRepository {
  constructor(private readonly storage: JourneyKeyValueStorage) {}

  async load() {
    const [current, legacy] = await Promise.all([
      this.storage.getItem(JOURNEY_STORAGE_KEY),
      this.storage.getItem(LEGACY_JOURNEY_STORAGE_KEY),
    ]);
    return migrateJourneyState(current ?? legacy);
  }

  async save(state: JourneyState) {
    await this.storage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(state));
  }

  async clear() {
    await this.storage.multiRemove([JOURNEY_STORAGE_KEY, LEGACY_JOURNEY_STORAGE_KEY]);
  }
}

export class InMemoryJourneyRepository implements JourneyRepository {
  private stored: JourneyState | null;

  constructor(initialState: unknown = null) {
    this.stored = initialState === null ? null : cloneState(initialState);
  }

  async load() {
    return this.stored ? cloneState(this.stored) : cloneState(defaultJourneyState);
  }

  async save(state: JourneyState) {
    this.stored = cloneState(state);
  }

  async clear() {
    this.stored = null;
  }

  snapshot() {
    return this.stored ? cloneState(this.stored) : null;
  }
}

type JourneyFetch = (input: string, init?: RequestInit) => Promise<Response>;

type HttpJourneyRepositoryOptions = {
  endpoint: string;
  fetchImpl?: JourneyFetch;
  headers?: () => Promise<Record<string, string>> | Record<string, string>;
  credentials?: RequestCredentials;
};

export class JourneyRepositoryError extends Error {
  constructor(
    message: string,
    readonly operation: 'load' | 'save' | 'clear',
    readonly status: number | null = null,
  ) {
    super(message);
    this.name = 'JourneyRepositoryError';
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function responseState(value: unknown) {
  const body = asRecord(value);
  const data = asRecord(body?.data);
  return data?.state ?? body?.state ?? null;
}

async function responseError(response: Response, operation: JourneyRepositoryError['operation']) {
  let message = `Could not ${operation} the remote journey.`;
  try {
    const body = asRecord(await response.json() as unknown);
    if (typeof body?.error === 'string') message = body.error;
    else if (typeof body?.message === 'string') message = body.message;
  } catch {
    // Preserve the stable fallback when the server did not return JSON.
  }
  return new JourneyRepositoryError(message, operation, response.status);
}

export function createRemoteJourneyDocument(state: JourneyState) {
  const artifact = state.quest.artifact;
  return {
    ...state,
    quest: {
      ...state.quest,
      artifact: artifact ? {
        id: artifact.id,
        kind: artifact.kind,
        mimeType: artifact.mimeType,
        name: artifact.name,
        size: artifact.size,
        createdAt: artifact.createdAt,
      } : null,
    },
  };
}

export class HttpJourneyRepository implements JourneyRepository {
  private readonly fetchImpl: JourneyFetch;
  private readonly endpoint: string;

  constructor(private readonly options: HttpJourneyRepositoryOptions) {
    this.endpoint = options.endpoint.replace(/\/$/, '');
    if (!this.endpoint) throw new Error('A journey API endpoint is required.');
    if (!options.fetchImpl && typeof globalThis.fetch !== 'function') throw new Error('No fetch implementation is available.');
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  private async request(operation: JourneyRepositoryError['operation'], init: RequestInit) {
    const headers = await this.options.headers?.() ?? {};
    try {
      return await this.fetchImpl(this.endpoint, {
        ...init,
        credentials: this.options.credentials ?? 'include',
        headers: { Accept: 'application/json', ...headers, ...init.headers },
      });
    } catch (error) {
      throw new JourneyRepositoryError(
        error instanceof Error ? error.message : `Could not ${operation} the remote journey.`,
        operation,
      );
    }
  }

  async load() {
    const response = await this.request('load', { method: 'GET' });
    if (response.status === 404) return cloneState(defaultJourneyState);
    if (!response.ok) throw await responseError(response, 'load');
    return migrateJourneyState(responseState(await response.json() as unknown));
  }

  async save(state: JourneyState) {
    const response = await this.request('save', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: createRemoteJourneyDocument(state) }),
    });
    if (!response.ok) throw await responseError(response, 'save');
  }

  async clear() {
    const response = await this.request('clear', { method: 'DELETE' });
    if (!response.ok && response.status !== 404) throw await responseError(response, 'clear');
  }
}
