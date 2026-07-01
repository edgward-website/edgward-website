# Soumettre un nouvel article à Google (mémo)

Petit guide pour faire indexer rapidement une nouvelle page ou un nouvel article
par Google, via la **Search Console**. Aucune compétence technique requise.

> Pourquoi ? Google finit toujours par trouver vos pages tout seul (grâce au
> sitemap), mais cela peut prendre des jours ou des semaines. Demander
> l'indexation accélère les choses, souvent à quelques heures.

---

## 1. Se connecter

1. Ouvrir la Search Console : https://search.google.com/search-console
2. En haut à gauche, vérifier que la propriété sélectionnée est bien **edgward.ch**.

(Si vous n'avez pas accès : c'est le compte Google qui gère le référencement du
site. Demandez l'accès à la personne qui a configuré la Search Console.)

---

## 2. Demander l'indexation d'une nouvelle page

1. Cliquer sur la barre **« Inspection de l'URL »** tout en haut.
2. Coller l'adresse complète de la page, par exemple :
   `https://edgward.ch/blog/surveiller-son-domicile-pendant-les-vacances`
3. Appuyer sur Entrée et attendre l'analyse (quelques secondes).
4. Cliquer sur **« Demander une indexation »**.
5. C'est tout. Google met la page en file d'attente. L'indexation prend en
   général de quelques heures à quelques jours.

> À faire **une fois** par nouvelle page/article, idéalement le jour de la
> publication.

---

## 3. Vérifier le sitemap (à faire une seule fois)

Le sitemap est la liste automatique de toutes les pages du site. Il se met à
jour tout seul à chaque publication.

1. Dans le menu de gauche, cliquer sur **« Sitemaps »**.
2. Vérifier que `sitemap-index.xml` est présent avec l'état **« Réussite »**.
3. S'il n'y est pas : dans le champ « Ajouter un sitemap », saisir
   `sitemap-index.xml` puis cliquer sur **Envoyer**.

Une fois fait, il n'y a plus rien à refaire : tout nouvel article y apparaît
automatiquement.

---

## 4. Adresse des articles de blog

Chaque article de blog a une adresse de la forme :

`https://edgward.ch/blog/NOM-DU-FICHIER`

où `NOM-DU-FICHIER` est le nom du fichier `.md` créé dans
`src/content/blog/` (en minuscules, avec des tirets, sans accent, sans date).

Exemple : le fichier `surveiller-son-domicile-pendant-les-vacances.md` donne
l'adresse `https://edgward.ch/blog/surveiller-son-domicile-pendant-les-vacances`.

---

## 5. Bonnes pratiques rapides

- **Attendre la mise en ligne** avant de demander l'indexation : la page doit
  déjà répondre (afficher correctement) sur `edgward.ch`.
- **Lier le nouvel article** depuis une page existante pertinente (par ex. depuis
  `/alertes` ou une autre page de blog). Les liens internes aident Google à
  comprendre et à mieux classer la page.
- **Un titre et une description clairs** (les champs `title` et `description` de
  l'article) : ce sont eux qui s'affichent dans les résultats Google.
- **Ne pas re-soumettre** la même page en boucle : une fois suffit. Pour vérifier
  où elle en est, réutilisez « Inspection de l'URL ».
