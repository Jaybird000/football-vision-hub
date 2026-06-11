import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Loader2, Check, X, Edit3, Trash2, Plus, ExternalLink } from "lucide-react";
import { currentUser } from "@/server/auth";
import { listContentItems, upsertContentItem, deleteContentItem, type ContentItem } from "@/server/notifications";

export const Route = createFileRoute("/ikf360/admin/content")({
  beforeLoad: async () => {
    const user = await currentUser();
    if (!user || (user.role !== "admin" && user.role !== "advisor")) {
      throw redirect({ to: "/login" });
    }
  },
  loader: async () => ({ initial: await listContentItems() }),
  component: ContentAdmin,
});

// Categories map to a player_potential value; null = sent to everyone.
const CATEGORIES: { value: string; label: string }[] = [
  { value: "", label: "General — all parents" },
  { value: "high", label: "High potential" },
  { value: "developing", label: "Developing" },
  { value: "uncertain", label: "Uncertain" },
];

type Draft = { id?: string; title: string; summary: string; url: string; category: string; isPublished: boolean };
const EMPTY_DRAFT: Draft = { title: "", summary: "", url: "", category: "", isPublished: false };

function ContentAdmin() {
  const { initial } = Route.useLoaderData();
  const qc = useQueryClient();
  const { data: items = initial } = useQuery({
    queryKey: ["admin", "content"],
    queryFn: () => listContentItems(),
    initialData: initial,
  });

  const [editing, setEditing] = useState<Draft | null>(null);

  const save = useMutation({
    mutationFn: (d: Draft) => upsertContentItem({
      data: { id: d.id, title: d.title, summary: d.summary, url: d.url, category: d.category || null, isPublished: d.isPublished },
    }),
    onSuccess: () => { setEditing(null); qc.invalidateQueries({ queryKey: ["admin", "content"] }); },
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteContentItem({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "content"] }),
  });

  const publishedCount = items.filter((c: ContentItem) => c.isPublished).length;
  const catLabel = (c: string | null) => CATEGORIES.find(x => x.value === (c ?? ""))?.label ?? c;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <Link to="/ikf360/admin" className="text-[12px] uppercase tracking-[0.14em] inline-flex items-center gap-1 mb-3" style={{ color: "var(--ikf-text-dim)" }}>
          <ArrowLeft size={12} /> Back to admin
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[34px] leading-tight">Content library</h1>
            <p className="mt-3 text-[15px] leading-relaxed max-w-2xl" style={{ color: "var(--ikf-text-dim)" }}>
              Curated articles and guides. The monthly cron sends each parent one published item — matched to their category, or a general item if none matches. {items.length > 0 && <><span style={{ color: "var(--ikf-brand-ink)" }} className="font-semibold">{publishedCount}</span> of {items.length} published.</>}
            </p>
          </div>
          <button onClick={() => setEditing({ ...EMPTY_DRAFT })} className="ikf-btn-primary inline-flex items-center gap-2 text-[13px] shrink-0">
            <Plus size={14} /> New item
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="ikf-card p-8 text-center text-[14px]" style={{ color: "var(--ikf-text-dim)" }}>
          No content yet. Add an article or guide to start the monthly reading.
        </div>
      ) : (
        <div className="ikf-card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead style={{ background: "var(--ikf-surface-2)" }}>
              <tr className="text-left uppercase tracking-[0.14em] text-[10px]">
                <th className="p-4">Title</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-center">Published</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c: ContentItem) => (
                <tr key={c.id} className="border-t align-top" style={{ borderColor: "var(--ikf-border)" }}>
                  <td className="p-4">
                    <div className="font-semibold">{c.title}</div>
                    {c.summary && <div className="text-[12px] mt-0.5" style={{ color: "var(--ikf-text-dim)" }}>{c.summary}</div>}
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-[12px] inline-flex items-center gap-1 mt-1 underline" style={{ color: "var(--ikf-brand-ink)" }}>
                      {c.url.length > 48 ? c.url.slice(0, 48) + "…" : c.url} <ExternalLink size={10} />
                    </a>
                  </td>
                  <td className="p-4">{catLabel(c.category)}</td>
                  <td className="p-4 text-center">
                    {c.isPublished
                      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.12em] font-bold" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}><Check size={10} /> Live</span>
                      : <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.12em] font-bold" style={{ background: "rgba(160,160,160,0.12)", color: "#9ca3af" }}>Draft</span>}
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <button onClick={() => setEditing({ id: c.id, title: c.title, summary: c.summary, url: c.url, category: c.category ?? "", isPublished: c.isPublished })} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-semibold" style={{ background: "var(--ikf-surface-2)" }}>
                      <Edit3 size={12} /> Edit
                    </button>
                    <button onClick={() => { if (confirm(`Delete "${c.title}"?`)) del.mutate(c.id); }} className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px]" style={{ color: "#dc2626" }}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ContentEditorModal
          draft={editing}
          onClose={() => setEditing(null)}
          onChange={(p) => setEditing({ ...editing, ...p })}
          onSave={() => save.mutate(editing)}
          saving={save.isPending}
          error={save.error instanceof Error ? save.error.message : null}
        />
      )}
    </div>
  );
}

function ContentEditorModal({ draft, onClose, onChange, onSave, saving, error }: {
  draft: Draft;
  onClose: () => void;
  onChange: (p: Partial<Draft>) => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
}) {
  const valid = draft.title.trim().length > 0 && /^https?:\/\//.test(draft.url.trim());
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="ikf-card p-7 max-w-2xl w-full space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[20px] font-bold">{draft.id ? "Edit content" : "New content"}</h2>
          <button onClick={onClose} className="opacity-70 hover:opacity-100"><X size={18} /></button>
        </div>

        {error && (
          <div className="p-3 rounded-lg text-[12px]" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>{error}</div>
        )}

        <label className="block">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: "var(--ikf-text-dim)" }}>Title</div>
          <input className="ikf-input" value={draft.title} onChange={e => onChange({ title: e.target.value })} placeholder="e.g. When to specialise — and when not to" />
        </label>

        <label className="block">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: "var(--ikf-text-dim)" }}>Summary (optional)</div>
          <textarea className="ikf-input" rows={2} value={draft.summary} onChange={e => onChange({ summary: e.target.value })} placeholder="One line on why it's worth reading." />
        </label>

        <label className="block">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: "var(--ikf-text-dim)" }}>URL</div>
          <input className="ikf-input" value={draft.url} onChange={e => onChange({ url: e.target.value })} placeholder="https://…" />
        </label>

        <label className="block">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: "var(--ikf-text-dim)" }}>Category</div>
          <select className="ikf-input" value={draft.category} onChange={e => onChange({ category: e.target.value })}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={draft.isPublished} onChange={e => onChange({ isPublished: e.target.checked })} />
          <span className="text-[13px]">Publish — eligible to be sent in the monthly content notification</span>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>Cancel</button>
          <button onClick={onSave} disabled={saving || !valid} className="ikf-btn-primary inline-flex items-center gap-2 text-[13px] disabled:opacity-50">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}
