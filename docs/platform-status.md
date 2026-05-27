# Platform status — all 3 stages

_Last updated: 2026-05-26 (after pilot-readiness session, ~10 commits)_

## Local environment — credentials

> ⚠️ These are **local development credentials only**. Do not reuse for production.
> The `.env` file is **tracked in git** (commit `c76d8a0`) — dev DB config travels with the repo. Local-only secrets (Resend keys, DATABASE_URL overrides) belong in `.env.local`, which is auto-gitignored via the `*.local` rule.

### Postgres (local)

The app expects a Postgres reachable at `localhost:5432` with the credentials below. How you provision it (Docker, native installer, WSL, etc.) is up to your machine setup.

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
| `admin@ikf.test` | `adminpass123` | admin | seeded inline (see commit history) | http://localhost:5173/admin-login |

Parent users are created on demand:
- Via UI: http://localhost:5173/signup (now requires consent checkbox)
- Via smoke scripts: `node --env-file=.env scripts/smoke-test-auth.mjs` (etc.) — useful for end-to-end DB seeding, will create test users with predictable emails like `e2e-*@test.local` and `s3-*@test.local`

### Admin seeding (add more admins)

Interactive prompt-based script:

```bash
node --env-file=.env scripts/seed-admin.mjs
```

Or insert directly in SQL (password must be `scrypt$16384$<salt>$<hash>` — use `src/server/password.ts:hashPassword`).

### Remote DB (svapp.us) — not currently used

A second Postgres exists at `db.svapp.us:5432` (database `ikf_360_2`, role `ikf_360_2_owner`), provisioned during this session. Behind a Cloudflare Tunnel (`cfargotunnel.com`) — **port 5432 is not directly reachable**. Requires `cloudflared access tcp --hostname db.svapp.us --url localhost:5432` running locally, after completing the browser auth flow. Not used in dev right now; reserved for whenever a non-local DB is needed.

### Migrations applied to dev DB

Manual via `psql $DATABASE_URL -f db/migrations/<file>.sql` — no runner script. Apply in order: `0001_*.sql` → `0009_seed_cell_drafts.sql`. All 9 migrations are already applied to the Docker local DB as of 2026-05-26.

| # | File | What it adds |
|---|---|---|
| 0001 | `parent_child_profiles.sql` | Stage 1 profile table |
| 0002 | `users_and_sessions.sql` | Auth |
| 0003 | `stage2.sql` | Templates, providers, uploads |
| 0004 | `stage3.sql` | Axes, values, cells, categorisations (+ seeds the 2 axes × 3 values from Concept Doc) |
| 0005 | `email_notification_flags.sql` | `notified_advisor_min_dataset_at` |
| 0006 | `audit_log.sql` | `audit_log` table |
| 0007 | `user_consent.sql` | `consented_at` + `consent_version` |
| 0008 | `cron_flags.sql` | `last_review_reminder_at` + `notified_stage2_nudge_at` |
| 0009 | `seed_cell_drafts.sql` | 9 draft cell recommendations (is_published=false — Phani to review/publish) |

### Local-only env (`.env.local`)

Gitignored via `*.local`. Holds:

```
RESEND_API_KEY=re_***
EMAIL_FROM=IKF Pathway 360 <onboarding@resend.dev>
ADVISOR_EMAIL=developer@vizworld.app
APP_BASE_URL=http://localhost:5173
```

`EMAIL_FROM` uses Resend's sandbox sender — works without DNS verification but only delivers to the Resend account owner (developer@vizworld.app). Real recipients require verifying a sending domain.

---

## Stage 1 — Intent (Parent SOP)

