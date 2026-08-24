import { defineConfig } from 'vite';
import electronPlugin from 'vite-plugin-electron';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    electronPlugin({
      entry: 'electron/main.ts',
      preload: 'electron/preload.ts',
      vite: {
        build: {
          outDir: 'dist'
        }
      }
    }),
    react(),
    nodePolyfills()
  ],
  resolve: {
    alias: {
      '@': '/src',
      '@core': '/src/core',
      '@navigation': '/src/navigation',
      '@tabs': '/src/tabs',
      '@address-bar': '/src/address-bar',
      '@bookmarks': '/src/bookmarks',
      '@history': '/src/history',
      '@downloads': '/src/downloads',
      '@themes': '/src/themes',
      '@settings': '/src/settings',
      '@untoz-universe': '/src/untoz-universe',
      '@workspace': '/src/workspace',
      '@extensions': '/src/extensions',
      '@developer-tools': '/src/developer-tools',
      '@ai': '/src/ai',
      '@cloud': '/src/cloud'
    }
  },
  server: {
    port: 3000,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
});