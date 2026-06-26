// Seeded demo data for the IKF 360 Platform mockup.
// Replace with real backend calls when wiring to Lovable Cloud.

export type Stage = 1 | 2 | 3;
export type Readiness = "high" | "medium" | "forming";

export type IntentQuestion = {
  id: string;
  section: "child" | "parent" | "expectation";
  q: string;
  options: { label: string; score: number }[];
};

export const INTENT_QUESTIONS: IntentQuestion[] = [
  { id: "q1", section: "child", q: "How long has your child been playing football regularly?",
    options: [
      { label: "Less than 6 months", score: 1 },
      { label: "6 months – 2 years", score: 2 },
      { label: "2 – 5 years", score: 3 },
      { label: "More than 5 years", score: 4 },
    ]},
  { id: "q2", section: "child", q: "How often does your child play or train each week?",
    options: [
      { label: "Occasionally", score: 1 },
      { label: "1–2 times a week", score: 2 },
      { label: "3–4 times a week", score: 3 },
      { label: "5+ times a week", score: 4 },
    ]},
  { id: "q3", section: "child", q: "Has your child played in any organised competition?",
    options: [
      { label: "No, not yet", score: 1 },
      { label: "School-level only", score: 2 },
      { label: "District / state level", score: 3 },
      { label: "National / academy trials", score: 4 },
    ]},
  { id: "q4", section: "parent", q: "How would you describe your role in your child's football journey?",
    options: [
      { label: "I am still learning what's possible", score: 2 },
      { label: "I drop them off and support quietly", score: 3 },
      { label: "I am actively involved in their training", score: 4 },
      { label: "I push hard for results", score: 1 },
    ]},
  { id: "q5", section: "parent", q: "What does your child's school think about their football?",
    options: [
      { label: "School is fully supportive", score: 4 },
      { label: "School allows it but isn't involved", score: 3 },
      { label: "There is some tension with academics", score: 2 },
      { label: "School discourages it", score: 1 },
    ]},
  { id: "q6", section: "expectation", q: "What outcome are you most hoping for over the next 5 years?",
    options: [
      { label: "Professional football career", score: 4 },
      { label: "Academy placement & scholarships", score: 3 },
      { label: "Football alongside strong academics", score: 4 },
      { label: "Personal growth through the sport", score: 3 },
    ]},
  { id: "q7", section: "expectation", q: "If a professional career doesn't happen, what would you want for your child?",
    options: [
      { label: "A career inside the football world", score: 4 },
      { label: "Strong academic and life outcomes", score: 4 },
      { label: "I haven't thought about that yet", score: 2 },
      { label: "I would consider it a failure", score: 1 },
    ]},
  { id: "q8", section: "expectation", q: "How open are you to assessments that look beyond football?",
    options: [
      { label: "Very open — we want a complete picture", score: 4 },
      { label: "Open, but cautious", score: 3 },
      { label: "Only if it helps football", score: 2 },
      { label: "Not really interested", score: 1 },
    ]},
];

export function scoreReadiness(answers: Record<string, number>): Readiness {
  const values = Object.values(answers);
  if (values.length === 0) return "forming";
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  if (avg >= 3.2) return "high";
  if (avg >= 2.4) return "medium";
  return "forming";
}

export type AssessmentKey =
  | "scouting" | "technical" | "psychometric" | "psychology"
  | "fitness" | "nutrition" | "academic" | "aptitude" | "personality";

export type Assessment = {
  key: AssessmentKey;
  category: "Football" | "Mental" | "Physical" | "Academic" | "Personality";
  title: string;
  desc: string;
  provider: string;
  required: boolean;
  status: "pending" | "uploaded" | "verified";
  uploadedOn?: string;
};

