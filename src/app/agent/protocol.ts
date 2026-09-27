/**
 * Agent bridge: shared between the studio (browser) and the local MCP server (mcp/).
 * Pure data, no DOM or Node APIs: the MCP server bundles this file as-is.
 *
 *   agent ──MCP/stdio──▶ nanothumbnail-mcp ──WebSocket──▶ studio tab ──▶ store actions
 *
 * The server only relays; API keys, projects and images stay in the browser.
 */

export const PROTOCOL_VERSION = 1;
export const DEFAULT_PORT = 17821;

/** Close codes sent by the server. */
export const CLOSE_BAD_TOKEN = 4001;
export const CLOSE_REPLACED = 4002;

// ─── Pairing ─────────────────────────────────────────────

export interface Pairing {
  port: number;
  token: string;
}

/** `<port>:<token>`: the pairing code, also passed to the studio as `#agent=<code>`. */
export function parsePairing(code: string): Pairing | null {
  const m = code.trim().match(/^(\d{2,5}):([\w-]{16,128})$/);
  if (!m) return null;
  const port = Number(m[1]);
  return port > 0 && port < 65536 ? { port, token: m[2] } : null;
}

// ─── Messages ────────────────────────────────────────────

/** studio → server, first message after the socket opens. */
export interface HelloMessage {
  type: 'hello';
  token: string;
  protocol: number;
}

/** server → studio */
export interface WelcomeMessage {
  type: 'welcome';
  protocol: number;
}

/** server → studio */
export interface CallMessage {
  type: 'call';
  id: string;
  tool: string;
  args: Record<string, unknown>;
}

/** studio → server */
export interface ResultMessage {
  type: 'result';
  id: string;
  result: ToolResult;
}

export type StudioMessage = HelloMessage | ResultMessage;
export type ServerMessage = WelcomeMessage | CallMessage;

export type ToolContent = { type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string };

export interface ToolResult {
  content: ToolContent[];
  isError?: boolean;
  /** A file for the server to write to disk (exports); never shown to the agent as-is. */
  file?: { data: string; mimeType: string; name: string };
}

// ─── Tools ───────────────────────────────────────────────

type JSONSchema = Record<string, unknown>;

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}

const obj = (properties: Record<string, JSONSchema> = {}, required: string[] = []): JSONSchema => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
});
const str = (description: string, extra: JSONSchema = {}): JSONSchema => ({ type: 'string', description, ...extra });
const id = str('Thumbnail (generation) id, e.g. "g_…". Defaults to the image selected in the studio.');

const BRIEF_FIELDS: Record<string, JSONSchema> = {
  videoTitle: str('Title of the YouTube video (context for the model, not drawn on the image).'),
  brief: str('The thumbnail idea: who, what, emotion, composition, setting. Any language.'),
  overlayText: str('Text to show on the thumbnail. Keep it to 3-4 words; empty for no text.'),
  textMode: str('"render": the model draws overlayText. "space": leave clean space for text added later.', {
    enum: ['render', 'space'],
  }),
  styleId: str('Style preset id from list_styles, or "" for none.'),
};

/** Tools executed by the studio. The MCP server adds its own (open_studio) and rewrites
 * add_reference (reads files/URLs) and export_thumbnail (writes files). */
