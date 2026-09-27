# nanothumbnail-mcp

MCP server that lets an AI agent (Claude Code, Claude Desktop, Cursor…) drive the [NanoThumbnail](https://nanothumbnail.com) studio open in your browser: brief, generate, edit, score, rank, export.

```
agent ──MCP (stdio)──▶ nanothumbnail-mcp ──WebSocket 127.0.0.1──▶ studio tab ──▶ Nano Banana (your key)
```

The server only relays. API keys, projects and images stay in the browser; the studio runs every action exactly as a click would, and you watch it happen.

## Setup

```bash
claude mcp add nanothumbnail -- npx -y nanothumbnail-mcp
```

Then ask the agent to "open the NanoThumbnail studio": it opens a pairing link, you click **Allow** once in the studio. The studio then reconnects by itself whenever the agent runs.

### Companion skill

The tools say *what* the agent can do; the skill teaches it *how* to make a good thumbnail (workflow, brief writing, critique, credit discipline):

```bash
npx skills add yoanbernabeu/NanoThumbnail --skill nanothumbnail
```

Source: [`skills/nanothumbnail/`](../skills/nanothumbnail/SKILL.md).

## Configuration (env)

| Variable | Default | |
|---|---|---|
| `NANOTHUMBNAIL_URL` | `https://nanothumbnail.com/app/` | Studio opened for pairing |
| `NANOTHUMBNAIL_PORT` | `17821` | Local WebSocket port |
| `NANOTHUMBNAIL_ORIGINS` | | Extra allowed page origins, comma-separated |
| `NANOTHUMBNAIL_TOKEN` | generated, kept in `~/.config/nanothumbnail/mcp.json` | Pairing token |

## Security

- Listens on `127.0.0.1` only, accepts only the studio origins, then requires the pairing token.
- The studio asks for confirmation before accepting a pairing link, shows every agent action, and can disconnect at any time.
- Agents can't read or change API keys, and can't delete anything.

## Local development

```bash
npm run build -w nanothumbnail-mcp        # → mcp/dist/index.js
npm run dev                               # studio on http://localhost:4321
claude mcp add nanothumbnail-dev -e NANOTHUMBNAIL_URL=http://localhost:4321/app -- node "$PWD/mcp/dist/index.js"
```

Tool definitions are shared with the studio (`src/app/agent/protocol.ts`); handlers live in `src/app/agent/tools.ts`.
