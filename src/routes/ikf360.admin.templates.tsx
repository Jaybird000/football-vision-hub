import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { currentUser } from "@/server/auth";
import { listAdminTemplates, setTemplateRequired } from "@/server/admin";

export const Route = createFileRoute("/ikf360/admin/templates")({
  beforeLoad: async () => {
    const user = await currentUser();
    if (!user || (user.role !== "admin" && user.role !== "advisor")) {
      throw redirect({ to: "/login" });
    }
  },
  loader: async () => ({ initial: await listAdminTemplates() }),
  component: TemplatesAdmin,
});

function TemplatesAdmin() {
  const { initial } = Route.useLoaderData();
  const qc = useQueryClient();
  const { data: templates = initial } = useQuery({
    queryKey: ["admin", "templates"],
    queryFn: () => listAdminTemplates(),
    initialData: initial,
  });

  const toggle = useMutation({
    mutationFn: (vars: { key: string; required: boolean }) =>
      setTemplateRequired({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "templates"] }),
  });

  const requiredCount = templates.filter(t => t.required).length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <Link to="/ikf360/admin" className="text-[12px] uppercase tracking-[0.14em] inline-flex items-center gap-1 mb-3" style={{ color: "var(--ikf-text-dim)" }}>
          <ArrowLeft size={12} /> Back to admin
        </Link>
        <h1 className="text-[34px] leading-tight">Assessment templates</h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
          Toggle which of the 9 assessments are required for a parent to unlock Stage 3. Currently <span style={{ color: "var(--ikf-brand)" }} className="font-semibold">{requiredCount} required</span>.
        </p>
      </div>

      <div className="ikf-card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead style={{ background: "var(--ikf-surface-2)" }}>
            <tr className="text-left uppercase tracking-[0.14em] text-[10px]">
              <th className="p-4">Assessment</th>
              <th className="p-4">Category</th>
              <th className="p-4 text-right">Providers</th>
              <th className="p-4 text-right">Uploaded</th>
              <th className="p-4 text-center">Required</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(t => (
              <tr key={t.key} className="border-t" style={{ borderColor: "var(--ikf-border)" }}>
                <td className="p-4">
                  <div className="font-semibold">{t.title}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--ikf-text-dim)" }}>{t.description}</div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded-full text-[11px]" style={{ background: "var(--ikf-surface-2)", color: "var(--ikf-text-dim)" }}>
                    {t.category}
                  </span>
                </td>
                <td className="p-4 text-right tabular-nums">{t.providerCount}</td>
                <td className="p-4 text-right tabular-nums">{t.uploadCount}</td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => toggle.mutate({ key: t.key, required: !t.required })}
                    disabled={toggle.isPending}
                    className="inline-flex items-center"
                    aria-label={`Toggle ${t.title} required`}
                  >
                    <span
                      className="inline-block w-10 h-6 rounded-full relative transition-colors"
                      style={{ background: t.required ? "var(--ikf-brand)" : "var(--ikf-surface-2)" }}
                    >
                      <span
                        className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                        style={{
                          left: t.required ? "calc(100% - 22px)" : "2px",
                          background: t.required ? "#0B1220" : "#666",
                        }}
                      />
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toggle.isPending && (
        <div className="mt-4 flex items-center gap-2 text-[12px]" style={{ color: "var(--ikf-text-dim)" }}>
          <Loader2 size={12} className="animate-spin" /> Saving…
        </div>
      )}

      <div className="mt-6 text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>
        Need to manage providers per assessment?{" "}
        <Link to="/ikf360/admin/providers" className="underline" style={{ color: "var(--ikf-brand)" }}>
          Open providers
        </Link>
      </div>
    </div>
  );
}
