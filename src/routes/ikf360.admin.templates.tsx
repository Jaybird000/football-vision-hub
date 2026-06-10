import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Loader2, Plus, Edit3, Copy, Trash2, X, Check } from "lucide-react";
import { currentUser } from "@/server/auth";
import { listAdminTemplates, setTemplateRequired, upsertTemplate, deleteTemplate } from "@/server/admin";

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

type DraftTemplate = {
  key: string;
  category: string;
  title: string;
  description: string;
  required: boolean;
  sortOrder: number;
  isNew: boolean;
};

function TemplatesAdmin() {
  const { initial } = Route.useLoaderData();
  const qc = useQueryClient();
  const { data: templates = initial } = useQuery({
    queryKey: ["admin", "templates"],
    queryFn: () => listAdminTemplates(),
    initialData: initial,
  });

  const [editing, setEditing] = useState<DraftTemplate | null>(null);

  const toggle = useMutation({
    mutationFn: (vars: { key: string; required: boolean }) => setTemplateRequired({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "templates"] }),
  });

  const save = useMutation({
    mutationFn: (d: DraftTemplate) => upsertTemplate({ data: d }),
    onSuccess: () => {
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin", "templates"] });
    },
  });

  const del = useMutation({
    mutationFn: (key: string) => deleteTemplate({ data: { key } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "templates"] }),
  });

  const requiredCount = templates.filter(t => t.required).length;
  const nextSort = templates.length > 0 ? Math.max(...templates.map(t => t.sortOrder)) + 10 : 10;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <Link to="/ikf360/admin" className="text-[12px] uppercase tracking-[0.14em] inline-flex items-center gap-1 mb-3" style={{ color: "var(--ikf-text-dim)" }}>
          <ArrowLeft size={12} /> Back to admin
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[34px] leading-tight">Assessment templates</h1>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
              Add, edit, or remove the assessments parents are asked for, and toggle which are required to unlock Stage 3.
              Currently <span style={{ color: "var(--ikf-brand-ink)" }} className="font-semibold">{requiredCount} required</span>.
            </p>
          </div>
          <button
            onClick={() => setEditing({ key: "", category: "", title: "", description: "", required: false, sortOrder: nextSort, isNew: true })}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md text-[13px] font-semibold shrink-0"
            style={{ background: "var(--ikf-brand)", color: "#0B1220" }}
          >
            <Plus size={15} /> New template
          </button>
        </div>
      </div>

      {del.error && (
        <div className="mb-4 p-3 rounded-lg text-[13px]" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>
          {del.error instanceof Error ? del.error.message : "Could not delete the template."}
        </div>
      )}

      <div className="ikf-card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead style={{ background: "var(--ikf-surface-2)" }}>
            <tr className="text-left uppercase tracking-[0.14em] text-[10px]">
              <th className="p-4">Assessment</th>
              <th className="p-4">Category</th>
              <th className="p-4 text-right">Providers</th>
              <th className="p-4 text-right">Uploaded</th>
              <th className="p-4 text-center">Required</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(t => (
              <tr key={t.key} className="border-t" style={{ borderColor: "var(--ikf-border)" }}>
                <td className="p-4">
                  <div className="font-semibold">{t.title}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--ikf-text-dim)" }}>{t.description}</div>
                  <div className="text-[10px] mt-1 font-mono" style={{ color: "var(--ikf-text-dim)" }}>{t.key}</div>
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
                        style={{ left: t.required ? "calc(100% - 22px)" : "2px", background: t.required ? "#0B1220" : "#666" }}
                      />
                    </span>
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setEditing({ key: t.key, category: t.category, title: t.title, description: t.description, required: t.required, sortOrder: t.sortOrder, isNew: false })}
                      className="p-2 rounded-md opacity-70 hover:opacity-100" title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => setEditing({ key: "", category: t.category, title: `${t.title} (copy)`, description: t.description, required: t.required, sortOrder: nextSort, isNew: true })}
                      className="p-2 rounded-md opacity-70 hover:opacity-100" title="Duplicate"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete template "${t.title}"? This also removes its providers.`)) del.mutate(t.key); }}
                      disabled={del.isPending && del.variables === t.key}
                      className="p-2 rounded-md opacity-70 hover:opacity-100" title="Delete"
                    >
                      {del.isPending && del.variables === t.key ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
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
        <Link to="/ikf360/admin/providers" className="underline" style={{ color: "var(--ikf-brand-ink)" }}>
          Open providers
        </Link>
      </div>

      {editing && (
        <TemplateModal
          draft={editing}
          onCancel={() => setEditing(null)}
          onChange={(patch) => setEditing({ ...editing, ...patch })}
          onSave={() => save.mutate(editing)}
          saving={save.isPending}
          error={save.error instanceof Error ? save.error.message : null}
        />
      )}
    </div>
  );
}

function TemplateModal({
  draft, onCancel, onChange, onSave, saving, error,
}: {
  draft: DraftTemplate;
  onCancel: () => void;
  onChange: (patch: Partial<DraftTemplate>) => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
}) {
  const keyValid = /^[a-z0-9_]+$/.test(draft.key);
  const valid = keyValid && draft.category.trim().length > 0 && draft.title.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="ikf-card p-7 max-w-xl w-full space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-bold">{draft.isNew ? "New template" : "Edit template"}</h2>
          <button onClick={onCancel} className="opacity-70 hover:opacity-100"><X size={18} /></button>
        </div>

        {error && (
          <div className="p-3 rounded-lg text-[12px]" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Key (id)" hint={draft.isNew ? "lowercase, numbers, underscores — permanent" : "permanent — cannot be changed"}>
            <input
              className="ikf-input font-mono"
              value={draft.key}
              disabled={!draft.isNew}
              onChange={e => onChange({ key: e.target.value.toLowerCase() })}
              placeholder="e.g. vision_test"
              style={!draft.isNew ? { opacity: 0.6 } : undefined}
            />
          </Field>
          <Field label="Category">
            <input className="ikf-input" value={draft.category} onChange={e => onChange({ category: e.target.value })} placeholder="Football / Mental / Physical…" />
          </Field>
        </div>

        <Field label="Title">
          <input className="ikf-input" value={draft.title} onChange={e => onChange({ title: e.target.value })} placeholder="Technical Skill Assessment" />
        </Field>

        <Field label="Description (optional)">
          <textarea className="ikf-input" rows={2} value={draft.description} onChange={e => onChange({ description: e.target.value })} placeholder="What this report covers." />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Sort order">
            <input
              className="ikf-input" type="number" min={0} inputMode="numeric"
              value={String(draft.sortOrder)}
              onChange={e => onChange({ sortOrder: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
            />
          </Field>
          <Field label="Required">
            <button
              onClick={() => onChange({ required: !draft.required })}
              className="ikf-input flex items-center justify-between" type="button"
            >
              <span>{draft.required ? "Required" : "Optional"}</span>
              <span className="inline-block w-10 h-6 rounded-full relative" style={{ background: draft.required ? "var(--ikf-brand)" : "var(--ikf-surface-2)" }}>
                <span className="absolute top-0.5 w-5 h-5 rounded-full" style={{ left: draft.required ? "calc(100% - 22px)" : "2px", background: draft.required ? "#0B1220" : "#666" }} />
              </span>
            </button>
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-md text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>Cancel</button>
          <button onClick={onSave} disabled={!valid || saving} className="ikf-btn-primary inline-flex items-center gap-2 text-[13px] disabled:opacity-50">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: "var(--ikf-text-dim)" }}>
        {label}
      </div>
      {children}
      {hint && <div className="mt-1 text-[10px]" style={{ color: "var(--ikf-text-dim)" }}>{hint}</div>}
    </label>
  );
}
