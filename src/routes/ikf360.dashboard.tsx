import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, keepPreviousData } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowRight, Clock, Plus, Compass, GraduationCap, Trophy, Activity, Brain,
  Target, Users, FileText, Flag, CheckCircle2, ChevronRight, Bell, X, CalendarClock, BookOpen,
} from "lucide-react";
import { getMyCategorisation, getMyJourney, type JourneyEvent, type CategorisationSnapshot } from "@/server/stage3";
import { getMyStage2, type Stage2State } from "@/server/stage2";
import { listMyChildren, setActiveChild, getMySop, getMyResponses, getMyMentor, flagSopForReview, type MyChild, type MySopSummary } from "@/server/intent";
import { listMyNotifications, markNotificationRead, type MyNotification } from "@/server/notifications";
import { ACADEMIC_MODIFIERS, JOURNEY_QUESTIONS, type AcademicModifier, type SopResponses } from "@/lib/ikf360-data";
import { refreshWelcome } from "@/server/auth";

export const Route = createFileRoute("/ikf360/dashboard")({
  loader: async () => {
    const children = await listMyChildren();
    const active = children.find(c => c.isActive) ?? children[0] ?? null;
    const profileId = active?.profileId ?? undefined;
    const [categorisation, stage2, journey, sop, notifications, mentor] = await Promise.all([
      getMyCategorisation({ data: { profileId } }),
      getMyStage2({ data: { profileId } }),
      getMyJourney({ data: { profileId } }),
      getMySop({ data: { profileId } }),
      listMyNotifications({ data: { profileId } }),
      getMyMentor({ data: { profileId } }),
    ]);
    // Keep the login-screen personalisation cookie fresh (active child / review date).
    await refreshWelcome().catch(() => {});
    return { children, profileId: active?.profileId ?? null, categorisation, stage2, journey, sop, notifications, mentor };
  },
  component: ParentDashboard,
});

function ParentDashboard() {
  const data = Route.useLoaderData();
  const [selectedId, setSelectedId] = useState<string | null>(data.profileId);

  const isInitial = selectedId === data.profileId;
  const keepPrev = { placeholderData: keepPreviousData } as const;

  const { data: children = data.children } = useQuery({
    queryKey: ["myChildren"],
    queryFn: () => listMyChildren(),
    initialData: data.children,
  });
  const { data: cat } = useQuery({
    queryKey: ["myCat", selectedId],
    queryFn: () => getMyCategorisation({ data: { profileId: selectedId ?? undefined } }),
    initialData: isInitial ? data.categorisation : undefined,
    ...keepPrev,
  });
  const { data: stage2 = data.stage2 } = useQuery({
    queryKey: ["stage2", selectedId],
    queryFn: () => getMyStage2({ data: { profileId: selectedId ?? undefined } }),
    initialData: isInitial ? data.stage2 : undefined,
    ...keepPrev,
  });
  const { data: journey = [] } = useQuery({
    queryKey: ["myJourney", selectedId],
    queryFn: () => getMyJourney({ data: { profileId: selectedId ?? undefined } }),
    initialData: isInitial ? data.journey : undefined,
    ...keepPrev,
  });
  const { data: sop } = useQuery({
    queryKey: ["mySop", selectedId],
    queryFn: () => getMySop({ data: { profileId: selectedId ?? undefined } }),
    initialData: isInitial ? data.sop : undefined,
    ...keepPrev,
  });
  const { data: notifications = [] } = useQuery({
    queryKey: ["myNotifications", selectedId],
    queryFn: () => listMyNotifications({ data: { profileId: selectedId ?? undefined } }),
    initialData: isInitial ? data.notifications : undefined,
    ...keepPrev,
  });
  const { data: mentor } = useQuery({
    queryKey: ["myMentor", selectedId],
    queryFn: () => getMyMentor({ data: { profileId: selectedId ?? undefined } }),
    initialData: isInitial ? data.mentor : undefined,
    ...keepPrev,
  });

  const activeMutation = useMutation({
    mutationFn: (profileId: string) => setActiveChild({ data: { profileId } }),
  });

  function switchChild(id: string) {
    if (id === selectedId) return;
    setSelectedId(id);
    activeMutation.mutate(id); // persist selection so Stage 2 etc. follow it
  }

  const selectedChild = children.find(c => c.profileId === selectedId) ?? children[0] ?? null;

  // Not signed in / no child profile yet
  if (!selectedChild || !stage2?.profileId) {
    return (
      <EmptyCard
        title="Complete the Parent SOP first"
        body="Your dashboard appears here once you've told us about your child."
        to="/ikf360/intent"
        cta="Open the Parent SOP"
      />
    );
  }

  const childName = selectedChild.childName;

  return (
    <div className="max-w-3xl mx-auto">
      <ChildTabs kids={children} selectedId={selectedChild.profileId} onSwitch={switchChild} />
      <GreetingStrip child={selectedChild} sop={sop ?? null} lastReviewed={cat?.scoredAt ?? null} />
      <StatusStrip mentorName={mentor?.name ?? null} stage={selectedChild.stage} stage2={stage2} scored={!!cat} />
      <NotificationStrip items={notifications} />

      {/* Recommendation not published yet — quiet waiting state */}
      {!cat ? (
        <div className="ikf-card p-7 mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <Clock size={20} style={{ color: "var(--ikf-brand-ink)" }} />
            <h2 className="text-[18px] font-bold">{childName}'s picture is still coming together.</h2>
          </div>
          <p className="text-[14px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
            {stage2.minimumDatasetReached
              ? "Everything we need is in. An IKF advisor will review and share where things stand within 48 hours."
              : `${stage2.uploadedRequiredCount} of ${stage2.requiredKeys.length} required reports are in. Adding the rest is what lets us build the full picture.`}
          </p>
          <Link to="/ikf360/upload" className="ikf-btn-primary inline-flex items-center gap-2 text-[13px]">
            Open upload portal <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <>
          <WhereYouStand childName={childName} cat={cat} />
          <FocusAreas childName={childName} cat={cat} />
        </>
      )}

      <JourneyTimeline childName={childName} events={journey} />

      {cat && stage2.providers.length > 0 && (
        <PeopleWhoCanHelp childName={childName} providers={stage2.providers} />
      )}

      {sop?.hasResponses && (
        <YourSop childName={childName} sop={sop} profileId={selectedChild.profileId} />
      )}
    </div>
  );
}

