import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/codepen-export")({
  component: CodePenExport,
});

function CodePenExport() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  function openCodePen() {
    const data = JSON.stringify({
      title: "IKF 360 Mockup",
      description: "Sport picker → Typeform intake → Assessments → Parent/Student/Coach dashboards → NextGen profile (EN/HI bilingual)",
      html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
</head>
<body>
<header class="topbar">
  <div class="topbar-inner">
    <div class="brand"><span class="brand-dot"></span><span data-en="IKF 360" data-hi="आईकेएफ 360">IKF 360</span></div>
    <nav class="steps" id="steps"></nav>
    <div class="lang">
      <button id="en" class="on">EN</button>
      <button id="hi">हिं</button>
    </div>
  </div>
</header>
<main class="page" id="page"></main>
</body>
</html>`,
      css: `  :root{
    --bg:#0B1220; --surface:#141C2E; --surface-2:#1B2438; --border:#243049;
    --text:#EAF0F7; --dim:#8A96AC; --brand:#DFFF5E; --accent:#F5C518;
    --good:#A8E063; --warn:#F5C518; --bad:#FF6B6B;
  }
  *{box-sizing:border-box}
  html,body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,'Noto Sans Devanagari',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  body.hi{font-family:'Noto Sans Devanagari',Inter,system-ui,sans-serif}
  h1,h2,h3{font-family:'Space Grotesk',Inter,sans-serif;font-weight:700;letter-spacing:-.01em;margin:0}
  body.hi h1, body.hi h2, body.hi h3{font-family:'Noto Sans Devanagari',sans-serif}
  a{color:inherit}
  button{font-family:inherit;cursor:pointer;border:none}
  .topbar{position:sticky;top:0;z-index:50;background:rgba(11,18,32,.85);backdrop-filter:blur(10px);border-bottom:1px solid var(--border)}
  .topbar-inner{max-width:1200px;margin:0 auto;padding:14px 20px;display:flex;align-items:center;gap:16px}
  .brand{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:.02em}
  .brand-dot{width:10px;height:10px;border-radius:50%;background:var(--brand);box-shadow:0 0 12px var(--brand)}
  .steps{display:flex;gap:6px;flex:1;justify-content:center;flex-wrap:wrap}
  .step{padding:7px 12px;font-size:12px;border-radius:999px;background:var(--surface-2);color:var(--dim);cursor:pointer;border:1px solid transparent;white-space:nowrap}
  .step.active{background:var(--brand);color:#0B1220;font-weight:700}
  .step:hover:not(.active){border-color:var(--border);color:var(--text)}
  .lang{display:flex;background:var(--surface-2);border-radius:999px;padding:3px;border:1px solid var(--border)}
  .lang button{background:transparent;color:var(--dim);padding:5px 11px;border-radius:999px;font-size:12px;font-weight:600}
  .lang button.on{background:var(--brand);color:#0B1220}
  .page{max-width:1200px;margin:0 auto;padding:32px 20px 80px}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:28px}
  .grid{display:grid;gap:20px}
  .muted{color:var(--dim)}
  .kicker{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);margin-bottom:10px}
  .chip{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;font-size:11px;font-weight:600;background:var(--surface-2);color:var(--text);border:1px solid var(--border)}
  .chip.brand{background:var(--brand);color:#0B1220;border-color:var(--brand)}
  .chip.warn{background:var(--accent);color:#0B1220;border-color:var(--accent)}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 18px;border-radius:12px;font-weight:700;font-size:14px;transition:transform .15s}
  .btn:hover{transform:translateY(-1px)}
  .btn.primary{background:var(--brand);color:#0B1220}
  .btn.ghost{background:transparent;color:var(--text);border:1px solid var(--border)}
  .hidden{display:none!important}
  .sport-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-top:24px}
  .sport{padding:24px 18px;border-radius:16px;background:var(--surface-2);border:1px solid var(--border);text-align:center;cursor:pointer;transition:all .2s;position:relative}
  .sport.active{border-color:var(--brand);background:linear-gradient(180deg,rgba(223,255,94,.08),transparent)}
  .sport.soon{opacity:.5;cursor:not-allowed}
  .sport .ic{font-size:36px;margin-bottom:8px}
  .sport .nm{font-weight:700;font-size:14px}
  .sport .tag{position:absolute;top:8px;right:8px;font-size:9px;background:var(--surface);padding:3px 7px;border-radius:999px;color:var(--dim);letter-spacing:.1em}
  .tf{min-height:60vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:40px 20px}
  .tf-num{font-size:11px;color:var(--brand);letter-spacing:.2em;margin-bottom:14px;font-weight:700}
  .tf-q{font-size:clamp(22px,4vw,34px);font-weight:700;line-height:1.25;max-width:680px;margin-bottom:32px}
  .tf-opts{display:grid;gap:10px;max-width:520px;width:100%}
  .tf-opt{text-align:left;padding:16px 20px;background:var(--surface-2);border:1px solid var(--border);border-radius:14px;color:var(--text);font-size:15px;display:flex;align-items:center;gap:12px;transition:all .15s}
  .tf-opt:hover{border-color:var(--brand);transform:translateX(2px)}
  .tf-opt .k{width:24px;height:24px;border-radius:6px;background:var(--surface);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--dim)}
  .tf-opt.sel{border-color:var(--brand);background:rgba(223,255,94,.06)}
  .tf-opt.sel .k{background:var(--brand);color:#0B1220;border-color:var(--brand)}
  .tf-nav{display:flex;gap:10px;margin-top:32px}
  .progress{height:3px;background:var(--surface-2);border-radius:999px;overflow:hidden;max-width:520px;width:100%;margin-bottom:32px}
  .progress > div{height:100%;background:var(--brand);transition:width .3s}
  .upload-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin-top:20px}
  .upload{padding:18px;border-radius:14px;background:var(--surface-2);border:1px solid var(--border)}
  .upload-h{display:flex;justify-content:space-between;align-items:start;gap:10px;margin-bottom:8px}
  .upload-t{font-weight:700;font-size:14px}
  .upload-d{font-size:12px;color:var(--dim);margin-bottom:12px}
  .upload-f{display:flex;align-items:center;gap:8px;padding:9px 11px;background:var(--surface);border:1px dashed var(--border);border-radius:10px;font-size:12px;color:var(--dim);cursor:pointer}
  .upload-f.done{border-style:solid;border-color:var(--brand);color:var(--text)}
  .badge-ok{background:var(--good);color:#0B1220;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:700}
  .badge-pend{background:var(--surface);color:var(--dim);padding:3px 8px;border-radius:999px;font-size:10px;font-weight:700;border:1px solid var(--border)}
  .tabs{display:flex;gap:6px;background:var(--surface-2);padding:5px;border-radius:14px;margin-bottom:24px;overflow-x:auto}
  .tab{padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;background:transparent;color:var(--dim);white-space:nowrap}
  .tab.on{background:var(--brand);color:#0B1220}
  .dash-grid{display:grid;grid-template-columns:2fr 1fr;gap:20px}
  @media(max-width:880px){.dash-grid{grid-template-columns:1fr}}
  .score-row{display:flex;align-items:center;gap:14px;margin-bottom:14px}
  .score-row .lbl{flex:1;font-size:13px;font-weight:600}
  .score-row .bar{flex:2;height:8px;background:var(--surface-2);border-radius:999px;overflow:hidden}
  .score-row .bar > div{height:100%;border-radius:999px}
  .score-row .val{font-family:'Space Grotesk',monospace;font-weight:700;width:36px;text-align:right}
  .kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px}
  .kpi{padding:16px;background:var(--surface-2);border-radius:12px}
  .kpi .n{font-family:'Space Grotesk';font-size:26px;font-weight:700;color:var(--brand)}
  .kpi .l{font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.1em;margin-top:4px}
  .reco{background:linear-gradient(135deg,rgba(223,255,94,.12),rgba(245,197,24,.04));border:1px solid var(--brand)}
  .next-step{display:flex;gap:12px;align-items:start;padding:10px 0;font-size:14px}
  .next-step .nm{width:24px;height:24px;border-radius:50%;background:var(--brand);color:#0B1220;font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .scholar{padding:14px;background:var(--surface-2);border-radius:12px;margin-bottom:10px;border-left:3px solid var(--accent)}
  .scholar .t{font-weight:700;font-size:14px;margin-bottom:4px}
  .scholar .a{font-size:12px;color:var(--brand);font-weight:600}
  .timeline-chart{background:var(--surface-2);border-radius:12px;padding:20px;margin-top:14px}
  .tl-bars{display:flex;align-items:end;gap:8px;height:140px;margin-top:14px}
  .tl-bar{flex:1;background:linear-gradient(180deg,var(--brand),rgba(223,255,94,.3));border-radius:6px 6px 0 0;position:relative;min-height:8px}
  .tl-bar .yr{position:absolute;bottom:-22px;left:50%;transform:translateX(-50%);font-size:10px;color:var(--dim)}
  .tl-bar .sc{position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:10px;color:var(--brand);font-weight:700}
  .ed-card{padding:14px;background:var(--surface-2);border-radius:12px;margin-bottom:10px;display:flex;gap:12px;align-items:start}
  .ed-card .ic{width:36px;height:36px;border-radius:10px;background:var(--brand);color:#0B1220;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0}
  hr{border:none;border-top:1px solid var(--border);margin:20px 0}
  .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
  .stack{display:flex;flex-direction:column;gap:8px}`,
      js: `/* IKF 360 Mockup — single file, bilingual EN/HI */
const T = {
  steps: [
    {id:'sport', en:'1 · Sport', hi:'1 · खेल'},
    {id:'intake', en:'2 · Intake', hi:'2 · प्रश्नावली'},
    {id:'inputs', en:'3 · Assessments', hi:'3 · मूल्यांकन'},
    {id:'parent', en:'4 · Parent', hi:'4 · अभिभावक'},
    {id:'student', en:'5 · Student', hi:'5 · खिलाड़ी'},
    {id:'coach', en:'6 · Coach↔Parent', hi:'6 · कोच↔अभिभावक'},
    {id:'nextgen', en:'7 · NextGen Profile', hi:'7 · नेक्स्टजेन प्रोफ़ाइल'},
  ],
};
let LANG = 'en'; let STEP = 'sport';
const tr = (en, hi) => LANG === 'hi' ? hi : en;
const SPORTS = [
  {id:'soccer', en:'Football', hi:'फुटबॉल', ic:'⚽', active:true},
  {id:'cricket', en:'Cricket', hi:'क्रिकेट', ic:'🏏'},
  {id:'basket', en:'Basketball', hi:'बास्केटबॉल', ic:'🏀'},
  {id:'ath', en:'Athletics', hi:'एथलेटिक्स', ic:'🏃'},
  {id:'bad', en:'Badminton', hi:'बैडमिंटन', ic:'🏸'},
];
const QS = [
  {q_en:"What is your child's name?", q_hi:"आपके बच्चे का नाम क्या है?", type:'text', placeholder_en:'e.g. Arjun', placeholder_hi:'जैसे अर्जुन'},
  {q_en:"How old is your child?", q_hi:"आपका बच्चा कितने साल का है?",
    opts:[{en:'7 – 9',hi:'7 – 9'},{en:'10 – 12',hi:'10 – 12'},{en:'13 – 15',hi:'13 – 15'},{en:'16 – 18',hi:'16 – 18'}]},
  {q_en:"How long has your child been playing football?", q_hi:"आपका बच्चा कब से फुटबॉल खेल रहा है?",
    opts:[{en:'< 6 months',hi:'6 महीने से कम'},{en:'6 mo – 2 yrs',hi:'6 महीने – 2 साल'},{en:'2 – 5 years',hi:'2 – 5 साल'},{en:'5+ years',hi:'5+ साल'}]},
  {q_en:"How often do they train weekly?", q_hi:"वे हफ्ते में कितनी बार अभ्यास करते हैं?",
    opts:[{en:'Occasionally',hi:'कभी-कभी'},{en:'1–2 times',hi:'1–2 बार'},{en:'3–4 times',hi:'3–4 बार'},{en:'5+ times',hi:'5+ बार'}]},
  {q_en:"Highest level of competition played?", q_hi:"अब तक का सबसे ऊँचा प्रतियोगिता स्तर?",
    opts:[{en:'None yet',hi:'अभी कोई नहीं'},{en:'School',hi:'स्कूल'},{en:'District / State',hi:'जिला / राज्य'},{en:'National / Academy',hi:'राष्ट्रीय / अकादमी'}]},
  {q_en:"What outcome do you most hope for in 5 years?", q_hi:"5 साल में आप किस परिणाम की उम्मीद रखते हैं?",
    opts:[{en:'Pro career',hi:'पेशेवर करियर'},{en:'Academy + scholarship',hi:'अकादमी + छात्रवृत्ति'},{en:'Sport + academics',hi:'खेल + पढ़ाई'},{en:'Personal growth',hi:'व्यक्तिगत विकास'}]},
  {q_en:"How does the school view your child's football?", q_hi:"स्कूल आपके बच्चे के फुटबॉल को कैसे देखता है?",
    opts:[{en:'Fully supportive',hi:'पूरा समर्थन'},{en:'Allows it',hi:'अनुमति देता है'},{en:'Some tension',hi:'थोड़ा तनाव'},{en:'Discourages',hi:'हतोत्साहित'}]},
  {q_en:"Are you open to assessments beyond football?", q_hi:"क्या आप फुटबॉल से परे मूल्यांकन के लिए तैयार हैं?",
    opts:[{en:'Very open',hi:'बहुत खुले'},{en:'Open, cautious',hi:'खुले, सतर्क'},{en:'Only for football',hi:'सिर्फ़ फुटबॉल के लिए'},{en:'Not interested',hi:'दिलचस्पी नहीं'}]},
];
const ASSESS = [
  {en:'Scouting Report', hi:'स्काउटिंग रिपोर्ट', cat:'Football', done:true},
  {en:'Technical Skill', hi:'तकनीकी कौशल', cat:'Football', done:true},
  {en:'Psychometric', hi:'साइकोमेट्रिक', cat:'Mental', done:true},
  {en:'Sports Psychology', hi:'खेल मनोविज्ञान', cat:'Mental', done:false},
  {en:'Fitness & Conditioning', hi:'फिटनेस', cat:'Physical', done:true},
  {en:'Nutrition', hi:'पोषण', cat:'Physical', done:false},
  {en:'Academic Record', hi:'शैक्षणिक रिकॉर्ड', cat:'Academic', done:true},
  {en:'Aptitude Profile', hi:'योग्यता', cat:'Academic', done:false},
  {en:'Personality Mapping', hi:'व्यक्तित्व मैपिंग', cat:'Personality', done:true},
];
function bandColor(s){ return s>=80?'var(--brand)': s>=70?'var(--good)': s>=60?'var(--warn)':'var(--dim)'; }
let TF_IDX = 0, TF_ANS = {};

const PROFILES = {
  name_en:'Arjun Mahato', name_hi:'अर्जुन महतो',
  age:13, city_en:'Jamshedpur, Jharkhand', city_hi:'जमशेदपुर, झारखंड',
  parent_en:'Sunita Mahato', parent_hi:'सुनीता महतो',
  scores:[
    {en:'Football Ability', hi:'फुटबॉल क्षमता', s:78, band_en:'Strong', band_hi:'मजबूत'},
    {en:'Technical Strength', hi:'तकनीकी ताकत', s:72, band_en:'Strong', band_hi:'मजबूत'},
    {en:'Mental Strength', hi:'मानसिक ताकत', s:84, band_en:'Elite', band_hi:'श्रेष्ठ'},
    {en:'Academic Performance', hi:'शैक्षणिक प्रदर्शन', s:66, band_en:'Developing', band_hi:'विकासशील'},
    {en:'Personality Fit', hi:'व्यक्तित्व अनुकूलता', s:81, band_en:'Strong', band_hi:'मजबूत'},
  ],
  kpis:[{n:'A1', l_en:'Combo', l_hi:'संयुक्त'},{n:'Top 12%', l_en:'Rank', l_hi:'रैंक'},{n:'76', l_en:'Index', l_hi:'सूचकांक'},{n:'High', l_en:'Readiness', l_hi:'तत्परता'}],
  reco_en:'Recommend ISL academy trial within 6 months.',
  reco_hi:'6 महीने में ISL अकादमी ट्रायल की सिफारिश।',
  next:[
    {en:'Submit profile to FC Goa & Bengaluru FC scouts', hi:'FC गोवा और बेंगलुरु FC स्काउट्स को प्रोफ़ाइल भेजें'},
    {en:'Start Hindi+English academic bridge tutoring', hi:'हिंदी+अंग्रेज़ी शैक्षणिक ब्रिज ट्यूशन शुरू करें'},
    {en:'Reassess fitness profile in 6 months', hi:'6 महीने में फिटनेस प्रोफ़ाइल का पुनर्मूल्यांकन'},
  ],
  scholarships:[
    {t_en:'AIFF Elite Youth Scholarship', t_hi:'AIFF एलीट यूथ छात्रवृत्ति', a:'₹1,80,000/yr'},
    {t_en:'Reliance Foundation Young Champs', t_hi:'रिलायंस फ़ाउंडेशन यंग चैम्प्स', a:'Full-ride'},
    {t_en:'Khelo India Sports Scholarship', t_hi:'खेलो इंडिया खेल छात्रवृत्ति', a:'₹6,28,000/yr'},
  ],
  education:[
    {ic:'📚', t_en:'NIOS — Open Schooling', t_hi:'NIOS — मुक्त विद्यालय', d_en:'Flexible academic track.', d_hi:'लचीली शैक्षणिक धारा।'},
    {ic:'🎓', t_en:'OP Jindal Sports Quota', t_hi:'OP जिंदल खेल कोटा', d_en:'UG admission at age 18.', d_hi:'18 की उम्र में UG प्रवेश।'},
    {ic:'🌍', t_en:'FC Bayern Campus, Munich', t_hi:'FC बायर्न कैम्पस, म्यूनिख', d_en:'International placement track.', d_hi:'अंतर्राष्ट्रीय नियुक्ति।'},
  ],
  yearly:[{y:'13',s:62},{y:'13.5',s:66},{y:'14',s:71},{y:'14.5',s:74},{y:'15',s:76},{y:'15.5',s:79},{y:'16',s:82},{y:'17',s:85},{y:'18',s:88}],
};

function renderSteps(){
  const el = document.getElementById('steps');
  el.innerHTML = T.steps.map(s => '<button class="step '+ (s.id===STEP?'active':'') +'" data-id="'+s.id+'">'+tr(s.en,s.hi)+'</button>').join('');
  el.querySelectorAll('.step').forEach(b => b.onclick = ()=>{STEP=b.dataset.id; render();});
}

function pageSport(){
  return '<section class="card"><div class="kicker">'+tr('Entry point','प्रवेश बिंदु')+'</div><h1>'+tr('Choose your sport','अपना खेल चुनें')+'</h1><p class="muted" style="margin-top:8px;max-width:560px">'+tr('Football is live today. More sports unlock in 2026.','फुटबॉल आज सक्रिय है। अधिक खेल 2026 में।')+'</p><div class="sport-grid">'
    + SPORTS.map(s=>'<div class="sport '+(s.active?'active':'soon')+'" '+(s.active?'onclick="STEP=\'intake\';render()"':'')+'>'+(!s.active?'<span class="tag">'+tr('SOON','जल्द')+'</span>':'')+'<div class="ic">'+s.ic+'</div><div class="nm">'+tr(s.en,s.hi)+'</div></div>').join('')
    + '</div><div class="row" style="margin-top:28px"><button class="btn primary" onclick="STEP=\'intake\';render()">'+tr('Start with Football','फुटबॉल के साथ शुरू करें')+' →</button></div></section>';
}

function pageIntake(){
  const q = QS[TF_IDX];
  const pct = ((TF_IDX)/QS.length)*100;
  const done = TF_IDX >= QS.length;
  if(done){
    return '<section class="card tf"><div class="tf-num">'+tr('STAGE 1 COMPLETE','चरण 1 पूर्ण')+'</div><h1 style="max-width:600px">'+tr('Beautiful. We have what we need to begin.','बहुत अच्छा। शुरुआत के लिए हमें जो चाहिए था, मिल गया।')+'</h1><p class="muted" style="margin:18px 0 28px;max-width:520px">'+tr('Your readiness band: ','तत्परता स्तर: ')+'<span class="chip brand">'+tr('HIGH','उच्च')+'</span></p><div class="row"><button class="btn primary" onclick="STEP=\'inputs\';render()">'+tr('Continue to assessments','मूल्यांकन की ओर')+' →</button></div></section>';
  }
  let optsHtml = '';
  if(q.type !== 'text'){
    optsHtml = '<div class="tf-opts">'+q.opts.map((o,i)=>'<button class="tf-opt '+(TF_ANS[TF_IDX]===i?'sel':'')+'" onclick="TF_ANS['+TF_IDX+']='+i+';render()"><span class="k">'+String.fromCharCode(65+i)+'</span>'+tr(o.en,o.hi)+'</button>').join('')+'</div>';
  } else {
    optsHtml = '<input id="tfin" placeholder="'+tr(q.placeholder_en,q.placeholder_hi)+'" style="max-width:420px;width:100%;padding:14px 18px;background:var(--surface-2);border:1px solid var(--border);border-radius:12px;color:var(--text);font-size:16px;font-family:inherit" />';
  }
  return '<section class="card tf"><div class="progress"><div style="width:'+pct+'%"></div></div><div class="tf-num">'+tr('QUESTION','प्रश्न')+' '+(TF_IDX+1)+' / '+QS.length+'</div><h1 class="tf-q">'+tr(q.q_en,q.q_hi)+'</h1>'+optsHtml+'<div class="tf-nav">'
    +(TF_IDX>0?'<button class="btn ghost" onclick="TF_IDX--;render()">← '+tr('Back','पीछे')+'</button>':'')
    +'<button class="btn primary" onclick="(function(){var inp=document.getElementById(\'tfin\'); if(inp) TF_ANS['+TF_IDX+']=inp.value; TF_IDX++; render();})()">'+tr('OK','ठीक है')+' →</button></div></section>';
}

function pageInputs(){
  return '<section class="card"><div class="kicker">'+tr('Stage 2 · Assessments','चरण 2 · मूल्यांकन')+'</div><h1>'+tr('Upload evidence across 5 dimensions','5 आयामों में प्रमाण अपलोड करें')+'</h1><p class="muted" style="margin-top:8px;max-width:620px">'+tr('A trained IKF advisor reviews each report. Results appear in the dashboard within 48 hours.','एक प्रशिक्षित IKF सलाहकार प्रत्येक रिपोर्ट की समीक्षा करता है। परिणाम 48 घंटे में डैशबोर्ड पर।')+'</p><div class="upload-grid">'
    + ASSESS.map(a=>'<div class="upload"><div class="upload-h"><div><div class="upload-t">'+tr(a.en,a.hi)+'</div><div class="muted" style="font-size:11px;text-transform:uppercase;letter-spacing:.12em;margin-top:3px">'+a.cat+'</div></div>'+(a.done?'<span class="badge-ok">✓ '+tr('VERIFIED','सत्यापित')+'</span>':'<span class="badge-pend">'+tr('PENDING','लंबित')+'</span>')+'</div><div class="upload-f '+(a.done?'done':'')+'">'+(a.done?'📄 '+tr('report-uploaded.pdf','रिपोर्ट-अपलोडेड.pdf'):'⬆ '+tr('Click to upload','अपलोड करें'))+'</div></div>').join('')
    + '</div><div class="row" style="margin-top:28px"><button class="btn primary" onclick="STEP=\'parent\';render()">'+tr('See parent dashboard','अभिभावक डैशबोर्ड देखें')+' →</button></div></section>';
}

function scoresBlock(){
  return '<div class="card"><div class="kicker">'+tr('Five-dimension scorecard','पांच-आयाम स्कोरकार्ड')+'</div><h2 style="font-size:20px;margin-bottom:18px">'+tr(PROFILES.name_en,PROFILES.name_hi)+' · '+tr('Age','उम्र')+' '+PROFILES.age+'</h2>'
    + PROFILES.scores.map(s=>'<div class="score-row"><div class="lbl">'+tr(s.en,s.hi)+'</div><div class="bar"><div style="width:'+s.s+'%;background:'+bandColor(s.s)+'"></div></div><div class="val">'+s.s+'</div></div>').join('')
    + '<hr/><div class="kpi-grid">'+PROFILES.kpis.map(k=>'<div class="kpi"><div class="n">'+k.n+'</div><div class="l">'+tr(k.l_en,k.l_hi)+'</div></div>').join('')+'</div></div>';
}

function recoBlock(){
  return '<div class="card reco"><div class="kicker" style="color:var(--brand)">✦ '+tr('Pathway recommendation','मार्ग सिफारिश')+'</div><h2 style="font-size:20px;line-height:1.3">'+tr(PROFILES.reco_en,PROFILES.reco_hi)+'</h2><div style="margin-top:18px"><div class="kicker">'+tr('Next steps','अगले कदम')+'</div>'
    + PROFILES.next.map((n,i)=>'<div class="next-step"><div class="nm">'+(i+1)+'</div><div>'+tr(n.en,n.hi)+'</div></div>').join('')
    + '</div></div>';
}

function dashTabs(active){
  const tabs = [{id:'parent', en:'Parent', hi:'अभिभावक'},{id:'student', en:'Student', hi:'खिलाड़ी'},{id:'coach', en:'Coach ↔ Parent', hi:'कोच ↔ अभिभावक'}];
  return '<div class="tabs">'+tabs.map(t=>'<button class="tab '+(t.id===active?'on':'')+'" onclick="STEP=\''+t.id+'\';render()">'+tr(t.en,t.hi)+'</button>').join('')+'</div>';
}

function pageParent(){
  return dashTabs('parent')+'<div class="dash-grid"><div class="stack">'+scoresBlock()+recoBlock()+'<div class="card"><div class="kicker">'+tr('Scholarships you qualify for','छात्रवृत्तियाँ जिनके लिए आप पात्र हैं')+'</div>'
    + PROFILES.scholarships.map(s=>'<div class="scholar"><div class="t">'+tr(s.t_en,s.t_hi)+' <span class="a">· '+s.a+'</span></div></div>').join('')
    + '</div></div><div class="stack"><div class="card"><div class="kicker">'+tr('Your IKF advisor','आपके IKF सलाहकार')+'</div><div class="row" style="margin-top:10px"><div style="width:48px;height:48px;border-radius:50%;background:var(--brand);color:#0B1220;display:flex;align-items:center;justify-content:center;font-weight:700">RV</div><div><div style="font-weight:700">Rahul Verma</div><div class="muted" style="font-size:12px">'+tr('Senior Pathway Advisor','वरिष्ठ मार्ग सलाहकार')+'</div></div></div><button class="btn primary" style="width:100%;margin-top:14px">💬 '+tr('Message Rahul','राहुल को संदेश')+'</button></div><div class="card"><div class="kicker">'+tr('Education pathway','शैक्षणिक मार्ग')+'</div>'
    + PROFILES.education.map(e=>'<div class="ed-card"><div class="ic">'+e.ic+'</div><div><div style="font-weight:700;font-size:14px">'+tr(e.t_en,e.t_hi)+'</div><div class="muted" style="font-size:12px;margin-top:4px">'+tr(e.d_en,e.d_hi)+'</div></div></div>').join('')
    + '</div></div></div>';
}

function pageStudent(){
  return dashTabs('student')+'<div class="dash-grid"><div class="stack"><div class="card"><div class="kicker">'+tr('Your week','आपका सप्ताह')+'</div><h2 style="font-size:22px">'+tr('You leveled up. Mental strength is now Elite.','आप आगे बढ़े। मानसिक ताकत अब श्रेष्ठ।')+'</h2><div class="kpi-grid" style="margin-top:18px">'
    + [{n:'4 / 5', l_en:'Trainings done', l_hi:'प्रशिक्षण पूर्ण'},{n:'+6', l_en:'Index gain', l_hi:'सूचकांक वृद्धि'},{n:'12', l_en:'Streak days', l_hi:'लगातार दिन'},{n:'3', l_en:'New badges', l_hi:'नए बैज'}].map(k=>'<div class="kpi"><div class="n">'+k.n+'</div><div class="l">'+tr(k.l_en,k.l_hi)+'</div></div>').join('')
    + '</div></div>'+scoresBlock()+'<div class="card"><div class="kicker">'+tr('This week\u2019s targets','इस सप्ताह के लक्ष्य')+'</div>'
    + [{en:'Complete 2 finishing drills (30 mins each)', hi:'2 फिनिशिंग ड्रिल पूरे करें (30 मिनट प्रत्येक)'},{en:'Log nutrition daily', hi:'पोषण रोज़ दर्ज करें'},{en:'Submit weekly reflection to coach', hi:'कोच को साप्ताहिक चिंतन भेजें'}].map((n,i)=>'<div class="next-step"><div class="nm">'+(i+1)+'</div><div>'+tr(n.en,n.hi)+'</div></div>').join('')
    + '</div></div><div class="stack"><div class="card"><div class="kicker">'+tr('Badges earned','अर्जित बैज')+'</div><div class="row" style="gap:8px;margin-top:8px">'
    + ['🏆 Top Finisher','🧠 Mental Elite','⚡ Sprint King','🎯 Accuracy 90%','📚 Academic Strong'].map(b=>'<span class="chip">'+b+'</span>').join('')
    + '</div></div><div class="card"><div class="kicker">'+tr('Cohort rank','समूह रैंक')+'</div><div style="font-family:Space Grotesk;font-size:48px;font-weight:700;color:var(--brand);line-height:1">12<span style="font-size:24px">%</span></div><div class="muted" style="font-size:13px;margin-top:4px">'+tr('of 13-year-old boys, Eastern India','13 वर्षीय लड़कों में, पूर्वी भारत')+'</div></div><div class="card"><div class="kicker">'+tr('Next milestone','अगला मील का पत्थर')+'</div><div style="font-weight:700;font-size:16px">'+tr('FC Goa U-14 Trial','FC गोवा U-14 ट्रायल')+'</div><div class="muted" style="font-size:13px;margin-top:4px">'+tr('In 47 days · Bengaluru','47 दिन में · बेंगलुरु')+'</div></div></div></div>';
}

function pageCoach(){
  return dashTabs('coach')+'<div class="dash-grid"><div class="stack"><div class="card"><div class="kicker">'+tr('Coach view of student','खिलाड़ी का कोच दृश्य')+'</div><h2 style="font-size:20px">'+tr('What coach Rahul has logged this month','कोच राहुल ने इस माह क्या दर्ज किया')+'</h2><div style="margin-top:18px" class="stack">'
    + [{d:'18 May', en:'Outstanding session — first-touch dramatically improved.', hi:'उत्कृष्ट सत्र — फ़र्स्ट-टच में नाटकीय सुधार।'},{d:'11 May', en:'Tactical: needs work on weak-foot crossing.', hi:'रणनीति: कमज़ोर पैर क्रॉसिंग पर काम चाहिए।'},{d:'04 May', en:'Mental: handled pressure in district final beautifully.', hi:'मानसिक: ज़िला फाइनल में दबाव को शानदार ढंग से संभाला।'}].map(n=>'<div style="border-left:3px solid var(--brand);padding:6px 12px"><div class="muted" style="font-size:11px;letter-spacing:.1em">'+n.d.toUpperCase()+'</div><div style="font-size:14px;margin-top:3px">'+tr(n.en,n.hi)+'</div></div>').join('')
    + '</div></div><div class="card"><div class="kicker">'+tr('Coach → Parent communication','कोच → अभिभावक संवाद')+'</div><h2 style="font-size:20px">'+tr('Summary shared with Sunita this week','इस सप्ताह सुनीता के साथ साझा सारांश')+'</h2><p class="muted" style="margin-top:12px;line-height:1.6">'+tr('Arjun is performing in the top 12% of his cohort. We recommend introducing one weekly fitness session focused on hamstring strength, and ensuring 8 hours of sleep on training nights. Academic support is keeping pace — continue with the current tutor.','अर्जुन अपने समूह के शीर्ष 12% में प्रदर्शन कर रहा है। हम साप्ताहिक हैमस्ट्रिंग फ़िटनेस सत्र शुरू करने की सिफारिश करते हैं और प्रशिक्षण रातों में 8 घंटे की नींद सुनिश्चित करें। शैक्षणिक सहायता गति से चल रही है — मौजूदा ट्यूटर जारी रखें।')+'</p><div class="row" style="margin-top:20px"><button class="btn primary">📞 '+tr('Schedule call','कॉल शेड्यूल करें')+'</button><button class="btn ghost">📄 '+tr('Download report','रिपोर्ट डाउनलोड')+'</button></div></div></div><div class="stack"><div class="card"><div class="kicker">'+tr('Recent assessments','हाल के मूल्यांकन')+'</div>'
    + ASSESS.filter(a=>a.done).slice(0,4).map(a=>'<div class="row" style="justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><div style="font-size:13px">'+tr(a.en,a.hi)+'</div><span class="badge-ok">✓</span></div>').join('')
    + '</div><div class="card"><div class="kicker">'+tr('Parent sentiment','अभिभावक भावना')+'</div><div class="row" style="gap:8px;margin-top:8px"><span class="chip brand">'+tr('Aligned','संरेखित')+'</span><span class="chip">'+tr('Informed','सूचित')+'</span><span class="chip">'+tr('Engaged','सक्रिय')+'</span></div><p class="muted" style="font-size:13px;margin-top:14px;line-height:1.6">'+tr('Sunita responds within 24 hours and attends 92% of scheduled calls.','सुनीता 24 घंटे में जवाब देती हैं और 92% कॉल में उपस्थित रहती हैं।')+'</p></div></div></div>';
}

function pageNextGen(){
  const max = Math.max(...PROFILES.yearly.map(y=>y.s));
  return '<section class="card"><div class="kicker">'+tr('NextGen Profile · longitudinal tracking','नेक्स्टजेन प्रोफ़ाइल · दीर्घकालिक ट्रैकिंग')+'</div><h1>'+tr('Arjun, from 13 to 18','अर्जुन, 13 से 18 तक')+'</h1><p class="muted" style="margin-top:8px;max-width:640px">'+tr('Every reassessment, every match, every milestone — captured. This profile travels with Arjun for life.','हर पुनर्मूल्यांकन, हर मैच, हर मील का पत्थर — दर्ज। यह प्रोफ़ाइल जीवन भर अर्जुन के साथ रहती है।')+'</p><div class="timeline-chart"><div class="kicker" style="margin-bottom:0">'+tr('Overall Index over time','समय के साथ समग्र सूचकांक')+'</div><div class="tl-bars">'
    + PROFILES.yearly.map(y=>'<div class="tl-bar" style="height:'+((y.s/max)*100)+'%"><div class="sc">'+y.s+'</div><div class="yr">'+y.y+'</div></div>').join('')
    + '</div></div><div class="dash-grid" style="margin-top:28px"><div class="stack"><div class="card"><div class="kicker">'+tr('Recommendations by age','उम्र के अनुसार सिफारिशें')+'</div>'
    + [{age:'13', en:'Local academy + structured weekly assessments', hi:'स्थानीय अकादमी + संरचित साप्ताहिक मूल्यांकन'},{age:'14', en:'Apply to AIFF Elite Youth Programme', hi:'AIFF एलीट यूथ कार्यक्रम के लिए आवेदन'},{age:'15', en:'Residential academy + NIOS academic track', hi:'आवासीय अकादमी + NIOS शैक्षणिक धारा'},{age:'16', en:'I-League youth contract trials', hi:'I-लीग यूथ कॉन्ट्रैक्ट ट्रायल'},{age:'17', en:'ISL reserve squad pathway / EU scouting window', hi:'ISL रिज़र्व पथ / EU स्काउटिंग विंडो'},{age:'18', en:'Senior contract or university sports quota', hi:'सीनियर कॉन्ट्रैक्ट या विश्वविद्यालय खेल कोटा'}].map(r=>'<div class="row" style="padding:12px 0;border-bottom:1px solid var(--border);align-items:start"><span class="chip brand" style="min-width:42px;justify-content:center">'+r.age+'</span><div style="font-size:14px;flex:1">'+tr(r.en,r.hi)+'</div></div>').join('')
    + '</div><div class="card"><div class="kicker">'+tr('Education trajectory','शैक्षणिक प्रक्षेपवक्र')+'</div>'
    + PROFILES.education.map(e=>'<div class="ed-card"><div class="ic">'+e.ic+'</div><div><div style="font-weight:700;font-size:14px">'+tr(e.t_en,e.t_hi)+'</div><div class="muted" style="font-size:12px;margin-top:4px">'+tr(e.d_en,e.d_hi)+'</div></div></div>').join('')
    + '</div></div><div class="stack"><div class="card reco"><div class="kicker" style="color:var(--brand)">✦ '+tr('Scholarships unlocked','अनलॉक छात्रवृत्तियाँ')+'</div>'
    + PROFILES.scholarships.map(s=>'<div class="scholar"><div class="t">'+tr(s.t_en,s.t_hi)+'</div><div class="a">'+s.a+'</div></div>').join('')
    + '</div><div class="card"><div class="kicker">'+tr('Lifetime KPIs','आजीवन KPI')+'</div><div class="kpi-grid"><div class="kpi"><div class="n">247</div><div class="l">'+tr('Sessions logged','सत्र दर्ज')+'</div></div><div class="kpi"><div class="n">38</div><div class="l">'+tr('Matches','मैच')+'</div></div><div class="kpi"><div class="n">12</div><div class="l">'+tr('Assessments','मूल्यांकन')+'</div></div><div class="kpi"><div class="n">6</div><div class="l">'+tr('Cycles','चक्र')+'</div></div></div></div><div class="card"><div class="kicker">'+tr('Long-term outcome confidence','दीर्घकालिक परिणाम विश्वास')+'</div><div style="font-family:Space Grotesk;font-size:44px;font-weight:700;color:var(--brand);line-height:1">82<span style="font-size:22px">%</span></div><p class="muted" style="font-size:13px;margin-top:8px;line-height:1.6">'+tr('Likelihood of sustainable career inside or adjacent to professional football, based on current trajectory.','मौजूदा प्रक्षेपवक्र के आधार पर पेशेवर फुटबॉल के भीतर या निकट टिकाऊ करियर की संभावना।')+'</p></div></div></div></section>';
}

const PAGES = {
  sport: pageSport, intake: pageIntake, inputs: pageInputs,
  parent: pageParent, student: pageStudent, coach: pageCoach, nextgen: pageNextGen,
};

function render(){
  document.body.classList.toggle('hi', LANG==='hi');
  document.getElementById('en').classList.toggle('on', LANG==='en');
  document.getElementById('hi').classList.toggle('on', LANG==='hi');
  renderSteps();
  document.getElementById('page').innerHTML = (PAGES[STEP] || pageParent)();
  window.scrollTo({top:0,behavior:'smooth'});
}
document.getElementById('en').onclick = ()=>{LANG='en';render();};
document.getElementById('hi').onclick = ()=>{LANG='hi';render();};
render();`,
    });
    const form = document.createElement("form");
    form.action = "https://codepen.io/pen/define/";
    form.method = "POST";
    form.target = "_blank";
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "data";
    input.value = data;
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    form.remove();
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#EAF0F7] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-[#141C2E] border border-[#243049] rounded-2xl p-10 text-center space-y-6">
        <div className="w-12 h-12 rounded-full bg-[#DFFF5E] text-[#0B1220] font-bold text-xl flex items-center justify-center mx-auto" style={{ boxShadow: "0 0 20px rgba(223,255,94,.3)" }}>
          ⚡
        </div>
        <h1 className="text-2xl font-bold">Export to CodePen</h1>
        <p className="text-[#8A96AC] text-sm leading-relaxed">
          One click opens CodePen with all mockup code pre-filled across HTML, CSS and JS panels.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={openCodePen}
            className="inline-flex items-center gap-2 bg-[#DFFF5E] text-[#0B1220] font-bold px-6 py-3 rounded-xl hover:-translate-y-px transition-transform text-sm cursor-pointer"
          >
            Open in CodePen →
          </button>
          <button
            onClick={downloadHtml}
            className="inline-flex items-center gap-2 bg-transparent text-[#EAF0F7] font-bold px-6 py-3 rounded-xl border border-[#243049] hover:border-[#DFFF5E] hover:-translate-y-px transition-all text-sm cursor-pointer"
          >
            ⬇ Download as HTML
          </button>
        </div>
        <p className="text-[#8A96AC] text-xs">
          Opens a new tab. CodePen auto-populates all three panels.
        </p>
        <div className="pt-4 border-t border-[#243049]">
          <Link to="/ikf360" className="text-[#8A96AC] text-xs hover:text-[#DFFF5E] transition-colors">
            ← Back to IKF 360
          </Link>
        </div>
      </div>
    </div>
  );
}

function downloadHtml() {
  fetch("/ikf360-mockup.html")
    .then((r) => r.text())
    .then((text) => {
      const blob = new Blob([text], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ikf360-mockup.html";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
}
