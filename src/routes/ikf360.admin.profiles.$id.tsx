import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ArrowLeft, Loader2, Check, FileText, ExternalLink } from "lucide-react";
import { currentUser } from "@/server/auth";
import { listAxes, getAdminProfileDetail, getProfileCategorisation, scoreProfile } from "@/server/stage3";

export const Route = createFileRoute("/ikf360/admin/profiles/$id")({
  beforeLoad: async () => {
    const user = await currentUser();
    if (!user || (user.role !== "admin" && user.role !== "advisor")) {
      throw redirect({ to: "/admin-login" });
    }
  },
  loader: async ({ params }) => ({
    profile: await getAdminProfileDetail({ data: { profileId: params.id } }),
    axes: await listAxes(),
    categorisation: await getProfileCategorisation({ data: { profileId: params.id } }),
  }),
  component: ProfileScorePage,
});

function ProfileScorePage() {
  const { profile, axes, categorisation: initialCat } = Route.useLoaderData();
  const params = Route.useParams();
  const qc = useQueryClient();

  const { data: categorisation = initialCat } = useQuery({
    queryKey: ["admin", "profile-cat", params.id],
    queryFn: () => getProfileCategorisation({ data: { profileId: params.id } }),
    initialData: initialCat,
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

  const score = useMutation({
    mutationFn: () => scoreProfile({
      data: {
        profileId: params.id,
        selections: Object.entries(selections).map(([axisKey, valueKey]) => ({ axisKey, valueKey })),
        advisorNotes,
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
        <Link to="/ikf360/admin" className="underline" style={{ color: "var(--ikf-brand)" }}>Back to admin</Link>
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

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
        {/* LEFT — uploaded reports */}
        <section className="ikf-card p-6">
          <h2 className="text-[16px] font-bold mb-4">Uploaded reports ({profile.uploads.length})</h2>
          {profile.uploads.length === 0 ? (
            <div className="text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>No uploads yet.</div>
          ) : (
            <ul className="space-y-2">
              {profile.uploads.map(u => (
                <li key={u.id} className="rounded-lg p-3 flex items-center justify-between gap-3" style={{ background: "var(--ikf-surface-2)" }}>
                  <div className="min-w-0">
                    <div className="font-semibold text-[13px] truncate">{u.assessmentTitle}</div>
                    <div className="flex items-center gap-1.5 text-[11px] mt-0.5" style={{ color: "var(--ikf-text-dim)" }}>
                      <FileText size={11} />
                      {u.fileName} · {new Date(u.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <a
                    href={`/api/uploads/${u.id}?inline=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] font-semibold"
                    style={{ color: "var(--ikf-brand)" }}
                  >
                    Open <ExternalLink size={11} />
                  </a>
                </li>
              ))}
            </ul>
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
              <div className="grid gap-2">
                {axis.values.map(v => {
                  const selected = selections[axis.key] === v.key;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelections({ ...selections, [axis.key]: v.key })}
                      className="text-left p-3 rounded-lg border transition-colors"
                      style={selected
                        ? { borderColor: "var(--ikf-brand)", background: "rgba(223,255,94,0.08)" }
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
    </div>
  );
}
