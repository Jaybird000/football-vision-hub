-- Cell recommendation DRAFTS for all 9 combinations of player_potential ×
-- parent_capacity (3 × 3). Inserted as is_published = false so Phani / the
-- IKF content team can review, edit, and explicitly publish each cell in the
-- admin UI (/ikf360/admin/cells) before any parent sees it.
--
-- ON CONFLICT updates only existing DRAFT rows — never overwrites a cell that
-- the team has already reviewed and published. Safe to re-run.

INSERT INTO recommendation_cells (cell_key, title, recommendation_md, is_published) VALUES

('parent_capacity:aligned|player_potential:high',
 'The committed family with a high-potential child',
 $cell$You are in a strong position. Your child shows real potential, and your engagement gives them the support most talented children never get.

## Football pathway
- Your advisor will share a short list of two or three IKF-recommended academies or trial pathways suited to your child's age, position, and region.
- Plan trial attendance over the next 6 months — not the next 6 weeks. Premature professionalisation breaks more careers than it makes.
- If a residential academy is on the table, weigh it carefully against the academic environment your child would leave behind.

## Academic and personal development
- Keep academics as a parallel track, not a sacrifice. A footballer with strong academics has options at 18 even if a pro pathway doesn't open.
- Continue building the off-pitch skills the assessments surfaced — most pro careers are made or broken on character, not technique.

## What to focus on the next 6 months
- Two or three competitive exposures (state-level trial, academy assessment, or IKF showcase)
- A consistent S&C routine with the recommended fitness provider
- A 6-month check-in with your advisor to re-score and adjust$cell$,
 false),

('parent_capacity:aligned|player_potential:developing',
 'Patient development with a grounded family',
 $cell$Your child is showing promise without a clear ceiling yet, and your family environment is exactly the kind that lets that promise mature without being forced.

## Football pathway
- Avoid early specialisation. Your child should still be playing multiple positions, ideally in more than one team context.
- Local district and state football is the right level for now. IKF will flag any specific trials worth attending — there is no rush.
- Treat the next 12 to 18 months as the window for whether a real football pathway opens, not whether a pro contract appears.

## Academic and personal development
- Keep academics fully on track. Most children at this stage do not become professionals — academic strength keeps every other door open.
- The assessment data flagged areas where your child can grow off the pitch. Work on one of them seriously, not all of them.

## What to focus on the next 6 months
- Consistent training with the current coach
- One competitive exposure beyond the regular schedule
- Re-assess at the next 6-month review$cell$,
 false),

('parent_capacity:aligned|player_potential:uncertain',
 'Too early to call — use the time well',
 $cell$It is too early to read your child's football trajectory clearly. That is not bad news; most children at this stage are exactly here. Your alignment as a family is the most useful thing on the board right now.

## Football pathway
- Keep your child playing regularly without specialising. Variety of game contexts is more useful than intensity at this stage.
- The next 12 months should answer two questions: does your child love it without prompting, and does the basic technical foundation strengthen?
- Do not seek out trials yet. The signal is too noisy to make pathway decisions.

## Academic and personal development
- This is the right age to invest in academics and broad development. The football story will clarify on its own.
- Use the assessment data to identify one or two character or learning areas worth strengthening this year.

## What to focus on the next 6 months
- Consistent training and play
- Build the daily habits — sleep, nutrition, school discipline — that any pathway will eventually require
- Re-assess in 6 months — that is when we will have a clearer picture$cell$,
 false),

('parent_capacity:aspirational|player_potential:high',
 'Real talent, constrained capacity',
 $cell$Your child has real football potential. Your family's intent is strong, but the financial or geographic reality makes the usual pathways harder. This is where IKF was built to help.

## Football pathway
- The standard "move to a metro academy at 14" plan may not be the right fit for your family. IKF can connect you to residential scholarships and partner academies designed for families in your situation.
- Ask your advisor about IKF's pathway support specifically — including scouting visibility that does not require you to relocate.
- Do not commit family savings to football infrastructure. Many families overspend at this stage and burn out.

## Academic and personal development
- Academics are critical here. They give your child options regardless of how football plays out, and many scholarships require strong academic standing.
- Use IKF's network to connect with mentors who have walked this pathway before — peer perspective from another aspirational family matters more than expert advice at this stage.

## What to focus on the next 6 months
- A conversation with your advisor about specific scholarship and pathway options
- One realistic competitive exposure (state, district, or IKF event)
- A clear-eyed family discussion about what you can and cannot sustain$cell$,
 false),

