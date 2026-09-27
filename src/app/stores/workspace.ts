import { create } from 'zustand';
import { toast } from 'sonner';
import * as db from '../lib/db';
import { generateImage, isAbort } from '../lib/providers';
import { buildEditPrompt, buildGenerationPrompt, buildRegionEditPrompt, type ImageRole, type TextMode } from '../lib/prompt';
import { dimensions, highlightRegion, mergeWithMask, normaliseUpload, prepareReference } from '../lib/images';
import { explainError } from '../lib/errors';
import { findStyle } from '../lib/styles';
import { scoreThumbnail, rankThumbnails, type Ranking } from '../lib/ai';
import type { BrandKit, Generation, GenerationKind, GenerationParams, LibraryImage, Persona, Project, RefImage, RefSource, Score } from '../lib/types';
import { useSettings } from './settings';
import { t } from '../i18n';

export const MAX_IMAGES = 14;
export const MAX_PERSONAS = 5;

export type ViewMode = 'image' | 'feed' | 'compare';

export interface Job {
  id: string;
  kind: GenerationKind;
  status: 'running' | 'failed' | 'canceled';
  startedAt: number;
  elapsed: number;
  parentId?: string;
  error?: string;
  controller: AbortController;
}

export interface Brief {
  videoTitle: string;
  brief: string;
  overlayText: string;
  textMode: TextMode;
  styleId: string;
}

/** What an action produced, for callers that need it (the agent bridge); the UI ignores it. */
export interface Outcome<T> {
  value?: T;
  error?: string;
}

export interface ErrorReport {
  message: string;
  status?: number;
  details?: unknown;
}

interface WorkspaceState {
  ready: boolean;
  projects: Project[];
  projectId: string;
  generations: Generation[];
  selectedId: string | null;
  /** Filmstrip multi-selection, used by Compare and Test & Compare export. */
  pickedIds: string[];
  jobs: Job[];

  brief: Brief;
  refs: RefImage[];
  personaIds: string[];
  personas: Persona[];
  library: LibraryImage[];
  brand: BrandKit;

  view: ViewMode;
  safeZones: boolean;
  maskMode: boolean;
  hasMask: boolean;
  scoring: string | null;
  ranking: { ids: string[]; result: Ranking } | null;
  ranking_busy: boolean;
  lastError: ErrorReport | null;

  init: () => Promise<void>;
  // projects
  newProject: (name?: string) => Promise<void>;
  openProject: (id: string) => Promise<void>;
  renameProject: (name: string) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  // brief
  setBrief: (patch: Partial<Brief>) => void;
  addFiles: (files: Iterable<File | Blob>, source?: RefSource) => Promise<void>;
  addRef: (blob: Blob, source: RefSource, label?: string) => boolean;
  removeRef: (id: string) => void;
  clearRefs: () => void;
  togglePersona: (id: string) => void;
  // generation
  generate: () => Promise<Outcome<Generation>[]>;
  /** `mask` overrides the painted mask (the agent describes regions as rectangles). */
  edit: (instruction: string, opts?: { mask?: HTMLCanvasElement }) => Promise<Outcome<Generation>[]>;
  cancelJob: (id: string) => void;
  dismissJob: (id: string) => void;
  cancelAll: () => void;
  // gallery
  select: (id: string | null) => void;
  togglePick: (id: string) => void;
  clearPicks: () => void;
  toggleFavorite: (id: string) => Promise<void>;
  removeGeneration: (id: string) => Promise<void>;
  reuse: (gen: Generation) => void;
  score: (id: string) => Promise<Outcome<Score>>;
  rankPicked: () => Promise<Outcome<Ranking>>;
  // assets
  reloadPersonas: () => Promise<void>;
  reloadLibrary: () => Promise<void>;
  saveBrand: (kit: BrandKit) => Promise<void>;
  saveToLibrary: (blob: Blob) => Promise<void>;
  // ui
  setView: (view: ViewMode) => void;
  setSafeZones: (on: boolean) => void;
  setMaskMode: (on: boolean) => void;
  setHasMask: (on: boolean) => void;
  showError: (report: ErrorReport | null) => void;
}

// ─── Object URLs ─────────────────────────────────────────
// Blobs live in IndexedDB; the UI needs URLs. Cache them and revoke on removal.