export const ASSESSMENTS: Assessment[] = [
  { key: "scouting", category: "Football", title: "Scouting Report", desc: "Match-play observation across 3 sessions.", provider: "IKF Scout Network", required: true, status: "verified", uploadedOn: "12 Mar 2026" },
  { key: "technical", category: "Football", title: "Technical Skill Assessment", desc: "Ball control, passing, finishing, positional awareness.", provider: "FootballTech India", required: true, status: "verified", uploadedOn: "12 Mar 2026" },
  { key: "psychometric", category: "Mental", title: "Psychometric Analysis", desc: "Resilience, focus, competitive temperament.", provider: "Mindlogic Sports", required: true, status: "uploaded", uploadedOn: "28 Mar 2026" },
  { key: "psychology", category: "Mental", title: "Sports Psychology Evaluation", desc: "1:1 evaluation by a registered sports psychologist.", provider: "Sportzminds Clinic", required: false, status: "pending" },
  { key: "fitness", category: "Physical", title: "Strength & Conditioning Profile", desc: "Speed, endurance, power, recovery markers.", provider: "Athlete Lab Bengaluru", required: true, status: "verified", uploadedOn: "5 Apr 2026" },
  { key: "nutrition", category: "Physical", title: "Nutrition Assessment", desc: "Diet log + body composition by a sports dietitian.", provider: "FuelRight Nutrition", required: false, status: "pending" },
  { key: "academic", category: "Academic", title: "School Academic Record", desc: "Last 2 years of school report cards.", provider: "Uploaded by parent", required: true, status: "verified", uploadedOn: "20 Mar 2026" },
  { key: "aptitude", category: "Academic", title: "Learning & Aptitude Profile", desc: "Identifies academic strengths and learning style.", provider: "BrainWave Learning", required: false, status: "pending" },
  { key: "personality", category: "Personality", title: "Personality & Interest Mapping", desc: "Five-factor personality + career interest scan.", provider: "Mindlogic Sports", required: false, status: "uploaded", uploadedOn: "30 Mar 2026" },
];

export type DimensionScore = {
  key: "football" | "technical" | "mental" | "academic" | "personality";
  label: string;
  score: number; // 0-100
  band: "Emerging" | "Developing" | "Strong" | "Elite";
};

export type ParentChildProfile = {
  id: string;
  childName: string;
  childAge: number;
  gender: "Boy" | "Girl";
  city: string;
  parentName: string;
  parentPhone: string;
  joinedOn: string;
  stage: Stage;
  readiness: Readiness;
  advisor: { name: string; role: string; lastInteraction: string };
  scores: DimensionScore[];
  playerCategory: string;
  parentCategory: string;
  comboCategory: string;
  recommendation: { headline: string; body: string; nextSteps: string[] };
  timeline: { date: string; type: "intent" | "upload" | "score" | "note" | "milestone"; text: string }[];
};

