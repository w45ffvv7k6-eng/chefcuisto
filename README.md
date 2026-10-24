# Cuisto

Mon carnet de recettes personnel : les recettes de Maman et celles trouvées sur le web,
avec de belles photos, sur ordinateur comme sur iPhone.

> **État actuel : étape 2.** Galerie, fiches recettes avec portions ajustables, favoris
> et étoiles, 3 recettes d'exemple. L'ajout et la modification arrivent à l'étape 3.

## Comment ça marche

| Pièce | Rôle | Coût |
| --- | --- | --- |
| **GitHub Pages** | Héberge le site (l'app que tu ouvres) | Gratuit |
| **Supabase** | Garde les recettes, les photos et ton compte | Gratuit (500 Mo de données, 1 Go de photos) |
| **GitHub Actions** | Remet le site et la base à jour automatiquement à chaque modification | Gratuit |

Tes recettes ne sont lisibles qu'une fois connecté. Les photos sont accessibles par des
adresses longues impossibles à deviner (c'est ce qui permet de les garder sur le téléphone
pour le mode hors connexion).

---

## 1. Première installation (une seule fois)

### a) Créer le projet Supabase

1. Sur [supabase.com](https://supabase.com), connecte-toi avec GitHub et crée un projet
   nommé `cuisto` (région *Central EU (Zurich)* ou *Frankfurt*).
2. Dans **Authentication → Users**, clique **Add user → Create new user**, entre ton e-mail
   et un mot de passe, et coche **Auto Confirm User**. C'est ton compte pour te connecter à Cuisto.
3. Dans **Authentication → Sign In / Providers**, désactive **Allow new users to sign up**,
   pour que personne d'autre ne puisse créer de compte.

### b) Donner à GitHub les codes de Supabase

Dans ton dépôt GitHub : **Settings → Secrets and variables → Actions**.

Onglet **Variables** (valeurs non secrètes) :

| Nom | Où la trouver dans Supabase |
| --- | --- |
| `VITE_SUPABASE_URL` | Project Settings → Data API → Project URL (`https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Project Settings → API Keys → `anon` `public` |
| `SUPABASE_PROJECT_REF` | Le `xxxx` de l'adresse ci-dessus |

Onglet **Secrets** (valeur secrète, que personne ne verra) :

| Nom | Où la trouver |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) → Generate new token (commence par `sbp_`) |

### c) Activer GitHub Pages

**Settings → Pages → Source : GitHub Actions.**

### d) Lancer la mise en ligne

Onglet **Actions** du dépôt :
1. **Mettre à jour Supabase → Run workflow** (crée les tables et le stockage des photos).
2. **Publier le site → Run workflow**.

Quand les deux sont verts, l'app est en ligne à l'adresse
**https://w45ffvv7k6-eng.github.io/chefcuisto/**

> Plan B si l'étape 1 de d) échoue : dans Supabase, **SQL Editor**, colle le contenu du
> fichier `supabase/migrations/20261024000000_init.sql` et clique **Run**.

---

## 2. Ouvrir Cuisto sur l'iPhone

1. Ouvre **https://w45ffvv7k6-eng.github.io/chefcuisto/** dans **Safari**.
2. Touche le bouton **Partager** (carré avec une flèche), puis **Sur l'écran d'accueil**.
3. Ouvre Cuisto depuis l'icône : l'app s'affiche en plein écran, comme une vraie application.
4. Connecte-toi avec l'e-mail et le mot de passe créés dans Supabase. Tu restes connecté ensuite.

Sur l'ordinateur, il suffit d'ouvrir la même adresse dans le navigateur (Chrome et Edge
proposent aussi « Installer l'application » dans la barre d'adresse).

---

## 3. Lancer l'app sur ton ordinateur (facultatif, pour la modifier)

Il faut [Node.js](https://nodejs.org) version 22 ou plus.

```bash
npm install                 # une seule fois
cp .env.example .env.local  # puis remplis les deux valeurs Supabase
npm run dev                 # ouvre http://localhost:5173/chefcuisto/
```

Autres commandes : `npm test` (tests), `npm run build` (version finale dans `dist/`).

---

## 4. Sauvegarder mes recettes

Un bouton « Tout télécharger » (recettes + photos dans un fichier zip) arrivera dans les
Réglages. En attendant, Supabase garde tes données ; tu peux les consulter dans
**Table Editor** et les exporter en CSV.

**À savoir :** un projet Supabase gratuit qui n'est pas utilisé pendant 7 jours est mis en
pause. Rien n'est perdu : dans le tableau de bord Supabase, clique **Restore project**.

---

## Organisation du code

```
src/
  App.tsx            écrans et navigation
  pages/             un fichier par écran (Connexion, Accueil, Réglages…)
  components/        morceaux d'interface réutilisables
  lib/types.ts       le modèle de données (Recette, Ingrédient, Étape, Photo)
  lib/supabase.ts    connexion à Supabase
  styles.css         couleurs, polices, mode clair et sombre
supabase/
  migrations/        structure de la base de données
.github/workflows/   mise en ligne automatique
```

## Crédits des photos d'exemple

Photos venant de [Wikimedia Commons](https://commons.wikimedia.org), sous licence libre :
- Tarte aux pommes : Manuel Flury, CC BY 2.5 ; part avec chantilly : Randalfino, CC BY 2.0
- Gratin dauphinois : Ludovic Péron, CC BY-SA 3.0
- Gratin de courge butternut : DocteurCosmos, CC BY 3.0
