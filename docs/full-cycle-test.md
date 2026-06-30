# One full cycle — end-to-end test

Feedback (30 Jun 2026, item 5): _"End-to-end test: Profile → SoP → Categorisation → Upload →
Mentor notification → Mentor response."_ This is the script to run that cycle on a deployed
environment (it needs migrations 0014–0021 applied + SMTP2GO env vars set for the emails to
actually deliver). Each step lists what to do, the route, and what should happen.

Prereqs:
- An **admin** account (e.g. seeded via `scripts/seed-admin.mjs`).
- SMTP2GO env vars set (`SMTP2GO_API_KEY`, `EMAIL_FROM`, `ADVISOR_EMAIL`) for real email; otherwise
  emails no-op and just log (the rest of the cycle still works).

## 1. Profile + SoP
1. Sign up a fresh parent at `/signup` (real inbox you control).
2. You land on `/ikf360`; open the Parent SOP at `/ikf360/intent`.
3. Complete the **family** section (asked once) then the **child** section.
   - Expect: a `parent_child_profiles` row created (`stage = 2`), `sop_responses` stored, a
     readiness derived, `parent_family_responses` saved, `users.profile_id` set, and a
     `parent ack` + `advisor new-intent` email sent.
4. On `/ikf360/dashboard`, open **"See everything I submitted"** → your family + child answers show.
   - Expect: the **status strip** shows _Your mentor: Being assigned · Reports: 0 of N · Gathering reports_.

## 2. Mentor assignment + notification
5. As admin, open `/ikf360/admin/mentors` → **Add mentor** (creates an advisor account).
6. Open the new profile at `/ikf360/admin/profiles/<id>` → set **Assigned mentor** to that mentor.
   - Expect: `advisor_id` set; the mentor receives the **"you've been assigned"** email; the profile
     now appears on that mentor's **caseload** (on `/ikf360/admin/mentors`, signed in as the mentor).
   - Expect: the parent dashboard status strip now shows the **mentor's name**.

## 3. Upload
7. As the parent, open `/ikf360/upload` → open an assessment's **own page** (`/ikf360/upload/<key>`).
   - Expect: context (what/why), any **integrated** partners shown as "auto-fetch soon", **manual**
     partners selectable, and the IKF **format download** if the admin set one.
8. Pick a partner (or "own report") and upload a PDF. Repeat for all **required** assessments.
   - Expect: each upload shows with status + partner; once all required are in,
     `minimumDatasetReached` flips and the **advisor "ready to score"** email fires.
   - Expect: dashboard status strip → _Reports: N of N · Awaiting recommendation_.

## 4. Categorisation (mentor response)
9. As the mentor/admin, open `/ikf360/admin/profiles/<id>`:
   - Verify/▸reject the uploaded reports.
   - Under **Categorise**, note the **Parent type suggestion** derived from the SOP (with the
     "How parent types are assigned" explainer). Pick Player Potential + Parent Capacity (use the
     suggestion or override), optionally set the **Academic modifier**, then **Score profile**.
   - Expect: a `categorisations` row (`is_current = true`, `stage → 3`); if the cell is published,
     the parent gets the **"recommendation ready"** email + an in-app notification.
10. As the parent, reload `/ikf360/dashboard`:
   - Expect: status strip → _Recommendation ready_; **"Where your child stands"** + **focus areas**
     render; the academic-modifier note shows if set; the journey timeline lists the review by the mentor.

## Pass criteria
- A single profile moves cleanly Profile → SoP → (assigned mentor) → Upload → Categorisation, with
  the parent dashboard reflecting each step and the mentor notified at assignment + at "ready to score".
- Every advisor/parent email either sends (SMTP configured) or logs a `[email:noop]` line.
