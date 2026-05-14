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
      { date: "8 Feb 2026", type: "intent", text: "Stage 1 intent form completed. Readiness: high." },
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
      { date: "2 Mar 2026", type: "intent", text: "Stage 1 intent form completed. Readiness: high." },
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
      { date: "20 Apr 2026", type: "intent", text: "Stage 1 intent form completed. Readiness: medium." },
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
      { date: "10 May 2026", type: "intent", text: "Stage 1 intent form completed. Readiness: forming." },
    ],
  },
];

export const READINESS_META: Record<Readiness, { label: string; color: string; bg: string }> = {
  high:    { label: "High Readiness",    color: "#0B1220", bg: "#DFFF5E" },
  medium:  { label: "Medium Readiness",  color: "#0B1220", bg: "#F5C518" },
  forming: { label: "Forming",           color: "#EAF0F7", bg: "#243049" },
};

export const STAGE_META: Record<Stage, { label: string; desc: string }> = {
  1: { label: "Stage 1 — Intent",      desc: "Conversation started" },
  2: { label: "Stage 2 — Assessment",  desc: "Evidence being gathered" },
  3: { label: "Stage 3 — Pathway",     desc: "Recommendation active" },
};
