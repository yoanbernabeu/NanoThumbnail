import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Static output by default (no SSR)
  output: 'static',
  
  // Base path configuration: Netlify vs GitHub Pages
  base: process.env.NETLIFY === 'true' ? '/' : '/NanoThumbnail/',
  
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