export const PROFILES: ParentChildProfile[] = [
  {
    id: "p-001",
    childName: "Arjun Mahato",
    childAge: 13,
    gender: "Boy",
    city: "Jamshedpur, Jharkhand",
    parentName: "Sunita Mahato",
    parentPhone: "+91 98••• ••342",
    joinedOn: "8 Feb 2026",
    stage: 3,
    readiness: "high",
    advisor: { name: "Rahul Verma", role: "Senior Pathway Advisor", lastInteraction: "3 days ago" },
    scores: [
      { key: "football", label: "Football Ability", score: 78, band: "Strong" },
      { key: "technical", label: "Technical Strength", score: 72, band: "Strong" },
      { key: "mental", label: "Mental Strength", score: 84, band: "Elite" },
      { key: "academic", label: "Academic Performance", score: 66, band: "Developing" },
      { key: "personality", label: "Personality Fit", score: 81, band: "Strong" },
    ],
    playerCategory: "High-Ceiling Striker · Academy Track",
    parentCategory: "Aligned & Informed",
    comboCategory: "A1 — Pathway Ready",
    recommendation: {
      headline: "Recommend ISL academy trial within 6 months.",
      body: "Arjun's mental strength and football ability place him in the top decile of his cohort. Sunita's grounded support posture means Arjun can be guided into a residential academy without risk of burnout. Maintain academic tutoring alongside training.",
      nextSteps: [
        "Submit Arjun's profile to FC Goa & Bengaluru FC academy scouts (April intake)",
        "Begin Hindi+English academic bridge tutoring through IKF partner network",
        "Reassess fitness profile in 6 months",
      ],
    },
    timeline: [
      { date: "8 Feb 2026", type: "intent", text: "Stage 1 Parent SOP completed. Readiness: high." },
      { date: "12 Mar 2026", type: "upload", text: "Scouting + Technical reports uploaded." },
      { date: "20 Mar 2026", type: "upload", text: "Academic record uploaded." },
      { date: "28 Mar 2026", type: "upload", text: "Psychometric assessment uploaded." },
      { date: "5 Apr 2026", type: "upload", text: "S&C profile uploaded." },
      { date: "11 May 2026", type: "score", text: "Categorised as A1 — Pathway Ready by R. Verma." },
      { date: "12 May 2026", type: "milestone", text: "Recommendation issued: ISL academy trial." },
    ],
  },
  {
    id: "p-002",
    childName: "Meera Bhattacharya",
    childAge: 11,
    gender: "Girl",
    city: "Siliguri, West Bengal",
    parentName: "Anik Bhattacharya",
    parentPhone: "+91 90••• ••117",
    joinedOn: "2 Mar 2026",
    stage: 2,
    readiness: "high",
    advisor: { name: "Priya Iyer", role: "Naari Shakti Advisor", lastInteraction: "Yesterday" },
    scores: [
      { key: "football", label: "Football Ability", score: 64, band: "Developing" },
      { key: "technical", label: "Technical Strength", score: 70, band: "Strong" },
      { key: "mental", label: "Mental Strength", score: 88, band: "Elite" },
      { key: "academic", label: "Academic Performance", score: 82, band: "Elite" },
      { key: "personality", label: "Personality Fit", score: 75, band: "Strong" },
    ],
    playerCategory: "Awaiting categorisation",
    parentCategory: "Engaged but Uncertain",
    comboCategory: "Pending — 4 of 5 assessments uploaded",
    recommendation: {
      headline: "Awaiting Stage 2 completion (1 assessment pending).",
      body: "Meera's profile is forming strongly. Once the personality mapping is uploaded, she will be categorised within 48 hours.",
      nextSteps: [
        "Upload Personality & Interest Mapping report",
        "Schedule call with Priya Iyer to discuss Naari Shakti scholarship",
      ],
    },
    timeline: [
      { date: "2 Mar 2026", type: "intent", text: "Stage 1 Parent SOP completed. Readiness: high." },
      { date: "15 Mar 2026", type: "upload", text: "Scouting report uploaded." },
      { date: "1 Apr 2026", type: "upload", text: "Psychometric + Academic uploaded." },
      { date: "20 Apr 2026", type: "upload", text: "S&C profile uploaded." },
      { date: "2 May 2026", type: "note", text: "Advisor note: family open to residential programme." },
    ],
  },
  {
    id: "p-003",
    childName: "Vihaan Reddy",
    childAge: 15,
    gender: "Boy",
    city: "Hyderabad, Telangana",
    parentName: "Lakshmi Reddy",
    parentPhone: "+91 99••• ••502",
    joinedOn: "20 Apr 2026",
    stage: 1,
    readiness: "medium",
    advisor: { name: "Karan Joshi", role: "Pathway Advisor", lastInteraction: "—" },
    scores: [],
    playerCategory: "Pending Stage 2",
    parentCategory: "High-Pressure Outcome-Focused",
    comboCategory: "Pending",
    recommendation: {
      headline: "Stage 1 complete. Schedule first conversation before unlocking Stage 2.",
      body: "Parent shows high expectations but limited understanding of academy realities. Recommend a 30-minute orientation call before assessments are commissioned.",
      nextSteps: [
        "Karan to schedule orientation call within 5 days",
        "Send Stage 2 unlock invite only after call is logged",
      ],
    },
    timeline: [
      { date: "20 Apr 2026", type: "intent", text: "Stage 1 Parent SOP completed. Readiness: medium." },
    ],
  },
  {
    id: "p-004",
    childName: "Tenzin Lama",
    childAge: 9,
    gender: "Boy",
    city: "Gangtok, Sikkim",
    parentName: "Pema Lama",
    parentPhone: "+91 97••• ••880",
    joinedOn: "10 May 2026",
    stage: 1,
    readiness: "forming",
    advisor: { name: "Karan Joshi", role: "Pathway Advisor", lastInteraction: "—" },
    scores: [],
    playerCategory: "Pending Stage 2",
    parentCategory: "Uninformed but Willing",
    comboCategory: "Pending",
    recommendation: {
      headline: "Begin with parent education, not assessments.",
      body: "Tenzin is young and family is new to the system. Send the IKF parent primer and revisit in 3 months.",
      nextSteps: [
        "Send Hindi parent primer over WhatsApp",
        "Revisit Stage 2 readiness in August 2026",
      ],
    },
    timeline: [
      { date: "10 May 2026", type: "intent", text: "Stage 1 Parent SOP completed. Readiness: forming." },
    ],
  },
];

