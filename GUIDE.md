# Guide de modification du site Edgward

Ce guide explique comment modifier le site Edgward **sans connaissances techniques**.
Il s'adresse à deux lecteurs :

- **Vous** (le propriétaire du site) : pour comprendre ce qui est possible.
- **Claude Code** (l'assistant) : pour vous guider pas à pas en posant les bonnes questions.

---

## 🔴 Instructions pour Claude (à lire AVANT toute modification)

Quand l'utilisateur demande une modification :

1. **Identifie la tâche** parmi la liste « Tâches courantes » ci-dessous.
2. **Pose d'abord les questions guidées** prévues pour cette tâche. Ne commence à
   modifier le code **qu'une fois toutes les réponses obtenues**. Pose les questions
   une par une ou en petit groupe, simplement, sans jargon technique.
3. Si la demande ne correspond à aucune tâche listée, pose des questions pour la
   clarifier, puis traite-la en t'inspirant de la tâche la plus proche.
4. **Après la modification**, lance toujours l'aperçu (voir « Voir le site en
   direct »), vérifie visuellement le résultat, et décris à l'utilisateur ce qui a
   changé et sur quelle(s) page(s).
5. **Parle toujours en français** avec l'utilisateur, en termes simples.
6. **Ne touche jamais** sans confirmation explicite : aux fichiers de configuration
   (`astro.config.mjs`, `package.json`), au dossier `node_modules/`, ni aux textes
   juridiques (`/cgu`, `/confidentialite`) — voir tâche 9.
7. En cas de doute sur l'emplacement d'un texte, **demande à l'utilisateur sur
   quelle page** il l'a vu (donne l'adresse, ex. « la page d'accueil » ou
   « /entreprises »).
8. Ne modifie qu'une chose à la fois. Confirme que c'est bon avant de passer à la suite.

---

## Comment fonctionne le site (vue d'ensemble simple)

- Le site est construit avec **Astro**. Chaque page du site est **un fichier** dans
  le dossier `src/pages/`.
  - Exemple : la page `https://edgward.ch/entreprises` = le fichier
    `src/pages/entreprises.astro`.
  - La page d'accueil = `src/pages/index.astro`.
