import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'netlify/**/*.test.ts', 'mcp/**/*.test.ts'],
  },
});