export const READINESS_META: Record<Readiness, { label: string; color: string; bg: string }> = {
  high:    { label: "High Readiness",    color: "#144A6C", bg: "#DCE9F1" },
  medium:  { label: "Medium Readiness",  color: "#7A5A00", bg: "#FFFBD1" },
  forming: { label: "Forming",           color: "#3A4754", bg: "#F2F5F7" },
};

// Parent-facing explanation of the readiness signal (BRD Module D). Kept separate
// from READINESS_META so the admin/advisor chip stays unchanged. The goal is to
// leave the parent informed and reassured, but curious enough to continue.
export const READINESS_PARENT_COPY: Record<Readiness, { headline: string; meaning: string; next: string }> = {
  high: {
    headline: "A strong, ready start.",
    meaning:
      "Your answers show many of the things we look for early on — steady play, real match experience, and a supportive environment at home and school. Your child has a solid foundation to build on.",
    next: "You can move into Stage 2 whenever you're ready. Your advisor will help you decide what to focus on first.",
  },
  medium: {
    headline: "A promising start, with room to grow.",
    meaning:
      "There are several positive signs here. A few areas — like experience, routine, or the support around your child — may need a little more attention before the next step. That's completely normal, and it's exactly what we're here to help with.",
    next: "Your advisor will talk a few of these areas through with you, then guide you into Stage 2.",
  },
  forming: {
    headline: "An early, welcome start.",
    meaning:
      "Your child's football journey is still taking shape — and that's a good place to begin. Starting early means we can help point things in the right direction from the very start, with no pressure at all.",
    next: "Your advisor will begin with a short, friendly orientation to help you understand what's ahead.",
  },
};

export const STAGE1_EXPLAINER = {
  whatIsStage1:
    "Stage 1 is a quick first conversation. Your answers give your IKF advisor an early sense of where your child stands today — in football, at school, and at home. It isn't a test, and there are no wrong answers.",
  curiosity: "This is only the starting picture. As you complete Stage 2, it becomes far more detailed and personal to your child.",
} as const;

