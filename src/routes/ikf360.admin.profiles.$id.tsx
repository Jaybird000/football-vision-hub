import { createFileRoute, redirect, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Loader2, Check, FileText, ExternalLink, CheckCircle2, XCircle, Clock, Eye, X, LifeBuoy } from "lucide-react";
import { currentUser } from "@/server/auth";
import { listAxes, getAdminProfileDetail, getProfileCategorisation, scoreProfile } from "@/server/stage3";
import { setUploadStatus } from "@/server/stage2";
import { listMentors, assignMentor } from "@/server/admin";
import { INTENT_QUESTIONS, JOURNEY_QUESTIONS, ACADEMIC_MODIFIERS, PARENT_TYPE_DOC, suggestParentType, type SopResponses, type AcademicModifier } from "@/lib/ikf360-data";

// Reconstruct the parent's chosen answer text from the stored score. The SOP
// stores only the option score (1-4), not which option — so for the few
// questions where two options share a score, both candidates are shown.
function sopAnswerLabel(questionId: string, score: number | undefined): { text: string; ambiguous: boolean } {
  const q = INTENT_QUESTIONS.find(qq => qq.id === questionId);
  if (!q || score === undefined) return { text: "—", ambiguous: false };
  const matches = q.options.filter(o => o.score === score).map(o => o.label);
  if (matches.length === 0) return { text: `Score ${score}`, ambiguous: false };
  return { text: matches.join("  /  "), ambiguous: matches.length > 1 };
}

export const Route = createFileRoute("/ikf360/admin/profiles/$id")({
  beforeLoad: async () => {
    const user = await currentUser();
    if (!user || (user.role !== "admin" && user.role !== "advisor")) {
      throw redirect({ to: "/login" });
    }
  },
  loader: async ({ params }) => ({
    profile: await getAdminProfileDetail({ data: { profileId: params.id } }),
    axes: await listAxes(),
    categorisation: await getProfileCategorisation({ data: { profileId: params.id } }),
    mentors: await listMentors(),
  }),
  component: ProfileScorePage,
});

