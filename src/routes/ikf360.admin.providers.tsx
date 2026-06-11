import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Loader2, Plus, Trash2, ExternalLink, Edit3, X, Check } from "lucide-react";
import { currentUser } from "@/server/auth";
import {
  listAdminTemplates,
  listAdminProviders,
  upsertProvider,
  deleteProvider,
  type AdminProvider,
} from "@/server/admin";

export const Route = createFileRoute("/ikf360/admin/providers")({
  beforeLoad: async () => {
    const user = await currentUser();
    if (!user || (user.role !== "admin" && user.role !== "advisor")) {
      throw redirect({ to: "/login" });
    }
  },
  loader: async () => ({
    templates: await listAdminTemplates(),
    providers: await listAdminProviders(),
  }),
  component: ProvidersAdmin,
});

type DraftProvider = {
  id?: string;
  assessmentKey: string;
  name: string;
  description: string;
  url: string;
  city: string;
  chargeInr: string; // free-text in the form; parsed to number on save
  isActive: boolean;
};

const emptyDraft = (assessmentKey: string): DraftProvider => ({
  assessmentKey,
  name: "",
  description: "",
  url: "",
  city: "",
  chargeInr: "",
  isActive: true,
});

function ProvidersAdmin() {
  const { templates, providers: initialProviders } = Route.useLoaderData();
  const qc = useQueryClient();

  const { data: providers = initialProviders } = useQuery({
    queryKey: ["admin", "providers"],
    queryFn: () => listAdminProviders(),
    initialData: initialProviders,
  });

  const [editing, setEditing] = useState<DraftProvider | null>(null);

  const save = useMutation({
    mutationFn: (p: DraftProvider) => {
      const trimmed = p.chargeInr.trim();
      const n = trimmed === "" ? null : Math.round(Number(trimmed));
      const chargeInr = n != null && Number.isFinite(n) && n >= 0 ? n : null;
      return upsertProvider({ data: { ...p, chargeInr } });
    },
    onSuccess: () => {
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin", "providers"] });
      qc.invalidateQueries({ queryKey: ["admin", "templates"] });
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteProvider({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "providers"] });
      qc.invalidateQueries({ queryKey: ["admin", "templates"] });
    },
  });

  const grouped = templates.map(t => ({
    template: t,
    items: providers.filter(p => p.assessmentKey === t.key),
  }));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <Link to="/ikf360/admin" className="text-[12px] uppercase tracking-[0.14em] inline-flex items-center gap-1 mb-3" style={{ color: "var(--ikf-text-dim)" }}>
          <ArrowLeft size={12} /> Back to admin
        </Link>
        <h1 className="text-[34px] leading-tight">Providers</h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
          Add the providers parents should use to obtain each assessment. Active providers show up on the parent's Stage 2 upload portal.
        </p>
      </div>

      <div className="space-y-8">
        {grouped.map(({ template, items }) => (
          <section key={template.key} className="ikf-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[18px] font-bold">{template.title}</h2>
                <div className="text-[11px] uppercase tracking-[0.14em] mt-1" style={{ color: "var(--ikf-text-dim)" }}>
                  {template.category} · {items.length} provider{items.length !== 1 ? "s" : ""}
                </div>
              </div>
              <button
                onClick={() => setEditing(emptyDraft(template.key))}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-semibold"
                style={{ background: "var(--ikf-brand)", color: "#0B1220" }}
              >
                <Plus size={14} /> Add provider
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-[13px] text-center py-6" style={{ color: "var(--ikf-text-dim)" }}>
                No providers yet. Parents will see a blank list for this assessment.
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--ikf-border)" }}>
                {items.map(p => (
                  <ProviderRow
                    key={p.id}
                    p={p}
                    onEdit={() => setEditing({
                      id: p.id,
                      assessmentKey: p.assessmentKey,
                      name: p.name,
                      description: p.description,
                      url: p.url,
                      city: p.city ?? "",
                      chargeInr: p.chargeInr != null ? String(p.chargeInr) : "",
                      isActive: p.isActive,
                    })}
                    onDelete={() => {
                      if (confirm(`Delete "${p.name}"?`)) del.mutate(p.id);
                    }}
                    deleting={del.isPending && del.variables === p.id}
                  />
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {editing && (
        <EditModal
          draft={editing}
          templates={templates}
          onCancel={() => setEditing(null)}
          onSave={() => save.mutate(editing)}
          onChange={(patch) => setEditing({ ...editing, ...patch })}
          saving={save.isPending}
          error={save.error instanceof Error ? save.error.message : null}
        />
      )}

      <div className="mt-6 text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>
        Need to toggle which assessments are required?{" "}
        <Link to="/ikf360/admin/templates" className="underline" style={{ color: "var(--ikf-brand-ink)" }}>
          Open templates
        </Link>
      </div>
    </div>
  );
}

function ProviderRow({ p, onEdit, onDelete, deleting }: {
  p: AdminProvider; onEdit: () => void; onDelete: () => void; deleting: boolean;
}) {
  return (
    <li className="py-3 flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold">{p.name}</span>
          {p.city && <span className="text-[12px]" style={{ color: "var(--ikf-text-dim)" }}>· {p.city}</span>}
          {p.chargeInr != null && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(15,117,189,0.12)", color: "#0A5A94" }}>
              ₹{p.chargeInr.toLocaleString("en-IN")}
            </span>
          )}
          {!p.isActive && (
            <span className="text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(160,160,160,0.15)", color: "#9ca3af" }}>
              Hidden
            </span>
          )}
        </div>
        {p.description && (
          <div className="text-[12px] mt-1" style={{ color: "var(--ikf-text-dim)" }}>{p.description}</div>
        )}
        <a
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] mt-1 inline-flex items-center gap-1 hover:underline"
          style={{ color: "var(--ikf-brand-ink)" }}
        >
          {p.url} <ExternalLink size={10} />
        </a>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onEdit} className="p-2 rounded-md hover:opacity-100 opacity-70" title="Edit">
          <Edit3 size={14} />
        </button>
        <button onClick={onDelete} disabled={deleting} className="p-2 rounded-md hover:opacity-100 opacity-70" title="Delete">
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>
    </li>
  );
}

