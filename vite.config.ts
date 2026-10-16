import { defineConfig } from "vite";
import electronPlugin from "vite-plugin-electron";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { randomBytes } from "node:crypto";

// https://vitejs.dev/config/
const devNonce = randomBytes(18).toString("base64");
export default defineConfig(({ command }) => ({
  base: "./",
  html: command === "serve" ? { cspNonce: devNonce } : undefined,
  plugins: [
    {
      name: "untoz-dev-csp",
      apply: "serve",
      transformIndexHtml(html) {
        return html.replace(
          "script-src 'self'",
          `script-src 'self' 'nonce-${devNonce}'`,
        );
      },
    },
    electronPlugin([
      {
        entry: "electron/main.ts",
        onstart(args) {
          // The plugin's default adds --no-sandbox. Always retain Chromium's sandbox.
          if (process.env.UNTOZ_DEV_NO_LAUNCH !== "1")
            return args.startup(["."]);
        },
      },
      {
        entry: "electron/preload.ts",
        onstart(args) {
          args.reload();
        },
      },
    ]),
    react(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
}));
