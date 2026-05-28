// Postbuild step: emit Vercel's Build Output API structure under .vercel/output/
// so we don't depend on Vercel's `api/` auto-detection (which silently skipped
// our function when `outputDirectory: dist/client` was set).
//
// Layout produced:
//   .vercel/output/
//     config.json                         routes
//     static/                             dist/client/* copied here
//     functions/api/index.func/
//       index.mjs                         esbuild-bundled handler
//       .vc-config.json                   nodejs20.x runtime metadata
//
// At request time Vercel tries the filesystem (static/) first; anything that
// doesn't match falls through to the catchall route and lands in the function,
// which forwards to the universal `fetch(request, env, ctx)` exported by
// dist/server/server.js (built by vite earlier in `npm run build`).

import * as esbuild from "esbuild";
import { mkdir, cp, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const VO = resolve(ROOT, ".vercel/output");
const STATIC_OUT = resolve(VO, "static");
const FUNC_DIR = resolve(VO, "functions/api/index.func");

const SERVER_BUNDLE = resolve(ROOT, "dist/server/server.js");
if (!existsSync(SERVER_BUNDLE)) {
  console.error(`[vercel-output] dist/server/server.js not found — did vite build run?`);
  process.exit(1);
}

if (existsSync(VO)) await rm(VO, { recursive: true });
await mkdir(STATIC_OUT, { recursive: true });
await mkdir(FUNC_DIR, { recursive: true });

// Static assets — dist/client/* lives under /vercel/output/static/
await cp(resolve(ROOT, "dist/client"), STATIC_OUT, { recursive: true });
console.log(`[vercel-output] static copied → ${STATIC_OUT}`);

// Bundle the server entry into the function directory. esbuild follows the
// import into dist/server/server.js and pulls in all transitive npm deps
// (h3-v2, @tanstack/router-core, react, etc.). node: built-ins stay external.
//
// Vercel's nodejs20.x runtime invokes the handler Node-style (req, res). Our
// server bundle is Workers-shaped `{ fetch(Request) => Response }`, so this
// entry bridges: Node IncomingMessage → Web Request, call server.fetch, then
// stream the Web Response back. Set-Cookie is read via getSetCookie() so
// multiple cookies on one response aren't comma-collapsed into a single header.
await esbuild.build({
  stdin: {
    contents: `
      import { Readable } from "node:stream";
      import server from "./dist/server/server.js";

      export default async function handler(req, res) {
        try {
          const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
          const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
          const url = new URL(req.url || "/", proto + "://" + host);

          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (value == null) continue;
            if (Array.isArray(value)) {
              for (const v of value) headers.append(key, v);
            } else {
              headers.set(key, value);
            }
          }

          const method = (req.method || "GET").toUpperCase();
          const hasBody = method !== "GET" && method !== "HEAD";
          const init = { method, headers };
          if (hasBody) {
            init.body = Readable.toWeb(req);
            init.duplex = "half";
          }

          const request = new Request(url, init);
          const response = await server.fetch(request, {}, {});

          res.statusCode = response.status;

          // Set-Cookie can repeat; everything else is single-valued.
          const setCookies = typeof response.headers.getSetCookie === "function"
            ? response.headers.getSetCookie()
            : [];
          if (setCookies.length > 0) res.setHeader("set-cookie", setCookies);
          response.headers.forEach((value, key) => {
            if (key.toLowerCase() === "set-cookie") return;
            res.setHeader(key, value);
          });

          if (response.body) {
            const reader = response.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) res.write(Buffer.from(value));
            }
          }
          res.end();
        } catch (error) {
          console.error("[vercel-fn] handler threw:", error && (error.stack || error.message || error));
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("content-type", "text/plain; charset=utf-8");
          }
          res.end("Internal Server Error");
        }
      }
    `,
    resolveDir: ROOT,
    sourcefile: "vercel-fn-entry.mjs",
    loader: "js",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile: resolve(FUNC_DIR, "index.mjs"),
  banner: {
    js: `import { createRequire as __vc_createRequire } from "node:module"; const require = __vc_createRequire(import.meta.url);`,
  },
  logLevel: "info",
});
console.log(`[vercel-output] function bundled → ${resolve(FUNC_DIR, "index.mjs")}`);

await writeFile(
  resolve(FUNC_DIR, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs20.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      shouldAddHelpers: false,
      supportsResponseStreaming: true,
    },
    null,
    2,
  ),
);

await writeFile(
  resolve(VO, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { handle: "filesystem" },
        { src: "/(.*)", dest: "/api" },
      ],
    },
    null,
    2,
  ),
);

console.log(`[vercel-output] done.`);
