import { defineConfig } from 'vite';

export default defineConfig({
  // Permet de déployer dans un sous-dossier (comme sur GitHub Pages)
  base: '/NanoThumbnail/', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});

