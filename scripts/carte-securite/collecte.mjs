// ---------------------------------------------------------------------------
// Carte des événements de sécurité — Suisse romande
// Collecte (RSS) → tri/dédup/filtrage France (IA Claude) → géocodage → JSON
//
// Sans aucune dépendance : Node 20+ (fetch natif). Lancé par GitHub Actions
// 2×/jour. Écrit src/data/evenements-securite.json + un résumé lisible pour la
// demande de validation (Pull Request).
// ---------------------------------------------------------------------------

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(__dirname, "..", "..");
const SORTIE_JSON = resolve(RACINE, "src", "data", "evenements-securite.json");
const SORTIE_RESUME = resolve(__dirname, "resume-pr.md");

// Modèle Claude. claude-opus-4-8 = qualité max de tri.
// Pour réduire le coût par run, remplacer par "claude-haiku-4-5".
const MODELE = "claude-opus-4-8";
const FENETRE_HEURES = 26; // marge autour des « 24 dernières heures »

// Bbox Romandie (validation grossière du géocodage renvoyé par l'IA)
const BBOX = { lonMin: 5.8, lonMax: 8.5, latMin: 45.8, latMax: 47.5 };

// Flux Google News RSS (agrège médias romands + communiqués de police).
const SOURCES = [
  "https://news.google.com/rss/search?q=(cambriolage%20OR%20agression%20OR%20incendie%20OR%20accident%20OR%20interpellation%20OR%20disparition)%20(Gen%C3%A8ve%20OR%20Lausanne%20OR%20Vaud%20OR%20Valais%20OR%20Neuch%C3%A2tel%20OR%20Fribourg)%20when:1d&hl=fr&gl=CH&ceid=CH:fr",
  "https://news.google.com/rss/search?q=(communiqu%C3%A9%20police%20OR%20gendarmerie%20OR%20police%20cantonale)%20(Vaud%20OR%20Gen%C3%A8ve%20OR%20Valais%20OR%20Neuch%C3%A2tel%20OR%20Fribourg%20OR%20Jura%20suisse)%20when:1d&hl=fr&gl=CH&ceid=CH:fr",
  "https://news.google.com/rss/search?q=(cyberattaque%20OR%20fuite%20de%20donn%C3%A9es)%20(Suisse%20romande%20OR%20Gen%C3%A8ve%20OR%20Vaud%20OR%20Valais)%20when:1d&hl=fr&gl=CH&ceid=CH:fr",
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
        items.push({ titre, source: source || "—", lien, heure: heureLocale(new Date(ts)), ts });
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
- DÉDOUBLONNER : un même événement couvert par plusieurs médias = UN seul point. Choisis la source la plus fiable (police cantonale > média régional).
- Reformule un titre et un résumé NEUTRES et courts, SANS aucune donnée personnelle (pas de nom, pas d'adresse précise).
- Fournis la commune, le canton (code), la catégorie, et les coordonnées lon/lat de la commune (WGS84, degrés décimaux). En cas de doute sur les coordonnées, place le point au centre de la commune.
- "heure" : reprends l'horodatage fourni sous forme courte (ex. "auj. 08:20", "hier 23:10").
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

async function ecrire(evenements) {
  const genereLe = new Date().toISOString();
  const payload = { genereLe, source: "collecte automatique", evenements };
  await mkdir(dirname(SORTIE_JSON), { recursive: true });
  await writeFile(SORTIE_JSON, JSON.stringify(payload, null, 2) + "\n", "utf8");

  const lignes = evenements.length
    ? evenements.map((e) => `- **${e.commune} (${e.canton})** — ${e.categorie} · ${e.heure} · ${e.source}\n  ${e.titre}`).join("\n")
    : "_Aucun événement de sécurité majeur détecté sur la fenêtre (journée calme)._";
  const resume = `### Proposition de mise à jour — carte sécurité\n\n${evenements.length} événement(s) · généré le ${heureLocale(new Date())}\n\n${lignes}\n\n---\nFusionner cette demande pour publier ces événements sur la carte. Fermer pour ignorer.`;
  await writeFile(SORTIE_RESUME, resume, "utf8");

  console.log(`Écrit : ${SORTIE_JSON}`);
}

// --- Principal -----------------------------------------------------------

try {
  const items = await collecter();
  const evenements = await trier(items);
  await ecrire(evenements);
  console.log("Terminé.");
} catch (e) {
  console.error("ERREUR :", e.message);
  process.exit(1);
}