export const STAGE_META: Record<Stage, { label: string; desc: string }> = {
  1: { label: "Stage 1 — Intent",      desc: "Conversation started" },
  2: { label: "Stage 2 — Assessment",  desc: "Evidence being gathered" },
  3: { label: "Stage 3 — Pathway",     desc: "Recommendation active" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Parent Journey SOP — the 4-section / 11-question Stage 1 entry experience that
// replaces the legacy INTENT_QUESTIONS flow above. The legacy exports are kept
// only so the admin view can still render profiles submitted before this SOP.
//
// Heterogeneous shapes (single-select, a yes/no with a conditional follow-up,
// a max-2 multi-select with an "other" field, a "prefer not to say", and an
// open text box) are stored verbatim as `SopResponses` JSON. Readiness is
// derived from the scoreable subset (see `deriveReadiness`).
// ─────────────────────────────────────────────────────────────────────────────

export type SopResponses = {
  firstName: string;
  age: number | null;
  q2: string;                                  // years playing — option label
  q3: string;                                  // where trains — option label
  q4: { prior: "yes" | "no" | ""; detail: string };
  q5: string;                                  // age-22 vision — option label
  q6: { choices: string[]; other: string };    // biggest concern(s), up to two
  q7: string;                                  // support duration — option label
  q8: string;                                  // funding capacity — label or "Prefer not to say"
  q9: string;                                  // relocation openness — option label
  q10: string;                                 // career-path openness — option label
  q11: string;                                 // open text — anything else
};

export const EMPTY_SOP_RESPONSES: SopResponses = {
  firstName: "",
  age: null,
  q2: "",
  q3: "",
  q4: { prior: "", detail: "" },
  q5: "",
  q6: { choices: [], other: "" },
  q7: "",
  q8: "",
  q9: "",
  q10: "",
  q11: "",
};

// The family/parent-level answers (asked once per parent, reused for every child)
// vs the child-specific answers (asked per kid). Sections 1-2 of the wizard are
// family; 3-4 are child. See [[parent-journey-sop]] feedback item 4.a.
export const FAMILY_QUESTION_IDS = ["q6", "q7", "q8", "q9", "q10"] as const;
export const FAMILY_SECTIONS = [1, 2] as const;
export const CHILD_SECTIONS = [3, 4] as const;

export type FamilyResponses = Pick<SopResponses, "q6" | "q7" | "q8" | "q9" | "q10">;

export const EMPTY_FAMILY: FamilyResponses = {
  q6: { choices: [], other: "" },
  q7: "",
  q8: "",
  q9: "",
  q10: "",
};

export function extractFamily(r: SopResponses): FamilyResponses {
  return { q6: r.q6, q7: r.q7, q8: r.q8, q9: r.q9, q10: r.q10 };
}

export type JourneyOption = { label: string; score?: number };

export type JourneyQuestion = {
  id: "q2" | "q3" | "q4" | "q5" | "q6" | "q7" | "q8" | "q9" | "q10";
  section: 1 | 2 | 3 | 4;
  kind: "single" | "yesno" | "multi";
  q: string;
  note?: string;
  options: JourneyOption[];
  max?: number;            // multi: maximum selectable (Q6 → 2)
  otherLabel?: string;     // multi: option that reveals a free-text field (Q6 → "Something else")
  followValue?: string;    // yesno: option that reveals the follow-up field (Q4 → "Yes")
  followPrompt?: string;   // yesno: label for the follow-up field
  preferNotToSay?: boolean; // single: append a visible, unscored "Prefer not to say" (Q8)
};

export const JOURNEY_QUESTIONS: JourneyQuestion[] = [
  {
    id: "q2", section: 1, kind: "single",
    q: "How long has your child been playing football seriously — meaning regular training, not just casual kickabouts?",
    options: [
      { label: "Less than a year", score: 1 },
      { label: "1–2 years", score: 2 },
      { label: "3–4 years", score: 3 },
      { label: "5 years or more", score: 4 },
    ],
  },
  {
    id: "q3", section: 1, kind: "single",
    q: "Where does your child currently train?",
    options: [
      { label: "A registered football academy", score: 4 },
      { label: "A school team or programme", score: 3 },
      { label: "A local club or coaching setup", score: 2 },
      { label: "Independently — no formal coaching yet", score: 1 },
      { label: "Other", score: 2 },
    ],
  },
  {
    id: "q4", section: 1, kind: "yesno",
    q: "Has your child participated in any IKF assessment camps before?",
    options: [
      { label: "Yes" },
      { label: "No — this is our first contact with IKF" },
    ],
    followValue: "Yes",
    followPrompt: "Which city and approximately when?",
  },
  {
    id: "q5", section: 2, kind: "single",
    q: "When you imagine your child at age 22, what does the best version of their football story look like?",
    options: [
      { label: "Playing professionally — for a club in India or abroad", score: 4 },
      { label: "Earning a scholarship through football — for a college or university", score: 4 },
      { label: "Continuing to play seriously at a good level — without necessarily going professional", score: 3 },
      { label: "Using football as a foundation — for discipline, fitness, and life skills — regardless of where it leads", score: 3 },
      { label: "Staying connected to football in some way — coaching, management, sports education — even if not as a player", score: 3 },
      { label: "Honestly, I'm not sure yet — I need help understanding what's realistic", score: 2 },
    ],
  },
  {
    id: "q6", section: 2, kind: "multi", max: 2,
    q: "What has been your biggest concern about your child's football journey so far?",
    note: "Choose up to two.",
    options: [
      { label: "Whether my child has the talent to go far" },
      { label: "Whether the investment — time and money — is realistic for our family" },
      { label: "Whether football will affect my child's academics" },
      { label: "Whether my child is getting the right coaching and guidance" },
      { label: "Whether there is actually a future in Indian football worth investing in" },
      { label: "Something else" },
    ],
    otherLabel: "Something else",
  },
  {
    id: "q7", section: 2, kind: "single",
    q: "How long are you prepared to continue actively supporting your child's football journey from today?",
    options: [
      { label: "We are at the beginning — at least 5–7 more years", score: 4 },
      { label: "We are mid-journey — 3–5 more years", score: 3 },
      { label: "We are approaching a decision point — 1–2 years", score: 2 },
      { label: "We need to make a decision very soon — within the next year", score: 1 },
    ],
  },
  {
    id: "q8", section: 3, kind: "single", preferNotToSay: true,
    q: "How would you describe your family's current capacity to fund your child's football development?",
    options: [
      { label: "We can sustain serious investment — residential academies, travel, specialised coaching — for the foreseeable future", score: 4 },
      { label: "We can manage moderate investment — regular coaching and local tournaments — but significant costs would be difficult", score: 3 },
      { label: "Our capacity is limited — we need pathways that are affordable or supported by scholarships and programmes", score: 2 },
      { label: "Our situation is variable — it depends on the year and what comes up", score: 2 },
    ],
  },
  {
    id: "q9", section: 3, kind: "single",
    q: "If the right opportunity required your child to train or study in a different city, would your family consider it?",
    options: [
      { label: "Yes — we are open to relocation if the opportunity is right" },
      { label: "Possibly — it would depend on the specifics, cost, and timing" },
      { label: "No — our child needs to stay in our city for now" },
      { label: "Our child is already training away from home" },
    ],
  },
  {
    id: "q10", section: 3, kind: "single",
    q: "If at some point it became clear that a professional playing career was unlikely, would you want guidance on other football-related career paths — coaching, sports management, analytics, officiating?",
    options: [
      { label: "Yes — absolutely. We want a future in football, not just as a player", score: 4 },
      { label: "Possibly — we haven't thought that far ahead yet", score: 3 },
      { label: "No — for now we are focused entirely on the playing pathway", score: 2 },
    ],
  },
];

export const PREFER_NOT_TO_SAY = "Prefer not to say";

export type JourneySection = {
  n: 1 | 2 | 3 | 4;
  eyebrow: string;
  header: string;
  subtext: string;
  close: string | null; // bridging copy shown before the next section (null on the last)
};

// Family-first ordering (feedback 4.a): sections 1-2 ask about the family once;
// sections 3-4 are about the specific child and repeat for each kid added.
export const JOURNEY_SECTIONS: JourneySection[] = [
  {
    n: 1,
    eyebrow: "Your family",
    header: "Football journeys don't happen in isolation — they happen within families.",
    subtext: "We ask these questions about your family once, and they apply to every child you add. Answer as honestly as you can — nothing here is judged. Everything here helps us give you a recommendation that actually fits your reality.",
    close: "Thank you for being open about that. That takes courage.",
  },
  {
    n: 2,
    eyebrow: "Your hopes & concerns",
    header: "What are you hoping for — and what's been on your mind?",
    subtext: "Be honest, including with yourself. There is no wrong answer, and your response shapes everything that follows.",
    close: "Good. Now let's talk about your child.",
  },
  {
    n: 3,
    eyebrow: "About your child",
    header: "Tell us about your child's football journey so far.",
    subtext: "Just the basics — we build the detailed picture during the assessment.",
    close: "Almost there — one last thing about your child.",
  },
  {
    n: 4,
    eyebrow: "Hopes for your child",
    header: "What does the best version of their football story look like?",
    subtext: "And anything else you'd like us to know about this child. Not mandatory — but the parents who use it tend to get the most precise picture.",
    close: null,
  },
];

export const JOURNEY_ENTRY = {
  eyebrow: "Section 1 of 4",
  headline: "Before we assess your child, we'd like to understand your family.",
  body: [
    "This takes about ten minutes.",
    "There are no right answers here. The more honestly you respond, the more useful your child's profile will be. Everything you share stays within IKF Pathway 360 — it is never shared with clubs, academies, or anyone outside the platform without your permission.",
    "We have four short sections. You can pause and return at any point — your answers save automatically.",
  ],
  button: "Let's begin",
} as const;

export const JOURNEY_SUBMISSION = {
  headline: "Your child's profile has been started.",
  intro: "Here is what happens next.",
  body: [
    "Our team will review what you've shared. Within five days, we will be in touch to schedule your child's assessment — which covers football skill and trajectory, academic profile, and temperament.",
    "After the assessment, you will receive a clear recommendation. Not a report filled with jargon. A plain-language picture of where your child stands, what it means, and what your family should focus on in the next six months.",
    "You have done something most football parents never do — you have asked for an honest picture. That is the right place to start.",
  ],
  button: "Go to your dashboard",
} as const;

export const JOURNEY_Q11_PLACEHOLDER =
  "My son has been training for three years but recently lost motivation after being dropped from his school team. I want to understand whether this is normal or a warning sign…";

// Look up the numeric score for a chosen option label within a question.
function optionScore(q: JourneyQuestion, label: string): number | undefined {
  return q.options.find(o => o.label === label)?.score;
}

// Map the SOP responses to the numeric per-question score map that backs the
// legacy `answers` column and feeds readiness. Only the scoreable single-select
// questions contribute (q2,q3,q5,q7,q8,q10); "Prefer not to say" on q8 simply
// drops out (no score). Unanswered questions are skipped.
export function journeyScoreMap(r: SopResponses): Record<string, number> {
  const map: Record<string, number> = {};
  const byId = (id: JourneyQuestion["id"]) => JOURNEY_QUESTIONS.find(q => q.id === id)!;
  const single: [JourneyQuestion["id"], string][] = [
    ["q2", r.q2], ["q3", r.q3], ["q5", r.q5], ["q7", r.q7], ["q8", r.q8], ["q10", r.q10],
  ];
  for (const [id, label] of single) {
    if (!label || label === PREFER_NOT_TO_SAY) continue;
    const s = optionScore(byId(id), label);
    if (typeof s === "number") map[id] = s;
  }
  return map;
}

// Derive the high/medium/forming readiness signal from the new SOP, reusing the
// same averaging + thresholds as the legacy scoreReadiness so everything
// downstream (dashboard, admin, emails, Stage 3) keeps working unchanged.
export function deriveReadiness(r: SopResponses): Readiness {
  return scoreReadiness(journeyScoreMap(r));
}

// ─────────────────────────────────────────────────────────────────────────────
// Academic profile as a MODIFIER within a category (IKF Categorisation IP).
// Not a separate axis — the advisor tags the academic profile during scoring and
// the matching blurb is appended to the cell recommendation, shifting its
// weight/direction without exploding the 3x3 matrix into 27 variants.
// ─────────────────────────────────────────────────────────────────────────────

export type AcademicModifier = "strong" | "average" | "developing";

export const ACADEMIC_MODIFIERS: Record<AcademicModifier, { label: string; blurb: string }> = {
  strong: {
    label: "Strong academics",
    blurb:
      "A strong academic profile widens your child's options. The football pathway above can run in parallel with a scholarship or academic route — keep both doors open, and don't over-commit to football at the cost of schooling.",
  },
  average: {
    label: "Steady academics",
    blurb:
      "Academics are on track. Keep a steady balance — the plan above holds, with regular check-ins so training load never crowds out schoolwork.",
  },
  developing: {
    label: "Academics need support",
    blurb:
      "Academics need attention alongside football. Before scaling up the football commitment above, put a support plan in place at school — a sustainable future depends on both.",
  },
};

// ─── Pre-review check-in (notification Type 1) ───────────────────────────────
// A short "what's changed since the last SOP" form a parent fills 4 weeks before
// their review, so the advisor walks into the re-score already knowing what moved.

export type PreReviewQuestion = {
  id: "pr1" | "pr2" | "pr3" | "pr4" | "pr5";
  q: string;
  kind: "single" | "text";
  options?: string[];
};

export const PRE_REVIEW_QUESTIONS: PreReviewQuestion[] = [
  { id: "pr1", kind: "single", q: "Has what you're hoping for from your child's football changed?",
    options: ["No — same as before", "Yes — we're aiming higher now", "Yes — we've become more realistic", "We're genuinely unsure right now"] },
  { id: "pr2", kind: "single", q: "Has your family's capacity to invest — time and money — changed?",
    options: ["No change", "We can sustain more now", "Our capacity has tightened"] },
  { id: "pr3", kind: "single", q: "Has your timeline changed?",
    options: ["No change", "We have more time / runway now", "We're approaching a decision point sooner"] },
  { id: "pr4", kind: "single", q: "Has your openness to relocation changed?",
    options: ["No change", "We're more open now", "We're less open now"] },
  { id: "pr5", kind: "text", q: "Anything else that's changed we should know before the review?" },
];

export type PreReviewResponses = { pr1: string; pr2: string; pr3: string; pr4: string; pr5: string };

export const EMPTY_PRE_REVIEW: PreReviewResponses = { pr1: "", pr2: "", pr3: "", pr4: "", pr5: "" };
