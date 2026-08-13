// Equivalence des routes FR <-> EN.
// Cle = chemin canonique FR ; valeur = chemin EN. AJOUTER UNE ENTREE par page traduite.
// Ce fichier pilote a la fois le selecteur de langue (Nav) et les balises hreflang (Base).

import type { Lang } from './ui';

export const routeMap: Record<string, string> = {
  '/': '/en',
  '/faq': '/en/faq',
  '/particuliers': '/en/individuals',
  '/entreprises': '/en/businesses',
  '/comment-ca-marche': '/en/how-it-works',
  '/qui-sommes-nous': '/en/about',
  '/partenaires': '/en/partners',
  '/medias': '/en/press',
  '/intervention-alarme': '/en/alarm-response',
  '/intervention-apres-alerte-camera': '/en/camera-alert-response',
  '/cgu': '/en/terms',
  '/confidentialite': '/en/privacy',
};

const reverseMap: Record<string, string> = Object.fromEntries(
  Object.entries(routeMap).map(([fr, en]) => [en, fr]),
);

/** Retire le slash final (sauf racine) pour comparer des chemins de facon fiable. */
function normalize(path: string): string {
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path;
}

/**
 * Renvoie l'equivalent d'un chemin FR canonique dans la langue demandee.
 * Si aucune traduction n'existe encore, retombe sur le chemin FR (degradation gracieuse).
 */
export function localize(frPath: string, lang: Lang): string {
  if (lang === 'fr') return frPath;
  return routeMap[normalize(frPath)] ?? frPath;
}

/**
 * Pour un chemin courant (FR ou EN), renvoie les deux versions.
 * `null` = cette page n'a pas (encore) de version dans cette langue.
 */
export function getAlternates(pathname: string): { fr: string | null; en: string | null } {
  const p = normalize(pathname);
  const isEn = p === '/en' || p.startsWith('/en/');
  if (isEn) {
    return { fr: reverseMap[p] ?? null, en: p };
  }
  return { fr: p, en: routeMap[p] ?? null };
}

/**
 * Cible du bouton de bascule de langue depuis le chemin courant.
 * Si la page n'existe pas dans la langue cible, renvoie l'accueil de cette langue.
 */
export function getSwitchTarget(pathname: string, target: Lang): string {
  const alt = getAlternates(pathname);
  if (target === 'en') return alt.en ?? '/en';
  return alt.fr ?? '/';
}
