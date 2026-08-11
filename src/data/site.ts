export const site = {
  name: 'Edgward',
  legalName: 'DBA Solutions sàrl',
  url: 'https://edgward.ch',
  description: 'Sécurité à la demande en Suisse romande.',
  email: 'info@edgward.ch',
  address: {
    street: 'Rue des Bains 35',
    postalCode: '1205',
    city: 'Genève',
    country: 'CH',
  },
  social: {
    linkedin: 'https://linkedin.com/company/edgward',
    instagram: 'https://instagram.com/edgward.ch',
    facebook: 'https://www.facebook.com/people/Edgward/61556735881166',
  },
  apps: {
    appStore: 'https://apps.apple.com/ch/app/edgward/id6503622410',
    playStore: 'https://play.google.com/store/apps/details?id=ch.edgward.app.clients',
  },
  // Source unique du prix d'entrée affiché (aligné sur la home « dès CHF 15/mois »).
  pricing: {
    fromMonthly: 15,
    currency: 'CHF',
  },
  // Cantons couverts (utilisé pour areaServed dans les données structurées).
  areaServed: ['Genève', 'Vaud', 'Neuchâtel'],
} as const;
