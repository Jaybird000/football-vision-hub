# Platform status — all 3 stages

_Last updated: 2026-05-26 (after pilot-readiness session, 4 commits)_

## Local environment — credentials

> ⚠️ These are **local development credentials only**. Do not reuse for production.
> The `.env` file is **tracked in git** (commit `c76d8a0`) — dev DB config travels with the repo. If you regenerate the DB, the user accounts below will be wiped.

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

The real password lives in the local `.env` (commented out) and in the svapp.us admin panel. It was shown once at provisioning time and is not retrievable from the provider.

Behind a Cloudflare Tunnel (`cfargotunnel.com`). Port 5432 is not publicly reachable. Requires `cloudflared access tcp` or a direct (non-proxied) hostname to use.

### Migrations applied to dev DB

Manual via `psql $DATABASE_URL -f db/migrations/<file>.sql` — no runner script. Apply in order: `0001_*.sql` → `0007_user_consent.sql`. The three most recent are from the 2026-05-26 session and **must be run before the new features work**:

- `0005_email_notification_flags.sql` — adds `notified_advisor_min_dataset_at` flag on profiles
- `0006_audit_log.sql` — adds `audit_log` table
- `0007_user_consent.sql` — adds `consented_at` + `consent_version` on users

---

## Stage 1 — Intent

