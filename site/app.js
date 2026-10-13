/* The artifact host supplies <head>; guarantee a mobile viewport either way. */
(function(){
  /* Screen readers need a language. The artifact host owns <html>, so set it here. */
  if (!document.documentElement.lang) document.documentElement.lang = "en";
  var m = document.querySelector('meta[name="viewport"]');
  if (!m){
    m = document.createElement("meta");
    m.setAttribute("name","viewport");
    document.head.appendChild(m);
  }
  m.setAttribute("content","width=device-width, initial-scale=1, viewport-fit=cover");
})();

/* ================= palette mapping ================= */
const CAT_HUE = {
  "Alkali metal":"--c-alkali", "Alkaline earth metal":"--c-alkaline",
  "Transition metal":"--c-transition", "Post-transition metal":"--c-post",
  "Metalloid":"--c-metalloid", "Reactive nonmetal":"--c-nonmetal",
  "Halogen":"--c-halogen", "Noble gas":"--c-noble",
  "Lanthanide":"--c-lanth", "Actinide":"--c-act"
};
const RAD_HUE = {"气":"--c-nonmetal","钅":"--c-transition","石":"--c-post","氵":"--c-alkali","水":"--c-alkali","金":"--c-transition"};
const STATE_HUE = {solid:"--c-transition", liquid:"--c-alkali", gas:"--c-nonmetal"};

const stripTone = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const stateOf = e => e.state.split(" ")[0];
function hueVar(e, mode){
  if (mode === "rad")   return RAD_HUE[e.rad] || "--c-unknown";
  if (mode === "state") return STATE_HUE[stateOf(e)] || "--c-unknown";
  for (const k in CAT_HUE) if (e.cat.startsWith(k)) return CAT_HUE[k];
  return "--c-unknown";
}
const hue = (e,m) => `var(${hueVar(e,m)})`;

const LEGENDS = {
  cat: Object.keys(CAT_HUE).map(k => [k, CAT_HUE[k]]).concat([["Unknown","--c-unknown"]]),
  rad: [["气 gas","--c-nonmetal"],["钅 metal","--c-transition"],["石 solid nonmetal","--c-post"],["氵/水 liquid — only 2!","--c-alkali"]],
  state:[["Solid","--c-transition"],["Liquid — only 2!","--c-alkali"],["Gas","--c-nonmetal"]]
};


/* ================= glyph support =================
   The characters for elements 104-118 were added to Unicode recently and some
   devices genuinely cannot draw them. Rather than assume, ask the device:
   paint the glyph and compare it to a codepoint that is guaranteed absent.
   Identical pixels means we got a tofu box, so we show pinyin instead. */
const ZH_STACK = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC","Source Han Sans SC",sans-serif';
const noGlyph = new Set();
function detectGlyphs(){
  try{
    const cv = document.createElement("canvas"); cv.width = cv.height = 40;
    const g = cv.getContext("2d", { willReadFrequently: true });
    g.font = "28px " + ZH_STACK; g.textBaseline = "top";
    const shot = ch => { g.clearRect(0,0,40,40); g.fillText(ch,2,2); return g.getImageData(0,0,40,40).data; };
    const ref = shot("￾");                       // guaranteed absent
    for (const e of ELEMENTS){
      if (!e.rare) continue;
      const a = shot(e.zh);
      let diff = 0, ink = 0;
      for (let i = 3; i < a.length; i += 4){ if (a[i] !== ref[i]) diff++; if (a[i] > 0) ink++; }
      if (!(diff > 4 && ink > 4)) noGlyph.add(e.z);
    }
  } catch(err){ /* canvas unavailable: trust the character */ }
}
/* what to print in a tight space */
const zhOf = e => noGlyph.has(e.z) ? stripTone(e.py) : e.zh;
const zhLang = e => noGlyph.has(e.z) ? 'lang="en"' : 'lang="zh-Hans"';

/* ================= state ================= */
let mode = "cat", view = "table", query = "";
const $ = s => document.querySelector(s);
const cellOf = z => document.querySelector(`[data-z="${z}"]`);

