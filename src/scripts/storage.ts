// IndexedDB storage module for local image and history persistence

import type { HistoryItem } from './state';

const DB_NAME = 'NanoThumbnailDB';
const DB_VERSION = 2;
const IMAGES_STORE = 'images';
const HISTORY_STORE = 'history';

let db: IDBDatabase | null = null;

/**
 * Initialize the IndexedDB database
 */
async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(IMAGES_STORE)) {
        database.createObjectStore(IMAGES_STORE, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(HISTORY_STORE)) {
        database.createObjectStore(HISTORY_STORE, { keyPath: 'localId' });
      }
    };
  });
}

// ─── Images ──────────────────────────────────────────────

/**
 * Save an image to IndexedDB
 */
export async function saveImage(id: string, base64: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([IMAGES_STORE], 'readwrite');
    const store = transaction.objectStore(IMAGES_STORE);
    const request = store.put({ id, base64, timestamp: Date.now() });

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error('Error saving image:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get an image from IndexedDB
 */
export async function getImage(id: string): Promise<string | null> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([IMAGES_STORE], 'readonly');
    const store = transaction.objectStore(IMAGES_STORE);
    const request = store.get(id);

    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.base64 : null);
    };
    request.onerror = () => {
      console.error('Error getting image:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Delete an image from IndexedDB
 */
export async function deleteImage(id: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([IMAGES_STORE], 'readwrite');
    const store = transaction.objectStore(IMAGES_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error('Error deleting image:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Clear all images from IndexedDB
 */
export async function clearAllImages(): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([IMAGES_STORE], 'readwrite');
    const store = transaction.objectStore(IMAGES_STORE);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error('Error clearing images:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get all images from IndexedDB, optionally filtered by ID prefix
 */
export async function getAllImages(prefix?: string): Promise<Array<{ id: string; base64: string; timestamp: number }>> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([IMAGES_STORE], 'readonly');
    const store = transaction.objectStore(IMAGES_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      let results = request.result || [];
      if (prefix) {
        results = results.filter((item: { id: string }) => item.id.startsWith(prefix));
      }
      // Sort by timestamp descending (newest first)
      results.sort((a: { timestamp: number }, b: { timestamp: number }) => b.timestamp - a.timestamp);
      resolve(results);
    };
    request.onerror = () => {
      console.error('Error getting all images:', request.error);
      reject(request.error);
    };
  });
}

// ─── History ─────────────────────────────────────────────

/**
 * Save a history item to IndexedDB
 */
export async function saveHistoryItem(item: HistoryItem): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([HISTORY_STORE], 'readwrite');
    const store = transaction.objectStore(HISTORY_STORE);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error('Error saving history item:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get all history items from IndexedDB, sorted newest first
 */
export async function getHistory(): Promise<HistoryItem[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([HISTORY_STORE], 'readonly');
    const store = transaction.objectStore(HISTORY_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const items: HistoryItem[] = request.result || [];
      items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      resolve(items);
    };
    request.onerror = () => {
      console.error('Error getting history:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Delete a history item and its associated image from IndexedDB
 */
export async function deleteHistoryItem(localId: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([HISTORY_STORE, IMAGES_STORE], 'readwrite');
    const historyStore = transaction.objectStore(HISTORY_STORE);
    const imagesStore = transaction.objectStore(IMAGES_STORE);

    historyStore.delete(localId);
    imagesStore.delete(localId);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => {
      console.error('Error deleting history item:', transaction.error);
      reject(transaction.error);
    };
  });
}

/**
 * Migrate history from localStorage to IndexedDB (one-time)
 */
export async function migrateHistoryFromLocalStorage(): Promise<void> {
  const raw = localStorage.getItem('nano_history');
  if (!raw) return;

  try {
    const items: HistoryItem[] = JSON.parse(raw);
    const database = await initDB();

    const transaction = database.transaction([HISTORY_STORE], 'readwrite');
    const store = transaction.objectStore(HISTORY_STORE);

    for (const item of items) {
      // Ensure every item has a localId and timestamp
      if (!item.localId) {
        item.localId = `img_migrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      if (!item.timestamp) {
        item.timestamp = Date.now();
      }
      store.put(item);
    }

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    // Migration done, remove from localStorage
    localStorage.removeItem('nano_history');
    console.log(`Migrated ${items.length} history items from localStorage to IndexedDB`);
  } catch (error) {
    console.error('History migration failed:', error);
  }
}
