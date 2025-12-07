import { defineConfig } from 'astro/config';

// Determine base path: "/" for Netlify and local dev, "/NanoThumbnail/" for GitHub Pages
const isNetlify = process.env.NETLIFY === 'true';
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
const basePath = isGitHubPages ? '/NanoThumbnail/' : '/';

// https://astro.build/config
export default defineConfig({
  // Static output by default (no SSR)
  output: 'static',
  
  // Base path configuration
  base: basePath,
  
  build: {
    assets: 'assets'
  },
  
  vite: {
    build: {
      // Ensure CSS is properly handled
      cssCodeSplit: true
    }
  }
});