/* ================= render ================= */
function matches(e){
  if (!query) return true;
  /* Pinyin is stored with tone marks (tie3 -> "tie" + caron). Nobody types those,
     so compare with tones stripped from BOTH sides. */
  const q  = stripTone(query.toLowerCase().trim());
  if (!q) return true;
  const py = stripTone(e.py.toLowerCase());
  return e.name.toLowerCase().includes(q) || e.sym.toLowerCase() === q ||
         e.sym.toLowerCase().startsWith(q) || String(e.z) === q ||
         e.zh.includes(query.trim()) || py.includes(q) ||
         e.cat.toLowerCase().includes(q);
}

function gridPos(e){
  if (e.z >= 57 && e.z <= 71)  return [9,  3 + (e.z - 57)];
  if (e.z >= 89 && e.z <= 103) return [10, 3 + (e.z - 89)];
  return [e.p, e.g];
}

function renderTable(){
  const t = $("#ptable"); t.innerHTML = "";
  const sp = document.createElement("div"); sp.className = "spacer"; sp.style.gridRow = 8;
  t.appendChild(sp);
  for (const lbl of [["La–Lu",9],["Ac–Lr",10]]){
    const n = document.createElement("div");
    n.className = "fnote"; n.style.gridRow = lbl[1]; n.textContent = lbl[0];
    t.appendChild(n);
  }
  for (const e of ELEMENTS){
    const [r,c] = gridPos(e);
    const b = document.createElement("button");
    b.className = "cell" + (matches(e) ? "" : " dim");
    b.dataset.z = e.z;
    b.style.cssText = `grid-row:${r};grid-column:${c};--hue:${hue(e,mode)}`;
    b.setAttribute("aria-label", `${e.z} ${e.name} ${e.zh}`);
    b.innerHTML = `<span class="z">${e.z}</span><span class="sym">${e.sym}</span>` +
                  `<span class="zh" ${zhLang(e)}>${zhOf(e)}</span>`;
    b.onclick = () => openSheet(e.z);
    t.appendChild(b);
  }
}

function renderList(){
  const l = $("#list"); l.innerHTML = "";
  const hits = ELEMENTS.filter(matches);
  if (!hits.length){ l.innerHTML = `<p class="empty">Nothing matches “${query}”. Try an element name, symbol, number, or Chinese character.</p>`; return; }
  for (const e of hits){
    const b = document.createElement("button");
    b.className = "row"; b.style.cssText = `--hue:${hue(e,mode)}`;
    b.innerHTML =
      `<span class="rz">${e.z}</span><span class="sym">${e.sym}</span>` +
      `<span class="nm"><b>${e.name}</b><span>${e.cat} · ${e.state}</span></span>` +
      `<span class="rzh" ${zhLang(e)}>${zhOf(e)}</span>`;
    b.onclick = () => openSheet(e.z);
    l.appendChild(b);
  }
}

function renderLegend(){
  const g = $("#legend"); g.innerHTML = "";
  for (const [label, v] of LEGENDS[mode]){
    const s = document.createElement("span");
    s.className = "lg"; s.style.cssText = `--hue:var(${v})`;
    s.innerHTML = `<i></i>${label.replace(/^([气钅石氵\/水]+)/,'<span class="zh">$1</span>')}`;
    g.appendChild(s);
  }
}

function syncChips(){
  document.querySelectorAll("[data-view]").forEach(b => b.setAttribute("aria-pressed", b.dataset.view === view));
  document.querySelectorAll("[data-mode]").forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === mode));
}

function render(){
  syncChips();
  $("#tablewrap").hidden = view !== "table";
  $("#list").hidden      = view !== "list";
  $("#quiz").hidden      = view !== "quiz";
  $("#legend").hidden    = view === "quiz";
  $("#hint").hidden      = view !== "table";
  if (view === "table") renderTable();
  else if (view === "list") renderList();
  else renderQuiz();
  renderLegend();
  const n = ELEMENTS.filter(matches).length;
  $("#count").textContent = query ? `${n} of 118` : "118 elements";
}


