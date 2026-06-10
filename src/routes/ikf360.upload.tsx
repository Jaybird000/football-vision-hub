import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Check, Clock, ExternalLink, FileUp, ShieldCheck, ArrowRight, Loader2, AlertCircle, FileText, Trash2, LifeBuoy, Send, CheckCircle2 } from "lucide-react";
import { getMyStage2, uploadAssessment, deleteUpload, requestMentorAssistance, type Stage2State, type UploadRecord } from "@/server/stage2";

export const Route = createFileRoute("/ikf360/upload")({
  loader: async () => ({ initial: await getMyStage2() }),
  component: UploadPortal,
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

function UploadPortal() {
  const { initial } = Route.useLoaderData();
  const qc = useQueryClient();
  const { data: state = initial } = useQuery({
    queryKey: ["stage2"],
    queryFn: () => getMyStage2(),
    initialData: initial,
  });

  if (!state.profileId) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <div className="ikf-card p-8 text-center space-y-4">
          <AlertCircle size={40} className="mx-auto" style={{ color: "var(--ikf-brand-ink)" }} />
          <h1 className="text-[22px] sm:text-[28px] leading-tight">Complete the Parent SOP first</h1>
          <p className="text-[14px]" style={{ color: "var(--ikf-text-dim)" }}>
            Stage 2 unlocks automatically as soon as you've finished Stage 1.
          </p>
          <Link to="/ikf360/intent" className="ikf-btn-primary inline-flex items-center gap-2">
            Open the Parent SOP <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return <Portal state={state} onChanged={() => qc.invalidateQueries({ queryKey: ["stage2"] })} />;
}

function Portal({ state, onChanged }: { state: Stage2State; onChanged: () => void }) {
  const grouped = state.templates.reduce<Record<string, Stage2State["templates"]>>((acc, t) => {
    (acc[t.category] ||= []).push(t); return acc;
  }, {});

  const uploadByKey = new Map(state.uploads.map(u => [u.assessmentKey, u]));
  const providersByKey = state.templates.reduce<Record<string, Stage2State["providers"]>>((acc, t) => {
    acc[t.key] = state.providers.filter(p => p.assessmentKey === t.key);
    return acc;
  }, {});

  // Module E: required reports the parent hasn't uploaded yet — drives the
  // "don't have these documents? contact your IKF mentor" panel.
  const missingRequired = state.templates.filter(t => t.required && !uploadByKey.has(t.key));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>
          <span>Stage 2 of 3 — Deep Assessment</span>
          <span>{state.uploadedRequiredCount} of {state.requiredKeys.length} required uploaded</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--ikf-surface-2)" }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${state.requiredKeys.length === 0 ? 0 : (state.uploadedRequiredCount / state.requiredKeys.length) * 100}%`,
              background: "var(--ikf-brand)",
            }}
          />
        </div>
      </div>

      <header className="mb-8">
        <h1 className="text-[26px] sm:text-[34px] leading-tight">Upload your child's reports</h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
          {state.childName ? `For ${state.childName}. ` : ""}IKF doesn't conduct these assessments — pick a recommended provider, get the report, then upload the PDF/DOC/JPG here. Re-uploads overwrite the previous version.
        </p>
      </header>

      {missingRequired.length > 0 && (
        <MentorAssistancePanel state={state} missingCount={missingRequired.length} onChanged={onChanged} />
      )}

      {state.minimumDatasetReached && (
        <div
          className="ikf-card p-5 mb-8 flex items-center justify-between gap-4 flex-wrap"
          style={{ borderColor: "var(--ikf-brand)" }}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck size={22} style={{ color: "var(--ikf-brand-ink)" }} />
            <span className="text-[14px]">
              Minimum required dataset reached. Your advisor has been notified — Stage 3 recommendation will be issued within 48 hours.
            </span>
          </div>
          <Link to="/ikf360/dashboard" className="ikf-btn-primary inline-flex items-center gap-2 text-[13px]">
            See Stage 3 <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="mb-10">
          <div className="flex items-end gap-3 mb-4">
            <h2 className="text-[22px] font-bold">{category}</h2>
            <span className="text-[12px] uppercase tracking-[0.14em] mb-1" style={{ color: "var(--ikf-text-dim)" }}>
              {items.length} report{items.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {items.map(t => (
              <AssessmentCard
                key={t.key}
                template={t}
                upload={uploadByKey.get(t.key)}
                providers={providersByKey[t.key] ?? []}
                onChanged={onChanged}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function MentorAssistancePanel({
  state,
  missingCount,
  onChanged,
}: {
  state: Stage2State;
  missingCount: number;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: async () => requestMentorAssistance({ data: { message: message.trim() } }),
    onSuccess: () => onChanged(),
  });

  // Already requested (this session or a prior visit) → show the reassuring
  // "we've got it" state instead of the form.
  if (state.assistanceRequestedAt || mutation.isSuccess) {
    return (
      <div className="ikf-card p-6 mb-8 flex items-start gap-3" style={{ borderColor: "var(--ikf-brand)" }}>
        <CheckCircle2 size={22} className="mt-0.5 shrink-0" style={{ color: "var(--ikf-brand-ink)" }} />
        <div>
          <h3 className="text-[16px] font-bold">Your request is in.</h3>
          <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
            Your IKF mentor has been notified and will get back to you within 48 hours to guide you on the documents you're missing. There's nothing more you need to do right now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ikf-card p-6 mb-8" style={{ borderColor: "var(--ikf-brand)", borderStyle: "dashed" }}>
      <div className="flex items-start gap-3">
        <LifeBuoy size={22} className="mt-0.5 shrink-0" style={{ color: "var(--ikf-brand-ink)" }} />
        <div className="flex-1">
          <h3 className="text-[16px] font-bold">Don't have these documents?</h3>
          <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
            That's completely fine. If you don't currently have {missingCount === 1 ? "this report" : "these reports"}, your IKF mentor can guide you on the next steps — usually within 48 hours.
          </p>

          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="ikf-btn-primary inline-flex items-center gap-2 text-[13px] mt-4"
            >
              <LifeBuoy size={14} /> Contact my IKF Mentor
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              <label className="block">
                <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>
                  Anything you'd like your mentor to know? (optional)
                </div>
                <textarea
                  className="ikf-input"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. We haven't done the fitness or psychometric assessments yet and aren't sure where to start."
                  maxLength={2000}
                />
              </label>
              {mutation.isError && (
                <div
                  className="text-[12px] p-3 rounded-lg"
                  style={{ background: "rgba(220, 38, 38, 0.08)", color: "#dc2626", border: "1px solid rgba(220, 38, 38, 0.2)" }}
                >
                  {mutation.error instanceof Error ? mutation.error.message : "Could not send your request."}
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                  className="ikf-btn-primary inline-flex items-center gap-2 text-[13px] disabled:opacity-50"
                >
                  {mutation.isPending ? (
                    <><Loader2 size={14} className="animate-spin" /> Sending…</>
                  ) : (
                    <><Send size={14} /> Request assistance</>
                  )}
                </button>
                <button onClick={() => setOpen(false)} className="text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AssessmentCard({
  template,
  upload,
  providers,
  onChanged,
}: {
  template: Stage2State["templates"][number];
  upload: UploadRecord | undefined;
  providers: Stage2State["providers"];
  onChanged: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.set("assessmentKey", template.key);
      fd.set("file", file);
      return uploadAssessment({ data: fd });
    },
    onSuccess: () => { setError(null); onChanged(); },
    onError: (err) => setError(err instanceof Error ? err.message : "Upload failed."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteUpload({ data: { uploadId: id } }),
    onSuccess: () => onChanged(),
    onError: (err) => setError(err instanceof Error ? err.message : "Could not remove file."),
  });

  function pickFile() { fileRef.current?.click(); }
  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    uploadMutation.mutate(f);
    e.target.value = "";
  }

  const status: "verified" | "uploaded" | "pending" | "rejected" = upload?.status ?? "pending";
  const isRequired = template.required;

  return (
    <div className="ikf-card p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-[16px] font-bold leading-tight">{template.title}</h3>
          {isRequired ? (
            <div className="text-[10px] uppercase tracking-[0.14em] mt-1.5 font-bold" style={{ color: "var(--ikf-brand-ink)" }}>
              Required
            </div>
          ) : (
            <div className="text-[10px] uppercase tracking-[0.14em] mt-1.5" style={{ color: "var(--ikf-text-dim)" }}>
              Optional
            </div>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      {template.description && (
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
          {template.description}
        </p>
      )}

      {providers.length > 0 && (
        <div className="text-[12px]">
          <div className="uppercase tracking-[0.14em] mb-2 flex items-center justify-between gap-2" style={{ color: "var(--ikf-text-dim)" }}>
            <span>Recommended providers</span>
            {providers.some(p => p.chargeInr != null) && <span>Report charge</span>}
          </div>
          <ul className="space-y-1.5">
            {providers.map(p => (
              <li key={p.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:underline"
                    style={{ color: "var(--ikf-brand-ink)" }}
                  >
                    {p.name}{p.city ? ` · ${p.city}` : ""} <ExternalLink size={11} />
                  </a>
                  {p.description && (
                    <span className="ml-2 text-[12px]" style={{ color: "var(--ikf-text-dim)" }}>
                      — {p.description}
                    </span>
                  )}
                </div>
                {p.chargeInr != null && (
                  <span className="shrink-0 text-[12px] font-bold tabular-nums" style={{ color: "var(--ikf-accent)" }}>
                    ₹{p.chargeInr.toLocaleString("en-IN")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {upload && (
        <div className="rounded-lg p-3 text-[12px] flex items-center justify-between gap-3" style={{ background: "var(--ikf-surface-2)" }}>
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={14} style={{ color: "var(--ikf-text-dim)", flexShrink: 0 }} />
            <a
              href={`/api/uploads/${upload.id}?inline=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:underline"
              title={upload.fileName}
            >
              {upload.fileName}
            </a>
            <span className="opacity-60 flex-shrink-0">· {formatBytes(upload.fileSize)}</span>
          </div>
          <button
            onClick={() => deleteMutation.mutate(upload.id)}
            disabled={deleteMutation.isPending}
            className="opacity-60 hover:opacity-100 transition-opacity"
            title="Remove file"
          >
            {deleteMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </div>
      )}

      {error && (
        <div
          className="text-[12px] p-3 rounded-lg"
          style={{
            background: "rgba(220, 38, 38, 0.08)",
            color: "#dc2626",
            border: "1px solid rgba(220, 38, 38, 0.2)",
          }}
        >
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 mt-auto">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_MIME.join(",")}
          onChange={onChange}
          hidden
        />
        <button
          onClick={pickFile}
          disabled={uploadMutation.isPending}
          className="ikf-btn-primary inline-flex items-center gap-2 text-[13px] disabled:opacity-50"
        >
          {uploadMutation.isPending ? (
            <><Loader2 size={14} className="animate-spin" /> Uploading…</>
          ) : (
            <><FileUp size={14} /> {upload ? "Replace file" : "Upload file"}</>
          )}
        </button>
        <span className="text-[11px]" style={{ color: "var(--ikf-text-dim)" }}>
          PDF, DOC, DOCX, JPG, PNG · Max 15 MB
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "verified" | "uploaded" | "pending" | "rejected" }) {
  const map = {
    verified:  { bg: "rgba(34,197,94,0.12)",  color: "#22c55e", label: "Verified", icon: <Check size={11} /> },
    uploaded:  { bg: "rgba(245,197,24,0.18)", color: "#8A6D08", label: "Uploaded", icon: <FileUp size={11} /> },
    pending:   { bg: "rgba(160,160,160,0.12)", color: "#9ca3af", label: "Pending",  icon: <Clock size={11} /> },
    rejected:  { bg: "rgba(220,38,38,0.12)",  color: "#dc2626", label: "Rejected", icon: <AlertCircle size={11} /> },
  } as const;
  const cfg = map[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.12em] font-bold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}