export const STUDIO_TOOLS: ToolDef[] = [
  {
    name: 'get_state',
    description:
      'Snapshot of the studio: current project, brief, output settings, attached references, people (personas), running jobs and the most recent thumbnails with their ids, lineage and scores. Call this first.',
    inputSchema: obj({ limit: { type: 'integer', minimum: 1, maximum: 100, description: 'Max thumbnails listed (default 20).' } }),
  },
  {
    name: 'list_styles',
    description: 'The style presets available for styleId, with what each is good for.',
    inputSchema: obj(),
  },
  {
    name: 'list_projects',
    description: 'All projects (each project holds its own thumbnails).',
    inputSchema: obj(),
  },
  {
    name: 'open_project',
    description: 'Switch the studio to another project.',
    inputSchema: obj({ id: str('Project id.') }, ['id']),
  },
  {
    name: 'new_project',
    description: 'Create a project and switch to it. Use one project per video.',
    inputSchema: obj({ name: str('Project name, typically the video title.') }),
  },
  {
    name: 'rename_project',
    description: 'Rename the current project.',
    inputSchema: obj({ name: str('New name.') }, ['name']),
  },
  {
    name: 'set_brief',
    description: 'Fill in the brief (only the fields you pass change). The user sees it update live.',
    inputSchema: obj(BRIEF_FIELDS),
  },
  {
    name: 'set_output',
    description: 'Output settings for the next generations.',
    inputSchema: obj({
      model: str('"nano-banana-pro" (best quality, text) or "nano-banana-2" (faster, cheaper).', {
        enum: ['nano-banana-pro', 'nano-banana-2'],
      }),
      aspectRatio: str('16:9 for YouTube thumbnails.', { enum: ['16:9', '9:16', '4:3', '1:1', '21:9'] }),
      resolution: str('Output resolution.', { enum: ['1K', '2K', '4K'] }),
      count: { type: 'integer', enum: [1, 2, 4], description: 'Variations per generate call.' },
    }),
  },
  {
    name: 'add_reference',
    description:
      'Attach a reference image to the brief (a product, a scene, a style example…). Max 14 images including people. Pass exactly one of path or url.',
    inputSchema: obj({
      path: str('Absolute path of a local image file.'),
      url: str('http(s) URL of an image.'),
      label: str('What the image is, e.g. "the product", "style to imitate". Helps the model use it right.'),
    }),
  },
  {
    name: 'remove_references',
    description: 'Detach reference images from the brief (all of them if ids is omitted).',
    inputSchema: obj({ ids: { type: 'array', items: { type: 'string' }, description: 'Reference ids from get_state.' } }),
  },
  {
    name: 'remix_youtube',
    description: "Attach an existing YouTube video's thumbnail as a reference (to remix or restyle it).",
    inputSchema: obj({ url: str('YouTube video URL or id.') }, ['url']),
  },
  {
    name: 'set_people',
    description:
      'Choose which saved people (personas, see get_state) appear in the thumbnail. Their photos are sent with an identity lock. Max 5.',
    inputSchema: obj({ ids: { type: 'array', items: { type: 'string' }, description: 'Persona ids; [] for none.' } }, ['ids']),
  },
  {
    name: 'suggest_concepts',
    description: 'Ask the studio for 3 distinct thumbnail concepts (brief, overlay text, style) from a title and a rough idea.',
    inputSchema: obj({
      videoTitle: str('Defaults to the brief video title.'),
      idea: str('Rough idea; defaults to the brief.'),
    }),
  },
  {
    name: 'generate',
    description:
      'Generate thumbnails from the brief (fields passed here are saved to the brief first). Waits until done (30-90 s) and returns the new ids with small previews. Costs API credits on the user key.',
    inputSchema: obj({
      ...BRIEF_FIELDS,
      count: { type: 'integer', enum: [1, 2, 4], description: 'Variations (defaults to the output setting).' },
      previews: { type: 'boolean', description: 'Return preview images (default true).' },
    }),
  },
  {
    name: 'edit_thumbnail',
    description:
      'Edit a thumbnail with a plain instruction ("make the background red", "remove the text"). Everything else is kept. With region, only that rectangle changes. Creates a new thumbnail linked to its parent.',
    inputSchema: obj(
      {
        id,
        instruction: str('What to change, one thing at a time works best.'),
        region: obj(
          {
            x: { type: 'number', minimum: 0, maximum: 1, description: 'Left edge, fraction of the width.' },
            y: { type: 'number', minimum: 0, maximum: 1, description: 'Top edge, fraction of the height.' },
            width: { type: 'number', minimum: 0, maximum: 1 },
            height: { type: 'number', minimum: 0, maximum: 1 },
          },
          ['x', 'y', 'width', 'height'],
        ),
        previews: { type: 'boolean', description: 'Return a preview image (default true).' },
      },
      ['instruction'],
    ),
  },
  {
    name: 'view_thumbnail',
    description: 'Look at a thumbnail, with its prompt, lineage and score.',
    inputSchema: obj({
      id,
      size: str('"preview" (768 px, default) or "full".', { enum: ['preview', 'full'] }),
    }),
  },
  {
    name: 'select_thumbnail',
    description: 'Show this thumbnail in the studio canvas (also the default target of edit_thumbnail).',
    inputSchema: obj({ id }, ['id']),
  },
  {
    name: 'set_favorite',
    description: 'Star or unstar a thumbnail.',
    inputSchema: obj({ id, favorite: { type: 'boolean' } }, ['favorite']),
  },
  {
    name: 'score_thumbnail',
    description:
      'Critique a thumbnail as a YouTube packaging expert: 0-100 score, 6 criteria, strengths, improvements and ready-to-apply edit instructions.',
    inputSchema: obj({ id }),
  },
  {
    name: 'rank_thumbnails',
    description: 'Rank 2 to 4 thumbnails by likely click-through, with reasons. Also shows them side by side in the studio.',
    inputSchema: obj({ ids: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 4 } }, ['ids']),
  },
  {
    name: 'export_thumbnail',
    description: 'Save a thumbnail to disk. "youtube" = 1280×720 JPEG under 2 MB, ready to upload.',
    inputSchema: obj({
      id,
      path: str('Destination file or directory (default: current directory).'),
      format: str('Default "youtube".', { enum: ['youtube', 'original'] }),
    }),
  },
  {
    name: 'set_view',
    description: 'Change what the user sees: the image, a YouTube feed mock-up (how it looks among other videos), or the picked thumbnails side by side.',
    inputSchema: obj({
      view: str('Canvas view.', { enum: ['image', 'feed', 'compare'] }),
      safeZones: { type: 'boolean', description: 'Overlay the zones YouTube covers (duration badge…).' },
    }),
  },
  {
    name: 'cancel_jobs',
    description: 'Cancel every running generation.',
    inputSchema: obj(),
  },
];

/** Studio-side shape of add_reference once the server has read the file. */
export interface AddReferenceArgs {
  data: string;
  mimeType: string;
  label?: string;
}
