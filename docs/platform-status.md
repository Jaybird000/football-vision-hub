# Platform status — all 3 stages

_Last updated: 2026-05-26_

## Local environment — credentials

> ⚠️ These are **local development credentials only**. Do not reuse for production.
> The `.env` file is gitignored. If you regenerate the DB, the user accounts below will be wiped.

### Postgres (local)

| Field | Value |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `ikf_360` |
| User | `ikf_360_owner` |
| Password | `localdev` |
| DSN | `postgresql://ikf_360_owner:localdev@localhost:5432/ikf_360` |

### Test users (app login)

| Email | Password | Role | Created via | Login URL |
|---|---|---|---|---|
| `admin@ikf.test` | `adminpass123` | admin | `seed-admin` SQL | http://localhost:5173/admin-login |
| `e2e-1779836881007@test.local` | `supersecret123` | parent | `smoke-test-auth.mjs` | http://localhost:5173/login |
| `s3-1779842256840@test.local` | `supersecret123` | parent | `smoke-test-stage3.mjs` | http://localhost:5173/login |
| `s3-1779842279222@test.local` | `supersecret123` | parent | `smoke-test-stage3.mjs` | http://localhost:5173/login |
| `jaydev@dev.com` | _(set by user via signup)_ | parent | UI signup | http://localhost:5173/login |

### Admin seeding (add more admins)

Interactive prompt-based script:

```bash
node --env-file=.env scripts/seed-admin.mjs
```

Or insert directly in SQL (password must be `scrypt$16384$<salt>$<hash>` — use `src/server/password.ts:hashPassword`).

### Remote DB (svapp.us) — not currently used

```
DSN: postgresql://ikf_360_owner:<REDACTED>@db.svapp.us:5432/ikf_360?sslmode=require
```

The real password lives only in the local `.env` file (gitignored) and the svapp.us admin panel. It was shown once at provisioning time and is not retrievable from the provider.

Behind a Cloudflare Tunnel (`cfargotunnel.com`). Port 5432 is not publicly reachable. Requires `cloudflared access tcp` or a direct (non-proxied) hostname to use.

---

## Stage 1 — Intent (Parent SOP)

