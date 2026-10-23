import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Relative base so the app works from any sub-path (e.g. GitHub Pages /greek/).
export default defineConfig({
  base: './',
  plugins: [react()],
  // Firebase is ~250 kB gzipped; the service worker caches it after the first visit.
  build: { chunkSizeWarningLimit: 1200 },
});
