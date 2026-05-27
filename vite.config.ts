import path from "node:path";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "@tanstack/react-router",
      "@tanstack/react-start",
    ],
  },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      customViteReactPlugin: true,
      server: { entry: "./src/server.ts" },
      prerender: {
        enabled: true,
        crawlLinks: true,
        // /ikf360/* is the logged-in product surface — every loader needs a session
        // and/or a DB query. Prerendering returns 500s; the routes are noindex anyway.
        filter: (page) => !page.path.startsWith("/ikf360"),
      },
    }),
    viteReact(),
  ],
  // NOTE: @cloudflare/vite-plugin was added briefly to deploy to Workers, but
  // the TanStack Start + Workers integration emitted dev-mode hydration script
  // refs in production (no client JS loaded, no Counter animation, no form
  // handlers). Reverted to the Vercel SSR target. D1 + R2 + SMTP2GO HTTP API
  // in src/server/db.ts and src/server/storage.ts work on both targets.
  // wrangler.jsonc + the D1/R2 setup are kept as documentation; deploy goes
  // to Vercel.
});