| Built | Missing |
|---|---|
| Auth: parent signup/login + admin login + sessions + scrypt hashing | "Parent SOP" terminology in UI (Feedback item #3 — code still says "Intent Form") |
| Intent form: 8 questions, readiness signal (high/medium/forming) | Advisor email on submission (Brief requirement) |
| Submission inserts `parent_child_profiles`, links `users.profile_id` if logged in | Parent acknowledgement email (Brief: "warm, human message") |
| Profile created at `stage=2` (Stage 2 auto-unlocks) | Parent Support Track / community as separate button (Feedback item #4) |

**Verdict:** Functionally complete for capture. Missing the two outbound emails that Brief Stage 1 lists as required.

## Stage 2 — Deep Assessment

| Built | Missing |
|---|---|
| 9 assessment templates seeded; admin can toggle required | Email to advisor when minimum dataset reached (Brief req) |
| Providers fully admin-managed (CRUD + visibility) + 12 sample rows | Email to parent when profile incomplete (Brief req) |
| File upload: PDF/DOC/DOCX/JPG/PNG, 15 MB cap, server-side MIME validation | Admin verify/reject workflow for uploads (status field exists, no UI to flip it) |
| Re-upload overwrites; old file deleted | Cloud storage — currently local disk only, won't survive Vercel deploy |
| Auth-gated download via `/api/uploads/<id>?inline=1` | |
| "Minimum dataset reached" banner + progress | |
| Sensitivity tiers (decision: all reports equal) | |
| Stage 2 unlock rule (decision: auto after Stage 1) | |

**Verdict:** Core upload flow works end-to-end. The notification loop (advisor + parent) is the biggest gap.

## Stage 3 — Categorisation & Recommendation

| Built | Missing |
|---|---|
| Schema: axes + values + cells + categorisations (all admin-defined) | **0/9 cell recommendations published** — every parent sees placeholder text |
| Default seed: Player Potential × Parent Capacity (3×3 from Concept Doc) | Markdown rendering — bold/headers/lists show as literal characters |
| Cell editor with publish toggle | Email to parent when recommendation published |
| Snapshot-on-score (history preserved via `is_current` flag) | Pre-fill axis hints from Stage 1 answers (currently 100% advisor judgment) |
| Admin scoring UI per profile with uploads inline | 6-month review cycle automation — `valid_until` set but unused |
| Parent dashboard: category title, axis chips, recommendation, advisor name, next review | Out-of-cycle review trigger |
| Re-categorisation = new row + old marked stale | Algorithm Phase 2/3 (deliberate — manual at launch) |

**Verdict:** Machinery complete and fully dynamic. Content is empty. Cell recommendations need to be authored before any real parent gets meaningful output.

## Cross-cutting (Brief §8 "Non-negotiables")

| Requirement | State |
|---|---|
| Mobile-first | Pages are responsive; not specifically mobile-tested |
| API-first architecture | ✓ All UI talks to server functions, not hard-coded |
| Human language throughout | ✓ in form/dashboard copy; ✗ no advisor-name in emails (no emails exist) |
| Audit trail (every action logged with user + timestamp) | Partial — `uploaded_by`, `scored_by`, `created_at` captured; no dedicated audit table |
| Data privacy / consent flow | Not built — no consent checkbox at signup, no privacy policy link |
| Scale to 50K profiles | Untested; current load: ~5 profiles, ~3 users |
| No data shared externally without consent | True by default — only parent + advisor can see data |

## Feedback (.pdf) items

| # | Ask | Status |
|---|---|---|
| 1 | Use "About IKF" terms in mockup | **Mixed** — "IKF Career 360" still appears in `ikf360.tsx` head + landing copy; "Pathway 360" never adopted |
| 2 | Refer concept note before taking the call | (Process note — n/a) |
| 3 | Begin with parent's intent, call it "Parent SOP" | **Partial** — flow does begin with intent; the term "Parent SOP" isn't used in UI |
| 4 | Parent Support Track / community as separate button | **Not built** |

## Concept Doc features that are entirely missing

These are in the Concept Doc but were never asked for and aren't built:

- **Expert Directory** (§7) — the curated list of coaches/psychologists/etc. that the Concept Doc treats as a major pillar. Different from the Stage 2 provider list (those are *assessment* providers; experts are *engagement* partners for fixing identified gaps).
- **Parent Selection Aid** (§8) — checklist/narrative content embedded in each expert listing to help parents evaluate whether an expert is right for their child.
- **One-directional comms enforcement** (§7) — "experts do not initiate contact with parents." Not enforced because the Expert Directory doesn't exist.

## Build dependencies — what to do next, in order

1. **Cell content** (no code, blocks parents from seeing anything meaningful in Stage 3) — content team writes 9 markdown blocks → admin pastes into `/ikf360/admin/cells`.
2. **Email infrastructure** — Resend (~30 min setup), one template per event:
   - Stage 1 submit → parent ack + advisor "new profile" email
   - Stage 2 minimum dataset reached → advisor "ready to score" email
   - Stage 3 published → parent "your recommendation is ready" email
   - Stage 3 valid_until approaching → advisor "review due" email (cron)
3. **Markdown rendering on dashboard** — install `react-markdown` (~25 KB) OR write a tiny parser for `#`, `**`, `-`. ~15 min.
4. **Cloud storage for uploads** — Cloudflare R2 (project already has Cloudflare plugins) OR drop local storage entirely if you're not deploying soon.
5. **Naming rename** — `IKF Career 360` → `IKF Pathway 360` everywhere user-facing (Feedback #1). Mechanical find-and-replace, ~10 min.
6. **Parent Support Track button** — new placeholder route + community page (Feedback #4). Scope TBD.
7. **Admin upload review/reject UI** — close the verification loop (Brief req).
8. **Audit table + middleware** — log every write to `audit_log`. Cheap insurance for compliance + debugging.

Decision items still open (need a human decision, not engineering):

- Is the **Expert Directory** part of the platform or not? Concept Doc says yes, Brief omits it. Decide before this becomes legacy debt.
- Is **Phase 2 algorithm** a real goal? If yes, start capturing structured scoring inputs now so we have training data.
- Are **advisors assigned per profile** (proper assignment table) or is "whoever scored is the contact" good enough?

## One-line summary

Stage 1 captures, Stage 2 collects evidence, Stage 3 categorises — all live, all admin-controllable, all wired to Postgres. The platform is functionally complete for an alpha. Two things stand between it and a real pilot: **email notifications** (any of the four events above) and **the 9 cell recommendations being authored**. Everything else on the list is polish or scale work.
