// ---------------------------------------------------------------------------
// Carte des événements de sécurité - Suisse romande
// Collecte (RSS) → tri/dédup/filtrage France (IA Claude) → géocodage → JSON
//
// Sans aucune dépendance : Node 20+ (fetch natif). Lancé par GitHub Actions
// 2×/jour. Écrit src/data/evenements-securite.json + un résumé lisible pour la
// demande de validation (Pull Request).
// ---------------------------------------------------------------------------

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(__dirname, "..", "..");
const SORTIE_JSON = resolve(RACINE, "src", "data", "evenements-securite.json");
const ARCHIVE = resolve(RACINE, "src", "data", "evenements-archive.json");
const SORTIE_RESUME = resolve(__dirname, "resume-pr.md");

// Modèle Claude. claude-opus-4-8 = qualité max de tri.
// Pour réduire le coût par run, remplacer par "claude-haiku-4-5".
const MODELE = "claude-opus-4-8";
const FENETRE_HEURES = 72; // 3 derniers jours

// Bbox Romandie (validation grossière du géocodage renvoyé par l'IA)
const BBOX = { lonMin: 5.8, lonMax: 8.5, latMin: 45.8, latMax: 47.5 };

// Flux Google News RSS (agrège médias romands + communiqués de police).
const SOURCES = [
  "https://news.google.com/rss/search?q=(cambriolage%20OR%20agression%20OR%20incendie%20OR%20accident%20OR%20interpellation%20OR%20disparition)%20(Gen%C3%A8ve%20OR%20Lausanne%20OR%20Vaud%20OR%20Valais%20OR%20Neuch%C3%A2tel%20OR%20Fribourg)%20when:3d&hl=fr&gl=CH&ceid=CH:fr",
  "https://news.google.com/rss/search?q=(communiqu%C3%A9%20police%20OR%20gendarmerie%20OR%20police%20cantonale)%20(Vaud%20OR%20Gen%C3%A8ve%20OR%20Valais%20OR%20Neuch%C3%A2tel%20OR%20Fribourg%20OR%20Jura%20suisse)%20when:3d&hl=fr&gl=CH&ceid=CH:fr",
  "https://news.google.com/rss/search?q=(cyberattaque%20OR%20fuite%20de%20donn%C3%A9es)%20(Suisse%20romande%20OR%20Gen%C3%A8ve%20OR%20Vaud%20OR%20Valais)%20when:3d&hl=fr&gl=CH&ceid=CH:fr",
];

const CATEGORIES = ["cambriolage", "agression", "incendie", "accident", "disparition", "ordre", "cyber"];
const CANTONS = ["GE", "VD", "VS", "NE", "FR", "JU"];

// --- Utilitaires ---------------------------------------------------------

function decodeEntites(s) {
  return s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .trim();
}

function baliseTexte(bloc, nom) {
  const m = bloc.match(new RegExp(`<${nom}[^>]*>([\\s\\S]*?)</${nom}>`, "i"));
  return m ? decodeEntites(m[1]) : "";
}

function heureLocale(d) {
  return new Intl.DateTimeFormat("fr-CH", {
    timeZone: "Europe/Zurich", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(d);
}

// --- Collecte ------------------------------------------------------------

async function collecter() {
  const maintenant = Date.now();
  const seuil = maintenant - FENETRE_HEURES * 3600 * 1000;
  const vus = new Set();
  const items = [];

  for (const url of SOURCES) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "EdgwardCarteBot/1.0" } });
      if (!res.ok) { console.warn(`Source HTTP ${res.status} : ${url}`); continue; }
      const xml = await res.text();
      const blocs = xml.split(/<item>/i).slice(1);
      for (const bloc of blocs) {
        const titre = baliseTexte(bloc, "title");
        const lien = baliseTexte(bloc, "link");
        const dateStr = baliseTexte(bloc, "pubDate");
        const source = baliseTexte(bloc, "source");
        if (!titre || !dateStr) continue;
        const ts = Date.parse(dateStr);
        if (!Number.isFinite(ts) || ts < seuil) continue;
        const cle = titre.toLowerCase().slice(0, 60);
        if (vus.has(cle)) continue;
        vus.add(cle);
        items.push({ titre, source: source || "-", lien, heure: heureLocale(new Date(ts)), ts });
      }
    } catch (e) {
      console.warn(`Échec source : ${url}\n  ${e.message}`);
    }
  }
  items.sort((a, b) => b.ts - a.ts);
  console.log(`Collecte : ${items.length} article(s) dans la fenêtre.`);
  return items;
}

