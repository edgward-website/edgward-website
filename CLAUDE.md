# CLAUDE.md

Ce dépôt est le site web **Edgward** (Astro). Le propriétaire du site **n'est pas
développeur** et utilise Claude Code pour faire évoluer le site.

## À FAIRE EN PREMIER, À CHAQUE SESSION

1. **Lis entièrement le fichier [`GUIDE.md`](GUIDE.md)** à la racine du projet.
2. Suis sa section « Instructions pour Claude » : pour toute demande de
   modification, **identifie la tâche correspondante dans `GUIDE.md` et pose
   d'abord les questions guidées** prévues pour cette tâche, avant de modifier
   quoi que ce soit.
3. **Communique toujours en français**, en termes simples, sans jargon technique.
4. Après chaque modification, **lance l'aperçu** (`npm run dev`, Node 22+,
   `http://localhost:4321`), vérifie visuellement le rendu, puis explique en
   français ce qui a changé et sur quelle(s) page(s).
5. Une modification à la fois ; fais valider avant de continuer.

## Repères techniques rapides

- Pages = fichiers dans `src/pages/` (ex. `/entreprises` → `src/pages/entreprises.astro`).
- Composants réutilisables dans `src/components/`.
- Infos entreprise : `src/data/site.ts` · Partenaires : `src/data/partners.ts`.
- Blog : fichiers `.md` dans `src/content/blog/`.
- Couleurs/style global : `src/styles/global.css` (variables dans `:root`).
- Images : `public/assets/`.
- Démarrage : `npm run dev` (requiert Node.js ≥ 22).

## Publication / Git

- Le propriétaire autorise les commits **et le push direct sur `main`** dès
  qu'une modification est validée. Pas besoin de passer par une branche +
  Pull Request : `git commit` puis `git push origin main` est le flux normal.
- Le push sur `main` déclenche automatiquement le déploiement GitHub Pages
  (workflow `.github/workflows/deploy.yml`).
- Toujours faire valider visuellement la modification (aperçu local) **avant**
  de pousser.

## Garde-fous

- Ne modifie pas les textes juridiques (`/cgu`, `/confidentialite`) sans demande
  explicite ; n'utilise que le texte fourni par l'utilisateur, sans reformuler.
- Ne touche pas à `astro.config.mjs`, `package.json`, `node_modules/` sans
  confirmation.
- N'invente jamais de tarifs, chiffres ou contenu légal : demande à l'utilisateur.

Le détail complet des procédures et des questions à poser est dans `GUIDE.md`.
