import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Loader2, Check, X, Edit3 } from "lucide-react";
import { currentUser } from "@/server/auth";
import { listCells, upsertCell, type Cell } from "@/server/stage3";

export const Route = createFileRoute("/ikf360/admin/cells")({
  beforeLoad: async () => {
    const user = await currentUser();
    if (!user || (user.role !== "admin" && user.role !== "advisor")) {
      throw redirect({ to: "/login" });
    }
  },
  loader: async () => ({ initial: await listCells() }),
  component: CellsAdmin,
});

function CellsAdmin() {
  const { initial } = Route.useLoaderData();
  const qc = useQueryClient();
  const { data: cells = initial } = useQuery({
    queryKey: ["admin", "cells"],
    queryFn: () => listCells(),
    initialData: initial,
  });

  const [editing, setEditing] = useState<Cell | null>(null);

  const save = useMutation({
    mutationFn: (c: Cell) => upsertCell({
      data: { cellKey: c.cellKey, title: c.title, recommendationMd: c.recommendationMd, isPublished: c.isPublished },
    }),
    onSuccess: () => { setEditing(null); qc.invalidateQueries({ queryKey: ["admin", "cells"] }); },
  });

  const publishedCount = cells.filter((c: Cell) => c.isPublished).length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <Link to="/ikf360/admin" className="text-[12px] uppercase tracking-[0.14em] inline-flex items-center gap-1 mb-3" style={{ color: "var(--ikf-text-dim)" }}>
          <ArrowLeft size={12} /> Back to admin
        </Link>
        <h1 className="text-[34px] leading-tight">Recommendation cells</h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
          Each row is one combination of axis values. Edit and publish a recommendation for every combination a parent might end up in. {cells.length === 0 ? "Define axes + values first." : (
            <span>
              <span style={{ color: "var(--ikf-brand)" }} className="font-semibold">{publishedCount}</span> of {cells.length} published.
            </span>
          )}
        </p>
        {cells.length === 0 && (
          <Link to="/ikf360/admin/axes" className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-semibold" style={{ background: "var(--ikf-brand)", color: "#0B1220" }}>
            Define axes →
          </Link>
        )}
      </div>

      {cells.length > 0 && (
        <div className="ikf-card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead style={{ background: "var(--ikf-surface-2)" }}>
              <tr className="text-left uppercase tracking-[0.14em] text-[10px]">
                <th className="p-4">Combination</th>
                <th className="p-4">Title</th>
                <th className="p-4 text-center">Recommendation</th>
                <th className="p-4 text-center">Published</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {cells.map((c: Cell) => (
                <tr key={c.cellKey} className="border-t" style={{ borderColor: "var(--ikf-border)" }}>
                  <td className="p-4 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {c.axisValues.map(av => (
                        <span key={av.axisKey} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]" style={{ background: "var(--ikf-surface-2)" }}>
                          <span style={{ color: "var(--ikf-text-dim)" }}>{av.axisName}:</span>
                          <span className="font-semibold">{av.valueLabel}</span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    {c.title || <span style={{ color: "var(--ikf-text-dim)" }}>—</span>}
                  </td>
                  <td className="p-4 text-center align-top">
                    {c.recommendationMd ? (
                      <span className="text-[12px]" style={{ color: "var(--ikf-text-dim)" }}>{c.recommendationMd.length} chars</span>
                    ) : (
                      <span className="text-[12px]" style={{ color: "var(--ikf-text-dim)" }}>empty</span>
                    )}
                  </td>
                  <td className="p-4 text-center align-top">
                    {c.isPublished ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.12em] font-bold" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
                        <Check size={10} /> Live
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.12em] font-bold" style={{ background: "rgba(160,160,160,0.12)", color: "#9ca3af" }}>
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right align-top">
                    <button onClick={() => setEditing({ ...c })} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-semibold" style={{ background: "var(--ikf-surface-2)" }}>
                      <Edit3 size={12} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <CellEditorModal
          cell={editing}
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

function CellEditorModal({ cell, onClose, onChange, onSave, saving, error }: {
  cell: Cell;
  onClose: () => void;
  onChange: (p: Partial<Cell>) => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="ikf-card p-7 max-w-3xl w-full space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-bold">Cell recommendation</h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {cell.axisValues.map(av => (
                <span key={av.axisKey} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]" style={{ background: "var(--ikf-surface-2)" }}>
                  <span style={{ color: "var(--ikf-text-dim)" }}>{av.axisName}:</span>
                  <span className="font-semibold">{av.valueLabel}</span>
                </span>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="opacity-70 hover:opacity-100"><X size={18} /></button>
        </div>

        {error && (
          <div className="p-3 rounded-lg text-[12px]" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>
            {error}
          </div>
        )}

        <label className="block">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: "var(--ikf-text-dim)" }}>Title (optional)</div>
          <input className="ikf-input" value={cell.title} onChange={e => onChange({ title: e.target.value })} placeholder="e.g. The committed family with a high-potential child" />
        </label>

        <label className="block">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: "var(--ikf-text-dim)" }}>
            Recommendation (markdown / plain text)
          </div>
          <textarea
            className="ikf-input font-mono text-[12px]"
            rows={14}
            value={cell.recommendationMd}
            onChange={e => onChange({ recommendationMd: e.target.value })}
            placeholder={`# Football pathway\n- ...\n\n# Academic\n- ...\n\n# Physical\n- ...\n\n# Long-term options\n- ...`}
          />
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={cell.isPublished} onChange={e => onChange({ isPublished: e.target.checked })} />
          <span className="text-[13px]">Publish — parents in this cell will see this recommendation</span>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>Cancel</button>
          <button onClick={onSave} disabled={saving} className="ikf-btn-primary inline-flex items-center gap-2 text-[13px] disabled:opacity-50">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}
