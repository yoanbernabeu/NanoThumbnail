import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Base path: "/" for Netlify and local dev, "/NanoThumbnail/" for GitHub Pages
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
const basePath = isGitHubPages ? '/NanoThumbnail/' : '/';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  base: basePath,
  integrations: [react()],
  build: {
    assets: 'assets'
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssCodeSplit: true
    }
  }
});
