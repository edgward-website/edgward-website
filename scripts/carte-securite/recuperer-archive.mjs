// ---------------------------------------------------------------------------
// Récupération de l'historique : reconstitue une archive des événements passés
// à partir de toutes les versions du fichier de données conservées dans git.
// À lancer une seule fois. Écrit src/data/evenements-archive.json.
// ---------------------------------------------------------------------------

import { execSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(__dirname, "..", "..");
const CIBLE = "src/data/evenements-securite.json";
const ARCHIVE = resolve(RACINE, "src", "data", "evenements-archive.json");

function git(cmd) {
  return execSync(`git ${cmd}`, { cwd: RACINE, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

// Dédoublonnage : deux entrées = même incident si, à quelques jours près, elles
// sont dans la même commune (ou à < ~4 km) ET se ressemblent (même catégorie OU
// mots de titre communs). Absorbe : variantes de nom de lieu, re-classements de
// catégorie du même fait, coordonnées instables, labels de date variables.
const MOISNUM = { janv: 1, "févr": 2, fevr: 2, mars: 3, avr: 4, mai: 5, juin: 6, juil: 7, "août": 8, aout: 8, sept: 9, oct: 10, nov: 11, "déc": 12, dec: 12 };
const SEUIL_KM = 4;
const SEUIL_JOURS = 3;
const STOP = new Set(["dans","une","des","les","aux","sur","par","avec","pour","plus","deux","sans","leur","son","ses","entre","apres","suite","dune","dun","est","ont","qui","que"]);
function jourNum(heure, dv) {
  const h = (heure || "").toLowerCase();
  const m = h.match(/(\d{1,2})\s*(janv|févr|fevr|mars|avr|mai|juin|juil|août|aout|sept|oct|nov|déc|dec)/);
  const dd = dv && Number.isFinite(Date.parse(dv)) ? new Date(dv) : null;
  let d;
  if (m) d = new Date(dd ? dd.getFullYear() : 2026, (MOISNUM[m[2]] || 1) - 1, +m[1]);
  else if (dd) { d = new Date(dd); if (h.includes("hier")) d.setDate(d.getDate() - 1); }
  else return null;
  return Math.floor(d.getTime() / 86400000);
}
function norm(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
function communeNorm(c) { return norm(c).split(/[—–-]/)[0].trim(); }
function motsTitre(t) { return norm(t).replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w)); }
function titreSimilaire(a, b) { const A = new Set(motsTitre(a)); return motsTitre(b).some((w) => A.has(w)); }
function estDoublon(e, dv, liste) {
  const j = jourNum(e.heure, dv);
  return liste.some((o) => {
    const oj = jourNum(o.heure, o.dateVue);
    const memeJour = (j === null || oj === null) ? true : Math.abs(oj - j) <= SEUIL_JOURS;
    if (!memeJour) return false;
    if (communeNorm(o.commune) === communeNorm(e.commune) && (o.categorie === e.categorie || titreSimilaire(o.titre, e.titre))) return true;
    if (o.categorie === e.categorie) {
      const dx = (o.lon - e.lon) * 76, dy = (o.lat - e.lat) * 111;
      if (Math.hypot(dx, dy) <= SEUIL_KM) return true;
    }
    return false;
  });
}

// Tous les commits touchant le fichier, du plus ancien au plus récent.
const commits = git(`log --reverse --format=%H -- ${CIBLE}`).trim().split(/\r?\n/).filter(Boolean);
console.log(`${commits.length} versions à parcourir.`);

const evenements = [];
for (const c of commits) {
  let data;
  try { data = JSON.parse(git(`show ${c}:${CIBLE}`)); }
  catch { continue; }
  const dv = data.genereLe && Number.isFinite(Date.parse(data.genereLe)) ? data.genereLe : null;
  for (const e of data.evenements || []) {
    if (!e.commune || !e.categorie || typeof e.lon !== "number" || typeof e.lat !== "number") continue;
    if (estDoublon(e, dv, evenements)) continue;
    evenements.push({
      titre: e.titre, resume: e.resume, commune: e.commune, canton: e.canton,
      categorie: e.categorie, lon: e.lon, lat: e.lat, heure: e.heure, source: e.source,
      dateVue: dv,
    });
  }
}
const payload = { compileLe: new Date().toISOString(), total: evenements.length, evenements };
await writeFile(ARCHIVE, JSON.stringify(payload, null, 2) + "\n", "utf8");
console.log(`Archive reconstituée : ${evenements.length} événements uniques.`);
console.log(`→ ${ARCHIVE}`);
