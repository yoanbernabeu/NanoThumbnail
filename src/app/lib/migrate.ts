import { openDB } from 'idb';
import { putGeneration, putLibraryImage, putPersona, putProject, uid } from './db';
import { dataUrlToBlob, dimensions } from './images';
import type { AspectRatio, GenerationParams, Persona, PersonaPhoto, Resolution } from './types';

/**
 * One-time import of v1 data (NanoThumbnailDB: base64 strings in an `images`
 * store, history in a `history` store, persona metadata in localStorage).
 * The v1 database is left untouched so a rollback stays possible.
 */

const FLAG = 'nt_migrated_v1';
const V1_DB = 'NanoThumbnailDB';

interface V1History {
  prompt: string;
  url: string;
  localId: string;
  timestamp?: number;
  parameters?: { resolution?: string; aspect_ratio?: string; output_format?: string; safety_filter_level?: string; provider?: string; model?: string };
}
interface V1Image {
  id: string;
  base64: string;
  timestamp: number;
}

export async function migrateFromV1(): Promise<{ imported: number } | null> {
  try {
    if (localStorage.getItem(FLAG)) return null;
  } catch {
    return null;
  }

  const databases = await indexedDB.databases?.().catch(() => []);
  if (databases && !databases.some((d) => d.name === V1_DB)) {
    localStorage.setItem(FLAG, '1');
    return null;
  }

  let imported = 0;
  try {
    const v1 = await openDB(V1_DB);
    const storeNames = Array.from(v1.objectStoreNames);
    const images: V1Image[] = storeNames.includes('images') ? await v1.getAll('images') : [];
    const history: V1History[] = storeNames.includes('history') ? await v1.getAll('history') : [];
    v1.close();
    const byId = new Map(images.map((i) => [i.id, i.base64]));

    // History → one "Imported" project
    const withImages = history.filter((h) => byId.has(h.localId));
    if (withImages.length) {
      const now = Date.now();
      const projectId = uid('p_');
      await putProject({ id: projectId, name: 'v1', createdAt: now, updatedAt: now });
      for (const h of withImages) {
        const blob = await dataUrlToBlob(byId.get(h.localId)!);
        const { width, height } = await dimensions(blob);
        const p = h.parameters ?? {};
        const params: GenerationParams = {
          provider: p.provider === 'gemini' ? 'gemini' : 'replicate',
          model: p.model === 'nano-banana-2' ? 'nano-banana-2' : 'nano-banana-pro',
          aspectRatio: (['16:9', '9:16', '4:3', '1:1'].includes(p.aspect_ratio ?? '') ? p.aspect_ratio : '16:9') as AspectRatio,
          resolution: (['1K', '2K', '4K'].includes(p.resolution ?? '') ? p.resolution : '2K') as Resolution,
          format: p.output_format === 'jpg' ? 'jpg' : 'png',
          safety: 'block_only_high',
        };
        await putGeneration({
          id: uid('g_'),
          projectId,
          kind: 'import',
          prompt: h.prompt,
          fullPrompt: h.prompt,
          params,
          blob,
          width,
          height,
          createdAt: h.timestamp ?? now,
        });
        imported++;
      }
    }

    // Reference library
    for (const img of images.filter((i) => i.id.startsWith('ref_'))) {
      await putLibraryImage({ id: uid('l_'), blob: await dataUrlToBlob(img.base64), createdAt: img.timestamp });
      imported++;
    }

    // Personas (metadata in localStorage, photos in `images` as persona_{id}_{slot})
    const meta: Array<{ id: string; name: string; timestamp: number }> = JSON.parse(localStorage.getItem('nano_personas') || '[]');
    for (const m of meta) {
      const photos: PersonaPhoto[] = [];
      for (const slot of ['front', 'left', 'right'] as const) {
        const b64 = byId.get(`persona_${m.id}_${slot}`);
        if (b64) photos.push({ id: uid('ph_'), slot, blob: await dataUrlToBlob(b64) });
      }
      if (photos.length) {
        const persona: Persona = { id: uid('pe_'), name: m.name, photos, createdAt: m.timestamp };
        await putPersona(persona);
        imported++;
      }
    }

    localStorage.setItem(FLAG, '1');
    return { imported };
  } catch (error) {
    console.error('v1 migration failed', error);
    return null;
  }
}