// --- Tri / dédup / extraction par Claude ---------------------------------

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    evenements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          titre: { type: "string" },
          resume: { type: "string" },
          commune: { type: "string" },
          canton: { type: "string", enum: CANTONS },
          categorie: { type: "string", enum: CATEGORIES },
          lon: { type: "number" },
          lat: { type: "number" },
          heure: { type: "string" },
          source: { type: "string" },
          recent: { type: "boolean" },
        },
        required: ["titre", "resume", "commune", "canton", "categorie", "lon", "lat", "heure", "source", "recent"],
      },
    },
  },
  required: ["evenements"],
};

const SYSTEME = `Tu tries des articles de presse pour une carte des événements de sécurité en Suisse romande (cantons de Genève, Vaud, Valais, Neuchâtel, Fribourg, Jura). Aujourd'hui : ${heureLocale(new Date())}.

Règles STRICTES :
- Ne garde QUE des événements de sécurité PHYSIQUE réels et localisés survenus dans un des 6 cantons romands (cambriolage, agression/violence, incendie, accident grave, disparition/appel à témoins, trouble à l'ordre public) OU une cyberattaque/fuite de données visant une entité romande (catégorie "cyber").
- EXCLURE tout ce qui est en France : département du Jura FRANÇAIS, Ain, Haute-Savoie (Annemasse, Bonneville, Thonon…), et toute commune française. Le "Jura" ne compte que s'il s'agit du canton suisse (communes comme Delémont, Porrentruy, Saignelégier, Glovelier, St-Brais…).
- EXCLURE le hors-sujet : sécheresse, interdictions de feu, procès, politique, sport, agenda, météo, communiqués administratifs.
- DÉDOUBLONNER (strict) : un même événement couvert par plusieurs médias = UN seul point. Choisis la source la plus fiable (police cantonale > média régional). Fusionne aussi deux entrées qui décrivent très probablement le MÊME fait (même type d'événement + récit similaire + dates proches), même si la commune ou l'heure indiquées diffèrent légèrement ; garde alors la localisation la plus précise. En cas de doute sérieux entre deux incidents quasi identiques le même jour, considère qu'il s'agit d'un seul événement.
- Reformule un titre et un résumé NEUTRES, SOBRES et courts, SANS aucune donnée personnelle (pas de nom, pas d'adresse précise). Évite tout terme cru ou sensationnaliste : pour les faits violents, privilégie une formulation factuelle et retenue (ex. « Agression à l'arme blanche » plutôt que « Femme poignardée »), sans détails graphiques. N'utilise QUE des tirets courts (-), jamais de tiret long (— ou –).
- Fournis la commune, le canton (code), la catégorie, et les coordonnées lon/lat de la commune (WGS84, degrés décimaux). En cas de doute sur les coordonnées, place le point au centre de la commune.
- La fenêtre couvre les 3 derniers jours. "heure" : indique la date courte + l'heure d'après l'horodatage fourni (ex. "24 juil. 08:20").
- "recent" = true si l'événement date de moins de ~12h.
Si aucun événement valable, renvoie une liste vide.`;

async function trier(items) {
  const cle = process.env.ANTHROPIC_API_KEY;
  if (!cle) throw new Error("ANTHROPIC_API_KEY manquante (secret GitHub à configurer).");
  if (items.length === 0) return [];

  const liste = items
    .map((it, i) => `${i + 1}. [${it.heure}] (${it.source}) ${it.titre}`)
    .join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": cle,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODELE,
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEME,
      messages: [{ role: "user", content: `Voici les articles collectés :\n\n${liste}` }],
    }),
  });

  if (!res.ok) throw new Error(`API Claude HTTP ${res.status} : ${await res.text()}`);
  const data = await res.json();
  if (data.stop_reason === "refusal") throw new Error("Réponse refusée par le modèle.");
  const bloc = (data.content || []).find((b) => b.type === "text");
  if (!bloc) throw new Error("Pas de contenu texte dans la réponse.");

  let parsed;
  try { parsed = JSON.parse(bloc.text); }
  catch { throw new Error(`JSON invalide : ${bloc.text.slice(0, 200)}`); }

  const evs = (parsed.evenements || []).filter((e) =>
    e.lon >= BBOX.lonMin && e.lon <= BBOX.lonMax &&
    e.lat >= BBOX.latMin && e.lat <= BBOX.latMax &&
    CANTONS.includes(e.canton) && CATEGORIES.includes(e.categorie)
  );
  console.log(`Tri IA : ${evs.length} événement(s) retenu(s) sur ${items.length}.`);
  return evs;
}

