// Generates 9 sample PDFs (one per Stage 2 assessment template) into
// samples/stage2-uploads/. Use these to upload through the Stage 2 portal
// to test end-to-end → minimum dataset reached → advisor scoring → Stage 3.
//
// Run: node scripts/generate-sample-pdfs.mjs
//
// Output is gitignored (samples/ folder) — re-run to regenerate any time.

import PDFDocument from "pdfkit";
import { createWriteStream, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = join(ROOT, "samples", "stage2-uploads");
mkdirSync(OUT_DIR, { recursive: true });

// Consistent sample child across all 9 reports.
const CHILD = {
  name: "Aarav Mahato",
  dob: "14 March 2014",
  age: 12,
  gender: "Boy",
};

// Each entry maps to an `assessment_templates.key` in the DB.
const REPORTS = [
  {
    key: "scouting",
    filename: "scouting-report.pdf",
    title: "Scouting Report",
    provider: "Vertex Football Scouting · Kolkata",
    sections: [
      { heading: "Sessions observed", body: [
        "Match 1 — 12 Apr 2026 · U-13 Inter-zonal · 60 min played, central midfield.",
        "Match 2 — 19 Apr 2026 · Friendly vs Premier Academy · 90 min, central midfield.",
        "Match 3 — 26 Apr 2026 · State qualifier R1 · 75 min, attacking midfield.",
        "Match 4 — 03 May 2026 · State qualifier R2 · 90 min, attacking midfield.",
      ]},
      { heading: "Position and traits", body: [
        "Natural #8 with a clear tendency to drift higher when given freedom. Comfortable",
        "receiving on the half-turn under pressure. Vision in tight spaces is the standout",
        "trait — picked the killer ball 14 times across the 4 sessions where teammates",
        "made the run. Defensive transitions are still a work in progress; tracks back but",
        "occasionally loses his man in the half-space.",
      ]},
      { heading: "Areas to develop", body: [
        "1. Two-footedness — left foot is currently a release valve only, not a weapon.",
        "2. Aerial duels — small frame for his age; physical sessions need to address this.",
        "3. Reading the game without the ball — defensively reactive rather than proactive.",
      ]},
      { heading: "Scout's verdict", body: [
        "Player profile fits the academy intake bracket. Recommend Tier 2 academy trial",
        "within 6 months. Re-assess against state-level peer benchmark at 18 months.",
      ]},
    ],
    footer: "Report compiled by R. Sengupta (AFC B-License), Lead Scout · Vertex Football Scouting",
  },

  {
    key: "technical",
    filename: "technical-skill-assessment.pdf",
    title: "Technical Skill Assessment",
    provider: "Vertex Football Scouting · Kolkata",
    sections: [
      { heading: "Assessment context", body: [
        "Three controlled sessions over 9 days. Each skill rated 1-10 (10 = age-group elite,",
        "5 = age-group competent, 1 = significantly below age-group expectation).",
      ]},
      { heading: "Skill scores", body: [
        "Ball control (first touch, close control)         · 8/10",
        "Short passing (1-15 m, both feet)                  · 7/10",
        "Long passing (15+ m switches, lofted)              · 6/10",
        "Finishing (6-yard, 12-yard, set pieces)            · 6/10",
        "Dribbling at speed                                 · 7/10",
        "Positional awareness (off-ball)                    · 7/10",
        "Defensive recovery                                 · 5/10",
        "Heading and aerial play                            · 4/10",
      ]},
      { heading: "Composite", body: [
        "Overall technical rating: 6.3 / 10. Above age-group competent across in-possession",
        "skills, below benchmark on aerial and defensive metrics. Profile reads as a creative",
        "midfielder rather than a box-to-box engine.",
      ]},
    ],
    footer: "Assessed by M. Iyer, Technical Director · Vertex Football Scouting",
  },

  {
    key: "psychometric",
    filename: "psychometric-analysis.pdf",
    title: "Psychometric Analysis — Sport-Specific Battery",
    provider: "MindEdge Sport Psychology · Bengaluru",
    sections: [
      { heading: "Instruments administered", body: [
        "1. Sport Mental Toughness Questionnaire (SMTQ-14)",
        "2. Big Five Personality Inventory (short form)",
        "3. Competitive Anxiety Inventory (CSAI-2R)",
      ]},
      { heading: "Key scores (percentile vs age-matched sample, n=412)", body: [
        "Mental toughness — Confidence              · 72nd percentile",
        "Mental toughness — Constancy               · 64th percentile",
        "Mental toughness — Control                 · 58th percentile",
        "Conscientiousness                          · 68th percentile",
        "Emotional stability                        · 54th percentile",
        "Openness to experience                     · 71st percentile",
        "Competitive anxiety — cognitive            · 41st percentile (low-moderate)",
        "Competitive anxiety — somatic              · 35th percentile (low)",
      ]},
      { heading: "Interpretation", body: [
        "Profile is consistent with a competitively-oriented young athlete who performs",
        "above the median on mental toughness and below the median on anxiety. The gap",
        "between Confidence (72) and Control (58) is worth watching — when results go",
        "against him, his self-belief recovers faster than his composure.",
      ]},
    ],
    footer: "Compiled by Dr. P. Krishnan, Sport Psychologist (Reg. RCI A-58921)",
  },

  {
    key: "psychology",
    filename: "psychology-evaluation.pdf",
    title: "Psychology Evaluation — Clinical Interview",
    provider: "MindEdge Sport Psychology · Bengaluru",
    sections: [
      { heading: "Session summary", body: [
        "Single 50-minute structured interview, conducted in person on 28 Apr 2026.",
        "Parent (mother) was present for the first 15 minutes and then stepped out.",
      ]},
      { heading: "Presenting observations", body: [
        "Highly engaged with football; uses sport language naturally and accurately.",
        "Self-talk under simulated pressure was constructive, not catastrophic.",
        "Reported mild sleep disturbance the night before competitive matches — common,",
        "non-clinical, addressable with pre-sleep routine work.",
        "No indicators of clinical anxiety, depression, or attentional disorders.",
      ]},
      { heading: "Family dynamic note", body: [
        "Parent presents as supportive and informed. Child reports comfort discussing both",
        "wins and losses at home, which is a meaningful protective factor.",
      ]},
      { heading: "Recommendations", body: [
        "1. Establish a 20-minute pre-sleep wind-down routine on match-eve nights.",
        "2. Re-evaluate at 6 months; no scheduled follow-up required between.",
        "3. No clinical referral indicated at this time.",
      ]},
    ],
    footer: "Compiled by Dr. P. Krishnan, Sport Psychologist (Reg. RCI A-58921)",
  },

  {
    key: "strength_conditioning",
    filename: "strength-conditioning-profile.pdf",
    title: "Strength & Conditioning Profile",
    provider: "Apex Sport Science Lab · Pune",
    sections: [
      { heading: "Anthropometrics", body: [
        "Height                · 148 cm (47th percentile for age)",
        "Weight                · 41 kg  (42nd percentile)",
        "Body fat (skinfold)   · 14.2%  (within range)",
        "Predicted adult ht.   · 174 cm (Khamis-Roche)",
      ]},
      { heading: "Performance tests", body: [
        "10 m sprint           · 1.94 s   (61st percentile)",
        "30 m sprint           · 5.12 s   (58th percentile)",
        "Counter-movement jump · 28.4 cm  (54th percentile)",
        "Yo-Yo IR1             · level 14.6 (~1640 m) — strong",
        "Sit & reach           · +6 cm    (avg)",
      ]},
      { heading: "Programming notes", body: [
        "Aerobic capacity is the standout. Strength and explosive power are around the",
        "age-group average. The 6-month programme should prioritise:",
        "  · Lower-body unilateral strength (split squats, single-leg RDLs)",
        "  · Plyometric progressions for jump and change-of-direction",
        "  · Mobility maintenance, not expansion (already adequate)",
      ]},
    ],
    footer: "Compiled by Coach A. Deshmukh, CSCS · Apex Sport Science Lab",
  },

  {
    key: "nutrition",
    filename: "nutrition-assessment.pdf",
    title: "Nutrition Assessment",
    provider: "FuelSport Dietetics · Mumbai",
    sections: [
      { heading: "Methodology", body: [
        "3-day food diary (2 training days + 1 rest day), 24-hour recall interview with",
        "the parent, and 1 supervised observed meal. Plate-photo cross-check used.",
      ]},
      { heading: "Average daily intake", body: [
        "Energy           · 2150 kcal     (target for age + training load: 2400-2600)",
        "Protein          · 68 g  (1.66 g/kg) — adequate for growth + training",
        "Carbohydrate     · 290 g (47% energy) — slightly below target",
        "Fat              · 76 g  (32% energy) — within range",
        "Hydration        · ~1.6 L/day — below target (2.0-2.2 L)",
      ]},
      { heading: "Micronutrient flags", body: [
        "Iron        · likely sub-optimal (no red meat in diet; legumes daily but low",
        "              vitamin C pairing). Suggest blood panel.",
        "Vitamin D   · likely sub-optimal (limited sun exposure on training days).",
        "Calcium     · adequate via daily dairy.",
      ]},
      { heading: "Recommendations", body: [
        "1. Add a carbohydrate-forward post-training snack within 30 min of sessions.",
        "2. Increase fluid intake by ~500 ml/day; carry a marked bottle to track.",
        "3. Iron + vitamin D panel via paediatrician within 4 weeks.",
        "4. Reassess in 12 weeks alongside the S&C re-test.",
      ]},
    ],
    footer: "Compiled by Ms. N. Joshi, RD (Reg. IDA 14021) · FuelSport Dietetics",
  },

  {
    key: "academic",
    filename: "school-academic-record.pdf",
    title: "School Academic Record — Class VII (2025-26)",
    provider: "DAV Public School · Ranchi",
    sections: [
      { heading: "Subject grades (Term 2)", body: [
        "English         · A   (88/100)",
        "Mathematics     · A   (85/100)",
        "Science         · A+  (91/100)",
        "Social Studies  · B+  (76/100)",
        "Hindi           · A   (84/100)",
        "Sanskrit        · B+  (78/100)",
        "Computer Sc.    · A+  (94/100)",
        "Physical Ed.    · A+  (Distinction)",
      ]},
      { heading: "Class teacher's comment", body: [
        "Aarav is a quietly diligent student. He participates more readily in subjects that",
        "involve problem-solving — Maths, Science, and Computer Science — and is somewhat",
        "less engaged in rote-heavy subjects. Attendance has remained above 95% even with",
        "his external football commitments. Time-management is an ongoing development area.",
      ]},
      { heading: "Attendance & conduct", body: [
        "Attendance      · 96.4%",
        "Conduct grade   · A",
        "Disciplinary    · None",
      ]},
    ],
    footer: "Issued by R. Kumar, Class Teacher · countersigned by Principal · 10 Apr 2026",
  },

  {
    key: "learning_aptitude",
    filename: "learning-aptitude-profile.pdf",
    title: "Learning and Aptitude Profile",
    provider: "BrightArc Assessments · Delhi",
    sections: [
      { heading: "Instruments administered", body: [
        "1. Differential Aptitude Test (DAT) — short form",
        "2. Learning Styles Inventory (Kolb)",
        "3. Multiple Intelligences screener (Gardner-based)",
      ]},
      { heading: "Aptitude scores (percentile, age-matched)", body: [
        "Verbal reasoning      · 64th",
        "Numerical ability     · 81st",
        "Abstract reasoning    · 78th",
        "Spatial relations     · 86th",
        "Mechanical reasoning  · 72nd",
        "Speed & accuracy      · 69th",
      ]},
      { heading: "Learning style", body: [
        "Dominant style: Converger (active experimentation + abstract conceptualisation).",
        "Prefers structured problem-solving with a clear right answer. Less comfortable",
        "with open-ended discussion or sustained reflective writing.",
      ]},
      { heading: "Interpretation", body: [
        "Strong fit for STEM-aligned academic pathways alongside sport. Spatial reasoning",
        "(86th) and numerical ability (81st) are real strengths — useful if a sport career",
        "doesn't materialise. Verbal reasoning is the relative weak spot but still above",
        "average; not a concern.",
      ]},
    ],
    footer: "Compiled by Ms. S. Iyer, M.Sc. Psychology · BrightArc Assessments",
  },

  {
    key: "personality",
    filename: "personality-interest-mapping.pdf",
    title: "Personality and Interest Mapping",
    provider: "BrightArc Assessments · Delhi",
    sections: [
      { heading: "Instruments administered", body: [
        "1. Junior Personality Profile (16PF-adolescent variant)",
        "2. Holland Code interest inventory (RIASEC)",
        "3. Values clarification interview",
      ]},
      { heading: "Personality summary", body: [
        "Disciplined, internally motivated, slow to volunteer in groups but firm in his",
        "views when asked. Comfortable with structure, mildly uncomfortable with",
        "ambiguity. High agreeableness combined with above-average conscientiousness.",
      ]},
      { heading: "Interest profile (Holland code)", body: [
        "Top three RIASEC categories, in order:",
        "  R — Realistic        (hands-on, mechanical, sport)",
        "  I — Investigative    (problem-solving, science)",
        "  A — Artistic         (lower than the first two but meaningful)",
        "Social, Enterprising, and Conventional scored noticeably lower.",
      ]},
      { heading: "Affinity areas beyond the pitch", body: [
        "Talked at length about: building model aircraft, dismantling household electronics,",
        "competitive video gaming (FIFA, Rocket League). These are consistent with the",
        "Realistic + Investigative interest profile.",
      ]},
      { heading: "Career-shape suggestion", body: [
        "If sport doesn't become the career, the natural adjacent paths are sports science,",
        "engineering, applied maths, and tactical analysis roles. Worth keeping the academic",
        "STEM path open in parallel through Class 12.",
      ]},
    ],
    footer: "Compiled by Ms. S. Iyer, M.Sc. Psychology · BrightArc Assessments",
  },
];

function renderReport(doc, report) {
  // Header band
  doc
    .fillColor("#0B1220")
    .rect(0, 0, doc.page.width, 80)
    .fill();
  doc
    .fillColor("#dfff5e")
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("IKF PATHWAY 360 · SAMPLE REPORT", 50, 28, { characterSpacing: 2 });
  doc
    .fillColor("#ffffff")
    .fontSize(9)
    .font("Helvetica")
    .text(report.provider, 50, 50);

  // Title
  doc
    .fillColor("#0B1220")
    .fontSize(20)
    .font("Helvetica-Bold")
    .text(report.title, 50, 110);

  // Subject block
  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#555555")
    .text(`Subject: ${CHILD.name}   ·   DOB: ${CHILD.dob}   ·   Age: ${CHILD.age}   ·   Gender: ${CHILD.gender}`, 50, 140);

  doc.moveTo(50, 165).lineTo(545, 165).strokeColor("#dddddd").lineWidth(0.5).stroke();

  // Sections
  let y = 180;
  for (const section of report.sections) {
    doc
      .fillColor("#0B1220")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(section.heading, 50, y);
    y = doc.y + 6;

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#222222");

    for (const line of section.body) {
      doc.text(line, 50, y, { width: 495, lineGap: 2 });
      y = doc.y + 2;
    }
    y += 12;

    // Page break if needed
    if (y > 700) {
      doc.addPage();
      y = 60;
    }
  }

  // Footer
  doc
    .fontSize(8)
    .fillColor("#888888")
    .font("Helvetica-Oblique")
    .text(report.footer, 50, 760, { width: 495, align: "left" });
  doc
    .fontSize(7)
    .fillColor("#aaaaaa")
    .font("Helvetica")
    .text(`Sample data — generated for IKF Pathway 360 testing on ${new Date().toISOString().slice(0, 10)}`, 50, 778, { width: 495, align: "left" });
}

async function generateOne(report) {
  const filePath = join(OUT_DIR, report.filename);
  const doc = new PDFDocument({ size: "A4", margin: 50, info: {
    Title: report.title,
    Author: report.provider,
    Subject: `Sample assessment report for ${CHILD.name}`,
    Creator: "IKF Pathway 360 sample generator",
  }});

  const stream = createWriteStream(filePath);
  doc.pipe(stream);
  renderReport(doc, report);
  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return filePath;
}

console.log(`Generating ${REPORTS.length} sample PDFs into ${OUT_DIR}\n`);
for (const r of REPORTS) {
  const p = await generateOne(r);
  console.log(`  ✓ ${r.key.padEnd(22)} → ${r.filename}`);
}
console.log("\nDone. Upload these via /ikf360/upload to exercise Stage 2 → Stage 3.");