| Built | Missing |
|---|---|
| Auth: parent signup/login + admin login + sessions + scrypt hashing | — |
| Intent form: 8 questions, readiness signal (high/medium/forming) | |
| "Parent SOP" UI terminology across nav, headings, CTAs, error messages, emails (Feedback #3 closed) | |
| Submission inserts `parent_child_profiles`, links `users.profile_id` if logged in | |
| Profile created at `stage=2` (Stage 2 auto-unlocks) | |
| Parent acknowledgement email — `sendParentIntentAck` | |
| Advisor "new intent" email with admin link — `sendAdvisorNewIntent` | |
| Consent checkbox + `/privacy` placeholder gating signup; `consented_at` + `consent_version` recorded | |

**Verdict:** Fully complete.

## Stage 2 — Deep Assessment

| Built | Missing |
|---|---|
| 9 assessment templates seeded; admin can toggle required | **Cloud storage** — uploads still go to local disk; ephemeral on Vercel serverless |
| Providers fully admin-managed (CRUD + visibility) + 12 sample rows | |
| File upload: PDF/DOC/DOCX/JPG/PNG, 15 MB cap, server-side MIME validation | |
| Re-upload overwrites; old file deleted | |
| Auth-gated download via `/api/uploads/<id>?inline=1` | |
| "Minimum dataset reached" banner + progress | |
| Advisor "ready to score" email when min dataset first reached — `sendAdvisorReadyToScore`, idempotent | |
| Parent re-engagement nudge email (7+ days stuck on Stage 2) — `sendParentStage2Nudge` via daily cron, idempotent | |
| Admin verify/reject UI per upload row — badge + buttons writing `status` + `reviewed_at` + `reviewed_by` | |

**Verdict:** All notification + review loops closed. **Cloud storage is the only hard blocker for Vercel deploy.**

## Stage 3 — Categorisation & Recommendation

| Built | Missing |
|---|---|
| Schema: axes + values + cells + categorisations (all admin-defined) | **Cell content authoring** — 9 cells seeded as DRAFTS in `0009_seed_cell_drafts.sql`; Phani to review/edit/publish each via `/ikf360/admin/cells` |
| Default seed: Player Potential × Parent Capacity (3×3) | Pre-fill axis hints from Stage 1 answers (currently 100% advisor judgment) |
| 9 starter drafts inserted (one per combination) | Out-of-cycle review trigger |
| Cell editor with publish toggle | Algorithm Phase 2/3 (deliberate — manual at launch) |
| Snapshot-on-score (history preserved via `is_current` flag) | |
| Admin scoring UI per profile with uploads inline | |
| Parent dashboard: category title, axis chips, recommendation, advisor name, next review | |
| Re-categorisation = new row + old marked stale | |
| Markdown rendering on parent dashboard (`react-markdown`) | |
| Parent "your recommendation is ready" email on every score (gated on `cell.is_published`) — `sendParentRecommendationReady` | |
| Advisor "review due" email when `valid_until` enters 14-day window — `sendAdvisorReviewDue` via daily cron, idempotent | |

**Verdict:** Machinery complete, renderer ready, both notification loops (publish + 6-month review) wired. **The 9 draft cells need Phani's review and publish-toggle before parents see them.**

## Cross-cutting (Brief §8 "Non-negotiables")

| Requirement | State |
|---|---|
| Mobile-first | Partial — responsive hero sizes added on parent surfaces (intent/upload/dashboard/support); all grids stack via `md:` prefixes; hamburger nav in place. **Physical phone test still needed.** |
| API-first architecture | ✓ All UI talks to server functions, not hard-coded |
| Human language throughout | ✓ Form, dashboard, all 6 email templates use warm copy; advisor name appears in Stage 3 parent email |
| Audit trail (every action logged with user + timestamp) | ✓ `audit_log` + `logAudit()` wired to profile.create, upload.create/replace/review/delete, categorisation.create, cell.upsert |
| Data privacy / consent flow | ✓ Enforced consent checkbox at signup, `/privacy` placeholder, `consented_at` + `consent_version` columns |
| Scale to 50K profiles | Untested; current load: ~1 user (admin only) |
| No data shared externally without consent | True by default — only parent + advisor can see data |

## Feedback (.pdf) items

| # | Ask | Status |
|---|---|---|
| 1 | Use "About IKF" terms in mockup | ✓ — "IKF Pathway 360" everywhere user-facing |
| 2 | Refer concept note before taking the call | (Process note — n/a) |
| 3 | Begin with parent's intent, call it "Parent SOP" | ✓ — 14 UI strings across 8 files renamed |
| 4 | Parent Support Track / community as separate button | ✓ — `/ikf360/support` with 4 planks, surfaced from `/ikf360` as a distinct dashed card |

## Concept Doc features that are entirely missing

Still unbuilt; need a product decision before engineering:

- **Expert Directory** (§7) — the curated list of coaches/psychologists/etc. Concept Doc treats as a major pillar. Different from the Stage 2 provider list (those are *assessment* providers; experts are *engagement* partners).
- **Parent Selection Aid** (§8) — checklist/narrative content embedded in each expert listing.
- **One-directional comms enforcement** (§7) — "experts do not initiate contact with parents." Not enforced because the Expert Directory doesn't exist.

## Email infrastructure

Six templates total, all in `src/server/email.ts`. Sends are no-op + console-log when `RESEND_API_KEY` / `EMAIL_FROM` are unset, so dev keeps working without credentials.

| Template | When it fires | To | Idempotent? |
|---|---|---|---|
| `sendParentIntentAck` | Stage 1 form submit | parent | per-submit, naturally once |
| `sendAdvisorNewIntent` | Stage 1 form submit | advisor inbox | per-submit, naturally once |
| `sendAdvisorReadyToScore` | Min dataset reached on Stage 2 upload | advisor inbox | yes — `notified_advisor_min_dataset_at` flag |
| `sendParentRecommendationReady` | Stage 3 score with published cell | parent | per-score (re-scores re-send by design) |
| `sendAdvisorReviewDue` | Daily cron, `valid_until` ≤ 14 days away | advisor inbox | yes — `last_review_reminder_at` flag |
| `sendParentStage2Nudge` | Daily cron, profile stuck on Stage 2 >7 days | parent | yes — `notified_stage2_nudge_at` flag |

Cron schedule lives in `vercel.json` (`/api/cron/review-reminders` 09:00 UTC, `/api/cron/stage2-nudge` 09:30 UTC). Both endpoints require `Authorization: Bearer $CRON_SECRET`; Vercel sends this automatically when `CRON_SECRET` is set as a project env var.

## What to do next — outstanding work

In rough priority order:

1. **Phani reviews and publishes the 9 draft cells** at `/ikf360/admin/cells`. Drafts are in DB; content is mine, voice should be his. Until at least some are published, parents who get scored see placeholder text.
2. **Cloud storage for uploads** — local disk won't survive Vercel deploy. Needs a decision on the provider (R2 if happy with Cloudflare, Vercel Blob if avoiding Cloudflare, Postgres bytea if no extra service, or stay self-hosted with a persistent disk). Hard-blocks Vercel deploy of Stage 2.
3. **Verify a sending domain in Resend** — emails currently work only to `developer@vizworld.app` via the sandbox sender. Add DNS records (SPF + DKIM) for `indiakhelofootball.com` (or a subdomain), wait 15-60 min, then change `EMAIL_FROM` in `.env.local` and Vercel env to the new sender.
4. **Physical mobile device test** — code is responsive but never tested on an actual phone. Run through signup → intent → upload → dashboard on iOS and Android at 320px / 360px / 414px widths.
5. **Per-profile advisor routing** — currently all advisor mail goes to `ADVISOR_EMAIL` (single inbox). `parent_child_profiles.advisor_id` column exists but is unused. Blocked on the decision item below.

## Decision items still open (need a human decision, not engineering)

- **Expert Directory** in or out of platform scope? Concept Doc says yes, Brief omits it. Decide before this becomes legacy debt.
- **Phase 2 algorithm** a real goal? If yes, start capturing structured scoring inputs now so we have training data.
- **Per-profile advisor assignment** — proper assignment table, or stick with "scorer = contact" through pilot? Latter is fine for <100 parents.
- **Deploy target for pilot** — Vercel (then cloud storage decision is mandatory) or self-hosted server (local disk is fine).


## One-line summary

All 3 stages live with end-to-end notification loops (6 email templates), audit logging, consent, mobile-responsive copy, draft cell content authored, and 2 daily crons wired for review reminders + Stage 2 nudges. The remaining work is **(1) content team publishing the 9 draft cells, (2) a cloud storage decision before any Vercel deploy, and (3) DNS verification for the email sending domain**.