const urlCache = new Map<Blob, string>();
export function blobUrl(blob: Blob): string {
  let url = urlCache.get(blob);
  if (!url) {
    url = URL.createObjectURL(blob);
    urlCache.set(blob, url);
  }
  return url;
}
function revoke(blob: Blob | undefined) {
  if (!blob) return;
  const url = urlCache.get(blob);
  if (url) URL.revokeObjectURL(url);
  urlCache.delete(blob);
}

// ─── Mask canvas (owned by the canvas component) ─────────

let maskCanvas: HTMLCanvasElement | null = null;
export function registerMaskCanvas(canvas: HTMLCanvasElement | null) {
  maskCanvas = canvas;
}

const EMPTY_BRAND: BrandKit = {
  id: 'default',
  enabled: false,
  channelName: '',
  colors: [],
  fontStyle: '',
  notes: '',
  styleProfile: '',
  styleRefs: [],
  sendStyleRefs: false,
  updatedAt: 0,
};

const BRIEF_KEY = 'nt_brief';
const EMPTY_BRIEF: Brief = { videoTitle: '', brief: '', overlayText: '', textMode: 'render', styleId: '' };
function loadBrief(): Brief {
  try {
    return { ...EMPTY_BRIEF, ...JSON.parse(localStorage.getItem(BRIEF_KEY) || '{}') };
  } catch {
    return EMPTY_BRIEF;
  }
}

function reportError(error: unknown, set: (s: Partial<WorkspaceState>) => void): string {
  const info = explainError(error);
  if (isAbort(error)) return info.message;
  const report = { message: info.message, status: info.status, details: info.details };
  toast.error(t(info.key), {
    description: info.message,
    action: info.details ? { label: t('errors.details'), onClick: () => set({ lastError: report }) } : undefined,
  });
  return t(info.key);
}

