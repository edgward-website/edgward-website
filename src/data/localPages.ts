// Source unique des pages locales (SEO / maillage interne).
// Ajouter ici toute nouvelle page /securite-<ville> : elle apparaîtra
// automatiquement sur /edgward-en-suisse ET dans le bloc « Près de chez vous »
// de l'accueil et de la page Particuliers.

export interface LocalPage {
  name: string;
  href: string;
}

export const pagesCantons: LocalPage[] = [
  { name: 'Genève', href: '/securite-geneve' },
  { name: 'Vaud', href: '/securite-vaud' },
  { name: 'Neuchâtel', href: '/securite-neuchatel' },
];

export const pagesCommunesGE: LocalPage[] = [
  { name: 'Vernier', href: '/securite-vernier' },
  { name: 'Meyrin', href: '/securite-meyrin' },
  { name: 'Le Grand-Saconnex', href: '/securite-le-grand-saconnex' },
  { name: 'Versoix', href: '/securite-versoix' },
  { name: 'Bernex', href: '/securite-bernex' },
  { name: 'Confignon', href: '/securite-confignon' },
  { name: 'Satigny', href: '/securite-satigny' },
  { name: 'Bellevue', href: '/securite-bellevue' },
  { name: 'Perly-Certoux', href: '/securite-perly-certoux' },
  { name: 'Troinex', href: '/securite-troinex' },
  { name: 'Puplinge', href: '/securite-puplinge' },
  { name: 'Genthod', href: '/securite-genthod' },
  { name: 'Meinier', href: '/securite-meinier' },
  { name: 'Bardonnex', href: '/securite-bardonnex' },
  { name: 'Soral', href: '/securite-soral' },
  { name: 'Villages genevois', href: '/securite-villages-geneve' },
  { name: 'Carouge', href: '/securite-carouge' },
  { name: 'Lancy', href: '/securite-lancy' },
  { name: 'Onex', href: '/securite-onex' },
  { name: 'Thônex', href: '/securite-thonex' },
  { name: 'Chêne-Bougeries', href: '/securite-chene-bougeries' },
  { name: 'Chêne-Bourg', href: '/securite-chene-bourg' },
  { name: 'Veyrier', href: '/securite-veyrier' },
  { name: 'Plan-les-Ouates', href: '/securite-plan-les-ouates' },
  { name: 'Collonge-Bellerive', href: '/securite-collonge-bellerive' },
  { name: 'Cologny', href: '/securite-cologny' },
  { name: 'Vandœuvres', href: '/securite-vandoeuvres' },
  { name: 'Pregny-Chambésy', href: '/securite-pregny-chambesy' },
  { name: 'Anières', href: '/securite-anieres' },
  { name: 'Corsier', href: '/securite-corsier' },
  { name: 'Hermance', href: '/securite-hermance' },
];

export const pagesVillesVD: LocalPage[] = [
  { name: "District d'Aigle", href: '/securite-district-aigle' },
  { name: 'District de la Broye-Vully', href: '/securite-district-broye-vully' },
  { name: 'District du Gros-de-Vaud', href: '/securite-district-gros-de-vaud' },
  { name: 'District de Lavaux-Oron', href: '/securite-district-lavaux-oron' },
  { name: 'District de Morges', href: '/securite-district-morges' },
  { name: "District de l'Ouest lausannois", href: '/securite-district-ouest-lausannois' },
  { name: 'Lausanne', href: '/securite-lausanne' },
  { name: 'Nyon', href: '/securite-nyon' },
  { name: 'Coppet', href: '/securite-coppet' },
  { name: 'Gland', href: '/securite-gland' },
  { name: 'Rolle', href: '/securite-rolle' },
  { name: 'Yverdon-les-Bains', href: '/securite-yverdon' },
  { name: 'Vevey', href: '/securite-vevey' },
  { name: 'Montreux', href: '/securite-montreux' },
];

export const pagesCommunesNE: LocalPage[] = [
  { name: 'La Chaux-de-Fonds', href: '/securite-la-chaux-de-fonds' },
  { name: 'Le Locle', href: '/securite-le-locle' },
  { name: 'Val-de-Ruz', href: '/securite-val-de-ruz' },
  { name: 'Laténa', href: '/securite-latena' },
  { name: 'Val-de-Travers', href: '/securite-val-de-travers' },
  { name: 'Milvignes', href: '/securite-milvignes' },
  { name: 'La Grande Béroche', href: '/securite-la-grande-beroche' },
  { name: 'Boudry', href: '/securite-boudry' },
  { name: 'Cortaillod', href: '/securite-cortaillod' },
  { name: 'Le Landeron', href: '/securite-le-landeron' },
  { name: 'Cressier', href: '/securite-cressier' },
  { name: 'Cornaux', href: '/securite-cornaux' },
  { name: 'Rochefort', href: '/securite-rochefort' },
  { name: 'Les Ponts-de-Martel', href: '/securite-les-ponts-de-martel' },
  { name: 'La Sagne', href: '/securite-la-sagne' },
  { name: 'Lignières', href: '/securite-lignieres' },
];

// Sélection de villes/communes reconnaissables pour le bloc compact
// (accueil + Particuliers). Le lien « toute la couverture » mène au reste.
export const villesPrincipales: LocalPage[] = [
  { name: 'Lausanne', href: '/securite-lausanne' },
  { name: 'Carouge', href: '/securite-carouge' },
  { name: 'Nyon', href: '/securite-nyon' },
  { name: 'Lancy', href: '/securite-lancy' },
  { name: 'Vevey', href: '/securite-vevey' },
  { name: 'Onex', href: '/securite-onex' },
  { name: 'Montreux', href: '/securite-montreux' },
  { name: 'La Chaux-de-Fonds', href: '/securite-la-chaux-de-fonds' },
  { name: 'Yverdon-les-Bains', href: '/securite-yverdon' },
  { name: 'Le Locle', href: '/securite-le-locle' },
];

// Nombre total de pages locales (cantons + communes), pour l'affichage « X communes ».
export const totalPagesLocales =
  pagesCantons.length +
  pagesCommunesGE.length +
  pagesVillesVD.length +
  pagesCommunesNE.length;
