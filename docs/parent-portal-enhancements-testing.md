# Parent Portal Enhancements — Change Log & Test Plan

_Round dated 2026-06-09. Implements the BRD v1.0 (30 May 2026) + the parent UX test (Nirja, 28 May) + admin feedback. **Nothing has been deployed; nothing has been applied to the database.**_

---

## 0. Before you test — one-time setup

### a) Database migrations (REQUIRED for Modules E and H)
Two new migrations were written but **not applied** (applying touches the live D1 database, which was deliberately left to you):

| File | Adds | Needed for |
|---|---|---|
| `db/migrations/0010_mentor_assistance.sql` | `mentor_assistance_requests` table | Module E (mentor help) |
| `db/migrations/0011_provider_charges.sql` | `providers.charge_inr` column | Module H (report charges) |
| `db/migrations/0012_profile_city.sql` | `parent_child_profiles.city` column | City capture + filter |
| `db/migrations/0013_answer_choices.sql` | `parent_child_profiles.answer_choices` column | Exact SOP answer text |

The app is built to **run fine without them** — the mentor-help button and provider-charge fields simply stay inert (you'll see a `[stage2]/[admin] … migration applied?` warning in the server console). When you're ready to test E and H end-to-end, apply both:

```bash
# from football-vision-hub/
wrangler d1 migrations apply ikf-pathway --remote     # or --local if you have a local D1
```
(or whatever apply step you normally use — `scripts/apply-migrations.mjs` if that's still your path.)

### b) Run it
```bash
cd football-vision-hub
npm run dev
```
DB-backed screens (login, SOP submit, upload, admin) need the Cloudflare creds in `.env.local` (`CF_ACCOUNT_ID`, `CF_D1_DATABASE_ID`, `CF_API_TOKEN`). The public pages render without them.

### c) Test accounts
- **Admin:** `admin@ikf.test` / `adminpass123` → `/login`
- **Parent:** create a fresh one at `/signup`, or reuse an existing parent.

---

## 1. What changed, by module

### A — Pre-login Parent Information page  *(new)*
- New public page at **`/parents/pathway`** (file `src/routes/parents_.pathway.tsx`). Explains what IKF Pathway 360 is, the 3-stage journey, the Parent SOP, what you get, an FAQ (incl. "what if I don't have documents?"), and sample stories. Bilingual (EN/HI).
- Discoverable via a new **"Pathway 360"** link in the top nav and a **"Read the guide"** banner on `/parents`.
- CTAs: **"Fill the Parent SOP"** → signup→SOP; **"Log in to explore first"** → login→overview.

### B — Login separated from the SOP
- New parents are **no longer dumped into the SOP form**. After signup they land on the **overview** (`/ikf360`) to explore first.
- A `?next` param lets the explicit "Fill the Parent SOP" CTA still go straight to the form after auth (only `/ikf360/intent` is honored — safe whitelist).
- Files: `src/routes/{signup,login,ikf360.index}.tsx`.

### C — Hinglish copy
- Public-site Hindi (`src/lib/i18n.tsx`) changed from formal "shudh" Hindi to conversational Hinglish (e.g. अभिभावक→पैरेंट्स, दान करें→डोनेट करें, यात्रा→जर्नी, पाँच चरण→पाँच स्टेज).
- _Note:_ the portal/SOP screens are English-only today (no Hindi there yet), so there was no formal Hindi inside the portal to simplify.

### D — Readiness explanation (parent-facing)
- The Stage-1 result screen no longer shows an "Internal — advisors only" box. It now explains, for the parent: **What is Stage 1?**, **what your result means** (different copy for High/Medium/Forming), and **what happens next** — reassuring but curiosity-preserving.
- Also shown when a parent **revisits** `/ikf360/intent`.
- Copy lives in `src/lib/ikf360-data.ts` (`READINESS_PARENT_COPY`, `STAGE1_EXPLAINER`).

### E — Stage 2 "no documents → IKF Mentor (48h)"  *(needs migration 0010)*
- On the upload portal, when **required** reports are still missing, a **"Don't have these documents?"** panel appears → **"Contact my IKF Mentor"** → optional message → **"Request assistance."**
- Sends the advisor an email ("Mentor help requested (48h)", lists what's missing + the message) and the parent a confirmation. Logs an audit entry. One open request per parent (no duplicate spam). Panel switches to a "request is in" state afterwards.
- Files: `db/migrations/0010_*`, `src/server/{stage2,email}.ts`, `src/routes/ikf360.upload.tsx`.

### F — Admin can see the Parent SOP
- On a profile (`/ikf360/admin/profiles/<id>`): a new **"Parent SOP responses"** section showing parent/child details (incl. **city**) + all 8 questions and the **exact answer the parent chose**, plus a **"Mentor help requested"** card (from Module E).
- On the list (`/ikf360/admin`): added **Stage filter**, **City filter** (appears once any profile has a city), and **Export CSV** of the filtered profiles (now incl. city).
- **Exact answers (was a known limitation):** the SOP now records the exact option the parent picked (migration 0013), so the admin sees the real answer text — not a score, and no more "(either)". Profiles submitted *before* this migration still fall back to score-based reconstruction with the "(either)" tag on the two ambiguous questions.
- **City (was a known limitation):** the SOP now asks for the parent's city (migration 0012), stored on the profile and used for the filter.
- Files: `src/server/{intent,admin,stage3}.ts`, `src/routes/ikf360.{intent,admin.tsx,admin.profiles.$id}.tsx`.

### G — Admin can manage templates
- `/ikf360/admin/templates` now supports **New / Edit / Duplicate / Delete** (the required toggle stays). Delete is blocked if parents already uploaded for that assessment.
- Files: `src/server/admin.ts`, `src/routes/ikf360.admin.templates.tsx`.

### H — Provider report charges  *(needs migration 0011)*
- Admin provider form has a new **"Report charges ₹"** field; the amount shows on the provider list (admin) and **next to each provider on the parent's upload portal** so parents can compare costs.
- Files: `db/migrations/0011_*`, `src/server/{admin,stage2}.ts`, `src/routes/ikf360.{admin.providers,upload}.tsx`.

### U — IKF branding
- The brand accent shifted from neon-lime to **IKF bright blue (`#2BB8F0`)** across the whole app, with navy surfaces and the existing IKF yellow kept. It's a token-only change in `src/styles.css`.
- ⚠️ **Please confirm the exact blue against your official IKF brand kit** — it's a single value (`--neon-strike` / `--ikf-brand`) and trivial to adjust.

---

## 2. Test checklist

### Public / onboarding (no DB needed)
- [ ] Top nav shows **Pathway 360**; it opens `/parents/pathway`.
- [ ] On `/parents/pathway`: all sections render; the **EN/HI toggle** (top-right) switches language and the Hindi reads conversational, not formal.
- [ ] `/parents` shows the **"Read the guide"** banner linking to the new page.
- [ ] Everything is **IKF blue**, not lime. Buttons/links/highlights look on-brand; text on blue buttons is readable.

### Login / SOP separation (DB)
- [ ] **Fresh signup directly at `/signup`** → lands on the **overview** (`/ikf360`), NOT the SOP form. Copy invites you to explore.
- [ ] From `/parents/pathway`, **"Fill the Parent SOP"** → signup → lands **straight in the SOP**.
- [ ] **"Log in to explore first"** / normal login → overview. Admin login → admin console.

### Stage 1 readiness (DB)
- [ ] Complete the SOP → result screen shows **What is Stage 1? / what your result means / what happens next** (no "advisors only" text).
- [ ] Re-open `/ikf360/intent` → the explanation is still shown.
- [ ] Try answer sets that produce High, Medium, and Forming to see the three tones (mostly top options → High; mixed → Medium; mostly low → Forming).

### Stage 2 mentor help (DB + **migration 0010**)
- [ ] As a parent missing required reports, the **"Don't have these documents?"** panel shows.
- [ ] Submit it (with/without a message) → it switches to **"Your request is in."**
- [ ] Server console shows the advisor + parent emails (or they send, if SMTP2GO is configured). Re-loading keeps the "request is in" state (no duplicate).
- [ ] Upload all required reports → the panel disappears.
- [ ] _Before applying 0010:_ confirm the upload page still loads (panel just won't submit).

### Admin SOP visibility (DB; city + exact answers need **migrations 0012 + 0013**)
- [ ] The SOP form now has a **City** field (required).
- [ ] `/ikf360/admin` → **Stage filter** works; **City filter** appears once a profile has a city; **Export CSV** downloads the filtered rows (with city).
- [ ] Open a profile → **Parent SOP responses** shows details (incl. city) + all 8 Q&A with the **exact answers** the parent chose (no scores, no "(either)") for newly-submitted profiles.
- [ ] _Old profiles_ (submitted before 0013) still show the score-based answer with "(either)" on the 2 ambiguous questions — expected.
- [ ] If that parent requested mentor help, the **"Mentor help requested"** card appears.

### Admin templates (DB)
- [ ] `/ikf360/admin/templates` → **New template** (pick a key like `vision_test`, category, title) → it appears in the list and on the providers page.
- [ ] **Edit** an existing one (key is locked); **Duplicate** prefills a new one; **Delete** works on a template with **0 uploads** and is **blocked** on one that has uploads.

### Provider charges (DB + **migration 0011**)
- [ ] Admin → Providers → add/edit a provider with **Report charges ₹** → the amount shows on the admin list.
- [ ] As a parent, the upload portal shows **₹ amounts** next to providers so you can compare.
- [ ] _Before applying 0011:_ confirm the providers admin page and the parent upload page still load (charges just won't show/save).

---

## 3. Known limitations / decisions to confirm

1. ~~SOP answers stored as scores~~ — **DONE.** The SOP now captures the exact chosen option (0013); admins see the real answer text. Only profiles submitted *before* 0013 fall back to "(either)" on q6/q7.
2. ~~No city filter~~ — **DONE.** The SOP collects city (0012); the admin list has a city filter and export.
3. **IKF brand colours — NEEDS THE OFFICIAL KIT.** The current blue (`#2BB8F0`) is a placeholder; IKF's exact colours couldn't be extracted from the public site. Please send the official brand hex codes (and logo, if it should change). It's a single place to update: `--neon-strike` / `--ikf-brand` in `src/styles.css`.
4. **Sample testimonials** on `/parents/pathway` are placeholders to be replaced with real IKF parent stories.
5. **Placeholder copy** throughout the new landing page should be reconciled with the official "About IKF" document (not in the repo).

---

## 4. Migrations recap

| When you're ready | Command |
|---|---|
| Apply all four new migrations | `wrangler d1 migrations apply ikf-pathway --remote` (or your usual apply step) |
| What they do | 0010 = mentor help table; 0011 = provider charge; 0012 = profile city; 0013 = exact answer text |

Until then the app runs fine; the related features (mentor help, charges, city storage, exact answers) are inert and each logs a one-line console warning.
