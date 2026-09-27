/**
 * Studio side of the agent tools: each one maps to store actions, so whatever an
 * agent does is exactly what a click would do, and the user watches it happen.
 * Definitions (names, schemas) live in protocol.ts.
 */
import { useWorkspace, MAX_PERSONAS, type Brief, type Outcome, type ViewMode } from '../stores/workspace';
import { useSettings } from '../stores/settings';
import { STYLES, findStyle } from '../lib/styles';
import { suggestConcepts } from '../lib/ai';
import { blobToBase64, exportForYouTube, extensionFor, normaliseUpload, prepareReference, rectMask } from '../lib/images';
import { extractVideoId, fetchThumbnail, fetchVideoTitle } from '../lib/youtube';
import { listProjects } from '../lib/db';
import type { AspectRatio, Generation, ModelId, Resolution } from '../lib/types';
import type { AddReferenceArgs, ToolContent, ToolResult } from './protocol';

type Args = Record<string, unknown>;
type Handler = (args: Args) => Promise<ToolResult>;

export class ToolError extends Error {}

// ─── Helpers ─────────────────────────────────────────────

const ws = () => useWorkspace.getState();

function json(value: unknown): ToolContent {
  return { type: 'text', text: JSON.stringify(value, null, 2) };
}
function ok(value: unknown, extra: ToolContent[] = []): ToolResult {
  return { content: [json(value), ...extra] };
}

function str(args: Args, key: string): string | undefined {
  const v = args[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string') throw new ToolError(`"${key}" must be a string`);
  return v;
}
function oneOf<T extends string | number>(args: Args, key: string, values: readonly T[]): T | undefined {
  const v = args[key];
  if (v === undefined || v === null) return undefined;
  if (!values.includes(v as T)) throw new ToolError(`"${key}" must be one of ${values.join(', ')}`);
  return v as T;
}
function bool(args: Args, key: string): boolean | undefined {
  const v = args[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'boolean') throw new ToolError(`"${key}" must be a boolean`);
  return v;
}
function strings(args: Args, key: string): string[] | undefined {
  const v = args[key];
  if (v === undefined || v === null) return undefined;
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) throw new ToolError(`"${key}" must be an array of strings`);
  return v as string[];
}

/** The generation an id points to, or the selected one. */
function target(args: Args): Generation {
  const id = str(args, 'id') ?? ws().selectedId;
  if (!id) throw new ToolError('No thumbnail selected: pass an id (see get_state).');
  const gen = ws().generations.find((g) => g.id === id);
  if (!gen) throw new ToolError(`Unknown thumbnail "${id}" in the current project (see get_state, or open_project).`);
  return gen;
}

function summary(g: Generation) {
  return {
    id: g.id,
    kind: g.kind,
    parentId: g.parentId,
    prompt: g.prompt.length > 240 ? `${g.prompt.slice(0, 240)}…` : g.prompt,
    size: `${g.width}×${g.height}`,
    model: g.params.model,
    createdAt: new Date(g.createdAt).toISOString(),
    favorite: !!g.favorite,
    score: g.score?.overall,
  };
}

async function preview(blob: Blob, full = false): Promise<ToolContent> {
  if (full) return { type: 'image', ...(await blobToBase64(blob)) };
  const url = await prepareReference(blob, 768, 150_000);
  const comma = url.indexOf(',');
  return { type: 'image', data: url.slice(comma + 1), mimeType: url.slice(5, url.indexOf(';')) };
}

async function withPreviews(outcomes: Outcome<Generation>[], previews: boolean): Promise<ToolResult> {
  const created = outcomes.flatMap((o) => (o.value ? [summary(o.value)] : []));
  const errors = outcomes.flatMap((o) => (o.error ? [o.error] : []));
  if (!created.length) return { content: [json({ errors: errors.length ? errors : ['Nothing was generated.'] })], isError: true };
  const images = previews ? await Promise.all(outcomes.flatMap((o) => (o.value ? [preview(o.value.blob)] : []))) : [];
  return ok({ created, errors: errors.length ? errors : undefined }, images);
}

