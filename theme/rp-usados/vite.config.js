import { defineConfig } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const themeRoot = dirname(fileURLToPath(import.meta.url));
const allowLan = process.env.RP_USADOS_ALLOW_LAN === '1';
const lanOrigins = (process.env.RP_USADOS_DEV_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
if (allowLan && !lanOrigins.length) throw new Error('LAN requiere RP_USADOS_DEV_ORIGINS explícito.');

export default defineConfig({
  base: "./",
  build: {
    outDir: "assets/dist",
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: {
        app: resolve(themeRoot, "src/scripts/main.js"),
        admin: resolve(themeRoot, "src/scripts/admin.js"),
      },
    },
  },
  server: {
    host: allowLan ? "0.0.0.0" : "127.0.0.1",
    port: 5173,
    strictPort: true,
    cors: { origin: allowLan ? lanOrigins : /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/ },
  },
});
