import path from "node:path";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
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
      // Prerender disabled: when enabled on the Cloudflare Workers target, the
      // prerendered HTML is served without <script> tags so React never hydrates
      // client-side (counters stay at 0, Pathway scroll doesn't drive, login
      // onSubmit never fires). Every page now SSR's through the Worker which
      // includes the hydration script tags.
      prerender: { enabled: false },
    }),
    viteReact(),
    // Cloudflare adapter — must come AFTER tanstackStart so the start plugin
    // produces the SSR bundle the CF plugin then wraps into a Worker.
    // Reads wrangler.toml for bindings (D1, R2) and cron triggers.
    cloudflare(),
  ],
});