function requireKey(): string {
  const key = useSettings.getState().apiKey();
  if (!key) throw new ToolError('No API key set in the studio. Ask the user to add one in Settings.');
  return key;
}

const BRIEF_KEYS = ['videoTitle', 'brief', 'overlayText', 'textMode', 'styleId'] as const;

function applyBrief(args: Args): void {
  const patch: Partial<Brief> = {};
  for (const key of BRIEF_KEYS) {
    const value = key === 'textMode' ? oneOf(args, key, ['render', 'space'] as const) : str(args, key);
    if (value !== undefined) (patch as Record<string, string>)[key] = value;
  }
  if (patch.styleId && !findStyle(patch.styleId)) throw new ToolError(`Unknown styleId "${patch.styleId}" (see list_styles).`);
  if (Object.keys(patch).length) ws().setBrief(patch);
}

// ─── Tools ───────────────────────────────────────────────

export const handlers: Record<string, Handler> = {
  get_state: async (args) => {
    const s = ws();
    const settings = useSettings.getState();
    const limit = typeof args.limit === 'number' ? Math.max(1, Math.min(100, args.limit)) : 20;
    const project = s.projects.find((p) => p.id === s.projectId);
    return ok({
      project: project && { id: project.id, name: project.name },
      brief: s.brief,
      output: {
        provider: settings.provider,
        apiKeySet: !!settings.apiKey(),
        model: settings.model,
        aspectRatio: settings.aspectRatio,
        resolution: settings.resolution,
        count: settings.count,
      },
      references: s.refs.map((r) => ({ id: r.id, source: r.source, label: r.label })),
      people: s.personas.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        photos: p.photos.length,
        selected: s.personaIds.includes(p.id),
      })),
      brandKit: { enabled: s.brand.enabled, channelName: s.brand.channelName || undefined },
      jobs: s.jobs.map((j) => ({ id: j.id, kind: j.kind, status: j.status, seconds: Math.round(j.elapsed / 1000), error: j.error })),
      view: s.view,
      selectedId: s.selectedId,
      pickedIds: s.pickedIds,
      totalThumbnails: s.generations.length,
      thumbnails: s.generations.slice(0, limit).map(summary),
    });
  },

  list_styles: async () => {
    const lang = useSettings.getState().lang;
    return ok(STYLES.map((st) => ({ id: st.id, name: st.name[lang], goodFor: st.hint[lang] })));
  },

  list_projects: async () => {
    const current = ws().projectId;
    const projects = await listProjects();
    return ok(projects.map((p) => ({ id: p.id, name: p.name, current: p.id === current, updatedAt: new Date(p.updatedAt).toISOString() })));
  },

  open_project: async (args) => {
    const id = str(args, 'id');
    if (!id || !ws().projects.some((p) => p.id === id)) throw new ToolError(`Unknown project "${id}" (see list_projects).`);
    await ws().openProject(id);
    return ok({ opened: id, thumbnails: ws().generations.length });
  },

  new_project: async (args) => {
    await ws().newProject(str(args, 'name')?.trim() || undefined);
    return ok({ created: ws().projectId });
  },

  rename_project: async (args) => {
    const name = str(args, 'name')?.trim();
    if (!name) throw new ToolError('"name" is required');
    await ws().renameProject(name);
    return ok({ renamed: ws().projectId, name });
  },

  set_brief: async (args) => {
    applyBrief(args);
    return ok({ brief: ws().brief });
  },

  set_output: async (args) => {
    const patch = {
      model: oneOf<ModelId>(args, 'model', ['nano-banana-pro', 'nano-banana-2']),
      aspectRatio: oneOf<AspectRatio>(args, 'aspectRatio', ['16:9', '9:16', '4:3', '1:1', '21:9']),
      resolution: oneOf<Resolution>(args, 'resolution', ['1K', '2K', '4K']),
      count: oneOf(args, 'count', [1, 2, 4] as const),
    };
    useSettings.getState().set(Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)));
    const { model, aspectRatio, resolution, count } = useSettings.getState();
    return ok({ model, aspectRatio, resolution, count });
  },

  add_reference: async (args) => {
    const { data, mimeType, label } = args as unknown as AddReferenceArgs;
    if (typeof data !== 'string' || !mimeType?.startsWith('image/')) throw new ToolError('Not an image.');
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const blob = await normaliseUpload(new Blob([bytes], { type: mimeType }));
    if (!ws().addRef(blob, 'upload', label || undefined)) throw new ToolError('Reference limit reached (14 images).');
    const ref = ws().refs[ws().refs.length - 1];
    return ok({ added: ref.id, references: ws().refs.length });
  },

  remove_references: async (args) => {
    const ids = strings(args, 'ids');
    if (ids) ids.forEach((id) => ws().removeRef(id));
    else ws().clearRefs();
    return ok({ references: ws().refs.map((r) => ({ id: r.id, label: r.label })) });
  },

  remix_youtube: async (args) => {
    const videoId = extractVideoId(str(args, 'url') ?? '');
    if (!videoId) throw new ToolError('Not a YouTube URL.');
    const [thumb, title] = await Promise.all([fetchThumbnail(videoId), fetchVideoTitle(videoId)]);
    if (!thumb) throw new ToolError('Could not load this video thumbnail.');
    if (!ws().addRef(thumb, 'youtube', title ? `YouTube: ${title}` : 'YouTube thumbnail')) {
      throw new ToolError('Reference limit reached (14 images).');
    }
    const ref = ws().refs[ws().refs.length - 1];
    return ok({ added: ref.id, videoTitle: title }, [await preview(thumb)]);
  },

  set_people: async (args) => {
    const ids = strings(args, 'ids') ?? [];
    const known = new Set(ws().personas.map((p) => p.id));
    const unknown = ids.filter((id) => !known.has(id));
    if (unknown.length) throw new ToolError(`Unknown people: ${unknown.join(', ')} (see get_state).`);
    if (ids.length > MAX_PERSONAS) throw new ToolError(`At most ${MAX_PERSONAS} people.`);
    useWorkspace.setState({ personaIds: [...new Set(ids)] });
    return ok({ selected: ws().personaIds });
  },

  suggest_concepts: async (args) => {
    const apiKey = requireKey();
    const { provider, lang } = useSettings.getState();
    const concepts = await suggestConcepts(
      { provider, apiKey },
      {
        videoTitle: str(args, 'videoTitle') ?? ws().brief.videoTitle,
        idea: str(args, 'idea') ?? ws().brief.brief,
        lang,
        styles: STYLES.map((st) => ({ id: st.id, name: st.name.en })),
      },
    );
    return ok({ concepts, hint: 'Apply one with generate({ brief, overlayText, styleId }).' });
  },

  generate: async (args) => {
    // Validate before touching the brief: a failed call must not wipe what the user typed.
    if (!(str(args, 'brief') ?? ws().brief.brief).trim()) throw new ToolError('The brief is empty: pass "brief".');
    const count = oneOf(args, 'count', [1, 2, 4] as const);
    requireKey();
    applyBrief(args);
    if (count) useSettings.getState().set({ count });
    return withPreviews(await ws().generate(), bool(args, 'previews') ?? true);
  },

  edit_thumbnail: async (args) => {
    const instruction = str(args, 'instruction')?.trim();
    if (!instruction) throw new ToolError('"instruction" is required');
    const gen = target(args);
    requireKey();
    if (gen.id !== ws().selectedId) ws().select(gen.id);
    const region = args.region as { x: number; y: number; width: number; height: number } | undefined;
    if (region && [region.x, region.y, region.width, region.height].some((n) => typeof n !== 'number' || n < 0 || n > 1)) {
      throw new ToolError('"region" values are fractions between 0 and 1.');
    }
    const mask = region ? rectMask(gen.width, gen.height, region) : undefined;
    return withPreviews(await ws().edit(instruction, { mask }), bool(args, 'previews') ?? true);
  },

  view_thumbnail: async (args) => {
    const gen = target(args);
    const full = oneOf(args, 'size', ['preview', 'full'] as const) === 'full';
    const byId = new Map(ws().generations.map((g) => [g.id, g]));
    const ancestors: string[] = [];
    for (let p = gen.parentId; p; p = byId.get(p)?.parentId) ancestors.unshift(p);
    return ok(
      {
        ...summary(gen),
        prompt: gen.prompt,
        fullPrompt: gen.fullPrompt,
        videoTitle: gen.videoTitle,
        lineage: ancestors,
        children: ws().generations.filter((g) => g.parentId === gen.id).map((g) => g.id),
        score: gen.score,
      },
      [await preview(gen.blob, full)],
    );
  },

  select_thumbnail: async (args) => {
    const gen = target(args);
    ws().select(gen.id);
    if (ws().view === 'compare') ws().setView('image');
    return ok({ selected: gen.id });
  },

  set_favorite: async (args) => {
    const gen = target(args);
    const favorite = bool(args, 'favorite') ?? true;
    if (!!gen.favorite !== favorite) await ws().toggleFavorite(gen.id);
    return ok({ id: gen.id, favorite });
  },

  score_thumbnail: async (args) => {
    const gen = target(args);
    requireKey();
    const { value, error } = await ws().score(gen.id);
    if (!value) throw new ToolError(error ?? 'Scoring failed.');
    return ok({ id: gen.id, ...value, createdAt: undefined });
  },

  rank_thumbnails: async (args) => {
    const ids = [...new Set(strings(args, 'ids') ?? [])];
    if (ids.length < 2 || ids.length > 4) throw new ToolError('Pass 2 to 4 ids.');
    ids.forEach((id) => target({ id }));
    requireKey();
    useWorkspace.setState({ pickedIds: ids, ranking: null });
    ws().setView('compare');
    const { value, error } = await ws().rankPicked();
    if (!value) throw new ToolError(error ?? 'Ranking failed.');
    return ok({
      ranking: value.order.map((i, rank) => ({ rank: rank + 1, id: ids[i], reason: value.reasons[i] })),
      winnerWhy: value.winnerWhy,
    });
  },

  export_thumbnail: async (args) => {
    const gen = target(args);
    const youtube = (oneOf(args, 'format', ['youtube', 'original'] as const) ?? 'youtube') === 'youtube';
    const blob = youtube ? await exportForYouTube(gen.blob) : gen.blob;
    const { data, mimeType } = await blobToBase64(blob);
    return {
      content: [json({ id: gen.id, format: youtube ? 'youtube' : 'original', bytes: blob.size })],
      file: { data, mimeType, name: `thumbnail-${gen.id}${youtube ? '-youtube' : ''}.${extensionFor(blob)}` },
    };
  },

  set_view: async (args) => {
    const view = oneOf<ViewMode>(args, 'view', ['image', 'feed', 'compare']);
    const safeZones = bool(args, 'safeZones');
    if (view) ws().setView(view);
    if (safeZones !== undefined) ws().setSafeZones(safeZones);
    return ok({ view: ws().view, safeZones: ws().safeZones });
  },

  cancel_jobs: async () => {
    const running = ws().jobs.filter((j) => j.status === 'running').length;
    ws().cancelAll();
    return ok({ canceled: running });
  },
};

export async function runTool(name: string, args: Args): Promise<ToolResult> {
  const handler = handlers[name];
  if (!handler) return { content: [{ type: 'text', text: `Unknown tool "${name}".` }], isError: true };
  try {
    return await handler(args ?? {});
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { content: [{ type: 'text', text: message }], isError: true };
  }
}
