import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import type { QuestArtifact } from '@/state/journey-context';

const EVIDENCE_DIRECTORY = 'quest-evidence';
const WEB_DATABASE = 'life-leveling-local-evidence';
const WEB_STORE = 'artifacts';

export type EvidenceAssetInput = {
  kind: QuestArtifact['kind'];
  mimeType: string | null;
  name: string;
  size: number | null;
  sourceUri: string;
  webFile?: Blob | null;
};

function artifactId() {
  return `artifact-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function safeName(name: string) {
  const normalized = name.trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return normalized || 'quest-evidence';
}

function openWebDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(WEB_DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(WEB_STORE)) request.result.createObjectStore(WEB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local evidence storage.'));
  });
}

async function withWebStore<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openWebDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(WEB_STORE, mode);
    const request = operation(transaction.objectStore(WEB_STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not update local evidence storage.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('Could not update local evidence storage.'));
    };
  });
}

async function sourceBlob(input: EvidenceAssetInput) {
  if (input.webFile) return input.webFile;
  const response = await fetch(input.sourceUri);
  if (!response.ok) throw new Error('The selected evidence could not be read.');
  return response.blob();
}

export async function persistEvidenceAsset(input: EvidenceAssetInput): Promise<QuestArtifact> {
  const id = artifactId();
  const name = safeName(input.name);
  let uri: string;

  if (Platform.OS === 'web') {
    if (typeof indexedDB === 'undefined') throw new Error('This browser does not support offline evidence storage.');
    const blob = await sourceBlob(input);
    await withWebStore('readwrite', (store) => store.put(blob, id));
    uri = `life-leveling-evidence://${id}`;
  } else {
    const directory = new Directory(Paths.document, EVIDENCE_DIRECTORY);
    directory.create({ idempotent: true, intermediates: true });
    const destination = new File(directory, `${id}-${name}`);
    await new File(input.sourceUri).copy(destination, { overwrite: true });
    uri = destination.uri;
  }

  return {
    id,
    kind: input.kind,
    mimeType: input.mimeType,
    name,
    size: input.size,
    uri,
    createdAt: new Date().toISOString(),
  };
}

export async function deleteEvidenceArtifact(artifact: QuestArtifact) {
  if (Platform.OS === 'web') {
    if (typeof indexedDB !== 'undefined') await withWebStore('readwrite', (store) => store.delete(artifact.id));
    return;
  }

  const directory = new Directory(Paths.document, EVIDENCE_DIRECTORY);
  if (!artifact.uri.startsWith(directory.uri)) throw new Error('Refusing to delete evidence outside app storage.');
  const file = new File(artifact.uri);
  if (file.exists) file.delete();
}

export async function clearEvidenceArtifacts() {
  if (Platform.OS === 'web') {
    if (typeof indexedDB !== 'undefined') await withWebStore('readwrite', (store) => store.clear());
    return;
  }

  const directory = new Directory(Paths.document, EVIDENCE_DIRECTORY);
  if (directory.exists) directory.delete();
}