function EditModal({
  draft, templates, onCancel, onSave, onChange, saving, error,
}: {
  draft: DraftProvider;
  templates: { key: string; title: string }[];
  onCancel: () => void;
  onSave: () => void;
  onChange: (patch: Partial<DraftProvider>) => void;
  saving: boolean;
  error: string | null;
}) {
  const valid = draft.name.trim().length > 0 && draft.url.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="ikf-card p-7 max-w-xl w-full space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-bold">{draft.id ? "Edit provider" : "Add provider"}</h2>
          <button onClick={onCancel} className="opacity-70 hover:opacity-100"><X size={18} /></button>
        </div>

        {error && (
          <div className="p-3 rounded-lg text-[12px]" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>
            {error}
          </div>
        )}

        <Field label="Assessment">
          <select
            className="ikf-input"
            value={draft.assessmentKey}
            onChange={e => onChange({ assessmentKey: e.target.value })}
          >
            {templates.map(t => (
              <option key={t.key} value={t.key}>{t.title}</option>
            ))}
          </select>
        </Field>

        <Field label="Name">
          <input className="ikf-input" value={draft.name} onChange={e => onChange({ name: e.target.value })} placeholder="FootballTech India" />
        </Field>

        <Field label="Booking / order URL">
          <input className="ikf-input" value={draft.url} onChange={e => onChange({ url: e.target.value })} placeholder="https://provider.com/book" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="City (optional)">
            <input className="ikf-input" value={draft.city} onChange={e => onChange({ city: e.target.value })} placeholder="Bengaluru" />
          </Field>
          <Field label="Report charges ₹ (optional)">
            <input
              className="ikf-input"
              type="number"
              min={0}
              inputMode="numeric"
              value={draft.chargeInr}
              onChange={e => onChange({ chargeInr: e.target.value })}
              placeholder="e.g. 2500"
            />
          </Field>
        </div>
        <div>
          <Field label="Visible to parents">
            <button
              onClick={() => onChange({ isActive: !draft.isActive })}
              className="ikf-input flex items-center justify-between"
              type="button"
            >
              <span>{draft.isActive ? "Active" : "Hidden"}</span>
              <span
                className="inline-block w-10 h-6 rounded-full relative"
                style={{ background: draft.isActive ? "var(--ikf-brand)" : "var(--ikf-surface-2)" }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full"
                  style={{ left: draft.isActive ? "calc(100% - 22px)" : "2px", background: draft.isActive ? "#0B1220" : "#666" }}
                />
              </span>
            </button>
          </Field>
        </div>

        <Field label="Description (optional)">
          <textarea
            className="ikf-input"
            rows={3}
            value={draft.description}
            onChange={e => onChange({ description: e.target.value })}
            placeholder="Two-session technical evaluation, report in 5 days."
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-md text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!valid || saving}
            className="ikf-btn-primary inline-flex items-center gap-2 text-[13px] disabled:opacity-50"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: "var(--ikf-text-dim)" }}>
        {label}
      </div>
      {children}
    </label>
  );
}
