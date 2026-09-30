/**
 * Static demo build: the whole app as a browser-only single page, with the
 * API routes answered in the page by the offline demo coach. Used to publish
 * a click-through demo; the real product is the Next.js app.
 *
 *   npm run build:demo   →   .demo-dist/odysseusx.html
 */
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  root: here("."),
  base: "./",
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^next\/link$/, replacement: here("./shims/next-link.tsx") },
      { find: /^next\/navigation$/, replacement: here("./shims/next-navigation.ts") },
      { find: /^next\/headers$/, replacement: here("./shims/next-headers.ts") },
      { find: /^@\/lib\/ai\/client$/, replacement: here("./shims/ai-client.ts") },
      { find: /^@\//, replacement: here("../src/") },
    ],
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": "{}",
  },
  build: {
    outDir: here("../.demo-dist"),
    emptyOutDir: true,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    modulePreload: false,
    // One self-contained bundle is the point of this build.
    chunkSizeWarningLimit: 4096,
  },
});
