# Compta Manager

Application web (mobile + desktop) pour suivre la comptabilité de tes activités : cours particuliers, indemnités vélo et études.

## Stack

- **Frontend** : React 18 + Vite + React Router + Tailwind CSS
- **Données** : Firebase Firestore (temps réel)
- **Auth** : Firebase Authentication anonyme, protégée par un écran PIN à 4 chiffres
- **Hébergement** : Vercel
- **Code** : GitHub

## Architecture du projet

```
compta-manager/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json              → redirige toutes les routes vers index.html (SPA)
├── firestore.rules          → règles de sécurité à coller dans la console Firebase
├── .env.example              → variables d'environnement à copier en .env
└── src/
    ├── main.jsx              → point d'entrée, monte le Router + PinProvider
    ├── App.jsx                → routes principales + écran de verrouillage
    ├── index.css              → styles globaux (Tailwind)
    ├── firebase/
    │   └── config.js          → initialisation Firebase (Firestore + Auth)
    ├── context/
    │   └── PinContext.jsx     → état "verrouillé / déverrouillé" + auth anonyme
    ├── hooks/
    │   ├── useFirestoreCollection.js   → hook générique de lecture temps réel
    │   ├── useCoursParticuliers.js
    │   ├── useVelo.js
    │   ├── useEtudes.js
    │   └── useComptabilite.js          → agrège les 3 sources pour le dashboard
    ├── utils/
    │   ├── format.js          → formatage € et dates
    │   ├── dates.js           → clés de mois, génération de dates récurrentes
    │   └── hash.js            → hash SHA-256 (vérification du PIN)
    ├── components/
    │   ├── PinLock.jsx        → écran de saisie du PIN
    │   ├── ui/                → composants génériques (Button, Card, Modal, StatCard…)
    │   ├── layout/             → AppShell, barre de navigation (mobile + desktop)
    │   ├── cours/               → formulaires et liste "Cours particuliers"
    │   ├── velo/                → formulaires et liste "Vélo"
    │   ├── etudes/               → formulaires et liste "Études"
    │   └── accueil/              → composants du tableau de bord
    └── views/
        ├── AccueilView.jsx
        ├── CoursParticuliersView.jsx
        ├── VeloView.jsx
        └── EtudesView.jsx
```

Cette organisation (un dossier par fonctionnalité dans `components/`, un `views/` pour les pages, un `hooks/` par domaine de données) est pensée pour qu'on puisse ajouter facilement un nouvel onglet plus tard (ex. "Frais professionnels") sans toucher au reste.

## Modèle de données Firestore

| Collection / doc | Champs |
|---|---|
| `cours` | `eleve`, `prix`, `duree`, `date`, `paye`, `createdAt` |
| `config/velo` (doc unique) | `prixKm`, `distanceKm` |
| `veloEntries` (id = `"YYYY-MM"`) | `mois`, `allersRetours`, `distanceKm`, `prixKm`, `montant`, `paye` |
| `config/etudes` (doc unique) | `prixEtude` |
| `etudesEntries` (id = `"YYYY-MM"`) | `mois`, `nombre`, `prixUnitaire`, `montant`, `paye` |

Pour vélo et études, un seul document par mois (l'id du document est le mois lui-même) : ré-enregistrer un mois met simplement à jour le document existant.

## 1. Créer le projet Firebase

1. Va sur [console.firebase.google.com](https://console.firebase.google.com) → **Ajouter un projet**.
2. Une fois le projet créé, **Firestore Database** → **Créer une base de données** → mode production → choisis une région proche (ex. `eur3`).
3. **Authentication** → **Sign-in method** → active le fournisseur **Anonyme**.
4. **Paramètres du projet** (icône ⚙️) → **Général** → section "Vos applications" → **Ajouter une application** → Web (`</>`). Donne-lui un nom, pas besoin de Firebase Hosting.
5. Copie les valeurs affichées (`apiKey`, `authDomain`, `projectId`, etc.) : elles vont dans le `.env`.
6. Dans **Firestore Database → Règles**, colle le contenu du fichier `firestore.rules` de ce projet, puis **Publier**.

## 2. Configurer le PIN

Le code ne stocke jamais ton PIN en clair : seul son **hash SHA-256** est présent dans le code (variable `VITE_PIN_HASH`).

Pour générer le hash de ton propre PIN (remplace `1234`), lance dans un terminal :

```bash
node -e "console.log(require('crypto').createHash('sha256').update('1234').digest('hex'))"
```

Colle le résultat dans `VITE_PIN_HASH`.

> ⚠️ **Important sur la sécurité** : ce PIN protège l'affichage de l'application (personne ne peut voir tes données sans le connaître), et les règles Firestore bloquent tout accès qui ne passe pas par une session Firebase authentifiée. Ce n'est cependant pas une authentification "forte" comme un email/mot de passe — évite de partager le lien du site publiquement. Si tu veux plus tard passer à une vraie connexion (email + mot de passe), c'est une évolution simple à demander.

## 3. Configuration locale

```bash
npm install
cp .env.example .env
# remplis .env avec tes valeurs Firebase + ton hash de PIN
npm run dev
```

Le PIN par défaut dans `.env.example` est **1234** — change-le avant de déployer en ligne.

## 4. GitHub

```bash
git init
git add .
git commit -m "Premier commit : Compta Manager"
git branch -M main
git remote add origin https://github.com/<ton-utilisateur>/<ton-repo>.git
git push -u origin main
```

(Ou : crée le repo vide sur GitHub, télécharge le zip fourni, dézippe-le dans le dossier du repo, puis fais les commandes ci-dessus sans `git init` si le repo a déjà été cloné.)

## 5. Déploiement Vercel

1. Sur [vercel.com](https://vercel.com) → **Add New → Project** → importe ton repo GitHub.
2. Vercel détecte automatiquement Vite (`npm run build`, dossier de sortie `dist`).
3. Dans **Environment Variables**, ajoute toutes les variables de ton `.env` (les 6 `VITE_FIREBASE_*` + `VITE_PIN_HASH`).
4. **Deploy**.

À chaque `git push` sur `main`, Vercel redéploie automatiquement.

## Pour la suite

Pour chaque nouvelle fonctionnalité, je te donnerai le(s) fichier(s) complet(s) à remplacer avec leur chemin exact (ex. `src/views/AccueilView.jsx`), comme convenu : tu n'auras qu'à ouvrir le fichier dans GitHub, tout sélectionner, et coller le nouveau contenu.