/* ─── Child tabs ──────────────────────────────────────────────────────────── */

function ChildTabs({ kids, selectedId, onSwitch }: { kids: MyChild[]; selectedId: string; onSwitch: (id: string) => void }) {
  const multi = kids.length > 1;
  return (
    <div className="flex items-center gap-2 flex-wrap mb-5">
      {multi && kids.map(c => {
        const active = c.profileId === selectedId;
        return (
          <button
            key={c.profileId}
            onClick={() => onSwitch(c.profileId)}
            className="px-4 py-2 rounded-full text-[13px] font-semibold transition"
            style={{
              background: active ? "var(--ikf-brand)" : "var(--ikf-surface-2)",
              color: "var(--ikf-text)",
            }}
          >
            {c.childName}
          </button>
        );
      })}
      <Link
        to="/ikf360/intent"
        search={{ addChild: true }}
        className="px-3 py-2 rounded-full text-[13px] inline-flex items-center gap-1.5"
        style={{ border: "1px dashed var(--ikf-border)", color: "var(--ikf-text-dim)" }}
      >
        <Plus size={13} /> Add another child
      </Link>
    </div>
  );
}

/* ─── Notification strip ──────────────────────────────────────────────────── */

function NotificationStrip({ items }: { items: MyNotification[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const markRead = useMutation({ mutationFn: (id: string) => markNotificationRead({ data: { id } }) });
  const visible = items.filter(n => !dismissed.has(n.id));
  if (visible.length === 0) return null;
  const icon = (t: MyNotification["type"]) =>
    t === "review_reminder" ? <CalendarClock size={16} /> : t === "content" ? <BookOpen size={16} /> : <Bell size={16} />;
  function dismiss(id: string) {
    setDismissed(prev => new Set(prev).add(id));
    markRead.mutate(id);
  }
  return (
    <div className="mt-5 space-y-2">
      {visible.map(n => (
        <div key={n.id} className="ikf-card p-4 flex items-start gap-3" style={{ borderLeft: "3px solid var(--ikf-brand)" }}>
          <span className="mt-0.5" style={{ color: "var(--ikf-brand-ink)" }}>{icon(n.type)}</span>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold">{n.title}</div>
            {n.body && <div className="text-[12.5px] mt-0.5" style={{ color: "var(--ikf-text-dim)" }}>{n.body}</div>}
            {n.link && (
              <a
                href={n.link}
                target={n.link.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="text-[12.5px] font-semibold inline-flex items-center gap-1 mt-1.5"
                style={{ color: "var(--ikf-brand-ink)" }}
              >
                View <ChevronRight size={13} />
              </a>
            )}
          </div>
          <button onClick={() => dismiss(n.id)} aria-label="Dismiss" className="opacity-50 hover:opacity-100 shrink-0"><X size={15} /></button>
        </div>
      ))}
    </div>
  );
}

/* ─── Greeting strip ──────────────────────────────────────────────────────── */

function GreetingStrip({ child, sop, lastReviewed }: { child: MyChild; sop: MySopSummary | null; lastReviewed: string | null }) {
  const bits = [
    `Age ${child.childAge}`,
    sop?.playingFor ? `Playing for ${sop.playingFor.toLowerCase()}` : null,
    lastReviewed ? `Last reviewed: ${monthLabel(lastReviewed)}` : null,
  ].filter(Boolean) as string[];
  return (
    <div>
      <h1 className="text-[26px] sm:text-[34px] leading-tight">{child.childName}'s pathway</h1>
      <div className="text-[12px] mt-2 flex flex-wrap items-center gap-x-2 gap-y-1" style={{ color: "var(--ikf-text-dim)" }}>
        {bits.map((b, i) => (
          <span key={i} className="inline-flex items-center gap-2">
            {i > 0 && <span aria-hidden>·</span>}{b}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── At-a-glance status: mentor · reports · stage ────────────────────────── */

function StatusStrip({ mentorName, stage, stage2, scored }: { mentorName: string | null; stage: number; stage2: Stage2State; scored: boolean }) {
  void stage;
  const req = stage2.requiredKeys.length;
  const done = stage2.uploadedRequiredCount;
  const statusLabel = scored
    ? "Recommendation ready"
    : stage2.minimumDatasetReached
      ? "Awaiting recommendation"
      : "Gathering reports";
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
      <StatusCell icon={<Users size={15} />} label="Your mentor" value={mentorName ?? "Being assigned"} muted={!mentorName} />
      <StatusCell icon={<FileText size={15} />} label="Reports" value={req > 0 ? `${done} of ${req} required in` : "No required reports"} />
      <StatusCell icon={<Compass size={15} />} label="Status" value={statusLabel} />
    </div>
  );
}

function StatusCell({ icon, label, value, muted }: { icon: ReactNode; label: string; value: string; muted?: boolean }) {
  return (
    <div className="ikf-card p-4">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] mb-1" style={{ color: "var(--ikf-brand-ink)" }}>
        {icon} {label}
      </div>
      <div className="text-[14px] font-semibold" style={{ color: muted ? "var(--ikf-text-dim)" : "var(--ikf-text)" }}>{value}</div>
    </div>
  );
}

/* ─── Module 1 — Where your child stands today ────────────────────────────── */

function WhereYouStand({ childName, cat }: { childName: string; cat: CategorisationSnapshot }) {
  // Prefer the advisor-authored structured content; fall back to parsing the
  // legacy markdown blob.
  const parsed = parseRecommendation(cat.recommendationMd);
  const sc = cat.structuredContent;
  const situation = (sc?.situation?.trim() || "") || parsed.situation;
  const meaning = (sc?.meaning?.trim() || "") || parsed.meaning;
  const review = reviewTiming(cat.scoredAt, cat.validUntil);
  return (
    <section className="ikf-card p-7 mt-6">
      <h2 className="text-[11px] uppercase tracking-[0.16em] mb-4" style={{ color: "var(--ikf-brand-ink)" }}>
        Where {childName} stands today
      </h2>

      {situation && (
        <p className="text-[17px] sm:text-[19px] leading-relaxed font-medium">{situation}</p>
      )}

      {meaning && (
        <div className="mt-5">
          <div className="text-[11px] uppercase tracking-[0.12em] mb-1.5" style={{ color: "var(--ikf-text-dim)" }}>What this means</div>
          <div className="ikf-prose text-[14px] leading-relaxed" style={{ color: "var(--ikf-text)" }}>
            <Markdown>{meaning}</Markdown>
          </div>
        </div>
      )}

      {cat.academicModifier && ACADEMIC_MODIFIERS[cat.academicModifier as AcademicModifier] && (
        <div className="mt-5 rounded-lg p-4" style={{ background: "var(--ikf-surface-2)" }}>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] mb-1.5" style={{ color: "var(--ikf-brand-ink)" }}>
            <GraduationCap size={13} /> {ACADEMIC_MODIFIERS[cat.academicModifier as AcademicModifier].label}
          </div>
          <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
            {ACADEMIC_MODIFIERS[cat.academicModifier as AcademicModifier].blurb}
          </p>
        </div>
      )}

      {review && (
        <div className="mt-6 pt-5 border-t" style={{ borderColor: "var(--ikf-border)" }}>
          <div className="text-[12px] mb-2" style={{ color: "var(--ikf-text-dim)" }}>
            Next review: <span className="font-semibold" style={{ color: "var(--ikf-text)" }}>{review.label}</span>
            {review.monthsAway != null && <> · {review.monthsAway} {review.monthsAway === 1 ? "month" : "months"} away</>}
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--ikf-surface-2)" }}>
            <div className="h-full rounded-full" style={{ width: `${Math.round(review.progress * 100)}%`, background: "var(--ikf-brand)" }} />
          </div>
        </div>
      )}
    </section>
  );
}

/* ─── Module 2 — Your focus areas ─────────────────────────────────────────── */

function FocusAreas({ childName, cat }: { childName: string; cat: CategorisationSnapshot }) {
  // Prefer the structured focus cards; fall back to parsing the markdown ## sections.
  const sc = cat.structuredContent;
  const structuredCards: FocusCard[] = sc
    ? ([
        { key: "football", title: "Football development", icon: <Trophy size={16} />, body: sc.focus.football },
        { key: "academics", title: "Academics", icon: <GraduationCap size={16} />, body: sc.focus.academics },
        { key: "physical", title: "Physical development", icon: <Activity size={16} />, body: sc.focus.physical },
        { key: "mindset", title: "Mindset & resilience", icon: <Brain size={16} />, body: sc.focus.mindset },
      ] as FocusCard[]).filter(c => c.body && c.body.trim().length > 0)
    : [];
  const cards = structuredCards.length > 0 ? structuredCards : parseRecommendation(cat.recommendationMd).cards;
  if (cards.length === 0) return null;
  const until = cat.validUntil ? monthLabel(cat.validUntil) : null;
  return (
    <section className="mt-5">
      <h2 className="text-[15px] uppercase tracking-[0.12em] font-bold mb-4 px-1">
        {until ? `What to focus on between now and ${until}` : "What to focus on"}
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map(card => (
          <div key={card.key} className="ikf-card p-6">
            <div className="flex items-center gap-2.5 mb-3">
              <span style={{ color: "var(--ikf-brand-ink)" }}>{card.icon}</span>
              <h3 className="text-[14px] font-bold">{card.title}</h3>
            </div>
            <div className="ikf-prose text-[13.5px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
              <Markdown>{card.body}</Markdown>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Module 3 — Your child's journey so far ──────────────────────────────── */

function JourneyTimeline({ childName, events }: { childName: string; events: JourneyEvent[] }) {
  if (events.length === 0) return null;
  const reviewCount = events.filter(e => e.kind === "review").length;
  let seenReviews = 0;
  return (
    <section className="ikf-card p-7 mt-5">
      <h2 className="text-[15px] uppercase tracking-[0.12em] font-bold mb-5">
        {childName}'s journey so far
      </h2>
      <ol className="relative">
        {events.map((e, i) => {
          let heading: string;
          if (e.kind === "created") {
            heading = "Profile created";
          } else {
            // events are newest-first; the oldest review is "First review"
            const ordinal = reviewCount - seenReviews;
            seenReviews++;
            heading = `${ordinalWord(ordinal)} review`;
          }
          const last = i === events.length - 1;
          return (
            <li key={i} className="relative pl-7 pb-6 last:pb-0">
              {!last && <span className="absolute left-[5px] top-2 bottom-0 w-px" style={{ background: "var(--ikf-border)" }} />}
              <span className="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full" style={{ background: e.kind === "created" ? "var(--ikf-surface-2)" : "var(--ikf-brand)", border: "2px solid var(--ikf-bg)" }} />
              <div className="text-[12px] font-semibold" style={{ color: "var(--ikf-text-dim)" }}>
                {monthLabel(e.date)} — {heading}
              </div>
              <div className="text-[14px] mt-0.5">
                {e.kind === "created"
                  ? `You registered ${childName} on IKF Pathway 360. The Parent SOP was completed.`
                  : e.title}
              </div>
              {e.by && <div className="text-[12px] mt-0.5" style={{ color: "var(--ikf-text-dim)" }}>Reviewed by {e.by}</div>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ─── Module 4 — People who can help ──────────────────────────────────────── */

type Provider = { id: string; assessmentKey: string; name: string; description: string; url: string; city: string | null; chargeInr: number | null };

function PeopleWhoCanHelp({ childName, providers }: { childName: string; providers: Provider[] }) {
  // Group by category — present categories, not a marketplace of names/photos.
  const groups = new Map<string, number>();
  for (const p of providers) {
    const label = PROVIDER_CATEGORY[p.assessmentKey] ?? "Specialist support";
    groups.set(label, (groups.get(label) ?? 0) + 1);
  }
  const cats = [...groups.entries()];
  return (
    <section className="ikf-card p-7 mt-5">
      <h2 className="text-[15px] uppercase tracking-[0.12em] font-bold mb-1.5 flex items-center gap-2">
        <Users size={16} style={{ color: "var(--ikf-brand-ink)" }} /> If you want to go further
      </h2>
      <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: "var(--ikf-text-dim)" }}>
        Based on {childName}'s current profile, here are the kinds of specialists who could add value right now.
        These aren't sales pitches — they're professionals matched to what {childName} actually needs at this stage.
      </p>
      <div className="space-y-3">
        {cats.map(([label, count]) => (
          <div key={label} className="flex items-start justify-between gap-3 p-4 rounded-lg" style={{ background: "var(--ikf-surface-2)" }}>
            <div>
              <div className="text-[14px] font-semibold">{label}</div>
              <div className="text-[12.5px] mt-0.5" style={{ color: "var(--ikf-text-dim)" }}>
                {count} {count === 1 ? "specialist" : "specialists"} available to families like yours.
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-2 text-[13px]">
        <span style={{ color: "var(--ikf-text-dim)" }}>
          Before you choose anyone, the Parent Selection Aid covers what to ask, what to look for, and what to avoid <span title="Guide coming soon" style={{ opacity: 0.7 }}>(coming soon)</span>.
        </span>
        <Link to="/ikf360/upload" className="inline-flex items-center gap-1.5 font-semibold" style={{ color: "var(--ikf-brand-ink)" }}>
          Browse specialists <ChevronRight size={14} />
        </Link>
      </div>
    </section>
  );
}

/* ─── Module 5 — Your SOP ─────────────────────────────────────────────────── */

function YourSop({ childName, sop, profileId }: { childName: string; sop: MySopSummary; profileId: string }) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [note, setNote] = useState("");
  const flag = useMutation({
    mutationFn: () => flagSopForReview({ data: { profileId, note: note.trim() } }),
  });
  // Full submitted answers (feedback 3.b) — fetched lazily when the parent expands.
  const { data: full } = useQuery({
    queryKey: ["myResponses", profileId],
    queryFn: () => getMyResponses({ data: { profileId } }),
    enabled: showAll,
  });
  const lines = [
    { label: "What you're hoping for", value: sop.hopingFor },
    { label: "Your family's capacity", value: sop.capacity },
    { label: "Your openness to relocation", value: sop.relocation },
  ].filter(l => l.value);

  return (
    <section className="ikf-card p-7 mt-5">
      <h2 className="text-[15px] uppercase tracking-[0.12em] font-bold mb-1.5 flex items-center gap-2">
        <FileText size={16} style={{ color: "var(--ikf-brand-ink)" }} /> Your family's statement of purpose
      </h2>
      <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: "var(--ikf-text-dim)" }}>
        This is what you told us when you registered — the foundation of everything in {childName}'s profile.
        If your situation has changed significantly, you can flag it and we'll review.
      </p>
      <dl className="space-y-3">
        {lines.map(l => (
          <div key={l.label}>
            <dt className="text-[11px] uppercase tracking-[0.1em]" style={{ color: "var(--ikf-text-dim)" }}>{l.label}</dt>
            <dd className="text-[14px] mt-0.5">{l.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5">
        <button
          onClick={() => setShowAll(v => !v)}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
          style={{ color: "var(--ikf-brand-ink)" }}
        >
          <ChevronRight size={14} style={{ transform: showAll ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
          {showAll ? "Hide my full answers" : "See everything I submitted"}
        </button>
        {showAll && (
          <div className="mt-4">
            {full ? <FullSopAnswers s={full} /> : (
              <div className="text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>Loading your answers…</div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 pt-5 border-t" style={{ borderColor: "var(--ikf-border)" }}>
        {flag.isSuccess ? (
          <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--ikf-brand-ink)" }}>
            <CheckCircle2 size={15} /> Thank you — an advisor will review {childName}'s profile.
          </div>
        ) : !open ? (
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "var(--ikf-brand-ink)" }}>
            <Flag size={13} /> Something significant has changed in our situation
          </button>
        ) : (
          <div className="space-y-3">
            <label className="text-[13px] font-semibold">What's changed?</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="A short note helps your advisor — e.g. a change in goals, capacity, or timeline."
              className="w-full rounded-lg p-3 text-[13px]"
              style={{ background: "var(--ikf-surface-2)", border: "1px solid var(--ikf-border)" }}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => flag.mutate()}
                disabled={flag.isPending}
                className="ikf-btn-primary text-[13px] disabled:opacity-60"
              >
                {flag.isPending ? "Sending…" : "Flag for review"}
              </button>
              <button onClick={() => setOpen(false)} className="text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>Cancel</button>
            </div>
            {flag.isError && <div className="text-[12px]" style={{ color: "#c0392b" }}>Couldn't send that — please try again.</div>}
          </div>
        )}
      </div>
    </section>
  );
}

// Renders the parent's full submitted SOP — family answers, then this child's
// answers (feedback 3.b — "how can I see what input I gave?").
function FullSopAnswers({ s }: { s: SopResponses }) {
  const qText = (id: string) => JOURNEY_QUESTIONS.find(q => q.id === id)?.q ?? id;
  const concern = s.q6.choices
    .map(c => (c === "Something else" && s.q6.other ? `Something else — ${s.q6.other}` : c))
    .join("  ·  ") || "—";
  const prior = s.q4.prior === "yes" ? `Yes${s.q4.detail ? ` — ${s.q4.detail}` : ""}`
    : s.q4.prior === "no" ? "No — first contact with IKF" : "—";
  const family: { q: string; a: string }[] = [
    { q: qText("q8"), a: s.q8 || "—" },
    { q: qText("q9"), a: s.q9 || "—" },
    { q: qText("q10"), a: s.q10 || "—" },
    { q: qText("q7"), a: s.q7 || "—" },
    { q: qText("q6"), a: concern },
  ];
  const child: { q: string; a: string }[] = [
    { q: "Child", a: `${s.firstName || "—"}${s.age ? ` · age ${s.age}` : ""}` },
    { q: qText("q2"), a: s.q2 || "—" },
    { q: qText("q3"), a: s.q3 || "—" },
    { q: qText("q4"), a: prior },
    { q: qText("q5"), a: s.q5 || "—" },
    { q: "Anything else you wanted us to know", a: s.q11 || "—" },
  ];
  const group = (title: string, rows: { q: string; a: string }[]) => (
    <div>
      <div className="text-[11px] uppercase tracking-[0.12em] mb-2" style={{ color: "var(--ikf-brand-ink)" }}>{title}</div>
      <ol className="space-y-2.5">
        {rows.map((row, i) => (
          <li key={i} className="rounded-lg p-3" style={{ background: "var(--ikf-surface-2)" }}>
            <div className="text-[12px] mb-1" style={{ color: "var(--ikf-text-dim)" }}>{row.q}</div>
            <div className="text-[13.5px] font-medium whitespace-pre-wrap">{row.a}</div>
          </li>
        ))}
      </ol>
    </div>
  );
  return (
    <div className="space-y-5">
      {group("About your family", family)}
      {group("About this child", child)}
    </div>
  );
}

/* ─── Shared ──────────────────────────────────────────────────────────────── */

function EmptyCard({ title, body, to, cta }: { title: string; body: string; to: string; cta: string }) {
  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="ikf-card p-8 text-center space-y-4">
        <h1 className="text-[22px] sm:text-[28px] leading-tight">{title}</h1>
        <p className="text-[14px]" style={{ color: "var(--ikf-text-dim)" }}>{body}</p>
        <Link to={to} className="ikf-btn-primary inline-flex items-center gap-2">
          {cta} <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h4 className="text-[14px] font-bold mt-3 first:mt-0 mb-1.5">{children}</h4>,
        h2: ({ children }) => <h4 className="text-[14px] font-bold mt-3 first:mt-0 mb-1.5">{children}</h4>,
        h3: ({ children }) => <h4 className="text-[13px] font-bold mt-3 first:mt-0 mb-1">{children}</h4>,
        p: ({ children }) => <p className="mb-2.5 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-2.5 last:mb-0 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2.5 last:mb-0 space-y-1">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--ikf-brand-ink)" }}>{children}</a>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

/* ─── Plain-language helpers ──────────────────────────────────────────────── */

type FocusCard = { key: string; title: string; icon: ReactNode; body: string };

// Hybrid content source: split the admin-authored recommendation_md into a
// plain-language intro (Module 1) and per-heading focus cards (Module 2). Only
// renders sections that actually exist — no fabricated Physical/Mindset cards.
// A later round replaces this with structured authored fields per matrix cell.
function parseRecommendation(md: string): { situation: string; meaning: string; cards: FocusCard[] } {
  const text = (md || "").trim();
  if (!text) return { situation: "", meaning: "", cards: [] };
  const parts = text.split(/\n(?=##\s)/);
  const introBlock = /^##\s/.test(parts[0]) ? "" : parts[0].trim();
  const sectionBlocks = parts.filter(p => /^##\s/.test(p));

  const introParas = introBlock.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  const situation = introParas[0] ?? "";
  const meaning = introParas.slice(1).join("\n\n");

  const cards: FocusCard[] = sectionBlocks.map((block, i) => {
    const nl = block.indexOf("\n");
    const heading = (nl < 0 ? block.slice(2) : block.slice(2, nl)).trim();
    const body = nl < 0 ? "" : block.slice(nl + 1).trim();
    const mapped = mapHeading(heading);
    return { key: `s${i}`, title: mapped.title, icon: mapped.icon, body };
  });
  return { situation, meaning, cards };
}

function mapHeading(heading: string): { title: string; icon: ReactNode } {
  const h = heading.toLowerCase();
  if (/football|pitch|technical|playing|pathway/.test(h)) return { title: "Football development", icon: <Trophy size={16} /> };
  if (/academ|school|education/.test(h)) return { title: "Academics", icon: <GraduationCap size={16} /> };
  if (/physical|fitness|conditioning|strength|body/.test(h)) return { title: "Physical development", icon: <Activity size={16} /> };
  if (/mind|mental|resilience|psych/.test(h)) return { title: "Mindset & resilience", icon: <Brain size={16} /> };
  if (/focus|next|months|priorit/.test(h)) return { title: heading, icon: <Target size={16} /> };
  return { title: heading, icon: <Compass size={16} /> };
}

const PROVIDER_CATEGORY: Record<string, string> = {
  technical: "Football coaching",
  fitness: "Physical & conditioning",
  nutrition: "Nutrition & diet",
  academic: "Academic support",
  aptitude: "Learning & aptitude",
};

function monthLabel(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function reviewTiming(scoredAt: string, validUntil: string | null): { label: string; monthsAway: number | null; progress: number } | null {
  if (!validUntil) return null;
  const start = new Date(scoredAt).getTime();
  const end = new Date(validUntil).getTime();
  const now = Date.now();
  if (isNaN(end)) return null;
  const monthsAway = Math.max(0, Math.round((end - now) / (1000 * 60 * 60 * 24 * 30.44)));
  const span = end - start;
  const progress = span > 0 ? Math.min(1, Math.max(0, (now - start) / span)) : 0;
  return { label: monthLabel(validUntil), monthsAway, progress };
}

function ordinalWord(n: number): string {
  const words = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth"];
  return words[n] ?? `${n}th`;
}
