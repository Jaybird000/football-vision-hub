-- Idempotency flags for the two daily crons:
--   1. /api/cron/review-reminders fires once per categorisation when its 14-day
--      review window opens. last_review_reminder_at gates re-fires; only NULL
--      values are considered.
--   2. /api/cron/stage2-nudge fires once per profile that's sitting on Stage 2
--      with incomplete uploads for >7 days.

ALTER TABLE categorisations ADD COLUMN last_review_reminder_at TEXT;
ALTER TABLE parent_child_profiles ADD COLUMN notified_stage2_nudge_at TEXT;