| Built | Missing |
|---|---|
| Auth: parent signup/login + admin login + sessions + scrypt hashing | "Parent SOP" terminology in UI (Feedback #3 — code still says "Intent Form") |
| Intent form: 8 questions, readiness signal (high/medium/forming) | |
| Submission inserts `parent_child_profiles`, links `users.profile_id` if logged in | |
| Profile created at `stage=2` (Stage 2 auto-unlocks) | |
| Parent acknowledgement email (warm, human language) — `sendParentIntentAck` | |
| Advisor "new intent" email with quick admin link — `sendAdvisorNewIntent` | |
| Consent checkbox + `/privacy` placeholder gating signup; `consented_at` + `consent_version` recorded | |

**Verdict:** Functionally complete and notification loop closed. Only the UI-copy rename to "Parent SOP" is outstanding.

## Stage 2 — Deep Assessment

| Built | Missing |
|---|---|
| 9 assessment templates seeded; admin can toggle required | Email to parent when profile incomplete (re-engagement nudge — not built) |
| Providers fully admin-managed (CRUD + visibility) + 12 sample rows | Cloud storage — currently local disk only, won't survive Vercel deploy |
| File upload: PDF/DOC/DOCX/JPG/PNG, 15 MB cap, server-side MIME validation | |
| Re-upload overwrites; old file deleted | |
| Auth-gated download via `/api/uploads/<id>?inline=1` | |
| "Minimum dataset reached" banner + progress | |
| Sensitivity tiers (decision: all reports equal) | |
| Stage 2 unlock rule (decision: auto after Stage 1) | |
| Advisor "ready to score" email when min dataset first reached — `sendAdvisorReadyToScore`, idempotent via `notified_advisor_min_dataset_at` | |
| Admin verify/reject UI per upload row — badge + buttons writing `status` + `reviewed_at` + `reviewed_by` | |

**Verdict:** Core flow + advisor notification + review loop all wired. Cloud storage is the remaining hard blocker for Vercel deploy.

## Stage 3 — Categorisation & Recommendation

| Built | Missing |
|---|---|
| Schema: axes + values + cells + categorisations (all admin-defined) | **0/9 cell recommendations published** — every parent sees placeholder text |
| Default seed: Player Potential × Parent Capacity (3×3 from Concept Doc) | Pre-fill axis hints from Stage 1 answers (currently 100% advisor judgment) |
| Cell editor with publish toggle | 6-month review cycle automation — `valid_until` set but no cron to fire reminders |
| Snapshot-on-score (history preserved via `is_current` flag) | Out-of-cycle review trigger |
| Admin scoring UI per profile with uploads inline | Algorithm Phase 2/3 (deliberate — manual at launch) |
| Parent dashboard: category title, axis chips, recommendation, advisor name, next review | |
| Re-categorisation = new row + old marked stale | |
| Markdown rendering on parent dashboard (`react-markdown`) | |
| Parent "your recommendation is ready" email on every score (gated on `cell.is_published`) — `sendParentRecommendationReady` | |

**Verdict:** Machinery complete; renderer ready; notification loop closed. Content is the only thing parents still won't see — **the 9 cells need to be authored**.

## Cross-cutting (Brief §8 "Non-negotiables")

| Requirement | State |
|---|---|
| Mobile-first | Pages are responsive; not specifically mobile-tested |
| API-first architecture | ✓ All UI talks to server functions, not hard-coded |
| Human language throughout | ✓ Form, dashboard, and emails all use warm, human copy; advisor name appears in Stage 3 parent email |
| Audit trail (every action logged with user + timestamp) | ✓ `audit_log` table + `logAudit()` helper wired to profile.create, upload.create/replace/review/delete, categorisation.create, cell.upsert |
| Data privacy / consent flow | ✓ Enforced consent checkbox at signup, `/privacy` placeholder page, `consented_at` + `consent_version` columns on users |
| Scale to 50K profiles | Untested; current load: ~5 profiles, ~3 users |
| No data shared externally without consent | True by default — only parent + advisor can see data |

## Feedback (.pdf) items

| # | Ask | Status |
|---|---|---|
| 1 | Use "About IKF" terms in mockup | ✓ — head meta description renamed to "IKF Pathway 360"; no other "Career 360" strings remained in `src/` |
| 2 | Refer concept note before taking the call | (Process note — n/a) |
| 3 | Begin with parent's intent, call it "Parent SOP" | **Partial** — flow does begin with intent; the term "Parent SOP" isn't used in UI |
| 4 | Parent Support Track / community as separate button | ✓ — `/ikf360/support` placeholder with 4 planned planks, surfaced from `/ikf360` as a distinct dashed-border card under "Outside the stage flow" |

## Concept Doc features that are entirely missing

These are in the Concept Doc but were never asked for and aren't built:

- **Expert Directory** (§7) — the curated list of coaches/psychologists/etc. that the Concept Doc treats as a major pillar. Different from the Stage 2 provider list (those are *assessment* providers; experts are *engagement* partners for fixing identified gaps).
- **Parent Selection Aid** (§8) — checklist/narrative content embedded in each expert listing to help parents evaluate whether an expert is right for their child.
- **One-directional comms enforcement** (§7) — "experts do not initiate contact with parents." Not enforced because the Expert Directory doesn't exist.

## What to do next — outstanding work

In rough priority order:

1. **Cell content** (no code — blocks parents from seeing anything meaningful in Stage 3) — content team writes 9 markdown blocks → admin pastes into `/ikf360/admin/cells`. The renderer is ready.
2. **Cloud storage for uploads (R2)** — local disk won't survive Vercel deploy. Needs an R2 bucket + access key + secret + endpoint from the deploy environment. Only blocking if you're deploying to Vercel before pilot — self-hosted server can live with local disk.
3. **Stage 3 `valid_until` reminder cron** — 6-month review cycles are recorded but never fire. Needs a scheduler (Vercel Cron Jobs are the natural fit) plus a server fn that scans `categorisations WHERE valid_until < now() + interval '14 days' AND is_current = true` and emails the assigned advisor.
4. **Mobile pass** — Brief §8 says mobile-first; pages are responsive but never specifically device-tested. Needs hands-on with a phone, not just CSS review.
5. **Per-profile advisor routing** — currently all advisor mail goes to `ADVISOR_EMAIL` (single inbox). Once decision item below is resolved, swap `ADVISOR_EMAIL` calls for a per-profile lookup. `parent_child_profiles.advisor_id` column already exists, unused.
6. **Stage 2 re-engagement nudge** — Brief asks for an email to the parent when their profile is incomplete after some time. Not built. Needs same cron infrastructure as #3.
7. **"Parent SOP" rename in UI** (Feedback #3) — code still says "Intent Form" everywhere. Mechanical find-and-replace, ~10 min.

## Decision items still open (need a human decision, not engineering)

- **Expert Directory** in or out of platform scope? Concept Doc says yes, Brief omits it. Decide before this becomes legacy debt.
- **Phase 2 algorithm** a real goal? If yes, start capturing structured scoring inputs now so we have training data.
- **Per-profile advisor assignment** — proper assignment table, or stick with "scorer = contact" through pilot? Latter is fine for <100 parents.
- **Deploy target for pilot** — Vercel (then R2 is mandatory before pilot) or self-hosted server (local disk is fine).

## One-line summary

Stages 1, 2, and 3 are end-to-end live with email notifications, audit logging, parent consent, and admin review/scoring loops. The 9 cell recommendations being authored is the only remaining gap between this and a real pilot — everything else on the list is deploy-environment work, polish, or product decisions.
