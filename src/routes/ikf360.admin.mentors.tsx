import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, UserPlus, Users, X } from "lucide-react";
import { currentUser } from "@/server/auth";
import { listMentors, createMentor, getMentorCaseload, type Mentor, type CaseProfile } from "@/server/admin";

export const Route = createFileRoute("/ikf360/admin/mentors")({
  beforeLoad: async () => {
    const user = await currentUser();
    if (!user || (user.role !== "admin" && user.role !== "advisor")) {
      throw redirect({ to: "/login" });
    }
  },
  loader: async () => ({
    me: await currentUser(),
    mentors: await listMentors(),
    caseload: await getMentorCaseload({ data: {} }),
  }),
  component: MentorsAdmin,
});

function MentorsAdmin() {
  const { me, mentors: initialMentors, caseload: initialCaseload } = Route.useLoaderData();
  const qc = useQueryClient();
  const isAdmin = me?.role === "admin";

  const { data: mentors = initialMentors } = useQuery({
    queryKey: ["admin", "mentors"],
    queryFn: () => listMentors(),
    initialData: initialMentors,
  });

  const [creating, setCreating] = useState(false);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-[34px] leading-tight">Mentors</h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--ikf-text-dim)" }}>
          {isAdmin
            ? "Onboard mentors, see each one's active caseload, and assign them to families from a profile."
            : "Your assigned families. Open a profile to review their SOP and guide their next steps."}
        </p>
      </header>

      {/* The signed-in mentor's own live caseload */}
      <Caseload initial={initialCaseload} />

      {/* Admin-only: the mentor directory + onboarding */}
      {isAdmin && (
        <section className="ikf-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold inline-flex items-center gap-2"><Users size={16} /> All mentors ({mentors.length})</h2>
            <button onClick={() => setCreating(true)} className="ikf-btn-primary inline-flex items-center gap-1.5 text-[13px]">
              <Plus size={14} /> Add mentor
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left" style={{ color: "var(--ikf-text-dim)" }}>
                  <th className="p-2 font-semibold">Name</th>
                  <th className="p-2 font-semibold">Email</th>
                  <th className="p-2 font-semibold">Role</th>
                  <th className="p-2 font-semibold text-right">Active families</th>
                </tr>
              </thead>
              <tbody>
                {mentors.map((m: Mentor) => (
                  <tr key={m.id} className="border-t" style={{ borderColor: "var(--ikf-border)" }}>
                    <td className="p-2 font-semibold">{m.fullName}</td>
                    <td className="p-2" style={{ color: "var(--ikf-text-dim)" }}>{m.email}</td>
                    <td className="p-2"><span className="ikf-chip" style={{ background: "var(--ikf-surface-2)" }}>{m.role}</span></td>
                    <td className="p-2 text-right font-bold tabular-nums">{m.activeParents}</td>
                  </tr>
                ))}
                {mentors.length === 0 && (
                  <tr><td colSpan={4} className="p-3 text-center" style={{ color: "var(--ikf-text-dim)" }}>No mentors yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {creating && <CreateMentorModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); qc.invalidateQueries({ queryKey: ["admin", "mentors"] }); }} />}
    </div>
  );
}

function Caseload({ initial }: { initial: CaseProfile[] }) {
  const { data: caseload = initial } = useQuery({
    queryKey: ["admin", "myCaseload"],
    queryFn: () => getMentorCaseload({ data: {} }),
    initialData: initial,
  });
  return (
    <section className="ikf-card p-6">
      <h2 className="text-[16px] font-bold inline-flex items-center gap-2 mb-1"><UserPlus size={16} /> Your caseload</h2>
      <p className="text-[13px] mb-4" style={{ color: "var(--ikf-text-dim)" }}>
        {caseload.length} active {caseload.length === 1 ? "family" : "families"} assigned to you.
      </p>
      {caseload.length === 0 ? (
        <div className="text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>No families assigned to you yet.</div>
      ) : (
        <ul className="space-y-2">
          {caseload.map(c => (
            <li key={c.profileId}>
              <Link
                to="/ikf360/admin/profiles/$id"
                params={{ id: c.profileId }}
                className="flex items-center justify-between gap-3 rounded-lg p-3 hover:border-[var(--ikf-brand)] border"
                style={{ background: "var(--ikf-surface-2)", borderColor: "var(--ikf-border)" }}
              >
                <div>
                  <div className="font-semibold text-[14px]">{c.childName} · {c.childAge}</div>
                  <div className="text-[12px]" style={{ color: "var(--ikf-text-dim)" }}>{c.parentName} · {c.parentEmail}</div>
                </div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-right" style={{ color: "var(--ikf-text-dim)" }}>
                  Stage {c.stage}<br />{c.readiness}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CreateMentorModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const valid = form.fullName.trim() && /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 8;
  const create = useMutation({
    mutationFn: () => createMentor({ data: { fullName: form.fullName.trim(), email: form.email.trim(), password: form.password } }),
    onSuccess: onCreated,
  });
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="ikf-card p-6 w-full max-w-md space-y-4" style={{ background: "var(--ikf-bg)" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold">Onboard a mentor</h3>
          <button onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <p className="text-[12px]" style={{ color: "var(--ikf-text-dim)" }}>
          Creates an advisor account. Share the email + password with the mentor so they can sign in and set their own password.
        </p>
        <Field label="Full name"><input className="ikf-input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Rahul Verma" /></Field>
        <Field label="Email"><input type="email" className="ikf-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="mentor@ikf.org" /></Field>
        <Field label="Temporary password (min 8 chars)"><input type="text" className="ikf-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="set a starter password" /></Field>
        {create.error && (
          <div className="p-3 rounded-lg text-[12px]" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>
            {create.error instanceof Error ? create.error.message : "Couldn't create the mentor."}
          </div>
        )}
        <div className="flex items-center gap-3">
          <button onClick={() => create.mutate()} disabled={!valid || create.isPending} className="ikf-btn-primary inline-flex items-center gap-2 disabled:opacity-50">
            {create.isPending ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : <><UserPlus size={14} /> Create mentor</>}
          </button>
          <button onClick={onClose} className="text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-1.5" style={{ color: "var(--ikf-text-dim)" }}>{label}</div>
      {children}
    </label>
  );
}
