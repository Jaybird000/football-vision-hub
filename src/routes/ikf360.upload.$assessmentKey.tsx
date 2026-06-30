import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, FileUp, FileText, Trash2, Loader2, ExternalLink, Download, Zap, AlertCircle } from "lucide-react";
import { getMyStage2, uploadAssessment, deleteUpload, type Stage2State } from "@/server/stage2";

export const Route = createFileRoute("/ikf360/upload/$assessmentKey")({
  loader: async () => ({ initial: await getMyStage2() }),
  component: AssessmentUploadPage,
});

const ACCEPTED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function AssessmentUploadPage() {
  const { initial } = Route.useLoaderData();
  const { assessmentKey } = Route.useParams();
  const qc = useQueryClient();
  const { data: state = initial } = useQuery({
    queryKey: ["stage2"],
    queryFn: () => getMyStage2(),
    initialData: initial,
  });

  const template = state.templates.find(t => t.key === assessmentKey);

  if (!state.profileId) {
    return (
      <Shell>
        <div className="ikf-card p-8 text-center space-y-4">
          <AlertCircle size={36} className="mx-auto" style={{ color: "var(--ikf-brand-ink)" }} />
          <h1 className="text-[24px]">Complete the Parent SOP first</h1>
          <Link to="/ikf360/intent" className="ikf-btn-primary inline-flex items-center gap-2">Open the Parent SOP <ArrowRight size={16} /></Link>
        </div>
      </Shell>
    );
  }
  if (!template) {
    return (
      <Shell>
        <div className="ikf-card p-8 text-center space-y-4">
          <h1 className="text-[24px]">Assessment not found</h1>
          <Link to="/ikf360/upload" className="ikf-btn-primary inline-flex items-center gap-2">Back to all reports</Link>
        </div>
      </Shell>
    );
  }

  const upload = state.uploads.find(u => u.assessmentKey === assessmentKey);
  const providers = state.providers.filter(p => p.assessmentKey === assessmentKey);
  const integrated = providers.filter(p => p.integrationType === "integrated");
  const manual = providers.filter(p => p.integrationType !== "integrated");

  return (
    <Shell>
      <Link to="/ikf360/upload" className="text-[12px] uppercase tracking-[0.14em] inline-flex items-center gap-1 mb-4" style={{ color: "var(--ikf-text-dim)" }}>
        <ArrowLeft size={12} /> All reports
      </Link>

      {/* Context — what this is and why it matters */}
      <header className="mb-7">
        <div className="text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: "var(--ikf-brand-ink)" }}>
          {template.category} · {template.required ? "Required" : "Optional"}
        </div>
        <h1 className="text-[26px] sm:text-[32px] leading-tight">{template.title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
          {template.contextMd || template.description || "Upload this report so your mentor can build an accurate picture of your child."}
        </p>
      </header>

      {/* Existing upload */}
      {upload && <UploadedFile upload={upload} onChanged={() => qc.invalidateQueries({ queryKey: ["stage2"] })} />}

      {/* Integrated partners — auto-fetch (stubbed / coming soon) */}
      {integrated.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[13px] uppercase tracking-[0.14em] mb-3" style={{ color: "var(--ikf-text-dim)" }}>Connected partners</h2>
          <div className="space-y-2">
            {integrated.map(p => (
              <div key={p.id} className="ikf-card p-4 flex items-start justify-between gap-3" style={{ background: "var(--ikf-surface-2)" }}>
                <div className="flex items-start gap-2.5">
                  <Zap size={16} className="mt-0.5 shrink-0" style={{ color: "var(--ikf-brand-ink)" }} />
                  <div>
                    <div className="font-semibold text-[14px]">{p.name}{p.city ? ` · ${p.city}` : ""}</div>
                    <div className="text-[12px] mt-0.5" style={{ color: "var(--ikf-text-dim)" }}>
                      Connected partner — once the integration is live, we'll fetch this report automatically. For now, you can still upload it below.
                    </div>
                  </div>
                </div>
                <span className="ikf-chip shrink-0" style={{ background: "var(--ikf-surface)", color: "var(--ikf-text-dim)" }}>Auto-fetch soon</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Manual upload — pick a partner (or IKF format) and upload */}
      <ManualUpload
        assessmentKey={assessmentKey}
        formatUrl={template.formatUrl}
        manualProviders={manual}
        existingProviderId={upload?.providerId ?? null}
        onChanged={() => qc.invalidateQueries({ queryKey: ["stage2"] })}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="max-w-2xl mx-auto">{children}</div>;
}

function UploadedFile({ upload, onChanged }: { upload: Stage2State["uploads"][number]; onChanged: () => void }) {
  const del = useMutation({
    mutationFn: () => deleteUpload({ data: { uploadId: upload.id } }),
    onSuccess: onChanged,
  });
  return (
    <div className="ikf-card p-4 mb-6 flex items-center justify-between gap-3" style={{ borderColor: "var(--ikf-brand)" }}>
      <div className="flex items-center gap-2 min-w-0">
        <FileText size={16} style={{ color: "var(--ikf-brand-ink)", flexShrink: 0 }} />
        <a href={`/api/uploads/${upload.id}?inline=1`} target="_blank" rel="noopener noreferrer" className="truncate hover:underline font-semibold text-[13px]" title={upload.fileName}>
          {upload.fileName}
        </a>
        <span className="text-[12px] opacity-60 shrink-0">· {formatBytes(upload.fileSize)}</span>
        {upload.providerName && <span className="text-[12px] opacity-70 shrink-0 truncate">· {upload.providerName}</span>}
      </div>
      <button onClick={() => del.mutate()} disabled={del.isPending} className="opacity-60 hover:opacity-100" title="Remove file">
        {del.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </button>
    </div>
  );
}

// choice: a manual provider id, "own" (IKF format, no partner), or null (nothing yet).
type Choice = string | "own" | null;

function ManualUpload({
  assessmentKey,
  formatUrl,
  manualProviders,
  existingProviderId,
  onChanged,
}: {
  assessmentKey: string;
  formatUrl: string | null;
  manualProviders: Stage2State["providers"];
  existingProviderId: string | null;
  onChanged: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [choice, setChoice] = useState<Choice>(existingProviderId ?? (manualProviders.length === 0 ? "own" : null));

  const up = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.set("assessmentKey", assessmentKey);
      fd.set("file", file);
      if (choice && choice !== "own") fd.set("providerId", choice);
      return uploadAssessment({ data: fd });
    },
    onSuccess: () => { setError(null); onChanged(); },
    onError: (err) => setError(err instanceof Error ? err.message : "Upload failed."),
  });

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    up.mutate(f);
    e.target.value = "";
  }

  const canUpload = choice !== null;

  return (
    <section className="ikf-card p-6">
      <h2 className="text-[16px] font-bold mb-1">Upload the report</h2>
      <p className="text-[13px] mb-4" style={{ color: "var(--ikf-text-dim)" }}>
        Get the report from a partner below, or upload your own in the IKF predefined format. PDF, DOC, DOCX, JPG or PNG · max 15 MB.
      </p>

      {formatUrl && (
        <a href={formatUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[13px] font-semibold mb-4" style={{ color: "var(--ikf-brand-ink)" }}>
          <Download size={14} /> Download the IKF predefined format
        </a>
      )}

      <div className="space-y-2 mb-5">
        {manualProviders.map(p => {
          const selected = choice === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setChoice(selected ? null : p.id)}
              className="w-full text-left rounded-lg border p-3 flex items-start justify-between gap-3 transition-colors"
              style={selected ? { borderColor: "var(--ikf-brand)", background: "var(--ikf-surface-2)" } : { borderColor: "var(--ikf-border)", background: "transparent" }}
            >
              <span className="min-w-0 flex items-start gap-2">
                <Radio on={selected} />
                <span className="min-w-0">
                  <span className="font-semibold text-[13px]">{p.name}{p.city ? ` · ${p.city}` : ""}</span>
                  {p.description && <span className="ml-1.5 text-[12px]" style={{ color: "var(--ikf-text-dim)" }}>— {p.description}</span>}
                  <a href={p.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="ml-1.5 inline-flex items-center gap-1 text-[12px] hover:underline" style={{ color: "var(--ikf-brand-ink)" }}>
                    visit <ExternalLink size={10} />
                  </a>
                </span>
              </span>
              {p.chargeInr != null && (
                <span className="shrink-0 text-[12px] font-bold tabular-nums" style={{ color: "var(--ikf-accent)" }}>₹{p.chargeInr.toLocaleString("en-IN")}</span>
              )}
            </button>
          );
        })}

        {/* Always allow uploading a report not tied to a listed partner. */}
        <button
          type="button"
          onClick={() => setChoice(choice === "own" ? null : "own")}
          className="w-full text-left rounded-lg border p-3 flex items-start gap-2 transition-colors"
          style={choice === "own" ? { borderColor: "var(--ikf-brand)", background: "var(--ikf-surface-2)" } : { borderColor: "var(--ikf-border)", background: "transparent" }}
        >
          <Radio on={choice === "own"} />
          <span className="text-[13px] font-semibold">
            {manualProviders.length > 0 ? "Not via a listed partner — I'll upload my own report" : "Upload the report in the IKF format"}
          </span>
        </button>
      </div>

      {error && (
        <div className="text-[12px] p-3 rounded-lg mb-4" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>
          {error}
        </div>
      )}

      <input ref={fileRef} type="file" accept={ACCEPTED_MIME.join(",")} onChange={onPick} hidden />
      <div className="flex items-center gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={up.isPending || !canUpload}
          className="ikf-btn-primary inline-flex items-center gap-2 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {up.isPending ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><FileUp size={14} /> {existingProviderId !== null ? "Replace file" : "Choose a file"}</>}
        </button>
        {!canUpload && <span className="text-[11px]" style={{ color: "var(--ikf-text-dim)" }}>Pick a partner or "own report" first</span>}
      </div>
    </section>
  );
}

function Radio({ on }: { on: boolean }) {
  return (
    <span
      className="mt-0.5 shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full"
      style={{ border: `2px solid ${on ? "var(--ikf-brand)" : "var(--ikf-border)"}`, background: on ? "var(--ikf-brand)" : "transparent", color: "#0B1220" }}
    >
      {on && <Check size={10} strokeWidth={3} />}
    </span>
  );
}
