import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { BrandKit, Generation, LibraryImage, Persona, Project } from './types';

interface NanoDB extends DBSchema {
  generations: {
    key: string;
    value: Generation;
    indexes: { byProject: string; byCreatedAt: number };
  };
  projects: { key: string; value: Project; indexes: { byUpdatedAt: number } };
  personas: { key: string; value: Persona };
  library: { key: string; value: LibraryImage };
  brand: { key: string; value: BrandKit };
}

const DB_NAME = 'NanoThumbnail';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<NanoDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<NanoDB>> {
  dbPromise ??= openDB<NanoDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const generations = db.createObjectStore('generations', { keyPath: 'id' });
      generations.createIndex('byProject', 'projectId');
      generations.createIndex('byCreatedAt', 'createdAt');
      const projects = db.createObjectStore('projects', { keyPath: 'id' });
      projects.createIndex('byUpdatedAt', 'updatedAt');
      db.createObjectStore('personas', { keyPath: 'id' });
      db.createObjectStore('library', { keyPath: 'id' });
      db.createObjectStore('brand', { keyPath: 'id' });
    },
  });
  return dbPromise;
}

export function uid(prefix = ''): string {
  return `${prefix}${crypto.randomUUID()}`;
}

// ─── Projects ────────────────────────────────────────────

export async function listProjects(): Promise<Project[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('projects', 'byUpdatedAt');
  return all.reverse();
}

export async function putProject(project: Project): Promise<void> {
  await (await getDB()).put('projects', project);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['projects', 'generations'], 'readwrite');
  const keys = await tx.objectStore('generations').index('byProject').getAllKeys(id);
  await Promise.all([
    ...keys.map((k) => tx.objectStore('generations').delete(k)),
    tx.objectStore('projects').delete(id),
    tx.done,
  ]);
}

// ─── Generations ─────────────────────────────────────────

export async function listGenerations(projectId?: string): Promise<Generation[]> {
  const db = await getDB();
  const items = projectId
    ? await db.getAllFromIndex('generations', 'byProject', projectId)
    : await db.getAll('generations');
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function putGeneration(generation: Generation): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['generations', 'projects'], 'readwrite');
  await tx.objectStore('generations').put(generation);
  const project = await tx.objectStore('projects').get(generation.projectId);
  if (project) await tx.objectStore('projects').put({ ...project, updatedAt: Date.now() });
  await tx.done;
}

export async function deleteGeneration(id: string): Promise<void> {
  await (await getDB()).delete('generations', id);
}

// ─── Personas / library / brand ──────────────────────────

export async function listPersonas(): Promise<Persona[]> {
  const items = await (await getDB()).getAll('personas');
  return items.sort((a, b) => b.createdAt - a.createdAt);
}
export async function putPersona(persona: Persona): Promise<void> {
  await (await getDB()).put('personas', persona);
}
export async function deletePersona(id: string): Promise<void> {
  await (await getDB()).delete('personas', id);
}

export async function listLibrary(): Promise<LibraryImage[]> {
  const items = await (await getDB()).getAll('library');
  return items.sort((a, b) => b.createdAt - a.createdAt);
}
export async function putLibraryImage(image: LibraryImage): Promise<void> {
  await (await getDB()).put('library', image);
}
export async function deleteLibraryImage(id: string): Promise<void> {
  await (await getDB()).delete('library', id);
}

export async function getBrandKit(): Promise<BrandKit | undefined> {
  return (await getDB()).get('brand', 'default');
}
export async function putBrandKit(kit: BrandKit): Promise<void> {
  await (await getDB()).put('brand', kit);
}

/** Ask the browser not to evict our data under storage pressure. */
export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    const e = await navigator.storage?.estimate?.();
    return e ? { usage: e.usage ?? 0, quota: e.quota ?? 0 } : null;
  } catch {
    return null;
  }
}
