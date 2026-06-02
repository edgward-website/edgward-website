// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';

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
  },

  adapter: cloudflare(),
});