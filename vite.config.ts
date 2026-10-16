import { defineConfig } from 'vite';
import electronPlugin from 'vite-plugin-electron';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    electronPlugin({
      entry: {
        main: resolve(__dirname, 'electron/main.ts'),
        preload: resolve(__dirname, 'electron/preload.ts'),
      },
      vite: {
        build: {
          outDir: 'dist-electron',
          lib: {
            entry: {
              main: resolve(__dirname, 'electron/main.ts'),
              preload: resolve(__dirname, 'electron/preload.ts'),
            },
            formats: ['cjs'],
            fileName: (_format, entryName) => `${entryName}.js`,
          },
        },
      },
    }),
    react(),
    nodePolyfills(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@navigation': resolve(__dirname, 'src/navigation'),
      '@tabs': resolve(__dirname, 'src/tabs'),
      '@address-bar': resolve(__dirname, 'src/address-bar'),
      '@bookmarks': resolve(__dirname, 'src/bookmarks'),
      '@history': resolve(__dirname, 'src/history'),
      '@downloads': resolve(__dirname, 'src/downloads'),
      '@themes': resolve(__dirname, 'src/themes'),
      '@settings': resolve(__dirname, 'src/settings'),
      '@untoz-universe': resolve(__dirname, 'src/untoz-universe'),
      '@workspace': resolve(__dirname, 'src/workspace'),
      '@extensions': resolve(__dirname, 'src/extensions'),
      '@developer-tools': resolve(__dirname, 'src/developer-tools'),
      '@ai': resolve(__dirname, 'src/ai'),
      '@cloud': resolve(__dirname, 'src/cloud'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
});