// --- Écriture ------------------------------------------------------------

async function ecrire(evenements, genereLe) {
  const payload = { genereLe, source: "collecte automatique", evenements };
  await mkdir(dirname(SORTIE_JSON), { recursive: true });
  await writeFile(SORTIE_JSON, JSON.stringify(payload, null, 2) + "\n", "utf8");

  const lignes = evenements.length
    ? evenements.map((e) => `- **${e.commune} (${e.canton})** - ${e.categorie} · ${e.heure} · ${e.source}\n  ${e.titre}`).join("\n")
    : "_Aucun événement de sécurité majeur détecté sur la fenêtre (journée calme)._";
  const resume = `### Proposition de mise à jour - carte sécurité\n\n${evenements.length} événement(s) · généré le ${heureLocale(new Date())}\n\n${lignes}\n\n---\nFusionner cette demande pour publier ces événements sur la carte. Fermer pour ignorer.`;
  await writeFile(SORTIE_RESUME, resume, "utf8");

  console.log(`Écrit : ${SORTIE_JSON}`);
}

// --- Archivage (historique cumulé pour la future carte de chaleur) -------

// Dédoublonnage par PROXIMITÉ : même catégorie + < ~4 km + à quelques jours = même incident.
const MOISNUM = { janv: 1, "févr": 2, fevr: 2, mars: 3, avr: 4, mai: 5, juin: 6, juil: 7, "août": 8, aout: 8, sept: 9, oct: 10, nov: 11, "déc": 12, dec: 12 };
const SEUIL_KM = 4, SEUIL_JOURS = 3;
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
function estDoublon(e, dv, liste) {
  const j = jourNum(e.heure, dv);
  return liste.some((o) => {
    if (o.categorie !== e.categorie) return false;
    const dx = (o.lon - e.lon) * 76, dy = (o.lat - e.lat) * 111;
    if (Math.hypot(dx, dy) > SEUIL_KM) return false;
    const oj = jourNum(o.heure, o.dateVue);
    if (j === null || oj === null) return true;
    return Math.abs(oj - j) <= SEUIL_JOURS;
  });
}

// Ajoute les nouveaux événements à l'archive cumulée (dédoublonnage par proximité).
async function archiver(evenements, genereLe) {
  let archive = { evenements: [] };
  try { archive = JSON.parse(await readFile(ARCHIVE, "utf8")); } catch {}
  if (!Array.isArray(archive.evenements)) archive.evenements = [];
  let ajout = 0;
  for (const e of evenements) {
    if (estDoublon(e, genereLe, archive.evenements)) continue;
    archive.evenements.push({
      titre: e.titre, resume: e.resume, commune: e.commune, canton: e.canton,
      categorie: e.categorie, lon: e.lon, lat: e.lat, heure: e.heure, source: e.source, dateVue: genereLe,
    });
    ajout++;
  }
  archive.compileLe = genereLe;
  archive.total = archive.evenements.length;
  await writeFile(ARCHIVE, JSON.stringify(archive, null, 2) + "\n", "utf8");
  console.log(`Archive : +${ajout} nouveau(x) (total ${archive.evenements.length}).`);
}

// --- Principal -----------------------------------------------------------

try {
  const items = await collecter();
  const evenements = await trier(items);
  if (evenements.length === 0) {
    console.log("Aucun événement retenu — carte laissée inchangée (aucune écriture).");
  } else {
    const genereLe = new Date().toISOString();
    await ecrire(evenements, genereLe);
    await archiver(evenements, genereLe);
  }
  console.log("Terminé.");
} catch (e) {
  console.error("ERREUR :", e.message);
  process.exit(1);
}
