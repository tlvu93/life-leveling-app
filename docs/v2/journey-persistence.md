# Journey Persistence

- **Status:** Local journey persistence implemented; remote adapter implemented but not enabled
- **State schema:** `JourneyState` version 3
- **Default store:** AsyncStorage on Android/iOS and its local-storage implementation on web

## Persisted journey

The repository stores the user-owned discovery journey:

- onboarding interests, skills, weekly time, and exploration goals;
- selected Path and start time;
- active Quest draft, outcome, evidence note/link, private reflection, ratings, and pull signal;
- local evidence metadata and URI in the local repository;
- post-Quest branch recommendation and unlocked nodes;
- Guide decisions, adopted Guide, and user-created Guide routes.

Atlas camera position, current node selection, open dialogs, picker state, and other transient UI details are not part of `JourneyState`. Camera state remains local even after remote sync is introduced.

## Repository boundary

`JourneyRepository` exposes three operations:

```ts
load(): Promise<JourneyState>
save(state: JourneyState): Promise<void>
clear(): Promise<void>
```

The adapters are:

- `KeyValueJourneyRepository`: production local persistence and version migration;
- `InMemoryJourneyRepository`: isolated component/integration tests;
- `HttpJourneyRepository`: authenticated remote persistence once its server contract exists.

`JourneyProvider` accepts a repository, hydrates through it, and serializes writes so older edits cannot overwrite newer ones. Important transitions flush the write queue before navigation. A failed milestone write stays visible and can be retried; the in-memory journey is not discarded.

## Local evidence privacy

The local repository retains the evidence URI needed to reopen a browser IndexedDB blob or a native app-document file. The HTTP adapter strips that URI because it is device-specific and can reveal local paths. Remote documents keep only the artifact ID, kind, MIME type, name, size, and creation time.

Uploading the underlying photo, video, or file is a separate product capability. Do not enable remote journey persistence until authentication is present, and do not imply that metadata sync makes the underlying file available on another device.

## HTTP contract

The injected endpoint uses credentials and accepts optional authentication headers:

- `GET`: returns `{ "state": JourneyState }` or `{ "data": { "state": JourneyState } }`; `404` means no journey yet.
- `PUT`: accepts `{ "state": JourneyState }` and replaces the authenticated user's snapshot.
- `DELETE`: removes the authenticated user's snapshot; `404` is idempotent success.

Non-success responses may return `{ "error": string }` or `{ "message": string }`. The client normalizes all other failures to `JourneyRepositoryError`, including the operation and HTTP status where available.

## Migration and reset

Loads accept storage versions 1, 2, and 3, normalize supported enum values, rebuild derived recommendations, and return version 3. Local reset clears both the current key (`life-leveling.alpha-1.journey.v2`) and the legacy version-1 key.

Any future schema change must add a migration test before increasing the state version.
