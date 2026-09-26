import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Builds the Studio UI into /static/studio so the SPX server can serve it
// without a build step at runtime. Entry names are stable because
// views/view-studio.handlebars references them directly.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: '/studio/',
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    outDir: fileURLToPath(new URL('../static/studio', import.meta.url)),
    emptyOutDir: true,
    sourcemap: mode === 'development',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: fileURLToPath(new URL('./src/main.tsx', import.meta.url)),
      output: {
        entryFileNames: 'studio.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (asset) => (asset.names?.[0]?.endsWith('.css') ? 'studio.css' : 'assets/[name]-[hash][extname]')
      }
    }
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
}));