/* ================= chemical formulas =================
   H2O -> H<sub>2</sub>O. Digits subscript ONLY after a letter, ")" or "]",
   which is what keeps hydrate coefficients (CuSO4-5H2O) and isotope numbers
   (Cf-252) full size, exactly as chemists write them. */
function fmtFormula(f){
  let s = String(f).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  s = s.replace(/([A-Za-z\)\]])(\d+)/g, (m,a,d) => a + "<sub>" + d + "</sub>");
  s = s.replace(/\^(\d*[+−-])/g, (m,g) => "<sup>" + g + "</sup>");
  s = s.replace(/\)n(?![A-Za-z])/g, ")<sub>n</sub>");
  s = s.replace(/([+−])$/, (m,g) => "<sup>" + g + "</sup>");
  return s;
}

/* ================= detail sheet ================= */
const fmtCharge = c => (c > 0 ? "+" : "") + c;
function fmtPpm(v){
  if (v === 0) return "synthetic";
  if (v >= 1000) return (v/10000).toFixed(1) + "%";
  if (v >= 1) return v + " ppm";
  if (v >= 0.001) return v + " ppm";
  return "trace";
}

function openSheet(z, fromHash){
  const e = ELEMENTS[z-1];
  if (!fromHash) history.replaceState(null, "", hashFor(z));
  const h = hue(e, mode);
  $("#sheet").style.setProperty("--hue", h);

  const charges = e.ch.common.length ? e.ch.common.map(fmtCharge).join(", ") : "none known";
  const disc = e.disc.year ? `${e.disc.year}` : "ancient";

  let cmp = "";
  if (e.cmp.length){
    cmp = `<h3 class="sec">Common compounds · ${e.cmp.length}</h3><div class="cwrap"><table class="ctable">
      <thead><tr><th>Formula</th><th>Name</th><th>中文</th><th>What it is</th></tr></thead><tbody>` +
      e.cmp.map(c => `<tr><td class="f">${fmtFormula(c[0])}</td><td class="n">${c[1]}</td>
        <td class="z" lang="zh-Hans">${c[2] || ""}</td><td class="a">${c[3]}</td></tr>`).join("") +
      `</tbody></table></div>`;
  }
  let note = e.note ? `<p class="note"><b>Why so few compounds?</b> ${e.note}</p>` : "";
  if (e.ex.length){
    note += `<div class="cwrap"><table class="ctable"><tbody>` +
      e.ex.map(c => `<tr><td class="f">${fmtFormula(c[0])}</td><td class="n">${c[1]}</td><td class="a">${c[2]}</td></tr>`).join("") +
      `</tbody></table></div>`;
  }

  $("#sheet-in").innerHTML = `
    <div class="dhead">
      <div class="dsym"><b>${e.sym}</b><span>${e.mass}</span></div>
      <div class="dtitle">
        <h2>${e.name}</h2>
        <div class="dzh"><b lang="zh-Hans">${e.zh}</b><i>${e.py}</i></div>
        <div class="dcat">${e.cat}</div>
      </div>
    </div>
    ${e.zhNote ? `<div class="radbadge zhbuild"><b>${e.zh}</b><span>${e.zhNote}</span></div>` : ""}
    <div class="radbadge"><b>${e.rad}</b><span>The <b style="font-size:15px">${e.rad}</b> radical means <b style="font-size:inherit;font-family:inherit">${e.radM}</b> — you can read this element's type straight from its Chinese character.</span></div>
    <dl class="stats">
      <div class="st"><dt>Atomic number</dt><dd>${e.z}</dd></div>
      <div class="st"><dt>Atomic mass</dt><dd>${e.mass}</dd></div>
      <div class="st"><dt>Charges</dt><dd>${charges}</dd></div>
      <div class="st"><dt>At room temp</dt><dd class="txt">${e.state}</dd></div>
      <div class="st"><dt>In the crust</dt><dd>${fmtPpm(e.ppm)}</dd></div>
      <div class="st"><dt>Discovered</dt><dd>${disc}</dd></div>
    </dl>
    <p class="prose">${e.desc}</p>
    <h3 class="sec">Name story</h3>
    <p class="note" style="border-left-color:var(--hue)">${e.means}. <b>Found by:</b> ${e.disc.by}.</p>
    <h3 class="sec">Five things worth knowing</h3>
    <ol class="facts">${e.facts.map(f => `<li>${f}</li>`).join("")}</ol>
    ${cmp}${note}`;

  $("#sheet-mini").innerHTML =
    `<b>${e.sym}</b>${e.name}<span lang="zh-Hans">${e.zh}</span>`;

  const sh = $("#sheet");
  sh.classList.remove("scrolled");
  sh.style.transform = ""; sh.style.transition = "";
  sh.classList.add("open");
  $("#scrim").classList.add("open");
  document.documentElement.classList.add("sheet-lock");
  sh.scrollTop = 0;
  $("#close").focus({ preventScroll: true });
}
function closeSheet(){
  const sh = $("#sheet");
  sh.style.transform = ""; sh.style.transition = "";
  sh.classList.remove("open");
  $("#scrim").classList.remove("open");
  document.documentElement.classList.remove("sheet-lock");
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
}

