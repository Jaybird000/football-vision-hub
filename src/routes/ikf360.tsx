import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { currentUser } from "@/server/auth";

export const Route = createFileRoute("/ikf360")({
  head: () => ({
    meta: [
      { title: "IKF 360 Platform" },
      {
        name: "description",
        content: "IKF Pathway 360 — the parent-first platform for your child's football journey.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  // Client feedback 25 Jun 2026, item 2 — "unless a visitor creates an account,
  // they have access only to the landing page." Guarding the layout covers every
  // /ikf360/* page (index, dashboard, upload, support, intent, admin) in one
  // place: anonymous users are bounced to login and returned here after sign-in.
  beforeLoad: async ({ location }) => {
    const user = await currentUser();
    if (!user) throw redirect({ to: "/login", search: { next: location.pathname } });
    return { user };
  },
  loader: async () => {
    const user = await currentUser();
    return { user };
  },
  component: IKF360Layout,
});

function IKF360Layout() {
  return (
    <div className="ikf360-theme min-h-screen" style={{ background: "var(--ikf-bg)" }}>
      <main className="max-w-7xl mx-auto px-6 py-10">
        <Outlet />
      </main>

      <footer
        className="border-t mt-20 py-8 text-center text-[11px] uppercase tracking-[0.2em]"
        style={{ borderColor: "var(--ikf-border)", color: "var(--ikf-text-dim)" }}
      >
        IKF 360 · v0.1 · May 2026
      </footer>
    </div>
  );
}
