// IndexedDB storage module for local image persistence

const DB_NAME = 'NanoThumbnailDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

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
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Save an image to IndexedDB
 * @param id - Unique identifier for the image
 * @param base64 - Base64 encoded image data
 */
export async function saveImage(id: string, base64: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
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
 * @param id - Unique identifier for the image
 * @returns Base64 encoded image data or null if not found
 */
export async function getImage(id: string): Promise<string | null> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
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
 * @param id - Unique identifier for the image
 */
export async function deleteImage(id: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
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
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
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
 * @param prefix - Optional prefix to filter images by ID
 * @returns Array of image objects with id and base64
 */
export async function getAllImages(prefix?: string): Promise<Array<{ id: string; base64: string; timestamp: number }>> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
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
