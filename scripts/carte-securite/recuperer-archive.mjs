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

// Dédoublonnage au niveau du JOUR (mêmes commune + catégorie + jour = même incident),
// pour absorber les re-publications du même fait avec des horaires/libellés variables.
const MOISNUM = { janv: 1, "févr": 2, fevr: 2, mars: 3, avr: 4, mai: 5, juin: 6, juil: 7, "août": 8, aout: 8, sept: 9, oct: 10, nov: 11, "déc": 12, dec: 12 };
function jourDe(e, dv) {
  const h = (e.heure || "").toLowerCase();
  const m = h.match(/(\d{1,2})\s*(janv|févr|fevr|mars|avr|mai|juin|juil|août|aout|sept|oct|nov|déc|dec)/);
  if (m) return `${+m[1]}-${MOISNUM[m[2]] || m[2]}`;
  if (dv && Number.isFinite(Date.parse(dv))) {
    const d = new Date(dv);
    if (h.includes("hier")) d.setDate(d.getDate() - 1);
    return `${d.getDate()}-${d.getMonth() + 1}`;
  }
  return h;
}
const cle = (e, dv) => `${(e.commune || "").toLowerCase().trim()}|${e.categorie}|${jourDe(e, dv)}`;

// Tous les commits touchant le fichier, du plus ancien au plus récent.
const commits = git(`log --reverse --format=%H -- ${CIBLE}`).trim().split(/\r?\n/).filter(Boolean);
console.log(`${commits.length} versions à parcourir.`);

const vus = new Map();
for (const c of commits) {
  let data;
  try { data = JSON.parse(git(`show ${c}:${CIBLE}`)); }
  catch { continue; }
  const dv = data.genereLe && Number.isFinite(Date.parse(data.genereLe)) ? data.genereLe : null;
  for (const e of data.evenements || []) {
    if (!e.commune || !e.categorie || typeof e.lon !== "number" || typeof e.lat !== "number") continue;
    const k = cle(e, dv);
    if (vus.has(k)) continue;
    vus.set(k, {
      titre: e.titre, resume: e.resume, commune: e.commune, canton: e.canton,
      categorie: e.categorie, lon: e.lon, lat: e.lat, heure: e.heure, source: e.source,
      dateVue: dv,
    });
  }
}

const evenements = [...vus.values()];
const payload = { compileLe: new Date().toISOString(), total: evenements.length, evenements };
await writeFile(ARCHIVE, JSON.stringify(payload, null, 2) + "\n", "utf8");
console.log(`Archive reconstituée : ${evenements.length} événements uniques.`);
console.log(`→ ${ARCHIVE}`);