- Les **morceaux réutilisables** (en-tête, pied de page, blocs d'avantages, etc.)
  sont dans `src/components/`.
- Les **informations de l'entreprise** (email, adresse, réseaux sociaux) sont dans
  `src/data/site.ts`.
- La **liste des partenaires** est dans `src/data/partners.ts`.
- Les **articles de blog** sont des fichiers texte dans `src/content/blog/`.
- Les **couleurs et le style général** sont dans `src/styles/global.css`.
- Les **images** sont dans le dossier `public/assets/`.

### Voir le site en direct (aperçu)

Avant et après chaque modification, on lance un aperçu local :

```bash
npm run dev
```

> ⚠️ Le site nécessite **Node.js version 22 ou plus récente**. Si une erreur
> « Node.js is not supported » apparaît, il faut utiliser Node 22
> (`nvm use 22` si `nvm` est installé).

L'aperçu s'ouvre sur `http://localhost:4321`. Les changements apparaissent
automatiquement. **Claude doit utiliser l'outil d'aperçu pour vérifier le rendu
après chaque modification.**

---

## Tâches courantes

### 1. Modifier un texte existant

**Questions à poser à l'utilisateur :**
1. Sur quelle page se trouve le texte ? (donner l'adresse ou le nom de la page)
2. Quel est le texte **actuel**, mot pour mot (ou un extrait reconnaissable) ?
3. Quel est le **nouveau** texte souhaité ?
4. S'agit-il d'un titre, d'un bouton, d'un paragraphe ? (pour garder le bon style)

**Comment Claude procède :**
- Ouvrir le fichier de la page concernée dans `src/pages/`.
- Chercher le texte actuel et le remplacer par le nouveau.
- Conserver la mise en forme existante (les balises autour du texte).
- Astuce : un mot en italique élégant s'écrit `<em>mot</em>` dans les titres.
- Lancer l'aperçu et vérifier.

---

### 2. Ajouter une nouvelle section à une page existante

**Questions à poser à l'utilisateur :**
1. Sur quelle page ajouter la section ?
2. Où dans la page ? (en haut, en bas, après telle section existante)
3. Quel **type** de section ? Proposer les modèles disponibles :
   - Un titre + texte d'introduction (`SectionHeader`)
   - Une grille d'avantages avec icônes (`BenefitsGrid`)
   - Des étapes numérotées 1‑2‑3 (`Steps`)
   - Des témoignages clients (`Testimonials`)
   - Une foire aux questions (`FAQAccordion`)
   - Un bloc d'appel à l'action / téléchargement (`FinalCTA`)
   - Une grille tarifaire (`PricingCard`)
   - Un formulaire de contact (`ContactForm`)
4. Le contenu exact de la section (titres, textes, éléments de liste…).

**Comment Claude procède :**
- Regarder comment une autre page utilise déjà ce composant (pour copier le bon
  format) et réutiliser le composant existant dans `src/components/`.
- Insérer la nouvelle section à l'endroit demandé, en respectant la structure
  `<section> … </section>` des sections voisines.
- Vérifier que le composant est bien importé en haut du fichier (`import …`).
- Lancer l'aperçu et vérifier.

---

### 3. Créer une nouvelle page (à partir d'un modèle existant)

**Toujours partir d'une page existante comme modèle** — c'est plus sûr et plus
rapide que de partir de zéro.

**Questions à poser à l'utilisateur :**
1. **Quelle page existante doit servir de modèle ?** Présenter le tableau
   « Modèles de pages » en bas de ce guide et laisser l'utilisateur choisir.
2. Quelle sera l'**adresse** de la nouvelle page ? (ex. `/nouvelle-offre` →
   fichier `src/pages/nouvelle-offre.astro`)
3. Quel **titre** doit apparaître dans l'onglet du navigateur et sur Google ?
4. Quelle **description** courte (1 phrase, pour Google) ?
5. Quel est le **contenu** de chaque section (on peut y aller section par section) ?
6. Faut-il **ajouter cette page au menu** de navigation ? (voir tâche 4)

**Comment Claude procède :**
- Copier le fichier modèle choisi dans `src/pages/` sous le nouveau nom.
- Mettre à jour le `title` et la `description` dans la balise `<Base …>`.
- Remplacer les textes et sections par le contenu fourni par l'utilisateur,
  section par section.
- Si demandé, ajouter l'entrée au menu (tâche 4) **et** au pied de page si pertinent.
- Lancer l'aperçu sur la nouvelle adresse et vérifier.

---

### 4. Modifier le menu de navigation

Le menu apparaît en haut de **toutes** les pages.

**Questions à poser à l'utilisateur :**
1. Voulez-vous **ajouter**, **renommer**, **réorganiser** ou **supprimer** une entrée ?
2. Pour un ajout : quel **libellé** affiché et vers quelle **page** (adresse) ?
3. À quelle **position** dans le menu ?
4. Faut-il aussi mettre à jour le **pied de page** (footer) en bas du site ?

**Comment Claude procède :**
- Modifier la liste `links` dans `src/components/Nav.astro`.
- Si demandé, synchroniser aussi les liens dans `src/components/Footer.astro`
  (le pied de page est édité séparément).
- Lancer l'aperçu et vérifier le menu sur ordinateur **et** en version mobile
  (le menu « burger »).

---

### 5. Modifier les coordonnées ou infos de l'entreprise

(email, adresse, liens réseaux sociaux, liens des applications mobiles)

**Questions à poser à l'utilisateur :**
1. Quelle information changer exactement ? (email ? adresse ? LinkedIn ? etc.)
2. Quelle est la nouvelle valeur ?

**Comment Claude procède :**
- Modifier `src/data/site.ts` (un seul fichier centralise email, adresse,
  réseaux sociaux, liens App Store / Google Play).
- Ces informations sont utilisées automatiquement à plusieurs endroits du site.
- Lancer l'aperçu et vérifier le pied de page.

---

### 6. Ajouter ou modifier un partenaire

**Questions à poser à l'utilisateur :**
1. Ajout, modification ou suppression d'un partenaire ?
2. Pour un ajout : **nom** de l'entreprise et **fichier logo** (image).
3. Avez-vous le fichier du logo ? (sinon, le partenaire peut s'afficher sans logo)

**Comment Claude procède :**
- Si un logo est fourni : le placer dans `public/assets/partners/`.
- Ajouter / modifier l'entrée dans `src/data/partners.ts`
  (format : `{ name: 'Nom', logo: '/assets/partners/fichier.png' }`).
- Lancer l'aperçu et vérifier la grille des partenaires.

---

### 7. Ajouter ou modifier un article de blog

**Questions à poser à l'utilisateur :**
1. Nouvel article ou modification d'un article existant ?
2. **Titre** de l'article ?
3. **Description** courte (1‑2 phrases) ?
4. **Catégorie** ? (au choix : Sécurité, Conseils, Entreprises, Communes, Actualités)
5. **Date** de publication ?
6. Une **image** de couverture ? (optionnel)
7. Le **contenu** complet de l'article ?

**Comment Claude procède :**
- Créer un fichier `.md` dans `src/content/blog/`. Le nom du fichier devient
  l'adresse : `mon-article.md` → `/blog/mon-article`.
- Remplir l'en-tête (frontmatter) obligatoire :
  ```
  ---
  title: "..."
  date: 2026-01-15
  description: "..."
  category: "Conseils"
  image: "/assets/..."   # optionnel
  ---
  ```
- Rédiger le contenu en dessous (texte simple, titres avec `##`, listes avec `-`).
- Lancer l'aperçu sur `/blog` puis sur l'article, et vérifier.

---

### 8. Changer une image

**Questions à poser à l'utilisateur :**
1. Sur quelle page et à quel endroit se trouve l'image ?
2. Avez-vous le nouveau fichier image ? Sous quel nom ?

**Comment Claude procède :**
- Placer la nouvelle image dans `public/assets/`.
- Repérer dans le fichier de la page la balise `<img src="/assets/…">` concernée
  et mettre à jour le chemin.
- Garder un texte alternatif (`alt`) descriptif si l'image est informative.
- Lancer l'aperçu et vérifier.

---

### 9. Modifier les pages légales (CGU / Confidentialité)

⚠️ **Ce sont des documents juridiques.** Claude ne doit modifier ces pages que si
l'utilisateur le demande explicitement, et uniquement avec le texte fourni par
l'utilisateur — **sans reformuler ni résumer**.

**Questions à poser à l'utilisateur :**
1. Quelle page : Conditions générales (`/cgu`) ou Confidentialité (`/confidentialite`) ?
2. Le texte de remplacement (ou le document source) est-il fourni ?
3. Faut-il mettre à jour la **date de mise à jour** affichée en haut de la page ?

**Comment Claude procède :**
- Reproduire fidèlement la structure : chapitres en `<h2>`, articles en `<h3>`,
  paragraphes en `<p>`, listes en `<ul><li>`.
- Mettre à jour la variable `lastUpdated` en haut du fichier si demandé.
- Ne pas modifier le style (la mise en page est déjà définie).
- Lancer l'aperçu et vérifier que tout le texte est présent.

---

### 10. Modifier les couleurs ou le style général

**Questions à poser à l'utilisateur :**
1. Quel élément change : couleur principale, fond, texte… ?
2. Sur tout le site ou seulement une page ?
3. Quelle nouvelle couleur (code couleur, ex. `#4678DC`, ou description) ?

**Comment Claude procède :**
- Pour un changement **global** : modifier les variables dans `:root` au début de
  `src/styles/global.css` (ex. `--brand` = couleur principale, `--navy` = fond
  sombre des en-têtes).
- Prévenir l'utilisateur qu'un changement de couleur globale affecte **tout le site**.
- Lancer l'aperçu et vérifier plusieurs pages.

---

## Règles d'or

- ✅ **Toujours lancer l'aperçu** et vérifier visuellement avant de dire « c'est fait ».
- ✅ Faire **une modification à la fois** et la valider avec l'utilisateur.
- ✅ **S'inspirer de l'existant** : copier le format d'une page/section qui marche déjà.
- ⛔ Ne pas inventer de contenu juridique, de tarifs ou de chiffres : demander à l'utilisateur.
- ⛔ Ne pas modifier `astro.config.mjs`, `package.json` ou `node_modules/` sans raison claire et confirmation.
- 💾 Après validation, on peut enregistrer les changements avec Git
  (« commit ») — demander à l'utilisateur s'il souhaite que ce soit publié.

---

## Modèles de pages disponibles (pour cloner — tâche 3)

| Page modèle (fichier) | Adresse | Idéale pour cloner si vous voulez… |
|---|---|---|
| `index.astro` | `/` | Une page d'accueil riche (héro + choix de public + sections multiples). |
| `particuliers.astro` | `/particuliers` | Une page « offre » orientée grand public (avantages, témoignages, appel à l'action). |
| `entreprises.astro` | `/entreprises` | Une page commerciale B2B (cas d'usage, tarifs, formulaire de contact). |
| `communes.astro` | `/communes` | Une page partenariat / institutionnel (étapes, avantages, FAQ, contact). |
| `partenaires.astro` | `/partenaires` | Une page avec logos partenaires + arguments de confiance. |
| `alertes.astro` | `/alertes` | Une page produit/fonctionnalité (problème → solution → bénéfices). |
| `sccl.astro` | `/sccl` | Une page dédiée à un segment/client précis (offre ciblée + tarifs). |
| `medias.astro` | `/medias` | Une page liste (presse, ressources) avec des cartes. |
| `faq.astro` | `/faq` | Une page de questions‑réponses par catégorie. |
| `cgu.astro` | `/cgu` | Une page de texte long structuré (mentions, conditions, règlement). |

> Pour choisir : demandez-vous « quelle page existante ressemble le plus à ce que
> je veux ? » et clonez celle-là. Claude adaptera ensuite le contenu.
