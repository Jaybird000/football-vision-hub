// Vercel serverless function entry. Wraps the universal `fetch(request, env, ctx)`
// handler that `npm run build` emits to `dist/server/server.js` (Workers-shaped,
// also valid Web Fetch on Vercel's Node runtime).
//
// Every non-static request hits this function via the rewrite in vercel.json;
// inside, TanStack Start does SSR for routes and dispatches /_serverFn/* to the
// right server function. Data layer (D1 / R2 / SMTP2GO) runs over HTTP, so the
// same code path works here that works locally.
//
// Runtime: defaults to nodejs20.x (the server bundle imports node:async_hooks).

import server from "../dist/server/server.js";

export default async function handler(request) {
  return server.fetch(request, {}, {});
}