('parent_capacity:aspirational|player_potential:developing',
 'Promise with constraint — pace matters',
 $cell$Your child is showing promise without a clear ceiling. Your intent is strong, but the constraints are real. The biggest risk here is not lack of ambition — it is burning out the family chasing a pathway that has not yet shown itself.

## Football pathway
- Slow down. The data is not yet clear enough to justify family-scale sacrifice.
- Keep training local for now. If a clear pathway emerges in the next assessment cycle, we can revisit relocation or residential options then.
- Be wary of paid private coaching that promises fast-tracking. At this stage, more is not better.

## Academic and personal development
- Academics give your child options that football may not. Treat them as primary, not parallel, for now.
- The assessment data flagged growth areas — pick one to work on seriously rather than spreading effort thin.

## What to focus on the next 6 months
- Consistent local training without escalation
- One conversation with your advisor about what would actually need to be true for a serious football pathway to make sense
- Re-assess at 6 months — that is when the real decision will be made$cell$,
 false),

('parent_capacity:aspirational|player_potential:uncertain',
 'Set realistic expectations now',
 $cell$Your child is too early in their development to read clearly, and your family's circumstances make ambitious pathways difficult to sustain. This is the combination where parents most often get hurt. The honest recommendation is to slow down before any decisions feel urgent.

## Football pathway
- Do not make pathway decisions yet. The signal is too weak, and the cost of being wrong is high for a family in your situation.
- Keep your child playing regularly. The signal will get clearer with time and consistent exposure.
- Have an honest internal conversation about what success looks like for your family — pro football is one of many valid outcomes.

## Academic and personal development
- Make academics primary. Even if football develops, your child will need every other door open.
- Build the off-pitch foundations: sleep, nutrition, discipline, character. These help with any future, not just sport.

## What to focus on the next 6 months
- Consistent training without family-scale investment
- A conversation with your advisor about what a non-pro football pathway could look like — coaching, sports management, recreation leadership
- Re-assess at 6 months$cell$,
 false),

('parent_capacity:disengaged|player_potential:high',
 'Talent without the home anchor',
 $cell$Your child shows real football potential. The pathway from here, though, depends on what is possible at home — and right now the engagement signals suggest football may not be the priority it first appeared.

This is not a judgement. Many families discover that the cost of a serious pathway — time, attention, sustained involvement — is more than they realistically want to take on. That is a valid choice.

## What this means
- Your child's talent will not develop on its own. Without sustained family backing, even the strongest potential plateaus.
- The IKF pathway model assumes the parent is the most reliable adult in a young player's life. We cannot substitute for that.

## What to focus on the next 6 months
- An honest internal conversation about whether football is something you actually want to support over the next 5 to 10 years, or whether your child's involvement is more recreational
- A call with your IKF advisor to talk through what realistic engagement looks like for your family, and whether the Parent Support Track might fit better than a competitive pathway
- We will re-assess at 6 months and you can change direction at any time$cell$,
 false),

('parent_capacity:disengaged|player_potential:developing',
 'Recreational fit, not competitive',
 $cell$Your child is showing some promise on the football side. The honest picture, though, is that without sustained family engagement the development that would convert that promise into a real pathway is unlikely.

This is not a closed door. Many of IKF's most rewarding stories come from families who chose a recreational, character-building football journey over a competitive one — and got the discipline, resilience, and confidence that football builds without the cost of chasing a pro pathway.

## What this means
- Continue your child's football for what it gives them: physical literacy, team experience, structure. These are valuable on their own.
- A competitive pathway requires a level of sustained involvement that the engagement signal is not currently pointing to.

## What to focus on the next 6 months
- Keep your child playing in their current setting — school, local club, or district
- Have a conversation with your IKF advisor about the Parent Support Track and whether community-level engagement fits better than the pathway track
- Re-assess at 6 months$cell$,
 false),

('parent_capacity:disengaged|player_potential:uncertain',
 'Early stage — mostly advisor-driven from here',
 $cell$Your child is at an early stage where we do not yet have a clear picture of their football trajectory, and the engagement signals suggest football is currently more of an interest than a sustained family priority. That is an honest place to start.

## What this means
- It is too early to make pathway recommendations either way. The data is not there yet, and the family signal is not either.
- Your IKF advisor will reach out to understand more about what you and your child are hoping for from this. There may be a simpler fit than a competitive pathway.

## What to focus on the next 6 months
- Let your child keep playing in their current setting
- Take a conversation with your IKF advisor — it will help us understand whether the Parent SOP captured the full picture, or whether things have changed since you submitted it
- Re-assess at 6 months — many things look different in 6 months at this age$cell$,
 false)

ON CONFLICT (cell_key) DO UPDATE
  SET title = EXCLUDED.title,
      recommendation_md = EXCLUDED.recommendation_md,
      updated_at = now()
  WHERE recommendation_cells.is_published = false;
