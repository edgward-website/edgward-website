// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://edgward.ch',
  integrations: [sitemap()],
  redirects: {
    '/newsfeed': '/alertes',
    '/media': '/medias',
    '/contact': '/faq',
    '/tarifs': '/particuliers',
    '/actualites': '/blog',
    '/mentions-legales': '/cgu',
    // Anciennes URL de l'ancien site (404 remontés par Search Console, juillet 2026)
    '/index.php': '/',
    '/conditions-generales': '/cgu',
    '/commercants': '/entreprises',
    '/privacy-policy': '/confidentialite',
    '/app-agents/privacy-policy': '/confidentialite',
    '/app-client/privacy-policy': '/confidentialite',
  },
});