function ProfileScorePage() {
  const { profile, axes, categorisation: initialCat, mentors } = Route.useLoaderData();
  const params = Route.useParams();
  const qc = useQueryClient();
  const router = useRouter();

  const { data: categorisation = initialCat } = useQuery({
    queryKey: ["admin", "profile-cat", params.id],
    queryFn: () => getProfileCategorisation({ data: { profileId: params.id } }),
    initialData: initialCat,
  });

  const review = useMutation({
    mutationFn: ({ uploadId, status }: { uploadId: string; status: "verified" | "rejected" }) =>
      setUploadStatus({ data: { uploadId, status } }),
    onSuccess: () => router.invalidate(),
  });

  const assign = useMutation({
    mutationFn: (mentorUserId: string | null) =>
      assignMentor({ data: { profileId: params.id, mentorUserId } }),
    onSuccess: () => router.invalidate(),
  });

  const initialSelections = useMemo(() => {
    const map: Record<string, string> = {};
    if (categorisation) {
      for (const av of categorisation.axisValues) map[av.axisKey] = av.valueKey;
    }
    return map;
  }, [categorisation]);

  const [selections, setSelections] = useState<Record<string, string>>(initialSelections);
  const [advisorNotes, setAdvisorNotes] = useState(categorisation?.advisorNotes ?? "");
  const [academicModifier, setAcademicModifier] = useState<AcademicModifier | "">(
    (categorisation?.academicModifier as AcademicModifier | undefined) ?? "",
  );
  const [preview, setPreview] = useState<{ id: string; title: string; fileName: string; mimeType: string } | null>(null);

  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPreview(null); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [preview]);

  const score = useMutation({
    mutationFn: () => scoreProfile({
      data: {
        profileId: params.id,
        selections: Object.entries(selections).map(([axisKey, valueKey]) => ({ axisKey, valueKey })),
        advisorNotes,
        academicModifier: academicModifier || null,
      },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "profile-cat", params.id] });
      qc.invalidateQueries({ queryKey: ["admin", "profiles"] });
    },
  });

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto py-10 text-center" style={{ color: "var(--ikf-text-dim)" }}>
        Profile not found.{" "}
        <Link to="/ikf360/admin" className="underline" style={{ color: "var(--ikf-brand-ink)" }}>Back to admin</Link>
      </div>
    );
  }

  const allAxesSelected = axes.length > 0 && axes.every(a => selections[a.key]);
  const hasAxes = axes.length > 0;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <Link to="/ikf360/admin" className="text-[12px] uppercase tracking-[0.14em] inline-flex items-center gap-1 mb-3" style={{ color: "var(--ikf-text-dim)" }}>
          <ArrowLeft size={12} /> Back to profiles
        </Link>
        <h1 className="text-[34px] leading-tight">{profile.childName}</h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--ikf-text-dim)" }}>
          {profile.parentName} · {profile.parentEmail} · readiness <span className="font-semibold">{profile.readiness}</span> · stage <span className="font-semibold">{profile.stage}</span>
        </p>
      </div>

      <section className="ikf-card p-5 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-[15px] font-bold">Assigned mentor</h2>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--ikf-text-dim)" }}>
              {profile.advisorName ? <>Currently <span className="font-semibold">{profile.advisorName}</span>. The mentor is emailed when assigned.</> : "Not assigned yet. The mentor is emailed when you assign them."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="ikf-input"
              value={profile.advisorId ?? ""}
              disabled={assign.isPending}
              onChange={e => assign.mutate(e.target.value || null)}
            >
              <option value="">— Unassigned —</option>
              {mentors.map(m => (
                <option key={m.id} value={m.id}>{m.fullName} ({m.activeParents})</option>
              ))}
            </select>
            {assign.isPending && <Loader2 size={16} className="animate-spin" style={{ color: "var(--ikf-brand-ink)" }} />}
          </div>
        </div>
        {assign.error && (
          <div className="mt-3 p-2.5 rounded-lg text-[12px]" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626" }}>
            {assign.error instanceof Error ? assign.error.message : "Couldn't update the mentor."}
          </div>
        )}
      </section>

      {profile.assistanceRequests.length > 0 && (
        <section className="ikf-card p-5 mb-6" style={{ borderColor: "var(--ikf-brand)" }}>
          <div className="flex items-center gap-2 mb-3">
            <LifeBuoy size={16} style={{ color: "var(--ikf-brand-ink)" }} />
            <h2 className="text-[15px] font-bold">Mentor help requested</h2>
          </div>
          <ul className="space-y-3">
            {profile.assistanceRequests.map(a => (
              <li key={a.id} className="rounded-lg p-3 text-[13px]" style={{ background: "var(--ikf-surface-2)" }}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-[11px] uppercase tracking-[0.12em]" style={{ color: a.status === "open" ? "var(--ikf-brand)" : "var(--ikf-text-dim)" }}>
                    {a.status === "open" ? "Open · awaiting response" : a.status} · {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {a.missingKeys.length > 0 && (
                  <div className="mt-2 text-[12px]" style={{ color: "var(--ikf-text-dim)" }}>
                    Missing at request: {a.missingKeys.join(", ")}
                  </div>
                )}
                {a.message && <p className="mt-2">{a.message}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="ikf-card p-6 mb-6">
        <h2 className="text-[16px] font-bold mb-4">Parent SOP responses</h2>
        <dl className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 mb-6">
          <SopDetail label="Parent" value={profile.parentName} />
          <SopDetail label="Phone" value={profile.parentPhone || "—"} />
          <SopDetail label="City" value={profile.city || "—"} />
          <SopDetail label="Child" value={`${profile.childName} · ${profile.childAge}${profile.childGender && profile.childGender !== "Not specified" ? ` · ${profile.childGender}` : ""}`} />
          <SopDetail label="Submitted" value={new Date(profile.submittedAt).toLocaleDateString()} />
        </dl>
        {profile.sopResponses
          ? <JourneyResponses s={profile.sopResponses} />
          : <LegacyIntentResponses answers={profile.answers} answerChoices={profile.answerChoices} />}
      </section>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
        {/* LEFT — uploaded reports */}
        <section className="ikf-card p-6">
          <h2 className="text-[16px] font-bold mb-4">Uploaded reports ({profile.uploads.length})</h2>
          {profile.uploads.length === 0 ? (
            <div className="text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>No uploads yet.</div>
          ) : (
            <ul className="space-y-2">
              {profile.uploads.map(u => {
                const isPending = review.isPending && review.variables?.uploadId === u.id;
                const pendingStatus = isPending ? review.variables?.status : undefined;
                const status = pendingStatus ?? u.status;
                return (
                  <li key={u.id} className="rounded-lg p-3 space-y-2.5" style={{ background: "var(--ikf-surface-2)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[13px]">{u.assessmentTitle}</span>
                          <UploadStatusBadge status={status} />
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] mt-1" style={{ color: "var(--ikf-text-dim)" }}>
                          <FileText size={11} />
                          {u.fileName} · {new Date(u.uploadedAt).toLocaleDateString()}
                          {u.providerName && <> · Partner: <span className="font-semibold">{u.providerName}</span></>}
                        </div>
                      </div>
                      <a
                        href={`/api/uploads/${u.id}?inline=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[12px] font-semibold shrink-0"
                        style={{ color: "var(--ikf-brand-ink)" }}
                      >
                        Open <ExternalLink size={11} />
                      </a>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setPreview({ id: u.id, title: u.assessmentTitle, fileName: u.fileName, mimeType: u.mimeType })}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border"
                        style={{ borderColor: "var(--ikf-brand)", color: "#8A6D08", background: "rgba(245,197,24,0.12)" }}
                      >
                        <Eye size={11} /> Preview
                      </button>
                      <ReviewButton
                        kind="verify"
                        active={status === "verified"}
                        loading={isPending && pendingStatus === "verified"}
                        disabled={review.isPending}
                        onClick={() => review.mutate({ uploadId: u.id, status: "verified" })}
                      />
                      <ReviewButton
                        kind="reject"
                        active={status === "rejected"}
                        loading={isPending && pendingStatus === "rejected"}
                        disabled={review.isPending}
                        onClick={() => review.mutate({ uploadId: u.id, status: "rejected" })}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {review.error && (
            <div className="mt-3 p-3 rounded-lg text-[12px]" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>
              {review.error instanceof Error ? review.error.message : "Review action failed."}
            </div>
          )}
        </section>

        {/* RIGHT — scoring */}
        <section className="ikf-card p-6 space-y-5">
          <div>
            <h2 className="text-[16px] font-bold">Categorise</h2>
            <p className="text-[12px] mt-1" style={{ color: "var(--ikf-text-dim)" }}>
              Pick one value per axis. The cell's published recommendation will be snapshotted onto this profile.
            </p>
          </div>

          {!hasAxes && (
            <div className="rounded-lg p-3 text-[12px]" style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
              No axes defined yet. <Link to="/ikf360/admin/axes" className="underline">Define axes first</Link>.
            </div>
          )}

          {axes.map(axis => (
            <div key={axis.id}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: "var(--ikf-text-dim)" }}>
                {axis.name}
              </div>
              {axis.key === "parent_capacity" && (
                <ParentTypeSuggestion
                  suggestion={profile.sopResponses ? suggestParentType(profile.sopResponses) : null}
                  current={selections[axis.key]}
                  hasValue={(key) => axis.values.some(v => v.key === key)}
                  onUse={(key) => setSelections({ ...selections, [axis.key]: key })}
                />
              )}
              <div className="grid gap-2">
                {axis.values.map(v => {
                  const selected = selections[axis.key] === v.key;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelections({ ...selections, [axis.key]: v.key })}
                      className="text-left p-3 rounded-lg border transition-colors"
                      style={selected
                        ? { borderColor: "var(--ikf-brand)", background: "rgba(245,197,24,0.12)" }
                        : { borderColor: "var(--ikf-border)", background: "var(--ikf-surface-2)" }}
                    >
                      <div className="font-semibold text-[13px]">{v.label}</div>
                      {v.description && (
                        <div className="text-[11px] mt-0.5" style={{ color: "var(--ikf-text-dim)" }}>{v.description}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: "var(--ikf-text-dim)" }}>
              Academic profile (modifier)
            </div>
            <p className="text-[11px] mb-2" style={{ color: "var(--ikf-text-dim)" }}>
              Not an axis — shifts the recommendation within the category. Optional.
            </p>
            <div className="grid gap-2">
              {(Object.keys(ACADEMIC_MODIFIERS) as AcademicModifier[]).map(k => {
                const selected = academicModifier === k;
                return (
                  <button
                    key={k}
                    onClick={() => setAcademicModifier(selected ? "" : k)}
                    className="text-left p-3 rounded-lg border transition-colors"
                    style={selected
                      ? { borderColor: "var(--ikf-brand)", background: "rgba(245,197,24,0.12)" }
                      : { borderColor: "var(--ikf-border)", background: "var(--ikf-surface-2)" }}
                  >
                    <div className="font-semibold text-[13px]">{ACADEMIC_MODIFIERS[k].label}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--ikf-text-dim)" }}>{ACADEMIC_MODIFIERS[k].blurb}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: "var(--ikf-text-dim)" }}>
              Advisor notes (private, optional)
            </div>
            <textarea
              className="ikf-input"
              rows={3}
              value={advisorNotes}
              onChange={e => setAdvisorNotes(e.target.value)}
              placeholder="Internal notes — not shown to the parent."
            />
          </label>

          {score.error && (
            <div className="p-3 rounded-lg text-[12px]" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>
              {score.error instanceof Error ? score.error.message : "Score failed."}
            </div>
          )}

          <button
            onClick={() => score.mutate()}
            disabled={!allAxesSelected || score.isPending}
            className="ikf-btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {score.isPending ? <><Loader2 size={14} className="animate-spin" /> Scoring…</> : <><Check size={14} /> {categorisation ? "Re-score profile" : "Score profile"}</>}
          </button>

          {categorisation && (
            <div className="rounded-lg p-3 text-[11px]" style={{ background: "var(--ikf-surface-2)", color: "var(--ikf-text-dim)" }}>
              Last scored by <span className="font-semibold" style={{ color: "var(--ikf-text)" }}>{categorisation.scoredByName}</span>
              {" "}on{" "}{new Date(categorisation.scoredAt).toLocaleString()}
              {categorisation.validUntil && <> · valid until {new Date(categorisation.validUntil).toLocaleDateString()}</>}
            </div>
          )}
        </section>
      </div>

      {preview && <PreviewModal preview={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function PreviewModal({
  preview,
  onClose,
}: {
  preview: { id: string; title: string; fileName: string; mimeType: string };
  onClose: () => void;
}) {
  const fileUrl = `/api/uploads/${preview.id}?inline=1`;
  const isPdf = preview.mimeType === "application/pdf";
  const isImage = preview.mimeType.startsWith("image/");
  const canEmbed = isPdf || isImage;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${preview.title}`}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      style={{ background: "rgba(0, 0, 0, 0.75)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl h-full max-h-[90vh] rounded-lg overflow-hidden flex flex-col"
        style={{ background: "var(--ikf-bg)", border: "1px solid var(--ikf-border)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b shrink-0" style={{ borderColor: "var(--ikf-border)", background: "var(--ikf-surface-2)" }}>
          <div className="min-w-0">
            <div className="font-semibold text-[14px] truncate">{preview.title}</div>
            <div className="text-[11px] truncate" style={{ color: "var(--ikf-text-dim)" }}>{preview.fileName}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-md"
              style={{ color: "var(--ikf-brand-ink)" }}
            >
              Open in new tab <ExternalLink size={11} />
            </a>
            <button
              onClick={onClose}
              aria-label="Close preview"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md"
              style={{ background: "var(--ikf-surface)", color: "var(--ikf-text)" }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0" style={{ background: "#111" }}>
          {canEmbed ? (
            isImage ? (
              <div className="w-full h-full flex items-center justify-center overflow-auto">
                <img src={fileUrl} alt={preview.fileName} className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <iframe
                src={fileUrl}
                title={preview.title}
                className="w-full h-full border-0"
              />
            )
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center px-6 gap-3" style={{ color: "var(--ikf-text-dim)" }}>
              <FileText size={36} style={{ color: "var(--ikf-brand-ink)" }} />
              <div className="text-[14px]">In-browser preview isn't supported for <code>{preview.mimeType}</code>.</div>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ikf-btn-primary inline-flex items-center gap-2 text-[13px]"
              >
                Open in new tab <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SopDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-0.5" style={{ color: "var(--ikf-text-dim)" }}>{label}</dt>
      <dd className="text-[13px]">{value}</dd>
    </div>
  );
}

// SOP-derived parent-type suggestion + the read-only "how it's assigned" doc
// (feedback 30 Jun 2026, item 1). Advisor confirms or overrides.
function ParentTypeSuggestion({
  suggestion, current, hasValue, onUse,
}: {
  suggestion: ReturnType<typeof suggestParentType>;
  current: string | undefined;
  hasValue: (key: string) => boolean;
  onUse: (key: string) => void;
}) {
  const [showDoc, setShowDoc] = useState(false);
  const valid = suggestion && hasValue(suggestion.valueKey);
  return (
    <div className="mb-2 rounded-lg p-3 text-[12px]" style={{ background: "var(--ikf-surface-2)", border: "1px dashed var(--ikf-border)" }}>
      {valid ? (
        <div className="flex items-start justify-between gap-3">
          <div>
            <span style={{ color: "var(--ikf-text-dim)" }}>Suggested from the SOP: </span>
            <span className="font-semibold">{suggestion!.label}</span>
            <div className="mt-0.5" style={{ color: "var(--ikf-text-dim)" }}>{suggestion!.rationale}</div>
          </div>
          {current !== suggestion!.valueKey && (
            <button onClick={() => onUse(suggestion!.valueKey)} className="shrink-0 text-[11px] font-semibold underline" style={{ color: "var(--ikf-brand-ink)" }}>
              Use this
            </button>
          )}
        </div>
      ) : (
        <div style={{ color: "var(--ikf-text-dim)" }}>No SOP-based suggestion yet (the family answers needed aren't on file).</div>
      )}
      <button onClick={() => setShowDoc(v => !v)} className="mt-2 text-[11px] underline" style={{ color: "var(--ikf-text-dim)" }}>
        {showDoc ? "Hide" : "How parent types are assigned"}
      </button>
      {showDoc && (
        <div className="mt-2 space-y-2" style={{ color: "var(--ikf-text-dim)" }}>
          <p>{PARENT_TYPE_DOC.intro}</p>
          <p>{PARENT_TYPE_DOC.logic}</p>
          <ul className="space-y-1.5">
            {PARENT_TYPE_DOC.types.map(t => (
              <li key={t.key}>
                <span className="font-semibold" style={{ color: "var(--ikf-text)" }}>{t.label}</span> — {t.meaning} <span className="opacity-80">({t.signals})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// New 4-section / 11-question Parent Journey SOP (migration 0014). Renders the
// parent's exact answers grouped as a numbered Q&A list.
function JourneyResponses({ s }: { s: SopResponses }) {
  const qText = (id: string) => JOURNEY_QUESTIONS.find(q => q.id === id)?.q ?? id;
  const concern =
    s.q6.choices.map(c => (c === "Something else" && s.q6.other ? `Something else — ${s.q6.other}` : c)).join("  ·  ") || "—";
  const prior =
    s.q4.prior === "yes" ? `Yes${s.q4.detail ? ` — ${s.q4.detail}` : ""}`
    : s.q4.prior === "no" ? "No — first contact with IKF"
    : "—";
  const rows: { q: string; a: string }[] = [
    { q: qText("q2"), a: s.q2 || "—" },
    { q: qText("q3"), a: s.q3 || "—" },
    { q: qText("q4"), a: prior },
    { q: qText("q5"), a: s.q5 || "—" },
    { q: qText("q6"), a: concern },
    { q: qText("q7"), a: s.q7 || "—" },
    { q: qText("q8"), a: s.q8 || "—" },
    { q: qText("q9"), a: s.q9 || "—" },
    { q: qText("q10"), a: s.q10 || "—" },
    { q: "Anything else they wanted us to know", a: s.q11 || "—" },
  ];
  return (
    <ol className="space-y-3">
      {rows.map((row, i) => (
        <li key={i} className="rounded-lg p-3" style={{ background: "var(--ikf-surface-2)" }}>
          <div className="text-[12px] mb-1" style={{ color: "var(--ikf-text-dim)" }}>{i + 1}. {row.q}</div>
          <div className="text-[14px] font-medium whitespace-pre-wrap">{row.a}</div>
        </li>
      ))}
    </ol>
  );
}

// Legacy 8-question intent (pre-0014 profiles). Prefers exact option text (0013);
// falls back to score-based reconstruction for pre-0013 rows.
function LegacyIntentResponses({ answers, answerChoices }: { answers: Record<string, number>; answerChoices: Record<string, string> }) {
  return (
    <ol className="space-y-3">
      {INTENT_QUESTIONS.map((q, i) => {
        const exact = answerChoices?.[q.id];
        const ans = exact ? { text: exact, ambiguous: false } : sopAnswerLabel(q.id, answers[q.id]);
        return (
          <li key={q.id} className="rounded-lg p-3" style={{ background: "var(--ikf-surface-2)" }}>
            <div className="text-[12px] mb-1" style={{ color: "var(--ikf-text-dim)" }}>{i + 1}. {q.q}</div>
            <div className="text-[14px] font-medium">
              {ans.text}
              {ans.ambiguous && (
                <span className="ml-2 text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--ikf-text-dim)" }} title="Submitted before exact-answer capture; the SOP stored only the score, and two options share it.">
                  (either)
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function UploadStatusBadge({ status }: { status: string }) {
  const config =
    status === "verified"
      ? { label: "Verified", icon: CheckCircle2, bg: "rgba(34,197,94,0.12)", color: "#22c55e" }
      : status === "rejected"
      ? { label: "Rejected", icon: XCircle, bg: "rgba(220,38,38,0.12)", color: "#dc2626" }
      : { label: "Pending review", icon: Clock, bg: "rgba(160,160,160,0.12)", color: "#9ca3af" };
  const Icon = config.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.12em] font-bold"
      style={{ background: config.bg, color: config.color }}
    >
      <Icon size={10} /> {config.label}
    </span>
  );
}

function ReviewButton({
  kind, active, loading, disabled, onClick,
}: {
  kind: "verify" | "reject";
  active: boolean;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const isVerify = kind === "verify";
  const label = isVerify ? "Verify" : "Reject";
  const Icon = isVerify ? CheckCircle2 : XCircle;
  const tint = isVerify ? "#22c55e" : "#dc2626";
  return (
    <button
      onClick={onClick}
      disabled={disabled || active}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border disabled:cursor-not-allowed"
      style={{
        borderColor: active ? tint : "var(--ikf-border)",
        background: active ? `${tint}1a` : "transparent",
        color: active ? tint : "var(--ikf-text)",
        opacity: disabled && !active ? 0.5 : 1,
      }}
    >
      {loading ? <Loader2 size={11} className="animate-spin" /> : <Icon size={11} />} {label}
    </button>
  );
}
