import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config.ts';
import { StudioRelay } from './relay.ts';
import { createServer } from './server.ts';

// stdout carries the MCP protocol: anything human-readable goes to stderr.
const config = loadConfig();
const relay = new StudioRelay(config);
await relay.listen();
if (relay.listenError) console.error(`[nanothumbnail-mcp] cannot listen on 127.0.0.1:${config.port}: ${relay.listenError.message}`);
else console.error(`[nanothumbnail-mcp] waiting for the studio on ws://127.0.0.1:${config.port}`);

const server = createServer(config, relay);
await server.connect(new StdioServerTransport());

const shutdown = async () => {
  await relay.close();
  process.exit(0);
};
process.stdin.on('close', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