/* The mini title in the pinned bar appears once the big header scrolls away. */
function onSheetScroll(){
  $("#sheet").classList.toggle("scrolled", $("#sheet").scrollTop > 70);
}

/* Swipe the bar down to dismiss - the grab handle promised this and did nothing.
   Phones only: on wide screens the sheet is a centered dialog, not a bottom sheet. */
function wireSheetDrag(){
  const bar = $("#sheet-bar"), sh = $("#sheet");
  const phone = matchMedia("(max-width:759px)");
  let startY = null, dy = 0;
  bar.addEventListener("touchstart", ev => {
    if (!phone.matches || ev.target.closest(".close")) return;
    startY = ev.touches[0].clientY; dy = 0;
    sh.style.transition = "none";
  }, { passive: true });
  bar.addEventListener("touchmove", ev => {
    if (startY === null) return;
    dy = Math.max(0, ev.touches[0].clientY - startY);
    sh.style.transform = `translateY(${dy}px)`;
  }, { passive: true });
  const end = () => {
    if (startY === null) return;
    startY = null;
    sh.style.transition = "";
    if (dy > 90) closeSheet();
    else sh.style.transform = "";
  };
  bar.addEventListener("touchend", end);
  bar.addEventListener("touchcancel", end);
}

/* ================= the song ================= */
/* Melody: patter contour in the style of Sullivan's "Major-General's Song"
   (Pirates of Penzance, 1879 — public domain). Synthesized, no audio files. */
const PHRASES = [
  [0,0,0,0, 0,2,4,4, 4,4,5,4, 2,0,2,0],
  [2,2,2,2, 2,4,5,5, 5,5,7,5, 4,2,4,2],
  [4,4,4,4, 4,5,7,7, 7,7,9,7, 5,4,2,0],
  [7,7,5,5, 4,4,2,2, 0,2,4,5, 4,2,-1,0]
];
const MELODY = PHRASES.flat();
const BASE = 261.63;                       // C4
const midi = st => BASE * Math.pow(2, st/12);

let ctx = null, playing = false, startAt = 0, rate = 1, timer = null, raf = null;
let events = [];                            // {t, dur, freq, z, first}

function buildSong(){
  events = []; let t = 0, s = 0;
  const EIGHTH = 0.1666;                    // ~180bpm patter
  for (const e of ELEMENTS){
    for (let i = 0; i < e.syl; i++){
      events.push({ t, dur: EIGHTH, freq: midi(MELODY[s % MELODY.length]), z: e.z, first: i === 0 });
      t += EIGHTH; s++;
    }
  }
  return t;
}
const SONG_LEN = buildSong();

function tone(when, freq, dur){
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(.22, when + .012);
  g.gain.exponentialRampToValueAtTime(.0001, when + dur * .95);
  g.connect(ctx.destination);
  const o1 = ctx.createOscillator(); o1.type = "triangle"; o1.frequency.value = freq;
  const o2 = ctx.createOscillator(); o2.type = "sine";     o2.frequency.value = freq * 2;
  const g2 = ctx.createGain(); g2.gain.value = .3; o2.connect(g2); g2.connect(g);
  o1.connect(g);
  o1.start(when); o2.start(when);
  o1.stop(when + dur); o2.stop(when + dur);
}
function bass(when, freq){
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(.16, when + .02);
  g.gain.exponentialRampToValueAtTime(.0001, when + .34);
  const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = freq/2;
  o.connect(g); g.connect(ctx.destination);
  o.start(when); o.stop(when + .36);
}

let scheduled = 0;
function scheduler(){
  const ahead = ctx.currentTime + .2;
  while (scheduled < events.length){
    const ev = events[scheduled];
    const when = startAt + ev.t / rate;
    if (when > ahead) break;
    tone(when, ev.freq, ev.dur / rate);
    if (ev.first && ev.z % 4 === 1) bass(when, ev.freq);
    scheduled++;
  }
  if (scheduled >= events.length && ctx.currentTime > startAt + SONG_LEN/rate) stop();
}

let lastZ = 0;
function frame(){
  if (!playing) return;
  const el = (ctx.currentTime - startAt) * rate;
  const pct = Math.min(1, el / SONG_LEN);
  $("#bar").style.width = (pct * 100) + "%";
  let ev = null;
  for (let i = events.length - 1; i >= 0; i--) if (events[i].t <= el){ ev = events[i]; break; }
  const z = ev ? ev.z : 0;
  if (z !== lastZ){
    const prev = cellOf(lastZ);
    if (prev){ prev.classList.remove("singing"); prev.classList.add("sung");
               setTimeout(() => prev.classList.remove("sung"), 700); }
    const cur = cellOf(z);
    if (cur){
      cur.classList.add("singing");
      const w = $("#tablewrap");
      if (view === "table" && w.scrollWidth > w.clientWidth){
        w.scrollTo({ left: cur.offsetLeft - w.clientWidth/2 + cur.offsetWidth/2, behavior:"smooth" });
      }
    }
    if (z) showLyric(z);
    lastZ = z;
  }
  raf = requestAnimationFrame(frame);
}

function showLyric(z){
  const i = z - 1, from = Math.max(0, i - 1);
  const line = ELEMENTS.slice(from, from + 4).map(e =>
    e.z === z ? `<em>${e.name}</em>` : e.name).join(", ");
  const e = ELEMENTS[i];
  $("#lyric").innerHTML = `${line} <span class="zh">${zhOf(e)}</span>`;
}

async function play(){
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") await ctx.resume();
  playing = true; scheduled = 0; lastZ = 0;
  startAt = ctx.currentTime + .12;
  $("#playicon").innerHTML = '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>';
  $("#play").setAttribute("aria-label","Pause the song");
  timer = setInterval(scheduler, 25);
  raf = requestAnimationFrame(frame);
}
function stop(){
  playing = false;
  clearInterval(timer); cancelAnimationFrame(raf);
  $("#playicon").innerHTML = '<path d="M8 5v14l11-7z"/>';
  $("#play").setAttribute("aria-label","Play the elements song");
  const c = cellOf(lastZ); if (c) c.classList.remove("singing");
  $("#bar").style.width = "0%";
  $("#lyric").innerHTML = 'All 118, in atomic order <span class="zh">从氢到鿫</span>';
}


/* ================= quiz ================= */
/* Elements a 8-13 year old plausibly meets. Questions draw from here so the
   quiz never asks "which element is darmstadtium?" */
const FAMILIAR = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,24,25,26,
  27,28,29,30,33,35,36,47,50,53,54,74,78,79,80,82,83,86,88,92,94];

let qScore = 0, qTotal = 0, qStreak = 0, qBest = 0, qCur = null, qLocked = false;

const pick = a => a[Math.floor(Math.random() * a.length)];
function sample(pool, n, exclude){
  const out = [], seen = new Set([exclude]);
  let guard = 0;
  while (out.length < n && guard++ < 400){
    const c = pick(pool);
    if (seen.has(c)) continue;
    seen.add(c); out.push(c);
  }
  return out;
}
/* distractors from the same family are harder and more instructive */
function peers(e, n){
  const same = ELEMENTS.filter(x => x.cat === e.cat && x.z !== e.z && FAMILIAR.includes(x.z));
  const pool = same.length >= n ? same : ELEMENTS.filter(x => x.z !== e.z && FAMILIAR.includes(x.z));
  return sample(pool, n, null);
}
function shuffle(a){
  for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; }
  return a;
}
function build(prompt, sub, correct, wrong, label, explain){
  const opts = shuffle([{t: label(correct), ok: true}].concat(wrong.map(w => ({t: label(w), ok: false}))));
  return {prompt, sub, opts, explain};
}

const QTYPES = [
  // symbol -> name
  e => build(`Which element has the symbol <b>${e.sym}</b>?`, "", e, peers(e,3),
             x => x.name, `<b>${e.sym}</b> is ${e.name} — ${e.zh} (${e.py}). ${e.means}.`),
  // name -> symbol
  e => build(`What is the chemical symbol for <b>${e.name}</b>?`, "", e, peers(e,3),
             x => x.sym, `${e.name} is <b>${e.sym}</b>. ${e.means}.`),
  // chinese -> name
  e => e.rare ? null : build(`Which element is <b class="qzh">${e.zh}</b>?`,
             `pinyin: ${e.py}`, e, peers(e,3), x => x.name,
             `<b class="qzh">${e.zh}</b> (${e.py}) is ${e.name}. The <b class="qzh">${e.rad}</b> radical means <b>${e.radM}</b>.`),
  // radical -> category
  e => {
    const map = {"气":"It is a gas","钅":"It is a metal","石":"It is a solid nonmetal","氵":"It is a liquid","水":"It is a liquid","金":"It is a metal"};
    const all = ["It is a gas","It is a metal","It is a solid nonmetal","It is a liquid"];
    const right = map[e.rad];
    if (!right) return null;
    const opts = shuffle([{t:right, ok:true}].concat(all.filter(x=>x!==right).map(x=>({t:x, ok:false}))));
    return {prompt:`${e.name} is written <b class="qzh">${e.zh}</b>. Its radical is <b class="qzh">${e.rad}</b>. What does that tell you?`,
            sub:"Chinese element names hide a clue about the element's type.",
            opts, explain:`<b class="qzh">${e.rad}</b> means <b>${e.radM}</b>, and ${e.name} is a ${e.state.split(" ")[0]} at room temperature.`};
  },
  // atomic number
  e => build(`Which element is number <b>${e.z}</b> on the periodic table?`,
             "", e, peers(e,3), x => x.name,
             `Number ${e.z} is ${e.name} — it has ${e.z} proton${e.z>1?"s":""} in its center.`),
  // compound -> element
  e => {
    if (!e.cmp.length) return null;
    const c = pick(e.cmp);
    /* the blurb often names the element outright - blank it out or the question answers itself */
    const hint = c[3].replace(new RegExp(e.name, "gi"), "this element");
    return build(`<b class="qf">${fmtFormula(c[0])}</b> ${c[2] ? '<span class="qzh">(' + c[2] + ')</span>' : ""} is a compound of which element?`,
                 hint, e, peers(e,3), x => x.name,
                 `<b class="qf">${fmtFormula(c[0])}</b> is ${c[1]}${c[2] ? " / " + c[2] : ""}, built on ${e.name}.`);
  },
  // fact -> element  (only facts that don't give the answer away)
  e => {
    const safe = e.facts.filter(f => !f.includes(e.zh));
    if (!safe.length) return null;
    const fact = pick(safe).replace(new RegExp(e.name, "gi"), "This element")
                           .replace(new RegExp("\\b" + e.sym + "\\b", "g"), "it");
    return build(`Which element is this?`, "“" + fact + "”", e, peers(e,3),
                 x => x.name, `That was ${e.name} — ${e.zh} (${e.py}).`);
  }
];