export const useWorkspace = create<WorkspaceState>((set, get) => {
  /** Personas selected for this brief → their photos, in a stable order. */
  function personaImages(): Array<{ blob: Blob; role: ImageRole }> {
    const { personas, personaIds } = get();
    return personaIds.flatMap((id) => {
      const p = personas.find((x) => x.id === id);
      if (!p) return [];
      const order = { front: 0, left: 1, right: 2, expression: 3 };
      return [...p.photos]
        .sort((a, b) => order[a.slot] - order[b.slot])
        .map((ph) => ({
          blob: ph.blob,
          role: { kind: 'persona', name: p.name, description: p.description, expression: ph.expression } as ImageRole,
        }));
    });
  }

  function brandImages(): Array<{ blob: Blob; role: ImageRole }> {
    const { brand } = get();
    if (!brand.enabled) return [];
    const out: Array<{ blob: Blob; role: ImageRole }> = [];
    if (brand.sendStyleRefs) out.push(...brand.styleRefs.slice(0, 3).map((blob) => ({ blob, role: { kind: 'style' } as ImageRole })));
    if (brand.logo) out.push({ blob: brand.logo, role: { kind: 'logo' } });
    return out;
  }

  function fail(message: string): Outcome<Generation>[] {
    toast.error(message);
    return [{ error: message }];
  }

  function checkKey(): string | null {
    const key = useSettings.getState().apiKey();
    if (!key) {
      toast.error(t('brief.needKey'));
      window.dispatchEvent(new CustomEvent('nt:open-settings'));
      return null;
    }
    return key;
  }

  async function runJob(opts: {
    kind: GenerationKind;
    prompt: string;
    fullPrompt: string;
    images: Blob[];
    params: GenerationParams;
    parentId?: string;
    videoTitle?: string;
    apiKey: string;
    /** Post-process the raw model output (region edits merge it back into the original). */
    finalize?: (blob: Blob) => Promise<Blob>;
    /** Shared by the jobs of one batch: the first result to arrive gets shown. */
    batch: { shown: boolean };
  }): Promise<Outcome<Generation>> {
    const job: Job = {
      id: db.uid('j_'),
      kind: opts.kind,
      status: 'running',
      startedAt: Date.now(),
      elapsed: 0,
      parentId: opts.parentId,
      controller: new AbortController(),
    };
    set({ jobs: [...get().jobs, job] });
    const patchJob = (patch: Partial<Job>) =>
      set({ jobs: get().jobs.map((j) => (j.id === job.id ? { ...j, ...patch } : j)) });

    try {
      const images = await Promise.all(opts.images.map((b) => prepareReference(b)));
      let blob = await generateImage({
        prompt: opts.fullPrompt,
        images,
        params: opts.params,
        apiKey: opts.apiKey,
        signal: job.controller.signal,
        onProgress: (elapsed) => patchJob({ elapsed }),
      });
      if (opts.finalize) blob = await opts.finalize(blob);
      const { width, height } = await dimensions(blob);
      const generation: Generation = {
        id: db.uid('g_'),
        projectId: get().projectId,
        parentId: opts.parentId,
        kind: opts.kind,
        prompt: opts.prompt,
        fullPrompt: opts.fullPrompt,
        videoTitle: opts.videoTitle,
        params: opts.params,
        blob,
        width,
        height,
        createdAt: Date.now(),
      };
      await db.putGeneration(generation);
      // The user may have switched project meanwhile: only show it if still relevant.
      if (generation.projectId === get().projectId) {
        set({ generations: [generation, ...get().generations] });
        if (!opts.batch.shown) {
          opts.batch.shown = true;
          set({ selectedId: generation.id, maskMode: false, hasMask: false, view: get().view === 'compare' ? 'image' : get().view });
        }
      }
      set({ jobs: get().jobs.filter((j) => j.id !== job.id) });
      return { value: generation };
    } catch (error) {
      if (isAbort(error) && job.controller.signal.aborted) {
        set({ jobs: get().jobs.filter((j) => j.id !== job.id) });
        return { error: t('agent.canceled') };
      }
      const message = reportError(error, set);
      patchJob({ status: 'failed', error: message });
      return { error: message };
    }
  }

  return {
    ready: false,
    projects: [],
    projectId: '',
    generations: [],
    selectedId: null,
    pickedIds: [],
    jobs: [],
    brief: loadBrief(),
    refs: [],
    personaIds: [],
    personas: [],
    library: [],
    brand: EMPTY_BRAND,
    view: 'image',
    safeZones: false,
    maskMode: false,
    hasMask: false,
    scoring: null,
    ranking: null,
    ranking_busy: false,
    lastError: null,

    init: async () => {
      const [projects, personas, library, brand] = await Promise.all([
        db.listProjects(),
        db.listPersonas(),
        db.listLibrary(),
        db.getBrandKit(),
      ]);
      set({ projects, personas, library, brand: { ...EMPTY_BRAND, ...brand } });
      let lastId: string | null = null;
      try {
        lastId = localStorage.getItem('nt_project');
      } catch {
        /* ignore */
      }
      const target = projects.find((p) => p.id === lastId) ?? projects[0];
      if (target) await get().openProject(target.id);
      else await get().newProject();
      set({ ready: true });
    },

    newProject: async (name) => {
      const now = Date.now();
      const project: Project = { id: db.uid('p_'), name: name ?? t('topbar.untitled'), createdAt: now, updatedAt: now };
      await db.putProject(project);
      set({ projects: [project, ...get().projects] });
      await get().openProject(project.id);
    },

    openProject: async (id) => {
      get().generations.forEach((g) => revoke(g.blob));
      const generations = await db.listGenerations(id);
      set({ projectId: id, generations, selectedId: generations[0]?.id ?? null, pickedIds: [], ranking: null, maskMode: false });
      try {
        localStorage.setItem('nt_project', id);
      } catch {
        /* ignore */
      }
    },

    renameProject: async (name) => {
      const project = get().projects.find((p) => p.id === get().projectId);
      if (!project || !name.trim()) return;
      const updated = { ...project, name: name.trim(), updatedAt: Date.now() };
      await db.putProject(updated);
      set({ projects: get().projects.map((p) => (p.id === updated.id ? updated : p)) });
    },

    removeProject: async (id) => {
      await db.deleteProject(id);
      const projects = get().projects.filter((p) => p.id !== id);
      set({ projects });
      if (id === get().projectId) {
        if (projects[0]) await get().openProject(projects[0].id);
        else await get().newProject();
      }
    },

    setBrief: (patch) => {
      const brief = { ...get().brief, ...patch };
      set({ brief });
      try {
        localStorage.setItem(BRIEF_KEY, JSON.stringify(brief));
      } catch {
        /* ignore */
      }
    },

    addFiles: async (files, source = 'upload') => {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        try {
          const blob = await normaliseUpload(file);
          if (!get().addRef(blob, source)) break;
        } catch (error) {
          reportError(error, set);
        }
      }
    },

    addRef: (blob, source, label) => {
      if (get().refs.length >= MAX_IMAGES) {
        toast.error(t('brief.tooManyRefs'));
        return false;
      }
      set({ refs: [...get().refs, { id: db.uid('r_'), blob, source, label }] });
      return true;
    },

    removeRef: (id) => set({ refs: get().refs.filter((r) => r.id !== id) }),
    clearRefs: () => set({ refs: [] }),

    togglePersona: (id) => {
      const ids = get().personaIds;
      if (ids.includes(id)) return set({ personaIds: ids.filter((x) => x !== id) });
      if (ids.length >= MAX_PERSONAS) return void toast.error(t('brief.tooManyPersonas'));
      set({ personaIds: [...ids, id] });
    },

    generate: async () => {
      const { brief, refs } = get();
      if (!brief.brief.trim()) return fail(t('brief.needPrompt'));
      const apiKey = checkKey();
      if (!apiKey) return [{ error: t('brief.needKey') }];

      const settings = useSettings.getState();
      const attached = [
        ...personaImages(),
        ...brandImages(),
        ...refs.map((r) => ({ blob: r.blob, role: { kind: 'reference', label: r.label } as ImageRole })),
      ];
      if (attached.length > MAX_IMAGES) return fail(t('brief.tooManyRefs'));

      const fullPrompt = buildGenerationPrompt({
        brief: brief.brief,
        overlayText: brief.overlayText,
        textMode: brief.textMode,
        videoTitle: brief.videoTitle,
        aspectRatio: settings.aspectRatio,
        style: findStyle(brief.styleId)?.prompt,
        roles: attached.map((a) => a.role),
        brand: get().brand,
      });
      const params = settings.params();
      if (get().view === 'compare') set({ view: 'image' });
      const batch = { shown: false };

      return Promise.all(
        Array.from({ length: settings.count }, () =>
          runJob({
            kind: 'generate',
            prompt: brief.brief,
            fullPrompt,
            images: attached.map((a) => a.blob),
            params,
            videoTitle: brief.videoTitle || undefined,
            apiKey,
            batch,
          }),
        ),
      );
    },

    edit: async (instruction, opts) => {
      const source = get().generations.find((g) => g.id === get().selectedId);
      if (!source || !instruction.trim()) return [];
      const apiKey = checkKey();
      if (!apiKey) return [{ error: t('brief.needKey') }];

      const settings = useSettings.getState();
      const params: GenerationParams = { ...settings.params(), aspectRatio: source.params.aspectRatio };
      const painted = get().maskMode && get().hasMask ? maskCanvas : null;

      if (opts?.mask || painted) {
        let mask = opts?.mask;
        if (!mask && painted) {
          // Snapshot the mask: the user may keep painting while this runs.
          mask = document.createElement('canvas');
          mask.width = painted.width;
          mask.height = painted.height;
          mask.getContext('2d')?.drawImage(painted, 0, 0);
        }
        if (!mask) return [];
        const regionMask = mask;
        const highlighted = await highlightRegion(source.blob, regionMask);
        const outcome = await runJob({
          kind: 'region',
          prompt: instruction,
          fullPrompt: buildRegionEditPrompt(instruction),
          // Clean image first (what gets edited), marked copy second (where to edit):
          // sending only the marked copy lets the magenta tint bleed into the result.
          images: [source.blob, highlighted],
          params,
          parentId: source.id,
          videoTitle: source.videoTitle,
          apiKey,
          finalize: (edited) => mergeWithMask(source.blob, edited, regionMask),
          batch: { shown: false },
        });
        return [outcome];
      }

      // Re-send selected people so their identity doesn't drift over successive edits.
      const people = personaImages().slice(0, MAX_IMAGES - 1);
      const outcome = await runJob({
        kind: 'edit',
        prompt: instruction,
        fullPrompt: buildEditPrompt(instruction, people.map((p) => p.role)),
        images: [source.blob, ...people.map((p) => p.blob)],
        params,
        parentId: source.id,
        videoTitle: source.videoTitle,
        apiKey,
        batch: { shown: false },
      });
      return [outcome];
    },

    cancelJob: (id) => {
      get().jobs.find((j) => j.id === id)?.controller.abort();
    },
    dismissJob: (id) => set({ jobs: get().jobs.filter((j) => j.id !== id) }),
    cancelAll: () => get().jobs.forEach((j) => j.status === 'running' && j.controller.abort()),

    select: (id) => set({ selectedId: id, maskMode: false, hasMask: false }),

    togglePick: (id) => {
      const picked = get().pickedIds;
      set({ pickedIds: picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id].slice(-4), ranking: null });
    },
    clearPicks: () => set({ pickedIds: [], ranking: null }),

    toggleFavorite: async (id) => {
      const gen = get().generations.find((g) => g.id === id);
      if (!gen) return;
      const updated = { ...gen, favorite: !gen.favorite };
      await db.putGeneration(updated);
      set({ generations: get().generations.map((g) => (g.id === id ? updated : g)) });
    },

    removeGeneration: async (id) => {
      const gen = get().generations.find((g) => g.id === id);
      await db.deleteGeneration(id);
      revoke(gen?.blob);
      const generations = get().generations.filter((g) => g.id !== id);
      set({
        generations,
        selectedId: get().selectedId === id ? (generations[0]?.id ?? null) : get().selectedId,
        pickedIds: get().pickedIds.filter((x) => x !== id),
      });
    },

    reuse: (gen) => {
      const s = useSettings.getState();
      s.set({ model: gen.params.model, aspectRatio: gen.params.aspectRatio, resolution: gen.params.resolution });
      if (gen.kind === 'generate' || gen.kind === 'import') get().setBrief({ brief: gen.prompt, videoTitle: gen.videoTitle ?? get().brief.videoTitle });
    },

    score: async (id) => {
      const gen = get().generations.find((g) => g.id === id);
      if (!gen) return { error: t('agent.unknownImage', { id }) };
      const apiKey = checkKey();
      if (!apiKey) return { error: t('brief.needKey') };
      set({ scoring: id });
      try {
        const settings = useSettings.getState();
        const score = await scoreThumbnail(
          { provider: settings.provider, apiKey },
          gen.blob,
          { videoTitle: gen.videoTitle || get().brief.videoTitle, lang: settings.lang },
        );
        const updated = { ...gen, score };
        await db.putGeneration(updated);
        set({ generations: get().generations.map((g) => (g.id === id ? updated : g)) });
        return { value: score };
      } catch (error) {
        return { error: reportError(error, set) };
      } finally {
        set({ scoring: null });
      }
    },

    rankPicked: async () => {
      const ids = get().pickedIds;
      const gens = ids.map((id) => get().generations.find((g) => g.id === id)).filter((g): g is Generation => !!g);
      if (gens.length < 2) return { error: t('agent.needTwo') };
      const apiKey = checkKey();
      if (!apiKey) return { error: t('brief.needKey') };
      set({ ranking_busy: true });
      try {
        const settings = useSettings.getState();
        const result = await rankThumbnails(
          { provider: settings.provider, apiKey },
          gens.map((g) => g.blob),
          { videoTitle: gens[0].videoTitle || get().brief.videoTitle, lang: settings.lang },
        );
        set({ ranking: { ids: gens.map((g) => g.id), result } });
        return { value: result };
      } catch (error) {
        return { error: reportError(error, set) };
      } finally {
        set({ ranking_busy: false });
      }
    },

    reloadPersonas: async () => {
      const personas = await db.listPersonas();
      set({ personas, personaIds: get().personaIds.filter((id) => personas.some((p) => p.id === id)) });
    },
    reloadLibrary: async () => set({ library: await db.listLibrary() }),
    saveBrand: async (kit) => {
      const updated = { ...kit, updatedAt: Date.now() };
      await db.putBrandKit(updated);
      set({ brand: updated });
    },
    saveToLibrary: async (blob) => {
      await db.putLibraryImage({ id: db.uid('l_'), blob, createdAt: Date.now() });
      await get().reloadLibrary();
      toast.success(t('canvas.savedToLibrary'));
    },

    setView: (view) => set({ view, maskMode: view === 'image' ? get().maskMode : false }),
    setSafeZones: (on) => set({ safeZones: on }),
    setMaskMode: (on) => set({ maskMode: on, hasMask: on ? get().hasMask : false, view: on ? 'image' : get().view }),
    setHasMask: (on) => set({ hasMask: on }),
    showError: (report) => set({ lastError: report }),
  };
});

export function selectedGeneration(s: WorkspaceState): Generation | undefined {
  return s.generations.find((g) => g.id === s.selectedId);
}

/** Walk parentId links back to the root, oldest first. */
export function lineage(generations: Generation[], id: string | null): Generation[] {
  const byId = new Map(generations.map((g) => [g.id, g]));
  const chain: Generation[] = [];
  let current = id ? byId.get(id) : undefined;
  while (current) {
    chain.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  // Also show direct children of the selected image (branches made from it).
  const children = generations.filter((g) => g.parentId === id).sort((a, b) => a.createdAt - b.createdAt);
  return [...chain, ...children];
}
