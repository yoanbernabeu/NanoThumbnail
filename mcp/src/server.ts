import { spawn } from 'node:child_process';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, type CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { STUDIO_TOOLS, type ToolDef, type ToolResult } from '../../src/app/agent/protocol.ts';
import type { Config } from './config.ts';
import { StudioNotConnected, type StudioRelay } from './relay.ts';
import { exportPath, loadImage, writeExport } from './files.ts';

export const VERSION = '0.1.0';

const OPEN_STUDIO: ToolDef = {
  name: 'open_studio',
  description:
    'Open the NanoThumbnail studio in the browser and pair it with this agent. Call it when another tool says the studio is not connected. The user must click "Allow" in the studio once.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
};

const INSTRUCTIONS = `NanoThumbnail is a YouTube thumbnail studio running in the user's browser (Google Nano Banana models, the user's own API key). These tools drive it live: the user watches every change.
Typical flow: get_state → (new_project) → set_brief / suggest_concepts → generate → view/score_thumbnail → edit_thumbnail (one change at a time) → rank_thumbnails → export_thumbnail.
Generations cost the user API credits: prefer count 1-2 while exploring and ask before large batches. If a tool says the studio is not connected, call open_studio.`;

function text(value: string, isError = false): CallToolResult {
  return { content: [{ type: 'text', text: value }], isError };
}

function openInBrowser(url: string): void {
  const [cmd, args] =
    process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]];
  try {
    spawn(cmd, args, { detached: true, stdio: 'ignore' }).on('error', () => {}).unref();
  } catch {
    /* no browser: the pairing link is returned to the agent anyway */
  }
}

export function createServer(config: Config, relay: StudioRelay): Server {
  const server = new Server({ name: 'nanothumbnail', version: VERSION }, { capabilities: { tools: {} }, instructions: INSTRUCTIONS });
  const pairingUrl = `${config.studioUrl}#agent=${config.port}:${config.token}`;
  const pairingCode = `${config.port}:${config.token}`;

  function notConnected(): CallToolResult {
    if (relay.listenError) {
      return text(
        `The bridge could not listen on 127.0.0.1:${config.port} (${relay.listenError.message}). Another NanoThumbnail MCP server is probably running (another agent session): close it, or set NANOTHUMBNAIL_PORT.`,
        true,
      );
    }
    return text(`The NanoThumbnail studio is not connected. Call open_studio, or ask the user to open ${config.studioUrl} → Agent (MCP) → pairing code ${pairingCode}.`, true);
  }

  async function openStudio(): Promise<CallToolResult> {
    if (relay.listenError) return notConnected();
    if (relay.connected) return text('The studio is already connected.');
    openInBrowser(pairingUrl);
    const ok = await relay.waitForStudio(90_000);
    if (ok) return text('Studio connected. Start with get_state.');
    return text(
      `Opened ${config.studioUrl} but the studio has not connected yet. Ask the user to click "Allow" in the Agent (MCP) dialog, or to paste this pairing code there: ${pairingCode}. Then retry.`,
      true,
    );
  }

  async function relayCall(name: string, args: Record<string, unknown>): Promise<CallToolResult> {
    let forwarded = args;
    if (name === 'add_reference') {
      const image = await loadImage({ path: args.path as string | undefined, url: args.url as string | undefined });
      forwarded = { data: image.data, mimeType: image.mimeType, label: (args.label as string | undefined) ?? image.name };
    }
    const result: ToolResult = await relay.call(name, forwarded);
    if (result.file && !result.isError) {
      const path = await exportPath(args.path as string | undefined, result.file.name);
      const bytes = await writeExport(path, result.file.data);
      result.content.push({ type: 'text', text: `Saved to ${path} (${Math.round(bytes / 1024)} KB).` });
    }
    return { content: result.content, isError: result.isError };
  }

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [OPEN_STUDIO, ...STUDIO_TOOLS] as never }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name } = request.params;
    const args = (request.params.arguments ?? {}) as Record<string, unknown>;
    if (name === OPEN_STUDIO.name) return openStudio();
    if (!STUDIO_TOOLS.some((t) => t.name === name)) return text(`Unknown tool "${name}".`, true);
    if (!relay.connected) return notConnected();
    try {
      return await relayCall(name, args);
    } catch (error) {
      if (error instanceof StudioNotConnected) return notConnected();
      return text(error instanceof Error ? error.message : String(error), true);
    }
  });

  return server;
}
