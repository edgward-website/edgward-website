import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    image: z.string().optional(),
    author: z.string().default('Équipe Edgward'),
    category: z.enum(['Sécurité', 'Conseils', 'Entreprises', 'Communes', 'Actualités']).default('Actualités'),
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog };
