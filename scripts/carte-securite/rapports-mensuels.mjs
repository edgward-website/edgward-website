// ---------------------------------------------------------------------------
// Génère les rapports mensuels de sécurité, un par canton romand et par mois
// COMPLET (le mois en cours est exclu). Chaque rapport est une page A4 autonome
// écrite dans public/rapports/<code>-<AAAA-MM>.html, plus un index.json.
//
// La synthèse « L'essentiel du mois » est RÉDIGÉE par Claude à partir des
// événements (ANTHROPIC_API_KEY). Sans clé ou en cas d'échec, on retombe sur une
// synthèse calculée déterministe, pour que la génération n'échoue jamais.
//
// Lancement : node scripts/carte-securite/rapports-mensuels.mjs [AAAA-MM ...]
// Sans argument : tous les mois complets présents dans l'archive.
// ---------------------------------------------------------------------------
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(__dirname, "..", "..");
const SORTIE = resolve(RACINE, "public", "rapports");
const MODELE = "claude-opus-4-8";

const CANTONS = { GE: "Genève", VD: "Vaud", VS: "Valais", NE: "Neuchâtel", FR: "Fribourg", JU: "Jura" };
const ROMANDS = new Set(Object.keys(CANTONS));
const CATS = {
  cambriolage: { l: "Cambriolages", c: "#f59e0b" }, agression: { l: "Agressions", c: "#ef4444" },
  incendie: { l: "Incendies", c: "#fb7a3c" }, accident: { l: "Accidents", c: "#2563eb" },
  disparition: { l: "Disparitions", c: "#8b5cf6" }, ordre: { l: "Ordre public", c: "#0891b2" }, cyber: { l: "Cyber", c: "#059669" },
};
const MOIS_FR = { "01": "Janvier", "02": "Février", "03": "Mars", "04": "Avril", "05": "Mai", "06": "Juin", "07": "Juillet", "08": "Août", "09": "Septembre", "10": "Octobre", "11": "Novembre", "12": "Décembre" };
const moisLabel = (m) => MOIS_FR[m.slice(5)] + " " + m.slice(0, 4);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// --- Données ---------------------------------------------------------------
const arc = JSON.parse(await readFile(resolve(RACINE, "src/data/evenements-archive.json"), "utf8"));
const exc = new Set(JSON.parse(await readFile(resolve(RACINE, "src/data/doublons-exclus.json"), "utf8")).exclus);
const cov = await readFile(resolve(RACINE, "src/components/CoverageMap.astro"), "utf8");

function bbox(d) { const re = /(-?[\d.]+),(-?[\d.]+)/g; let m, xs = [], ys = []; while ((m = re.exec(d))) { xs.push(+m[1]); ys.push(+m[2]); } return { x: Math.min(...xs), y: Math.min(...ys), X: Math.max(...xs), Y: Math.max(...ys) }; }
const geo = {};
{ const re = /<path\b[^>]*class="canton[^"]*"[^>]*>/g; let m; while ((m = re.exec(cov))) { const code = (m[0].match(/data-code="([^"]+)"/) || [])[1]; const d = (m[0].match(/\sd="([^"]+)"/) || [])[1]; if (code && d && ROMANDS.has(code)) geo[code] = { d, bbox: bbox(d) }; } }
const lakes = []; { const re = /<path\b[^>]*class="lake"[^>]*\sd="([^"]+)"/g; let m; while ((m = re.exec(cov))) lakes.push(m[1]); }

const A = 192.0, Bx = -1081.9, C = -276.6, Dy = 13248.9;
const cle = (e) => [e.commune, (e.dateVue || "").slice(0, 10), e.titre].join(" | ");
const tous = arc.evenements
  .filter((e) => CANTONS[e.canton] && !exc.has(cle(e)) && typeof e.lon === "number" && typeof e.lat === "number" && (e.dateVue || "").length >= 7)
  .map((e) => { const dv = (e.dateVue || "").slice(0, 10); return { k: e.canton, m: dv.slice(0, 7), x: +(A * e.lon + Bx).toFixed(1), y: +(C * e.lat + Dy).toFixed(1), d: dv.slice(8, 10) + "." + dv.slice(5, 7), c: e.commune, cat: e.categorie, t: e.titre, s: e.source || "" }; });

// Mois à générer : complets (hors mois en cours Europe/Zurich), présents dans les données.
const parts = new Intl.DateTimeFormat("fr-CH", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit" }).formatToParts(new Date());
const moisCourant = `${parts.find((p) => p.type === "year").value}-${parts.find((p) => p.type === "month").value}`;
// Premier mois pleinement couvert : la veille a démarré le 24 juillet 2026, donc
// juillet est partiel et n'a pas de rapport. Les mois suivants sont complets.
const DEBUT = "2026-08";
const argMois = process.argv.slice(2).filter((a) => /^\d{4}-\d{2}$/.test(a));
let moisCibles = argMois.length ? argMois : [...new Set(tous.map((e) => e.m))];
moisCibles = moisCibles.filter((m) => m !== moisCourant && m >= DEBUT).sort();

// --- Synthèse rédigée par Claude (repli calculé) ---------------------------
const SYSTEME = `Tu es analyste sécurité pour Edgward, service d'intervention de sécurité à la demande en Suisse romande.
Rédige une synthèse mensuelle NEUTRE et FACTUELLE des événements de sécurité d'un canton, à partir de la liste fournie.
Règles :
- 2 à 4 phrases, ton sobre et mesuré, jamais anxiogène ni sensationnaliste.
- N'invente rien : appuie-toi UNIQUEMENT sur la liste. Aucune donnée personnelle, aucun nom de victime.
- Mets en lumière la dominante (type d'événement majoritaire), la concentration géographique, et les signaux notables (axes autoroutiers, montagne, cyber, séries).
- Si les atteintes graves aux personnes et aux biens restent minoritaires, termine par une mise en perspective rassurante et factuelle.
- Ne promets jamais de délai d'intervention. N'utilise QUE des tirets courts (-), jamais de tirets longs.
- Réponds par le seul texte de la synthèse, sans titre ni préambule.`;

async function syntheseIA(nomC, nomM, l) {
  const cle = process.env.ANTHROPIC_API_KEY;
  if (!cle) return null;
  const liste = l.map((e) => `- ${e.d} | ${e.c} | ${CATS[e.cat] ? CATS[e.cat].l : e.cat} | ${e.t}`).join("\n");
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": cle, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: MODELE, max_tokens: 700, thinking: { type: "adaptive" },
        output_config: { effort: "low" },
        system: SYSTEME,
        messages: [{ role: "user", content: `Canton : ${nomC}. Mois : ${nomM}.\nÉvénements (${l.length}) :\n${liste}` }],
      }),
    });
    if (!res.ok) { console.warn(`  API ${nomC} ${nomM} : HTTP ${res.status}`); return null; }
    const data = await res.json();
    const bloc = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join(" ").trim();
    return bloc || null;
  } catch (e) { console.warn(`  API ${nomC} ${nomM} : ${e.message}`); return null; }
}

function syntheseCalculee(nomC, nomM, l, catRows, cats, tops) {
  const d0 = catRows[0];
  const lieu = tops.length ? tops[0][0] : "";
  return `En ${nomM.replace(/ 20\d\d/, "").toLowerCase()}, l'activité de sécurité dans le canton de ${nomC} est dominée par les ${CATS[d0].l.toLowerCase()}` + (lieu ? `, avec une concentration sur ${lieu}` : "") + `. Les données sont présentées à titre informatif et de manière neutre.`;
}

function pointsCalcules(m, k, l, cats, catRows, byCom, tops, nbCom) {
  const pts = [];
  const PREV = { "2026-08": "2026-07", "2026-09": "2026-08" };
  const prevKey = PREV[m], prevN = prevKey ? tous.filter((e) => e.k === k && e.m === prevKey).length : null;
  const d0 = catRows[0], share = Math.round(100 * cats[d0] / l.length);
  let v = `Volume : <b>${l.length}</b> événements`;
  if (prevN !== null && prevKey !== "2026-07") { const dd = l.length - prevN; v += (dd > 0 ? `, en hausse (+${dd})` : dd < 0 ? `, en recul (${dd})` : ", stable") + ` vs ${MOIS_FR[prevKey.slice(5)].toLowerCase()} (${prevN}).`; } else v += ".";
  pts.push(v);
  const d1 = catRows[1];
  pts.push(`Dominante : <b>${CATS[d0].l.toLowerCase()}</b> (${cats[d0]}, ${share}%)` + (d1 ? `, devant ${CATS[d1].l.toLowerCase()} (${cats[d1]}).` : "."));
  if (tops.length) pts.push(`Concentration : <b>${esc(tops[0][0])}</b> (${tops[0][1]}), sur <b>${nbCom}</b> communes.`);
  const sig = [];
  const auto = l.filter((e) => /\bA\d{1,2}\b|autoroute/i.test(e.t)).length; if (auto >= 2) sig.push(`<b>${auto}</b> faits sur les axes autoroutiers`);
  const mont = l.filter((e) => e.cat === "accident" && /chute|alpinist|randonn|montagne|cervin|crevasse|parapente|sommet|glacier|cabane|weissmies/i.test(e.t)).length; if (mont >= 2) sig.push(`<b>${mont}</b> accidents en montagne`);
  const cyber = cats["cyber"] || 0; if (cyber >= 2) sig.push(`<b>${cyber}</b> incidents cyber`);
  if (sig.length) pts.push("Signaux : " + sig.slice(0, 2).join(", ") + ".");
  const biens = (cats["cambriolage"] || 0) + (cats["agression"] || 0);
  pts.push(`Atteintes aux biens/personnes minoritaires : <b>${biens}</b> (${Math.round(100 * biens / l.length)}%).`);
  return pts.slice(0, 6);
}

