const DB_NAME = 'shunyin-local-images';
const STORE_NAME = 'images';
const DB_VERSION = 1;

interface StoredImageRecord {
  id: string;
  blob: Blob;
  updatedAt: number;
}

let openDatabasePromise: Promise<IDBDatabase | null> | null = null;

function openDatabase() {
  if (openDatabasePromise) {
    return openDatabasePromise;
  }

  if (typeof indexedDB === 'undefined') {
    openDatabasePromise = Promise.resolve(null);
    return openDatabasePromise;
  }

  openDatabasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open local image database.'));
  }).catch(() => null);

  return openDatabasePromise;
}

function runRequest<T>(mode: IDBTransactionMode, executor: (store: IDBObjectStore) => IDBRequest<T>) {
  return openDatabase().then((database) => {
    if (!database) {
      return null;
    }

    return new Promise<T | null>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      const request = executor(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
      transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    });
  });
}

export async function saveLocalImageBlob(id: string, blob: Blob) {
  await runRequest('readwrite', (store) => store.put({
    id,
    blob,
    updatedAt: Date.now(),
  } satisfies StoredImageRecord));
}

export async function getLocalImageBlob(id: string) {
  const result = await runRequest<StoredImageRecord | undefined>('readonly', (store) => store.get(id));
  return result?.blob ?? null;
}

export async function getLocalImageBlobs(ids: string[]) {
  const entries = await Promise.all(ids.map(async (id) => [id, await getLocalImageBlob(id)] as const));
  return new Map(entries.filter((entry): entry is readonly [string, Blob] => entry[1] instanceof Blob));
}
