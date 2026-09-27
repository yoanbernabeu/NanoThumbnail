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
  security: {
    // Emits a <meta> CSP with hashes for every script Astro renders.
    csp: {
      directives: [
        "default-src 'self'",
        // Generated images (Replicate CDN), YouTube thumbnails, blobs/data for local images
        "img-src 'self' data: blob: https://replicate.delivery https://*.replicate.delivery https://i.ytimg.com https://img.youtube.com",
        // Gemini and OpenRouter are called directly; Replicate goes through our function; images are downloaded from Replicate's CDN
        "connect-src 'self' data: blob: https://generativelanguage.googleapis.com https://openrouter.ai https://replicate.delivery https://*.replicate.delivery https://www.youtube.com https://i.ytimg.com https://img.youtube.com",
        "font-src 'self'",
        "worker-src 'self'",
        "manifest-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      // Radix/sonner set inline styles at runtime; scripts stay strictly hashed.
      styleDirective: { resources: ["'self'", "'unsafe-inline'"] },
    },
  },
  build: {
    assets: 'assets',
    // Inline CSS in the HTML: removes a render-blocking request (the site sheet is small).
    inlineStylesheets: 'always'
  },
  // No Markdown code blocks on this site; Shiki's inline styles would conflict with the CSP.
  markdown: { syntaxHighlight: false },
  vite: {
    plugins: [tailwindcss()],
    // Pre-bundle the studio's deps up front: otherwise Vite re-optimizes them
    // mid-session (e.g. after a build) and the island fails with "Outdated Optimize Dep".
    optimizeDeps: {
      include: [
        'react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime',
        'radix-ui', 'lucide-react', 'sonner', 'cmdk', 'react-resizable-panels', 'zustand',
        'idb', 'fflate', 'clsx', 'tailwind-merge', 'class-variance-authority',
      ],
    },
    build: {
      cssCodeSplit: true
    }
  }
});