// --- Rendu d'un rapport (page A4 autonome) ---------------------------------
function renderReport(k, m, l, syn, pts, cats, catRows, byCom, tops, nbCom) {
  const nomC = CANTONS[k], nomM = moisLabel(m), maxCat = cats[catRows[0]];
  const barres = catRows.map((c) => `<div class="row"><span class="lab">${CATS[c].l}</span><span class="track"><span class="fill" style="width:${(100 * cats[c] / maxCat).toFixed(0)}%;background:${CATS[c].c}"></span></span><span class="val">${cats[c]}</span></div>`).join("");
  const communes = tops.map(([c, n], i) => `<li><span class="r">${i + 1}</span><span class="nm">${esc(c)}</span><span class="ct">${n}</span></li>`).join("");
  const faits = l.map((e) => { const cc = CATS[e.cat] || { c: "#64748b" }; return `<div class="fact"><span class="fd">${e.d}</span><span class="fb"><div class="ft">${esc(e.t)}</div><div class="fm">${esc(e.c)}${e.s ? " · " + esc(e.s) : ""}</div></span><span class="fc"><i style="background:${cc.c}"></i></span></div>`; }).join("");
  const mapData = { geo: geo[k], lakes, evts: l.map((e) => ({ x: e.x, y: e.y, c: e.c })) };

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rapport de sécurité ${esc(nomC)} - ${esc(nomM)} | Edgward</title>
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{ --brand:#4678DC; --brand-dark:#3C6EC8; --brand-soft:rgba(70,120,220,.1); --navy:#0a1929; --soft:#f8fafc; --border:#e5e7eb; --muted:#64748b; --light:#6b7280; --ff:'Manrope',system-ui,sans-serif; --serif:'Instrument Serif',Georgia,serif; --land:#e9edf3; --lake:#cfe8f5; }
  *{box-sizing:border-box} body{margin:0;background:#eef1f6;font-family:var(--ff);color:var(--navy)}
  .stagewrap{ padding:24px 14px 50px; display:flex; justify-content:center }
  .page{ width:210mm; min-height:297mm; background:#fff; box-shadow:0 2px 8px rgba(15,23,42,.12),0 20px 50px rgba(15,23,42,.12); padding:17mm 16mm }
  .rhead{ display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid var(--navy); padding-bottom:14px }
  .rhead .wm{ font-weight:800; font-size:18px; display:flex; align-items:center; gap:8px }
  .rhead .wm .m{ width:26px;height:26px;border-radius:7px;background:var(--brand);display:grid;place-items:center;color:#fff;font-size:14px }
  .rhead .ri{ text-align:right }
  .rhead .ey{ font-size:10px; text-transform:uppercase; letter-spacing:.14em; color:var(--brand); font-weight:800 }
  .rhead h1{ font-family:var(--serif); font-weight:400; font-size:30px; line-height:1.05; margin:3px 0 0 }
  .rhead .mo{ font-size:13px; color:var(--muted); margin-top:2px }
  .lead{ font-size:13px; line-height:1.55; color:#334155; margin:14px 0 18px; max-width:64ch }
  .kpis{ display:flex; gap:14px; margin-bottom:20px }
  .kpi{ background:var(--soft); border:1px solid var(--border); border-radius:12px; padding:11px 16px; min-width:115px }
  .kpi b{ display:block; font-family:var(--serif); font-size:32px; line-height:1; color:var(--navy) }
  .kpi span{ font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:var(--muted) }
  .analyse{ background:var(--brand-soft); border:1px solid rgba(70,120,220,.2); border-left:3px solid var(--brand); border-radius:0 12px 12px 0; padding:16px 20px; margin-bottom:22px }
  .analyse h2{ font-size:11px; text-transform:uppercase; letter-spacing:.1em; color:var(--brand-dark); font-weight:800; margin:0 0 7px }
  .analyse .syn{ font-size:13.5px; line-height:1.6; color:var(--navy); margin:0 0 12px }
  .analyse ul{ margin:0; padding:0; list-style:none; display:grid; grid-template-columns:1fr 1fr; gap:2px 22px }
  .analyse li{ position:relative; padding:4px 0 4px 16px; font-size:12px; line-height:1.45; color:#334155 }
  .analyse li::before{ content:''; position:absolute; left:2px; top:10px; width:6px; height:6px; border-radius:50%; background:var(--brand) }
  .analyse li b{ color:var(--navy); font-weight:700 }
  .grid2{ display:grid; grid-template-columns:1.05fr 1fr; gap:24px; align-items:start }
  h2.sec{ font-size:13px; text-transform:uppercase; letter-spacing:.08em; color:var(--navy); margin:0 0 10px; padding-bottom:6px; border-bottom:1px solid var(--border) }
  .mini-stage{ position:relative; width:100%; border:1px solid var(--border); border-radius:12px; overflow:hidden; background:#f4f7fb }
  .mini-stage svg,.mini-stage canvas{ position:absolute; inset:0; width:100%; height:100% }
  .mini-stage .mini-svg{z-index:1} .mini-stage .mini-heat{z-index:2} .mini-stage .mini-dots{z-index:3}
  .mini-canton{ fill:var(--land); stroke:#cdd7e5; stroke-width:.5 } .mini-lake{ fill:var(--lake); stroke:#bcdcef; stroke-width:.3 }
  .mini-dots circle{ fill:var(--navy); stroke:#fff; stroke-width:1 }
  .mini-dots text{ fill:var(--navy); font-family:var(--ff); font-weight:700; paint-order:stroke; stroke:#fff }
  .mini-cap{ font-size:10.5px; color:var(--light); margin-top:6px; text-align:center }
  .cats .row{ display:flex; align-items:center; gap:10px; margin:7px 0; font-size:12.5px }
  .cats .lab{ width:94px; color:#334155; font-weight:600 }
  .cats .track{ flex:1; height:10px; background:#eef2f7; border-radius:5px; overflow:hidden }
  .cats .fill{ display:block; height:100%; border-radius:5px }
  .cats .val{ width:22px; text-align:right; font-weight:800 }
  .tops{ list-style:none; margin:14px 0 0; padding:0 }
  .tops li{ display:flex; align-items:center; gap:10px; padding:6px 0; border-top:1px solid #f1f5f9; font-size:13px } .tops li:first-child{border-top:0}
  .tops .r{ width:18px; color:var(--light); font-weight:800; font-size:11px; text-align:right } .tops .nm{ flex:1; font-weight:600 } .tops .ct{ font-weight:800; color:var(--brand) }
  h2.facth{ font-size:13px; text-transform:uppercase; letter-spacing:.08em; color:var(--navy); margin:24px 0 8px; padding-bottom:6px; border-bottom:1px solid var(--border) }
  .facts{ columns:2; column-gap:26px }
  .fact{ display:flex; gap:10px; padding:7px 0; border-top:1px solid #f1f5f9; font-size:12px; break-inside:avoid; -webkit-column-break-inside:avoid }
  .fact .fd{ flex:0 0 34px; color:var(--light); font-weight:600 } .fact .fb{ flex:1; min-width:0 }
  .fact .ft{ font-weight:700; color:var(--navy); line-height:1.3 } .fact .fm{ color:var(--muted); font-size:10.5px; margin-top:1px }
  .fact .fc{ flex:0 0 8px } .fact .fc i{ display:block; width:8px; height:8px; border-radius:50%; margin-top:4px }
  .cta{ margin-top:24px; background:var(--navy); color:#fff; border-radius:14px; padding:18px 22px; display:flex; justify-content:space-between; align-items:center; gap:16px; break-inside:avoid }
  .cta .ct b{ font-family:var(--serif); font-weight:400; font-size:19px; display:block } .cta .ct span{ font-size:12px; color:#cbd5e1 }
  .cta .btn{ flex:none; background:var(--brand); color:#fff; font-weight:700; font-size:13px; padding:10px 18px; border-radius:9px; text-decoration:none; white-space:nowrap }
  .foot{ margin-top:14px; border-top:1px solid var(--border); padding-top:10px; font-size:9.5px; color:var(--light); line-height:1.5 }
  @media print{ body{background:#fff} .stagewrap{padding:0} .page{box-shadow:none;width:auto;min-height:auto} @page{size:A4;margin:11mm} }
  @media(max-width:820px){ .grid2,.analyse ul,.facts{grid-template-columns:1fr;columns:1} .page{width:100%;padding:20px 16px} }
</style></head>
<body><div class="stagewrap"><div class="page">
  <div class="rhead"><div class="wm"><span class="m">E</span>EDGWARD</div><div class="ri"><div class="ey">Rapport de sécurité</div><h1>${esc(nomC)}</h1><div class="mo">${esc(nomM)}</div></div></div>
  <p class="lead">Synthèse des événements de sécurité relayés dans les médias et les communiqués officiels pour le canton de ${esc(nomC)} en ${esc(nomM.replace(/ 20\d\d/, ""))}. Données compilées et dédoublonnées automatiquement, présentées de manière neutre et factuelle, sans information personnelle.</p>
  <div class="kpis"><div class="kpi"><b>${l.length}</b><span>événements</span></div><div class="kpi"><b>${nbCom}</b><span>communes</span></div><div class="kpi"><b>${cats[catRows[0]]}</b><span>${CATS[catRows[0]].l.toLowerCase()}</span></div></div>
  <div class="analyse"><h2>L'essentiel du mois</h2>${syn ? `<p class="syn">${esc(syn)}</p>` : ""}<ul>${pts.map((p) => `<li>${p}</li>`).join("")}</ul></div>
  <div class="grid2">
    <div><h2 class="sec">Carte de chaleur - ${esc(nomC)}</h2><div class="mini-stage" id="miniStage"></div><div class="mini-cap">Densité des événements par commune en ${esc(nomM.replace(/ 20\d\d/, ""))}</div></div>
    <div><h2 class="sec">Répartition par type</h2><div class="cats">${barres}</div><h2 class="sec" style="margin-top:20px">Communes les plus concernées</h2><ol class="tops">${communes}</ol></div>
  </div>
  <h2 class="facth">Faits recensés</h2><div class="facts">${faits}</div>
  <div class="cta"><div class="ct"><b>Edgward dans le canton de ${esc(nomC)}</b><span>Le service d'intervention de sécurité à la demande. Soyez alerté près de chez vous et déclenchez une intervention en un geste.</span></div><a class="btn" href="https://edgward.ch/#telecharger">Découvrir l'application</a></div>
  <p class="foot">Sources : médias romands et communiqués de police cantonale. Événements recensés et dédoublonnés automatiquement par Edgward ; l'analyse est générée à partir de ces données. Document informatif, ni relevé officiel ni statistique exhaustive. Aucune donnée personnelle n'est traitée.</p>
</div></div>
<script id="mapData" type="application/json">${JSON.stringify(mapData)}</script>
<script>
(function(){
  const D=JSON.parse(document.getElementById('mapData').textContent); const NS='http://www.w3.org/2000/svg';
  const rampC=document.createElement('canvas'); rampC.width=256; rampC.height=1; const rx=rampC.getContext('2d');
  const rg=rx.createLinearGradient(0,0,256,0); rg.addColorStop(0,'#3b82f6');rg.addColorStop(.32,'#22d3ee');rg.addColorStop(.48,'#34d399');rg.addColorStop(.64,'#facc15');rg.addColorStop(.82,'#fb923c');rg.addColorStop(1,'#ef4444');
  rx.fillStyle=rg; rx.fillRect(0,0,256,1); const RAMP=rx.getImageData(0,0,256,1).data;
  const esc=(s)=>String(s).replace(/[&<>"]/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const geo=D.geo, bb=geo.bbox, pad=5;
  const vb={x:bb.x-pad,y:bb.y-pad,w:(bb.X-bb.x)+2*pad,h:(bb.Y-bb.y)+2*pad};
  const CWp=620, sc=CWp/vb.w, CHp=Math.round(vb.h*sc), vbStr=vb.x+' '+vb.y+' '+vb.w+' '+vb.h;
  let svg='<svg class="mini-svg" viewBox="'+vbStr+'" xmlns="http://www.w3.org/2000/svg"><path d="'+geo.d+'" class="mini-canton"/>';
  D.lakes.forEach(d=>svg+='<path d="'+d+'" class="mini-lake"/>'); svg+='</svg>';
  const by={}; D.evts.forEach(e=>{ (by[e.c]=by[e.c]||{c:e.c,x:0,y:0,n:0}); by[e.c].x+=e.x; by[e.c].y+=e.y; by[e.c].n++; });
  const coms=Object.values(by).map(o=>({c:o.c,x:o.x/o.n,y:o.y/o.n,n:o.n})).sort((a,b)=>b.n-a.n);
  const host=document.getElementById('miniStage'); host.style.aspectRatio=vb.w+' / '+vb.h;
  host.innerHTML=svg+'<canvas class="mini-heat" width="'+CWp+'" height="'+CHp+'"></canvas><svg class="mini-dots" viewBox="'+vbStr+'" xmlns="http://www.w3.org/2000/svg"></svg>';
  const Rw=8,Bw=6,rad=(Rw+Bw)*sc; const circ=document.createElement('canvas'); circ.width=circ.height=Math.ceil(2*rad); const cc=circ.getContext('2d');
  const g=cc.createRadialGradient(rad,rad,0,rad,rad,rad); g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(1,'rgba(0,0,0,0)'); cc.fillStyle=g; cc.beginPath(); cc.arc(rad,rad,rad,0,7); cc.fill();
  const cv=host.querySelector('.mini-heat'), ctx=cv.getContext('2d'); const clip=new Path2D(geo.d); const w2x=x=>(x-vb.x)*sc,w2y=y=>(y-vb.y)*sc;
  ctx.save(); ctx.setTransform(sc,0,0,sc,-vb.x*sc,-vb.y*sc); ctx.clip(clip); ctx.setTransform(1,0,0,1,0,0);
  const MAXW=Math.max(2,coms.length?coms[0].n:1);
  for(const o of coms){ ctx.globalAlpha=Math.max(.12,Math.min(1,o.n/MAXW)); ctx.drawImage(circ,w2x(o.x)-rad,w2y(o.y)-rad); }
  const img=ctx.getImageData(0,0,CWp,CHp),px=img.data; for(let i=0;i<px.length;i+=4){const a=px[i+3]; if(a){const j=a*4; px[i]=RAMP[j];px[i+1]=RAMP[j+1];px[i+2]=RAMP[j+2];px[i+3]=Math.min(215,a+25);}} ctx.putImageData(img,0,0); ctx.restore();
  const dsvg=host.querySelector('.mini-dots'); const fs=vb.w*0.03, sw=(fs*0.32).toFixed(2), padL=fs*0.12;
  const top=coms.slice(0,6).map(o=>({...o,r:1+Math.min(2.4,Math.sqrt(o.n)*0.7)}));
  const placed=[]; const grow=b=>({x0:b.x-padL,y0:b.y-padL,x1:b.x+b.width+padL,y1:b.y+b.height+padL});
  const inVB=b=>b.x>=vb.x&&b.x+b.width<=vb.x+vb.w&&b.y>=vb.y&&b.y+b.height<=vb.y+vb.h;
  const hit=g=>placed.some(p=>!(g.x1<p.x0||g.x0>p.x1||g.y1<p.y0||g.y0>p.y1));
  top.forEach(o=>{ const c=document.createElementNS(NS,'circle'); c.setAttribute('cx',o.x); c.setAttribute('cy',o.y); c.setAttribute('r',o.r.toFixed(2)); dsvg.appendChild(c); placed.push(grow(c.getBBox())); });
  top.forEach(o=>{ const g1=o.r+fs*0.45,g2=o.r+fs*0.95;
    const cands=[['middle',o.x,o.y-g1],['middle',o.x,o.y+g1+fs*0.8],['start',o.x+g1,o.y+fs*0.33],['end',o.x-g1,o.y+fs*0.33],['start',o.x+g1,o.y-g1],['end',o.x-g1,o.y-g1],['start',o.x+g1,o.y+g2],['end',o.x-g1,o.y+g2],['middle',o.x,o.y-g2-fs*0.6],['middle',o.x,o.y+g2+fs]];
    for(const [anchor,ax,ay] of cands){ const t=document.createElementNS(NS,'text'); t.setAttribute('x',ax.toFixed(2)); t.setAttribute('y',ay.toFixed(2)); t.setAttribute('text-anchor',anchor); t.setAttribute('font-size',fs.toFixed(2)); t.setAttribute('stroke-width',sw); t.textContent=o.c; dsvg.appendChild(t); const b=t.getBBox(),gg=grow(b); if(inVB(b)&&!hit(gg)){placed.push(gg);break;} dsvg.removeChild(t); }
  });
})();
</script>
</body></html>`;
}

// --- Boucle de génération --------------------------------------------------
await mkdir(SORTIE, { recursive: true });
let nbIA = 0, nbCalc = 0;
const index = [];
for (const m of moisCibles) {
  for (const k of Object.keys(CANTONS)) {
    const l = tous.filter((e) => e.k === k && e.m === m).sort((a, b) => a.d.localeCompare(b.d));
    if (!l.length) continue;
    const cats = {}; l.forEach((e) => (cats[e.cat] = (cats[e.cat] || 0) + 1));
    const catRows = Object.keys(CATS).filter((c) => cats[c]).sort((a, b) => cats[b] - cats[a]);
    const byCom = {}; l.forEach((e) => (byCom[e.c] = (byCom[e.c] || 0) + 1));
    const nbCom = Object.keys(byCom).length;
    const tops = Object.entries(byCom).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const nomC = CANTONS[k], nomM = moisLabel(m);

    let syn = await syntheseIA(nomC, nomM, l);
    if (syn) nbIA++; else { syn = syntheseCalculee(nomC, nomM, l, catRows, cats, tops); nbCalc++; }
    const pts = pointsCalcules(m, k, l, cats, catRows, byCom, tops, nbCom);
    const html = renderReport(k, m, l, syn, pts, cats, catRows, byCom, tops, nbCom);
    const nom = `${k.toLowerCase()}-${m}.html`;
    await writeFile(resolve(SORTIE, nom), html, "utf8");
    index.push({ canton: k, nom: nomC, mois: m, moisLabel: nomM, url: `/rapports/${nom}`, total: l.length });
    console.log(`  ✓ ${nomC} ${nomM} (${l.length} évts)${process.env.ANTHROPIC_API_KEY ? "" : " [synthèse calculée]"}`);
  }
}
await writeFile(resolve(SORTIE, "index.json"), JSON.stringify({ genereLe: new Date().toISOString(), rapports: index }, null, 2) + "\n", "utf8");
console.log(`\n${index.length} rapports générés (${nbIA} rédigés par IA, ${nbCalc} calculés) → public/rapports/`);
