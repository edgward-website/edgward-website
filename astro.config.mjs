// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://edgward.ch',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/mentions-legales'),
    }),
  ],
  redirects: {
    '/newsfeed': '/alertes',
    '/media': '/medias',
    '/contact': '/faq',
    '/tarifs': '/particuliers',
    '/actualites': '/blog',
  },
});