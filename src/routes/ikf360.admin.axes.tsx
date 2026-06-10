import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Edit3, Loader2, Check, X } from "lucide-react";
import { currentUser } from "@/server/auth";
import {
  listAxes,
  upsertAxis,
  deleteAxis,
  upsertAxisValue,
  deleteAxisValue,
  type Axis,
  type AxisValue,
} from "@/server/stage3";

export const Route = createFileRoute("/ikf360/admin/axes")({
  beforeLoad: async () => {
    const user = await currentUser();
    if (!user || (user.role !== "admin" && user.role !== "advisor")) {
      throw redirect({ to: "/login" });
    }
  },
  loader: async () => ({ initial: await listAxes() }),
  component: AxesAdmin,
});

type AxisDraft = { id?: string; key: string; name: string; description: string; sortOrder: number };
type ValueDraft = { id?: string; axisId: string; key: string; label: string; description: string; sortOrder: number };

function AxesAdmin() {
  const { initial } = Route.useLoaderData();
  const qc = useQueryClient();
  const { data: axes = initial } = useQuery({
    queryKey: ["admin", "axes"],
    queryFn: () => listAxes(),
    initialData: initial,
  });

  const [axisDraft, setAxisDraft] = useState<AxisDraft | null>(null);
  const [valueDraft, setValueDraft] = useState<ValueDraft | null>(null);

  const saveAxis = useMutation({
    mutationFn: (d: AxisDraft) => upsertAxis({ data: d }),
    onSuccess: () => { setAxisDraft(null); qc.invalidateQueries({ queryKey: ["admin", "axes"] }); qc.invalidateQueries({ queryKey: ["admin", "cells"] }); },
  });
  const delAxis = useMutation({
    mutationFn: (id: string) => deleteAxis({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "axes"] }); qc.invalidateQueries({ queryKey: ["admin", "cells"] }); },
  });
  const saveValue = useMutation({
    mutationFn: (d: ValueDraft) => upsertAxisValue({ data: d }),
    onSuccess: () => { setValueDraft(null); qc.invalidateQueries({ queryKey: ["admin", "axes"] }); qc.invalidateQueries({ queryKey: ["admin", "cells"] }); },
  });
  const delValue = useMutation({
    mutationFn: (id: string) => deleteAxisValue({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "axes"] }); qc.invalidateQueries({ queryKey: ["admin", "cells"] }); },
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <Link to="/ikf360/admin" className="text-[12px] uppercase tracking-[0.14em] inline-flex items-center gap-1 mb-3" style={{ color: "var(--ikf-text-dim)" }}>
          <ArrowLeft size={12} /> Back to admin
        </Link>
        <h1 className="text-[34px] leading-tight">Categorisation axes</h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
          Define the axes IKF uses to categorise a parent–child profile. Each axis has a set of values; the cross-product becomes the recommendation cells.
        </p>
        <div className="mt-2 text-[12px]" style={{ color: "var(--ikf-text-dim)" }}>
          Current cell count: <span className="font-semibold" style={{ color: "var(--ikf-brand-ink)" }}>{axes.reduce((n: number, a: Axis) => n * (a.values.length || 0), 1) || 0}</span>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setAxisDraft({ key: "", name: "", description: "", sortOrder: (axes.length + 1) * 10 })}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-semibold"
          style={{ background: "var(--ikf-brand)", color: "#0B1220" }}
        >
          <Plus size={14} /> Add axis
        </button>
      </div>

      <div className="space-y-8">
        {axes.map((axis: Axis) => (
          <section key={axis.id} className="ikf-card p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[20px] font-bold">{axis.name}</h2>
                  <code className="px-2 py-0.5 rounded text-[11px]" style={{ background: "var(--ikf-surface-2)", color: "var(--ikf-text-dim)" }}>{axis.key}</code>
                </div>
                {axis.description && (
                  <p className="text-[13px] mt-1" style={{ color: "var(--ikf-text-dim)" }}>{axis.description}</p>
                )}
                <div className="text-[11px] uppercase tracking-[0.14em] mt-2" style={{ color: "var(--ikf-text-dim)" }}>
                  {axis.values.length} value{axis.values.length !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setAxisDraft({ id: axis.id, key: axis.key, name: axis.name, description: axis.description, sortOrder: axis.sortOrder })} className="p-2 opacity-70 hover:opacity-100" title="Edit axis">
                  <Edit3 size={14} />
                </button>
                <button onClick={() => { if (confirm(`Delete axis "${axis.name}" and all its values? This also affects existing cell recommendations.`)) delAxis.mutate(axis.id); }} className="p-2 opacity-70 hover:opacity-100" title="Delete axis">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <ul className="divide-y" style={{ borderColor: "var(--ikf-border)" }}>
              {axis.values.map((v: AxisValue) => (
                <li key={v.id} className="py-3 flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{v.label}</span>
                      <code className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "var(--ikf-surface-2)", color: "var(--ikf-text-dim)" }}>{v.key}</code>
                    </div>
                    {v.description && <div className="text-[12px] mt-0.5" style={{ color: "var(--ikf-text-dim)" }}>{v.description}</div>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setValueDraft({ id: v.id, axisId: axis.id, key: v.key, label: v.label, description: v.description, sortOrder: v.sortOrder })} className="p-2 opacity-70 hover:opacity-100">
                      <Edit3 size={13} />
                    </button>
                    <button onClick={() => { if (confirm(`Delete value "${v.label}"?`)) delValue.mutate(v.id); }} className="p-2 opacity-70 hover:opacity-100">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => setValueDraft({ axisId: axis.id, key: "", label: "", description: "", sortOrder: (axis.values.length + 1) * 10 })}
                className="text-[12px] inline-flex items-center gap-1 px-2 py-1 rounded-md"
                style={{ color: "var(--ikf-brand-ink)" }}
              >
                <Plus size={12} /> Add value
              </button>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6 text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>
        After editing axes,{" "}
        <Link to="/ikf360/admin/cells" className="underline" style={{ color: "var(--ikf-brand-ink)" }}>edit cell recommendations</Link>
        {" "}for each new combination.
      </div>

      {axisDraft && (
        <Modal title={axisDraft.id ? "Edit axis" : "Add axis"} onClose={() => setAxisDraft(null)}>
          <Field label="Key (lowercase, underscores)">
            <input className="ikf-input" value={axisDraft.key} onChange={e => setAxisDraft({ ...axisDraft, key: e.target.value })} placeholder="player_potential" />
          </Field>
          <Field label="Name">
            <input className="ikf-input" value={axisDraft.name} onChange={e => setAxisDraft({ ...axisDraft, name: e.target.value })} placeholder="Player Potential" />
          </Field>
          <Field label="Description (optional)">
            <textarea className="ikf-input" rows={3} value={axisDraft.description} onChange={e => setAxisDraft({ ...axisDraft, description: e.target.value })} />
          </Field>
          <Field label="Sort order">
            <input type="number" className="ikf-input" value={axisDraft.sortOrder} onChange={e => setAxisDraft({ ...axisDraft, sortOrder: parseInt(e.target.value || "0", 10) })} />
          </Field>
          <ModalFooter
            onCancel={() => setAxisDraft(null)}
            onSave={() => saveAxis.mutate(axisDraft)}
            saving={saveAxis.isPending}
            error={saveAxis.error instanceof Error ? saveAxis.error.message : null}
            disabled={!axisDraft.key.trim() || !axisDraft.name.trim()}
          />
        </Modal>
      )}

      {valueDraft && (
        <Modal title={valueDraft.id ? "Edit value" : "Add value"} onClose={() => setValueDraft(null)}>
          <Field label="Key (lowercase, underscores)">
            <input className="ikf-input" value={valueDraft.key} onChange={e => setValueDraft({ ...valueDraft, key: e.target.value })} placeholder="high" />
          </Field>
          <Field label="Label">
            <input className="ikf-input" value={valueDraft.label} onChange={e => setValueDraft({ ...valueDraft, label: e.target.value })} placeholder="High potential" />
          </Field>
          <Field label="Description (optional)">
            <textarea className="ikf-input" rows={3} value={valueDraft.description} onChange={e => setValueDraft({ ...valueDraft, description: e.target.value })} />
          </Field>
          <Field label="Sort order">
            <input type="number" className="ikf-input" value={valueDraft.sortOrder} onChange={e => setValueDraft({ ...valueDraft, sortOrder: parseInt(e.target.value || "0", 10) })} />
          </Field>
          <ModalFooter
            onCancel={() => setValueDraft(null)}
            onSave={() => saveValue.mutate(valueDraft)}
            saving={saveValue.isPending}
            error={saveValue.error instanceof Error ? saveValue.error.message : null}
            disabled={!valueDraft.key.trim() || !valueDraft.label.trim()}
          />
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="ikf-card p-7 max-w-xl w-full space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-bold">{title}</h2>
          <button onClick={onClose} className="opacity-70 hover:opacity-100"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onCancel, onSave, saving, error, disabled }: { onCancel: () => void; onSave: () => void; saving: boolean; error: string | null; disabled: boolean }) {
  return (
    <>
      {error && (
        <div className="p-3 rounded-lg text-[12px]" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>
          {error}
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-md text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>Cancel</button>
        <button onClick={onSave} disabled={disabled || saving} className="ikf-btn-primary inline-flex items-center gap-2 text-[13px] disabled:opacity-50">
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Save</>}
        </button>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: "var(--ikf-text-dim)" }}>{label}</div>
      {children}
    </label>
  );
}
