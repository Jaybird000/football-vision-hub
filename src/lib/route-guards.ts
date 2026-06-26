import { redirect } from "@tanstack/react-router";
import { currentUser } from "@/server/auth";

// Hard gate for the marketing pages (client feedback 25 Jun 2026, item 2):
// logged-out visitors may only see the landing page. Anyone without a session
// who hits a gated route is bounced to "/". Used as a route `beforeLoad`.
// These routes are also excluded from the prerender crawl in vite.config.ts so
// the (session-less) build doesn't trip the redirect.
export async function requireAccount(): Promise<void> {
  const user = await currentUser();
  if (!user) throw redirect({ to: "/" });
}