function nextQuestion(){
  qLocked = false;
  for (let i = 0; i < 60; i++){
    const e = ELEMENTS[pick(FAMILIAR) - 1];
    const q = pick(QTYPES)(e);
    if (q && q.opts.length === 4){ qCur = q; qCur.el = e; break; }
  }
  renderQuiz();
}

function answer(i, btn){
  if (qLocked) return;
  qLocked = true;
  qTotal++;
  const ok = qCur.opts[i].ok;
  if (ok){ qScore++; qStreak++; qBest = Math.max(qBest, qStreak); } else { qStreak = 0; }
  document.querySelectorAll(".opt").forEach((b, j) => {
    b.disabled = true;
    if (qCur.opts[j].ok) b.classList.add("right");
    else if (j === i) b.classList.add("wrong");
  });
  const fb = $("#qfeed");
  fb.className = "qfeed " + (ok ? "good" : "bad");
  fb.innerHTML = `<b>${ok ? "Correct!" : "Not quite."}</b> ${qCur.explain}
    <button class="qnext" id="qnext">Next question &rarr;</button>`;
  $("#qnext").onclick = nextQuestion;
  $("#qnext").focus();
  $("#qscore").textContent = `${qScore}/${qTotal}`;
  $("#qstreak").textContent = qStreak ? `${qStreak} in a row` : (qBest ? `best ${qBest}` : "—");
}

function renderQuiz(){
  if (!qCur) { nextQuestion(); return; }
  $("#qprompt").innerHTML = qCur.prompt;
  $("#qsub").innerHTML = qCur.sub || "";
  $("#qsub").hidden = !qCur.sub;
  const box = $("#qopts"); box.innerHTML = "";
  qCur.opts.forEach((o, i) => {
    const b = document.createElement("button");
    b.className = "opt"; b.innerHTML = o.t;
    b.onclick = () => answer(i, b);
    box.appendChild(b);
  });
  $("#qfeed").className = "qfeed"; $("#qfeed").innerHTML = "";
  $("#qscore").textContent = `${qScore}/${qTotal}`;
  $("#qstreak").textContent = qStreak ? `${qStreak} in a row` : (qBest ? `best ${qBest}` : "—");
}

/* ================= deep links ================= */
function hashFor(z){ return "#" + ELEMENTS[z-1].sym; }
function openFromHash(){
  const h = decodeURIComponent(location.hash.replace(/^#/, "")).trim();
  if (!h) return;
  const e = ELEMENTS.find(x => x.sym.toLowerCase() === h.toLowerCase()) ||
            ELEMENTS.find(x => String(x.z) === h) ||
            ELEMENTS.find(x => x.name.toLowerCase() === h.toLowerCase());
  if (e) openSheet(e.z, true);
}

/* ================= wiring ================= */
document.addEventListener("DOMContentLoaded", () => {
  detectGlyphs();
  render();
  $("#q").addEventListener("input", ev => { query = ev.target.value; render(); });
  document.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => { mode = b.dataset.mode; render(); });
  document.querySelectorAll("[data-view]").forEach(b => b.onclick = () => { view = b.dataset.view; render(); });
  $("#qskip").onclick = nextQuestion;
  $("#close").onclick = closeSheet;
  $("#sheet").addEventListener("scroll", onSheetScroll, { passive: true });
  wireSheetDrag();
  $("#scrim").onclick = closeSheet;
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });
  addEventListener("hashchange", openFromHash);
  openFromHash();
  $("#play").onclick = () => playing ? stop() : play();
  $("#speed").onclick = () => {
    rate = rate === 1 ? 1.5 : rate === 1.5 ? 0.7 : 1;
    $("#speed").textContent = rate + "×";
    if (playing){ stop(); play(); }
  };
  $("#theme").onclick = () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const dark = cur ? cur === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", dark ? "light" : "dark");
  };
});
